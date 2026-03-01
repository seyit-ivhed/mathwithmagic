import type { Companion } from '../types/companion.types';

export const EVOLUTION_LEVELS = {
    STAGE_1: 4,
    STAGE_2: 8,
    STAGE_3: 12,
} as const;

export const COMPANIONS: Record<string, Companion> = {
    'amara': {
        id: 'amara',
        name: 'Amara',
        title: 'companions.amara.title',
        level: 1,
        baseStats: {
            maxHealth: 75,
            abilityDamage: 8,
            attackSound: 'battle/arrow',
            evolutionIndex: 1
        },
        specialAbility: {
            id: 'precision_shot',
            variables: { damage: 30 },
            soundEffect: 'battle/arrow'
        },
        initialSpirit: 65,
        spiritGain: 35,
        evolutions: [
            {
                atLevel: EVOLUTION_LEVELS.STAGE_1,
                title: 'companions.amara.evolution_1',
                evolutionIndex: 2,
                statsBonus: {
                    maxHealth: 15,
                    abilityDamage: 4
                },
                newSpecialAbility: {
                    id: 'precision_shot',
                    variables: { damage: 45 },
                    soundEffect: 'battle/arrow'
                }
            },
            {
                atLevel: EVOLUTION_LEVELS.STAGE_2,
                title: 'companions.amara.evolution_2',
                evolutionIndex: 3,
                statsBonus: {
                    maxHealth: 20,
                    abilityDamage: 6
                },
                newSpecialAbility: {
                    id: 'precision_shot',
                    variables: { damage: 65 },
                    soundEffect: 'battle/arrow'
                }
            },
            {
                atLevel: EVOLUTION_LEVELS.STAGE_3,
                title: 'companions.amara.evolution_3',
                evolutionIndex: 4,
                statsBonus: {
                    maxHealth: 30,
                    abilityDamage: 10
                },
                newSpecialAbility: {
                    id: 'precision_shot',
                    variables: { damage: 100 },
                    soundEffect: 'battle/arrow'
                }
            }
        ]
    },
    'tariq': {
        id: 'tariq',
        name: 'Tariq',
        title: 'companions.tariq.title',
        level: 1,
        baseStats: {
            maxHealth: 85,
            abilityDamage: 5,
            attackSound: 'battle/travel-stick',
            evolutionIndex: 1
        },
        specialAbility: {
            id: 'elixir_of_life',
            variables: { heal: 25 },
            soundEffect: 'battle/health'
        },
        initialSpirit: 0,
        spiritGain: 35,
        evolutions: [
            {
                atLevel: EVOLUTION_LEVELS.STAGE_1,
                title: 'companions.tariq.evolution_1',
                evolutionIndex: 2,
                statsBonus: {
                    maxHealth: 15,
                    abilityDamage: 3
                },
                newSpecialAbility: {
                    id: 'elixir_of_life',
                    variables: { heal: 35 },
                    soundEffect: 'battle/health'
                }
            },
            {
                atLevel: EVOLUTION_LEVELS.STAGE_2,
                title: 'companions.tariq.evolution_2',
                evolutionIndex: 3,
                statsBonus: {
                    maxHealth: 20,
                    abilityDamage: 4
                },
                newSpecialAbility: {
                    id: 'elixir_of_life',
                    variables: { heal: 50 },
                    soundEffect: 'battle/health'
                }
            },
            {
                atLevel: EVOLUTION_LEVELS.STAGE_3,
                title: 'companions.tariq.evolution_3',
                evolutionIndex: 4,
                statsBonus: {
                    maxHealth: 30,
                    abilityDamage: 6
                },
                newSpecialAbility: {
                    id: 'elixir_of_life',
                    variables: { heal: 80 },
                    soundEffect: 'battle/health'
                }
            }
        ]
    },
    'kenji': {
        id: 'kenji',
        name: 'Kenji',
        title: 'companions.kenji.title',
        level: 1,
        baseStats: {
            maxHealth: 100,
            abilityDamage: 7,
            attackSound: 'battle/katana',
            evolutionIndex: 1
        },
        specialAbility: {
            id: 'blade_barrier',
            variables: { damage: 20, duration: 2, reduction: 50 },
            soundEffect: 'battle/katana'
        },
        initialSpirit: 100,
        spiritGain: 35,
        evolutions: [
            {
                atLevel: EVOLUTION_LEVELS.STAGE_1,
                title: 'companions.kenji.evolution_1',
                evolutionIndex: 2,
                statsBonus: {
                    maxHealth: 20,
                    abilityDamage: 3
                },
                newSpecialAbility: {
                    id: 'blade_barrier',
                    variables: { damage: 30, duration: 2, reduction: 50 },
                    soundEffect: 'battle/katana'
                }
            },
            {
                atLevel: EVOLUTION_LEVELS.STAGE_2,
                title: 'companions.kenji.evolution_2',
                evolutionIndex: 3,
                statsBonus: {
                    maxHealth: 25,
                    abilityDamage: 4
                },
                newSpecialAbility: {
                    id: 'blade_barrier',
                    variables: { damage: 45, duration: 2, reduction: 50 },
                    soundEffect: 'battle/katana'
                }
            },
            {
                atLevel: EVOLUTION_LEVELS.STAGE_3,
                title: 'companions.kenji.evolution_3',
                evolutionIndex: 4,
                statsBonus: {
                    maxHealth: 35,
                    abilityDamage: 5
                },
                newSpecialAbility: {
                    id: 'blade_barrier',
                    variables: { damage: 65, duration: 2, reduction: 50 },
                    soundEffect: 'battle/katana'
                }
            }
        ]
    },
    'zahara': {
        id: 'zahara',
        name: 'Zahara',
        title: 'companions.zahara.title',
        level: 1,
        baseStats: {
            maxHealth: 70,
            abilityDamage: 8,
            attackSound: 'battle/travel-stick',
            evolutionIndex: 1
        },
        specialAbility: {
            id: 'ancestral_storm',
            variables: { damage: 20 },
            soundEffect: 'battle/lightning'
        },
        initialSpirit: 40,
        spiritGain: 35,
        evolutions: [
            {
                atLevel: EVOLUTION_LEVELS.STAGE_1,
                title: 'companions.zahara.evolution_1',
                evolutionIndex: 2,
                statsBonus: {
                    maxHealth: 10,
                    abilityDamage: 5
                },
                newSpecialAbility: {
                    id: 'ancestral_storm',
                    variables: { damage: 35 },
                    soundEffect: 'battle/lightning'
                }
            },
            {
                atLevel: EVOLUTION_LEVELS.STAGE_2,
                title: 'companions.zahara.evolution_2',
                evolutionIndex: 3,
                statsBonus: {
                    maxHealth: 15,
                    abilityDamage: 7
                },
                newSpecialAbility: {
                    id: 'ancestral_storm',
                    variables: { damage: 50 },
                    soundEffect: 'battle/lightning'
                }
            },
            {
                atLevel: EVOLUTION_LEVELS.STAGE_3,
                title: 'companions.zahara.evolution_3',
                evolutionIndex: 4,
                statsBonus: {
                    maxHealth: 20,
                    abilityDamage: 10
                },
                newSpecialAbility: {
                    id: 'ancestral_storm',
                    variables: { damage: 65 },
                    soundEffect: 'battle/lightning'
                }
            }
        ]
    }
};

export const INITIAL_FELLOWSHIP = ['amara', 'tariq'];

export const getCompanionById = (id: string) => COMPANIONS[id];
