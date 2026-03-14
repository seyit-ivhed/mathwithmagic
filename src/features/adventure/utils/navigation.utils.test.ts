import { describe, it, expect, vi } from 'vitest';
import { getHighestUnlockedAdventure, getFocalNodeIndex } from './navigation.utils';
import { AdventureStatus, type AdventureId } from '../../../types/adventure.types';
import type { EncounterResult } from '../../../stores/game/interfaces';

// Mock ADVENTURES data to have a controlled test environment
vi.mock('../../../data/adventures.data', () => ({
    ADVENTURES: [
        {
            id: '1',
            encounters: [{ id: '1_1' }, { id: '1_2' }]
        },
        {
            id: '2',
            encounters: [{ id: '2_1' }, { id: '2_2' }, { id: '2_3' }]
        },
        {
            id: '3',
            encounters: [{ id: '3_1' }]
        },
        {
            id: '4',
            encounters: []
        }
    ]
}));

describe('navigation.utils', () => {
    describe('getHighestUnlockedAdventure', () => {
        it('should return the furthest unlocked adventure (backwards search)', () => {
            const statuses = {
                '1': AdventureStatus.AVAILABLE,
                '2': AdventureStatus.LOCKED,
            } as Record<AdventureId, AdventureStatus>;

            const result = getHighestUnlockedAdventure(statuses);
            expect(result).toEqual({ adventureId: '1' });
        });

        it('should find the furthest even if there are gaps (though rare in practice)', () => {
            const statuses = {
                '1': AdventureStatus.LOCKED,
                '2': AdventureStatus.AVAILABLE,
            } as Record<AdventureId, AdventureStatus>;

            const result = getHighestUnlockedAdventure(statuses);
            expect(result).toEqual({ adventureId: '2' });
        });

        it('should treat COMPLETED and AVAILABLE as unlocked', () => {
            const statuses = {
                '1': AdventureStatus.COMPLETED,
            } as Record<AdventureId, AdventureStatus>;

            const result = getHighestUnlockedAdventure(statuses);
            expect(result).toEqual({ adventureId: '1' });
        });

        it('should return correct adventureId from adventure data', () => {
            const statuses = {
                '1': AdventureStatus.COMPLETED,
                '2': AdventureStatus.COMPLETED,
                '3': AdventureStatus.AVAILABLE,
            } as Record<AdventureId, AdventureStatus>;

            const result = getHighestUnlockedAdventure(statuses);
            expect(result).toEqual({ adventureId: '3' });
        });

        it('should return default adventure if no status found', () => {
            const result = getHighestUnlockedAdventure({} as Record<AdventureId, AdventureStatus>);
            expect(result).toEqual({ adventureId: '1' });
        });
    });

    describe('getFocalNodeIndex', () => {
        const mockEncounterResult = { stars: 3 };

        it('should return 1 if no encounters are completed for the adventure', () => {
            const encounterResults = {
                'other_adv_1': mockEncounterResult
            };
            const result = getFocalNodeIndex('1', encounterResults as Record<string, EncounterResult>);
            expect(result).toBe(1);
        });

        it('should return maxCompleted + 1 if some encounters are completed', () => {
            const encounterResults = {
                '1_1': mockEncounterResult
            };
            const result = getFocalNodeIndex('1', encounterResults as Record<string, EncounterResult>);
            expect(result).toBe(2);
        });

        it('should correctly identify max index from multiple completed nodes', () => {
            const encounterResults = {
                '2_1': mockEncounterResult,
                '2_2': mockEncounterResult
            };
            const result = getFocalNodeIndex('2', encounterResults as Record<string, EncounterResult>);
            expect(result).toBe(3);
        });

        it('should clamp to total encounter count if the last node is completed', () => {
            const encounterResults = {
                '1_1': mockEncounterResult,
                '1_2': mockEncounterResult
            };
            // Adventure '1' has 2 encounters in mock
            const result = getFocalNodeIndex('1', encounterResults as Record<string, EncounterResult>);
            expect(result).toBe(2);
        });

        it('should handle non-sequential completions (though rare)', () => {
            const encounterResults = {
                '2_1': mockEncounterResult,
                '2_3': mockEncounterResult
            };
            const result = getFocalNodeIndex('2', encounterResults as Record<string, EncounterResult>);
            expect(result).toBe(3); // Adventure '2' has 3 encounters, so 3+1 would be 4, clamped to 3
        });

        it('should return 1 if adventureId is not found in ADVENTURES', () => {
            const result = getFocalNodeIndex('invalid_id', {});
            expect(result).toBe(1);
        });

        it('should be robust against malformed keys in encounterResults', () => {
            const encounterResults = {
                '1_nan': mockEncounterResult,
                '1_2': mockEncounterResult,
                'random_key': mockEncounterResult
            };
            const result = getFocalNodeIndex('1', encounterResults as Record<string, EncounterResult>);
            expect(result).toBe(2); // Since 1_2 is the only valid number index found
        });
    });
});
