import { describe, it, expect, vi, afterEach } from 'vitest';
import {
    LatinSquareEngine,
    generateLatinSquareData,
    type LatinSquareElement
} from './LatinSquareEngine';
import { PuzzleType } from '../../../../types/adventure.types';

describe('LatinSquareEngine', () => {
    const validGrid: LatinSquareElement[][] = [
        [0, 1, 2, 3],
        [2, 3, 0, 1],
        [1, 0, 3, 2],
        [3, 2, 1, 0]
    ];

    describe('checkSolution', () => {
        it('should return true for a valid Latin Square', () => {
            expect(LatinSquareEngine.checkSolution(validGrid)).toBe(true);
        });

        it('should return false if a row has duplicates', () => {
            const invalidGrid: LatinSquareElement[][] = [
                [0, 0, 2, 3], // Duplicate 0
                [2, 3, 0, 1],
                [1, 2, 3, 0],
                [3, 0, 1, 2]
            ];
            expect(LatinSquareEngine.checkSolution(invalidGrid)).toBe(false);
        });

        it('should return false if a column has duplicates', () => {
            const invalidGrid: LatinSquareElement[][] = [
                [0, 1, 2, 3],
                [0, 3, 1, 2], // 0 duplicate in col 0
                [1, 0, 3, 2],
                [3, 2, 1, 0]
            ];
            expect(LatinSquareEngine.checkSolution(invalidGrid)).toBe(false);
        });

        it('should return incomplete if there are null values', () => {
            const incompleteGrid: LatinSquareElement[][] = [
                [0, 1, 2, 3],
                [2, null, 0, 1],
                [1, 0, 3, 2],
                [3, 2, 1, 0]
            ];
            expect(LatinSquareEngine.checkSolution(incompleteGrid)).toBe(false);
        });

        it('should return true for a valid 3x3 grid', () => {
            const valid3x3: LatinSquareElement[][] = [
                [0, 1, 2],
                [2, 0, 1],
                [1, 2, 0]
            ];
            expect(LatinSquareEngine.checkSolution(valid3x3)).toBe(true);
        });
    });

    describe('shuffle', () => {
        it('should maintain Latin Square properties after shuffle', () => {
            const grid = validGrid.map(row => [...row]);
            LatinSquareEngine.shuffle(grid);

            // It should still be a valid Latin Square
            expect(LatinSquareEngine.checkSolution(grid)).toBe(true);
        });

        it('should actually change the grid (statistically likely)', () => {
            const grid = validGrid.map(row => [...row]);
            const original = JSON.stringify(grid);

            // Mock random to return a value that guaranteed a swap for indices
            // e.g. when i=3, j = floor(0.1 * 4) = 0. Swaps index 3 and 0.
            vi.spyOn(Math, 'random').mockReturnValue(0.1);

            LatinSquareEngine.shuffle(grid);

            expect(JSON.stringify(grid)).not.toBe(original);
        });
    });

    describe('generateLatinSquareData', () => {
        afterEach(() => {
            vi.restoreAllMocks();
        });

        it('should generate valid puzzle data structure', () => {
            const data = generateLatinSquareData(1);
            expect(data.puzzleType).toBe(PuzzleType.LATIN_SQUARE);
            expect(data.targetValue).toBe(3); // Level 1 is 3x3
            expect(Array.isArray(data.grid)).toBe(true);
            expect(data.grid).toHaveLength(3);
            expect(data.grid[0]).toHaveLength(3);
            expect(data.selectedRunes).toHaveLength(3);
        });

        it('should have correct number of fixed elements based on difficulty', () => {
            const dataEasy = generateLatinSquareData(1);
            expect(dataEasy.fixedIndices).toHaveLength(5);
            expect(dataEasy.grid).toHaveLength(3);

            const dataMedium = generateLatinSquareData(2);
            expect(dataMedium.fixedIndices).toHaveLength(8);
            expect(dataMedium.grid).toHaveLength(4);

            const dataHard = generateLatinSquareData(3);
            expect(dataHard.fixedIndices).toHaveLength(6);
            expect(dataHard.grid).toHaveLength(4);
        });

        it('should populate grid with fixed elements at specified indices', () => {
            const data = generateLatinSquareData(1);
            const { grid, fixedIndices } = data;

            fixedIndices.forEach(({ row, col }) => {
                expect(grid[row][col]).not.toBeNull();
            });
        });
    });

    describe('generateLatinSquareData - edge cases', () => {
        it('should throw for invalid non-number difficulty', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            // @ts-expect-error testing invalid input
            expect(() => generateLatinSquareData('easy')).toThrow('Invalid difficulty level');
            consoleSpy.mockRestore();
        });

        it('should use default config for difficulty 4 (not in switch)', () => {
            // @ts-expect-error testing out-of-range difficulty (falls to default)
            const data = generateLatinSquareData(4);
            expect(data.puzzleType).toBe(PuzzleType.LATIN_SQUARE);
            expect(data.grid).toHaveLength(4);
        });
    });

    describe('checkSolution - edge cases', () => {
        it('should return false for an empty grid', () => {
            expect(LatinSquareEngine.checkSolution([])).toBe(false);
        });

        it('should return false for null/undefined input', () => {
            // @ts-expect-error testing invalid input
            expect(LatinSquareEngine.checkSolution(null)).toBe(false);
        });
    });

    describe('shuffle - edge cases', () => {
        it('should handle null grid gracefully', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            // @ts-expect-error testing invalid input
            expect(() => LatinSquareEngine.shuffle(null)).not.toThrow();
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });
});
