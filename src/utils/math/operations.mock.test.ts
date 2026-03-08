/**
 * Targeted tests for dead-code defensive branches in operations.ts.
 * These branches require mocking dependencies to trigger.
 */

import { describe, it, expect, vi, afterEach } from 'vitest';
import { MathOperation } from '../../types/math.types';

// Mock config so we can control which operations are enabled
vi.mock('./config', () => ({
    getSettings: vi.fn(),
}));

// Mock helpers so we can force operand1 < operand2 for the swap branch
vi.mock('./helpers', () => ({
    getRandomInt: vi.fn(),
}));

const { getSettings } = await import('./config');
const { getRandomInt } = await import('./helpers');
const { getAllowedOperations, generateSubtractionProblem } = await import('./operations');

const makeConfig = (addition: boolean, subtraction: boolean, multiplication: boolean) => ({
    addition: { enabled: addition, left: { min: 1, max: 10 }, right: { min: 1, max: 5 } },
    subtraction: { enabled: subtraction, left: { min: 1, max: 10 }, right: { min: 1, max: 5 } },
    multiplication: { enabled: multiplication, left: { min: 0, max: 0 }, right: { min: 0, max: 0 } },
});

describe('getAllowedOperations — disabled branches (dead-code coverage)', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should return [ADD] and log error when all operations are disabled', () => {
        vi.mocked(getSettings).mockReturnValue(makeConfig(false, false, false));
        vi.mocked(getRandomInt).mockReturnValue(3);
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        // @ts-expect-error testing arbitrary difficulty with mocked getSettings
        const result = getAllowedOperations(1);

        expect(result).toEqual([MathOperation.ADD]);
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('No allowed operations'));
        consoleSpy.mockRestore();
    });

    it('should skip addition when disabled', () => {
        vi.mocked(getSettings).mockReturnValue(makeConfig(false, true, false));
        vi.mocked(getRandomInt).mockReturnValue(3);

        // @ts-expect-error testing with mocked getSettings
        const result = getAllowedOperations(1);

        expect(result).not.toContain(MathOperation.ADD);
        expect(result).toContain(MathOperation.SUBTRACT);
    });

    it('should skip subtraction when disabled', () => {
        vi.mocked(getSettings).mockReturnValue(makeConfig(true, false, false));
        vi.mocked(getRandomInt).mockReturnValue(3);

        // @ts-expect-error testing with mocked getSettings
        const result = getAllowedOperations(1);

        expect(result).toContain(MathOperation.ADD);
        expect(result).not.toContain(MathOperation.SUBTRACT);
    });
});

describe('generateSubtractionProblem — operand swap branch (dead-code coverage)', () => {
    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should swap operands when operand1 < operand2', () => {
        vi.mocked(getSettings).mockReturnValue(makeConfig(true, true, false));
        // First call returns 2 (operand1), second returns 5 (operand2) → 2 < 5 → swap
        vi.mocked(getRandomInt).mockReturnValueOnce(2).mockReturnValueOnce(5);

        // @ts-expect-error testing with mocked getSettings
        const problem = generateSubtractionProblem(1);

        expect(problem.operand1).toBe(5);   // swapped
        expect(problem.operand2).toBe(2);   // swapped
        expect(problem.correctAnswer).toBe(3); // 5 - 2
    });
});
