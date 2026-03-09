import { PLAYER_STORE_KEY, GAME_STORE_KEY } from '../stores/storage-keys';

const SESSION_STORAGE_KEYS = ['play_session_id', 'attribution'] as const;

export function clearAppStorage(): void {
    localStorage.removeItem(PLAYER_STORE_KEY);
    localStorage.removeItem(GAME_STORE_KEY);

    for (const key of Object.keys(localStorage)) {
        if (key.startsWith('sb-') && key.endsWith('-auth-token')) {
            localStorage.removeItem(key);
        }
    }

    for (const key of SESSION_STORAGE_KEYS) {
        sessionStorage.removeItem(key);
    }
}
