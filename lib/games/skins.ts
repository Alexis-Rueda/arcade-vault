/**
 * Skin contract for Arcade Vault games.
 *
 * Every real game (except Tetris) must define PALETTES in its own constants.ts
 * using this SkinId type. The skins UI is powered by SkinSwitcher + useSkin.
 */

export type SkinId = 'clasico' | 'retro' | 'neon';

export const SKIN_SET: SkinId[] = ['clasico', 'retro', 'neon'];

export const SKIN_LABELS: Record<SkinId, string> = {
  clasico: 'CLÁSICO',
  retro: 'RETRO',
  neon: 'NEON',
};

export type SkinOption = { id: string; label: string };

export type SkinConfig = {
  storageKey: string;
  defaultSkin: string;
  options: SkinOption[];
};

export const GLOBAL_SKIN_CONFIG: SkinConfig = {
  storageKey: 'av-skin',
  defaultSkin: 'clasico',
  options: SKIN_SET.map((id) => ({ id, label: SKIN_LABELS[id] })),
};

/**
 * Skin config per game (keyed by game id). Only games listed here show
 * the skin selector in the PlayerScreen HUD.
 */
export const SKINS_BY_GAME: Record<string, SkinConfig> = {
  asteroides: GLOBAL_SKIN_CONFIG,
  arkanoid: GLOBAL_SKIN_CONFIG,
  snake: GLOBAL_SKIN_CONFIG,
  tetris: {
    storageKey: 'av-skin-tetris',
    defaultSkin: 'retro',
    options: [
      { id: 'retro', label: 'RETRO' },
      { id: 'neon', label: 'NEON' },
      { id: 'pastel', label: 'PASTEL' },
      { id: 'pixel', label: 'PIXEL ART' },
    ],
  },
};

/**
 * Semantic color keys used across all games.
 * Each game defines its own PALETTES: Record<SkinId, GamePalette>.
 */
export interface GamePalette {
  field: string;
  fieldAlt: string;
  grid: string;
  border: string;
  player: string;
  playerGlow: string;
  accent: string;
  accentDim: string;
  hud: string;
  hudBg: string;
  hudText: string;
  text: string;
  textDim: string;
  gameOver: string;
  pause: string;
}

/** Creates a palette where clasico = classic arcade colors. */
export function createPalette(
  overrides: Partial<Record<SkinId, Partial<GamePalette>>>,
): Record<SkinId, GamePalette> {
  const clasico: GamePalette = {
    field: '#000',
    fieldAlt: '#0a0a0f',
    grid: 'rgba(255,255,255,0.03)',
    border: '#ff3333',
    player: '#0f0',
    playerGlow: '#0f0',
    accent: '#0ff',
    accentDim: 'rgba(255,255,255,0.12)',
    hud: 'rgba(0,0,0,0.5)',
    hudBg: '#000',
    hudText: '#0f0',
    text: '#fff',
    textDim: '#888',
    gameOver: '#f44',
    pause: '#0f0',
  };

  return {
    clasico: { ...clasico, ...overrides.clasico },
    retro: { ...clasico, ...overrides.retro },
    neon: { ...clasico, ...overrides.neon },
  };
}
