import React from 'react';
import { useTranslation } from 'react-i18next';
import styles from './FarewellPage.module.css';

export const FarewellPage: React.FC = () => {
    const { t } = useTranslation();

    return (
        <div className={styles.wrapper} data-testid="farewell-page">
            <div className={styles.card}>
                <h2 className={styles.title} data-testid="farewell-title">
                    {t('farewell.title', 'Farewell, Adventurer')}
                </h2>
                <div className={styles.divider} />
                <p className={styles.message} data-testid="farewell-message">
                    {t('farewell.message', "It's sad for you to go, but thanks for the adventure")}
                </p>
            </div>
        </div>
    );
};
