import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { StoreApi } from 'zustand';
import { createProgressionSlice } from './progression.slice';
import type { GameStore } from '../interfaces';
import { EXPERIENCE_CONFIG, getRequiredXpForNextLevel } from '../../../data/experience.data';
import { PersistenceService } from '../../../services/persistence.service';

const mockGet = (state: Partial<GameStore>) => () => state as GameStore;
const mockSet = vi.fn() as unknown as StoreApi<GameStore>['setState'];

// Mock dependencies
vi.mock('../../../services/persistence.service', () => ({
    PersistenceService: {
        sync: vi.fn(),
    },
}));

vi.mock('../../../data/companions.data', () => ({
    getCompanionById: vi.fn((id) => id === 'valid_companion' ? { id: 'valid_companion' } : undefined),
    COMPANIONS: { 'valid_companion': { id: 'valid_companion' } }
}));

describe('progression.slice', () => {
    let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        vi.clearAllMocks();
        consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
    });

    afterEach(() => {
        consoleErrorSpy.mockRestore();
    });

    const setupSlice = (state: Partial<GameStore> = {}) => {
        const slice = createProgressionSlice(
            mockSet,
            mockGet({
                companionStats: {},
                activeParty: [],
                ...state
            }),
            {} as StoreApi<GameStore>
        );
        return slice;
    };

    describe('addCompanionExperience', () => {
        it('should add experience to existing companion and sync', () => {
            const slice = setupSlice({ companionStats: { 'valid_companion': { level: 1, experience: 0 } } });

            slice.addCompanionExperience('valid_companion', 50);

            expect(mockSet).toHaveBeenCalled();
            expect(PersistenceService.sync).toHaveBeenCalled();
        });



        it('should log error and do nothing if companion id is invalid', () => {
            const slice = setupSlice();

            slice.addCompanionExperience('invalid_id', 50);

            expect(consoleErrorSpy).toHaveBeenCalled();
            expect(mockSet).not.toHaveBeenCalled();
            expect(PersistenceService.sync).not.toHaveBeenCalled();
        });

        it('should log error and do nothing if companion level is not a number', () => {
            const slice = setupSlice({
                // @ts-expect-error testing invalid level type
                companionStats: { 'valid_companion': { level: 'invalid', experience: 0 } }
            });

            slice.addCompanionExperience('valid_companion', 50);

            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid level'));
            expect(mockSet).not.toHaveBeenCalled();
        });

        it('should add experience EVEN if companion already has enough to level up', () => {
            const requiredXp = getRequiredXpForNextLevel(1);
            const slice = setupSlice({
                companionStats: {
                    'valid_companion': { level: 1, experience: requiredXp }
                }
            });

            slice.addCompanionExperience('valid_companion', 10);

            expect(mockSet).toHaveBeenCalledWith({
                companionStats: {
                    'valid_companion': {
                        level: 1,
                        experience: requiredXp + 10
                    }
                }
            });
            expect(PersistenceService.sync).toHaveBeenCalled();
            expect(consoleErrorSpy).not.toHaveBeenCalled();
        });

        it('should not add experience and log error if companion is at max level', () => {
            const slice = setupSlice({
                companionStats: {
                    'valid_companion': { level: EXPERIENCE_CONFIG.MAX_LEVEL, experience: 0 }
                }
            });

            slice.addCompanionExperience('valid_companion', 50);

            expect(mockSet).not.toHaveBeenCalled();
            expect(consoleErrorSpy).toHaveBeenCalledWith(
                expect.stringContaining('already at max level')
            );
        });
    });

    describe('levelUpCompanion', () => {
        it('should level up companion if XP is sufficient and sync', () => {
            const requiredXp = getRequiredXpForNextLevel(1);
            const slice = setupSlice({
                companionStats: {
                    'valid_companion': { level: 1, experience: requiredXp + 10 }
                }
            });

            slice.levelUpCompanion('valid_companion');

            expect(mockSet).toHaveBeenCalled();
            expect(PersistenceService.sync).toHaveBeenCalled();
        });

        it('should NOT level up companion if XP is insufficient', () => {
            const requiredXp = getRequiredXpForNextLevel(1);
            const slice = setupSlice({
                companionStats: {
                    'valid_companion': { level: 1, experience: requiredXp - 1 }
                }
            });

            slice.levelUpCompanion('valid_companion');

            expect(mockSet).not.toHaveBeenCalled();
        });

        it('should NOT level up companion if at max level', () => {
            const slice = setupSlice({
                companionStats: {
                    'valid_companion': { level: EXPERIENCE_CONFIG.MAX_LEVEL, experience: 1000 }
                }
            });

            slice.levelUpCompanion('valid_companion');

            expect(mockSet).not.toHaveBeenCalled();
        });

        it('should log error and do nothing if companion stats not found', () => {
            const slice = setupSlice({ companionStats: {} });

            slice.levelUpCompanion('missing_companion');

            expect(consoleErrorSpy).toHaveBeenCalled();
            expect(mockSet).not.toHaveBeenCalled();
        });

        it('should log error and do nothing if companion level is not a number', () => {
            const slice = setupSlice({
                // @ts-expect-error testing invalid level type
                companionStats: { 'valid_companion': { level: 'not-a-number', experience: 0 } }
            });

            slice.levelUpCompanion('valid_companion');

            expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Invalid level'));
            expect(mockSet).not.toHaveBeenCalled();
        });
    });

    describe('addCompanionToParty', () => {
        it('should add companion to party if not already present and sync', () => {
            const slice = setupSlice({ activeParty: ['c1'] });

            slice.addCompanionToParty('c2');

            expect(mockSet).toHaveBeenCalledWith({ activeParty: ['c1', 'c2'] });
            expect(PersistenceService.sync).toHaveBeenCalled();
        });

        it('should NOT add companion to party if already present', () => {
            const slice = setupSlice({ activeParty: ['c1'] });

            slice.addCompanionToParty('c1');

            expect(mockSet).not.toHaveBeenCalled();
            expect(PersistenceService.sync).not.toHaveBeenCalled();
        });
    });
});
