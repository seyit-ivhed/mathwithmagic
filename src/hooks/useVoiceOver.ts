import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useAudioStore } from '../stores/audio.store';
import { useShallow } from 'zustand/react/shallow';

const voiceOverMap = import.meta.glob<string>('/src/assets/voice/**/*.mp3', {
    import: 'default'
});

const resolveVoiceOverUrl = async (language: string, category: string, filename: string): Promise<string | null> => {
    const pathSuffix = `/voice/${language}/${category}/${filename}.mp3`;
    const moduleKey = Object.keys(voiceOverMap).find(key => key.endsWith(pathSuffix));

    if (!moduleKey) {
        console.warn(`Voiceover file not found for ${pathSuffix}`);
        return null;
    }

    const url = await voiceOverMap[moduleKey]();
    return url;
};

export const useVoiceOver = (category: string, filename: string) => {
    const { i18n } = useTranslation();
    const { setVoiceOverPlaying } = useAudioStore();
    const { volume, isMuted } = useAudioStore(useShallow(s => ({ volume: s.volume, isMuted: s.isMuted })));
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        if (!category) {
            console.error('useVoiceOver: category is required');
            return;
        }

        if (!filename) {
            setVoiceOverPlaying(false);
            return;
        }

        let cancelled = false;

        const playAudio = async () => {
            const audioUrl = await resolveVoiceOverUrl(i18n.language, category, filename);

            if (cancelled || !audioUrl) {
                if (!audioUrl) {
                    setVoiceOverPlaying(false);
                }
                return;
            }

            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = '';
            }

            const audio = new Audio(audioUrl);
            const store = useAudioStore.getState();
            audio.volume = store.volume;
            audio.muted = store.isMuted;

            audio.onended = () => setVoiceOverPlaying(false);
            audio.onpause = () => setVoiceOverPlaying(false);
            audio.onplay = () => setVoiceOverPlaying(true);

            audioRef.current = audio;

            audio.play().catch(e => {
                console.warn('Autoplay prevented for voiceover:', e);
                setVoiceOverPlaying(false);
            });
        };

        playAudio();

        return () => {
            cancelled = true;
            if (audioRef.current) {
                audioRef.current.pause();
                audioRef.current.src = '';
            }
            setVoiceOverPlaying(false);
        };
    }, [i18n.language, category, filename, setVoiceOverPlaying]);

    useEffect(() => {
        if (!audioRef.current) {
            return;
        }

        audioRef.current.volume = volume;
        audioRef.current.muted = isMuted;
    }, [volume, isMuted]);
};
