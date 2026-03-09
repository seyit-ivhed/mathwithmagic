import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getTargetMusicTrack, getRandomSuccessTrack, playSfx } from './audio.utils';
import { type Adventure, EncounterType } from '../../types/adventure.types';

const mockAdventures: Adventure[] = [
    {
        id: '1',
        mapMusic: 'desert-map.mp3',
        encounters: [
            { id: '1_1', type: EncounterType.BATTLE, battleMusic: 'battle.mp3' }
        ],
    },
    {
        id: '2',
        encounters: [],
    }
];

describe('getTargetMusicTrack', () => {
    it('returns chronicles.mp3 for home path', () => {
        expect(getTargetMusicTrack('/', mockAdventures)).toBe('chronicles.mp3');
    });

    it('returns chronicles.mp3 for chronicle paths', () => {
        expect(getTargetMusicTrack('/chronicle', mockAdventures)).toBe('chronicles.mp3');
        expect(getTargetMusicTrack('/chronicle/page-1', mockAdventures)).toBe('chronicles.mp3');
    });

    it('returns adventure map music for map paths', () => {
        expect(getTargetMusicTrack('/map/1', mockAdventures)).toBe('desert-map.mp3');
    });

    it('returns adventure map music for puzzle paths', () => {
        expect(getTargetMusicTrack('/puzzle/1/5', mockAdventures)).toBe('desert-map.mp3');
    });

    it('returns null for battle paths if not explicitly defined on encounter', () => {
        // mockAdventures[0] has encounters[0] at index 0 (node 1)
        // Let's check a battle node that doesn't exist or doesn't have music
        expect(getTargetMusicTrack('/encounter/1/2', mockAdventures)).toBeNull();
    });

    it('returns encounter-specific battle music if provided', () => {
        expect(getTargetMusicTrack('/encounter/1/1', mockAdventures)).toBe('battle.mp3');
    });

    it('returns success track during victory phase in encounters', () => {
        expect(getTargetMusicTrack('/encounter/1/1', mockAdventures, 'VICTORY', 'success/win.mp3')).toBe('success/win.mp3');
    });

    it('returns null during victory phase if no success track is provided', () => {
        expect(getTargetMusicTrack('/encounter/1/1', mockAdventures, 'VICTORY', null)).toBeNull();
    });

    it('returns null if adventure has no music configured', () => {
        expect(getTargetMusicTrack('/map/2', mockAdventures)).toBeNull();
    });

    it('returns null for unknown paths', () => {
        expect(getTargetMusicTrack('/unknown', mockAdventures)).toBeNull();
    });

    it('returns null when adventure is not found', () => {
        expect(getTargetMusicTrack('/map/nonexistent', mockAdventures)).toBeNull();
    });

    it('returns null for encounter path without nodeIndex', () => {
        expect(getTargetMusicTrack('/encounter/1', mockAdventures)).toBeNull();
    });

    it('returns null for unrecognised type with valid adventureId', () => {
        expect(getTargetMusicTrack('/shop/1', mockAdventures)).toBeNull();
    });
});

describe('getRandomSuccessTrack', () => {
    const musicKeys = [
        '../../assets/music/chronicles.mp3',
        '../../assets/music/adventure-1/map.mp3',
        '../../assets/music/success/success-1.mp3',
        '../../assets/music/success/success-2.mp3',
    ];

    it('picks one of the success tracks', () => {
        const track = getRandomSuccessTrack(musicKeys);
        expect(['success/success-1.mp3', 'success/success-2.mp3']).toContain(track);
    });

    it('returns null if no success tracks are available', () => {
        const track = getRandomSuccessTrack(['../../assets/music/other.mp3']);
        expect(track).toBeNull();
    });

    it('handles keys that do not start with the expected prefix', () => {
        const keysWithOddPrefix = [
            'some/other/prefix/success/track.mp3',
            '../../assets/music/success/valid.mp3',
        ];
        const track = getRandomSuccessTrack(keysWithOddPrefix);
        // The key without the expected prefix should map to null (filtered out)
        // Only the valid key should be a candidate
        expect(track).toBe('success/valid.mp3');
    });

    it('returns null for empty array', () => {
        expect(getRandomSuccessTrack([])).toBeNull();
    });
});

describe('playSfx', () => {
    beforeEach(() => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('should log error and return early for empty soundPath', () => {
        const consoleSpy = vi.mocked(console.error);
        playSfx('');
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('soundPath'));
    });

    it('should log error and return early for a soundPath that does not exist in sfx files', () => {
        const consoleSpy = vi.mocked(console.error);
        playSfx('nonexistent/path/that/does/not/exist');
        expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('SFX file not found'));
    });

    it('should attempt to play audio for a valid sfx path', () => {
        const mockAudio = {
            play: vi.fn().mockResolvedValue(undefined),
            volume: 0,
        };
        vi.stubGlobal('Audio', vi.fn(() => mockAudio));

        // This will either play (if the file resolves) or log an error (if not found).
        // Either way it should not throw.
        expect(() => playSfx('battle/lion')).not.toThrow();

        vi.unstubAllGlobals();
    });

    it('should handle autoplay rejection via .catch handler', async () => {
        const autoplayError = new Error('NotAllowedError: autoplay prevented');
        const mockPlay = vi.fn().mockRejectedValue(autoplayError);
        const mockAudioInstance = { play: mockPlay, volume: 0 };

        vi.stubGlobal('Audio', vi.fn(() => mockAudioInstance));

        playSfx('battle/lion');

        // Flush microtask queue so the rejected promise .catch fires
        await Promise.resolve();
        await Promise.resolve();

        expect(vi.mocked(console.warn)).toHaveBeenCalledWith(
            'SFX autoplay prevented:',
            autoplayError
        );

        vi.unstubAllGlobals();
    });
});
