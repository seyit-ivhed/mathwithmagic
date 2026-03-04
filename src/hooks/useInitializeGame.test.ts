import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useInitializeGame, INIT_TIMEOUT_MS } from './useInitializeGame';
import { useAuth } from './useAuth';
import { usePremiumStore, type PremiumState } from '../stores/premium.store';
import { PersistenceService } from '../services/persistence.service';
import { mergeGameState } from '../utils/merge-game-state';
import type { Session, User } from '@supabase/supabase-js';
import type { GameState } from '../stores/game/interfaces';

vi.mock('./useAuth');
vi.mock('../services/persistence.service');
vi.mock('../utils/merge-game-state');
vi.mock('../stores/premium.store');

const mockSetState = vi.fn();
const emptyGameState: GameState = {
    activeParty: [],
    encounterResults: {},
    activeEncounterDifficulty: 1,
    companionStats: {},
    adventureStatuses: {},
};

vi.mock('../stores/game/store', () => ({
    useGameStore: {
        setState: (...args: unknown[]) => mockSetState(...args),
        getState: () => emptyGameState,
    }
}));

describe('useInitializeGame', () => {
    const mockInitializePremium = vi.fn();
    const mockRefreshSession = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, 'log').mockImplementation(() => { });

        vi.mocked(usePremiumStore).mockImplementation((selector?: unknown) => {
            if (typeof selector === 'function') {
                return mockInitializePremium;
            }
            return { initialize: mockInitializePremium } as unknown as PremiumState;
        });

        vi.mocked(PersistenceService.getOrCreateProfile).mockResolvedValue({ id: 'p1' });
        vi.mocked(PersistenceService.pullState).mockResolvedValue(null);
        vi.mocked(mergeGameState).mockImplementation((primary) => primary);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('should force re-initialize premium when user changes (Reproduction Case)', async () => {
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

        expect(mockInitializePremium).toHaveBeenCalledWith(true, expect.anything());

        mockInitializePremium.mockClear();

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

        expect(mockInitializePremium).toHaveBeenCalledWith(true, expect.anything());
    });

    it('should merge cloud state with local state when cloud state exists', async () => {
        const cloudState = {
            activeParty: ['tariq'],
            encounterResults: { '1_1': { stars: 3, difficulty: 3, completedAt: 100 } },
            activeEncounterDifficulty: 2,
            companionStats: { tariq: { level: 5, experience: 0 } },
            adventureStatuses: {},
        };

        const mergedState: GameState = {
            ...emptyGameState,
            activeParty: ['tariq'],
            companionStats: { tariq: { level: 5, experience: 0 } },
        };

        vi.mocked(PersistenceService.pullState).mockResolvedValue(cloudState);
        vi.mocked(mergeGameState).mockReturnValue(mergedState);

        vi.mocked(useAuth).mockReturnValue({
            session: { user: { id: 'user-1' } } as unknown as Session,
            isAuthenticated: true,
            user: { id: 'user-1' } as unknown as User,
            loading: false,
            refreshSession: mockRefreshSession,
            signIn: vi.fn(),
            signInAnonymously: vi.fn()
        } as ReturnType<typeof useAuth>);

        const { result } = renderHook(() => useInitializeGame());

        await waitFor(() => {
            expect(result.current.isInitializing).toBe(false);
        }, { interval: 5 });

        expect(mergeGameState).toHaveBeenCalledWith(emptyGameState, cloudState);
        expect(mockSetState).toHaveBeenCalledWith(mergedState);
    });

    it('should show connectivity error when initialization times out', async () => {
        vi.useFakeTimers();

        vi.mocked(useAuth).mockReturnValue({
            session: { user: { id: 'user-timeout' } } as unknown as Session,
            isAuthenticated: true,
            user: { id: 'user-timeout' } as unknown as User,
            loading: false,
            refreshSession: mockRefreshSession,
            signIn: vi.fn(),
            signInAnonymously: vi.fn(),
            resetPasswordForEmail: vi.fn(),
            updatePassword: vi.fn(),
        } as ReturnType<typeof useAuth>);

        // Simulate a hanging network request that never resolves
        vi.mocked(PersistenceService.getOrCreateProfile).mockReturnValue(new Promise(() => {}));

        const { result } = renderHook(() => useInitializeGame());

        expect(result.current.isInitializing).toBe(true);

        await act(async () => {
            await vi.advanceTimersByTimeAsync(INIT_TIMEOUT_MS + 1);
        });

        expect(result.current.isInitializing).toBe(false);
        expect(result.current.error).toBe('offline');
    });
});

