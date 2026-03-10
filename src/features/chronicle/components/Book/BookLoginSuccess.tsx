import React from 'react';
import { useTranslation } from 'react-i18next';
import { CheckCircle2 } from 'lucide-react';
import { PrimaryButton } from '../../../../components/ui/PrimaryButton';
import styles from '../../ChronicleBook.module.css';

interface BookLoginSuccessProps {
    onContinue: () => void;
}

export const BookLoginSuccess: React.FC<BookLoginSuccessProps> = ({ onContinue }) => {
    const { t } = useTranslation();

    return (
        <div className={styles.loginSuccessContent}>
            <div className={styles.loginSuccessIcon}>
                <CheckCircle2 size={64} />
            </div>

            <header className={styles.pageHeader}>
                <h2 className={styles.pageTitle}>{t('login.success_title')}</h2>
                <div className={styles.divider} />
            </header>

            <p className={styles.loginSuccessMessage}>
                {t('login.success_message')}
            </p>

            <PrimaryButton
                onClick={onContinue}
                className={styles.btnPrimaryOverrides}
                data-testid="login-success-continue-btn"
            >
                {t('login.success_continue')}
            </PrimaryButton>
        </div>
    );
};
