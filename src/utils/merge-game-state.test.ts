import { describe, it, expect } from 'vitest';
import { mergeGameState } from './merge-game-state';
import { AdventureStatus } from '../types/adventure.types';
import type { GameState } from '../stores/game/interfaces';

/** Minimal valid GameState for test setup. */
const base = (overrides: Partial<GameState> = {}): GameState => ({
    activeParty: [],
    encounterResults: {},
    activeEncounterDifficulty: 1,
    companionStats: {},
    adventureStatuses: {},
    ...overrides,
});

describe('mergeGameState', () => {
    // ------------------------------------------------------------------ //
    // encounterResults
    // ------------------------------------------------------------------ //
    describe('encounterResults', () => {
        it('keeps primary encounter result when secondary has none', () => {
            const primary = base({
                encounterResults: { '1_1': { stars: 3, difficulty: 3, completedAt: 100 } },
            });
            const result = mergeGameState(primary, base());
            expect(result.encounterResults['1_1'].stars).toBe(3);
        });

        it('keeps secondary encounter result when primary has none', () => {
            const secondary = base({
                encounterResults: { '1_1': { stars: 2, difficulty: 2, completedAt: 100 } },
            });
            const result = mergeGameState(base(), secondary);
            expect(result.encounterResults['1_1'].stars).toBe(2);
        });

        it('keeps higher stars when primary has better result', () => {
            const primary = base({
                encounterResults: { '1_1': { stars: 3, difficulty: 3, completedAt: 200 } },
            });
            const secondary = base({
                encounterResults: { '1_1': { stars: 1, difficulty: 1, completedAt: 100 } },
            });
            const result = mergeGameState(primary, secondary);
            expect(result.encounterResults['1_1'].stars).toBe(3);
        });

        it('keeps higher stars when secondary has better result', () => {
            const primary = base({
                encounterResults: { '1_1': { stars: 1, difficulty: 1, completedAt: 100 } },
            });
            const secondary = base({
                encounterResults: { '1_1': { stars: 3, difficulty: 3, completedAt: 200 } },
            });
            const result = mergeGameState(primary, secondary);
            expect(result.encounterResults['1_1'].stars).toBe(3);
        });

        it('keeps most recent when stars are equal (primary newer)', () => {
            const primary = base({
                encounterResults: { '1_1': { stars: 2, difficulty: 2, completedAt: 300 } },
            });
            const secondary = base({
                encounterResults: { '1_1': { stars: 2, difficulty: 2, completedAt: 100 } },
            });
            const result = mergeGameState(primary, secondary);
            expect(result.encounterResults['1_1'].completedAt).toBe(300);
        });

        it('keeps secondary when stars are equal but secondary is more recent', () => {
            const primary = base({
                encounterResults: { '1_1': { stars: 2, difficulty: 2, completedAt: 100 } },
            });
            const secondary = base({
                encounterResults: { '1_1': { stars: 2, difficulty: 2, completedAt: 300 } },
            });
            const result = mergeGameState(primary, secondary);
            expect(result.encounterResults['1_1'].completedAt).toBe(300);
        });

        it('includes encounters only in secondary', () => {
            const secondary = base({
                encounterResults: { '2_1': { stars: 2, difficulty: 2, completedAt: 100 } },
            });
            const result = mergeGameState(base(), secondary);
            expect(result.encounterResults['2_1']).toBeDefined();
        });

        it('includes encounters from both states (union)', () => {
            const primary = base({
                encounterResults: { '1_1': { stars: 3, difficulty: 3, completedAt: 100 } },
            });
            const secondary = base({
                encounterResults: { '2_1': { stars: 2, difficulty: 2, completedAt: 100 } },
            });
            const result = mergeGameState(primary, secondary);
            expect(result.encounterResults['1_1']).toBeDefined();
            expect(result.encounterResults['2_1']).toBeDefined();
        });
    });

    // ------------------------------------------------------------------ //
    // companionStats
    // ------------------------------------------------------------------ //
    describe('companionStats', () => {
        it('keeps primary companion stats when secondary has none', () => {
            const primary = base({ companionStats: { amara: { level: 3, experience: 50 } } });
            const result = mergeGameState(primary, base());
            expect(result.companionStats['amara']).toEqual({ level: 3, experience: 50 });
        });

        it('keeps secondary companion stats when primary has none', () => {
            const secondary = base({ companionStats: { amara: { level: 4, experience: 10 } } });
            const result = mergeGameState(base(), secondary);
            expect(result.companionStats['amara']).toEqual({ level: 4, experience: 10 });
        });

        it('keeps higher level from primary', () => {
            const primary = base({ companionStats: { amara: { level: 5, experience: 0 } } });
            const secondary = base({ companionStats: { amara: { level: 2, experience: 200 } } });
            const result = mergeGameState(primary, secondary);
            expect(result.companionStats['amara'].level).toBe(5);
        });

        it('keeps higher level from secondary', () => {
            const primary = base({ companionStats: { amara: { level: 2, experience: 200 } } });
            const secondary = base({ companionStats: { amara: { level: 5, experience: 0 } } });
            const result = mergeGameState(primary, secondary);
            expect(result.companionStats['amara'].level).toBe(5);
        });

        it('keeps higher experience when levels are equal', () => {
            const primary = base({ companionStats: { amara: { level: 3, experience: 80 } } });
            const secondary = base({ companionStats: { amara: { level: 3, experience: 20 } } });
            const result = mergeGameState(primary, secondary);
            expect(result.companionStats['amara'].experience).toBe(80);
        });

        it('keeps secondary experience when its experience is higher at same level', () => {
            const primary = base({ companionStats: { amara: { level: 3, experience: 10 } } });
            const secondary = base({ companionStats: { amara: { level: 3, experience: 90 } } });
            const result = mergeGameState(primary, secondary);
            expect(result.companionStats['amara'].experience).toBe(90);
        });

        it('includes companions from both states', () => {
            const primary = base({ companionStats: { amara: { level: 2, experience: 0 } } });
            const secondary = base({ companionStats: { tariq: { level: 3, experience: 0 } } });
            const result = mergeGameState(primary, secondary);
            expect(result.companionStats['amara']).toBeDefined();
            expect(result.companionStats['tariq']).toBeDefined();
        });
    });

    // ------------------------------------------------------------------ //
    // activeParty
    // ------------------------------------------------------------------ //
    describe('activeParty', () => {
        it('unions both parties', () => {
            const primary = base({ activeParty: ['amara', 'kenji'] });
            const secondary = base({ activeParty: ['amara', 'tariq'] });
            const result = mergeGameState(primary, secondary);
            expect(result.activeParty).toContain('amara');
            expect(result.activeParty).toContain('kenji');
            expect(result.activeParty).toContain('tariq');
        });

        it('does not duplicate companions', () => {
            const primary = base({ activeParty: ['amara'] });
            const secondary = base({ activeParty: ['amara'] });
            const result = mergeGameState(primary, secondary);
            expect(result.activeParty.filter(id => id === 'amara').length).toBe(1);
        });

        it('includes companions only in primary', () => {
            const primary = base({ activeParty: ['kenji'] });
            const result = mergeGameState(primary, base());
            expect(result.activeParty).toContain('kenji');
        });

        it('includes companions only in secondary', () => {
            const secondary = base({ activeParty: ['zahara'] });
            const result = mergeGameState(base(), secondary);
            expect(result.activeParty).toContain('zahara');
        });
    });

    // ------------------------------------------------------------------ //
    // adventureStatuses
    // ------------------------------------------------------------------ //
    describe('adventureStatuses', () => {
        it('keeps COMPLETED over AVAILABLE', () => {
            const primary = base({ adventureStatuses: { '1': AdventureStatus.COMPLETED } });
            const secondary = base({ adventureStatuses: { '1': AdventureStatus.AVAILABLE } });
            expect(mergeGameState(primary, secondary).adventureStatuses['1']).toBe(AdventureStatus.COMPLETED);
            expect(mergeGameState(secondary, primary).adventureStatuses['1']).toBe(AdventureStatus.COMPLETED);
        });

        it('keeps COMPLETED over LOCKED', () => {
            const primary = base({ adventureStatuses: { '2': AdventureStatus.COMPLETED } });
            const secondary = base({ adventureStatuses: { '2': AdventureStatus.LOCKED } });
            expect(mergeGameState(primary, secondary).adventureStatuses['2']).toBe(AdventureStatus.COMPLETED);
        });

        it('keeps AVAILABLE over LOCKED', () => {
            const primary = base({ adventureStatuses: { '3': AdventureStatus.AVAILABLE } });
            const secondary = base({ adventureStatuses: { '3': AdventureStatus.LOCKED } });
            expect(mergeGameState(primary, secondary).adventureStatuses['3']).toBe(AdventureStatus.AVAILABLE);
        });

        it('keeps LOCKED when both are LOCKED', () => {
            const primary = base({ adventureStatuses: { '4': AdventureStatus.LOCKED } });
            const secondary = base({ adventureStatuses: { '4': AdventureStatus.LOCKED } });
            expect(mergeGameState(primary, secondary).adventureStatuses['4']).toBe(AdventureStatus.LOCKED);
        });

        it('keeps secondary when primary has lower rank (secondary has higher rank)', () => {
            const primary = base({ adventureStatuses: { '3': AdventureStatus.LOCKED } });
            const secondary = base({ adventureStatuses: { '3': AdventureStatus.AVAILABLE } });
            expect(mergeGameState(primary, secondary).adventureStatuses['3']).toBe(AdventureStatus.AVAILABLE);
        });

        it('includes adventures only in secondary', () => {
            const secondary = base({ adventureStatuses: { '4': AdventureStatus.AVAILABLE } });
            const result = mergeGameState(base(), secondary);
            expect(result.adventureStatuses['4']).toBe(AdventureStatus.AVAILABLE);
        });

        it('includes adventures only in primary (secondary missing that adventure)', () => {
            const primary = base({ adventureStatuses: { '5': AdventureStatus.COMPLETED } });
            // secondary doesn't have adventure '5'
            const secondary = base({ adventureStatuses: {} });
            const result = mergeGameState(primary, secondary);
            // primary '5' should appear (other !== undefined becomes false → otherRank = -1)
            expect(result.adventureStatuses['5']).toBe(AdventureStatus.COMPLETED);
        });
    });

    // ------------------------------------------------------------------ //
    // activeEncounterDifficulty
    // ------------------------------------------------------------------ //
    describe('activeEncounterDifficulty', () => {
        it('keeps primary value (session preference)', () => {
            const primary = base({ activeEncounterDifficulty: 3 });
            const secondary = base({ activeEncounterDifficulty: 1 });
            expect(mergeGameState(primary, secondary).activeEncounterDifficulty).toBe(3);
        });
    });

    // ------------------------------------------------------------------ //
    // Partial secondary (missing optional fields) - covers ?? defaults
    // ------------------------------------------------------------------ //
    describe('partial secondary', () => {
        it('handles secondary with no companionStats, activeParty, or adventureStatuses', () => {
            const primary = base({
                activeParty: ['hero1'],
                companionStats: { hero1: { level: 2, experience: 50 } },
                adventureStatuses: { '1': AdventureStatus.AVAILABLE },
            });
            // Only provide encounterResults in secondary (all other fields are undefined/missing)
            const partialSecondary: Partial<GameState> = { encounterResults: {} };
            const result = mergeGameState(primary, partialSecondary);

            // Primary values preserved
            expect(result.activeParty).toContain('hero1');
            expect(result.companionStats['hero1'].level).toBe(2);
            expect(result.adventureStatuses['1']).toBe(AdventureStatus.AVAILABLE);
        });
    });
    // ------------------------------------------------------------------ //
    describe('full scenario — concurrent sessions', () => {
        it('should never lose progress when merging two advanced states', () => {
            const sessionA = base({
                activeParty: ['amara', 'tariq', 'kenji'],
                companionStats: {
                    amara: { level: 5, experience: 60 },
                    tariq: { level: 4, experience: 20 },
                    kenji: { level: 3, experience: 0 },
                },
                encounterResults: {
                    '1_1': { stars: 3, difficulty: 3, completedAt: 200 },
                    '1_2': { stars: 2, difficulty: 2, completedAt: 210 },
                },
                adventureStatuses: {
                    '1': AdventureStatus.COMPLETED,
                    '2': AdventureStatus.AVAILABLE,
                },
            });

            const sessionB = base({
                activeParty: ['amara', 'tariq', 'zahara'],
                companionStats: {
                    amara: { level: 5, experience: 60 },
                    tariq: { level: 5, experience: 10 }, // tariq is higher here
                    zahara: { level: 2, experience: 0 },
                },
                encounterResults: {
                    '1_1': { stars: 1, difficulty: 1, completedAt: 100 }, // older/worse
                    '2_1': { stars: 3, difficulty: 3, completedAt: 300 }, // only in B
                },
                adventureStatuses: {
                    '1': AdventureStatus.COMPLETED,
                    '2': AdventureStatus.COMPLETED, // more advanced in B
                    '3': AdventureStatus.AVAILABLE,
                },
            });

            const merged = mergeGameState(sessionA, sessionB);

            // All companions present
            expect(merged.activeParty).toContain('kenji');
            expect(merged.activeParty).toContain('zahara');

            // Best encounter stars kept
            expect(merged.encounterResults['1_1'].stars).toBe(3);
            expect(merged.encounterResults['2_1'].stars).toBe(3);
            expect(merged.encounterResults['1_2'].stars).toBe(2);

            // Max companion levels
            expect(merged.companionStats['tariq'].level).toBe(5); // B wins
            expect(merged.companionStats['amara'].level).toBe(5);

            // Most advanced adventure statuses
            expect(merged.adventureStatuses['2']).toBe(AdventureStatus.COMPLETED);
            expect(merged.adventureStatuses['3']).toBe(AdventureStatus.AVAILABLE);
        });
    });
});
