import React from 'react';
import { useTranslation } from 'react-i18next';
import { LegalModal, type LegalDocumentType } from '../../legal/LegalModal';
import styles from './ConsentCheckboxes.module.css';

interface ConsentCheckboxesProps {
    ageConsent: boolean;
    termsConsent: boolean;
    productUpdates: boolean;
    disabled: boolean;
    onAgeConsentChange: (checked: boolean) => void;
    onTermsConsentChange: (checked: boolean) => void;
    onProductUpdatesChange: (checked: boolean) => void;
    legalModal: LegalDocumentType | null;
    onOpenLegalModal: (type: LegalDocumentType) => void;
    onCloseLegalModal: () => void;
}

export const ConsentCheckboxes: React.FC<ConsentCheckboxesProps> = ({
    ageConsent,
    termsConsent,
    productUpdates,
    disabled,
    onAgeConsentChange,
    onTermsConsentChange,
    onProductUpdatesChange,
    legalModal,
    onOpenLegalModal,
    onCloseLegalModal,
}) => {
    const { t } = useTranslation();

    return (
        <>
            <div className={styles.consentCheckboxes}>
                <label className={styles.consentLabel} data-testid="age-consent-label">
                    <input
                        type="checkbox"
                        checked={ageConsent}
                        onChange={(e) => onAgeConsentChange(e.target.checked)}
                        disabled={disabled}
                        data-testid="age-consent-checkbox"
                    />
                    <span>{t('account_creation.age_consent', 'I am 18 years or older and I am creating this account as a parent or guardian for my child.')}</span>
                </label>

                <label className={styles.consentLabel} data-testid="terms-consent-label">
                    <input
                        type="checkbox"
                        checked={termsConsent}
                        onChange={(e) => onTermsConsentChange(e.target.checked)}
                        disabled={disabled}
                        data-testid="terms-consent-checkbox"
                    />
                    <span>
                        {t('account_creation.terms_consent_prefix', 'I agree to the')}{' '}
                        <button
                            type="button"
                            className={styles.consentLink}
                            onClick={() => onOpenLegalModal('terms')}
                            data-testid="terms-link"
                        >
                            {t('legal.terms_of_service', 'Terms of Service')}
                        </button>
                        {' '}{t('account_creation.terms_consent_and', 'and')}{' '}
                        <button
                            type="button"
                            className={styles.consentLink}
                            onClick={() => onOpenLegalModal('privacy')}
                            data-testid="privacy-link"
                        >
                            {t('legal.privacy_policy', 'Privacy Policy')}
                        </button>.
                    </span>
                </label>

                <label className={`${styles.consentLabel} ${styles.consentLabelOptional}`} data-testid="product-updates-label">
                    <input
                        type="checkbox"
                        checked={productUpdates}
                        onChange={(e) => onProductUpdatesChange(e.target.checked)}
                        disabled={disabled}
                        data-testid="product-updates-checkbox"
                    />
                    <span>{t('account_creation.product_updates', 'Notify me about new adventures and game updates. You can unsubscribe at any time.')}</span>
                </label>
            </div>

            {legalModal && (
                <LegalModal type={legalModal} onClose={onCloseLegalModal} onOpenPrivacy={() => onOpenLegalModal('privacy')} />
            )}
        </>
    );
};
