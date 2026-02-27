import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useGameStore } from '../../stores/game/store';
import { calculateAdventureStars } from '../../utils/progression.utils';
import { ChapterPage } from './components/ChapterPage';
import { PremiumStoreModal } from '../premium/components/PremiumStoreModal';
import { useChronicleData } from './hooks/useChronicleData';
import { useChronicleNavigation } from './hooks/useChronicleNavigation';
import styles from './ChronicleBook.module.css';
import { BookLayout } from './components/Book/BookLayout';
import { BookPage } from './components/Book/BookPage';
import { BookCover } from './components/Book/BookCover';
import { BookLogin } from './components/Book/BookLogin';
import { BookDifficulty } from './components/Book/BookDifficulty';
import { getBookStateFromUrl, calculatePageZIndex } from './utils/chronicle.utils';
import { Header } from '../../components/Header';

export const ChronicleBook: React.FC = () => {
    const { adventureStatuses, isAdventureUnlocked, encounterResults, setEncounterDifficulty } = useGameStore();
    const navigate = useNavigate();
    const { pageId } = useParams<{ pageId: string }>();

    // Check if user has any progress to decide initial state
    const hasAnyProgress = Object.keys(encounterResults).length > 0;

    // Determine Book State from URL
    const bookState = getBookStateFromUrl(pageId);
    const urlAdventureId = bookState === 'ADVENTURE' ? pageId : undefined;

    // UI State
    const [isPremiumModalOpen, setIsPremiumModalOpen] = React.useState(false);

    // Hooks
    const {
        adventures,
        currentAdventureIndex,
        currentAdventure,
        activeAdventureId
    } = useChronicleData(urlAdventureId);

    // Redirect Logic
    useEffect(() => {
        // If at root /chronicle (pageId undefined), decide where to go
        if (!pageId) {
            if (hasAnyProgress) {
                // If user has progress, go to their active adventure
                if (activeAdventureId) {
                    navigate(`/chronicle/${activeAdventureId}`, { replace: true });
                }
            } else {
                // No progress -> Cover
                navigate('/chronicle/cover', { replace: true });
            }
        }
    }, [pageId, hasAnyProgress, activeAdventureId, navigate]);


    // Wrapper to navigate instead of setting internal state
    const handleSetActiveAdventureId = (id: string) => {
        navigate(`/chronicle/${id}`);
    };

    const {
        handleNext,
        handlePrev,
        handleBegin,
        isJustCompleted
    } = useChronicleNavigation({
        currentAdventureIndex,
        adventures,
        currentAdventure,
        setActiveAdventureId: handleSetActiveAdventureId,
        setIsPremiumModalOpen
    });

    // Handlers for Cover Interactions
    const handleStartNewGame = () => {
        if (hasAnyProgress) {
            // Continue game (go to current adventure)
            // activeAdventureId already holds the "highest unlocked" or "current" adventure logic from useChronicleData
            navigate(`/chronicle/${activeAdventureId}`);
        } else {
            navigate('/chronicle/difficulty');
        }
    };

    const handleDifficultySelected = (difficulty: number) => {
        setEncounterDifficulty(difficulty);
        // Start at adventure 1
        navigate('/chronicle/1');
    };

    const handleGoToLogin = () => {
        navigate('/chronicle/login');
    };

    const handleBackToCover = () => {
        navigate('/chronicle/cover');
    };

    const handleLoginSuccess = () => {
        // Login success -> Go to adventure (will use default logic to pick right one)
        // Navigate to root /chronicle and let the redirect logic pick the best adventure
        navigate('/chronicle', { replace: true });
    };

    if (!currentAdventure && bookState === 'ADVENTURE') {
        return null;
    }

    // Calculate z-indices and states for 3D pages
    const coverState = bookState === 'COVER' ? 'active' : 'flipped';
    const loginState = bookState === 'LOGIN' ? 'active' : (bookState === 'COVER' ? 'upcoming' : 'flipped');
    const difficultyState = bookState === 'DIFFICULTY' ? 'active' : (bookState === 'COVER' || bookState === 'LOGIN' ? 'upcoming' : 'flipped');

    return (
        <>
            <Header />
            <BookLayout isOpen={bookState !== 'COVER'}>
                {/* COVER PAGE */}
                <BookPage
                    state={coverState}
                    zIndex={calculatePageZIndex(coverState, 0)}
                    isCover
                >
                    <BookCover
                        onStart={handleStartNewGame}
                        onLogin={handleGoToLogin}
                        hasProgress={hasAnyProgress}
                        isActive={coverState === 'active'}
                    />
                </BookPage>

                {/* LOGIN PAGE */}
                <BookPage
                    state={loginState}
                    zIndex={calculatePageZIndex(loginState, 1)}
                >
                    <BookLogin
                        onBack={handleBackToCover}
                        onSuccess={handleLoginSuccess}
                    />
                </BookPage>

                {/* DIFFICULTY SELECTION PAGE */}
                <BookPage
                    state={difficultyState}
                    zIndex={calculatePageZIndex(difficultyState, 2)}
                >
                    <BookDifficulty
                        onSelect={handleDifficultySelected}
                        onBack={handleBackToCover}
                    />
                </BookPage>

                {/* ADVENTURE ITEM PAGES (The main content) */}
                {adventures.map((adventure, index) => {
                    const isCurrentAdventure = index === currentAdventureIndex;
                    const isPastAdventure = index < currentAdventureIndex;

                    // Only mark as 'active' if we are actually in ADVENTURE mode
                    const state = (bookState === 'ADVENTURE')
                        ? (isPastAdventure ? 'flipped' : isCurrentAdventure ? 'active' : 'upcoming')
                        : 'upcoming';

                    const position = 3 + index;

                    return (
                        <BookPage
                            key={adventure.id}
                            state={state}
                            zIndex={calculatePageZIndex(state, position)}
                        >
                            <div className={styles.pageMotionWrapper}>
                                <ChapterPage
                                    adventure={adventure}
                                    status={adventureStatuses[adventure.id] || 'LOCKED'}
                                    stars={calculateAdventureStars(adventure.id, adventure.encounters, encounterResults)}
                                    onBegin={handleBegin}
                                    onReplay={handleBegin}
                                    onNext={handleNext}
                                    onPrev={handlePrev}
                                    canNext={index < adventures.length - 1}
                                    canPrev={true}
                                    currentPage={index + 1}
                                    totalPages={adventures.length}
                                    isJustCompleted={isJustCompleted && adventure.id === currentAdventure?.id}
                                    isPremiumLocked={!isAdventureUnlocked(adventure.id)}
                                    hasProgress={Object.keys(encounterResults).some(key => key.startsWith(`${adventure.id}_`))}
                                    isActive={state === 'active'}
                                />
                            </div>
                        </BookPage>
                    );
                })}

            </BookLayout>
            <PremiumStoreModal
                isOpen={isPremiumModalOpen}
                onClose={() => setIsPremiumModalOpen(false)}
            />
        </>
    );
};
