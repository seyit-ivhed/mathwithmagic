import { useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { usePlayerStore } from '../../stores/player.store';
import { ADVENTURES } from '../../data/adventures.data';
import { getRandomSuccessTrack, getTargetMusicTrack } from './audio.utils';
import { useEncounterStore } from '../../stores/encounter/store';
import { EncounterPhase } from '../../types/encounter.types';

const musicFiles = import.meta.glob('../../assets/music/**/*.mp3', {
    eager: true,
    query: '?url',
    import: 'default'
}) as Record<string, string>;

const MUSIC_FILE_KEYS = Object.keys(musicFiles);

const getMusicUrl = (filename: string) => {
    const key = `../../assets/music/${filename}`;
    return musicFiles[key] || '';
};

export const BackgroundMusic = () => {
    const location = useLocation();
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const { masterVolume, musicVolume, isVoiceOverPlaying } = usePlayerStore();
    const { phase } = useEncounterStore();

    // Use useRef to track the currently playing file without causing re-renders
    const currentTrackRef = useRef<string | null>(null);

    const isVictoryEncounter = location.pathname.startsWith('/encounter') && phase === EncounterPhase.VICTORY;

    // Stable selection of victory music
    const victoryTrack = useMemo(() => {
        if (isVictoryEncounter) {
            return getRandomSuccessTrack(MUSIC_FILE_KEYS);
        }
        return null;
    }, [isVictoryEncounter]);

    const targetFilename = getTargetMusicTrack(
        location.pathname,
        ADVENTURES,
        phase,
        victoryTrack
    );

    useEffect(() => {
        if (!audioRef.current) return;

        // Only act if the track actually changes
        if (targetFilename !== currentTrackRef.current) {
            currentTrackRef.current = targetFilename;

            if (targetFilename) {
                const url = getMusicUrl(targetFilename);
                audioRef.current.src = url;

                audioRef.current.play().catch(e => {
                    console.info("Autoplay blocked, waiting for user interaction.", e);
                });
            } else {
                audioRef.current.pause();
                audioRef.current.src = '';
            }
        }
    }, [targetFilename]);

    // Volume control effect
    useEffect(() => {
        if (audioRef.current) {
            const baseVolume = masterVolume * musicVolume;
            audioRef.current.volume = isVoiceOverPlaying ? baseVolume * 0.25 : baseVolume;
        }
    }, [masterVolume, musicVolume, isVoiceOverPlaying]);

    // Global interaction listener to retry playback if blocked
    useEffect(() => {
        const handleInteraction = () => {
            if (audioRef.current && audioRef.current.paused && currentTrackRef.current) {
                audioRef.current.play().catch(e => console.error("Failed to play on interaction:", e));
            }
        };

        window.addEventListener('click', handleInteraction);
        window.addEventListener('touchstart', handleInteraction);
        window.addEventListener('keydown', handleInteraction);

        return () => {
            window.removeEventListener('click', handleInteraction);
            window.removeEventListener('touchstart', handleInteraction);
            window.removeEventListener('keydown', handleInteraction);
        };
    }, []);

    return (
        <audio
            ref={audioRef}
            loop
            preload="auto"
        />
    );
};
