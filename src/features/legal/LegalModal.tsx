import React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { PrivacyPolicyContent } from './PrivacyPolicyContent';
import { TermsOfServiceContent } from './TermsOfServiceContent';
import styles from './LegalModal.module.css';

export type LegalDocumentType = 'privacy' | 'terms';

interface LegalModalProps {
    type: LegalDocumentType;
    onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ type, onClose }) => {
    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return createPortal(
        <div
            className={styles.legalModalOverlay}
            onClick={handleOverlayClick}
            role="dialog"
            aria-modal="true"
            aria-label={type === 'privacy' ? 'Privacy Policy' : 'Terms of Service'}
            data-testid="legal-modal"
        >
            <div className={styles.legalModalContent}>
                <button
                    className={styles.closeButton}
                    onClick={onClose}
                    aria-label="Close"
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
