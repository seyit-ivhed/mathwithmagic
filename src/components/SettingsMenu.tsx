import React, { useState } from 'react';
import { Settings } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DebugConsole } from './DebugConsole';
import { playSfx } from './audio/audio.utils';
import { Modal } from './ui/Modal';
import { LanguageSettings } from './settings/LanguageSettings';
import { SoundSettings } from './settings/SoundSettings';
import { ChangePasswordSettings } from './settings/ChangePasswordSettings';
import { useAuth } from '../hooks/useAuth';
import sectionStyles from './settings/SettingsSection.module.css';
import styles from './SettingsMenu.module.css';

const SettingsMenu: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isDebugOpen, setIsDebugOpen] = useState(false);
    const { t } = useTranslation();
    const { user } = useAuth();

    const hasAccount = !!user && !user.is_anonymous;

    const toggleMenu = () => setIsOpen(!isOpen);

    return (
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

                <div className={sectionStyles.settingsSection}>
                    <button
                        className={styles.debugButton}
                        onClick={() => { setIsDebugOpen(true); setIsOpen(false); }}
                    >
                        🛠️ {t('settings.debug_console', 'Open Debug Console')}
                    </button>
                </div>
            </Modal>

            {isDebugOpen && (
                <DebugConsole onClose={() => setIsDebugOpen(false)} />
            )}
        </div>
    );
};

export default SettingsMenu;
