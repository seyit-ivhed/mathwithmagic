import Stripe from 'npm:stripe@^14.0.0'
import { createClient, SupabaseClient } from 'npm:@supabase/supabase-js@^2.0.0'


export const verifyAndGrantEntitlement = async (
    stripe: Stripe,
    supabaseAdmin: SupabaseClient,
    playerId: string,
    contentPackId: string,
): Promise<{ verified: boolean; status?: string }> => {
    // 1. Find the most recent pending purchase intent for this player + content pack
    const { data: pendingIntent, error: intentError } = await supabaseAdmin
        .from('purchase_intents')
        .select('id, stripe_payment_intent_id')
        .eq('player_id', playerId)
        .eq('content_pack_id', contentPackId)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

    if (intentError) {
        console.error('Error fetching purchase intent:', intentError)
        throw new Error('Database error during intent lookup')
    }

    if (!pendingIntent) {
        // No pending intent — check if entitlement already exists (race condition with webhook)
        const { data: existingEntitlement } = await supabaseAdmin
            .from('player_entitlements')
            .select('id')
            .eq('player_id', playerId)
            .eq('content_pack_id', contentPackId)
            .maybeSingle()

        if (existingEntitlement) {
            return { verified: true }
        }

        return { verified: false, status: 'no_pending_intent' }
    }

    // 2. Check payment status with Stripe
    const intent = await stripe.paymentIntents.retrieve(pendingIntent.stripe_payment_intent_id)

    if (intent.status === 'succeeded') {
        // 3. Self-heal: grant entitlement since Stripe confirms payment
        const { error: updateError } = await supabaseAdmin.from('purchase_intents')
            .update({ status: 'succeeded', updated_at: new Date().toISOString() })
            .eq('id', pendingIntent.id)

        if (updateError) {
            console.error('Error updating purchase intent status:', updateError)
        }

        const { error: entitlementError } = await supabaseAdmin.from('player_entitlements')
            .upsert({
                player_id: playerId,
                content_pack_id: contentPackId,
                purchase_intent_id: pendingIntent.id,
            }, { onConflict: 'player_id, content_pack_id' })

        if (entitlementError) {
            console.error('Error granting entitlement during self-heal:', entitlementError)
            throw new Error('Database error during entitlement grant')
        }

        console.log(`SELF-HEAL: Entitlement granted for Player ${playerId} (Pack: ${contentPackId})`)
        return { verified: true }
    }

    return { verified: false, status: intent.status }
}


export const handler = async (req: Request) => {
    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '')
    const origin = req.headers.get('Origin')

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

        // Authenticate user
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
                status: 401,
                headers: { ...headers, 'Content-Type': 'application/json' },
            })
        }

        const jwt = authHeader.replace('Bearer ', '')
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
        )

        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(jwt)
        if (authError || !user) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
                status: 401,
                headers: { ...headers, 'Content-Type': 'application/json' },
            })
        }

        const result = await verifyAndGrantEntitlement(stripe, supabaseAdmin, user.id, contentPackId)

        return new Response(JSON.stringify(result), {
            headers: { ...headers, 'Content-Type': 'application/json' },
        })
    } catch (err: unknown) {
        const error = err as Error;
        console.error('Error verifying payment:', error)
        return new Response(JSON.stringify({ error: 'An internal error occurred. Please try again.' }), {
            status: 500,
            headers: { ...headers, 'Content-Type': 'application/json' },
        })
    }
}

if (import.meta.main) {
    Deno.serve(handler)
}
