import React, { useEffect, useRef } from 'react';
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

const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])';

export const LegalModal: React.FC<LegalModalProps> = ({ type, onClose, onOpenPrivacy }) => {
    const { t } = useTranslation();
    const modalRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const previouslyFocused = document.activeElement as HTMLElement | null;
        const modal = modalRef.current;

        if (modal) {
            const focusable = modal.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR);
            if (focusable.length > 0) {
                focusable[0].focus();
            }
        }

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
                return;
            }
            if (e.key !== 'Tab' || !modal) {
                return;
            }
            const focusable = Array.from(modal.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR));
            if (focusable.length === 0) {
                return;
            }
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (e.shiftKey) {
                if (document.activeElement === first) {
                    e.preventDefault();
                    last.focus();
                }
            } else {
                if (document.activeElement === last) {
                    e.preventDefault();
                    first.focus();
                }
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            previouslyFocused?.focus();
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
            <div className={styles.legalModalContent} ref={modalRef}>
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
