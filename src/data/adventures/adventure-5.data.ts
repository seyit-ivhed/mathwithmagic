import { type Adventure, EncounterType, PuzzleType } from '../../types/adventure.types';
import { MONSTERS } from '../monsters.data';

export const ADVENTURE_5: Adventure = {
    id: '5',
    levelRange: [10, 11],
    mapMusic: 'adventure-5/map.mp3',
    encounters: [
        {
            id: '5_1',
            type: EncounterType.BATTLE,
            coordinates: { x: -200, y: 4300 },
            enemies: [MONSTERS.BLAZE_HYENA, MONSTERS.BLAZE_HYENA, MONSTERS.BLAZE_HYENA],
            unlocksCompanion: 'zahara',
            battleMusic: 'adventure-5/combat-1.mp3',
        },
        {
            id: '5_2',
            type: EncounterType.BATTLE,
            coordinates: { x: 100, y: 3950 },
            enemies: [MONSTERS.EMBER_LIONESS, MONSTERS.EMBER_LIONESS, MONSTERS.EMBER_LIONESS],
            battleMusic: 'adventure-5/combat-2.mp3',
        },
        {
            id: '5_3',
            type: EncounterType.PUZZLE,
            coordinates: { x: 50, y: 3200 },
            puzzleData: { puzzleType: PuzzleType.BALANCE },
        },
        {
            id: '5_4',
            type: EncounterType.BATTLE,
            coordinates: { x: -250, y: 2300 },
            enemies: [MONSTERS.SUN_SCORCHED_RHINO, MONSTERS.BLAZE_HYENA, MONSTERS.BLAZE_HYENA],
            battleMusic: 'adventure-5/combat-1.mp3',
        },
        {
            id: '5_5',
            type: EncounterType.BATTLE,
            coordinates: { x: 200, y: 2400 },
            enemies: [MONSTERS.EMBER_LIONESS, MONSTERS.EMBER_LIONESS, MONSTERS.BLAZE_HYENA, MONSTERS.BLAZE_HYENA],
            battleMusic: 'adventure-5/combat-2.mp3',
        },
        {
            id: '5_6',
            type: EncounterType.PUZZLE,
            coordinates: { x: 250, y: 2000 },
            puzzleData: { puzzleType: PuzzleType.NUMBER_PATH },
        },
        {
            id: '5_7',
            type: EncounterType.BATTLE,
            coordinates: { x: -100, y: 1700 },
            enemies: [MONSTERS.MIRAGE_SPIRIT, MONSTERS.MIRAGE_SPIRIT, MONSTERS.BLAZE_HYENA, MONSTERS.BLAZE_HYENA],
            battleMusic: 'adventure-5/combat-1.mp3',
        },
        {
            id: '5_8',
            type: EncounterType.PUZZLE,
            coordinates: { x: 250, y: 1350 },
            puzzleData: { puzzleType: PuzzleType.MIRROR },
        },
        {
            id: '5_9',
            type: EncounterType.BATTLE,
            coordinates: { x: -250, y: 1300 },
            enemies: [MONSTERS.SUN_SCORCHED_RHINO, MONSTERS.MIRAGE_SPIRIT, MONSTERS.BLAZE_HYENA, MONSTERS.BLAZE_HYENA],
            battleMusic: 'adventure-5/combat-2.mp3',
        },
        {
            id: '5_10',
            type: EncounterType.PUZZLE,
            coordinates: { x: 0, y: 1000 },
            puzzleData: { puzzleType: PuzzleType.SEQUENCE },
        },
        {
            id: '5_11',
            type: EncounterType.BOSS,
            coordinates: { x: 0, y: 600 },
            enemies: [MONSTERS.INFERNO_MANE],
            battleMusic: 'adventure-5/combat-1.mp3',
        },
        {
            id: '5_12',
            type: EncounterType.ENDING,
            coordinates: { x: 0, y: 400 },
        }
    ]
};
