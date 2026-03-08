import { describe, it, expect } from 'vitest';
import { CONFIG } from './config';
import { getDifficultyExamples } from './difficulty-examples';
import { type DifficultyLevel, MathOperation } from '../../types/math.types';


const parseExample = (example: string) => {
    const match = example.match(/(\d+)\s*([+\-×÷])\s*(\d+)/);
    if (!match) throw new Error(`Failed to parse example: ${example}`);

    const [, op1, symbol, op2] = match;
    let operation: MathOperation;
    switch (symbol) {
        case '+': operation = MathOperation.ADD; break;
        case '-': operation = MathOperation.SUBTRACT; break;
        case '×': operation = MathOperation.MULTIPLY; break;
        default: throw new Error(`Unknown operation symbol: ${symbol}`);
    }

    return {
        operand1: parseInt(op1, 10),
        operand2: parseInt(op2, 10),
        operation
    };
};

describe('Difficulty Examples Boundary Check', () => {
    const levels: DifficultyLevel[] = [1, 2, 3];

    levels.forEach((level) => {
        describe(`Level ${level}`, () => {
            const examples = getDifficultyExamples(level);
            const levelConfig = CONFIG[`level${level}` as keyof typeof CONFIG];

            examples.forEach((example) => {
                it(`should have ${example} within level ${level} boundaries`, () => {
                    const { operand1, operand2, operation } = parseExample(example);

                    let opConfig;
                    switch (operation) {
                        case MathOperation.ADD: opConfig = levelConfig.addition; break;
                        case MathOperation.SUBTRACT: opConfig = levelConfig.subtraction; break;
                        case MathOperation.MULTIPLY: opConfig = levelConfig.multiplication; break;
                        default: throw new Error('Unsupported operation');
                    }

                    expect(opConfig.enabled).toBe(true);

                    // Note: Subtraction logic in operations.ts might swap operands if op1 < op2.
                    // But for examples, we should follow the config or the intended result.
                    // Division also has specific logic.

                    expect(operand1).toBeGreaterThanOrEqual(opConfig.left.min);
                    expect(operand1).toBeLessThanOrEqual(opConfig.left.max);
                    expect(operand2).toBeGreaterThanOrEqual(opConfig.right.min);
                    expect(operand2).toBeLessThanOrEqual(opConfig.right.max);
                });
            });
        });
    });

    it('should return empty array for unknown level', () => {
        // getDifficultyExamples falls through to the default case
        expect(getDifficultyExamples(99)).toEqual([]);
        expect(getDifficultyExamples(0)).toEqual([]);
    });
});
