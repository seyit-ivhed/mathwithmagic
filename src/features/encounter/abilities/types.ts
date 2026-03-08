// This file is ignored by vitest unit test coverage. The reason is that it contains only
// TypeScript interface and type declarations. There is no executable runtime code to test.
// DO NOT ADD UNIT TESTS FOR THIS FILE.
import type { BattleUnit } from '../../../types/encounter.types';

export interface AbilityContext {
    attacker: BattleUnit;
    allUnits: BattleUnit[];
    variables: Record<string, number>;
}

export interface AbilityResult {
    updatedUnits: BattleUnit[];
}

export type AbilityImplementation = (context: AbilityContext) => AbilityResult;
