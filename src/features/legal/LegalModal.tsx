import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { FormCloseButton } from '../../components/ui/FormCloseButton';
import { PrivacyPolicyContent } from './PrivacyPolicyContent';
import { TermsOfServiceContent } from './TermsOfServiceContent';
import styles from './LegalModal.module.css';

export type LegalDocumentType = 'privacy' | 'terms';

interface LegalModalProps {
    type: LegalDocumentType;
    onClose: () => void;
    onOpenPrivacy?: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ type, onClose, onOpenPrivacy }) => {
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
                <FormCloseButton
                    onClick={onClose}
                    ariaLabel={t('legal.close', 'Close')}
                    color="rgba(255, 255, 255, 0.7)"
                />
                <div className={styles.legalScrollArea}>
                    {type === 'privacy' ? <PrivacyPolicyContent /> : <TermsOfServiceContent onOpenPrivacy={onOpenPrivacy} />}
                </div>
            </div>
        </div>,
        document.body
    );
};
