import type { SupabaseClient } from '@supabase/supabase-js';

interface AccountConversionResult {
    success: boolean;
    error?: string;
    emailAlreadyExists?: boolean;
}

interface AccountConversionParams {
    email: string;
    password: string;
    productUpdateConsent?: boolean;
    refreshSession: () => Promise<void>;
    translation: (key: string, options?: Record<string, unknown>) => string;
    supabaseClient: SupabaseClient;
}

/**
 * Validates the account creation form fields.
 * Returns an error message if invalid, or null if valid.
 */
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

/**
 * Creates a fresh Supabase account for the player and uploads any local game state.
 * Progress is only synced to Supabase once the player has a real account.
 */
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

        if (currentSession?.user && !currentSession.user.is_anonymous) {
            console.warn('User is already authenticated. Skipping account creation.');
            return { success: true };
        }

        console.log('Creating account for email:', email);

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
                    emailAlreadyExists: true,
                    error: translation('premium.store.account.errors.already_exists', { defaultValue: 'This email is already registered. Please sign in with your existing account.' })
                };
            }
            throw signUpError;
        }

        console.log('Account created successfully. Finalizing profile...');

        // 3. Ensure a player profile exists
        const userId = data.user?.id;
        if (userId) {
            console.log('Synchronizing player profile for:', userId);
            const { error: upsertError } = await supabaseClient
                .from('player_profiles')
                .upsert({ id: userId, product_update_consent: productUpdateConsent }, { onConflict: 'id' });

            if (upsertError) {
                console.error('Error synchronizing profile:', upsertError);
            } else {
                console.log('Profile synchronized.');
            }
        }

        console.log('Refreshing session...');

        // 4. Force a session refresh to get the updated JWT
        await refreshSession();

        // 5. Double check we have a valid session now
        const { data: { session: updatedSession } } = await supabaseClient.auth.getSession();
        console.log('Post-signup session check:', updatedSession ? 'Valid' : 'Missing (email confirmation may be required)');

        // 6. Slightly longer delay to ensure the session is propagated before proceeding to checkout
        await new Promise(resolve => setTimeout(resolve, 1500));
        return { success: true };

    } catch (err: unknown) {
        const errObj = err as Error;
        console.error('Account creation error:', errObj);
        return { success: false, error: errObj.message || 'Failed to create account' };
    }
};
