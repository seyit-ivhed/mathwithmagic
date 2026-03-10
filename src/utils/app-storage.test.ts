import { describe, it, expect, beforeEach } from 'vitest';
import { clearAppStorage } from './app-storage';
import { PLAYER_STORE_KEY, GAME_STORE_KEY } from '../stores/storage-keys';

describe('clearAppStorage', () => {
    beforeEach(() => {
        localStorage.clear();
        sessionStorage.clear();
    });

    it('removes player store key from localStorage', () => {
        localStorage.setItem(PLAYER_STORE_KEY, '{"data":1}');
        clearAppStorage();
        expect(localStorage.getItem(PLAYER_STORE_KEY)).toBeNull();
    });

    it('removes game store key from localStorage', () => {
        localStorage.setItem(GAME_STORE_KEY, '{"state":true}');
        clearAppStorage();
        expect(localStorage.getItem(GAME_STORE_KEY)).toBeNull();
    });

    it('removes supabase auth token keys from localStorage', () => {
        localStorage.setItem('sb-abcdefgh-auth-token', 'token-value');
        localStorage.setItem('sb-xyz123-auth-token', 'token-value-2');
        clearAppStorage();
        expect(localStorage.getItem('sb-abcdefgh-auth-token')).toBeNull();
        expect(localStorage.getItem('sb-xyz123-auth-token')).toBeNull();
    });

    it('also removes non-auth localStorage keys', () => {
        localStorage.setItem('other-key', 'keep-me');
        clearAppStorage();
        expect(localStorage.getItem('other-key')).toBeNull();
    });

    it('removes play_session_id from sessionStorage', () => {
        sessionStorage.setItem('play_session_id', 'session-abc');
        clearAppStorage();
        expect(sessionStorage.getItem('play_session_id')).toBeNull();
    });

    it('removes attribution from sessionStorage', () => {
        sessionStorage.setItem('attribution', 'google');
        clearAppStorage();
        expect(sessionStorage.getItem('attribution')).toBeNull();
    });

    it('also removes non-app sessionStorage keys', () => {
        sessionStorage.setItem('unrelated', 'keep-me');
        clearAppStorage();
        expect(sessionStorage.getItem('unrelated')).toBeNull();
    });
});
