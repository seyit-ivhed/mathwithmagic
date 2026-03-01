import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Settings, Volume2, VolumeX } from 'lucide-react';
import { usePlayerStore } from '../stores/player.store';
import { DebugConsole } from './DebugConsole';
import { FormCloseButton } from './ui/FormCloseButton';
import { playSfx } from './audio/audio.utils';
import styles from './SettingsMenu.module.css';

import { useTranslation } from 'react-i18next';

const SettingsMenu: React.FC = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isDebugOpen, setIsDebugOpen] = useState(false);
    const {
        language, setLanguage,
        isMuted, toggleMute,
        masterVolume, setMasterVolume,
        musicVolume, setMusicVolume,
        sfxVolume, setSfxVolume,
        voiceVolume, setVoiceVolume
    } = usePlayerStore();
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
        playSfx('interface/click');
    };

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
                            <h4 className={styles.sectionTitle}>{t('settings.sound', 'Sound')}</h4>

                            <div className={styles.soundControlRow}>
                                <label className={styles.soundLabel}>{t('settings.mute', 'Mute All Sound')}</label>
                                <button
                                    className={styles.muteBtn}
                                    onClick={() => {
                                        toggleMute();
                                        if (isMuted) playSfx('interface/click');
                                    }}
                                    aria-label={t('settings.mute', 'Mute All Sound')}
                                >
                                    {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                                </button>
                            </div>

                            <div className={styles.soundControlRow}>
                                <label className={styles.soundLabel}>{t('settings.master_volume', 'Master Volume')}</label>
                                <input
                                    type="range"
                                    min="0" max="1" step="0.05"
                                    value={masterVolume}
                                    onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
                                    className={styles.volumeSlider}
                                />
                            </div>

                            <div className={styles.soundControlRow}>
                                <label className={styles.soundLabel}>{t('settings.music_volume', 'Music Volume')}</label>
                                <input
                                    type="range"
                                    min="0" max="1" step="0.05"
                                    value={musicVolume}
                                    onChange={(e) => setMusicVolume(parseFloat(e.target.value))}
                                    className={styles.volumeSlider}
                                />
                            </div>

                            <div className={styles.soundControlRow}>
                                <label className={styles.soundLabel}>{t('settings.sfx_volume', 'SFX Volume')}</label>
                                <input
                                    type="range"
                                    min="0" max="1" step="0.05"
                                    value={sfxVolume}
                                    onChange={(e) => {
                                        setSfxVolume(parseFloat(e.target.value));
                                        playSfx('interface/click');
                                    }}
                                    className={styles.volumeSlider}
                                />
                            </div>

                            <div className={styles.soundControlRow}>
                                <label className={styles.soundLabel}>{t('settings.voice_volume', 'Voice Volume')}</label>
                                <input
                                    type="range"
                                    min="0" max="1" step="0.05"
                                    value={voiceVolume}
                                    onChange={(e) => setVoiceVolume(parseFloat(e.target.value))}
                                    className={styles.volumeSlider}
                                />
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
