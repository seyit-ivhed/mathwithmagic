import React from 'react';
import { useTranslation } from 'react-i18next';
import type { LegalDocumentType } from '../../legal/LegalModal';
import styles from '../ChronicleBook.module.css';

interface ChroniclesLegalFooterProps {
    onOpen: (type: LegalDocumentType) => void;
}

export const ChroniclesLegalFooter: React.FC<ChroniclesLegalFooterProps> = ({ onOpen }) => {
    const { t } = useTranslation();

    return (
        <footer className={styles.legalFooter}>
            <button
                className={styles.legalFooterLink}
                onClick={() => onOpen('privacy')}
                data-testid="footer-privacy-link"
            >
                {t('legal.privacy_policy', 'Privacy Policy')}
            </button>
            <span className={styles.legalFooterSeparator}>|</span>
            <button
                className={styles.legalFooterLink}
                onClick={() => onOpen('terms')}
                data-testid="footer-terms-link"
            >
                {t('legal.terms_of_service', 'Terms of Service')}
            </button>
        </footer>
    );
};
