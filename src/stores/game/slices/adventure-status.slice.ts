import type { StateCreator } from 'zustand';
import type { GameStore, AdventureStatusSlice } from '../interfaces';
import { AdventureStatus, type AdventureId } from '../../../types/adventure.types';
import { ADVENTURES } from '../../../data/adventures.data';
import { PersistenceService } from '../../../services/persistence.service';

const INITIAL_ADVENTURE_STATUSES: Record<AdventureId, AdventureStatus> = {
    '1': AdventureStatus.AVAILABLE
};

export const createAdventureStatusSlice: StateCreator<GameStore, [], [], AdventureStatusSlice> = (set, get) => ({
    adventureStatuses: INITIAL_ADVENTURE_STATUSES,

    completeAdventure: (id: AdventureId) => {
        const { adventureStatuses } = get();

        // Mark current as completed
        const newStatuses = {
            ...adventureStatuses,
            [id]: AdventureStatus.COMPLETED
        };

        // Find and unlock next adventure
        const currentAdventureIndex = ADVENTURES.findIndex(m => m.id === id);
        if (currentAdventureIndex !== -1 && currentAdventureIndex < ADVENTURES.length - 1) {
            const nextAdventure = ADVENTURES[currentAdventureIndex + 1];
            // Only unlock if it's currently LOCKED (don't overwrite if already completed/available)
            if (!newStatuses[nextAdventure.id]) {
                newStatuses[nextAdventure.id] = AdventureStatus.AVAILABLE;
            }
        }

        set({ adventureStatuses: newStatuses });
        PersistenceService.sync(get());
    },

    unlockAdventure: (id: AdventureId) => {
        const { adventureStatuses } = get();
        set({
            adventureStatuses: {
                ...adventureStatuses,
                [id]: AdventureStatus.AVAILABLE
            }
        });
        PersistenceService.sync(get());
    },

    isAdventureUnlocked: (id: AdventureId) => {
        const status = get().adventureStatuses[id];
        return status === AdventureStatus.AVAILABLE || status === AdventureStatus.COMPLETED;
    },

    resetGameProgress: (nextDifficulty: number) => {
        set({
            encounterResults: {},
            adventureStatuses: INITIAL_ADVENTURE_STATUSES,
            activeEncounterDifficulty: nextDifficulty,
        });
        PersistenceService.sync(get());
    },
});
