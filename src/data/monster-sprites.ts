/**
 * Monster Image Mappings
 * This file maps monster IDs to their sprite images for UI rendering.
 * Kept separate from data files to avoid Node.js import issues with image assets.
 */

const duneScorpionImg = new URL('../assets/images/enemies/dune-scorpion.webp', import.meta.url).href;
const sandSpiritImg = new URL('../assets/images/enemies/sand-spirit.webp', import.meta.url).href;
const tinyScorpionImg = new URL('../assets/images/enemies/tiny-scorpion.webp', import.meta.url).href;
const desertScavengerImg = new URL('../assets/images/enemies/desert-scavenger.webp', import.meta.url).href;
const sandColossusImg = new URL('../assets/images/enemies/the-sand-colossus.webp', import.meta.url).href;
const banditRaiderImg = new URL('../assets/images/enemies/bandit-raider.webp', import.meta.url).href;
const stoneGuardianImg = new URL('../assets/images/enemies/stone-guardian.webp', import.meta.url).href;
const assyrianGuardianImg = new URL('../assets/images/enemies/assyrian-guardian.webp', import.meta.url).href;
const theStoneEmperorImg = new URL('../assets/images/enemies/the-stone-emperor.webp', import.meta.url).href;
const banditLeaderImg = new URL('../assets/images/enemies/bandit-leader.webp', import.meta.url).href;
const mistRoninImg = new URL('../assets/images/enemies/mist-ronin.webp', import.meta.url).href;
const samuraiSoldierImg = new URL('../assets/images/enemies/samurai-soldier.webp', import.meta.url).href;
const samuraiCommanderImg = new URL('../assets/images/enemies/samurai-commander.webp', import.meta.url).href;
const ninjaScoutImg = new URL('../assets/images/enemies/ninja-scout.webp', import.meta.url).href;
const samuraiVanguardImg = new URL('../assets/images/enemies/samurai-vanguard.webp', import.meta.url).href;
const samuraiArcherImg = new URL('../assets/images/enemies/samurai-archer.webp', import.meta.url).href;
const warHoundImg = new URL('../assets/images/enemies/war-hound.webp', import.meta.url).href;
const evilShogunImg = new URL('../assets/images/enemies/the-evil-shogun.webp', import.meta.url).href;

// Adventure 5 Monsters
const blazeHyenaImg = new URL('../assets/images/enemies/blaze-hyena.webp', import.meta.url).href;
const emberLionessImg = new URL('../assets/images/enemies/ember-lioness.webp', import.meta.url).href;
const sunScorchedRhinoImg = new URL('../assets/images/enemies/sun-scorched-rhino.webp', import.meta.url).href;
const mirageSpiritImg = new URL('../assets/images/enemies/mirage-spirit.webp', import.meta.url).href;
const infernoManeImg = new URL('../assets/images/enemies/inferno-mane.webp', import.meta.url).href;

// Adventure 6 Monsters
const discordSpiritImg = new URL('../assets/images/enemies/discord-spirit.webp', import.meta.url).href;
const hollowShellImg = new URL('../assets/images/enemies/hollow-shell.webp', import.meta.url).href;
const twistedReflectionImg = new URL('../assets/images/enemies/twisted-reflection.webp', import.meta.url).href;
const spiritKingImg = new URL('../assets/images/enemies/spirit-king.webp', import.meta.url).href;

const MONSTER_SPRITES: Record<string, string> = {
    'scorpion_1': duneScorpionImg,
    'tiny_scorpion': tinyScorpionImg,
    'desert_scavenger': desertScavengerImg,
    'sand_spirit_1': sandSpiritImg,
    'sand_colossus': sandColossusImg,
    'bandit_raider': banditRaiderImg,
    'stone_guardian': stoneGuardianImg,
    'assyrian_guardian': assyrianGuardianImg,
    'the_stone_emperor': theStoneEmperorImg,
    'bandit_leader': banditLeaderImg,
    'mist_ronin': mistRoninImg,
    'samurai_soldier': samuraiSoldierImg,
    'samurai_commander': samuraiCommanderImg,
    'ninja_scout': ninjaScoutImg,
    'samurai_vanguard': samuraiVanguardImg,
    'samurai_archer': samuraiArcherImg,
    'war_hound': warHoundImg,
    'evil_shogun': evilShogunImg,
    // Adventure 5
    'blaze_hyena': blazeHyenaImg,
    'ember_lioness': emberLionessImg,
    'sun_scorched_rhino': sunScorchedRhinoImg,
    'mirage_spirit': mirageSpiritImg,
    'inferno_mane': infernoManeImg,
    // Adventure 6
    'discord_spirit': discordSpiritImg,
    'hollow_shell': hollowShellImg,
    'twisted_reflection': twistedReflectionImg,
    'spirit_king': spiritKingImg,
};

/**
 * Get sprite for a monster by ID
 */
export const getMonsterSprite = (monsterId: string): string | undefined => {
    return MONSTER_SPRITES[monsterId];
};
