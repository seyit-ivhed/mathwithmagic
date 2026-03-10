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
import { BookForgotPassword } from './components/Book/BookForgotPassword';
import { BookDifficulty } from './components/Book/BookDifficulty';
import { BookLoginSuccess } from './components/Book/BookLoginSuccess';
import { getBookStateFromUrl, calculatePageZIndex } from './utils/chronicle.utils';
import { Header } from '../../components/Header';
import { playSfx } from '../../components/audio/audio.utils';
import { analyticsService } from '../../services/analytics.service';
import { LegalModal, type LegalDocumentType } from '../legal/LegalModal';
import { ChroniclesLegalFooter } from './components/ChroniclesLegalFooter';

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
    const [premiumSourceAdventureId, setPremiumSourceAdventureId] = React.useState<string | undefined>(undefined);
    const [legalModal, setLegalModal] = React.useState<LegalDocumentType | null>(null);

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
        handleBegin: handleBeginInternal,
        isJustCompleted
    } = useChronicleNavigation({
        currentAdventureIndex,
        adventures,
        currentAdventure,
        setActiveAdventureId: handleSetActiveAdventureId,
        setIsPremiumModalOpen,
        setPremiumSourceAdventureId,
    });

    const handleBegin = (id: string) => {
        handleBeginInternal(id);
    };

    // Handlers for Cover Interactions
    const handleStartNewGame = () => {
        if (hasAnyProgress) {
            analyticsService.trackEvent('cover_start_clicked', { has_progress: true, destination: 'adventure' });
            navigate(`/chronicle/${activeAdventureId}`);
        } else {
            analyticsService.trackEvent('cover_start_clicked', { has_progress: false, destination: 'difficulty' });
            navigate('/chronicle/difficulty');
        }
    };

    const handleDifficultySelected = (difficulty: number) => {
        setEncounterDifficulty(difficulty);
        // Start at adventure 1
        navigate('/chronicle/1');
    };

    const handleGoToLogin = () => {
        analyticsService.trackEvent('cover_login_clicked');
        navigate('/chronicle/login');
    };

    const handleGoToForgotPassword = () => {
        navigate('/chronicle/forgot-password');
    };

    const handleBackToLogin = () => {
        navigate('/chronicle/login');
    };

    const handleBackToCover = () => {
        navigate('/chronicle/cover');
    };

    const handleLoginSuccess = () => {
        analyticsService.trackEvent('login_succeeded');
        navigate('/chronicle/login-success', { replace: true });
    };

    const handleLoginSuccessContinue = () => {
        // Navigate to root /chronicle and let the redirect logic pick the best adventure
        navigate('/chronicle', { replace: true });
    };

    if (!currentAdventure && bookState === 'ADVENTURE') {
        return null;
    }

    // Calculate z-indices and states for 3D pages
    const coverState = bookState === 'COVER' ? 'active' : 'flipped';
    const loginState = bookState === 'LOGIN' ? 'active' : (bookState === 'COVER' ? 'upcoming' : 'flipped');
    const loginSuccessState = bookState === 'LOGIN_SUCCESS' ? 'active' : (bookState === 'COVER' || bookState === 'LOGIN' ? 'upcoming' : 'flipped');
    const forgotPasswordState = bookState === 'FORGOT_PASSWORD' ? 'active' : (bookState === 'COVER' || bookState === 'LOGIN' || bookState === 'LOGIN_SUCCESS' ? 'upcoming' : 'flipped');
    const difficultyState = bookState === 'DIFFICULTY' ? 'active' : (bookState === 'COVER' || bookState === 'LOGIN' || bookState === 'LOGIN_SUCCESS' || bookState === 'FORGOT_PASSWORD' ? 'upcoming' : 'flipped');

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
                        onForgotPassword={handleGoToForgotPassword}
                    />
                </BookPage>

                {/* LOGIN SUCCESS PAGE */}
                <BookPage
                    state={loginSuccessState}
                    zIndex={calculatePageZIndex(loginSuccessState, 2)}
                >
                    <BookLoginSuccess
                        onContinue={handleLoginSuccessContinue}
                    />
                </BookPage>

                {/* FORGOT PASSWORD PAGE */}
                <BookPage
                    state={forgotPasswordState}
                    zIndex={calculatePageZIndex(forgotPasswordState, 3)}
                >
                    <BookForgotPassword
                        onBack={handleBackToLogin}
                    />
                </BookPage>

                {/* DIFFICULTY SELECTION PAGE */}
                <BookPage
                    state={difficultyState}
                    zIndex={calculatePageZIndex(difficultyState, 4)}
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

                    const position = 5 + index;

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
                                    onNext={() => {
                                        playSfx('interface/page-shuffle');
                                        handleNext();
                                    }}
                                    onPrev={() => {
                                        playSfx('interface/page-shuffle');
                                        handlePrev();
                                    }}
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
                onClose={() => {
                    setIsPremiumModalOpen(false);
                    setPremiumSourceAdventureId(undefined);
                }}
                sourceAdventureId={premiumSourceAdventureId}
            />

            <ChroniclesLegalFooter onOpen={setLegalModal} />

            {legalModal && (
                <LegalModal type={legalModal} onClose={() => setLegalModal(null)} onOpenPrivacy={() => setLegalModal('privacy')} />
            )}
        </>
    );
};
