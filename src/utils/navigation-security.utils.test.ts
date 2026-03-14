import { describe, it, expect, vi } from 'vitest';
import { checkNavigationAccess } from './navigation-security.utils';

// Mock ADVENTURES data
vi.mock('../data/adventures.data', () => ({
    ADVENTURES: [
        {
            id: '1',
            encounters: [
                { id: '1_1', type: 'BATTLE' },
                { id: '1_2', type: 'PUZZLE' },
                { id: '1_3', type: 'BOSS' }
            ]
        },
        {
            id: 'locked_adv',
            encounters: [{ id: 'l1', type: 'BATTLE' }]
        },
        {
            id: 'premium_only',
            encounters: [{ id: 'pr1', type: 'BATTLE' }]
        }
    ]
}));

describe('navigation-security.utils', () => {
    const mockIsPremiumUnlocked = (id: string) => id !== 'premium_only';
    const mockIsProgressionUnlocked = (id: string) => id !== 'locked_adv';

    it('should allow access to available adventure', () => {
        const result = checkNavigationAccess({
            adventureId: '1',
            isPremiumUnlocked: mockIsPremiumUnlocked,
            isProgressionUnlocked: mockIsProgressionUnlocked,
            encounterResults: {}
        });
        expect(result.allowed).toBe(true);
    });

    it('should deny access to invalid adventure', () => {
        const result = checkNavigationAccess({
            adventureId: 'non_existent',
            isPremiumUnlocked: mockIsPremiumUnlocked,
            isProgressionUnlocked: mockIsProgressionUnlocked,
            encounterResults: {}
        });
        expect(result.allowed).toBe(false);
        expect(result.reason).toBe('INVALID_ADVENTURE');
    });

    it('should deny access to premium-locked adventure', () => {
        const result = checkNavigationAccess({
            adventureId: 'premium_only',
            isPremiumUnlocked: () => false,
            isProgressionUnlocked: () => true,
            encounterResults: {}
        });
        expect(result.allowed).toBe(false);
        expect(result.reason).toBe('PREMIUM_LOCKED');
    });

    it('should deny access to progression-locked adventure', () => {
        const result = checkNavigationAccess({
            adventureId: 'locked_adv',
            isPremiumUnlocked: mockIsPremiumUnlocked,
            isProgressionUnlocked: mockIsProgressionUnlocked,
            encounterResults: {}
        });
        expect(result.allowed).toBe(false);
        expect(result.reason).toBe('ADVENTURE_LOCKED');
    });

    it('should allow first node access with no results', () => {
        const result = checkNavigationAccess({
            adventureId: '1',
            nodeIndex: 1,
            isPremiumUnlocked: mockIsPremiumUnlocked,
            isProgressionUnlocked: mockIsProgressionUnlocked,
            encounterResults: {}
        });
        expect(result.allowed).toBe(true);
    });

    it('should deny jumping ahead in nodes', () => {
        const result = checkNavigationAccess({
            adventureId: '1',
            nodeIndex: 2,
            isPremiumUnlocked: mockIsPremiumUnlocked,
            isProgressionUnlocked: mockIsProgressionUnlocked,
            encounterResults: {}
        });
        expect(result.allowed).toBe(false);
        expect(result.reason).toBe('NODE_LOCKED');
    });

    it('should allow access to node if all previous are completed', () => {
        const result = checkNavigationAccess({
            adventureId: '1',
            nodeIndex: 3,
            isPremiumUnlocked: mockIsPremiumUnlocked,
            isProgressionUnlocked: mockIsProgressionUnlocked,
            encounterResults: {
                '1_1': { stars: 3 },
                '1_2': { stars: 3 }
            }
        });
        expect(result.allowed).toBe(true);
    });

    it('should deny access if a previous gating encounter has 0 stars', () => {
        const result = checkNavigationAccess({
            adventureId: '1',
            nodeIndex: 2,
            isPremiumUnlocked: mockIsPremiumUnlocked,
            isProgressionUnlocked: mockIsProgressionUnlocked,
            encounterResults: {
                '1_1': { stars: 0 }
            }
        });
        expect(result.allowed).toBe(false);
        expect(result.reason).toBe('NODE_LOCKED');
    });
});
