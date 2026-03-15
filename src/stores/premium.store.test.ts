import { describe, it, expect, vi, beforeEach } from 'vitest';

// --- Supabase mock setup ---
const mockEq = vi.fn();
const mockSelect = vi.fn().mockReturnValue({ eq: mockEq });
const mockFrom = vi.fn().mockReturnValue({ select: mockSelect });
const mockGetUser = vi.fn();

vi.mock('../services/supabase.service', () => ({
    supabase: {
        from: (...args: unknown[]) => mockFrom(...args),
        auth: { getUser: (...args: unknown[]) => mockGetUser(...args) },
    },
}));

import { usePremiumStore } from './premium.store';

const MOCK_USER_ID = 'user-abc-123';

function resetStore() {
    usePremiumStore.setState({
        entitlements: [],
        isLoading: false,
        initialized: false,
    });
}

describe('Premium Store', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        resetStore();

        // Default mock chain: from → select → eq → resolves with data
        mockEq.mockResolvedValue({ data: [], error: null });
        mockSelect.mockReturnValue({ eq: mockEq });
        mockFrom.mockReturnValue({ select: mockSelect });
    });

    // --- initialize ---
    describe('initialize', () => {
        it('should skip if already initialized and force is false', async () => {
            usePremiumStore.setState({ initialized: true });

            await usePremiumStore.getState().initialize();

            expect(mockGetUser).not.toHaveBeenCalled();
            expect(mockFrom).not.toHaveBeenCalled();
        });

        it('should re-initialize when force is true even if already initialized', async () => {
            usePremiumStore.setState({ initialized: true });
            mockGetUser.mockResolvedValue({ data: { user: { id: MOCK_USER_ID } } });
            mockEq.mockResolvedValue({ data: [{ content_pack_id: 'premium_base' }], error: null });

            await usePremiumStore.getState().initialize(true);

            expect(mockFrom).toHaveBeenCalledWith('player_entitlements');
            expect(usePremiumStore.getState().entitlements).toEqual(['premium_base']);
        });

        it('should use profileData.id when provided instead of calling getUser', async () => {
            mockEq.mockResolvedValue({ data: [{ content_pack_id: 'dlc_1' }], error: null });

            await usePremiumStore.getState().initialize(false, { id: MOCK_USER_ID });

            expect(mockGetUser).not.toHaveBeenCalled();
            expect(mockFrom).toHaveBeenCalledWith('player_entitlements');
            expect(usePremiumStore.getState().entitlements).toEqual(['dlc_1']);
        });

        it('should fetch user from auth when no profileData is provided', async () => {
            mockGetUser.mockResolvedValue({ data: { user: { id: MOCK_USER_ID } } });
            mockEq.mockResolvedValue({ data: [{ content_pack_id: 'premium_base' }], error: null });

            await usePremiumStore.getState().initialize();

            expect(mockGetUser).toHaveBeenCalled();
            expect(usePremiumStore.getState().entitlements).toEqual(['premium_base']);
            expect(usePremiumStore.getState().initialized).toBe(true);
            expect(usePremiumStore.getState().isLoading).toBe(false);
        });

        it('should set empty entitlements and initialized when no user is found', async () => {
            mockGetUser.mockResolvedValue({ data: { user: null } });

            const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
            await usePremiumStore.getState().initialize();

            expect(usePremiumStore.getState().entitlements).toEqual([]);
            expect(usePremiumStore.getState().initialized).toBe(true);
            expect(usePremiumStore.getState().isLoading).toBe(false);
            consoleSpy.mockRestore();
        });

        it('should handle entitlements fetch error by throwing', async () => {
            mockGetUser.mockResolvedValue({ data: { user: { id: MOCK_USER_ID } } });
            const dbError = new Error('db error');
            mockEq.mockResolvedValue({ data: null, error: dbError });

            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            await expect(usePremiumStore.getState().initialize()).rejects.toThrow('db error');
            // isLoading should be false due to finally block
            expect(usePremiumStore.getState().isLoading).toBe(false);
            consoleSpy.mockRestore();
        });

        it('should handle null entitlementsData gracefully', async () => {
            mockGetUser.mockResolvedValue({ data: { user: { id: MOCK_USER_ID } } });
            mockEq.mockResolvedValue({ data: null, error: null });

            await usePremiumStore.getState().initialize();

            expect(usePremiumStore.getState().entitlements).toEqual([]);
            expect(usePremiumStore.getState().initialized).toBe(true);
        });
    });

    // --- isAdventureUnlocked ---
    describe('isAdventureUnlocked', () => {
        it('should always unlock adventure 1 (free)', () => {
            expect(usePremiumStore.getState().isAdventureUnlocked('1')).toBe(true);
        });

        it('should unlock adventures 2-6 when premium_base entitlement exists', () => {
            usePremiumStore.setState({ entitlements: ['premium_base'] });

            expect(usePremiumStore.getState().isAdventureUnlocked('2')).toBe(true);
            expect(usePremiumStore.getState().isAdventureUnlocked('3')).toBe(true);
            expect(usePremiumStore.getState().isAdventureUnlocked('6')).toBe(true);
        });

        it('should not unlock adventure 7 with only premium_base', () => {
            usePremiumStore.setState({ entitlements: ['premium_base'] });

            expect(usePremiumStore.getState().isAdventureUnlocked('7')).toBe(false);
        });

        it('should not unlock adventures 2-6 without premium_base', () => {
            usePremiumStore.setState({ entitlements: [] });

            expect(usePremiumStore.getState().isAdventureUnlocked('2')).toBe(false);
            expect(usePremiumStore.getState().isAdventureUnlocked('5')).toBe(false);
        });

        it('should return false for non-numeric adventure ids without entitlements', () => {
            expect(usePremiumStore.getState().isAdventureUnlocked('special')).toBe(false);
        });
    });

    // --- hasEntitlement ---
    describe('hasEntitlement', () => {
        it('should return true when the entitlement exists', () => {
            usePremiumStore.setState({ entitlements: ['premium_base', 'dlc_1'] });

            expect(usePremiumStore.getState().hasEntitlement('premium_base')).toBe(true);
            expect(usePremiumStore.getState().hasEntitlement('dlc_1')).toBe(true);
        });

        it('should return false when the entitlement does not exist', () => {
            usePremiumStore.setState({ entitlements: ['premium_base'] });

            expect(usePremiumStore.getState().hasEntitlement('dlc_2')).toBe(false);
        });

        it('should return false when entitlements are empty', () => {
            expect(usePremiumStore.getState().hasEntitlement('premium_base')).toBe(false);
        });
    });
});
