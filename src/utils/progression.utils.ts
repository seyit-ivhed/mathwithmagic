import type { Companion, CompanionStats } from '../types/companion.types';
import { EXPERIENCE_CONFIG } from '../data/experience.data';
import { EncounterType, type Encounter } from '../types/adventure.types';
import type { EncounterResult } from '../stores/game/interfaces';

/**
 * Calculates the stats for a companion at a specific level.
 * @param companion The companion to calculate stats for
 * @param level The target level
 * @returns Calculated CompanionStats
 */
export const getStatsForLevel = (companion: Companion, level: number): CompanionStats => {
    if (!companion) {
        console.error('Companion is missing in getStatsForLevel');
        throw new Error('Companion is required');
    }
    if (typeof level !== 'number') {
        console.error(`Invalid level type: ${typeof level} in getStatsForLevel`);
        throw new Error('Level must be a number');
    }

    // Basic linear scaling: 10% increase per level from base
    const scalingFactor = 1 + (level - 1) * EXPERIENCE_CONFIG.STAT_SCALING_FACTOR;

    // Check for evolutions up to this level
    const evolutionBonus: CompanionStats = {
        maxHealth: 0,
        abilityDamage: 0
    };

    // Keep track of the latest evolution milestone reached
    const currentEvolution = companion.evolutions
        .filter(evo => level >= evo.atLevel)
        .sort((a, b) => b.atLevel - a.atLevel)[0];

    // Apply evolution stats bonus
    if (currentEvolution && currentEvolution.statsBonus) {
        evolutionBonus.maxHealth = currentEvolution.statsBonus.maxHealth || 0;
        evolutionBonus.abilityDamage = currentEvolution.statsBonus.abilityDamage || 0;
    }

    // Build the evolved ability (checking all steps)
    let evolvedAbility = companion.specialAbility;
    companion.evolutions.forEach(evo => {
        if (level >= evo.atLevel && evo.newSpecialAbility) {
            evolvedAbility = evo.newSpecialAbility;
        }
    });

    // Scale variables if they exist
    const scaledVariables: Record<string, number> = {};
    if (evolvedAbility.variables) {
        Object.entries(evolvedAbility.variables).forEach(([key, value]) => {
            if (key === 'duration' || key === 'reduction') {
                scaledVariables[key] = value;
            } else {
                scaledVariables[key] = Math.floor(value * scalingFactor);
            }
        });
    }

    return {
        maxHealth: Math.floor(companion.baseStats.maxHealth * scalingFactor) + (evolutionBonus.maxHealth || 0),
        title: currentEvolution ? currentEvolution.title : companion.title,
        abilityDamage: companion.baseStats.abilityDamage ? Math.floor(companion.baseStats.abilityDamage * scalingFactor) + (evolutionBonus.abilityDamage || 0) : undefined,
        specialAbilityId: evolvedAbility.id,
        specialAbilityVariables: scaledVariables,
        evolutionIndex: currentEvolution ? currentEvolution.evolutionIndex : companion.baseStats.evolutionIndex
    };
};


export const getEvolutionAtLevel = (companion: Companion, level: number) => {
    // Find the highest evolution milestone passed
    // But usually we just want to know if there is a NEW evolution at this specific level
    return companion.evolutions.find(e => e.atLevel === level);
};

/**
 * Calculates the overall star rating for an adventure based on its scorable encounters.
 * The chapter stars are designated by the encounter with the least stars.
 */
export const calculateAdventureStars = (
    adventureId: string,
    encounters: Encounter[],
    encounterResults: Record<string, EncounterResult>
): number => {
    if (!adventureId) {
        console.error('adventureId is missing in calculateAdventureStars');
        return 0;
    }
    if (!encounters) {
        console.error('encounters missing in calculateAdventureStars');
        return 0;
    }
    if (!encounterResults) {
        console.error('encounterResults missing in calculateAdventureStars');
        return 0;
    }

    let minStars = 3;
    let hasScorableEncounters = false;

    encounters.forEach((encounter, index) => {
        // Only count Battle, Boss, and Puzzle encounters
        if (encounter.type === EncounterType.BATTLE ||
            encounter.type === EncounterType.BOSS ||
            encounter.type === EncounterType.PUZZLE) {

            hasScorableEncounters = true;
            const encounterKey = `${adventureId}_${index + 1}`;
            const result = encounterResults[encounterKey];

            // If any encounter is not completed or has 0 stars, the chapter stars will be low
            const stars = result ? result.stars : 0;
            if (stars < minStars) {
                minStars = stars;
            }
        }
    });

    return hasScorableEncounters ? minStars : 0;
};

/**
 * Checks if a companion should earn experience in a given adventure.
 * @param currentLevel The companion's current level
 * @param adventureMaxLevel The maximum level for the adventure
 * @returns true if the companion should earn experience
 */
export const canEarnExperience = (currentLevel: number, adventureMaxLevel: number): boolean => {
    return currentLevel < adventureMaxLevel;
};
