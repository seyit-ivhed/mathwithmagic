// Adventure: A self-contained story arc with its own theme, map, and series of encounters
export type AdventureId = string;

export const AdventureStatus = {
    LOCKED: 'LOCKED',
    AVAILABLE: 'AVAILABLE',
    COMPLETED: 'COMPLETED'
} as const;

export type AdventureStatus = typeof AdventureStatus[keyof typeof AdventureStatus];

// Encounter Types (for future expansion)
export const EncounterType = {
    BATTLE: 'BATTLE',      // Turn-based combat against monsters
    PUZZLE: 'PUZZLE',      // Logic and math puzzles (future feature)
    BOSS: 'BOSS',          // Boss fight at the end of an adventure
    ENDING: 'ENDING'       // Transition node to next adventure
} as const;

export type EncounterType = typeof EncounterType[keyof typeof EncounterType];

// Monster encountered in battle encounters
export interface AdventureMonster {
    id: string;
    name?: string;
    maxHealth: number;
    attack: number;

    sprite?: string;
    icon?: string;
    isBoss?: boolean;
}

// Map coordinates for placing nodes
export interface MapCoordinates {
    x: number;
    y: number;
}

export * from './puzzle.types';
import type { PuzzleConfig } from './puzzle.types';

export interface Encounter {
    id: string;
    type: EncounterType;
    label?: string;
    coordinates?: MapCoordinates;
    enemies?: AdventureMonster[];
    puzzleData?: PuzzleConfig;
    battleMusic?: string;
    unlocksCompanion?: string;

    storyBeat?: {
        text?: string;
        speaker?: string;
    };
}

export interface Adventure {
    id: AdventureId;
    title?: string;
    storyHook?: string;
    illustration?: string;
    mapImage?: string;
    mapMusic?: string;
    encounters: Encounter[];
    levelRange?: [number, number];
    requirements?: {
        minLevel?: number;
        previousAdventureId?: AdventureId;
    };
}
