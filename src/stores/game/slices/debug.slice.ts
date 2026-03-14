import type { StateCreator } from 'zustand';
import type { GameStore, DebugSlice } from '../interfaces';
import { COMPANIONS } from '../../../data/companions.data';
import { ADVENTURES } from '../../../data/adventures.data';
import { EncounterType } from '../../../types/adventure.types';

export const createDebugSlice: StateCreator<GameStore, [], [], DebugSlice> = (set, get) => ({

    debugResetCompanions: () => {
        set({
            companionStats: Object.keys(COMPANIONS).reduce((acc, id) => {
                acc[id] = { level: 1, experience: 0 };
                return acc;
            }, {} as Record<string, { level: number; experience: number }>)
        });
    },

    debugResetEncounterResults: () => set({ encounterResults: {} }),

    debugSetCompanionLevel: (companionId, level) => {
        const { companionStats } = get();
        set({
            companionStats: {
                ...companionStats,
                [companionId]: {
                    ...companionStats[companionId],
                    level
                }
            }
        });
    },

    debugSetEncounterStars: (adventureId, nodeIndex, stars) => {
        const { encounterResults } = get();
        const key = `${adventureId}_${nodeIndex}`;
        set({
            encounterResults: {
                ...encounterResults,
                [key]: { stars }
            }
        });
    },

    debugSetAdventureStars: (adventureId, stars) => {
        const adventure = ADVENTURES.find(a => a.id === adventureId);
        if (!adventure) return;

        const { encounterResults } = get();
        const updates: typeof encounterResults = {};

        adventure.encounters.forEach((encounter, index) => {
            if (encounter.type === EncounterType.ENDING) return;
            const key = `${adventureId}_${index + 1}`;
            updates[key] = { stars };
        });

        set({ encounterResults: { ...encounterResults, ...updates } });
    }
});
