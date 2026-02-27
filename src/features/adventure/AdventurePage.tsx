import { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useGameStore } from '../../stores/game/store';
import { getFocalNodeIndex } from './utils/navigation.utils';
import { DifficultySelectionModal } from './components/DifficultySelectionModal';
import './AdventurePage.css';
import { ADVENTURES } from '../../data/adventures.data';
import { EncounterType, type Encounter } from '../../types/adventure.types';
import { FantasyMap } from './components/FantasyMap';
import { Header } from '../../components/Header';
import { BookOpen } from 'lucide-react';

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
        notifyEncounterStarted
    } = useGameStore();

    const [isDifficultyModalOpen, setIsDifficultyModalOpen] = useState(false);
    const [selectedEncounter, setSelectedEncounter] = useState<Encounter | null>(null);

    // Get active adventure
    const adventure = ADVENTURES.find(a => a.id === adventureId);

    if (!adventure || !adventureId) {
        return <div>{t('adventure.not_found', 'Adventure not found')}</div>;
    }

    // Dynamic focal node logic
    const focalNodeFromState = (location.state as { focalNode?: number } | null)?.focalNode;
    const currentNode = focalNodeFromState ?? getFocalNodeIndex(adventureId, encounterResults);

    const { encounters } = adventure;

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

            navigate('/chronicle', { state: { justCompletedAdventureId: adventureId } });
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

    return (
        <div className="adventure-page custom-scrollbar">
            <main className="adventure-content">
                <Header
                    leftIcon={<BookOpen size={32} />}
                    onLeftClick={() => navigate(`/chronicle/${adventureId}`)}
                    leftAriaLabel={t('common.back')}
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
        </div>
    );
};

export default AdventurePage;
