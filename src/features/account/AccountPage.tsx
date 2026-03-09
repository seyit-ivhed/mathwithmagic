import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';
import { useAuth } from '../../context/useAuth';
import { Header } from '../../components/Header';
import { ChangePasswordSettings } from '../../components/settings/ChangePasswordSettings';
import { DeleteAccountSettings } from '../../components/settings/DeleteAccountSettings';
import { MarketingPreferencesSettings } from './MarketingPreferencesSettings';
import { LegalModal, type LegalDocumentType } from '../legal/LegalModal';
import sectionStyles from '../../components/settings/SettingsSection.module.css';
import styles from './AccountPage.module.css';

export const AccountPage: React.FC = () => {
    const { t } = useTranslation();
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [legalModal, setLegalModal] = useState<LegalDocumentType | null>(null);

    if (!isAuthenticated) {
        return <Navigate to="/chronicle" replace />;
    }

    return (
        <>
            <Header />
            <div className={styles.wrapper} data-testid="account-page">
                <div className={styles.card}>
                    <header className={styles.pageHeader}>
                        <button
                            className={styles.backButton}
                            onClick={() => navigate(-1)}
                            aria-label={t('common.back', 'Back')}
                            data-testid="account-page-back-btn"
                        >
                            <ChevronLeft size={20} />
                            {t('common.back', 'Back')}
                        </button>
                        <h2 className={styles.pageTitle} data-testid="account-page-title">
                            {t('account.title', 'Account')}
                        </h2>
                        <div className={styles.divider} />
                    </header>

                    <div className={styles.sections}>
                        <ChangePasswordSettings />

                        <MarketingPreferencesSettings />

                        <div className={sectionStyles.settingsSection} data-testid="legal-settings">
                            <h4 className={sectionStyles.sectionTitle}>
                                {t('legal.section_title', 'Legal')}
                            </h4>
                            <div className={styles.legalLinkGroup}>
                                <button
                                    className={styles.legalLink}
                                    onClick={() => setLegalModal('privacy')}
                                    data-testid="settings-privacy-link"
                                >
                                    {t('legal.privacy_policy', 'Privacy Policy')}
                                </button>
                                <button
                                    className={styles.legalLink}
                                    onClick={() => setLegalModal('terms')}
                                    data-testid="settings-terms-link"
                                >
                                    {t('legal.terms_of_service', 'Terms of Service')}
                                </button>
                            </div>
                        </div>

                        <DeleteAccountSettings />
                    </div>
                </div>
            </div>

            {legalModal && (
                <LegalModal
                    type={legalModal}
                    onClose={() => setLegalModal(null)}
                    onOpenPrivacy={() => setLegalModal('privacy')}
                />
            )}
        </>
    );
};
