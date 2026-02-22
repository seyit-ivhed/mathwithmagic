import { type Adventure, EncounterType, PuzzleType } from '../../types/adventure.types';
import { MONSTERS } from '../monsters.data';

export const ADVENTURE_6: Adventure = {
    id: '6',
    levelRange: [11, 12],
    mapMusic: 'adventure-6/map.mp3',
    encounters: [
        {
            id: '6_1',
            type: EncounterType.BATTLE,
            coordinates: { x: -200, y: 800 },
            enemies: [MONSTERS.HOLLOW_SHELL, MONSTERS.HOLLOW_SHELL, MONSTERS.HOLLOW_SHELL],
            battleMusic: 'adventure-6/combat-1.mp3',
        },
        {
            id: '6_2',
            type: EncounterType.BATTLE,
            coordinates: { x: 200, y: 900 },
            enemies: [MONSTERS.TWISTED_REFLECTION, MONSTERS.HOLLOW_SHELL, MONSTERS.HOLLOW_SHELL],
            battleMusic: 'adventure-6/combat-2.mp3',
        },
        {
            id: '6_3',
            type: EncounterType.PUZZLE,
            coordinates: { x: 0, y: 1400 },
            puzzleData: { puzzleType: PuzzleType.MIRROR },
        },
        {
            id: '6_4',
            type: EncounterType.BATTLE,
            coordinates: { x: -150, y: 1800 },
            enemies: [MONSTERS.DISCORD_SPIRIT, MONSTERS.TWISTED_REFLECTION, MONSTERS.HOLLOW_SHELL],
            battleMusic: 'adventure-6/combat-1.mp3',
        },
        {
            id: '6_5',
            type: EncounterType.BATTLE,
            coordinates: { x: 150, y: 2000 },
            enemies: [MONSTERS.DISCORD_SPIRIT, MONSTERS.HOLLOW_SHELL, MONSTERS.HOLLOW_SHELL, MONSTERS.HOLLOW_SHELL],
            battleMusic: 'adventure-6/combat-2.mp3',
        },
        {
            id: '6_6',
            type: EncounterType.PUZZLE,
            coordinates: { x: 0, y: 2500 },
            puzzleData: { puzzleType: PuzzleType.LATIN_SQUARE },
        },
        {
            id: '6_7',
            type: EncounterType.BATTLE,
            coordinates: { x: 200, y: 2800 },
            enemies: [MONSTERS.TWISTED_REFLECTION, MONSTERS.TWISTED_REFLECTION, MONSTERS.HOLLOW_SHELL, MONSTERS.HOLLOW_SHELL],
            battleMusic: 'adventure-6/combat-1.mp3',
        },
        {
            id: '6_8',
            type: EncounterType.PUZZLE,
            coordinates: { x: 0, y: 3000 },
            puzzleData: { puzzleType: PuzzleType.EQUATION },
        },
        {
            id: '6_9',
            type: EncounterType.BATTLE,
            coordinates: { x: -200, y: 3500 },
            enemies: [MONSTERS.DISCORD_SPIRIT, MONSTERS.TWISTED_REFLECTION, MONSTERS.HOLLOW_SHELL, MONSTERS.HOLLOW_SHELL],
            battleMusic: 'adventure-6/combat-2.mp3',
        },
        {
            id: '6_10',
            type: EncounterType.BOSS,
            coordinates: { x: 0, y: 4100 },
            enemies: [MONSTERS.SPIRIT_KING],
            battleMusic: 'adventure-6/combat-boss.mp3',
        },
        {
            id: '6_11',
            type: EncounterType.ENDING,
            coordinates: { x: -300, y: 4300 },
        }
    ]
};
