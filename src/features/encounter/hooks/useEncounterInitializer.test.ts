import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useEncounterInitializer } from './useEncounterInitializer';
import { useEncounterStore } from '../../../stores/encounter/store';
import { useGameStore } from '../../../stores/game/store';
import { buildBattleEncounterData } from '../utils/encounter-initializer';
import type { EncounterStore } from '../../../stores/encounter/interfaces';
import type { EncounterUnit } from '../../../types/encounter.types';
import type { AdventureMonster } from '../../../types/adventure.types';
import type { BattleEncounterData } from '../utils/encounter-initializer';

vi.mock('../../../stores/encounter/store');
vi.mock('../../../stores/game/store');
vi.mock('../utils/encounter-initializer');
vi.mock('react-i18next', () => ({
    useTranslation: () => ({ t: (k: string) => k })
}));

function mockEncounterStore(overrides: Partial<EncounterStore> = {}) {
    vi.mocked(useEncounterStore).mockReturnValue({
        initializeEncounter: mockInitializeEncounter,
        resetEncounter: mockResetEncounter,
        party: [],
        monsters: [],
        nodeIndex: 0,
        ...overrides
    } as EncounterStore);
}

function mockBuildData(overrides: Partial<BattleEncounterData> | null = {}) {
    if (overrides === null) {
        vi.mocked(buildBattleEncounterData).mockReturnValue(null);
        return;
    }
    vi.mocked(buildBattleEncounterData).mockReturnValue({
        activeParty: ['p1'],
        localizedEnemies: [{ id: 'm1' } as AdventureMonster],
        nodeIndex: 1,
        difficulty: 1,
        companionStats: {},
        ...overrides
    });
}

const mockInitializeEncounter = vi.fn();
const mockResetEncounter = vi.fn();

describe('useEncounterInitializer', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        mockEncounterStore();

        vi.mocked(useGameStore).mockReturnValue({
            activeParty: ['p1'],
            companionStats: {},
            activeEncounterDifficulty: 1
        } as ReturnType<typeof useGameStore>);

        mockBuildData();
    });

    it('should initialize when store is empty', () => {
        renderHook(() => useEncounterInitializer('adv1', 1));

        expect(mockInitializeEncounter).toHaveBeenCalled();
    });

    it('should NOT initialize when already on the same node and adventure', () => {
        mockEncounterStore({
            party: [{ templateId: 'p1' } as EncounterUnit],
            monsters: [{ templateId: 'm1' } as EncounterUnit],
            nodeIndex: 1
        });

        renderHook(() => useEncounterInitializer('adv1', 1));

        expect(mockInitializeEncounter).not.toHaveBeenCalled();
    });

    it('should initialize when node index changes', () => {
        mockEncounterStore({
            party: [{ templateId: 'p1' } as EncounterUnit],
            monsters: [{ templateId: 'm1' } as EncounterUnit],
            nodeIndex: 2
        });

        renderHook(() => useEncounterInitializer('adv1', 1));

        expect(mockInitializeEncounter).toHaveBeenCalled();
    });

    it('should initialize when party composition changes', () => {
        mockEncounterStore({
            party: [{ templateId: 'p2' } as EncounterUnit],
            monsters: [{ templateId: 'm1' } as EncounterUnit],
            nodeIndex: 1
        });

        renderHook(() => useEncounterInitializer('adv1', 1));

        expect(mockInitializeEncounter).toHaveBeenCalled();
    });

    it('should initialize when expected monsters are different (Bug Fix Test)', () => {
        mockEncounterStore({
            party: [{ templateId: 'p1' } as EncounterUnit],
            monsters: [{ templateId: 'm1' } as EncounterUnit],
            nodeIndex: 1
        });

        mockBuildData({
            localizedEnemies: [{ id: 'm2' } as AdventureMonster],
        });

        renderHook(() => useEncounterInitializer('adv2', 1));

        expect(mockInitializeEncounter).toHaveBeenCalled();
    });

    it('should NOT initialize if adventureId is missing', () => {
        renderHook(() => useEncounterInitializer(undefined, 1));

        expect(mockInitializeEncounter).not.toHaveBeenCalled();
    });

    it('should NOT initialize if buildBattleEncounterData returns null (e.g. puzzle node)', () => {
        mockBuildData(null);

        renderHook(() => useEncounterInitializer('adv1', 1));

        expect(mockInitializeEncounter).not.toHaveBeenCalled();
    });
});
