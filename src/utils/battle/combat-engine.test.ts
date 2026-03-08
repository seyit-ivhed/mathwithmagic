import { describe, it, expect } from 'vitest';
import { CombatEngine } from './combat-engine';
import type { BattleUnit } from '../../types/encounter.types';

describe('CombatEngine', () => {
    const mockAttacker: BattleUnit = {
        id: 'p1',
        templateId: 'companion1',
        name: 'Hero',
        isPlayer: true,
        damage: 10,
        maxHealth: 100,
        currentHealth: 100,
        maxSpirit: 100,
        currentSpirit: 100,
        spiritGain: 10,
        hasActed: false,
        isDead: false
    };

    const mockEnemy: BattleUnit = {
        id: 'e1',
        templateId: 'monster1',
        name: 'Monster',
        isPlayer: false,
        damage: 5,
        maxHealth: 100,
        currentHealth: 100,
        maxSpirit: 100,
        currentSpirit: 0,
        spiritGain: 0,
        hasActed: false,
        isDead: false
    };

    describe('executeStandardAttack', () => {
        it('should deal damage to the first living target', () => {
            const result = CombatEngine.executeStandardAttack(mockAttacker, [mockEnemy]);
            const damagedEnemy = result.updatedTargets.find(u => u.id === mockEnemy.id);

            expect(damagedEnemy?.currentHealth).toBe(90);
        });

        it('should not deal damage if target is dead', () => {
            const deadEnemy: BattleUnit = { ...mockEnemy, isDead: true, currentHealth: 0 };
            const result = CombatEngine.executeStandardAttack(mockAttacker, [deadEnemy]);
            // No change expected
            expect(result.updatedTargets[0].currentHealth).toBe(0);
        });
    });

    describe('executeSpecialAbility', () => {
        it('should execute DAMAGE ability on single enemy', () => {
            const result = CombatEngine.executeSpecialAbility(
                mockAttacker,
                [mockAttacker, mockEnemy],
                'precision_shot',
                { damage: 20 }
            );
            const damagedEnemy = result.updatedUnits.find(u => u.id === mockEnemy.id);

            expect(damagedEnemy?.currentHealth).toBe(80);
        });

        it('should execute HEAL ability on self/allies', () => {
            const damagedHero: BattleUnit = { ...mockAttacker, currentHealth: 50 };
            const result = CombatEngine.executeSpecialAbility(
                mockAttacker,
                [damagedHero, mockEnemy],
                'elixir_of_life',
                { heal: 20 }
            );
            const healedHero = result.updatedUnits.find(u => u.id === mockAttacker.id);

            expect(healedHero?.currentHealth).toBe(70);
        });
    });

    describe('regenerateSpirit', () => {
        it('should increase spirit by gain amount', () => {
            const drainedHero: BattleUnit = { ...mockAttacker, currentSpirit: 50 };
            const updated = CombatEngine.regenerateSpirit([drainedHero]);

            expect(updated[0].currentSpirit).toBe(60);
        });

        it('should cap spirit at maxSpirit', () => {
            const updated = CombatEngine.regenerateSpirit([mockAttacker]);
            expect(updated[0].currentSpirit).toBe(100);
        });
    });
    describe('consumeSpiritCost', () => {
        it('should reset spirit to 0', () => {
            const unit = { ...mockAttacker, currentSpirit: 50 };
            const result = CombatEngine.consumeSpiritCost(unit);
            expect(result.currentSpirit).toBe(0);
        });
    });

    describe('selectRandomTarget', () => {
        it('should return valid index for living targets', () => {
            const targets = [
                { isDead: false },
                { isDead: false },
                { isDead: false }
            ];

            const index = CombatEngine.selectRandomTarget(targets);

            expect(index).toBeGreaterThanOrEqual(0);
            expect(index).toBeLessThan(3);
            expect(targets[index].isDead).toBe(false);
        });

        it('should only select from living targets', () => {
            const targets = [
                { isDead: true },
                { isDead: false },
                { isDead: true }
            ];

            // Run multiple times to ensure consistency
            for (let i = 0; i < 10; i++) {
                const index = CombatEngine.selectRandomTarget(targets);
                expect(index).toBe(1);
            }
        });

        it('should return -1 when all targets are dead', () => {
            const targets = [
                { isDead: true },
                { isDead: true }
            ];

            const index = CombatEngine.selectRandomTarget(targets);

            expect(index).toBe(-1);
        });

        it('should return -1 for empty array', () => {
            const targets: { isDead: boolean }[] = [];

            const index = CombatEngine.selectRandomTarget(targets);

            expect(index).toBe(-1);
        });
    });

    describe('findFirstValidEnemy', () => {
        it('should find first living enemy', () => {
            const attacker = { id: 'u1', isPlayer: true, isDead: false };
            const targets = [
                { id: 'u1', isPlayer: true, isDead: false }, // Self
                { id: 'u2', isPlayer: true, isDead: false }, // Ally
                { id: 'm1', isPlayer: false, isDead: false }, // Enemy 1
                { id: 'm2', isPlayer: false, isDead: false }  // Enemy 2
            ];

            const index = CombatEngine.findFirstValidEnemy(attacker, targets);
            expect(index).toBe(2);
        });

        it('should skip dead enemies', () => {
            const attacker = { id: 'u1', isPlayer: true, isDead: false };
            const targets = [
                { id: 'm1', isPlayer: false, isDead: true }, // Dead Enemy
                { id: 'm2', isPlayer: false, isDead: false } // Living Enemy
            ];

            const index = CombatEngine.findFirstValidEnemy(attacker, targets);
            expect(index).toBe(1);
        });

        it('should return -1 if no valid targets', () => {
            const attacker = { id: 'u1', isPlayer: true, isDead: false };
            const targets = [
                { id: 'u1', isPlayer: true, isDead: false },
                { id: 'u2', isPlayer: true, isDead: false }
            ];
            const index = CombatEngine.findFirstValidEnemy(attacker, targets);
            expect(index).toBe(-1);
        });
    });

    describe('processMonsterAction', () => {
        it('should deal damage to a random living player', () => {
            const result = CombatEngine.processMonsterAction(mockEnemy, [mockAttacker]);
            expect(result.updatedParty[0].currentHealth).toBeLessThan(100);
        });

        it('should return unchanged party when all party members are dead', () => {
            const deadHero: BattleUnit = { ...mockAttacker, isDead: true, currentHealth: 0 };
            const result = CombatEngine.processMonsterAction(mockEnemy, [deadHero]);
            expect(result.updatedParty[0].currentHealth).toBe(0);
        });

        it('should default damage to 0 when attacker.damage is undefined', () => {
            const zeroDamageMonster: BattleUnit = { ...mockEnemy, damage: 0 };
            const result = CombatEngine.processMonsterAction(zeroDamageMonster, [mockAttacker]);
            expect(result.updatedParty[0].currentHealth).toBe(100);
        });

        it('should only update the targeted unit and keep others unchanged (covers ternary false branch)', () => {
            const hero1: BattleUnit = { ...mockAttacker, id: 'hero1', currentHealth: 100 };
            const hero2: BattleUnit = { ...mockAttacker, id: 'hero2', currentHealth: 80, isPlayer: true };
            // Mock random to always target hero1 (index 0)
            vi.spyOn(Math, 'random').mockReturnValue(0);

            const result = CombatEngine.processMonsterAction(mockEnemy, [hero1, hero2]);

            const updatedHero1 = result.updatedParty.find(p => p.id === 'hero1');
            const updatedHero2 = result.updatedParty.find(p => p.id === 'hero2');
            // hero1 took damage, hero2 is unchanged (tests ternary false branch in map)
            expect(updatedHero1!.currentHealth).toBeLessThan(100);
            expect(updatedHero2!.currentHealth).toBe(80);

            vi.restoreAllMocks();
        });
    });

    describe('executeStandardAttack - zero damage', () => {
        it('should deal 0 damage when attacker.damage is 0', () => {
            const zeroDamageEnemy: BattleUnit = { ...mockEnemy, damage: 0 };
            const result = CombatEngine.executeStandardAttack(zeroDamageEnemy, [mockAttacker]);
            expect(result.updatedTargets[0].currentHealth).toBe(100);
        });
    });

    describe('regenerateSpirit - dead unit', () => {
        it('should skip dead units when regenerating spirit', () => {
            const deadHero: BattleUnit = { ...mockAttacker, isDead: true, currentSpirit: 0 };
            const updated = CombatEngine.regenerateSpirit([deadHero]);
            expect(updated[0].currentSpirit).toBe(0);
        });
    });

    describe('Status Effects', () => {
        it('should reduce damage received when SHIELD is active', () => {
            const shieldedHero: BattleUnit = {
                ...mockAttacker,
                statusEffects: [{ id: 's1', type: 'SHIELD', state: { reduction: 50, duration: 2 } }]
            };

            const result = CombatEngine.executeStandardAttack(mockEnemy, [shieldedHero]);
            const damagedHero = result.updatedTargets.find(u => u.id === mockAttacker.id);

            // Monster damage is 5, 50% reduction = 2.5 -> floor is 2.
            expect(damagedHero?.currentHealth).toBe(98);
        });

        it('should decrement effect duration on tick', () => {
            const unitWithEffect: BattleUnit = {
                ...mockAttacker,
                statusEffects: [{ id: 's1', type: 'SHIELD', state: { duration: 2 } }]
            };

            const updated = CombatEngine.tickStatusEffects([unitWithEffect]);
            expect(updated[0].statusEffects![0].state.duration).toBe(1);
        });

        it('should remove effect when duration reaches 0 after tick', () => {
            const unitWithEffect: BattleUnit = {
                ...mockAttacker,
                statusEffects: [{ id: 's1', type: 'SHIELD', state: { duration: 1 } }]
            };

            const updated = CombatEngine.tickStatusEffects([unitWithEffect]);
            expect(updated[0].statusEffects?.length).toBe(0);
        });

        it('should execute blade_barrier and apply shield to all companions', () => {
            const result = CombatEngine.executeSpecialAbility(
                mockAttacker,
                [mockAttacker, mockEnemy],
                'blade_barrier',
                { damage: 10, duration: 2, reduction: 50 }
            );

            const shieldedHero = result.updatedUnits.find(u => u.id === mockAttacker.id);
            expect(shieldedHero?.statusEffects?.find(e => e.type === 'SHIELD')).toBeTruthy();
            expect(shieldedHero?.statusEffects?.[0].state.duration).toBe(2);

            const damagedEnemy = result.updatedUnits.find(u => u.id === mockEnemy.id);
            expect(damagedEnemy?.currentHealth).toBe(90);
        });
    });
});
