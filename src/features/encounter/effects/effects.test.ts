import { describe, it, expect } from 'vitest';
import { SHIELD } from './library';
import { applyDamageModifiers, processEffectTick, EffectRegistry } from './registry';
import type { StatusEffectData } from '../../../types/encounter.types';

describe('SHIELD effect (library)', () => {
    describe('onDamageReceived', () => {
        it('should reduce damage by the given reduction percentage', () => {
            const state = { duration: 2, reduction: 50 };
            const reducedDamage = SHIELD.onDamageReceived!(10, state);
            expect(reducedDamage).toBe(5);
        });

        it('should use default reduction of 50% when not provided', () => {
            // state without reduction property triggers the || 50 default
            const state = { duration: 2 };
            const reducedDamage = SHIELD.onDamageReceived!(10, state);
            expect(reducedDamage).toBe(5);
        });

        it('should floor fractional damage results', () => {
            const state = { duration: 1, reduction: 50 };
            // 5 * 0.5 = 2.5 → floor = 2
            const reducedDamage = SHIELD.onDamageReceived!(5, state);
            expect(reducedDamage).toBe(2);
        });
    });

    describe('onTick', () => {
        it('should decrement duration by 1', () => {
            const state = { duration: 3, reduction: 50 };
            const newState = SHIELD.onTick!(state);
            expect(newState.duration).toBe(2);
        });

        it('should use default duration of 0 when not provided', () => {
            const state = { reduction: 50 };
            const newState = SHIELD.onTick!(state);
            expect(newState.duration).toBe(-1);
        });
    });

    describe('isExpired', () => {
        it('should return true when duration is 0', () => {
            expect(SHIELD.isExpired({ duration: 0 })).toBe(true);
        });

        it('should return false when duration is positive', () => {
            expect(SHIELD.isExpired({ duration: 1 })).toBe(false);
        });
    });
});

describe('applyDamageModifiers (registry)', () => {
    it('should apply SHIELD damage reduction', () => {
        const effects: StatusEffectData[] = [
            { id: 's1', type: 'SHIELD', state: { duration: 2, reduction: 50 } }
        ];
        const result = applyDamageModifiers(10, effects);
        expect(result).toBe(5);
    });

    it('should return original damage when no effects', () => {
        expect(applyDamageModifiers(10, [])).toBe(10);
    });

    it('should return original damage when effects is undefined', () => {
        expect(applyDamageModifiers(10)).toBe(10);
    });

    it('should skip effects with no onDamageReceived handler (unknown type)', () => {
        // An effect type not in the registry should be skipped
        const effects: StatusEffectData[] = [
            { id: 'u1', type: 'UNKNOWN_EFFECT', state: {} }
        ];
        const result = applyDamageModifiers(10, effects);
        expect(result).toBe(10);
    });
});

describe('processEffectTick (registry)', () => {
    it('should decrement SHIELD duration and keep it if still active', () => {
        const effects: StatusEffectData[] = [
            { id: 's1', type: 'SHIELD', state: { duration: 2, reduction: 50 } }
        ];
        const result = processEffectTick(effects);
        expect(result).toHaveLength(1);
        expect(result[0].state.duration).toBe(1);
    });

    it('should remove SHIELD when duration expires', () => {
        const effects: StatusEffectData[] = [
            { id: 's1', type: 'SHIELD', state: { duration: 1, reduction: 50 } }
        ];
        const result = processEffectTick(effects);
        expect(result).toHaveLength(0);
    });

    it('should return empty array for empty effects', () => {
        expect(processEffectTick([])).toHaveLength(0);
    });

    it('should preserve unknown effect types without any implementation (pass through)', () => {
        const effects: StatusEffectData[] = [
            { id: 'u1', type: 'UNKNOWN_EFFECT', state: { duration: 3 } }
        ];
        const result = processEffectTick(effects);
        // Unknown effects without implementation pass through unchanged and are never expired
        expect(result).toHaveLength(1);
        expect(result[0].state.duration).toBe(3);
    });

    it('should use effectData.state unchanged when implementation has no onTick', () => {
        // Add a temporary effect without onTick to cover the ternary false branch
        EffectRegistry['NO_TICK_EFFECT'] = {
            onDamageReceived: undefined,
            isExpired: (state) => (state.duration as number) <= 0,
        };
        try {
            const effects: StatusEffectData[] = [
                { id: 'nt1', type: 'NO_TICK_EFFECT', state: { duration: 3 } }
            ];
            const result = processEffectTick(effects);
            // State should be unchanged (no onTick to decrement)
            expect(result).toHaveLength(1);
            expect(result[0].state.duration).toBe(3);
        } finally {
            delete EffectRegistry['NO_TICK_EFFECT'];
        }
    });
});
