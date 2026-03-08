import { createClient } from 'npm:@supabase/supabase-js@^2.0.0'

export const handler = async (req: Request) => {
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

        const jwt = authHeader.replace('Bearer ', '')
        const supabaseAdmin = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
            { auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false } }
        )

        // Verify the JWT and get the requesting user
        const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(jwt)
        if (authError || !user) {
            console.error('Auth verification failed:', authError?.message || 'No user returned')
            return new Response(
                JSON.stringify({ error: 'Unauthorized' }),
                { status: 401, headers: { ...headers, 'Content-Type': 'application/json' } }
            )
        }

        console.log('Processing account deletion for user:', user.id)

        // Delete the Supabase auth user.
        // The player_profiles, game_states, purchase_intents, and player_entitlements rows
        // are all removed via ON DELETE CASCADE foreign keys in the database schema.
        // Anonymous play_events analytics are NOT deleted — session IDs cannot be linked
        // to the account (they are tab-scoped and cleared on tab close), so they do not
        // constitute personal data under GDPR.
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id)
        if (deleteError) {
            console.error('Failed to delete user:', deleteError.message)
            throw deleteError
        }

        console.log('Account deleted successfully for user:', user.id)

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

if (import.meta.main) {
    Deno.serve(handler)
}
