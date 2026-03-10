import { createClient } from 'npm:@supabase/supabase-js@^2.0.0'

export const createHandler = (fetchImpl?: typeof globalThis.fetch) => async (req: Request) => {
    const origin = req.headers.get('Origin')
    const productionUrl = Deno.env.get('CLIENT_URL')

    // Dynamic CORS origin check
    let corsOrigin = productionUrl || ''
    if (origin && (origin.startsWith('http://localhost:') || origin === 'http://localhost')) {
        corsOrigin = origin
    }

    const headers = {
        'Access-Control-Allow-Origin': corsOrigin,
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
    }

    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers })
    }

    try {
        const authHeader = req.headers.get('Authorization')
        if (!authHeader) {
            console.error('Missing Authorization header')
            return new Response(
                JSON.stringify({ error: 'Missing Authorization header' }),
                { status: 401, headers: { ...headers, 'Content-Type': 'application/json' } }
            )
        }

        const body = await req.json().catch(() => ({})) as { password?: string }
        const password = body.password
        if (!password) {
            return new Response(
                JSON.stringify({ error: 'Password is required' }),
                { status: 400, headers: { ...headers, 'Content-Type': 'application/json' } }
            )
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
        const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        const _fetch = fetchImpl ?? globalThis.fetch

        const jwt = authHeader.replace('Bearer ', '')

        // Verify the JWT using the user-scoped auth client. global.fetch is injected
        // here so the same fetch implementation is used in tests.
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
            auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
            global: { fetch: _fetch },
        })

        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(jwt)
        if (authError || !user) {
            console.error('Auth verification failed:', authError?.message || 'No user returned')
            return new Response(
                JSON.stringify({ error: 'Unauthorized' }),
                { status: 401, headers: { ...headers, 'Content-Type': 'application/json' } }
            )
        }

        if (!user.email) {
            console.error('User email not found for re-authentication')
            return new Response(
                JSON.stringify({ error: 'Unauthorized' }),
                { status: 401, headers: { ...headers, 'Content-Type': 'application/json' } }
            )
        }

        // Re-authenticate to confirm the person holding the device knows the password.
        // This protects against accidental or unauthorized deletion.
        const { error: signInError } = await supabaseAdmin.auth.signInWithPassword({
            email: user.email,
            password,
        })
        if (signInError) {
            console.error('Re-authentication failed:', signInError.message)
            return new Response(
                JSON.stringify({ error: 'Incorrect password' }),
                { status: 401, headers: { ...headers, 'Content-Type': 'application/json' } }
            )
        }

        // Delete the Supabase auth user by calling the GoTrue admin endpoint directly.
        // Using the injected fetch ensures the same implementation is used in tests.
        // The player_profiles, game_states, purchase_intents, and player_entitlements rows
        // are all removed via ON DELETE CASCADE foreign keys in the database schema.
        // Anonymous play_events analytics are NOT deleted — session IDs cannot be linked
        // to the account (they are tab-scoped and cleared on tab close), so they do not
        // constitute personal data under GDPR.
        const deleteResponse = await _fetch(
            `${supabaseUrl}/auth/v1/admin/users/${user.id}`,
            {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${serviceRoleKey}`,
                    'apikey': serviceRoleKey,
                },
            }
        )

        if (!deleteResponse.ok) {
            const errorData = await deleteResponse.json().catch(() => ({})) as { message?: string }
            throw new Error(errorData.message ?? `Delete failed with status ${deleteResponse.status}`)
        }

        return new Response(
            JSON.stringify({ success: true }),
            { headers: { ...headers, 'Content-Type': 'application/json' } }
        )
    } catch (err: unknown) {
        const error = err as Error
        console.error('Error deleting account:', error.message)
        return new Response(
            JSON.stringify({ error: 'An internal error occurred. Please try again.' }),
            { status: 500, headers: { ...headers, 'Content-Type': 'application/json' } }
        )
    }
}

export const handler = createHandler()

if (import.meta.main) {
    Deno.serve(handler)
}
