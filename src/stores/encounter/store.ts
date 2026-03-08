// This file is ignored by vitest unit test coverage. The reason is that the
// `if (typeof window !== 'undefined')` guard can never be false in jsdom, making the
// false branch permanently unreachable in unit tests.
// DO NOT ADD UNIT TESTS FOR THIS FILE beyond what already exists in encounter.store.test.ts.
import { create } from 'zustand';
import type { EncounterStore } from './interfaces';
import { initialEncounterState } from './initial-state';
import { createEncounterFlowSlice } from './slices/encounter-flow.slice';
import { createPlayerActionsSlice } from './slices/player-actions.slice';

export const useEncounterStore = create<EncounterStore>((...a) => ({
    ...initialEncounterState,
    ...createEncounterFlowSlice(...a),
    ...createPlayerActionsSlice(...a),
}));

declare global {
    interface Window {
        useEncounterStore: typeof useEncounterStore;
    }
}

// Expose store for testing
if (typeof window !== 'undefined') {
    window.useEncounterStore = useEncounterStore;
}
