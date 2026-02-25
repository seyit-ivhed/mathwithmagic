import { useLayoutEffect, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useEncounterStore } from '../../../stores/encounter/store';
import { useGameStore } from '../../../stores/game/store';
import { buildBattleEncounterData } from '../utils/encounter-initializer';

export function useEncounterInitializer(adventureId: string | undefined, nodeIndex: number) {
    const { initializeEncounter, resetEncounter, party, monsters, nodeIndex: activeNodeIndex } = useEncounterStore();
    const { activeParty, companionStats, activeEncounterDifficulty } = useGameStore();
    const { t } = useTranslation();

    useEffect(() => {
        return () => {
            resetEncounter();
        };
    }, [resetEncounter]);

    useLayoutEffect(() => {
        if (!adventureId) {
            return;
        }

        const data = buildBattleEncounterData(
            adventureId,
            nodeIndex,
            activeParty,
            companionStats,
            activeEncounterDifficulty,
            t
        );

        if (!data) {
            return;
        }

        const currentPartyIds = party.map(u => u.templateId).join(',');
        const hasPartyChanged = currentPartyIds !== data.activeParty.join(',');

        const currentMonsterIds = monsters.map(m => m.templateId).join(',');
        const expectedMonsterIds = data.localizedEnemies.map(e => e.id).join(',');
        const hasMonstersChanged = currentMonsterIds !== expectedMonsterIds;

        if (activeNodeIndex !== nodeIndex || party.length === 0 || hasPartyChanged || hasMonstersChanged) {
            initializeEncounter(
                data.activeParty,
                data.localizedEnemies,
                data.nodeIndex,
                data.difficulty,
                data.companionStats
            );
        }
    }, [adventureId, nodeIndex, activeParty, companionStats, activeEncounterDifficulty, initializeEncounter, t, activeNodeIndex, party, monsters]);
}
