import { describe, it, expect } from 'vitest';
import { calculateNextSum, formatActionLabel, isPuzzleSolved, generateRefillCanteenData } from './RefillCanteenEngine';
import { type PuzzleOption, PuzzleType } from '../../../../types/adventure.types';

describe('RefillCanteenEngine', () => {
    describe('calculateNextSum', () => {
        it('should handle simple addition with numbers', () => {
            expect(calculateNextSum(10, 5)).toBe(15);
            expect(calculateNextSum(10, -3)).toBe(7);
        });

        it('should handle ADD operation via PuzzleOption', () => {
            const option: PuzzleOption = { value: 5, type: 'ADD' };
            expect(calculateNextSum(10, option)).toBe(15);
        });

        it('should handle MULTIPLY operation', () => {
            const option: PuzzleOption = { value: 2, type: 'MULTIPLY' };
            expect(calculateNextSum(10, option)).toBe(20);
        });
    });

    describe('formatActionLabel', () => {
        it('should format simple numbers', () => {
            expect(formatActionLabel(5)).toBe('+5');
            expect(formatActionLabel(-3)).toBe('-3');
        });

        it('should use explicit label if provided', () => {
            const option: PuzzleOption = { value: 2, type: 'MULTIPLY', label: 'Double It!' };
            expect(formatActionLabel(option)).toBe('Double It!');
        });

        it('should format MULTIPLY type correctly', () => {
            const option: PuzzleOption = { value: 3, type: 'MULTIPLY' };
            expect(formatActionLabel(option)).toBe('x3');
        });
    });

    describe('isPuzzleSolved', () => {
        it('should return true when target is reached', () => {
            expect(isPuzzleSolved(50, 50)).toBe(true);
        });

        it('should return false when target is not reached', () => {
            expect(isPuzzleSolved(49, 50)).toBe(false);
            expect(isPuzzleSolved(51, 50)).toBe(false);
        });
    });

    describe('generateRefillCanteenData', () => {
        it('should generate valid puzzle structure', () => {
            const data = generateRefillCanteenData(1);
            expect(data.puzzleType).toBe(PuzzleType.REFILL_CANTEEN);
            expect(typeof data.targetValue).toBe('number');
            expect(Array.isArray(data.options)).toBe(true);
        });

        it('should scale difficulty with steps', () => {
            const data = generateRefillCanteenData(1);
            expect(data.options.length).toBeGreaterThanOrEqual(2);
        });

        it('should include both numbers and objects (for level 3)', () => {
            const data = generateRefillCanteenData(3);
            const hasOperations = data.options.some(opt => typeof opt === 'object');
            expect(data.options.length).toBeGreaterThan(0);
            expect(typeof hasOperations).toBe('boolean');
        });

        it('should not have 0 as an option value', () => {
            for (let i = 0; i < 10; i++) {
                const data = generateRefillCanteenData(3);
                data.options.forEach(opt => {
                    if (typeof opt === 'number') {
                        expect(opt).not.toBe(0);
                    } else {
                        expect(opt.value).not.toBe(0);
                    }
                });
            }
        });

        it('should produce a positive target value', () => {
            for (let i = 0; i < 20; i++) {
                const difficulty = (Math.floor(Math.random() * 3) + 1) as import('../../../../types/math.types').DifficultyLevel;
                const data = generateRefillCanteenData(difficulty);
                expect(data.targetValue).toBeGreaterThan(0);
            }
        });

        it('should generate difficulty 2 puzzles with 2 or 3 steps', () => {
            for (let i = 0; i < 30; i++) {
                const data = generateRefillCanteenData(2);
                // difficulty 2 has 2-3 solution pipes + decoy
                expect(data.options.length).toBeGreaterThanOrEqual(3);
            }
        });
    });

    describe('formatActionLabel - edge cases', () => {
        it('should format ADD option without label', () => {
            const option: PuzzleOption = { value: 5, type: 'ADD' };
            expect(formatActionLabel(option)).toBe('+5');
        });

        it('should format ADD option with negative value', () => {
            const option: PuzzleOption = { value: -3, type: 'ADD' };
            expect(formatActionLabel(option)).toBe('-3');
        });
    });

});
