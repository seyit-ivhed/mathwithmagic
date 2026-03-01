import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';

interface ChapterActionsProps {
    adventureId: string;
    onBegin: (id: string) => void;
    onReplay: (id: string) => void;
    onNext: () => void;
    onPrev: () => void;
    canNext: boolean;
    canPrev: boolean;
    isLocked: boolean | undefined;
    isPremiumLocked: boolean | undefined;
    isProgressionLocked: boolean;
    isCompleted: boolean;
    isJustCompleted?: boolean;
    currentPage: number;
    totalPages: number;
    hasProgress?: boolean;
}

export const ChapterActions: React.FC<ChapterActionsProps> = ({
    adventureId,
    onBegin,
    onReplay,
    onNext,
    onPrev,
    canNext,
    canPrev,
    isLocked,
    isPremiumLocked,
    isProgressionLocked,
    isCompleted,
    isJustCompleted,
    currentPage,
    totalPages,
    hasProgress
}) => {
    const { t } = useTranslation();

    return (
        <div className="chapter-footer">
            <div className="footer-controls">
                <motion.button
                    className="nav-btn"
                    onClick={onPrev}
                    disabled={!canPrev}
                    whileHover={canPrev ? { scale: 1.1 } : {}}
                    whileTap={canPrev ? { scale: 0.9 } : {}}
                    data-testid="prev-page-btn"
                    aria-label="Previous Page"
                >
                    <ChevronLeft size={64} />
                </motion.button>

                <div className="main-action">
                    {!isLocked ? (
                        isJustCompleted && canNext ? (
                            <PrimaryButton
                                onClick={onNext}
                                data-testid="next-chapter-btn"
                            >
                                {t('chronicle.next_chapter', 'Next Chapter')}
                            </PrimaryButton>
                        ) : isCompleted ? (
                            <motion.button
                                className="book-btn replay-btn"
                                onClick={() => {
                                    onReplay(adventureId);
                                }}
                                data-testid="replay-chapter-btn"
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                {t('chronicle.replay_chapter')}
                            </motion.button>
                        ) : (
                            <PrimaryButton
                                onClick={() => {
                                    onBegin(adventureId);
                                }}
                                data-testid="begin-chapter-btn"
                            >
                                {hasProgress ? t('chronicle.continue_chapter') : t('chronicle.begin_chapter')}
                            </PrimaryButton>
                        )
                    ) : isPremiumLocked && !isProgressionLocked ? (
                        <motion.button
                            className="book-btn premium-btn"
                            onClick={() => {
                                onBegin(adventureId);
                            }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            {t('premium.store.buy_now', 'Unlock')}
                        </motion.button>
                    ) : (
                        <div className="locked-msg" data-testid="chapter-locked-msg">{t('chronicle.locked')}</div>
                    )}
                </div>

                <motion.button
                    className="nav-btn"
                    onClick={onNext}
                    disabled={!canNext}
                    whileHover={canNext ? { scale: 1.1 } : {}}
                    whileTap={canNext ? { scale: 0.9 } : {}}
                    data-testid="next-page-btn"
                    aria-label="Next Page"
                >
                    <ChevronRight size={64} />
                </motion.button>
            </div>

            <div className="page-indicator-bottom" data-testid="page-indicator">
                {t('chronicle.page_x_of_y', { current: currentPage, total: totalPages })}
            </div>
        </div>
    );
};
