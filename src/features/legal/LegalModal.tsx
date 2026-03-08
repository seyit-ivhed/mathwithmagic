import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { PrivacyPolicyContent } from './PrivacyPolicyContent';
import { TermsOfServiceContent } from './TermsOfServiceContent';
import styles from './LegalModal.module.css';

export type LegalDocumentType = 'privacy' | 'terms';

interface LegalModalProps {
    type: LegalDocumentType;
    onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ type, onClose }) => {
    const { t } = useTranslation();

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [onClose]);

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    const label = type === 'privacy'
        ? t('legal.privacy_policy', 'Privacy Policy')
        : t('legal.terms_of_service', 'Terms of Service');

    return createPortal(
        <div
            className={styles.legalModalOverlay}
            onClick={handleOverlayClick}
            role="dialog"
            aria-modal="true"
            aria-label={label}
            data-testid="legal-modal"
        >
            <div className={styles.legalModalContent}>
                <button
                    className={styles.closeButton}
                    onClick={onClose}
                    aria-label={t('legal.close', 'Close')}
                    data-testid="legal-modal-close"
                >
                    <X size={20} />
                </button>
                <div className={styles.legalScrollArea}>
                    {type === 'privacy' ? <PrivacyPolicyContent /> : <TermsOfServiceContent />}
                </div>
            </div>
        </div>,
        document.body
    );
};
