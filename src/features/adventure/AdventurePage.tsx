import { useState } from 'react';
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
import { BookOpen } from 'lucide-react';
import { analyticsService } from '../../services/analytics.service';

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

    // Get active adventure
    const adventure = ADVENTURES.find(a => a.id === adventureId);

    // Dynamic focal node logic (computed before early return so hooks run unconditionally)
    const focalNodeFromState = (location.state as { focalNode?: number } | null)?.focalNode;
    const currentNode = focalNodeFromState ?? getFocalNodeIndex(adventureId ?? '', encounterResults);

    const { encounters = [] } = adventure ?? {};

    const isLastAdventure = ADVENTURES.length > 0 && ADVENTURES[ADVENTURES.length - 1].id === adventureId;

    if (!adventure || !adventureId) {
        return <div>{t('adventure.not_found', 'Adventure not found')}</div>;
    }

    const handleNodeClick = (encounter: typeof encounters[0]) => {
        const nodeIndex = encounters.findIndex(e => e.id === encounter.id) + 1;

        analyticsService.trackEvent('node_clicked', {
            adventure_id: adventureId,
            node_index: nodeIndex,
            encounter_type: encounter.type,
        });

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

        analyticsService.trackEvent('encounter_difficulty_selected', {
            adventure_id: adventureId,
            node_index: nodeStep,
            encounter_type: selectedEncounter.type,
            difficulty,
        });

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
        </div>
    );
};

export default AdventurePage;
