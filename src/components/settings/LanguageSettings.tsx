import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { usePlayerStore } from '../../stores/player.store';
import { playSfx } from '../audio/audio.utils';
import sectionStyles from './SettingsSection.module.css';
import styles from './LanguageSettings.module.css';

export const LanguageSettings: React.FC = () => {
    const { i18n, t } = useTranslation();
    const language = usePlayerStore((state) => state.language);
    const setLanguage = usePlayerStore((state) => state.setLanguage);

    useEffect(() => {
        if (i18n.language !== language) {
            i18n.changeLanguage(language);
        }
    }, [language, i18n]);

    const handleLanguageChange = (lang: 'en' | 'sv') => {
        setLanguage(lang);
        i18n.changeLanguage(lang);
        playSfx('interface/click');
    };

    return (
        <div className={sectionStyles.settingsSection}>
            <h4 className={sectionStyles.sectionTitle}>{t('settings.language', 'Language')}</h4>
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
    );
};
