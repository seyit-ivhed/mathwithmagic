import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ChevronLeft } from 'lucide-react';
import { TermsOfServiceContent } from './TermsOfServiceContent';
import styles from './LegalStandalonePage.module.css';

export const TermsPage: React.FC = () => {
    const { t } = useTranslation();

    return (
        <div className={styles.legalPageWrapper}>
            <header className={styles.legalPageHeader}>
                <nav className={styles.legalPageNav}>
                    <Link to="/" className={styles.legalPageBackLink}>
                        <ChevronLeft size={16} aria-hidden="true" />
                        {t('landing.title', 'Math with Magic')}
                    </Link>
                </nav>
            </header>
            <div className={styles.legalPageContent}>
                <div className={styles.legalScrollArea}>
                    <TermsOfServiceContent />
                </div>
            </div>
        </div>
    );
};
