import Stripe from 'npm:stripe@^14.0.0'
import { createClient } from 'npm:@supabase/supabase-js@^2.0.0'


export const handler = async (req: Request) => {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '')
    const origin = req.headers.get('Origin')

    // ALLOWED_ORIGINS: comma-separated list of allowed origins (e.g. "https://mathwithmagic.com,https://staging.mathwithmagic.com")
    const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') || '').split(',').map(o => o.trim()).filter(Boolean)
    const corsOrigin = (origin && allowedOrigins.includes(origin)) ? origin : allowedOrigins[0] || ''

    const headers = {
        'Access-Control-Allow-Origin': corsOrigin,
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
    }

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers })
    }

    try {
        const body = await req.json()
        const contentPackId = body?.contentPackId

        if (!contentPackId || typeof contentPackId !== 'string') {
            return new Response(JSON.stringify({ error: 'Missing or invalid contentPackId' }), {
                status: 400,
                headers: { ...headers, 'Content-Type': 'application/json' },
            })
        }

        // Get user from token using Admin Client for better reliability in Edge Functions
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            console.error('Missing Authorization header')
            return new Response(JSON.stringify({ error: 'Missing Authorization header' }), { status: 401, headers: { ...headers, 'Content-Type': 'application/json' } })
        }

        const jwt = authHeader.replace('Bearer ', '')
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
        )

        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(jwt)
        if (authError || !user) {
            console.error('Auth verification failed:', authError?.message || 'No user returned')
            return new Response(
                JSON.stringify({
                    error: 'Unauthorized',
                }),
                { status: 401, headers: { ...headers, 'Content-Type': 'application/json' } }
            )
        }

        console.log('Authorized user:', user.id)

        // 1. Strict Validation
        if (!user.email) {
            return new Response(JSON.stringify({ error: 'Account with a valid email is required for purchases' }), {
                status: 400,
                headers: { ...headers, 'Content-Type': 'application/json' },
            })
        }

        if (user.is_anonymous) {
            return new Response(JSON.stringify({ error: 'Anonymous accounts cannot make purchases. Please register your account first.' }), {
                status: 400,
                headers: { ...headers, 'Content-Type': 'application/json' },
            })
        }

        // Profile ID matches User ID. We can check existence if we want to be pedantic, 
        // but for now we will trust the 1:1 relationship or let FKs fail.
        // For flow compatibility, we treat profile as just an object with an ID.
        const profile = { id: user.id };

        // 2. Check for existing entitlement FIRST
        const { data: existingEntitlement, error: entitlementError } = await supabaseAdmin
            .from('player_entitlements')
            .select('id')
            .eq('player_id', profile.id)
            .eq('content_pack_id', contentPackId)
            .maybeSingle()

        if (entitlementError) {
            console.error('Error checking entitlement:', entitlementError)
            throw new Error('Database error during entitlement check')
        }

        if (existingEntitlement) {
            return new Response(JSON.stringify({ alreadyOwned: true }), {
                status: 200,
                headers: { ...headers, 'Content-Type': 'application/json' },
            })
        }

        // 3. Get content pack price from DB
        const { data: pack, error: packError } = await supabaseAdmin
            .from('content_pack_prices')
            .select('amount_cents, currency')
            .eq('content_pack_id', contentPackId)
            .eq('currency', 'SEK') // Default to SEK for now
            .single()

        if (packError || !pack) {
            return new Response(JSON.stringify({ error: 'Content pack price not found' }), {
                status: 404,
                headers: { ...headers, 'Content-Type': 'application/json' },
            })
        }

        const displayPrice = `${pack.amount_cents / 100} ${pack.currency}`

        // 4. Check for existing PENDING purchase intent
        const { data: existingIntent, error: intentError } = await supabaseAdmin
            .from('purchase_intents')
            .select('id, stripe_payment_intent_id, created_at')
            .eq('player_id', profile.id)
            .eq('content_pack_id', contentPackId)
            .eq('status', 'pending')
            .maybeSingle()

        if (intentError) {
            console.error('Error fetching existing intent:', intentError)
        }

        if (existingIntent) {
            const createdDate = new Date(existingIntent.created_at)
            const now = new Date()
            const diffHours = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60)

            if (diffHours < 24) {
                console.log('Fetching status of existing intent:', existingIntent.stripe_payment_intent_id)
                const intent = await stripe.paymentIntents.retrieve(existingIntent.stripe_payment_intent_id)

                if (intent.status === 'succeeded') {
                    // The webhook might have failed, but Stripe got the money. Self-heal.
                    await supabaseAdmin.from('purchase_intents')
                        .update({ status: 'succeeded', updated_at: new Date().toISOString() })
                        .eq('id', existingIntent.id)

                    await supabaseAdmin.from('player_entitlements')
                        .upsert({
                            player_id: profile.id,
                            content_pack_id: contentPackId,
                            purchase_intent_id: existingIntent.id,
                        }, { onConflict: 'player_id, content_pack_id' })

                    return new Response(JSON.stringify({ alreadyOwned: true }), {
                        status: 200,
                        headers: { ...headers, 'Content-Type': 'application/json' },
                    })
                }

                if (intent.status === 'canceled') {
                    // Update DB and fall through to create a new intent
                    await supabaseAdmin.from('purchase_intents')
                        .update({ status: 'canceled', updated_at: new Date().toISOString() })
                        .eq('id', existingIntent.id)
                } else {
                    console.log('Reusing existing pending intent:', existingIntent.stripe_payment_intent_id)
                    return new Response(
                        JSON.stringify({ clientSecret: intent.client_secret, displayPrice }),
                        { headers: { ...headers, 'Content-Type': 'application/json' } }
                    )
                }
            } else {
                // Mark as abandoned if too old
                await supabaseAdmin
                    .from('purchase_intents')
                    .update({ status: 'abandoned' })
                    .eq('id', existingIntent.id)
            }
        }

        // 5. Create new Stripe PaymentIntent
        const paymentIntent = await stripe.paymentIntents.create({
            amount: pack.amount_cents,
            currency: pack.currency.toLowerCase(),
            automatic_payment_methods: {
                enabled: true,
            },
            description: 'Math with Magic — Premium Access',
            receipt_email: user.email,
            metadata: {
                playerId: profile.id,
                contentPackId: contentPackId,
            },
        })

        // 6. Record the new intent in our DB
        const { error: insertError } = await supabaseAdmin
            .from('purchase_intents')
            .insert({
                player_id: profile.id,
                content_pack_id: contentPackId,
                stripe_payment_intent_id: paymentIntent.id,
                status: 'pending',
                metadata: {
                    stripe_client_secret: paymentIntent.client_secret,
                }
            })

        if (insertError) {
            console.error('Failed to record purchase intent:', insertError)
            // We don't throw here as the Stripe intent is already created, 
            // but it's a critical telemetry/safety failure.
        }

        console.log('Created and recorded Payment Intent:', paymentIntent.id)

        return new Response(
            JSON.stringify({ clientSecret: paymentIntent.client_secret, displayPrice }),
            { headers: { ...headers, 'Content-Type': 'application/json' } }
        )
    } catch (err: unknown) {
        const error = err as Error;
        console.error('Error creating payment intent:', error)
        return new Response(JSON.stringify({ error: 'An internal error occurred. Please try again.' }), {
            status: 500,
            headers: { ...headers, 'Content-Type': 'application/json' },
        })
    }
}

if (import.meta.main) {
    Deno.serve(handler)
}
