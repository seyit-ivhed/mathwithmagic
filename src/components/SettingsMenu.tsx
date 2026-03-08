import React, { useState } from 'react';
import { Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { playSfx } from './audio/audio.utils';
import { Modal } from './ui/Modal';
import { LanguageSettings } from './settings/LanguageSettings';
import { SoundSettings } from './settings/SoundSettings';
import { ChangePasswordSettings } from './settings/ChangePasswordSettings';
import { DeleteAccountSettings } from './settings/DeleteAccountSettings';
import { useAuth } from '../hooks/useAuth';
import { LegalModal, type LegalDocumentType } from '../features/legal/LegalModal';
import styles from './SettingsMenu.module.css';
import sectionStyles from './settings/SettingsSection.module.css';

const SettingsMenu: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [legalModal, setLegalModal] = useState<LegalDocumentType | null>(null);
    const { t } = useTranslation();
    const { user } = useAuth();

    const hasAccount = !!user && !user.is_anonymous;

    const toggleMenu = () => setIsOpen(!isOpen);

    return (
        <>
            <div className={styles.settingsContainer}>
                <button
                    className={styles.settingsTrigger}
                    onClick={() => {
                        playSfx('interface/click');
                        toggleMenu();
                    }}
                    aria-label={t('settings.title', 'Settings')}
                    data-testid="settings-button"
                >
                    <Settings size={32} />
                </button>

                <Modal
                    isOpen={isOpen}
                    onClose={() => setIsOpen(false)}
                    title={t('settings.title', 'Settings')}
                    testId="settings-menu"
                >
                    <LanguageSettings />

                    <SoundSettings />

                    {hasAccount && <ChangePasswordSettings />}

                    <div className={sectionStyles.settingsSection} data-testid="legal-settings">
                        <h4 className={sectionStyles.sectionTitle}>
                            {t('legal.section_title', 'Legal')}
                        </h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
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

                    {hasAccount && <DeleteAccountSettings />}
                </Modal>
            </div>

            {legalModal && (
                <LegalModal type={legalModal} onClose={() => setLegalModal(null)} />
            )}
        </>
    );
};

export default SettingsMenu;
