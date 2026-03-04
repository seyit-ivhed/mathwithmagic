/***
This file is ignored by vitest unit test coverage. The reason is that it takes too
long to run unit tests for this file as it accesses supabase
DO NOT ADD UNIT TESTS FOR THIS FILE (even though we want .ts files to have unit tests) 
***/
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../services/supabase.service';

import { IdentityService } from '../services/identity.service';
import type { Session, User } from '@supabase/supabase-js';

const AUTH_TIMEOUT_MS = 8000;

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
            let clearAuthTimeout = () => {};
            const timeoutResult = new Promise<{ data: { session: null } }>((resolve) => {
                const id = setTimeout(() => resolve({ data: { session: null } }), AUTH_TIMEOUT_MS);
                clearAuthTimeout = () => clearTimeout(id);
            });
            const { data: { session } } = await Promise.race([
                supabase.auth.getSession(),
                timeoutResult
            ]).finally(clearAuthTimeout);
            setSession(session);

            if (session?.user?.id) {
                IdentityService.setPlayerId(session.user.id);
            } else {
                IdentityService.clearPlayerId();
            }

            setUser(session?.user ?? null);
            setLoading(false);
        };
        init();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            const newUser = session?.user ?? null;

            // Sync IdentityService
            if (newUser?.id) {
                IdentityService.setPlayerId(newUser.id);
            } else {
                IdentityService.clearPlayerId();
            }

            setUser(newUser);

            setSession(session);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const signInAnonymously = async () => {
        try {
            setLoading(true);
            const { error, data } = await supabase.auth.signInAnonymously({
                options: {
                    data: { device_id: IdentityService.getDeviceId() }
                }
            });
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error signing in anonymously:', error);
            throw error;
        } finally {
            setLoading(false);
        }
    };

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

    return {
        session,
        user,
        isAuthenticated: !!session,
        loading,
        signIn,
        signInAnonymously,
        refreshSession,
        resetPasswordForEmail,
        updatePassword
    };
};
