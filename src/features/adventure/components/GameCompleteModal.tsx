import React from 'react';
import { useTranslation } from 'react-i18next';
import { Star, Trophy } from 'lucide-react';
import { createPortal } from 'react-dom';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { FormCloseButton } from '../../../components/ui/FormCloseButton';
import { ADVENTURES } from '../../../data/adventures.data';
import { EncounterType } from '../../../types/adventure.types';
import type { EncounterResult } from '../../../stores/game/store';
import styles from './GameCompleteModal.module.css';

interface GameCompleteModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPlayAgain: (nextDifficulty: number) => void;
    encounterResults: Record<string, EncounterResult>;
    currentDifficulty: number;
}

const MAX_DIFFICULTY = 3;
const MAX_STARS = 3;

function getAdventureMinStars(
    adventureId: string,
    encounterResults: Record<string, EncounterResult>
): number {
    const adventure = ADVENTURES.find(a => a.id === adventureId);
    if (!adventure) return 0;

    const ratedEncounters = adventure.encounters.filter(
        e => e.type !== EncounterType.ENDING
    );

    if (ratedEncounters.length === 0) return 0;

    let minStars = MAX_STARS;
    for (const encounter of ratedEncounters) {
        const nodeStep = adventure.encounters.indexOf(encounter) + 1;
        const key = `${adventureId}_${nodeStep}`;
        const result = encounterResults[key];
        const stars = result?.stars ?? 0;
        if (stars < minStars) {
            minStars = stars;
        }
    }

    return minStars;
}

export const GameCompleteModal: React.FC<GameCompleteModalProps> = ({
    isOpen,
    onClose,
    onPlayAgain,
    encounterResults,
    currentDifficulty,
}) => {
    const { t } = useTranslation();

    if (!isOpen) return null;

    const nextDifficulty = Math.min(currentDifficulty + 1, MAX_DIFFICULTY);
    const isAtMaxDifficulty = currentDifficulty >= MAX_DIFFICULTY;

    const getDifficultyLabel = (level: number) => {
        switch (level) {
            case 1: return t('difficulty.apprentice');
            case 2: return t('difficulty.scout');
            case 3: return t('difficulty.adventurer');
            default: return '';
        }
    };

    const ctaLabel = isAtMaxDifficulty
        ? t('game_complete.play_again_max')
        : t('game_complete.play_again_higher', { difficulty: getDifficultyLabel(nextDifficulty) });

    const ctaHint = isAtMaxDifficulty
        ? t('game_complete.play_again_max_hint')
        : t('game_complete.play_again_hint');

    return createPortal(
        <div className={styles.overlay} data-testid="game-complete-modal-overlay">
            <div className={styles.modal} data-testid="game-complete-modal">
                <FormCloseButton onClick={onClose} size={32} />

                <div className={styles.header}>
                    <Trophy size={56} className={styles.trophyIcon} />
                    <h2 className={styles.title}>{t('game_complete.title')}</h2>
                    <p className={styles.subtitle}>{t('game_complete.subtitle')}</p>
                </div>

                <div className={styles.statsSection}>
                    <h3 className={styles.statsHeading}>{t('game_complete.adventure_stats_heading')}</h3>
                    <div className={styles.adventureList}>
                        {ADVENTURES.map((adventure, index) => {
                            const minStars = getAdventureMinStars(adventure.id, encounterResults);
                            return (
                                <div key={adventure.id} className={styles.adventureRow} data-testid={`adventure-row-${adventure.id}`}>
                                    <span className={styles.adventureName}>
                                        {t('game_complete.adventure_label', { number: index + 1 })}
                                    </span>
                                    <div className={styles.starsRow}>
                                        {[...Array(MAX_STARS)].map((_, i) => (
                                            <Star
                                                key={i}
                                                size={20}
                                                fill={i < minStars ? '#FFD700' : 'transparent'}
                                                color={i < minStars ? '#FFD700' : 'rgba(44,30,17,0.2)'}
                                            />
                                        ))}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className={styles.ctaSection}>
                    <p className={styles.ctaHint}>{ctaHint}</p>
                    <PrimaryButton
                        variant="gold"
                        radiate
                        onClick={() => onPlayAgain(nextDifficulty)}
                        data-testid="game-complete-play-again-btn"
                    >
                        {ctaLabel}
                    </PrimaryButton>
                </div>
            </div>
        </div>,
        document.body
    );
};
