import { describe, it, expect } from 'vitest';
import { formatDisplayPrice } from './payment.service';

describe('formatDisplayPrice', () => {
    it('should convert cents to whole units with currency', () => {
        expect(formatDisplayPrice(5900, 'SEK')).toBe('59 SEK');
    });

    it('should handle fractional amounts', () => {
        expect(formatDisplayPrice(9950, 'SEK')).toBe('99.5 SEK');
    });

    it('should handle zero', () => {
        expect(formatDisplayPrice(0, 'SEK')).toBe('0 SEK');
    });

    it('should work with other currencies', () => {
        expect(formatDisplayPrice(1299, 'USD')).toBe('12.99 USD');
    });
});
