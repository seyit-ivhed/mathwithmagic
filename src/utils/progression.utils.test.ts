import { getStatsForLevel, calculateAdventureStars, canEarnExperience, getEvolutionAtLevel } from './progression.utils';
import type { Companion } from '../types/companion.types';
import { EncounterType, type Encounter } from '../types/adventure.types';
import type { EncounterResult } from '../stores/game/interfaces';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

describe('progression.utils', () => {
    beforeEach(() => {
        vi.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });
    describe('getStatsForLevel', () => {
        const mockCompanion = {
            id: 'test',
            name: 'Test',
            baseStats: {
                maxHealth: 100,
                abilityDamage: 10,
                evolutionIndex: 1
            },
            specialAbility: {
                id: 'test_ultimate',
                variables: { damage: 50 }
            },
            evolutions: []
        } as unknown as Companion;

        it('should return base stats at level 1', () => {
            const stats = getStatsForLevel(mockCompanion, 1);
            expect(stats.maxHealth).toBe(100);
            expect(stats.abilityDamage).toBe(10);
            expect(stats.specialAbilityVariables!.damage).toBe(50);
            expect(stats.evolutionIndex).toBe(1);
        });

        it('should scale stats linearly (10% per level)', () => {
            const stats = getStatsForLevel(mockCompanion, 2);
            // 1 + (2-1)*0.1 = 1.1
            expect(stats.maxHealth).toBe(110);
            expect(stats.abilityDamage).toBe(11);
            expect(stats.specialAbilityVariables!.damage).toBe(55);
            expect(stats.evolutionIndex).toBe(1);
        });

        it('should handle level 10 scaling', () => {
            const stats = getStatsForLevel(mockCompanion, 10);
            // 1 + (10-1)*0.1 = 1.9
            expect(stats.maxHealth).toBe(190);
            expect(stats.abilityDamage).toBe(19);
            expect(stats.specialAbilityVariables!.damage).toBe(95);
            expect(stats.evolutionIndex).toBe(1);
        });

        it('should apply evolution bonuses', () => {
            const companionWithEvo = {
                ...mockCompanion,
                evolutions: [
                    {
                        atLevel: 5,
                        title: 'Evolved',
                        evolutionIndex: 2,
                        statsBonus: {
                            maxHealth: 20,
                            abilityDamage: 5
                        }
                    }
                ]
            } as unknown as Companion;

            const statsLvl4 = getStatsForLevel(companionWithEvo, 4);
            const statsLvl5 = getStatsForLevel(companionWithEvo, 5);

            // Lvl 4: 1 + 0.3 = 1.3 -> 130 HP, 13 DMG
            expect(statsLvl4.maxHealth).toBe(130);
            expect(statsLvl4.abilityDamage).toBe(13);
            expect(statsLvl4.evolutionIndex).toBe(1);

            // Lvl 5: 1 + 0.4 = 1.4 -> 140 HP + 20 = 160 HP, 14 DMG + 5 = 19 DMG
            expect(statsLvl5.maxHealth).toBe(160);
            expect(statsLvl5.abilityDamage).toBe(19);
            expect(statsLvl5.evolutionIndex).toBe(2);
        });
        it('should throw error if companion is missing', () => {
            expect(() => getStatsForLevel(null as unknown as Companion, 1)).toThrow('Companion is required');
            expect(console.error).toHaveBeenCalledWith('Companion is missing in getStatsForLevel');
        });

        it('should throw error if level is not a number', () => {
            expect(() => getStatsForLevel(mockCompanion, '1' as unknown as number)).toThrow('Level must be a number');
            expect(console.error).toHaveBeenCalledWith('Invalid level type: string in getStatsForLevel');
        });

        it('should not scale duration or reduction variables', () => {
            const companionWithSpecialVars = {
                ...mockCompanion,
                specialAbility: {
                    id: 'test_ability',
                    variables: {
                        damage: 10,
                        duration: 5,
                        reduction: 20
                    }
                }
            } as unknown as Companion;

            const stats = getStatsForLevel(companionWithSpecialVars, 2);
            // 1.1 scaling factor
            expect(stats.specialAbilityVariables!.damage).toBe(11);
            expect(stats.specialAbilityVariables!.duration).toBe(5);
            expect(stats.specialAbilityVariables!.reduction).toBe(20);
        });

        it('should handle missing abilityDamage in baseStats', () => {
            const companionNoDamage = {
                ...mockCompanion,
                baseStats: { maxHealth: 100, evolutionIndex: 1 }
            } as unknown as Companion;

            const stats = getStatsForLevel(companionNoDamage, 2);
            expect(stats.abilityDamage).toBeUndefined();
        });

        it('should apply default values for missing evolution stats bonuses', () => {
            const companionWithPartialEvo = {
                ...mockCompanion,
                evolutions: [
                    {
                        atLevel: 2,
                        title: 'Partial Evolved',
                        evolutionIndex: 2,
                        statsBonus: {}
                    }
                ]
            } as unknown as Companion;

            const stats = getStatsForLevel(companionWithPartialEvo, 2);
            // 1.1 scaling -> 110 HP, 11 DMG. No bonus added.
            expect(stats.maxHealth).toBe(110);
            expect(stats.abilityDamage).toBe(11);
            expect(stats.evolutionIndex).toBe(2);
        });

        it('should handle multiple evolutions and new special abilities', () => {
            const companionWithMultipleEvos = {
                ...mockCompanion,
                evolutions: [
                    {
                        atLevel: 5,
                        title: 'Evo 1',
                        evolutionIndex: 2,
                        statsBonus: { maxHealth: 10 }
                    },
                    {
                        atLevel: 10,
                        title: 'Evo 2',
                        evolutionIndex: 3,
                        newSpecialAbility: { id: 'super_ability', variables: { power: 100 } },
                        statsBonus: { maxHealth: 50 }
                    }
                ]
            } as unknown as Companion;

            const stats = getStatsForLevel(companionWithMultipleEvos, 10);
            // 1.9 scaling factor
            // MaxHealth: 100 * 1.9 + 50 = 240
            expect(stats.maxHealth).toBe(240);
            expect(stats.title).toBe('Evo 2');
            expect(stats.specialAbilityId).toBe('super_ability');
            expect(stats.specialAbilityVariables!.power).toBe(190);
            expect(stats.evolutionIndex).toBe(3);
        });

        it('should handle special ability with no variables', () => {
            const companionNoVars = {
                ...mockCompanion,
                specialAbility: { id: 'no_vars' }
            } as unknown as Companion;

            const stats = getStatsForLevel(companionNoVars, 1);
            expect(stats.specialAbilityVariables).toEqual({});
        });
    });

    describe('getEvolutionAtLevel', () => {
        const mockCompanion = {
            evolutions: [
                { atLevel: 5, title: 'Evo 1' },
                { atLevel: 10, title: 'Evo 2' }
            ]
        } as unknown as Companion;

        it('should return evolution if it exists at the exact level', () => {
            const evo = getEvolutionAtLevel(mockCompanion, 5);
            expect(evo?.title).toBe('Evo 1');
        });

        it('should return undefined if no evolution exists at the level', () => {
            const evo = getEvolutionAtLevel(mockCompanion, 6);
            expect(evo).toBeUndefined();
        });
    });

    describe('calculateAdventureStars', () => {
        const mockEncounters = [
            { id: '1', type: EncounterType.BATTLE },
            { id: '2', type: EncounterType.PUZZLE },
            { id: '3', type: EncounterType.BOSS }
        ] as unknown as Encounter[];

        it('should return 0 and log error if adventureId is missing', () => {
            const result = calculateAdventureStars('', [], {});
            expect(result).toBe(0);
            expect(console.error).toHaveBeenCalledWith('adventureId is missing in calculateAdventureStars');
        });

        it('should return 0 and log error if encounters is missing', () => {
            const result = calculateAdventureStars('adv1', null as unknown as Encounter[], {});
            expect(result).toBe(0);
            expect(console.error).toHaveBeenCalledWith('encounters missing in calculateAdventureStars');
        });

        it('should return 0 and log error if encounterResults is missing', () => {
            const result = calculateAdventureStars('adv1', [], null as unknown as Record<string, EncounterResult>);
            expect(result).toBe(0);
            expect(console.error).toHaveBeenCalledWith('encounterResults missing in calculateAdventureStars');
        });

        it('should return 3 stars if all scorable encounters have 3 stars', () => {
            const results = {
                'adv1_1': { stars: 3 },
                'adv1_2': { stars: 3 },
                'adv1_3': { stars: 3 }
            } as unknown as Record<string, EncounterResult>;
            const result = calculateAdventureStars('adv1', mockEncounters, results);
            expect(result).toBe(3);
        });

        it('should return the minimum stars among scorable encounters', () => {
            const results = {
                'adv1_1': { stars: 3 },
                'adv1_2': { stars: 2 },
                'adv1_3': { stars: 3 }
            } as unknown as Record<string, EncounterResult>;
            const result = calculateAdventureStars('adv1', mockEncounters, results);
            expect(result).toBe(2);
        });

        it('should return 0 stars if a scorable encounter is missing from results (uncompleted)', () => {
            const results = {
                'adv1_1': { stars: 3 },
                'adv1_3': { stars: 3 }
                // adv1_2 is missing
            } as unknown as Record<string, EncounterResult>;
            const result = calculateAdventureStars('adv1', mockEncounters, results);
            expect(result).toBe(0);
        });

        it('should return 0 if there are no scorable encounters', () => {
            const nonScorableEncounters = [
                { id: '1', type: EncounterType.STORY }
            ] as unknown as Encounter[];
            const result = calculateAdventureStars('adv1', nonScorableEncounters, {});
            expect(result).toBe(0);
        });
    });

    describe('canEarnExperience', () => {
        it('should return true if companion level is below adventure max level', () => {
            expect(canEarnExperience(1, 5)).toBe(true);
            expect(canEarnExperience(4, 5)).toBe(true);
        });

        it('should return false if companion level is at adventure max level', () => {
            expect(canEarnExperience(5, 5)).toBe(false);
        });

        it('should return false if companion level is above adventure max level', () => {
            expect(canEarnExperience(6, 5)).toBe(false);
            expect(canEarnExperience(10, 5)).toBe(false);
        });
    });
});
