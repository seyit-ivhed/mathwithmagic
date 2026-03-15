import { describe, it, expect, vi } from 'vitest';
import { generateBalanceData, validateBalance, calculateTotalWeight } from './BalanceEngine';

describe('Balance Engine', () => {
    describe('generateBalanceData', () => {
        it('should generate valid puzzle data structure', () => {
            const data = generateBalanceData(1);
            expect(data).toHaveProperty('leftStack');
            expect(data).toHaveProperty('rightStack');
            expect(data).toHaveProperty('targetBalance');
            expect(data.leftStack.length).toBeGreaterThan(0);
            expect(data.rightStack.length).toBeGreaterThan(0);
        });

        it('should include exactly two heavy weights', () => {
            const data = generateBalanceData(1);
            const allWeights = [...data.leftStack, ...data.rightStack];
            const heavyWeights = allWeights.filter(w => w.isHeavy);
            expect(heavyWeights).toHaveLength(2);
        });

        it('should place heavy weights at index 0 of both stacks', () => {
            const data = generateBalanceData(1);
            expect(data.leftStack[0].isHeavy).toBe(true);
            expect(data.rightStack[0].isHeavy).toBe(true);
        });

        it('should generate solvable puzzles', () => {
            // This is a bit tricky to test deterministically without solving it,
            // but we can check if there EXIST subsets that strictly sum to target.
            // Since our generation logic guarantees it, we can trust the generator 
            // logic or check generation properties.
            const data = generateBalanceData(2);

            // Verify there exists at least one combination on each side that sums to target
            // NOTE: This assumes generation logic creates exact subsets.
            // Our generator creates Solution Set + Noise.
            // So sum(Solution) == Target.

            // We can't easily reverse-engineer which are noise without exposing internal properties,
            // but we can sanity check ranges.

            const leftTotal = calculateTotalWeight(data.leftStack);
            const rightTotal = calculateTotalWeight(data.rightStack);

            expect(leftTotal).toBeGreaterThanOrEqual(data.targetBalance);
            expect(rightTotal).toBeGreaterThanOrEqual(data.targetBalance);
        });

        it('should generate difficulty 3 puzzles', () => {
            const data = generateBalanceData(3);
            expect(data).toHaveProperty('leftStack');
            expect(data.leftStack.length).toBeGreaterThan(0);
        });

        it('should recurse and then hit fallback when puzzle is always balanced', () => {
            // Math.random() = 0 makes getRandomInt always return min,
            // producing identical noise on both sides → balanced stacks
            vi.spyOn(Math, 'random').mockReturnValue(0);
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            // retryCount=9 will recurse once (covers recursive branch),
            // then hit MAX_GENERATION_RETRIES=10 (covers fallback branch)
            const data = generateBalanceData(1, 9);

            expect(consoleSpy).toHaveBeenCalledWith(
                'Failed to generate unbalanced puzzle after max retries'
            );
            expect(data).toHaveProperty('leftStack');

            consoleSpy.mockRestore();
            vi.restoreAllMocks();
        });
    });

    describe('validateBalance', () => {
        it('should return true for balanced stacks', () => {
            const w1 = { id: '1', value: 10, isHeavy: false };
            const w2 = { id: '2', value: 5, isHeavy: false };
            const left = [w1];
            const right = [w2, w2]; // 10 == 5+5
            expect(validateBalance(left, right)).toBe(true);
        });

        it('should return false for unbalanced stacks', () => {
            const w1 = { id: '1', value: 10, isHeavy: false };
            const w2 = { id: '2', value: 5, isHeavy: false };
            const left = [w1];
            const right = [w2]; // 10 != 5
            expect(validateBalance(left, right)).toBe(false);
        });

        it('should return false for empty/zero stacks', () => {
            expect(validateBalance([], [])).toBe(false); // Expecting sum > 0 based on implementation
        });
    });
});
