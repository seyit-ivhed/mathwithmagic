import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useChronicleData } from './useChronicleData';
import { useGameStore } from '../../../stores/game/store';
import { AdventureStatus } from '../../../types/adventure.types';
import * as navigationUtils from '../../adventure/utils/navigation.utils';

// Mock the stores
vi.mock('../../../stores/game/store');

// Mock i18next
vi.mock('react-i18next', () => ({
    useTranslation: () => ({
        t: (key: string) => key,
    }),
}));

describe('useChronicleData', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('initial adventure selection', () => {
        it('should default to adventure 1 for new players with no progress', () => {
            // Mock new player state - no encounter results
            vi.mocked(useGameStore).mockReturnValue({
                encounterResults: {},
                adventureStatuses: {
                    '1': AdventureStatus.AVAILABLE,
                },
            } as ReturnType<typeof useGameStore>);

            const { result } = renderHook(() => useChronicleData());

            expect(result.current.activeAdventureId).toBe('1');
        });

        it('should show highest unlocked adventure for returning players with progress', () => {
            // Mock returning player state - has encounter results
            vi.mocked(useGameStore).mockReturnValue({
                encounterResults: {
                    '1_1': { stars: 3, difficulty: 1, completedAt: Date.now() },
                },
                adventureStatuses: {
                    '1': AdventureStatus.COMPLETED,
                    '2': AdventureStatus.AVAILABLE,
                },
            } as ReturnType<typeof useGameStore>);

            const { result } = renderHook(() => useChronicleData());

            // Should show adventure 2 (highest unlocked)
            expect(result.current.activeAdventureId).toBe('2');
        });

        it('should respect overrideAdventureId regardless of progress', () => {
            // Mock returning player state
            vi.mocked(useGameStore).mockReturnValue({
                encounterResults: {
                    '1_1': { stars: 3, difficulty: 1, completedAt: Date.now() },
                },
                adventureStatuses: {
                    '1': AdventureStatus.COMPLETED,
                    '2': AdventureStatus.AVAILABLE,
                },
            } as ReturnType<typeof useGameStore>);

            // Pass override '1' even though '2' is available
            const { result } = renderHook(() => useChronicleData('1'));

            expect(result.current.activeAdventureId).toBe('1');
        });

        it('should log error and return empty string when highestUnlocked is undefined for a player with progress', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            // Mock getHighestUnlockedAdventure to return undefined
            vi.spyOn(navigationUtils, 'getHighestUnlockedAdventure').mockReturnValueOnce(undefined);

            vi.mocked(useGameStore).mockReturnValue({
                encounterResults: {
                    '1_1': { stars: 3, difficulty: 1, completedAt: Date.now() },
                },
                adventureStatuses: {},
            } as ReturnType<typeof useGameStore>);

            const { result } = renderHook(() => useChronicleData());

            expect(result.current.activeAdventureId).toBe('');
            consoleSpy.mockRestore();
        });

        it('should expose setActiveAdventureId and adventures', () => {
            vi.mocked(useGameStore).mockReturnValue({
                encounterResults: {},
                adventureStatuses: { '1': AdventureStatus.AVAILABLE },
            } as ReturnType<typeof useGameStore>);

            const { result } = renderHook(() => useChronicleData());

            expect(typeof result.current.setActiveAdventureId).toBe('function');
            expect(Array.isArray(result.current.adventures)).toBe(true);
            expect(result.current.currentAdventure).toBeDefined();
            expect(result.current.encounterResults).toBeDefined();
        });
    });
});
