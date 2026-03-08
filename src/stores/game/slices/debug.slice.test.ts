import { describe, it, expect, vi } from 'vitest';
import type { StoreApi } from 'zustand';
import { createDebugSlice } from './debug.slice';
import type { GameStore } from '../interfaces';
import { COMPANIONS } from '../../../data/companions.data';
import { ADVENTURES } from '../../../data/adventures.data';

const mockGet = (state: Partial<GameStore>) => () => state as GameStore;
const mockSet = vi.fn() as unknown as StoreApi<GameStore>['setState'];

describe('debug.slice', () => {
    const setupSlice = (state: Partial<GameStore> = {}) => {
        const slice = createDebugSlice(
            mockSet,
            mockGet(state),
            {} as StoreApi<GameStore>
        );
        return slice;
    };



    it('should reset companions to level 1 via debugResetCompanions', () => {
        vi.mocked(mockSet).mockClear();
        const slice = setupSlice();

        slice.debugResetCompanions();

        const expectedCompanionStats = Object.keys(COMPANIONS).reduce((acc, id) => {
            acc[id] = { level: 1, experience: 0 };
            return acc;
        }, {} as Record<string, { level: number; experience: number }>);

        expect(mockSet).toHaveBeenCalledWith({ companionStats: expectedCompanionStats });
    });

    it('should reset encounter results via debugResetEncounterResults', () => {
        vi.mocked(mockSet).mockClear();
        const slice = setupSlice();

        slice.debugResetEncounterResults();

        expect(mockSet).toHaveBeenCalledWith({ encounterResults: {} });
    });

    it('should set companion level via debugSetCompanionLevel', () => {
        vi.mocked(mockSet).mockClear();
        const slice = setupSlice({ companionStats: { 'c1': { level: 1 } } });

        slice.debugSetCompanionLevel('c1', 5);

        expect(mockSet).toHaveBeenCalledWith({
            companionStats: expect.objectContaining({
                'c1': { level: 5 }
            })
        });
    });

    it('should set encounter stars via debugSetEncounterStars', () => {
        vi.mocked(mockSet).mockClear();
        const slice = setupSlice({ encounterResults: {} });

        slice.debugSetEncounterStars('1', 1, 3);

        expect(mockSet).toHaveBeenCalledWith({
            encounterResults: expect.objectContaining({
                '1_1': expect.objectContaining({ stars: 3 })
            })
        });
    });

    it('should preserve existing difficulty and completedAt in debugSetEncounterStars when result already exists', () => {
        vi.mocked(mockSet).mockClear();
        const existingResult = { stars: 1, difficulty: 2, completedAt: 12345 };
        const slice = setupSlice({ encounterResults: { '1_1': existingResult } });

        slice.debugSetEncounterStars('1', 1, 3);

        expect(mockSet).toHaveBeenCalledWith({
            encounterResults: expect.objectContaining({
                '1_1': expect.objectContaining({ stars: 3, difficulty: 2, completedAt: 12345 })
            })
        });
    });

    describe('debugSetAdventureStars', () => {
        it('should set stars for all non-ending encounters in an adventure', () => {
            vi.mocked(mockSet).mockClear();
            const adventureId = ADVENTURES[0].id;
            const slice = setupSlice({ encounterResults: {} });

            slice.debugSetAdventureStars(adventureId, 3);

            expect(mockSet).toHaveBeenCalled();
            const callArg = vi.mocked(mockSet).mock.calls[0][0] as { encounterResults: Record<string, { stars: number }> };
            const results = callArg.encounterResults;
            const keys = Object.keys(results);
            expect(keys.length).toBeGreaterThan(0);
            keys.forEach(key => {
                expect(results[key].stars).toBe(3);
            });
        });

        it('should preserve existing difficulty and completedAt in debugSetAdventureStars', () => {
            vi.mocked(mockSet).mockClear();
            const adventureId = ADVENTURES[0].id;
            const existingResult = { stars: 1, difficulty: 2, completedAt: 99999 };
            const slice = setupSlice({ encounterResults: { [`${adventureId}_1`]: existingResult } });

            slice.debugSetAdventureStars(adventureId, 3);

            const callArg = vi.mocked(mockSet).mock.calls[0][0] as { encounterResults: Record<string, { stars: number; difficulty: number; completedAt: number }> };
            const key = `${adventureId}_1`;
            expect(callArg.encounterResults[key].difficulty).toBe(2);
            expect(callArg.encounterResults[key].completedAt).toBe(99999);
        });

        it('should do nothing for a non-existent adventure ID', () => {
            vi.mocked(mockSet).mockClear();
            const slice = setupSlice({ encounterResults: {} });

            slice.debugSetAdventureStars('nonexistent-id', 3);

            expect(mockSet).not.toHaveBeenCalled();
        });
    });
});
