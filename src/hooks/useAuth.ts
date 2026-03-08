/***
This file is ignored by vitest unit test coverage. The reason is that it takes too
long to run unit tests for this file as it accesses supabase
DO NOT ADD UNIT TESTS FOR THIS FILE (even though we want .ts files to have unit tests) 
***/
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../services/supabase.service';

import type { Session, User } from '@supabase/supabase-js';

const AUTH_TIMEOUT_MS = 8000;

function createAuthTimeoutPromise(ms: number) {
    let cancel = () => {};
    const promise = new Promise<{ data: { session: null } }>((resolve) => {
        const id = setTimeout(() => resolve({ data: { session: null } }), ms);
        cancel = () => clearTimeout(id);
    });
    return { promise, cancel };
}

export const useAuth = () => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshSession = useCallback(async () => {
        const { data: { session }, error } = await supabase.auth.refreshSession();
        if (error) {
            // Fallback to getSession if refresh fails (e.g. no session exists)
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            setSession(currentSession);
            setUser(currentSession?.user ?? null);
        } else {
            setSession(session);
            setUser(session?.user ?? null);
        }
        setLoading(false);
    }, []);

    useEffect(() => {
        // Initial load
        const init = async () => {
            const { promise: timeoutPromise, cancel } = createAuthTimeoutPromise(AUTH_TIMEOUT_MS);
            const { data: { session } } = await Promise.race([
                supabase.auth.getSession(),
                timeoutPromise
            ]).finally(cancel);
            setSession(session);

            setUser(session?.user ?? null);
            setLoading(false);
        };
        init();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            const newUser = session?.user ?? null;

            setUser(newUser);

            setSession(session);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signIn = async (email: string, password: string) => {
        try {
            setLoading(true);
            const { error, data } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error signing in:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const resetPasswordForEmail = async (email: string, redirectTo: string) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
        if (error) throw error;
    };

    const updatePassword = async (newPassword: string) => {
        const { error } = await supabase.auth.updateUser({ password: newPassword });
        if (error) throw error;
    };

    const deleteAccount = async (): Promise<void> => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) throw new Error('Not authenticated');

        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
        const response = await fetch(`${supabaseUrl}/functions/v1/delete-account`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${session.access_token}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const data = await response.json() as { error?: string };
            throw new Error(data.error || 'Failed to delete account');
        }

        await supabase.auth.signOut();
    };

    return {
        session,
        user,
        isAuthenticated: !!session,
        loading,
        signIn,
        refreshSession,
        resetPasswordForEmail,
        updatePassword,
        deleteAccount
    };
};
