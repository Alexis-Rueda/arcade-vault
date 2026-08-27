export const W = 800;
export const H = 600;

export const MAX_DT = 0.05;

export const POWERUP_DROP_CHANCE = 0.15;
export const POWERUP_DURATION = 5;
export const POWERUP_TTL = 12;
export const TRIPLE_SPREAD = 0.18;

export const RADII = [0, 16, 30, 50];
export const SPEEDS = [0, 85, 55, 32];
export const POINTS = [0, 100, 50, 20];

export const START_ASTEROIDS = 4;
export const SAFE_DIST = 130;
export const DEAD_TIMER = 2;

import type { SkinId } from '../skins';

// Paletas por skin: claves semánticas que centralizan los colores de draw().
// clasico replica los colores actuales del juego (sin cambio visual).
export const PALETTES: Record<SkinId, Record<string, string>> = {
  clasico: {
    field: '#000',
    player: '#fff',
    accent: '#0ff',
    accentDim: 'rgba(255, 130, 0, 0.85)',
    hudText: '#fff',
    text: '#fff',
    textDim: 'rgba(255,255,255,0.65)',
  },
  retro: {
    field: '#05010d',
    player: '#00ff41',
    accent: '#00ffff',
    accentDim: 'rgba(0, 255, 65, 0.9)',
    hudText: '#00ff41',
    text: '#00ff41',
    textDim: 'rgba(0, 255, 65, 0.7)',
  },
  neon: {
    field: '#05010f',
    player: '#00fff0',
    accent: '#ff00e5',
    accentDim: 'rgba(0, 245, 255, 0.9)',
    hudText: '#00fff0',
    text: '#00fff0',
    textDim: 'rgba(255, 0, 229, 0.7)',
  },
};
