import { describe, it, expect } from 'vitest';
import { validateAnswer } from './validation';

describe('validateAnswer', () => {
    it('should return isCorrect: true when numbers match', () => {
        const result = validateAnswer(42, 42);
        expect(result.isCorrect).toBe(true);
        expect(result.feedback).toBe('correct');
        expect(result.userAnswer).toBe(42);
        expect(result.correctAnswer).toBe(42);
    });

    it('should return isCorrect: false when numbers do not match', () => {
        const result = validateAnswer(40, 42);
        expect(result.isCorrect).toBe(false);
        expect(result.feedback).toBe('incorrect');
    });

    it('should convert string userAnswer to number', () => {
        const result = validateAnswer('42', 42);
        expect(result.isCorrect).toBe(true);
        expect(result.userAnswer).toBe(42);
    });

    it('should convert string correctAnswer to number', () => {
        const result = validateAnswer(42, '42');
        expect(result.isCorrect).toBe(true);
        expect(result.correctAnswer).toBe(42);
    });

    it('should convert both string answers to numbers for comparison', () => {
        const result = validateAnswer('10', '10');
        expect(result.isCorrect).toBe(true);
        expect(result.userAnswer).toBe(10);
        expect(result.correctAnswer).toBe(10);
    });

    it('should return isCorrect: false when string user answer differs from number correct answer', () => {
        const result = validateAnswer('5', 10);
        expect(result.isCorrect).toBe(false);
    });
});
