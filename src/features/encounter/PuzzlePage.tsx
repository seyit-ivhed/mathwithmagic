import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { Volume2, Map } from 'lucide-react';
import { useGameStore } from '../../stores/game/store';
import { ADVENTURES } from '../../data/adventures.data';
import { PuzzleType, type PuzzleProps } from '../../types/adventure.types';
import { type DifficultyLevel } from '../../types/math.types';
import { generatePuzzleData } from '../../utils/math-generator';
import { RefillCanteenPuzzle } from './puzzles/refill-canteen/RefillCanteenPuzzle';
import { BalancePuzzle } from './puzzles/balance/BalancePuzzle';
import { SequencePuzzle } from './puzzles/sequence/SequencePuzzle';
import { MirrorPuzzle } from './puzzles/mirror/MirrorPuzzle';
import { LatinSquarePuzzle } from './puzzles/latin-square/LatinSquarePuzzle';
import { NumberPathPuzzle } from './puzzles/number-path/NumberPathPuzzle';
import { EquationPuzzle } from './puzzles/equation/EquationPuzzle';
import { EncounterCompletionModal } from './components/EncounterCompletionModal';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { useVoiceOver } from '../../hooks/useVoiceOver';
import { Header } from '../../components/Header';
import { analyticsService } from '../../services/analytics.service';
import styles from './PuzzlePage.module.css';

interface PuzzleDefinition {
    instructionKey: string;
    Component: React.ComponentType<PuzzleProps>;
}

const PUZZLE_DEFINITIONS: Record<PuzzleType, PuzzleDefinition> = {
    [PuzzleType.REFILL_CANTEEN]: {
        instructionKey: 'puzzle.refill_canteen.instruction',
        Component: RefillCanteenPuzzle
    },
    [PuzzleType.BALANCE]: {
        instructionKey: 'puzzle.balance.instruction',
        Component: BalancePuzzle
    },
    [PuzzleType.SEQUENCE]: {
        instructionKey: 'puzzle.sequence.instruction',
        Component: SequencePuzzle
    },
    [PuzzleType.MIRROR]: {
        instructionKey: 'puzzle.mirror.instruction',
        Component: MirrorPuzzle
    },
    [PuzzleType.LATIN_SQUARE]: {
        instructionKey: 'puzzle.latin_square.instruction',
        Component: LatinSquarePuzzle
    },
    [PuzzleType.NUMBER_PATH]: {
        instructionKey: 'puzzle.number_path.instruction',
        Component: NumberPathPuzzle
    },
    [PuzzleType.EQUATION]: {
        instructionKey: 'puzzle.equation.instruction',
        Component: EquationPuzzle
    }
};

const PuzzlePage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const { adventureId, nodeIndex: nodeIndexParam } = useParams<{ adventureId: string; nodeIndex: string }>();
    const nodeIndex = parseInt(nodeIndexParam || '1', 10);
    const { completeEncounter, activeEncounterDifficulty } = useGameStore();

    const [isCompleted, setIsCompleted] = useState(false);
    const [replayKey, setReplayKey] = useState(0);
    const adventure = ADVENTURES.find(a => a.id === adventureId);
    const encounter = adventure?.encounters[nodeIndex - 1];


    const puzzleData = useMemo(() => {
        const pType = encounter?.puzzleData?.puzzleType;
        if (!pType) {
            return null;
        }
        const currentDifficulty = activeEncounterDifficulty as DifficultyLevel;
        return generatePuzzleData(pType, currentDifficulty);
    }, [encounter, activeEncounterDifficulty]);

    const puzzleDef = puzzleData ? PUZZLE_DEFINITIONS[puzzleData.puzzleType] : null;

    const hasTrackedPuzzleStartRef = useRef(false);
    useEffect(() => {
        if (puzzleData && !hasTrackedPuzzleStartRef.current) {
            hasTrackedPuzzleStartRef.current = true;
            analyticsService.trackEvent('puzzle_started', {
                adventure_id: adventureId,
                node_index: nodeIndex,
                puzzle_type: puzzleData.puzzleType,
                difficulty: activeEncounterDifficulty,
            });
        }
    }, [puzzleData]); // eslint-disable-line react-hooks/exhaustive-deps

    const instruction = useMemo(() => {
        if (!puzzleDef) {
            return '';
        }
        return t(puzzleDef.instructionKey);
    }, [puzzleDef, t]);

    const voFilename = useMemo(() => {
        if (isCompleted || !puzzleData) {
            return '';
        }
        return puzzleData.puzzleType.toLowerCase();
    }, [isCompleted, puzzleData]);

    useVoiceOver('puzzles', voFilename, replayKey);

    const handleReplayVO = useCallback(() => {
        setReplayKey(prev => prev + 1);
    }, []);

    const handleSolve = () => {
        analyticsService.trackEvent('puzzle_completed', {
            adventure_id: adventureId,
            node_index: nodeIndex,
            puzzle_type: puzzleData?.puzzleType,
            difficulty: activeEncounterDifficulty,
        });
        setIsCompleted(true);
    };

    const handleCompletionContinue = () => {
        if (adventureId) {
            completeEncounter(adventureId, nodeIndex);
            navigate(`/map/${adventureId}`, { state: { focalNode: nodeIndex + 1 } });
        } else {
            navigate('/chronicle');
        }
    };

    const handleBack = () => {
        navigate(`/map/${adventureId}`, { state: { focalNode: nodeIndex } });
    };

    if (!encounter || !puzzleData || !puzzleDef) {
        return (
            <div className={styles.errorContainer}>
                <h2>{t('puzzle.not_found')}</h2>
                <PrimaryButton
                    onClick={() => navigate(`/map/${adventureId}`)}
                >
                    {t('common.back_to_map')}
                </PrimaryButton>
            </div>
        );
    }


    const { Component: PuzzleComponent } = puzzleDef;

    return (
        <div className={styles.puzzlePage}>
            <Header
                leftIcon={<Map size={32} />}
                onLeftClick={handleBack}
                leftAriaLabel={t('common.back_to_map')}
            />

            {instruction && (
                <div className={styles.instructionContainer}>
                    <p className={styles.instructionText}>
                        {instruction}
                        <button
                            className={styles.voButton}
                            onClick={handleReplayVO}
                            aria-label={t('puzzle.replay_instruction')}
                            title={t('puzzle.replay_instruction')}
                        >
                            <Volume2 size={24} />
                        </button>
                    </p>
                </div>
            )}

            <main className={styles.puzzleContent}>
                <PuzzleComponent
                    key={`${puzzleData.puzzleType}-${adventureId}-${nodeIndex}-${activeEncounterDifficulty}`}
                    data={puzzleData}
                    onSolve={handleSolve}
                    instruction={instruction}
                />
            </main>

            {isCompleted && (
                <EncounterCompletionModal
                    result="VICTORY"
                    onContinue={handleCompletionContinue}

                    difficulty={activeEncounterDifficulty as number}

                />
            )}
        </div>
    );
};

export default PuzzlePage;
