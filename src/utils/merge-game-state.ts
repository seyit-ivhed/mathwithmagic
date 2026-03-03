import type { GameState, EncounterResult } from '../stores/game/interfaces';
import { AdventureStatus, type AdventureId } from '../types/adventure.types';

const ADVENTURE_STATUS_RANK: Record<AdventureStatus, number> = {
    [AdventureStatus.LOCKED]: 0,
    [AdventureStatus.AVAILABLE]: 1,
    [AdventureStatus.COMPLETED]: 2,
};

function mergeEncounterResult(a: EncounterResult, b: EncounterResult): EncounterResult {
    if (a.stars > b.stars) {
        return a;
    }
    if (b.stars > a.stars) {
        return b;
    }
    return a.completedAt >= b.completedAt ? a : b;
}

/** Merges two game states so that player progress never regresses. */
export function mergeGameState(primary: GameState, secondary: Partial<GameState>): GameState {
    // --- encounterResults: union of keys, best result per key ---
    const mergedEncounterResults: Record<string, EncounterResult> = {
        ...secondary.encounterResults,
    };
    for (const [key, result] of Object.entries(primary.encounterResults)) {
        const existing = mergedEncounterResults[key];
        mergedEncounterResults[key] = existing
            ? mergeEncounterResult(result, existing)
            : result;
    }

    // --- companionStats: max level, then max experience ---
    const mergedCompanionStats: GameState['companionStats'] = {
        ...(secondary.companionStats ?? {}),
    };
    for (const [id, stats] of Object.entries(primary.companionStats)) {
        const other = mergedCompanionStats[id];
        if (!other) {
            mergedCompanionStats[id] = stats;
        } else if (
            stats.level > other.level ||
            (stats.level === other.level && stats.experience > other.experience)
        ) {
            mergedCompanionStats[id] = stats;
        }
        // else keep `other` — secondary has equal or higher progress
    }

    // --- activeParty: union (companions are never removed) ---
    const partySet = new Set([
        ...(secondary.activeParty ?? []),
        ...primary.activeParty,
    ]);
    const mergedActiveParty = Array.from(partySet);

    // --- adventureStatuses: most-advanced status wins ---
    const mergedAdventureStatuses: Record<AdventureId, AdventureStatus> = {
        ...(secondary.adventureStatuses ?? {}),
    };
    for (const [id, status] of Object.entries(primary.adventureStatuses) as [AdventureId, AdventureStatus][]) {
        const other = mergedAdventureStatuses[id];
        const primaryRank = ADVENTURE_STATUS_RANK[status] ?? 0;
        const otherRank = other !== undefined ? (ADVENTURE_STATUS_RANK[other] ?? 0) : -1;
        if (primaryRank > otherRank) {
            mergedAdventureStatuses[id] = status;
        }
    }

    return {
        activeParty: mergedActiveParty,
        encounterResults: mergedEncounterResults,
        activeEncounterDifficulty: primary.activeEncounterDifficulty,
        companionStats: mergedCompanionStats,
        adventureStatuses: mergedAdventureStatuses,
    };
}
