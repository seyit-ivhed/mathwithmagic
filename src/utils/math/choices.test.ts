import { describe, it, expect } from 'vitest';
import { generateMultipleChoices } from './choices';

describe('choices utility', () => {
    describe('numeric choices', () => {
        it('should include the correct answer', () => {
            const answer = 10;
            const choices = generateMultipleChoices(answer);
            expect(choices).toContain(answer);
        });

        it('should generate the requested number of choices', () => {
            expect(generateMultipleChoices(10, 4)).toHaveLength(4);
            expect(generateMultipleChoices(10, 6)).toHaveLength(6);
            expect(generateMultipleChoices(10, 3)).toHaveLength(3);
        });

        it('should generate unique choices', () => {
            const choices = generateMultipleChoices(10, 4);
            const unique = new Set(choices);
            expect(unique.size).toBe(4);
        });

        it('should sort choices numerically', () => {
            const choices = generateMultipleChoices(50, 4);
            const sorted = [...choices].sort((a, b) => a - b);
            expect(choices).toEqual(sorted);
        });

        it('should handle small answers like 0 or 1 gracefully', () => {
            const choices = generateMultipleChoices(0, 4);
            expect(choices).toHaveLength(4);
            expect(new Set(choices).size).toBe(4);
            expect(choices.every(c => c >= 0)).toBe(true);
        });

        it('should handle large count by generating enough unique values', () => {
            // With a large count, the duplicate-handling fallback code paths are exercised
            const choices = generateMultipleChoices(1, 8);
            expect(choices).toHaveLength(8);
            expect(new Set(choices).size).toBe(8);
        });
    });
});
