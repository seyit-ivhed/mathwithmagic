import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Sword } from 'lucide-react';
import styles from './LevelUpModal.module.css';
import type { Companion } from '../../../../types/companion.types';
import { getStatsForLevel } from '../../../../utils/progression.utils';
import { getCompanionLevelUpImage } from '../../../../data/companion-sprites';
import { useVoiceOver } from '../../../../hooks/useVoiceOver';

interface LevelUpModalProps {
    companion: Companion;
    onConfirm: () => void;
}

type EvolutionStage = 'idle' | 'pre' | 'text' | 'flash' | 'post';

export const LevelUpModal: React.FC<LevelUpModalProps> = ({ companion, onConfirm }) => {
    const { t } = useTranslation();
    const currentLevel = companion.level;
    const nextLevel = currentLevel + 1;

    // Detect evolution
    const isEvolution = !!companion.evolutions.find(e => e.atLevel === nextLevel);
    const [evolutionStage, setEvolutionStage] = useState<EvolutionStage>(isEvolution ? 'pre' : 'post');

    const evolutionIndex = companion.stats?.evolutionIndex;
    const categoryName = `companions/${companion.id}/evolution-${evolutionIndex}`;
    useVoiceOver(categoryName, 'level-up');

    // Stats calculation
    const currentStats = companion.stats || getStatsForLevel(companion, currentLevel);
    const nextStats = getStatsForLevel(companion, nextLevel);

    // Image sources
    const preImageSrc = getCompanionLevelUpImage(companion.id, currentLevel) || '';
    const nextImageSrc = getCompanionLevelUpImage(companion.id, nextLevel) || '';

    const hpIncrease = nextStats.maxHealth - currentStats.maxHealth;
    const atkIncrease = (nextStats.abilityDamage || 0) - (currentStats.abilityDamage || 0);

    useEffect(() => {
        if (!isEvolution) {
            return;
        }

        // Evolution Sequence
        const textTimer = setTimeout(() => {
            setEvolutionStage('text');
        }, 1000);

        const flashTimer = setTimeout(() => {
            setEvolutionStage('flash');
        }, 3000);

        const postTimer = setTimeout(() => {
            setEvolutionStage('post');
        }, 3200);

        return () => {
            clearTimeout(textTimer);
            clearTimeout(flashTimer);
            clearTimeout(postTimer);
        };
    }, [isEvolution]);

    const showHUD = evolutionStage === 'post';

    return (
        <div className={styles.modalOverlay} data-testid="level-up-modal">
            <motion.div
                className={styles.levelUpFullScreen}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                {/* Background Image - Switch based on stage */}
                <motion.div
                    key={evolutionStage === 'post' ? 'next' : 'pre'}
                    className={styles.fullScreenBg}
                    initial={{ opacity: isEvolution && evolutionStage === 'post' ? 0 : 1 }}
                    animate={{ opacity: 1 }}
                    style={{ backgroundImage: `url(${evolutionStage === 'post' ? nextImageSrc : preImageSrc})` }}
                />

                {/* Evolution Text */}
                <AnimatePresence>
                    {(evolutionStage === 'text' || evolutionStage === 'flash') && (
                        <motion.div
                            key="evolution-text"
                            className={styles.evolutionText}
                            initial={{ scale: 1, opacity: 0 }}
                            animate={{
                                scale: 1.2,
                                opacity: 1,
                            }}
                            exit={{ opacity: 0, scale: 1.4 }}
                            transition={{ duration: 1 }}
                        >
                            {t('companions.evolution')}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Flash Effect */}
                <AnimatePresence>
                    {evolutionStage === 'flash' && (
                        <motion.div
                            key="flash-overlay"
                            className={styles.flashOverlay}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                        />
                    )}
                </AnimatePresence>

                {/* Vignette Overlay */}
                <div className={styles.fullScreenOverlay} />

                {/* Bottom HUD: 3 Columns anchored to bottom */}
                <AnimatePresence>
                    {showHUD && (
                        <motion.div
                            className={styles.bottomActionsRow}
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                        >
                            {/* Left Column: HP Increase */}
                            <motion.div
                                className={styles.statPulseBox}
                                initial={{ opacity: 0, x: -50 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5, duration: 0.6 }}
                            >
                                <Heart className={styles.statIconHP} size={32} />
                                <div className={styles.statAmount}>+{hpIncrease}</div>
                            </motion.div>

                            {/* Center Column: Level Display (Top) + Continue Button (Bottom) */}
                            <div className={styles.centerActionsColumn}>
                                <motion.div
                                    className={styles.levelStompContainer}
                                    initial={{ scale: 2, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{
                                        delay: 0.2,
                                        duration: 0.5,
                                        type: "spring",
                                        damping: 12
                                    }}
                                >
                                    <span className={styles.levelLabelPrefix}>{t('common.level').toUpperCase()}</span>
                                    <span className={styles.levelValueLarge}>{nextLevel}</span>
                                </motion.div>

                                <motion.div
                                    className={styles.modalFooter}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.8, duration: 0.5 }}
                                >
                                    <button className={styles.modalContinueButtonSmall} onClick={onConfirm} data-testid="modal-continue-button">
                                        {t('common.continue').toUpperCase()}
                                    </button>
                                </motion.div>
                            </div>

                            {/* Right Column: ATK Increase */}
                            <motion.div
                                className={styles.statPulseBox}
                                initial={{ opacity: 0, x: 50 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5, duration: 0.6 }}
                            >
                                <Sword className={styles.statIconATK} size={32} />
                                <div className={styles.statAmount}>+{atkIncrease}</div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Visual Flair Lines */}
                {showHUD && (
                    <div className={styles.flairContainer}>
                        <div className={styles.horizontalLine} />
                    </div>
                )}
            </motion.div>
        </div>
    );
};

