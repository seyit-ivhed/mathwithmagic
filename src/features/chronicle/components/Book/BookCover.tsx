import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './BookCover.module.css';
import { PrimaryButton } from '../../../../components/ui/PrimaryButton';
import { GameParticles } from '../../../../components/ui/GameParticles';
import { BOOK_MAGIC_OPTIONS } from '../../../../components/ui/GameParticles.constants';
import coverImage from '../../../../assets/images/tome-cover/cover.webp';

interface BookCoverProps {
    onStart: () => void;
    onLogin: () => void;
    hasProgress?: boolean;
    isActive?: boolean;
}

export const BookCover: React.FC<BookCoverProps> = ({
    onStart,
    onLogin,
    hasProgress = false,
    isActive = true
}) => {
    const { t } = useTranslation();

    return (
        <div className={styles.coverContent}>
            <img src={coverImage} alt="" className={`${styles.coverImage} ${!isActive ? styles.coverImageHidden : ''}`} />
            <div className={styles.runeGlow} />
            <div className={`${styles.particlesWrapper} ${!isActive ? styles.particlesHidden : ''}`}>
                <GameParticles options={BOOK_MAGIC_OPTIONS} />
            </div>
            <header className={styles.coverHeader}>
                <h1 className={styles.coverTitle}>
                    <span className={styles.coverTitleWord}>Math</span>
                    <span className={styles.coverTitleWord}>with</span>
                    <span className={styles.coverTitleWord}>Magic</span>
                </h1>
            </header>

            <div className={styles.coverActions}>
                <PrimaryButton
                    className={styles.btnPrimaryOverrides}
                    onClick={onStart}
                    data-testid="cover-start-btn"
                >
                    {hasProgress ? t('landing.continue_journey') : t('landing.start_game')}
                </PrimaryButton>

                <PrimaryButton
                    className={styles.btnSecondary}
                    onClick={onLogin}
                    data-testid="cover-login-btn"
                >
                    {t('landing.login')}
                </PrimaryButton>
            </div>

        </div>
    );
};
