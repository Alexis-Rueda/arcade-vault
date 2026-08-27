export const W = 800;
export const H = 800;
export const CELL = 40;
export const COLS = 20;
export const ROWS = 20;
export const MAX_DT = 50;
export const BASE_TICK = 150;
export const MIN_TICK = 60;
export const SPEED_INTERVAL = 5;
export const POINTS_PER_FRUIT = 10;

import type { SkinId } from '../skins';

// Paletas por skin: claves semánticas que centralizan los colores de draw().
// clasico replica los colores actuales del juego (sin cambio visual).
export const PALETTES: Record<SkinId, Record<string, string>> = {
  clasico: {
    field: '#000',
    grid: 'rgba(255,255,255,0.03)',
    player: '#00c800',
    playerDim: '#00c828',
    playerBody: '#00c800',
    accent: '#0f0',
    hudBg: 'rgba(0,0,0,0.5)',
    hudText: '#0f0',
    text: '#fff',
    textDim: '#888',
    gameOver: '#f44',
    pause: '#0f0',
  },
  retro: {
    field: '#05010d',
    grid: 'rgba(0,255,65,0.06)',
    player: '#00ff41',
    playerDim: '#00c832',
    playerBody: '#00b32b',
    accent: '#00ffff',
    hudBg: 'rgba(0,0,0,0.6)',
    hudText: '#00ff41',
    text: '#00ff41',
    textDim: 'rgba(0,255,65,0.7)',
    gameOver: '#ff0040',
    pause: '#00ff41',
  },
  neon: {
    field: '#05010f',
    grid: 'rgba(0,255,240,0.06)',
    player: '#00fff0',
    playerDim: '#00c8b8',
    playerBody: '#00b3a6',
    accent: '#ff00e5',
    hudBg: 'rgba(0,0,0,0.6)',
    hudText: '#00fff0',
    text: '#00fff0',
    textDim: 'rgba(255,0,229,0.7)',
    gameOver: '#ff00e5',
    pause: '#00fff0',
  },
};
