import { describe, it, expect, vi } from 'vitest';
import type { StoreApi } from 'zustand';
import { createAdventureProgressSlice } from './adventure-progress.slice';
import { ADVENTURES } from '../../../data/adventures.data';
import type { GameStore, EncounterResult } from '../interfaces';

// Mock get() function for Zustand
const mockGet = (state: Partial<GameStore>) => () => state as GameStore;
const mockSet = vi.fn() as unknown as StoreApi<GameStore>['setState'];

describe('adventure-progress.slice - completeEncounter', () => {
    const setupSlice = (state: Partial<GameStore> = {}) => {
        const slice = createAdventureProgressSlice(
            mockSet,
            mockGet({
                encounterResults: {},
                activeEncounterDifficulty: 1,
                addCompanionToParty: vi.fn(),
                ...state
            }),
            {} as StoreApi<GameStore>
        );
        return slice;
    };

    const adventureId = ADVENTURES[0].id;



    it('should update stars if new performance is better', () => {
        vi.mocked(mockSet).mockClear();
        const encounterKey = `${adventureId}_1`;
        const initialResult = { stars: 1 };
        const slice = setupSlice({
            encounterResults: { [encounterKey]: initialResult },
            activeEncounterDifficulty: 3
        });

        slice.completeEncounter(adventureId, 1);

        expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({
            encounterResults: expect.objectContaining({
                [encounterKey]: expect.objectContaining({ stars: 3 })
            })
        }));
    });

    it('should not update stars if new performance is worse', () => {
        vi.mocked(mockSet).mockClear();
        const encounterKey = `${adventureId}_1`;
        const initialResult = { stars: 3 };
        const slice = setupSlice({
            encounterResults: { [encounterKey]: initialResult },
            activeEncounterDifficulty: 1
        });

        slice.completeEncounter(adventureId, 1);

        expect(mockSet).not.toHaveBeenCalled();
    });

    it('should do nothing for unknown adventure ID', () => {
        vi.mocked(mockSet).mockClear();
        const slice = setupSlice({ encounterResults: {}, activeEncounterDifficulty: 1 });

        slice.completeEncounter('nonexistent-adventure', 1);

        expect(mockSet).not.toHaveBeenCalled();
    });

});

describe('adventure-progress.slice - notifyEncounterStarted', () => {
    const setupSlice = (state: Partial<GameStore> = {}) => {
        const slice = createAdventureProgressSlice(
            mockSet,
            mockGet({
                encounterResults: {},
                activeEncounterDifficulty: 1,
                addCompanionToParty: vi.fn(),
                ...state
            }),
            {} as StoreApi<GameStore>
        );
        return slice;
    };

    it('should recruit Kenji when starting Adventure 3, Node 1', () => {
        const addCompanionToParty = vi.fn();
        const slice = setupSlice({ addCompanionToParty });

        slice.notifyEncounterStarted('3', 1);

        expect(addCompanionToParty).toHaveBeenCalledWith('kenji');
    });

    it('should recruit Zahara when starting Adventure 5, Node 1', () => {
        const addCompanionToParty = vi.fn();
        const slice = setupSlice({ addCompanionToParty });

        slice.notifyEncounterStarted('5', 1);

        expect(addCompanionToParty).toHaveBeenCalledWith('zahara');
    });

    it('should not recruit anyone if encounter has no unlocksCompanion', () => {
        const addCompanionToParty = vi.fn();
        const slice = setupSlice({ addCompanionToParty });

        slice.notifyEncounterStarted('1', 1);

        expect(addCompanionToParty).not.toHaveBeenCalled();
    });

    it('should log error and do nothing for unknown adventure ID', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const addCompanionToParty = vi.fn();
        const slice = setupSlice({ addCompanionToParty });

        slice.notifyEncounterStarted('nonexistent-adventure', 1);

        expect(addCompanionToParty).not.toHaveBeenCalled();
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
    });
});

describe('adventure-progress.slice - setEncounterDifficulty', () => {
    it('should update activeEncounterDifficulty', () => {
        vi.mocked(mockSet).mockClear();
        const slice = createAdventureProgressSlice(
            mockSet,
            mockGet({}),
            {} as StoreApi<GameStore>
        );

        slice.setEncounterDifficulty(3);

        expect(mockSet).toHaveBeenCalledWith({ activeEncounterDifficulty: 3 });
    });

    it('should log error and not update for non-number difficulty', () => {
        vi.mocked(mockSet).mockClear();
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const slice = createAdventureProgressSlice(
            mockSet,
            mockGet({}),
            {} as StoreApi<GameStore>
        );

        // @ts-expect-error testing invalid input
        slice.setEncounterDifficulty('hard');

        expect(mockSet).not.toHaveBeenCalled();
        expect(consoleSpy).toHaveBeenCalled();
        consoleSpy.mockRestore();
    });
});

describe('adventure-progress.slice - getAdventureNodes', () => {
    // Helper to setup slice
    const setupSlice = (encounterResults: Record<string, EncounterResult> = {}) => {
        const slice = createAdventureProgressSlice(
            mockSet,
            mockGet({ encounterResults, activeEncounterDifficulty: 1 }),
            {} as StoreApi<GameStore>
        );
        return slice;
    };

    const adventureId = ADVENTURES[0].id;

    it('should return all nodes locked except the first one initially', () => {
        const slice = setupSlice({});
        const nodes = slice.getAdventureNodes(adventureId);

        expect(nodes[0].isLocked).toBe(false);
        expect(nodes[1].isLocked).toBe(true);
    });

    it('should unlock the next node when the first is completed with stars', () => {
        const firstNodeKey = `${adventureId}_1`;
        const encounterResults = {
            [firstNodeKey]: { stars: 3 }
        };
        const slice = setupSlice(encounterResults);
        const nodes = slice.getAdventureNodes(adventureId);

        expect(nodes[0].isLocked).toBe(false);
        expect(nodes[0].stars).toBe(3);
        expect(nodes[1].isLocked).toBe(false);
        expect(nodes[2].isLocked).toBe(true);
    });

    it('should keep completed nodes unlocked even if they are not the latest', () => {
        const encounterResults = {
            [`${adventureId}_1`]: { stars: 3 },
            [`${adventureId}_2`]: { stars: 2 },
            [`${adventureId}_3`]: { stars: 1 },
        };
        const slice = setupSlice(encounterResults);
        const nodes = slice.getAdventureNodes(adventureId);

        expect(nodes[1].isLocked).toBe(false);
        expect(nodes[1].stars).toBe(2);
    });



    it('should correct the bug: Replaying Node 1 should not lock Node 3 if Node 2 is completed', () => {
        const node3Key = `${adventureId}_3`;
        const encounterResults = {
            [node3Key]: { stars: 3 }
        };

        const slice = setupSlice(encounterResults);
        const nodes = slice.getAdventureNodes(adventureId);

        expect(nodes[2].isLocked).toBe(false);
    });

    it('should return empty array for unknown adventure ID', () => {
        const slice = setupSlice({});
        const nodes = slice.getAdventureNodes('nonexistent-adventure');
        expect(nodes).toEqual([]);
    });
});
