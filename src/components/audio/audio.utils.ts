import { type Adventure } from '../../types/adventure.types';
import { usePlayerStore } from '../../stores/player.store';

const sfxFiles = import.meta.glob('../../assets/sfx/**/*.mp3', {
    eager: true,
    query: '?url',
    import: 'default'
}) as Record<string, string>;

const getSfxUrl = (soundPath: string): string | null => {
    const key = `../../assets/sfx/${soundPath}.mp3`;
    return sfxFiles[key] || null;
};

/**
 * Determines which background music track should play based on the current pathname and state.
 */
export const getTargetMusicTrack = (
    pathname: string,
    adventures: Adventure[],
    phase?: string,
    successTrack?: string | null
): string | null => {
    if (pathname === '/' || pathname.startsWith('/chronicle')) {
        return 'chronicles.mp3';
    }

    const segments = pathname.split('/').filter(Boolean);
    if (segments.length < 2) {
        return null;
    }

    const [type, adventureId, nodeIndex] = segments;

    // Handle Victory music for battle encounters
    if (type === 'encounter' && phase === 'VICTORY') {
        return successTrack || null;
    }

    const adventure = adventures.find(a => a.id === adventureId);
    if (!adventure) {
        return null;
    }

    // Map and Puzzle sharing music for continuity
    if (type === 'map' || type === 'puzzle') {
        return adventure.mapMusic || null;
    }

    // Battle encounter music
    if (type === 'encounter' && nodeIndex) {
        const index = parseInt(nodeIndex, 10) - 1;
        const encounter = adventure.encounters[index];
        return encounter?.battleMusic || null;
    }

    return null;
};

/**
 * Selection of a random success track from available music files.
 */
export const getRandomSuccessTrack = (musicFileKeys: string[]): string | null => {
    const prefix = '../../assets/music/';
    const successPattern = '/success/';

    const availableSuccessTracks = musicFileKeys
        .filter(key => key.includes(successPattern))
        .map(key => {
            if (key.startsWith(prefix)) {
                return key.slice(prefix.length);
            }
            return null;
        })
        .filter(Boolean) as string[];

    if (availableSuccessTracks.length === 0) {
        return null;
    }

    return availableSuccessTracks[Math.floor(Math.random() * availableSuccessTracks.length)];
};

/**
 * Plays a sound effect taking into account the user's volume and mute settings.
 * @param soundPath relative path inside src/assets/sfx/ without the .mp3 extension
 */
export const playSfx = (soundPath: string) => {
    if (typeof soundPath !== 'string' || !soundPath) {
        console.error('Invalid or missing soundPath provided to playSfx');
        return;
    }

    const url = getSfxUrl(soundPath);
    if (!url) {
        console.error(`SFX file not found for path: ${soundPath}`);
        return;
    }

    const { masterVolume, sfxVolume } = usePlayerStore.getState();

    try {
        const audio = new Audio(url);
        audio.volume = masterVolume * sfxVolume;
        audio.play().catch(e => console.warn('SFX autoplay prevented:', e));
    } catch (e) {
        console.warn('SFX initialization failed:', e);
    }
};
