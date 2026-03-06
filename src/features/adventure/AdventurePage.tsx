import { useState, useRef, useCallback, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../../stores/game/store';
import { getFocalNodeIndex } from './utils/navigation.utils';
import { DifficultySelectionModal } from './components/DifficultySelectionModal';
import { GameCompleteModal } from './components/GameCompleteModal';
import './AdventurePage.css';
import { ADVENTURES } from '../../data/adventures.data';
import { EncounterType, type Encounter } from '../../types/adventure.types';
import { FantasyMap } from './components/FantasyMap';
import { Header } from '../../components/Header';
import { DebugConsole } from '../../components/DebugConsole';
import { BookOpen } from 'lucide-react';

const DEBUG_TAP_THRESHOLD = 7;
const DEBUG_TAP_WINDOW_MS = 1500;

const AdventurePage = () => {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation()
    const { adventureId } = useParams<{ adventureId: string }>();

    const {
        encounterResults,
        setEncounterDifficulty,
        activeEncounterDifficulty,
        completeEncounter,
        completeAdventure,
        unlockAdventure,
        notifyEncounterStarted,
    } = useGameStore();

    const [isDifficultyModalOpen, setIsDifficultyModalOpen] = useState(false);
    const [selectedEncounter, setSelectedEncounter] = useState<Encounter | null>(null);
    const [isGameCompleteModalOpen, setIsGameCompleteModalOpen] = useState(false);
    const [isDebugOpen, setIsDebugOpen] = useState(false);

    const tapCountRef = useRef(0);
    const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        return () => {
            if (tapTimerRef.current) {
                clearTimeout(tapTimerRef.current);
            }
        };
    }, []);

    const handleTitleClick = useCallback(() => {
        tapCountRef.current += 1;

        if (tapTimerRef.current) {
            clearTimeout(tapTimerRef.current);
        }

        if (tapCountRef.current >= DEBUG_TAP_THRESHOLD) {
            tapCountRef.current = 0;
            setIsDebugOpen(true);
            return;
        }

        tapTimerRef.current = setTimeout(() => {
            tapCountRef.current = 0;
        }, DEBUG_TAP_WINDOW_MS);
    }, []);

    // Get active adventure
    const adventure = ADVENTURES.find(a => a.id === adventureId);

    if (!adventure || !adventureId) {
        return <div>{t('adventure.not_found', 'Adventure not found')}</div>;
    }

    // Dynamic focal node logic
    const focalNodeFromState = (location.state as { focalNode?: number } | null)?.focalNode;
    const currentNode = focalNodeFromState ?? getFocalNodeIndex(adventureId, encounterResults);

    const { encounters } = adventure;

    const isLastAdventure = ADVENTURES.length > 0 && ADVENTURES[ADVENTURES.length - 1].id === adventureId;

    const handleNodeClick = (encounter: typeof encounters[0]) => {
        if (encounter.type === EncounterType.BATTLE || encounter.type === EncounterType.BOSS || encounter.type === EncounterType.PUZZLE) {
            setSelectedEncounter(encounter);
            setIsDifficultyModalOpen(true);
        }

        if (encounter.type === EncounterType.ENDING) {
            // Complete current adventure in game progress
            completeEncounter(adventureId, encounters.findIndex(e => e.id === encounter.id) + 1);

            // Mark adventure as completed in metadata store
            completeAdventure(adventureId);

            // Find next adventure to unlock
            const currentAdventureIndex = ADVENTURES.findIndex(a => a.id === adventureId);
            if (currentAdventureIndex !== -1 && currentAdventureIndex < ADVENTURES.length - 1) {
                const nextAdventure = ADVENTURES[currentAdventureIndex + 1];
                unlockAdventure(nextAdventure.id);
            }

            if (isLastAdventure) {
                setIsGameCompleteModalOpen(true);
            } else {
                navigate('/chronicle', { state: { justCompletedAdventureId: adventureId } });
            }
        }
    };

    const handleStartEncounter = (difficulty: number) => {
        if (!selectedEncounter) {
            return;
        }

        const nodeStep = encounters.findIndex(e => e.id === selectedEncounter.id) + 1;
        setEncounterDifficulty(difficulty);

        // Notify store encounter started (handles data-driven companion joins)
        notifyEncounterStarted(adventureId, nodeStep);

        const routePrefix = selectedEncounter.type === EncounterType.PUZZLE ? 'puzzle' : 'encounter';
        navigate(`/${routePrefix}/${adventureId}/${nodeStep}`);

        setIsDifficultyModalOpen(false);
    };

    const handlePlayAgain = (nextDifficulty: number) => {
        setEncounterDifficulty(nextDifficulty);
        setIsGameCompleteModalOpen(false);
        navigate('/chronicle');
    };

    return (
        <div className="adventure-page custom-scrollbar">
            <main className="adventure-content">
                <Header
                    leftIcon={<BookOpen size={32} />}
                    onLeftClick={() => navigate(`/chronicle/${adventureId}`)}
                    leftAriaLabel={t('common.back')}
                    leftTestId="back-to-chronicle-btn"
                    title={t(`adventures.${adventureId}.title`, adventure.title || t('common.adventure', 'Adventure')) as string}
                    onTitleClick={handleTitleClick}
                />

                <FantasyMap
                    adventure={adventure}
                    currentNode={currentNode}
                    onNodeClick={handleNodeClick}
                />
            </main>

            <DifficultySelectionModal
                isOpen={isDifficultyModalOpen}
                onClose={() => setIsDifficultyModalOpen(false)}
                onStart={handleStartEncounter}
                title={(selectedEncounter ? t(`adventures.${adventureId}.nodes.${selectedEncounter.id}.label`, selectedEncounter.label || '') : '') as string}
                initialDifficulty={activeEncounterDifficulty}
            />

            <GameCompleteModal
                isOpen={isGameCompleteModalOpen}
                onClose={() => {
                    setIsGameCompleteModalOpen(false);
                    navigate('/chronicle', { state: { justCompletedAdventureId: adventureId } });
                }}
                onPlayAgain={handlePlayAgain}
                encounterResults={encounterResults}
                currentDifficulty={activeEncounterDifficulty}
            />

            {isDebugOpen && (
                <DebugConsole onClose={() => setIsDebugOpen(false)} />
            )}
        </div>
    );
};

export default AdventurePage;
