import { useEffect, useMemo, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { usePlayerStore } from '../../stores/player.store';
import { ADVENTURES } from '../../data/adventures.data';
import { getRandomSuccessTrack, getTargetMusicTrack } from './audio.utils';
import { useEncounterStore } from '../../stores/encounter/store';
import { EncounterPhase } from '../../types/encounter.types';

const musicFiles = import.meta.glob<string>('../../assets/music/**/*.mp3', {
    query: '?url',
    import: 'default'
});

const MUSIC_FILE_KEYS = Object.keys(musicFiles);

const resolveMusicUrl = async (filename: string): Promise<string> => {
    const key = `../../assets/music/${filename}`;
    const loader = musicFiles[key];
    if (!loader) {
        console.error(`Music file not found: ${filename}`);
        return '';
    }
    return await loader();
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
        if (!audioRef.current) {
            return;
        }

        // Only act if the track actually changes
        if (targetFilename === currentTrackRef.current) {
            return;
        }

        currentTrackRef.current = targetFilename;

        if (!targetFilename) {
            audioRef.current.pause();
            audioRef.current.src = '';
            return;
        }

        let cancelled = false;

        resolveMusicUrl(targetFilename).then(url => {
            if (cancelled || !audioRef.current || !url) {
                return;
            }
            audioRef.current.src = url;
            audioRef.current.play().catch(e => {
                console.info("Autoplay blocked, waiting for user interaction.", e);
            });
        }).catch(e => {
            console.error("Failed to load music track:", e);
        });

        return () => {
            cancelled = true;
            currentTrackRef.current = null;
        };
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
