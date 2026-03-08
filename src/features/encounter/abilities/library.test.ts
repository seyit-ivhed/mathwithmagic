import { describe, it, expect } from 'vitest';
import { ancestral_storm, precision_shot, elixir_of_life, blade_barrier } from './library';
import { executeAbility } from './registry';
import { type BattleUnit } from '../../../types/encounter.types';

describe('Ability Library', () => {
    const player1: BattleUnit = {
        id: 'player1',
        templateId: 'amara',
        name: 'Amara',
        isPlayer: true,
        currentHealth: 50,
        maxHealth: 100,
        isDead: false,
        maxSpirit: 100,
        currentSpirit: 100,
        spiritGain: 35,
        hasActed: false
    };

    const player2: BattleUnit = {
        id: 'player2',
        templateId: 'tariq',
        name: 'Tariq',
        isPlayer: true,
        currentHealth: 30,
        maxHealth: 80,
        isDead: false,
        maxSpirit: 100,
        currentSpirit: 100,
        spiritGain: 35,
        hasActed: false
    };

    const monster1: BattleUnit = {
        id: 'monster1',
        templateId: 'scout',
        name: 'Scout 1',
        isPlayer: false,
        currentHealth: 20,
        maxHealth: 20,
        isDead: false,
        maxSpirit: 0,
        currentSpirit: 0,
        spiritGain: 0,
        hasActed: false
    };

    const monster2: BattleUnit = {
        id: 'monster2',
        templateId: 'scout',
        name: 'Scout 2',
        isPlayer: false,
        currentHealth: 20,
        maxHealth: 20,
        isDead: false,
        maxSpirit: 0,
        currentSpirit: 0,
        spiritGain: 0,
        hasActed: false
    };

    describe('precision_shot', () => {
        it('should damage a single enemy', () => {
            const allUnits = [player1, monster1, monster2];
            const result = precision_shot({ attacker: player1, allUnits, variables: { damage: 10 } });

            const updatedMonster1 = result.updatedUnits.find(u => u.id === 'monster1');
            const updatedMonster2 = result.updatedUnits.find(u => u.id === 'monster2');

            expect(updatedMonster1?.currentHealth).toBe(10);
            expect(updatedMonster2?.currentHealth).toBe(20);
        });

        it('should default damage to 0 when not provided', () => {
            const allUnits = [player1, monster1];
            const result = precision_shot({ attacker: player1, allUnits, variables: {} });
            const updatedMonster1 = result.updatedUnits.find(u => u.id === 'monster1');
            expect(updatedMonster1?.currentHealth).toBe(20);
        });

        it('should do nothing when there are no enemies', () => {
            // Tests the false branch: if (firstEnemy) in helpers.ts
            const allUnits = [player1, player2];
            const result = precision_shot({ attacker: player1, allUnits, variables: { damage: 10 } });
            // No enemies, so nothing should change
            expect(result.updatedUnits.find(u => u.id === 'player1')?.currentHealth).toBe(50);
            expect(result.updatedUnits.find(u => u.id === 'player2')?.currentHealth).toBe(30);
        });
    });

    describe('elixir_of_life', () => {
        it('should heal all living allies', () => {
            const allUnits = [player1, player2, monster1];
            const result = elixir_of_life({ attacker: player2, allUnits, variables: { heal: 20 } });

            const updatedPlayer1 = result.updatedUnits.find(u => u.id === 'player1');
            const updatedPlayer2 = result.updatedUnits.find(u => u.id === 'player2');

            expect(updatedPlayer1?.currentHealth).toBe(70);
            expect(updatedPlayer2?.currentHealth).toBe(50);
        });

        it('should not heal beyond max health', () => {
            const result = elixir_of_life({ attacker: player2, allUnits: [player1], variables: { heal: 100 } });
            const updatedPlayer1 = result.updatedUnits.find(u => u.id === 'player1');
            expect(updatedPlayer1?.currentHealth).toBe(100);
        });

        it('should not heal a unit already at full health (healedAmount = 0)', () => {
            const fullHealthPlayer: BattleUnit = { ...player1, currentHealth: 100, maxHealth: 100 };
            const result = elixir_of_life({ attacker: player2, allUnits: [fullHealthPlayer], variables: { heal: 20 } });
            const updated = result.updatedUnits.find(u => u.id === 'player1');
            expect(updated?.currentHealth).toBe(100);
        });

        it('should default heal to 0 when not provided', () => {
            const result = elixir_of_life({ attacker: player2, allUnits: [player1], variables: {} });
            const updated = result.updatedUnits.find(u => u.id === 'player1');
            // heal is 0, so no change
            expect(updated?.currentHealth).toBe(50);
        });

        it('should not affect dead allies', () => {
            const deadPlayer: BattleUnit = { ...player1, isDead: true, currentHealth: 0 };
            const result = elixir_of_life({ attacker: player2, allUnits: [deadPlayer], variables: { heal: 50 } });
            const updated = result.updatedUnits.find(u => u.id === 'player1');
            expect(updated?.currentHealth).toBe(0);
        });
    });

    describe('blade_barrier', () => {
        it('should damage an enemy and shield all allies', () => {
            const allUnits = [player1, player2, monster1];
            const result = blade_barrier({ attacker: player1, allUnits, variables: { damage: 10, duration: 2, reduction: 50 } });

            const updatedMonster1 = result.updatedUnits.find(u => u.id === 'monster1');
            const updatedPlayer1 = result.updatedUnits.find(u => u.id === 'player1');
            const updatedPlayer2 = result.updatedUnits.find(u => u.id === 'player2');

            expect(updatedMonster1?.currentHealth).toBe(10);
            expect(updatedPlayer1?.statusEffects).toContainEqual(expect.objectContaining({ type: 'SHIELD' }));
            expect(updatedPlayer2?.statusEffects).toContainEqual(expect.objectContaining({ type: 'SHIELD' }));
        });

        it('should not deal damage when damage variable is 0 or missing', () => {
            const allUnits = [player1, monster1];
            const result = blade_barrier({ attacker: player1, allUnits, variables: { duration: 2, reduction: 50 } });
            // No damage step, monster should be untouched
            const updatedMonster1 = result.updatedUnits.find(u => u.id === 'monster1');
            expect(updatedMonster1?.currentHealth).toBe(20);
            // Shield should still be applied
            const updatedPlayer1 = result.updatedUnits.find(u => u.id === 'player1');
            expect(updatedPlayer1?.statusEffects).toContainEqual(expect.objectContaining({ type: 'SHIELD' }));
        });

        it('should refresh existing SHIELD effect', () => {
            const playerWithShield: BattleUnit = {
                ...player1,
                statusEffects: [{ id: 'old-shield', type: 'SHIELD', state: { duration: 1, reduction: 25 } }]
            };
            const result = blade_barrier({ attacker: player1, allUnits: [playerWithShield], variables: { duration: 3, reduction: 50 } });
            const updated = result.updatedUnits.find(u => u.id === 'player1');
            const shields = updated?.statusEffects?.filter(e => e.type === 'SHIELD');
            expect(shields).toHaveLength(1);
            expect(shields?.[0].state.duration).toBe(3);
        });
    });

    describe('ancestral_storm', () => {
        it('should damage all enemies', () => {
            const allUnits = [player1, monster1, monster2];
            const result = ancestral_storm({ attacker: player1, allUnits, variables: { damage: 15 } });

            const updatedMonster1 = result.updatedUnits.find(u => u.id === 'monster1');
            const updatedMonster2 = result.updatedUnits.find(u => u.id === 'monster2');

            expect(updatedMonster1?.currentHealth).toBe(5);
            expect(updatedMonster2?.currentHealth).toBe(5);
        });

        it('should not damage dead enemies', () => {
            const deadMonster: BattleUnit = { ...monster1, id: 'dead1', isDead: true, currentHealth: 0 };
            const allUnits = [player1, deadMonster, monster2];
            const result = ancestral_storm({ attacker: player1, allUnits, variables: { damage: 15 } });

            const updatedDeadMonster = result.updatedUnits.find(u => u.id === 'dead1');
            const updatedMonster2 = result.updatedUnits.find(u => u.id === 'monster2');

            expect(updatedDeadMonster?.currentHealth).toBe(0);
            expect(updatedMonster2?.currentHealth).toBe(5);
        });

        it('should default damage to 0 when not provided', () => {
            const allUnits = [player1, monster1];
            const result = ancestral_storm({ attacker: player1, allUnits, variables: {} });
            const updatedMonster1 = result.updatedUnits.find(u => u.id === 'monster1');
            expect(updatedMonster1?.currentHealth).toBe(20);
        });
    });
});

describe('executeAbility (registry)', () => {
    const mockUnit: BattleUnit = {
        id: 'u1',
        templateId: 'amara',
        name: 'Amara',
        isPlayer: true,
        currentHealth: 100,
        maxHealth: 100,
        isDead: false,
        maxSpirit: 100,
        currentSpirit: 0,
        spiritGain: 0,
        hasActed: false,
    };

    it('should execute a known ability', () => {
        const result = executeAbility('precision_shot', {
            attacker: mockUnit,
            allUnits: [mockUnit],
            variables: { damage: 10 },
        });
        expect(result.updatedUnits).toHaveLength(1);
    });

    it('should return unchanged units and log error for unknown ability ID', () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        const units = [mockUnit];
        const result = executeAbility('unknown_ability_xyz', {
            attacker: mockUnit,
            allUnits: units,
            variables: {},
        });
        expect(result.updatedUnits).toBe(units);
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('unknown_ability_xyz'));
        consoleSpy.mockRestore();
    });
});
