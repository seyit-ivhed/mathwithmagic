import React from 'react';
import { useTranslation } from 'react-i18next';
import { Volume2, VolumeX } from 'lucide-react';
import { usePlayerStore } from '../../stores/player.store';
import { playSfx } from '../audio/audio.utils';
import { VolumeSlider } from '../ui/VolumeSlider';
import styles from './SoundSettings.module.css';

export const SoundSettings: React.FC = () => {
    const { t } = useTranslation();
    const isMuted = usePlayerStore((state) => state.isMuted);
    const toggleMute = usePlayerStore((state) => state.toggleMute);
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

            <div className={styles.soundControlRow}>
                <label className={styles.soundLabel}>{t('settings.mute', 'Mute All Sound')}</label>
                <button
                    className={styles.muteBtn}
                    onClick={() => {
                        toggleMute();
                        if (!isMuted) playSfx('interface/click');
                    }}
                    aria-label={t('settings.mute', 'Mute All Sound')}
                >
                    {isMuted ? <VolumeX size={24} /> : <Volume2 size={24} />}
                </button>
            </div>

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
