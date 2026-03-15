import { renderHook } from '@testing-library/react';
import { useAuth } from './useAuth';
import { AuthContext } from './auth.context';
import type { AuthContextValue } from './auth.context';
import type { ReactNode } from 'react';
import { createElement } from 'react';

const mockAuthValue: AuthContextValue = {
    session: null,
    user: null,
    isAuthenticated: false,
    loading: false,
    signIn: vi.fn(),
    refreshSession: vi.fn(),
    resetPasswordForEmail: vi.fn(),
    updatePassword: vi.fn(),
    deleteAccount: vi.fn(),
};

function wrapper({ children }: { children: ReactNode }) {
    return createElement(AuthContext.Provider, { value: mockAuthValue }, children);
}

describe('useAuth', () => {
    it('returns auth context when used within AuthProvider', () => {
        const { result } = renderHook(() => useAuth(), { wrapper });
        expect(result.current).toBe(mockAuthValue);
    });

    it('throws when used outside AuthProvider', () => {
        expect(() => {
            renderHook(() => useAuth());
        }).toThrow('useAuth must be used within AuthProvider');
    });
});
