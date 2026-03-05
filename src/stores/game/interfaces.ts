import { AdventureStatus, type AdventureId, type Encounter } from '../../types/adventure.types';

export interface EncounterResult {
    stars: number;
    difficulty: number;
    completedAt: number;
}

export interface EncounterWithStatus extends Encounter {
    isLocked: boolean;
    stars: number;
}

// State shape only (no actions)
export interface GameState {
    activeParty: string[];
    encounterResults: Record<string, EncounterResult>;
    activeEncounterDifficulty: number;
    companionStats: Record<string, { level: number; experience: number }>;
    adventureStatuses: Record<AdventureId, AdventureStatus>;
}

// Adventure & Encounter Management
export interface AdventureProgressSlice {
    completeEncounter: (adventureId: string, nodeIndex: number) => void;
    notifyEncounterStarted: (adventureId: string, nodeIndex: number) => void;
    setEncounterDifficulty: (difficulty: number) => void;
    getAdventureNodes: (adventureId: string) => EncounterWithStatus[];
}

export interface AdventureStatusSlice {
    adventureStatuses: Record<AdventureId, AdventureStatus>;
    completeAdventure: (id: AdventureId) => void;
    unlockAdventure: (id: AdventureId) => void;
    isAdventureUnlocked: (id: AdventureId) => boolean;

}

// XP & Leveling
export interface ProgressionSlice {
    levelUpCompanion: (companionId: string) => void;
    addCompanionExperience: (companionId: string, amount: number) => void;
    addCompanionToParty: (companionId: string) => void;
}

// Debug & Reset Actions
export interface DebugSlice {
    debugResetCompanions: () => void;
    debugResetEncounterResults: () => void;
    debugSetCompanionLevel: (companionId: string, level: number) => void;
    debugSetEncounterStars: (adventureId: string, nodeIndex: number, stars: number) => void;
    debugSetAdventureStars: (adventureId: string, stars: number) => void;
}

// Combined store type
export interface GameStore extends GameState, AdventureProgressSlice, AdventureStatusSlice, ProgressionSlice, DebugSlice { }
