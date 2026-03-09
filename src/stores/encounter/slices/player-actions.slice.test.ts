import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useEncounterStore } from '../store';
import { initialEncounterState } from '../initial-state';
import { EncounterPhase, EncounterUnit } from '../../../types/encounter.types';


// Mock getCompanionById
vi.mock('../../../data/companions.data', () => ({
    getCompanionById: (id: string) => {
        if (id === 'warrior_id') {
            return {
                id,
                name: 'Warrior',
                baseStats: { abilityDamage: 10 },
                spiritGain: 35,
                specialAbility: { id: 'precision_shot', variables: { damage: 20 } }
            };
        }

        if (id === 'guardian_id_revived') {
            return {
                id,
                name: 'Guardian',
                baseStats: {},
                spiritGain: 35,
                specialAbility: { id: 'elixir_of_life', variables: { heal: 15 } }
            };
        }

        if (id === 'aoe_dmg_id') {
            return {
                id,
                name: 'Mage',
                baseStats: { abilityDamage: 10 },
                spiritGain: 35,
                specialAbility: { id: 'ancestral_storm', variables: { damage: 10 } }
            };
        }

        return {
            id,
            baseStats: {},
            spiritGain: 35,
        };
    }
}));

describe('Player Actions Slice', () => {
    beforeEach(() => {
        useEncounterStore.setState(initialEncounterState);
        useEncounterStore.setState({
            party: [],
            monsters: []
        });
        vi.useFakeTimers();
        Object.defineProperty(HTMLMediaElement.prototype, 'play', {
            writable: true,
            configurable: true,
            value: vi.fn().mockResolvedValue(undefined),
        });
    });

    describe('performAction', () => {
        it('should deal damage for standard attack', () => {
            const warrior = { id: 'u1', templateId: 'warrior_id', name: 'Warrior', hasActed: false, maxHealth: 100, currentHealth: 100, isDead: false, isPlayer: true, currentSpirit: 0, maxSpirit: 100, spiritGain: 10, damage: 10 };
            const monster = { id: 'm1', templateId: 'goblin', name: 'Goblin', currentHealth: 50, maxHealth: 50, isDead: false, isPlayer: false, currentSpirit: 0, maxSpirit: 100, hasActed: false, spiritGain: 10 };

            useEncounterStore.setState({ party: [warrior] as EncounterUnit[], monsters: [monster] as EncounterUnit[], endPlayerTurn: vi.fn() });

            useEncounterStore.getState().performAction('u1');

            const state = useEncounterStore.getState();
            expect(state.monsters[0].currentHealth).toBe(40); // 50 - 10
            expect(state.party[0].hasActed).toBe(true);
        });

        it('should trigger victory if all monsters are defeated', () => {
            const warrior = { id: 'u1', templateId: 'warrior_id', name: 'Warrior', hasActed: false, maxHealth: 100, currentHealth: 100, isDead: false, isPlayer: true, currentSpirit: 0, maxSpirit: 100, spiritGain: 10, damage: 100 };
            const monster = { id: 'm1', templateId: 'goblin', name: 'Goblin', currentHealth: 10, maxHealth: 50, isDead: false, isPlayer: false, currentSpirit: 0, maxSpirit: 100, hasActed: false, spiritGain: 10 };

            useEncounterStore.setState({ party: [warrior] as EncounterUnit[], monsters: [monster] as EncounterUnit[], phase: EncounterPhase.PLAYER_TURN });

            useEncounterStore.getState().performAction('u1');

            vi.advanceTimersByTime(1500);

            const state = useEncounterStore.getState();
            expect(state.phase).toBe(EncounterPhase.VICTORY);
            expect(state.monsters[0].isDead).toBe(true);
        });

        it('should end turn if all party members have acted', () => {
            const warrior = { id: 'u1', templateId: 'warrior_id', name: 'Warrior', hasActed: false, maxHealth: 100, currentHealth: 100, isDead: false, isPlayer: true, currentSpirit: 0, maxSpirit: 100, spiritGain: 10, damage: 10 };
            const monster = { id: 'm1', templateId: 'goblin', name: 'Goblin', currentHealth: 50, maxHealth: 50, isDead: false, isPlayer: false, currentSpirit: 0, maxSpirit: 100, hasActed: false, spiritGain: 10 };

            const endPlayerTurnMock = vi.fn();
            useEncounterStore.setState({ party: [warrior] as EncounterUnit[], monsters: [monster] as EncounterUnit[], endPlayerTurn: endPlayerTurnMock });

            useEncounterStore.getState().performAction('u1');
            expect(endPlayerTurnMock).toHaveBeenCalled();
        });

        it('should end turn if alive members acted and others are dead', () => {
            const warrior = { id: 'u1', templateId: 'warrior_id', name: 'Warrior', hasActed: false, maxHealth: 100, currentHealth: 100, isDead: false, isPlayer: true, currentSpirit: 0, maxSpirit: 100, spiritGain: 10, damage: 10 };
            const deadWarrior = { id: 'u2', templateId: 'warrior_id', name: 'Dead Warrior', hasActed: false, maxHealth: 100, currentHealth: 0, isDead: true, isPlayer: true, currentSpirit: 0, maxSpirit: 100, spiritGain: 10, damage: 10 };

            const monster = { id: 'm1', templateId: 'goblin', name: 'Goblin', currentHealth: 50, maxHealth: 50, isDead: false, isPlayer: false, currentSpirit: 0, maxSpirit: 100, hasActed: false, spiritGain: 10 };

            const endPlayerTurnMock = vi.fn();
            useEncounterStore.setState({ party: [warrior, deadWarrior] as EncounterUnit[], monsters: [monster] as EncounterUnit[], endPlayerTurn: endPlayerTurnMock });

            useEncounterStore.getState().performAction('u1');
            expect(endPlayerTurnMock).toHaveBeenCalled();
        });

        it('should return early if unit not found or already acted', () => {
            const warrior = { id: 'u1', templateId: 'warrior_id', name: 'Warrior', hasActed: true, maxHealth: 100, currentHealth: 100, isDead: false, isPlayer: true, currentSpirit: 0, maxSpirit: 100, spiritGain: 10, damage: 10 };
            useEncounterStore.setState({ party: [warrior] as EncounterUnit[], monsters: [] });
            useEncounterStore.getState().performAction('u1'); // already acted
            useEncounterStore.getState().performAction('u2'); // not found
        });

        it('should play attack sound when unit has one', () => {
            const warrior = { id: 'u1', templateId: 'warrior_id', name: 'Warrior', hasActed: false, maxHealth: 100, currentHealth: 100, isDead: false, isPlayer: true, currentSpirit: 0, maxSpirit: 100, spiritGain: 10, damage: 10, attackSound: 'battle/lion' };
            const monster = { id: 'm1', templateId: 'goblin', name: 'Goblin', currentHealth: 50, maxHealth: 50, isDead: false, isPlayer: false, currentSpirit: 0, maxSpirit: 100, hasActed: false, spiritGain: 10 };

            useEncounterStore.setState({ party: [warrior] as EncounterUnit[], monsters: [monster] as EncounterUnit[], endPlayerTurn: vi.fn() });

            expect(() => useEncounterStore.getState().performAction('u1')).not.toThrow();
        });
    });

    describe('resolveSpecialAttack', () => {
        const baseUnit = {
            image: '',
            title: '',
            isDead: false,
            hasActed: false,
            currentSpirit: 100,
            maxSpirit: 100,
            spiritGain: 10,
            isPlayer: true
        };

        it('should deal single target damage', async () => {
            const warrior = { ...baseUnit, id: 'u1', templateId: 'warrior_id', name: 'Warrior', maxHealth: 100, currentHealth: 100, specialAbilityId: 'precision_shot', specialAbilityVariables: { damage: 20 } };
            const monster = { ...baseUnit, id: 'm1', templateId: 'goblin', name: 'Goblin', currentHealth: 50, maxHealth: 50, isPlayer: false };

            useEncounterStore.setState({ party: [warrior], monsters: [monster] });

            useEncounterStore.getState().resolveSpecialAttack('u1', true);

            // Wait for async update
            await vi.waitFor(() => {
                const state = useEncounterStore.getState();
                if (state.monsters[0].currentHealth !== 30) throw new Error('Not updated yet');
            });

            const state = useEncounterStore.getState();
            expect(state.monsters[0].currentHealth).toBe(30); // 50 - 20
            expect(state.party[0].currentSpirit).toBe(0);
            expect(state.party[0].hasActed).toBe(true);
        });

        it('should deal AOE damage', async () => {
            const mage = { ...baseUnit, id: 'u1', templateId: 'aoe_dmg_id', name: 'Mage', maxHealth: 100, currentHealth: 100, specialAbilityId: 'ancestral_storm', specialAbilityVariables: { damage: 10 } };
            const m1 = { ...baseUnit, id: 'm1', templateId: 'g1', name: 'G1', currentHealth: 50, maxHealth: 50, isPlayer: false };
            const m2 = { ...baseUnit, id: 'm2', templateId: 'g2', name: 'G2', currentHealth: 30, maxHealth: 30, isPlayer: false };

            useEncounterStore.setState({ party: [mage], monsters: [m1, m2] });

            useEncounterStore.getState().resolveSpecialAttack('u1', true);

            // Wait for async update
            await vi.waitFor(() => {
                const state = useEncounterStore.getState();
                if (state.monsters[0].currentHealth !== 40) throw new Error('Not updated yet');
            });

            const state = useEncounterStore.getState();
            expect(state.monsters[0].currentHealth).toBe(40); // 50 - 10
            expect(state.monsters[1].currentHealth).toBe(20); // 30 - 10
        });

        it('should return early if unit not found or no ability', () => {
            const warrior = { ...baseUnit, id: 'u1', templateId: 'warrior_id', specialAbilityId: undefined };
            useEncounterStore.setState({ party: [warrior] as EncounterUnit[], monsters: [] });
            useEncounterStore.getState().resolveSpecialAttack('u1', true); // no ability
            useEncounterStore.getState().resolveSpecialAttack('u2', true); // not found
        });

        it('should play special ability sound when unit has one', () => {
            const warrior = { ...baseUnit, id: 'u1', templateId: 'warrior_id', name: 'Warrior', maxHealth: 100, currentHealth: 100, specialAbilityId: 'precision_shot', specialAbilityVariables: { damage: 20 }, specialAbilitySound: 'battle/katana' };
            const monster = { ...baseUnit, id: 'm1', templateId: 'goblin', name: 'Goblin', currentHealth: 50, maxHealth: 50, isPlayer: false };

            useEncounterStore.setState({ party: [warrior], monsters: [monster] });

            expect(() => useEncounterStore.getState().resolveSpecialAttack('u1', true)).not.toThrow();
        });

        it('should handle failure (drain spirit, end turn)', () => {
            const warrior = { ...baseUnit, id: 'u1', templateId: 'warrior_id', name: 'Warrior', hasActed: false, currentSpirit: 100, specialAbilityId: 'precision_shot' };
            const warrior2 = { ...baseUnit, id: 'u2', templateId: 'warrior_id', name: 'Warrior 2', hasActed: false, currentSpirit: 50 };

            const endPlayerTurnMock = vi.fn();
            useEncounterStore.setState({ party: [warrior, warrior2] as EncounterUnit[], monsters: [], endPlayerTurn: endPlayerTurnMock });

            useEncounterStore.getState().resolveSpecialAttack('u1', false);

            const state = useEncounterStore.getState();
            expect(state.party[0].currentSpirit).toBe(0);
            expect(state.party[0].hasActed).toBe(true);
            expect(state.party[1].currentSpirit).toBe(50);
            expect(state.party[1].hasActed).toBe(false);
            expect(endPlayerTurnMock).not.toHaveBeenCalled();
        });
    });

    describe('selectUnit', () => {
        it('should set selectedUnitId', () => {
            useEncounterStore.getState().selectUnit('u1');
            expect(useEncounterStore.getState().selectedUnitId).toBe('u1');
        });
    });

    describe('consumeSpirit', () => {
        it('should set currentSpirit to 0 for a given unit', () => {
            const warrior = { id: 'u1', templateId: 'warrior_id', name: 'Warrior', currentSpirit: 100, isPlayer: true };
            useEncounterStore.setState({ party: [warrior as EncounterUnit] });

            useEncounterStore.getState().consumeSpirit('u1');
            expect(useEncounterStore.getState().party[0].currentSpirit).toBe(0);
        });

        it('should return early if unit not found', () => {
            const warrior = { id: 'u1', templateId: 'warrior_id', name: 'Warrior', currentSpirit: 100, isPlayer: true };
            useEncounterStore.setState({ party: [warrior as EncounterUnit] });

            useEncounterStore.getState().consumeSpirit('u2'); // not found
            expect(useEncounterStore.getState().party[0].currentSpirit).toBe(100);
        });
    });
});
