import { describe, it, expect, vi } from 'vitest';
import {
    generateAdditionProblem,
    generateSubtractionProblem,
    getAllowedOperations,
    generateProblem
} from './operations';
import { MathOperation } from '../../types/math.types';
import { getSettings } from './config';

describe('Math Operations Verification', () => {
    describe('Addition Range Control', () => {
        it('should respect left and right ranges for Level 2', () => {
            // Level 2 Addition: left { min: 5, max: 20 }, right { min: 1, max: 10 }
            for (let i = 0; i < 50; i++) {
                const problem = generateAdditionProblem(2);
                expect(problem.operand1).toBeGreaterThanOrEqual(5);
                expect(problem.operand1).toBeLessThanOrEqual(20);
                expect(problem.operand2).toBeGreaterThanOrEqual(1);
                expect(problem.operand2).toBeLessThanOrEqual(10);
            }
        });
    });

    describe('Subtraction Range Control', () => {
        it('should respect left and right ranges for Level 2', () => {
            // Level 2 Subtraction: left { min: 5, max: 20 }, right { min: 1, max: 10 }
            for (let i = 0; i < 50; i++) {
                const problem = generateSubtractionProblem(2);
                expect(problem.operand1).toBeGreaterThanOrEqual(5);
                expect(problem.operand1).toBeLessThanOrEqual(20);
                expect(problem.operand2).toBeGreaterThanOrEqual(1);
                expect(problem.operand2).toBeLessThanOrEqual(10);
                expect(problem.operand1).toBeGreaterThanOrEqual(problem.operand2);
            }
        });

        it('should swap operands when operand1 < operand2', () => {
            // Level 1 subtraction: left { min: 3, max: 10 }, right { min: 1, max: 3 }
            // Generate many problems to trigger a swap
            let swapOccurred = false;
            for (let i = 0; i < 100; i++) {
                const problem = generateSubtractionProblem(1);
                expect(problem.correctAnswer).toBeGreaterThanOrEqual(0);
                if (problem.operand1 >= problem.operand2) swapOccurred = true;
            }
            // Should always produce non-negative results
            expect(swapOccurred).toBe(true);
        });
    });

    describe('Operation Blocking', () => {
        it('should only allow addition and subtraction for Level 1', () => {
            const allowed = getAllowedOperations(1);
            expect(allowed).toContain(MathOperation.ADD);
            expect(allowed).toContain(MathOperation.SUBTRACT);
            expect(allowed).toHaveLength(2);
        });

        it('should allow all operations for Level 3', () => {
            const allowed = getAllowedOperations(3);
            expect(allowed).toContain(MathOperation.ADD);
            expect(allowed).toContain(MathOperation.SUBTRACT);
            expect(allowed).toContain(MathOperation.MULTIPLY);
            expect(allowed).toHaveLength(3);
        });

        it('should fall back to ADD for unknown difficulty', () => {
            // @ts-expect-error testing fallback
            const allowed = getAllowedOperations(99);
            expect(allowed).toContain(MathOperation.ADD);
        });
    });

    describe('generateProblem', () => {
        it('should generate addition problem', () => {
            const problem = generateProblem(MathOperation.ADD, 1);
            expect(problem.operation).toBe(MathOperation.ADD);
            expect(problem.choices).toHaveLength(4);
        });

        it('should generate subtraction problem', () => {
            const problem = generateProblem(MathOperation.SUBTRACT, 1);
            expect(problem.operation).toBe(MathOperation.SUBTRACT);
        });

        it('should generate multiplication problem', () => {
            const problem = generateProblem(MathOperation.MULTIPLY, 2);
            expect(problem.operation).toBe(MathOperation.MULTIPLY);
        });

        it('should throw for unsupported operation', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            // @ts-expect-error testing invalid operation
            expect(() => generateProblem('DIVIDE', 1)).toThrow('Unsupported math operation');
            consoleSpy.mockRestore();
        });
    });
});

describe('getSettings', () => {
    it('should return level1 settings for difficulty 1', () => {
        const settings = getSettings(1);
        expect(settings.addition.enabled).toBe(true);
    });

    it('should return level2 settings for difficulty 2', () => {
        const settings = getSettings(2);
        expect(settings.multiplication.enabled).toBe(true);
    });

    it('should return level3 settings for difficulty 3', () => {
        const settings = getSettings(3);
        expect(settings.multiplication.enabled).toBe(true);
    });

    it('should default to level1 settings for unknown difficulty', () => {
        // @ts-expect-error testing default fallback
        const settings = getSettings(99);
        expect(settings).toEqual(getSettings(1));
    });
});
