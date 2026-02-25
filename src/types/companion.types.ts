export interface SpecialAbility {
    id: string; // Used for translation key, VFX lookup, and implementation registry
    variables?: Record<string, number>; // Flexible numerical parameters for the ability implementation
}

export interface CompanionStats {
    maxHealth: number;
    title?: string;
    abilityDamage?: number;
    specialAbilityId?: string;
    specialAbilityVariables?: Record<string, number>;
    evolutionIndex: number;
}

export interface CompanionEvolution {
    atLevel: number;
    title: string;
    evolutionIndex: number;
    image?: string;
    statsBonus?: Partial<CompanionStats>;
    newSpecialAbility?: SpecialAbility;
}

export interface Companion {
    id: string;
    // Identity
    name: string;
    title: string;

    // Progression
    level: number;

    // Stats
    baseStats: CompanionStats;
    stats?: CompanionStats; // Current calculated stats (optional as it can be derived)

    // Special Ability
    specialAbility: SpecialAbility;

    // Visuals
    image?: string;

    // Configuration
    initialSpirit: number;
    spiritGain: number;

    evolutions: CompanionEvolution[];
}
