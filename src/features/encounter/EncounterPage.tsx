
import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate, useParams } from 'react-router-dom';
import { Map } from 'lucide-react';
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
import './EncounterPage.css';
import { ExperienceDistributionScreen } from './components/experience/ExperienceDistributionScreen';
import { useEncounterNavigation } from './hooks/useEncounterNavigation';
import { useEncounterInitializer } from './hooks/useEncounterInitializer';
import { useVoiceOver } from '../../hooks/useVoiceOver';
import { COMPANIONS } from '../../data/companions.data';
import { ADVENTURES } from '../../data/adventures.data';
import { Header } from '../../components/Header';
import { analyticsService } from '../../services/analytics.service';

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

    // Look up encounter type for analytics
    const encounterType = ADVENTURES.find(a => a.id === adventureId)?.encounters[nodeIndex - 1]?.type;

    // Track encounter_started once on mount.
    // Difficulty is read from the store at effect-fire time (after useLayoutEffect in
    // useEncounterInitializer has already set the correct value) rather than from the
    // render-time closure, which captures the reset store's undefined → fallback 1.
    // The ref guard prevents a duplicate event in React 18 StrictMode (dev), which
    // intentionally runs effects twice.
    const hasTrackedStartRef = useRef(false);
    useEffect(() => {
        if (hasTrackedStartRef.current) return;
        hasTrackedStartRef.current = true;
        const { difficulty: startDifficulty } = useEncounterStore.getState();
        analyticsService.trackEvent('encounter_started', {
            adventure_id: adventureId,
            node_index: nodeIndex,
            difficulty: startDifficulty ?? 1,
            encounter_type: encounterType,
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Track encounter_completed / encounter_failed when phase changes
    const prevPhaseRef = useRef<string>(phase);
    useEffect(() => {
        if (prevPhaseRef.current !== phase) {
            prevPhaseRef.current = phase;
            const turnCount = useEncounterStore.getState().turnCount;
            if (phase === EncounterPhase.VICTORY) {
                analyticsService.trackEvent('encounter_completed', {
                    adventure_id: adventureId,
                    node_index: nodeIndex,
                    difficulty,
                    turn_count: turnCount,
                });
            } else if (phase === EncounterPhase.DEFEAT) {
                analyticsService.trackEvent('encounter_failed', {
                    adventure_id: adventureId,
                    node_index: nodeIndex,
                    difficulty,
                    turn_count: turnCount,
                });
            }
        }
    }, [phase, adventureId, nodeIndex, difficulty]);

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

    const TUTORIAL_ADVENTURE_ID = '1';
    const TUTORIAL_NODE_INDEX = 1;
    const isFirstEncounter = adventureId === TUTORIAL_ADVENTURE_ID && nodeIndex === TUTORIAL_NODE_INDEX;
    const showAttackHint = isFirstEncounter && phase === EncounterPhase.PLAYER_TURN && party.some(u => !u.hasActed && !u.isDead);

    const handleUnitAction = (unitId: string) => {
        if (phase !== EncounterPhase.PLAYER_TURN || isEncounterOver) {
            return;
        }

        const unit = party.find(u => u.id === unitId);
        if (!unit) {
            return;
        }

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
        if (!activeChallenge) {
            return;
        }

        analyticsService.trackEvent('special_attack_attempted', {
            adventure_id: adventureId,
            node_index: nodeIndex,
            success,
        });

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
            <Header
                leftIcon={<Map size={32} />}
                onLeftClick={() => {
                    navigate(`/map/${adventureId}`, { state: { focalNode: nodeIndex } });
                }}
                leftAriaLabel={t('common.back_to_map')}
                leftTestId="back-to-map-btn"
            />

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
                showAttackHint={showAttackHint}
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
