/**
 * Adventure Asset Mappings
 * This file maps adventure IDs to their illustrations and map images for UI rendering.
 * Kept separate from data files to avoid Node.js import issues with image assets.
 */

const chapter1Illustration = new URL('../assets/images/chapters/chapter-1.webp', import.meta.url).href;
const chapter2Illustration = new URL('../assets/images/chapters/chapter-2.webp', import.meta.url).href;
const chapter3Illustration = new URL('../assets/images/chapters/chapter-3.webp', import.meta.url).href;
const chapter4Illustration = new URL('../assets/images/chapters/chapter-4.webp', import.meta.url).href;
const chapter5Illustration = new URL('../assets/images/chapters/chapter-5.webp', import.meta.url).href;
const chapter6Illustration = new URL('../assets/images/chapters/chapter-6.webp', import.meta.url).href;
const adventure1Map = new URL('../assets/images/maps/adventure-1.webp', import.meta.url).href;
const adventure2Map = new URL('../assets/images/maps/adventure-2.webp', import.meta.url).href;
const adventure3Map = new URL('../assets/images/maps/adventure-3.webp', import.meta.url).href;
const adventure4Map = new URL('../assets/images/maps/adventure-4.webp', import.meta.url).href;
const adventure5Map = new URL('../assets/images/maps/adventure-5.webp', import.meta.url).href;
const adventure6Map = new URL('../assets/images/maps/adventure-6.webp', import.meta.url).href;

const ADVENTURE_ILLUSTRATIONS: Record<string, string> = {
    '1': chapter1Illustration,
    '2': chapter2Illustration,
    '3': chapter3Illustration,
    '4': chapter4Illustration,
    '5': chapter5Illustration,
    '6': chapter6Illustration,
};

const ADVENTURE_MAP_IMAGES: Record<string, string> = {
    '1': adventure1Map,
    '2': adventure2Map,
    '3': adventure3Map,
    '4': adventure4Map,
    '5': adventure5Map,
    '6': adventure6Map,
};

/**
 * Get illustration for an adventure by ID
 */
export const getAdventureIllustration = (adventureId: string): string | undefined => {
    return ADVENTURE_ILLUSTRATIONS[adventureId];
};

/**
 * Get map image for an adventure by ID
 */
export const getAdventureMapImage = (adventureId: string): string | undefined => {
    return ADVENTURE_MAP_IMAGES[adventureId];
};
