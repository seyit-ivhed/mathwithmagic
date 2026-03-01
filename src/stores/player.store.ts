import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AUDIO_CONFIG } from '../config/audio.config';

interface PlayerState {

    language: 'en' | 'sv';

    // Audio State
    isMuted: boolean;
    masterVolume: number; // 0.0 to 1.0
    musicVolume: number; // 0.0 to 1.0
    sfxVolume: number; // 0.0 to 1.0
    voiceVolume: number; // 0.0 to 1.0
    isVoiceOverPlaying: boolean;

    // Actions

    setLanguage: (lang: 'en' | 'sv') => void;
    toggleMute: () => void;
    setMasterVolume: (volume: number) => void;
    setMusicVolume: (volume: number) => void;
    setSfxVolume: (volume: number) => void;
    setVoiceVolume: (volume: number) => void;
    setVoiceOverPlaying: (isPlaying: boolean) => void;
}

export const usePlayerStore = create<PlayerState>()(
    persist(
        (set) => ({

            language: 'en',

            isMuted: AUDIO_CONFIG.DEFAULT_IS_MUTED,
            masterVolume: AUDIO_CONFIG.DEFAULT_MASTER_VOLUME,
            musicVolume: AUDIO_CONFIG.DEFAULT_MUSIC_VOLUME,
            sfxVolume: AUDIO_CONFIG.DEFAULT_SFX_VOLUME,
            voiceVolume: AUDIO_CONFIG.DEFAULT_VOICE_VOLUME,
            isVoiceOverPlaying: false,

            setLanguage: (language) => set({ language }),
            toggleMute: () => set((state) => ({ isMuted: !state.isMuted })),
            setMasterVolume: (volume) => set({ masterVolume: Math.max(0, Math.min(1, volume)) }),
            setMusicVolume: (volume) => set({ musicVolume: Math.max(0, Math.min(1, volume)) }),
            setSfxVolume: (volume) => set({ sfxVolume: Math.max(0, Math.min(1, volume)) }),
            setVoiceVolume: (volume) => set({ voiceVolume: Math.max(0, Math.min(1, volume)) }),
            setVoiceOverPlaying: (isPlaying) => set({ isVoiceOverPlaying: isPlaying }),
        }),
        {
            name: 'space-math-player-storage',
            partialize: (state) => ({
                language: state.language,
                isMuted: state.isMuted,
                masterVolume: state.masterVolume,
                musicVolume: state.musicVolume,
                sfxVolume: state.sfxVolume,
                voiceVolume: state.voiceVolume,
            }),
        }
    )
);
