/**
 * Companion Image Mappings
 * This file maps companion IDs to their sprite images for UI rendering.
 * Kept separate from data files to avoid Node.js import issues with image assets.
 */

// Unit Card Images
const amaraCardImg = [
    new URL('../assets/images/companions/Amara/unit-card/amara-0.webp', import.meta.url).href,
    new URL('../assets/images/companions/Amara/unit-card/amara-1.webp', import.meta.url).href,
    new URL('../assets/images/companions/Amara/unit-card/amara-2.webp', import.meta.url).href,
    new URL('../assets/images/companions/Amara/unit-card/amara-3.webp', import.meta.url).href,
];

const tariqCardImg = [
    new URL('../assets/images/companions/Tariq/unit-card/tariq-0.webp', import.meta.url).href,
    new URL('../assets/images/companions/Tariq/unit-card/tariq-1.webp', import.meta.url).href,
    new URL('../assets/images/companions/Tariq/unit-card/tariq-2.webp', import.meta.url).href,
    new URL('../assets/images/companions/Tariq/unit-card/tariq-3.webp', import.meta.url).href,
];

const kenjiCardImg = [
    new URL('../assets/images/companions/Kenji/unit-card/kenji-0.webp', import.meta.url).href,
    new URL('../assets/images/companions/Kenji/unit-card/kenji-1.webp', import.meta.url).href,
    new URL('../assets/images/companions/Kenji/unit-card/kenji-2.webp', import.meta.url).href,
    new URL('../assets/images/companions/Kenji/unit-card/kenji-3.webp', import.meta.url).href,
];

const zaharaCardImg = [
    new URL('../assets/images/companions/Zahara/unit-card/zahara-0.webp', import.meta.url).href,
    new URL('../assets/images/companions/Zahara/unit-card/zahara-1.webp', import.meta.url).href,
    new URL('../assets/images/companions/Zahara/unit-card/zahara-2.webp', import.meta.url).href,
    new URL('../assets/images/companions/Zahara/unit-card/zahara-3.webp', import.meta.url).href,
];

// Level Up Images
const amaraLevelUpImg = [
    new URL('../assets/images/companions/Amara/level-up/amara-0.webp', import.meta.url).href,
    new URL('../assets/images/companions/Amara/level-up/amara-1.webp', import.meta.url).href,
    new URL('../assets/images/companions/Amara/level-up/amara-2.webp', import.meta.url).href,
    new URL('../assets/images/companions/Amara/level-up/amara-3.webp', import.meta.url).href,
];

const tariqLevelUpImg = [
    new URL('../assets/images/companions/Tariq/level-up/tariq-0.webp', import.meta.url).href,
    new URL('../assets/images/companions/Tariq/level-up/tariq-1.webp', import.meta.url).href,
    new URL('../assets/images/companions/Tariq/level-up/tariq-2.webp', import.meta.url).href,
    new URL('../assets/images/companions/Tariq/level-up/tariq-3.webp', import.meta.url).href,
];

const kenjiLevelUpImg = [
    new URL('../assets/images/companions/Kenji/level-up/kenji-0.webp', import.meta.url).href,
    new URL('../assets/images/companions/Kenji/level-up/kenji-1.webp', import.meta.url).href,
    new URL('../assets/images/companions/Kenji/level-up/kenji-2.webp', import.meta.url).href,
    new URL('../assets/images/companions/Kenji/level-up/kenji-3.webp', import.meta.url).href,
];

const zaharaLevelUpImg = [
    new URL('../assets/images/companions/Zahara/level-up/zahara-0.webp', import.meta.url).href,
    new URL('../assets/images/companions/Zahara/level-up/zahara-1.webp', import.meta.url).href,
    new URL('../assets/images/companions/Zahara/level-up/zahara-2.webp', import.meta.url).href,
    new URL('../assets/images/companions/Zahara/level-up/zahara-3.webp', import.meta.url).href,
];

import { getCompanionById } from './companions.data';

const COMPANION_CARD_IMAGES: Record<string, string[]> = {
    'amara': amaraCardImg,
    'tariq': tariqCardImg,
    'kenji': kenjiCardImg,
    'zahara': zaharaCardImg,
};

const COMPANION_LEVEL_UP_IMAGES: Record<string, string[]> = {
    'amara': amaraLevelUpImg,
    'tariq': tariqLevelUpImg,
    'kenji': kenjiLevelUpImg,
    'zahara': zaharaLevelUpImg,
};

/**
 * Get unit card image (high-res) for a companion by ID and optionally level
 */
export const getCompanionCardImage = (companionId: string, level: number = 1): string | undefined => {
    const images = COMPANION_CARD_IMAGES[companionId];
    if (!images) {
        return undefined;
    }

    const data = getCompanionById(companionId);

    const evolutionIndex = data
        ? data.evolutions.filter(evo => level >= evo.atLevel).length
        : 0;

    return images[evolutionIndex] || images[images.length - 1];
};

/**
 * Get level up image (wide-res) for a companion by ID and optionally level
 */
export const getCompanionLevelUpImage = (companionId: string, level: number = 1): string | undefined => {
    const images = COMPANION_LEVEL_UP_IMAGES[companionId];
    if (!images) {
        return undefined;
    }

    const data = getCompanionById(companionId);

    const evolutionIndex = data
        ? data.evolutions.filter(evo => level >= evo.atLevel).length
        : 0;

    return images[evolutionIndex] || images[images.length - 1];
};
