import { createContext } from 'react';
import type { Session, User } from '@supabase/supabase-js';

export interface AuthContextValue {
    session: Session | null;
    user: User | null;
    isAuthenticated: boolean;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<{ user: User; session: Session }>;
    refreshSession: () => Promise<void>;
    resetPasswordForEmail: (email: string, redirectTo: string) => Promise<void>;
    updatePassword: (newPassword: string) => Promise<void>;
    deleteAccount: (password: string) => Promise<void>;
}

export const AuthContext = createContext<AuthContextValue | null>(null);
