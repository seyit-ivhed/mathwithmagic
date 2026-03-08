import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usePlayerStore } from './player.store';
import { AUDIO_CONFIG } from '../config/audio.config';

describe('Player Store', () => {
    beforeEach(() => {
        usePlayerStore.setState({
            language: 'en',
            masterVolume: AUDIO_CONFIG.DEFAULT_MASTER_VOLUME,
            musicVolume: AUDIO_CONFIG.DEFAULT_MUSIC_VOLUME,
            sfxVolume: AUDIO_CONFIG.DEFAULT_SFX_VOLUME,
            voiceVolume: AUDIO_CONFIG.DEFAULT_VOICE_VOLUME,
            isVoiceOverPlaying: false,
        });
    });

    it('should initialize with default state', () => {
        const state = usePlayerStore.getState();
        expect(state.language).toBe('en');
        expect(state.masterVolume).toBe(AUDIO_CONFIG.DEFAULT_MASTER_VOLUME);
        expect(state.musicVolume).toBe(AUDIO_CONFIG.DEFAULT_MUSIC_VOLUME);
        expect(state.sfxVolume).toBe(AUDIO_CONFIG.DEFAULT_SFX_VOLUME);
        expect(state.voiceVolume).toBe(AUDIO_CONFIG.DEFAULT_VOICE_VOLUME);
        expect(state.isVoiceOverPlaying).toBe(false);
    });

    it('should update language', () => {
        const store = usePlayerStore.getState();
        store.setLanguage('sv');
        expect(usePlayerStore.getState().language).toBe('sv');
    });

    describe('setMasterVolume', () => {
        it('should set valid master volume', () => {
            usePlayerStore.getState().setMasterVolume(0.5);
            expect(usePlayerStore.getState().masterVolume).toBe(0.5);
        });

        it('should clamp master volume below 0 to 0', () => {
            usePlayerStore.getState().setMasterVolume(-0.5);
            expect(usePlayerStore.getState().masterVolume).toBe(0);
        });

        it('should clamp master volume above 1 to 1', () => {
            usePlayerStore.getState().setMasterVolume(1.5);
            expect(usePlayerStore.getState().masterVolume).toBe(1);
        });

        it('should log error and not update for non-number input', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            const before = usePlayerStore.getState().masterVolume;
            // @ts-expect-error testing invalid input
            usePlayerStore.getState().setMasterVolume('loud');
            expect(usePlayerStore.getState().masterVolume).toBe(before);
            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('setMasterVolume'));
            consoleSpy.mockRestore();
        });
    });

    describe('setMusicVolume', () => {
        it('should set valid music volume', () => {
            usePlayerStore.getState().setMusicVolume(0.4);
            expect(usePlayerStore.getState().musicVolume).toBe(0.4);
        });

        it('should clamp music volume to [0, 1]', () => {
            usePlayerStore.getState().setMusicVolume(-1);
            expect(usePlayerStore.getState().musicVolume).toBe(0);
            usePlayerStore.getState().setMusicVolume(2);
            expect(usePlayerStore.getState().musicVolume).toBe(1);
        });

        it('should log error for non-number input', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            const before = usePlayerStore.getState().musicVolume;
            // @ts-expect-error testing invalid input
            usePlayerStore.getState().setMusicVolume(null);
            expect(usePlayerStore.getState().musicVolume).toBe(before);
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe('setSfxVolume', () => {
        it('should set valid sfx volume', () => {
            usePlayerStore.getState().setSfxVolume(0.6);
            expect(usePlayerStore.getState().sfxVolume).toBe(0.6);
        });

        it('should clamp sfx volume to [0, 1]', () => {
            usePlayerStore.getState().setSfxVolume(-0.1);
            expect(usePlayerStore.getState().sfxVolume).toBe(0);
            usePlayerStore.getState().setSfxVolume(1.1);
            expect(usePlayerStore.getState().sfxVolume).toBe(1);
        });

        it('should log error for non-number input', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            const before = usePlayerStore.getState().sfxVolume;
            // @ts-expect-error testing invalid input
            usePlayerStore.getState().setSfxVolume(undefined);
            expect(usePlayerStore.getState().sfxVolume).toBe(before);
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe('setVoiceVolume', () => {
        it('should set valid voice volume', () => {
            usePlayerStore.getState().setVoiceVolume(0.7);
            expect(usePlayerStore.getState().voiceVolume).toBe(0.7);
        });

        it('should clamp voice volume to [0, 1]', () => {
            usePlayerStore.getState().setVoiceVolume(-0.2);
            expect(usePlayerStore.getState().voiceVolume).toBe(0);
            usePlayerStore.getState().setVoiceVolume(1.2);
            expect(usePlayerStore.getState().voiceVolume).toBe(1);
        });

        it('should log error for non-number input', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            const before = usePlayerStore.getState().voiceVolume;
            // @ts-expect-error testing invalid input
            usePlayerStore.getState().setVoiceVolume('max');
            expect(usePlayerStore.getState().voiceVolume).toBe(before);
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe('setVoiceOverPlaying', () => {
        it('should set isVoiceOverPlaying to true', () => {
            usePlayerStore.getState().setVoiceOverPlaying(true);
            expect(usePlayerStore.getState().isVoiceOverPlaying).toBe(true);
        });

        it('should set isVoiceOverPlaying to false', () => {
            usePlayerStore.setState({ isVoiceOverPlaying: true });
            usePlayerStore.getState().setVoiceOverPlaying(false);
            expect(usePlayerStore.getState().isVoiceOverPlaying).toBe(false);
        });

        it('should log error for non-boolean input', () => {
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
            const before = usePlayerStore.getState().isVoiceOverPlaying;
            // @ts-expect-error testing invalid input
            usePlayerStore.getState().setVoiceOverPlaying('yes');
            expect(usePlayerStore.getState().isVoiceOverPlaying).toBe(before);
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });
});
