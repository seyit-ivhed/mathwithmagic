export const EncounterPhase = {
    INIT: 'INIT',
    PLAYER_TURN: 'PLAYER_TURN',
    MONSTER_TURN: 'MONSTER_TURN',
    VICTORY: 'VICTORY',
    DEFEAT: 'DEFEAT'
} as const;

export type EncounterPhase = typeof EncounterPhase[keyof typeof EncounterPhase];

/**
 * Generic interface for combat participants
 */
export interface StatusEffectData {
    id: string; // Unique instance ID
    type: string; // Type identifier (e.g., 'SHIELD')
    state: Record<string, number | string | boolean>; // Persistent state
}

export interface BattleUnit {
    id: string;
    templateId: string;
    name: string;
    isPlayer: boolean;
    damage?: number;
    currentHealth: number;
    maxHealth: number;
    isDead: boolean;

    // Stats
    maxSpirit: number;
    currentSpirit: number;
    spiritGain: number;

    // State
    hasActed: boolean;
    statusEffects?: StatusEffectData[];
}

export interface EncounterUnit extends BattleUnit {
    title?: string;
    specialAbilityId?: string;
    specialAbilityVariables?: Record<string, number>;

    // Visuals
    image?: string;
    isBoss?: boolean;
    evolutionIndex?: number;
}

export interface EncounterState {
    phase: EncounterPhase;
    turnCount: number;

    // Units
    party: EncounterUnit[];
    monsters: EncounterUnit[];

    // Selection
    selectedUnitId: string | null;

    // Progression
    nodeIndex?: number;
    difficulty?: number; // 1-5
}
