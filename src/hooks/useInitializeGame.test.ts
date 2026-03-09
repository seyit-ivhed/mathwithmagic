import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useInitializeGame, INIT_TIMEOUT_MS } from './useInitializeGame';
import { useAuth } from '../context/useAuth';
import { usePremiumStore, type PremiumState } from '../stores/premium.store';
import { PersistenceService } from '../services/persistence.service';
import { mergeGameState } from '../utils/merge-game-state';
import type { Session, User } from '@supabase/supabase-js';
import type { GameState } from '../stores/game/interfaces';

vi.mock('../context/useAuth');
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
        vi.spyOn(console, 'error').mockImplementation(() => { });

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
            resetPasswordForEmail: vi.fn(),
            updatePassword: vi.fn(),
            deleteAccount: vi.fn(),
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
            resetPasswordForEmail: vi.fn(),
            updatePassword: vi.fn(),
            deleteAccount: vi.fn(),
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
            resetPasswordForEmail: vi.fn(),
            updatePassword: vi.fn(),
            deleteAccount: vi.fn(),
        } as ReturnType<typeof useAuth>);

        const { result } = renderHook(() => useInitializeGame());

        await waitFor(() => {
            expect(result.current.isInitializing).toBe(false);
        }, { interval: 5 });

        expect(mergeGameState).toHaveBeenCalledWith(emptyGameState, cloudState);
        expect(mockSetState).toHaveBeenCalledWith(mergedState);
    });

    it('should push local state to cloud when no cloud state exists (new account)', async () => {
        vi.mocked(PersistenceService.pullState).mockResolvedValue(null);
        vi.mocked(PersistenceService.pushState).mockResolvedValue({ success: true });

        vi.mocked(useAuth).mockReturnValue({
            session: { user: { id: 'new-user' } } as unknown as Session,
            isAuthenticated: true,
            user: { id: 'new-user' } as unknown as User,
            loading: false,
            refreshSession: mockRefreshSession,
            signIn: vi.fn(),
            resetPasswordForEmail: vi.fn(),
            updatePassword: vi.fn(),
            deleteAccount: vi.fn(),
        } as ReturnType<typeof useAuth>);

        const { result } = renderHook(() => useInitializeGame());

        await waitFor(() => {
            expect(result.current.isInitializing).toBe(false);
        }, { interval: 5 });

        expect(PersistenceService.pushState).toHaveBeenCalledWith('new-user', emptyGameState);
        expect(mockSetState).not.toHaveBeenCalled();
    });

    it('should not reinitialize when re-rendered with the same user id but a new auth object reference', async () => {
        const userObj1 = { id: 'stable-user', email: 'old@test.com' };
        vi.mocked(useAuth).mockReturnValue({
            session: { user: userObj1 } as unknown as Session,
            isAuthenticated: true,
            user: userObj1 as unknown as User,
            loading: false,
            refreshSession: mockRefreshSession,
            signIn: vi.fn(),
            resetPasswordForEmail: vi.fn(),
            updatePassword: vi.fn(),
            deleteAccount: vi.fn(),
        } as ReturnType<typeof useAuth>);

        const { result, rerender } = renderHook(() => useInitializeGame());

        await waitFor(() => {
            expect(result.current.isInitializing).toBe(false);
        }, { interval: 5 });

        const callCountAfterFirst = vi.mocked(PersistenceService.getOrCreateProfile).mock.calls.length;

        // Change the user object reference (different object, same id) → triggers useCallback recreation
        const userObj2 = { id: 'stable-user', email: 'new@test.com' };
        vi.mocked(useAuth).mockReturnValue({
            session: { user: userObj2 } as unknown as Session,
            isAuthenticated: true,
            user: userObj2 as unknown as User, // new reference → performInitialization recreated → useEffect re-runs
            loading: false,
            refreshSession: mockRefreshSession,
            signIn: vi.fn(),
            resetPasswordForEmail: vi.fn(),
            updatePassword: vi.fn(),
            deleteAccount: vi.fn(),
        } as ReturnType<typeof useAuth>);

        rerender();

        await waitFor(() => {
            expect(result.current.isInitializing).toBe(false);
        }, { interval: 5 });

        // Should NOT call getOrCreateProfile again — same userId triggers line 27 early return
        expect(vi.mocked(PersistenceService.getOrCreateProfile).mock.calls.length).toBe(callCountAfterFirst);
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
            resetPasswordForEmail: vi.fn(),
            updatePassword: vi.fn(),
            deleteAccount: vi.fn(),
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

    it('should not initialize while auth is still loading', async () => {
        vi.mocked(useAuth).mockReturnValue({
            session: null,
            isAuthenticated: false,
            user: null,
            loading: true,
            refreshSession: mockRefreshSession,
            signIn: vi.fn(),
            resetPasswordForEmail: vi.fn(),
            updatePassword: vi.fn(),
            deleteAccount: vi.fn(),
        } as ReturnType<typeof useAuth>);

        const { result } = renderHook(() => useInitializeGame());

        // isInitializing should remain true because authLoading is true
        expect(result.current.isInitializing).toBe(true);
        expect(PersistenceService.getOrCreateProfile).not.toHaveBeenCalled();
    });

    it('should initialize for unauthenticated user without fetching profile', async () => {
        vi.mocked(useAuth).mockReturnValue({
            session: null,
            isAuthenticated: false,
            user: null,
            loading: false,
            refreshSession: mockRefreshSession,
            signIn: vi.fn(),
            resetPasswordForEmail: vi.fn(),
            updatePassword: vi.fn(),
            deleteAccount: vi.fn(),
        } as ReturnType<typeof useAuth>);

        const { result } = renderHook(() => useInitializeGame());

        await waitFor(() => {
            expect(result.current.isInitializing).toBe(false);
        }, { interval: 5 });

        expect(PersistenceService.getOrCreateProfile).not.toHaveBeenCalled();
    });

    it('should call retry and re-initialize', async () => {
        vi.mocked(useAuth).mockReturnValue({
            session: { user: { id: 'retry-user' } } as unknown as Session,
            isAuthenticated: true,
            user: { id: 'retry-user' } as unknown as User,
            loading: false,
            refreshSession: mockRefreshSession.mockResolvedValue(undefined),
            signIn: vi.fn(),
            resetPasswordForEmail: vi.fn(),
            updatePassword: vi.fn(),
            deleteAccount: vi.fn(),
        } as ReturnType<typeof useAuth>);

        const { result } = renderHook(() => useInitializeGame());

        await waitFor(() => {
            expect(result.current.isInitializing).toBe(false);
        }, { interval: 5 });

        const initialCallCount = vi.mocked(PersistenceService.getOrCreateProfile).mock.calls.length;

        // Call retry
        await act(async () => {
            result.current.retry();
        });

        await waitFor(() => {
            expect(vi.mocked(PersistenceService.getOrCreateProfile).mock.calls.length).toBeGreaterThan(initialCallCount);
        }, { interval: 5 });
    });
});

