import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Settings } from 'lucide-react';
import { usePlayerStore } from '../stores/player.store';
import { DebugConsole } from './DebugConsole';
import { FormCloseButton } from './ui/FormCloseButton';
import styles from './SettingsMenu.module.css';

import { useTranslation } from 'react-i18next';

const SettingsMenu: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isDebugOpen, setIsDebugOpen] = useState(false);
    const { language, setLanguage } = usePlayerStore();
    const { i18n, t } = useTranslation();
    const modalRef = useRef<HTMLDivElement>(null);

    // Sync language on mount/change
    useEffect(() => {
        if (i18n.language !== language) {
            i18n.changeLanguage(language);
        }
    }, [language, i18n]);

    // Close menu when clicking outside modal content
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (isOpen && modalRef.current && !modalRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const toggleMenu = () => setIsOpen(!isOpen);

    const handleLanguageChange = (lang: 'en' | 'sv') => {
        setLanguage(lang);
        i18n.changeLanguage(lang);
    };

    return (
        <div className={styles.settingsContainer}>
            <button
                className={styles.settingsTrigger}
                onClick={toggleMenu}
                aria-label={t('settings.title', 'Settings')}
                data-testid="settings-button"
            >
                <Settings size={32} />
            </button>

            {isOpen && createPortal(
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent} ref={modalRef} data-testid="settings-menu">
                        <FormCloseButton onClick={() => setIsOpen(false)} size={32} />

                        <h2 className={styles.modalTitle}>
                            {t('settings.title', 'Settings')}
                        </h2>

                        <div className={styles.settingsSection}>
                            <h4 className={styles.sectionTitle}>{t('settings.language', 'Language')}</h4>
                            <div className={styles.languageToggle}>
                                <button
                                    className={`${styles.langBtn} ${language === 'en' ? styles.langBtnActive : ''}`}
                                    onClick={() => handleLanguageChange('en')}
                                >
                                    🇬🇧 EN
                                </button>
                                <button
                                    className={`${styles.langBtn} ${language === 'sv' ? styles.langBtnActive : ''}`}
                                    onClick={() => handleLanguageChange('sv')}
                                >
                                    🇸🇪 SV
                                </button>
                            </div>
                        </div>

                        <div className={styles.settingsSection}>
                            <button
                                className={styles.debugButton}
                                onClick={() => { setIsDebugOpen(true); setIsOpen(false); }}
                            >
                                🛠️ {t('settings.debug_console', 'Open Debug Console')}
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}

            {isDebugOpen && (
                <DebugConsole onClose={() => setIsDebugOpen(false)} />
            )}
        </div>
    );
};

export default SettingsMenu;
