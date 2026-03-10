import type { SupabaseClient } from '@supabase/supabase-js';
import { pollUntil } from '../../../utils/poll-until';

const POLL_INTERVAL_MS = 300;
const POLL_TIMEOUT_MS = 8000;

export async function waitForSession(client: SupabaseClient): Promise<boolean> {
    return pollUntil(
        async () => {
            const { data: { session } } = await client.auth.getSession();
            return !!session?.user;
        },
        { intervalMs: POLL_INTERVAL_MS, timeoutMs: POLL_TIMEOUT_MS }
    );
}

interface AccountConversionResult {
    success: boolean;
    error?: string;
}

interface AccountConversionParams {
    email: string;
    password: string;
    productUpdateConsent?: boolean;
    refreshSession: () => Promise<void>;
    translation: (key: string, options?: Record<string, unknown>) => string;
    supabaseClient: SupabaseClient;
}

export const validateAccountCreationForm = (
    email: string,
    confirmEmail: string,
    password: string,
    translation: (key: string, options?: Record<string, unknown>) => string
): string | null => {
    if (!email || !email.includes('@')) {
        return translation('premium.store.account.errors.invalid_email');
    }

    if (email !== confirmEmail) {
        return translation('premium.store.account.errors.emails_dont_match');
    }

    if (password.length < 6) {
        return translation('premium.store.account.errors.weak_password');
    }

    return null;
};

export const performAccountConversion = async ({
    email,
    password,
    productUpdateConsent = false,
    refreshSession,
    translation,
    supabaseClient
}: AccountConversionParams): Promise<AccountConversionResult> => {
    try {
        // 1. Check if the user is already permanently authenticated
        const { data: { session: currentSession } } = await supabaseClient.auth.getSession();

        if (currentSession?.user) {
            return { success: true };
        }

        // 2. Create a fresh account (replaces anonymous-session upgrade)
        const { data, error: signUpError } = await supabaseClient.auth.signUp({
            email,
            password
        });

        if (signUpError) {
            if (signUpError.message.toLowerCase().includes('already registered') ||
                signUpError.message.toLowerCase().includes('already in use') ||
                signUpError.status === 422) {
                return {
                    success: false,
                    error: translation('premium.store.account.errors.already_exists', { defaultValue: 'This email is already registered. Please sign in with your existing account.' })
                };
            }
            throw signUpError;
        }

        // 3. Ensure a player profile exists
        const userId = data.user?.id;
        if (userId) {
            const { error: upsertError } = await supabaseClient
                .from('player_profiles')
                .upsert({ id: userId, product_update_consent: productUpdateConsent }, { onConflict: 'id' });

            if (upsertError) {
                console.error('Error synchronizing profile:', upsertError);
            }
        }

        // 4. Force a session refresh to get the updated JWT
        await refreshSession();

        // 5. Poll until the session reflects the newly created account
        const sessionReady = await waitForSession(supabaseClient);
        if (!sessionReady) {
            return { success: false, error: translation('premium.store.account.errors.session_timeout') };
        }

        return { success: true };

    } catch (err: unknown) {
        console.error('Account creation error:', err);
        return { success: false, error: translation('premium.store.account.errors.generic') };
    }
};
