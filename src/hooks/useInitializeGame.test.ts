import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useInitializeGame } from './useInitializeGame';
import { useAuth } from './useAuth';
import { usePremiumStore, type PremiumState } from '../stores/premium.store';
import { PersistenceService } from '../services/persistence.service';
import type { Session, User } from '@supabase/supabase-js';

// Mocks
vi.mock('./useAuth');
vi.mock('../services/persistence.service');
vi.mock('../stores/premium.store');
vi.mock('../stores/game/store', () => ({
    useGameStore: {
        setState: vi.fn(),
    }
}));

describe('useInitializeGame', () => {
    const mockInitializePremium = vi.fn();
    const mockRefreshSession = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, 'log').mockImplementation(() => { });

        // Setup default mocks
        vi.mocked(usePremiumStore).mockImplementation((selector?: unknown) => {
            if (typeof selector === 'function') {
                return mockInitializePremium;
            }
            return { initialize: mockInitializePremium } as unknown as PremiumState;
        });

        // Mock PersistenceService
        vi.mocked(PersistenceService.getOrCreateProfile).mockResolvedValue({ id: 'p1' });
        vi.mocked(PersistenceService.pullState).mockResolvedValue(null);
    });

    it('should force re-initialize premium when user changes (Reproduction Case)', async () => {
        // 1. Start as Anonymous
        vi.mocked(useAuth).mockReturnValue({
            session: { user: { id: 'anon-user' } } as unknown as Session,
            isAuthenticated: true,
            user: { id: 'anon-user' } as unknown as User,
            loading: false,
            refreshSession: mockRefreshSession,
            signIn: vi.fn(),
            signInAnonymously: vi.fn(),
            resetPasswordForEmail: vi.fn(),
            updatePassword: vi.fn(),
        } as ReturnType<typeof useAuth>);

        const { result, rerender } = renderHook(() => useInitializeGame());

        await waitFor(() => {
            expect(result.current.isInitializing).toBe(false);
        }, { interval: 5 });

        // Verify initial call - expecting true because we now force it
        expect(mockInitializePremium).toHaveBeenCalledWith(true, expect.anything());

        mockInitializePremium.mockClear();

        // 2. Simulate Login (User changes)
        vi.mocked(useAuth).mockReturnValue({
            session: { user: { id: 'premium-user' } } as unknown as Session,
            isAuthenticated: true,
            user: { id: 'premium-user' } as unknown as User,
            loading: false,
            refreshSession: mockRefreshSession,
            signIn: vi.fn(),
            signInAnonymously: vi.fn(),
            resetPasswordForEmail: vi.fn(),
            updatePassword: vi.fn(),
        } as ReturnType<typeof useAuth>);

        rerender();

        await waitFor(() => {
            expect(result.current.isInitializing).toBe(false);
        }, { interval: 5 });

        // VERIFY FIX:
        // We ensure it is called with `true` (force) because the user changed.
        // This confirms that entitlements are correctly re-fetched for the new identity.
        expect(mockInitializePremium).toHaveBeenCalledWith(true, expect.anything());
    });
});
