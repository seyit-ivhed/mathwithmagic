import React, { useState } from 'react';
import { Settings, UserCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { playSfx } from './audio/audio.utils';
import { Modal } from './ui/Modal';
import { LanguageSettings } from './settings/LanguageSettings';
import { SoundSettings } from './settings/SoundSettings';
import { useAuth } from '../context/useAuth';
import styles from './SettingsMenu.module.css';
import sectionStyles from './settings/SettingsSection.module.css';

const SettingsMenu: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const { t } = useTranslation();
    const { isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const toggleMenu = () => setIsOpen(!isOpen);

    const handleAccountClick = () => {
        setIsOpen(false);
        navigate('/account');
    };

    return (
        <div>
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

                {isAuthenticated && (
                    <div className={sectionStyles.settingsSection}>
                        <button
                            className={styles.accountButton}
                            onClick={handleAccountClick}
                            data-testid="settings-account-btn"
                        >
                            <UserCircle size={18} />
                            {t('account.manage_account_btn', 'Account')}
                        </button>
                    </div>
                )}
            </Modal>
        </div>
    );
};

export default SettingsMenu;
