import { describe, it, expect, vi } from 'vitest';
import type { StoreApi } from 'zustand';
import { createAdventureStatusSlice } from './adventure-status.slice';
import { AdventureStatus } from '../../../types/adventure.types';
import { ADVENTURES } from '../../../data/adventures.data';
import type { GameStore } from '../interfaces';

const mockGet = (state: Partial<GameStore>) => () => state as GameStore;
const mockSet = vi.fn() as unknown as StoreApi<GameStore>['setState'];

describe('adventure-status.slice', () => {
    const setupSlice = (adventureStatuses: Record<string, AdventureStatus> = {}) => {
        const slice = createAdventureStatusSlice(
            mockSet,
            mockGet({ adventureStatuses }),
            {} as StoreApi<GameStore>
        );
        return slice;
    };

    it('should initialize with default adventure statuses', () => {
        const slice = setupSlice();
        expect(slice.adventureStatuses).toEqual({
            '1': AdventureStatus.AVAILABLE
        });
    });

    it('should complete an adventure and unlock the next one', () => {
        vi.mocked(mockSet).mockClear();
        const slice = setupSlice({
            '1': AdventureStatus.AVAILABLE
        });

        // Current adventure index for '1'
        const currentId = '1';
        const currentIndex = ADVENTURES.findIndex(a => a.id === currentId);
        const nextAdventure = ADVENTURES[currentIndex + 1];

        slice.completeAdventure(currentId);

        expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({
            adventureStatuses: expect.objectContaining({
                [currentId]: AdventureStatus.COMPLETED,
                [nextAdventure.id]: AdventureStatus.AVAILABLE
            })
        }));
    });

    it('should unlock a specific adventure', () => {
        vi.mocked(mockSet).mockClear();
        const slice = setupSlice({});

        slice.unlockAdventure('2');

        expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({
            adventureStatuses: expect.objectContaining({
                '2': AdventureStatus.AVAILABLE
            })
        }));
    });

    it('should correctly report if an adventure is unlocked', () => {
        const slice = setupSlice({
            '1': AdventureStatus.AVAILABLE,
            '2': AdventureStatus.COMPLETED,
            '3': AdventureStatus.LOCKED as AdventureStatus // Assuming not in Record means LOCKED
        });

        expect(slice.isAdventureUnlocked('1')).toBe(true);
        expect(slice.isAdventureUnlocked('2')).toBe(true);
        expect(slice.isAdventureUnlocked('3')).toBe(false);
    });

    it('should reset game progress and set next difficulty', () => {
        vi.mocked(mockSet).mockClear();
        const slice = createAdventureStatusSlice(
            mockSet,
            mockGet({
                adventureStatuses: { '1': AdventureStatus.COMPLETED, '2': AdventureStatus.COMPLETED },
                encounterResults: { '1_1': { stars: 2, difficulty: 2, completedAt: 1 } },
                activeEncounterDifficulty: 2,
            }),
            {} as StoreApi<GameStore>
        );

        slice.resetGameProgress(3);

        expect(mockSet).toHaveBeenCalledWith(expect.objectContaining({
            encounterResults: {},
            adventureStatuses: { '1': AdventureStatus.AVAILABLE },
            activeEncounterDifficulty: 3,
        }));
    });
});
