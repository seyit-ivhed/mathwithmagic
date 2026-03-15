import { describe, it, expect, vi, beforeEach } from 'vitest';

// Unmock the module under test (global setup.ts mocks it)
vi.unmock('./persistence.service');

// --- Supabase mock setup ---
const mockSelect = vi.fn().mockReturnThis();
const mockEq = vi.fn().mockReturnThis();
const mockSingle = vi.fn();
const mockMaybeSingle = vi.fn();
const mockUpsert = vi.fn().mockReturnValue({ select: mockSelect });
const mockFrom = vi.fn().mockReturnValue({
    upsert: mockUpsert,
    select: mockSelect,
    eq: mockEq,
    single: mockSingle,
    maybeSingle: mockMaybeSingle,
});
const mockGetSession = vi.fn();

vi.mock('./supabase.service', () => ({
    supabase: {
        from: (...args: unknown[]) => mockFrom(...args),
        auth: { getSession: (...args: unknown[]) => mockGetSession(...args) },
    },
}));

// Mock mergeGameState
vi.mock('../utils/merge-game-state', () => ({
    mergeGameState: vi.fn((primary, _secondary) => ({ ...primary, merged: true })),
}));

// Mock DebouncedQueue to call processor synchronously
vi.mock('../utils/debounced-queue', () => {
    return {
        DebouncedQueue: class {
            private processor: (input: unknown) => Promise<void>;
            constructor({ processor }: { processor: (input: unknown) => Promise<void> }) {
                this.processor = processor;
            }
            enqueue(input: unknown) { return this.processor(input); }
        },
    };
});

import { PersistenceService } from './persistence.service';
import { mergeGameState } from '../utils/merge-game-state';
import type { GameState } from '../stores/game/interfaces';

const MOCK_AUTH_ID = 'auth-id-123';
const MOCK_STATE = { activeParty: ['companion-1'] } as unknown as GameState;

describe('PersistenceService', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        // Default happy-path chain for upsert → select → single
        mockSingle.mockResolvedValue({ data: { id: MOCK_AUTH_ID }, error: null });
        mockSelect.mockReturnValue({ single: mockSingle, eq: mockEq });
        mockUpsert.mockReturnValue({ select: mockSelect });
        mockEq.mockReturnValue({ maybeSingle: mockMaybeSingle });
    });

    // --- getOrCreateProfile ---
    describe('getOrCreateProfile', () => {
        it('should upsert a player_profiles row and return the id', async () => {
            const result = await PersistenceService.getOrCreateProfile(MOCK_AUTH_ID);

            expect(mockFrom).toHaveBeenCalledWith('player_profiles');
            expect(mockUpsert).toHaveBeenCalledWith(
                expect.objectContaining({ id: MOCK_AUTH_ID }),
                { onConflict: 'id' },
            );
            expect(result).toEqual({ id: MOCK_AUTH_ID });
        });

        it('should throw when supabase returns an error', async () => {
            mockSingle.mockResolvedValue({ data: null, error: new Error('db error') });

            await expect(PersistenceService.getOrCreateProfile(MOCK_AUTH_ID)).rejects.toThrow('db error');
        });
    });

    // --- pullState ---
    describe('pullState', () => {
        it('should return state_blob when a row exists', async () => {
            mockMaybeSingle.mockResolvedValue({ data: { state_blob: MOCK_STATE }, error: null });

            const result = await PersistenceService.pullState(MOCK_AUTH_ID);

            expect(mockFrom).toHaveBeenCalledWith('game_states');
            expect(mockSelect).toHaveBeenCalledWith('state_blob');
            expect(result).toEqual(MOCK_STATE);
        });

        it('should return null when no row exists', async () => {
            mockMaybeSingle.mockResolvedValue({ data: null, error: null });

            const result = await PersistenceService.pullState(MOCK_AUTH_ID);
            expect(result).toBeNull();
        });

        it('should throw when supabase returns an error', async () => {
            mockMaybeSingle.mockResolvedValue({ data: null, error: new Error('pull error') });

            await expect(PersistenceService.pullState(MOCK_AUTH_ID)).rejects.toThrow('pull error');
        });
    });

    // --- pushState ---
    describe('pushState', () => {
        it('should merge with cloud state and upsert when cloud state exists', async () => {
            const cloudState = { activeParty: ['companion-2'] } as unknown as GameState;
            mockMaybeSingle.mockResolvedValue({ data: { state_blob: cloudState }, error: null });
            // upsert for game_states (second call)
            mockUpsert.mockReturnValue({ error: null });

            const result = await PersistenceService.pushState(MOCK_AUTH_ID, MOCK_STATE);

            expect(mergeGameState).toHaveBeenCalledWith(MOCK_STATE, cloudState);
            expect(mockFrom).toHaveBeenCalledWith('game_states');
            expect(result).toEqual({ success: true });
        });

        it('should write state directly when no cloud state exists', async () => {
            mockMaybeSingle.mockResolvedValue({ data: null, error: null });
            mockUpsert.mockReturnValue({ error: null });

            const result = await PersistenceService.pushState(MOCK_AUTH_ID, MOCK_STATE);

            expect(mergeGameState).not.toHaveBeenCalled();
            expect(mockUpsert).toHaveBeenCalledWith(
                expect.objectContaining({ player_id: MOCK_AUTH_ID, state_blob: MOCK_STATE }),
                { onConflict: 'player_id' },
            );
            expect(result).toEqual({ success: true });
        });

        it('should return failure when upsert errors', async () => {
            mockMaybeSingle.mockResolvedValue({ data: null, error: null });
            const upsertError = new Error('upsert failed');
            mockUpsert.mockReturnValue({ error: upsertError });

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            const result = await PersistenceService.pushState(MOCK_AUTH_ID, MOCK_STATE);

            expect(result).toEqual({ success: false, error: upsertError });
            consoleSpy.mockRestore();
        });

        it('should return failure when pullState throws', async () => {
            mockMaybeSingle.mockResolvedValue({ data: null, error: new Error('pull failed') });

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            const result = await PersistenceService.pushState(MOCK_AUTH_ID, MOCK_STATE);

            expect(result).toEqual({ success: false, error: expect.any(Error) });
            consoleSpy.mockRestore();
        });
    });

    // --- sync ---
    describe('sync', () => {
        it('should enqueue a sync when a session exists', async () => {
            mockGetSession.mockResolvedValue({
                data: { session: { user: { id: MOCK_AUTH_ID } } },
            });
            // Setup for the pushState call triggered via syncQueue
            mockMaybeSingle.mockResolvedValue({ data: null, error: null });
            mockUpsert.mockReturnValue({ error: null });

            const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
            await PersistenceService.sync(MOCK_STATE);

            expect(mockGetSession).toHaveBeenCalled();
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('sync triggered'));
            consoleSpy.mockRestore();
        });

        it('should not enqueue when no session exists', async () => {
            mockGetSession.mockResolvedValue({ data: { session: null } });

            await PersistenceService.sync(MOCK_STATE);

            // pushState should not have been called (mockFrom only called for getSession path)
            expect(mockFrom).not.toHaveBeenCalledWith('game_states');
        });

        it('should catch and log errors from getSession', async () => {
            mockGetSession.mockRejectedValue(new Error('auth error'));

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            await PersistenceService.sync(MOCK_STATE);

            expect(consoleSpy).toHaveBeenCalledWith(
                expect.stringContaining('Error in sync helper'),
                expect.any(Error),
            );
            consoleSpy.mockRestore();
        });
    });
});
