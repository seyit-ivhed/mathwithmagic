import { describe, it, expect, vi } from 'vitest';
import { generateEquationData, validateAnswer } from './EquationEngine';

describe('EquationEngine', () => {
    const difficulties = [1, 2, 3] as const;

    describe('generateEquationData', () => {
        difficulties.forEach(difficulty => {
            describe(`difficulty ${difficulty}`, () => {
                it('should return valid data structure', () => {
                    const data = generateEquationData(difficulty);
                    expect(data.puzzleType).toBe('EQUATION');
                    expect(data.equations.length).toBeGreaterThanOrEqual(2);
                    expect(data.symbols.length).toBeGreaterThanOrEqual(2);
                    expect(data.targetSymbolIndex).toBeGreaterThanOrEqual(0);
                    expect(data.targetSymbolIndex).toBeLessThan(data.symbols.length);
                    expect(data.correctAnswer).toBeGreaterThan(0);
                });

                it('should include correct answer in choices', () => {
                    const data = generateEquationData(difficulty);
                    expect(data.choices).toContain(data.correctAnswer);
                });

                it('should have exactly 4 choices', () => {
                    const data = generateEquationData(difficulty);
                    expect(data.choices).toHaveLength(4);
                });

                it('should have all positive choice values', () => {
                    const data = generateEquationData(difficulty);
                    data.choices.forEach(choice => {
                        expect(choice).toBeGreaterThan(0);
                    });
                });

                it('should have unique choices', () => {
                    const data = generateEquationData(difficulty);
                    const uniqueChoices = new Set(data.choices);
                    expect(uniqueChoices.size).toBe(4);
                });

                it('should have unique symbols', () => {
                    const data = generateEquationData(difficulty);
                    const uniqueSymbols = new Set(data.symbols);
                    expect(uniqueSymbols.size).toBe(data.symbols.length);
                });

                it('should generate consistent equations', () => {
                    for (let run = 0; run < 10; run++) {
                        const data = generateEquationData(difficulty);
                        expect(data.equations.length).toBeGreaterThanOrEqual(2);
                        data.equations.forEach(eq => {
                            expect(eq.right).toBeGreaterThan(0);
                            expect(eq.left.length).toBeGreaterThanOrEqual(1);
                        });
                    }
                });
            });
        });

        it('should generate more variables at difficulty 3', () => {
            let hasThreeVars = false;
            for (let i = 0; i < 20; i++) {
                const data = generateEquationData(3);
                if (data.symbols.length === 3) {
                    hasThreeVars = true;
                    break;
                }
            }
            expect(hasThreeVars).toBe(true);
        });

        it('should throw for invalid difficulty (null/undefined/string)', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            // @ts-expect-error testing invalid input
            expect(() => generateEquationData(null)).toThrow('Valid difficulty level is required');
            consoleSpy.mockRestore();
        });
    });

    describe('validateAnswer', () => {
        it('should return true for correct answer', () => {
            expect(validateAnswer(5, 5)).toBe(true);
        });

        it('should return false for incorrect answer', () => {
            expect(validateAnswer(3, 5)).toBe(false);
        });
    });
});
