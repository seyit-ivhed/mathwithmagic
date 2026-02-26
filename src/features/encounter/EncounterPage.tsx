
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { useEncounterStore } from '../../stores/encounter/store';
import { useGameStore } from '../../stores/game/store';
import { EncounterPhase } from '../../types/encounter.types';
import { generateProblem, getAllowedOperations } from '../../utils/math-generator';
import { type MathProblem, type DifficultyLevel } from '../../types/math.types';
import { EncounterCompletionModal } from './components/EncounterCompletionModal';
import { VisualEffectOverlay } from './components/VisualEffectOverlay';
import { TurnAnnouncer } from './components/TurnAnnouncer';
import { Battlefield } from './components/Battlefield';
import { SpecialChallengeOverlay } from './components/SpecialChallengeOverlay';
import { useDelayedUnitRemoval } from './hooks/useDelayedUnitRemoval';
import { getVFXDetails, checkIsEncounterOver } from './utils/encounter-logic';
import styles from './EncounterPage.module.css';
import './EncounterPage.css';
import { ExperienceDistributionScreen } from './components/experience/ExperienceDistributionScreen';
import { useEncounterNavigation } from './hooks/useEncounterNavigation';
import { useEncounterInitializer } from './hooks/useEncounterInitializer';
import { useVoiceOver } from '../../hooks/useVoiceOver';
import { COMPANIONS } from '../../data/companions.data';

const EncounterPage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { adventureId, nodeIndex: nodeIndexParam } = useParams<{ adventureId: string; nodeIndex: string }>();
    const parsedNodeIndex = parseInt(nodeIndexParam || '1', 10);
    const nodeIndex = isNaN(parsedNodeIndex) ? 1 : parsedNodeIndex;

    const {
        phase, party, monsters,
        performAction,
        resolveSpecialAttack,
        difficulty: rawDifficulty,
    } = useEncounterStore();

    const { activeParty } = useGameStore();

    useEncounterInitializer(adventureId, nodeIndex);

    const difficulty = typeof rawDifficulty === 'number' ? rawDifficulty : 1;

    const [activeChallenge, setActiveChallenge] = useState<{
        type: 'SPECIAL';
        unitId: string;
        problem: MathProblem;
        spotlightOpen: boolean;
        isFlipped: boolean;
    } | null>(null);

    const [activeVFX, setActiveVFX] = useState<{
        type: string;
        unitId: string;
        targetId?: string;
    } | null>(null);

    const [voiceOverData, setVoiceOverData] = useState<{
        category: string;
        filename: string;
        replayKey: number;
    } | null>(null);

    useVoiceOver(voiceOverData?.category || '', voiceOverData?.filename || '', voiceOverData?.replayKey);

    // Sync alive monsters but delay removal of dead ones for animations
    const visibleMonsterIds = useDelayedUnitRemoval(monsters);

    // Extracted Navigation & Progression Logic
    const {
        showExperienceScreen,
        previousCompanionStats,
        handleCompletionContinue
    } = useEncounterNavigation({ adventureId, nodeIndex, phase });

    const isEncounterOver = checkIsEncounterOver(monsters);

    const handleUnitAction = (unitId: string) => {
        if (phase !== EncounterPhase.PLAYER_TURN || isEncounterOver) return;

        const unit = party.find(u => u.id === unitId);
        if (!unit) return;

        // Check for Ultimate (Spirit >= 100)
        if (unit.currentSpirit >= 100) {
            const currentDifficulty = difficulty as DifficultyLevel;
            const allowedOps = getAllowedOperations(currentDifficulty);
            const op = allowedOps[Math.floor(Math.random() * allowedOps.length)];
            const problem = generateProblem(op, currentDifficulty);

            setActiveChallenge({
                type: 'SPECIAL',
                unitId,
                problem,
                spotlightOpen: true,
                isFlipped: false
            });

            // Start flip animation shortly after open
            setTimeout(() => {
                useEncounterStore.getState().consumeSpirit(unitId);
                setActiveChallenge(prev => prev ? { ...prev, isFlipped: true } : null);
            }, 2000);

            return;
        }

        performAction(unitId);
    };

    const handleChallengeComplete = (success: boolean) => {
        if (!activeChallenge) return;

        // Play Success or Failure Voice Over
        const unitId = activeChallenge.unitId;
        const liveUnit = party.find(u => u.id === unitId);
        const matchingCompanion = liveUnit ? COMPANIONS[liveUnit.templateId] : null;

        if (matchingCompanion && liveUnit) {
            const evolutionIndex = liveUnit.evolutionIndex || matchingCompanion.baseStats.evolutionIndex;
            const category = `companions/${matchingCompanion.id}/evolution-${evolutionIndex}`;

            let filename = 'failure';
            if (success) {
                const randomIndex = Math.floor(Math.random() * 4) + 1;
                filename = `success/${randomIndex}`;
            }

            setVoiceOverData(prev => ({
                category,
                filename,
                replayKey: (prev?.replayKey || 0) + 1
            }));
        }

        if (success) {
            const { type, targetId } = getVFXDetails(activeChallenge.unitId, party, monsters);
            setActiveChallenge(null);
            setActiveVFX({
                type,
                unitId: activeChallenge.unitId,
                targetId
            });
        } else {
            resolveSpecialAttack(activeChallenge.unitId, success);
            setActiveChallenge(null);
        }
    };

    const handleVFXComplete = () => {
        if (activeVFX) {
            resolveSpecialAttack(activeVFX.unitId, true);
            setActiveVFX(null);
        }
    };

    return (
        <div className="encounter-page">
            <header className={styles.header}>
                <div className={styles.headerControls}>
                    <button
                        className={styles.abortLink}
                        onClick={() => navigate(`/map/${adventureId}`, { state: { focalNode: nodeIndex } })}
                        disabled={!!activeChallenge || !!activeVFX || isEncounterOver}
                    >
                        {t('retreat')}
                    </button>
                </div>
            </header>

            <TurnAnnouncer phase={phase} />

            {activeVFX && (
                <VisualEffectOverlay
                    effectType={activeVFX.type}
                    onComplete={handleVFXComplete}
                    targetId={activeVFX.targetId}
                />
            )}

            <Battlefield
                party={party}
                monsters={monsters}
                visibleMonsterIds={visibleMonsterIds}
                phase={phase}
                isEncounterOver={isEncounterOver}
                activeVFXType={activeVFX?.type}
                activeChallengeUnitId={activeChallenge?.unitId}
                isVFXActive={!!activeVFX}
                onUnitAction={handleUnitAction}
            />

            {activeChallenge && (
                <SpecialChallengeOverlay
                    challenge={activeChallenge}
                    party={party}
                    phase={phase}
                    isVFXActive={!!activeVFX}
                    onComplete={handleChallengeComplete}
                />
            )}

            {(phase === EncounterPhase.VICTORY || phase === EncounterPhase.DEFEAT) && !showExperienceScreen && (
                <EncounterCompletionModal
                    result={phase === EncounterPhase.VICTORY ? 'VICTORY' : 'DEFEAT'}
                    onContinue={handleCompletionContinue}
                    difficulty={difficulty}
                />
            )}

            {showExperienceScreen && (
                <ExperienceDistributionScreen
                    partyIds={activeParty}
                    previousStats={previousCompanionStats}
                    onContinue={handleCompletionContinue}
                />
            )}
        </div>
    );
};

export default EncounterPage;
