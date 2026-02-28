import type { AdventureMonster } from '../types/adventure.types';

export const MONSTERS = {
    // Adventure 1 Monsters
    SCORPION_1: {
        id: 'scorpion_1',
        maxHealth: 40,
        attack: 8,
        attackSound: 'battle/scorpion'
    },
    TINY_SCORPION: {
        id: 'tiny_scorpion',
        maxHealth: 15,
        attack: 4,
        attackSound: 'battle/scorpion'
    },
    DESERT_SCAVENGER: {
        id: 'desert_scavenger',
        maxHealth: 50,
        attack: 12,
        attackSound: 'battle/dagger'
    },
    BANDIT_LEADER: {
        id: 'bandit_leader',
        maxHealth: 95,
        attack: 13,
        attackSound: 'battle/dagger'
    },
    BANDIT_RAIDER: {
        id: 'bandit_raider',
        maxHealth: 80,
        attack: 14,
        attackSound: 'battle/travel-stick'
    },
    STONE_GUARDIAN: {
        id: 'stone_guardian',
        maxHealth: 120,
        attack: 22,
        attackSound: 'battle/stone'
    },
    ASSYRIAN_GUARDIAN: {
        id: 'assyrian_guardian',
        maxHealth: 140,
        attack: 25,
        attackSound: 'battle/stone'
    },
    SAND_SPIRIT_1: {
        id: 'sand_spirit_1',
        maxHealth: 90,
        attack: 18,
        attackSound: 'battle/spirit'
    },
    SAND_COLOSSUS: {
        id: 'sand_colossus',
        maxHealth: 325,
        attack: 30,
        isBoss: true,
        attackSound: 'battle/stone'
    },
    THE_STONE_EMPEROR: {
        id: 'the_stone_emperor',
        maxHealth: 375,
        attack: 38,
        isBoss: true,
        attackSound: 'battle/stone'
    },
    MIST_RONIN: {
        id: 'mist_ronin',
        maxHealth: 110,
        attack: 22,
        attackSound: 'battle/spirit'
    },
    NINJA_SCOUT: {
        id: 'ninja_scout',
        maxHealth: 135,
        attack: 26,
        attackSound: 'battle/dagger'
    },
    SAMURAI_VANGUARD: {
        id: 'samurai_vanguard',
        maxHealth: 240,
        attack: 45,
        attackSound: 'battle/katana'
    },
    SAMURAI_ARCHER: {
        id: 'samurai_archer',
        maxHealth: 220,
        attack: 50,
        attackSound: 'battle/bow-and-arrow'
    },
    WAR_HOUND: {
        id: 'war_hound',
        maxHealth: 160,
        attack: 38,
        attackSound: 'battle/dog'
    },
    SAMURAI_SOLDIER: {
        id: 'samurai_soldier',
        maxHealth: 150,
        attack: 28,
        attackSound: 'battle/katana'
    },
    SAMURAI_COMMANDER: {
        id: 'samurai_commander',
        maxHealth: 640,
        attack: 70,
        isBoss: true,
        attackSound: 'battle/katana'
    },
    EVIL_SHOGUN: {
        id: 'evil_shogun',
        maxHealth: 650,
        attack: 85,
        isBoss: true,
        attackSound: 'battle/katana'
    },
    BLAZE_HYENA: {
        id: 'blaze_hyena',
        maxHealth: 105,
        attack: 27,
        attackSound: 'battle/dog'
    },
    EMBER_LIONESS: {
        id: 'ember_lioness',
        maxHealth: 190,
        attack: 48,
        attackSound: 'battle/lion'
    },
    SUN_SCORCHED_RHINO: {
        id: 'sun_scorched_rhino',
        maxHealth: 320,
        attack: 40,
        attackSound: 'battle/rhino'
    },
    MIRAGE_SPIRIT: {
        id: 'mirage_spirit',
        maxHealth: 170,
        attack: 50,
        attackSound: 'battle/spirit'
    },
    INFERNO_MANE: {
        id: 'inferno_mane',
        maxHealth: 980,
        attack: 98,
        isBoss: true,
        attackSound: 'battle/horse'
    },
    DISCORD_SPIRIT: {
        id: 'discord_spirit',
        maxHealth: 280,
        attack: 65,
        attackSound: 'battle/spirit'
    },
    HOLLOW_SHELL: {
        id: 'hollow_shell',
        maxHealth: 160,
        attack: 28,
        attackSound: 'battle/spirit'
    },
    TWISTED_REFLECTION: {
        id: 'twisted_reflection',
        maxHealth: 250,
        attack: 60,
        attackSound: 'battle/spirit'
    },
    SPIRIT_KING: {
        id: 'spirit_king',
        maxHealth: 1100,
        attack: 100,
        isBoss: true,
        attackSound: 'battle/spirit'
    },
} as const satisfies Record<string, AdventureMonster>;
