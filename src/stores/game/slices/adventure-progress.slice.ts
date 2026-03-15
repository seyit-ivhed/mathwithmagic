import type { StateCreator } from 'zustand';
import type { GameStore, AdventureProgressSlice } from '../interfaces';
import { ADVENTURES } from '../../../data/adventures.data';
import { PersistenceService } from '../../../services/persistence.service';
import { EncounterType } from '../../../types/adventure.types';

export const createAdventureProgressSlice: StateCreator<GameStore, [], [], AdventureProgressSlice> = (set, get) => ({
    completeEncounter: (adventureId, nodeIndex) => {
        const { encounterResults } = get();

        const adventure = ADVENTURES.find(a => a.id === adventureId);

        if (!adventure) {
            return;
        }

        const encounter = adventure.encounters[nodeIndex - 1];

        // Unique key for this encounter
        const encounterKey = `${adventureId}_${nodeIndex}`;
        const existingResult = encounterResults[encounterKey];

        // Update encounter results ONLY for rated types (Battle, Boss, Puzzle)
        const isRatedType = encounter?.type !== EncounterType.ENDING;

        if (isRatedType) {
            const { activeEncounterDifficulty } = get();
            const newStars = activeEncounterDifficulty;
            const shouldUpdateResult = !existingResult || newStars > existingResult.stars;

            if (shouldUpdateResult) {
                set({
                    encounterResults: {
                        ...encounterResults,
                        [encounterKey]: { stars: newStars },
                    }
                });
            }
        }

        // Trigger cloud sync
        PersistenceService.sync(get());
    },

    notifyEncounterStarted: (adventureId, nodeIndex) => {
        const { addCompanionToParty } = get();
        const adventure = ADVENTURES.find(a => a.id === adventureId);
        if (!adventure) {
            console.error(`Adventure not found: ${adventureId} in notifyEncounterStarted`);
            return;
        }

        const encounter = adventure.encounters[nodeIndex - 1];
        if (encounter?.unlocksCompanion) {
            addCompanionToParty(encounter.unlocksCompanion);
        }
    },

    setEncounterDifficulty: (difficulty) => {
        if (typeof difficulty !== 'number') {
            console.error('Invalid difficulty provided to setEncounterDifficulty');
            return;
        }
        set({ activeEncounterDifficulty: difficulty });
    },

    getAdventureNodes: (adventureId) => {
        const { encounterResults } = get();
        const adventure = ADVENTURES.find(a => a.id === adventureId);

        if (!adventure) {
            return [];
        }

        let lastUnlockedNodeCompleted = true; // First node is always unlocked

        return adventure.encounters.map((node, index) => {
            const nodeStep = index + 1;
            const encounterKey = `${adventureId}_${nodeStep}`;
            const result = encounterResults[encounterKey];
            const stars = result?.stars || 0;
            const isCompleted = stars > 0;
            const isLocked = !isCompleted && !lastUnlockedNodeCompleted;

            if (node.type !== EncounterType.ENDING) {
                // This is a "blocker" node. If it's not completed, the *next* node will be locked.
                lastUnlockedNodeCompleted = isCompleted;
            }

            return {
                ...node,
                isLocked,
                stars
            };
        });
    }
});
