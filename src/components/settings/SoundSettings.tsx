import React from 'react';
import { useTranslation } from 'react-i18next';
import { usePlayerStore } from '../../stores/player.store';
import { playSfx } from '../audio/audio.utils';
import { VolumeSlider } from '../ui/VolumeSlider';
import styles from './SoundSettings.module.css';

export const SoundSettings: React.FC = () => {
    const { t } = useTranslation();
    const masterVolume = usePlayerStore((state) => state.masterVolume);
    const setMasterVolume = usePlayerStore((state) => state.setMasterVolume);
    const musicVolume = usePlayerStore((state) => state.musicVolume);
    const setMusicVolume = usePlayerStore((state) => state.setMusicVolume);
    const sfxVolume = usePlayerStore((state) => state.sfxVolume);
    const setSfxVolume = usePlayerStore((state) => state.setSfxVolume);
    const voiceVolume = usePlayerStore((state) => state.voiceVolume);
    const setVoiceVolume = usePlayerStore((state) => state.setVoiceVolume);

    return (
        <div className={styles.settingsSection}>
            <h4 className={styles.sectionTitle}>{t('settings.sound', 'Sound')}</h4>

            <VolumeSlider
                label={t('settings.master_volume', 'Master Volume')}
                value={masterVolume}
                onChange={setMasterVolume}
            />

            <VolumeSlider
                label={t('settings.music_volume', 'Music Volume')}
                value={musicVolume}
                onChange={setMusicVolume}
            />

            <VolumeSlider
                label={t('settings.sfx_volume', 'SFX Volume')}
                value={sfxVolume}
                onChange={setSfxVolume}
                onMouseUp={() => playSfx('interface/click')}
            />

            <VolumeSlider
                label={t('settings.voice_volume', 'Voice Volume')}
                value={voiceVolume}
                onChange={setVoiceVolume}
            />
        </div>
    );
};
