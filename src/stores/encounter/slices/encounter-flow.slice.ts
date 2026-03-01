import type { StateCreator } from 'zustand';
import type { EncounterStore, EncounterFlowSlice } from '../interfaces';
import { EncounterPhase, type EncounterUnit } from '../../../types/encounter.types';
import { getCompanionById } from '../../../data/companions.data';
import { getStatsForLevel } from '../../../utils/progression.utils';
import { getMonsterSprite } from '../../../data/monster-sprites';
import { getCompanionCardImage } from '../../../data/companion-sprites';
import { CombatEngine } from '../../../utils/battle/combat-engine';
import { initialEncounterState } from '../initial-state';
import { playSfx } from '../../../components/audio/audio.utils';

export const createEncounterFlowSlice: StateCreator<EncounterStore, [], [], EncounterFlowSlice> = (set, get) => ({
    initializeEncounter: (partyIds, enemies, nodeIndex, difficulty, companionStats) => {
        const party: EncounterUnit[] = partyIds
            .filter(id => {
                const data = getCompanionById(id);
                if (!data) {
                    console.warn(`Companion "${id}" not found in data, skipping...`);
                    return false;
                }
                return true;
            })
            .map((id, index) => {
                const data = getCompanionById(id);
                const stats = companionStats[id] || { level: 1, xp: 0 };
                const calculatedStats = getStatsForLevel(data, stats.level);

                return {
                    id: `party_${id}_${index}`,
                    templateId: id,
                    name: data.name,
                    title: calculatedStats.title,
                    isPlayer: true,
                    maxHealth: calculatedStats.maxHealth,
                    currentHealth: calculatedStats.maxHealth,
                    damage: calculatedStats.abilityDamage || 0,
                    specialAbilityId: calculatedStats.specialAbilityId,
                    specialAbilityVariables: calculatedStats.specialAbilityVariables,
                    attackSound: calculatedStats.attackSound,
                    specialAbilitySound: calculatedStats.specialAbilitySound,
                    isDead: false,
                    hasActed: false,
                    currentSpirit: data.initialSpirit || 0,
                    maxSpirit: 100,
                    spiritGain: data.spiritGain || 0,
                    image: getCompanionCardImage(id, stats.level),
                    evolutionIndex: calculatedStats.evolutionIndex
                };
            });

        const monsters: EncounterUnit[] = enemies.map((enemy, index) => {
            return {
                id: `monster_${enemy.id}_${index}`,
                templateId: enemy.id,
                name: enemy.name || enemy.id,
                isPlayer: false,
                maxHealth: enemy.maxHealth,
                currentHealth: enemy.maxHealth,
                damage: enemy.attack,
                image: getMonsterSprite(enemy.id),
                attackSound: enemy.attackSound,
                isDead: false,
                hasActed: false,
                currentSpirit: 0,
                maxSpirit: 100,
                spiritGain: 20,
                isBoss: enemy.isBoss
            };
        });

        set({
            phase: EncounterPhase.PLAYER_TURN,
            turnCount: 1,
            party,
            monsters,
            selectedUnitId: null,
            nodeIndex,
            difficulty
        });
    },

    resetEncounter: () => {
        set({
            ...initialEncounterState,
            nodeIndex: undefined,
            difficulty: undefined
        });
    },

    endPlayerTurn: () => {
        // Reset monster acted state for the new turn sequence
        const { monsters } = get();
        const newMonsters = monsters.map(m => ({ ...m, hasActed: false }));

        set({
            phase: EncounterPhase.MONSTER_TURN,
            monsters: newMonsters
        });

        // Wait for "Enemy Turn" banner to complete (1.6s animation) before starting attacks
        setTimeout(() => get().processMonsterTurn(), 1700);
    },

    processMonsterTurn: () => {
        const { monsters } = get();
        const activeMonsters = monsters.filter(m => !m.isDead);

        if (activeMonsters.length === 0) {
            return; // Should be victory already
        }

        // Process each monster attack sequentially with delays
        const processMonsterAttack = (monsterIndex: number) => {
            const currentStore = get();
            const currentMonsters = currentStore.monsters;
            const currentParty = currentStore.party;
            const currentActiveMonsters = currentMonsters.filter(m => !m.isDead);

            if (monsterIndex >= currentActiveMonsters.length) {
                // All monsters have attacked - prepare for next player turn

                let newParty = currentParty.map(u => ({ ...u, hasActed: false }));

                // Tick Status Effects (e.g. Shield duration)
                newParty = CombatEngine.tickStatusEffects(newParty);

                // Passive Charge at start of Player Turn via CombatEngine
                newParty = CombatEngine.regenerateSpirit(newParty);

                // Add a cooldown before returning to player turn
                setTimeout(() => {
                    set(state => ({
                        party: newParty,
                        monsters: currentMonsters,
                        phase: EncounterPhase.PLAYER_TURN,
                        turnCount: state.turnCount + 1,
                    }));

                    if (newParty.every(p => p.isDead)) {
                        set({ phase: EncounterPhase.DEFEAT });
                    }
                }, 500); // 0.5s cooldown before player turn
                return;
            }

            const monster = currentActiveMonsters[monsterIndex];

            // Mark monster as acted
            const monsterMainIndex = currentMonsters.findIndex(m => m.id === monster.id);
            if (monsterMainIndex !== -1) {
                const updatedMonsters = [...currentMonsters];
                updatedMonsters[monsterMainIndex] = { ...updatedMonsters[monsterMainIndex], hasActed: true };
                set({ monsters: updatedMonsters });
            }

            if (monster.attackSound) {
                playSfx(monster.attackSound);
            }

            const currentPlayerParty = get().party; // Latest party state
            const result = CombatEngine.processMonsterAction(
                monster,
                currentPlayerParty
            );

            // Add logs and update state
            set(() => ({
                party: result.updatedParty
            }));

            // Wait 1s before the next monster attacks
            setTimeout(() => {
                processMonsterAttack(monsterIndex + 1);
            }, 600);
        };

        // Start processing from the first monster
        processMonsterAttack(0);
    }
});
