import type { Adventure } from '../../../types/adventure.types';

export const resolveCurrentAdventureIndex = (adventures: Adventure[], adventureId?: string): number => {
    const idx = adventures.findIndex(a => a.id === adventureId);
    return idx !== -1 ? idx : 0;
};

export const getBookStateFromUrl = (pageId?: string): 'COVER' | 'LOGIN' | 'LOGIN_SUCCESS' | 'FORGOT_PASSWORD' | 'DIFFICULTY' | 'ADVENTURE' => {
    if (!pageId || pageId === 'cover') {
        return 'COVER';
    }
    if (pageId === 'login') {
        return 'LOGIN';
    }
    if (pageId === 'login-success') {
        return 'LOGIN_SUCCESS';
    }
    if (pageId === 'forgot-password') {
        return 'FORGOT_PASSWORD';
    }
    if (pageId === 'difficulty') {
        return 'DIFFICULTY';
    }
    if (!isNaN(Number(pageId))) {
        return 'ADVENTURE';
    }
    return 'COVER';
};

export const calculatePageZIndex = (state: 'active' | 'flipped' | 'upcoming', position: number): number => {
    if (state === 'active') {
        return 100;
    }
    if (state === 'flipped') {
        // Most recently flipped (highest position) should be on top of left stack.
        return 10 + position;
    }
    // Next up in line (lowest position) should be on top of right stack.
    return 50 - position;
};
