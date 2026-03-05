import { ADVENTURES } from '../../../data/adventures.data';
import type { GameStore } from '../../../stores/game/interfaces';

interface DebugCommandContext {
    log: (message: string) => void;
    setHistory: React.Dispatch<React.SetStateAction<string[]>>;
    stores: {
        game: GameStore;
    };
}

interface DebugCommand {
    name: string;
    description: string;
    execute: (parts: string[], context: DebugCommandContext) => void;
}

export const DEBUG_COMMANDS: Record<string, DebugCommand> = {
    help: {
        name: 'help',
        description: 'Show available commands',
        execute: (_parts, { log }) => {
            log('Available commands:');
            Object.values(DEBUG_COMMANDS).forEach(cmd => {
                log(`  ${cmd.name.padEnd(15)} - ${cmd.description}`);
            });
        }
    },
    progress: {
        name: 'progress',
        description: 'Complete encounters up to index (progress <advId> <index>)',
        execute: (parts, { log, stores }) => {
            const advId = parts[1];
            const targetNode = parseInt(parts[2]);

            const adventure = ADVENTURES.find(a => a.id === advId);
            if (!adventure || isNaN(targetNode)) {
                log('Error: Invalid usage. Usage: progress <advId> <index>');
                return;
            }

            if (targetNode < 1 || targetNode > adventure.encounters.length) {
                log(`Error: Invalid encounter index. Must be between 1 and ${adventure.encounters.length}.`);
                return;
            }

            // Use completeEncounter for each node to ensure all logic (XP, Auth, Sync) is triggered
            for (let i = 1; i <= targetNode; i++) {
                stores.game.completeEncounter(advId, i);
            }

            log(`Progressed to encounter ${targetNode} in adventure ${advId}.`);
        }
    },

    level: {
        name: 'level',
        description: 'Set companion level (level <id> <v>)',
        execute: (parts, { log, stores }) => {
            const id = parts[1];
            const level = parseInt(parts[2]);
            if (id && !isNaN(level)) {
                stores.game.debugSetCompanionLevel(id, level);
                log(`Companion "${id}" level set to ${level}.`);
            } else {
                log('Error: Invalid arguments. Usage: level <companionId> <level>');
            }
        }
    },
    allstars: {
        name: 'allstars',
        description: 'Set all encounter stars for an adventure (allstars <advId> <stars>)',
        execute: (parts, { log, stores }) => {
            const advId = parts[1];
            const stars = parseInt(parts[2]);

            if (!advId || isNaN(stars)) {
                log('Error: Invalid arguments. Usage: allstars <advId> <stars>');
                return;
            }

            const adventure = ADVENTURES.find(a => a.id === advId);
            if (!adventure) {
                log(`Error: Adventure "${advId}" not found.`);
                return;
            }

            stores.game.debugSetAdventureStars(advId, stars);
            log(`All encounters in adventure ${advId} set to ${stars} stars.`);
        }
    },
    stars: {
        name: 'stars',
        description: 'Set stars (stars <adv> <idx> <v>)',
        execute: (parts, { log, stores }) => {
            const advId = parts[1];
            const nodeIdx = parseInt(parts[2]);
            const stars = parseInt(parts[3]);

            if (advId && !isNaN(nodeIdx) && !isNaN(stars)) {
                stores.game.debugSetEncounterStars(advId, nodeIdx, stars);
                log(`Stars for adventure ${advId}, node ${nodeIdx} set to ${stars}.`);
            } else {
                log('Error: Invalid arguments. Usage: stars <advId> <nodeIdx> <stars>');
            }
        }
    },
    addxp: {
        name: 'addxp',
        description: 'Add XP to companion (addxp <id> <amount>)',
        execute: (parts, { log, stores }) => {
            const id = parts[1];
            const amount = parseInt(parts[2]);
            if (id && !isNaN(amount)) {
                stores.game.addCompanionExperience(id, amount);
                log(`Added ${amount} XP to companion "${id}".`);
            } else {
                log('Error: Invalid arguments. Usage: addxp <companionId> <amount>');
            }
        }
    },
    clear: {
        name: 'clear',
        description: 'Clear console history',
        execute: (_parts, { setHistory }) => {
            setHistory([]);
        }
    }
};
