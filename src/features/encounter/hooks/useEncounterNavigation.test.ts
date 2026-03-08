import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEncounterNavigation } from './useEncounterNavigation';
import { useGameStore } from '../../../stores/game/store';
import { useEncounterStore } from '../../../stores/encounter/store';
import { EncounterPhase } from '../../../types/encounter.types';
import { useNavigate } from 'react-router-dom';

// Mocks
vi.mock('react-router-dom', () => ({
    useNavigate: vi.fn(),
}));

vi.mock('../../../stores/game/store');
vi.mock('../../../stores/encounter/store');

describe('useEncounterNavigation', () => {
    const mockNavigate = vi.fn();
    const mockCompleteEncounter = vi.fn();
    const mockAddCompanionExperience = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useNavigate).mockReturnValue(mockNavigate);

        // Default Game Store Mock
        vi.mocked(useGameStore).mockReturnValue({
            encounterResults: {},
            completeEncounter: mockCompleteEncounter,
            addCompanionExperience: mockAddCompanionExperience,
            companionStats: {
                'amara': { level: 1, experience: 0 },
                'tariq': { level: 6, experience: 100 }
            },
            activeParty: ['amara', 'tariq']
        } as ReturnType<typeof useGameStore>);

        // Default Encounter Store Mock
        (useEncounterStore.getState as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
            monsters: [{ id: 'm1', isBoss: false }]
        });
    });

    describe('handleCompletionContinue - Victory', () => {
        it('should show experience screen and award XP for normal encounters', () => {

            const { result } = renderHook(() => useEncounterNavigation({
                adventureId: '1',
                nodeIndex: 1,
                phase: EncounterPhase.VICTORY
            }));

            act(() => {
                result.current.handleCompletionContinue();
            });

            // XP Screen should be shown
            expect(result.current.showExperienceScreen).toBe(true);

            // Previous stats should be snapshotted
            expect(result.current.previousCompanionStats['amara']).toEqual({ level: 1, experience: 0 });
            expect(result.current.previousCompanionStats['tariq']).toEqual({ level: 6, experience: 100 });

            // XP should be awarded (Adventure 1 max level is 6, so Tariq at lvl 6 should NOT get XP)
            // Amara (lvl 1) should get XP
            expect(mockAddCompanionExperience).toHaveBeenCalledWith('amara', expect.any(Number));
            expect(mockAddCompanionExperience).not.toHaveBeenCalledWith('tariq', expect.any(Number));

            // Should NOT navigate yet
            expect(mockNavigate).not.toHaveBeenCalled();
        });

        it('should skip experience screen for ENDING nodes', () => {

            // Node 1_11 is ENDING in adventure 1
            const { result } = renderHook(() => useEncounterNavigation({
                adventureId: '1',
                nodeIndex: 11,
                phase: EncounterPhase.VICTORY
            }));

            act(() => {
                result.current.handleCompletionContinue();
            });

            expect(result.current.showExperienceScreen).toBe(false);
            expect(mockCompleteEncounter).toHaveBeenCalledWith('1', 11);
            expect(mockNavigate).toHaveBeenCalled();
        });

        it('should navigate to map with adventureCompleted state on boss victory', () => {

            // Mock boss in store
            (useEncounterStore.getState as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
                monsters: [{ id: 'boss', isBoss: true }]
            });

            const { result } = renderHook(() => useEncounterNavigation({
                adventureId: '1',
                nodeIndex: 10, // Boss node
                phase: EncounterPhase.VICTORY
            }));

            // First call shows XP screen
            act(() => {
                result.current.handleCompletionContinue();
            });
            expect(result.current.showExperienceScreen).toBe(true);

            // Second call (after XP screen) navigates
            act(() => {
                result.current.handleCompletionContinue();
            });

            expect(mockCompleteEncounter).toHaveBeenCalledWith('1', 10);
            expect(mockNavigate).toHaveBeenCalledWith('/map/1', {
                state: { adventureCompleted: true, focalNode: 10 }
            });
        });
    });

    describe('handleCompletionContinue - missing adventureId', () => {
        it('should navigate to chronicle when no adventureId is provided', () => {

            const { result } = renderHook(() => useEncounterNavigation({
                adventureId: undefined,
                nodeIndex: 1,
                phase: EncounterPhase.VICTORY
            }));

            act(() => {
                result.current.handleCompletionContinue();
            });

            expect(mockNavigate).toHaveBeenCalledWith('/chronicle');
        });
    });

    describe('handleCompletionContinue - Defeat', () => {
        it('should navigate back to the same node on map', () => {

            const { result } = renderHook(() => useEncounterNavigation({
                adventureId: '1',
                nodeIndex: 5,
                phase: EncounterPhase.DEFEAT
            }));

            act(() => {
                result.current.handleCompletionContinue();
            });

            expect(mockNavigate).toHaveBeenCalledWith('/map/1', {
                state: { focalNode: 5 }
            });
            expect(mockCompleteEncounter).not.toHaveBeenCalled();
        });
    });

    describe('handleCompletionContinue - companion not in stats', () => {
        it('should skip companions in activeParty that are not in companionStats', () => {
            // activeParty has 'unknown_companion' which is not in companionStats
            vi.mocked(useGameStore).mockReturnValue({
                encounterResults: {},
                completeEncounter: mockCompleteEncounter,
                addCompanionExperience: mockAddCompanionExperience,
                companionStats: {
                    'amara': { level: 1, experience: 0 }
                },
                activeParty: ['amara', 'unknown_companion']
            } as ReturnType<typeof useGameStore>);

            const { result } = renderHook(() => useEncounterNavigation({
                adventureId: '1',
                nodeIndex: 1,
                phase: EncounterPhase.VICTORY
            }));

            act(() => {
                result.current.handleCompletionContinue();
            });

            // unknown_companion skipped; only amara captured
            expect(result.current.previousCompanionStats['amara']).toBeDefined();
            expect(result.current.previousCompanionStats['unknown_companion']).toBeUndefined();
        });
    });

    describe('handleCompletionContinue - other phases', () => {
        it('should do nothing when phase is PLAYER_TURN', () => {
            const { result } = renderHook(() => useEncounterNavigation({
                adventureId: '1',
                nodeIndex: 1,
                phase: EncounterPhase.PLAYER_TURN
            }));

            act(() => {
                result.current.handleCompletionContinue();
            });

            // Should not navigate or complete
            expect(mockNavigate).not.toHaveBeenCalled();
            expect(mockCompleteEncounter).not.toHaveBeenCalled();
        });
    });
});
