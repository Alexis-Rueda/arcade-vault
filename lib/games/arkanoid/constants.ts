export const W = 800;
export const H = 600;
export const MAX_DT = 50;

export const PADDLE_W = 120;
export const PADDLE_H = 16;
export const BALL_R = 8;

export const BLOCK_W = 52;
export const BLOCK_H = 20;
export const BLOCK_GAP = 2;
export const BLOCKS_OFFSET_Y = 60;

export const SCORE_PER_BLOCK = 10;

export const ROW_COLORS = [
  'red',
  'yellow',
  'cyan',
  'magenta',
  'hotpink',
  'green',
] as const;

export type RowColor = (typeof ROW_COLORS)[number];

export interface LevelDef {
  name: string;
  cols: number;
  rows: number;
  grid: number[][];
}

export const LEVELS: LevelDef[] = [
  {
    name: 'Clásico',
    cols: 10,
    rows: 6,
    grid: [
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
      [3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
      [4, 4, 4, 4, 4, 4, 4, 4, 4, 4],
      [5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
      [6, 6, 6, 6, 6, 6, 6, 6, 6, 6],
    ],
  },
  {
    name: 'Pirámide',
    cols: 11,
    rows: 9,
    grid: [
      [0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0],
      [0, 0, 0, 1, 1, 2, 1, 1, 0, 0, 0],
      [0, 0, 1, 1, 2, 2, 2, 1, 1, 0, 0],
      [0, 1, 1, 2, 2, 3, 2, 2, 1, 1, 0],
      [1, 1, 2, 2, 3, 3, 3, 2, 2, 1, 1],
      [0, 1, 1, 2, 2, 3, 2, 2, 1, 1, 0],
      [0, 0, 1, 1, 2, 2, 2, 1, 1, 0, 0],
      [0, 0, 0, 1, 1, 2, 1, 1, 0, 0, 0],
      [0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0],
    ],
  },
  {
    name: 'Ajedrez',
    cols: 10,
    rows: 8,
    grid: [
      [1, 0, 1, 0, 1, 0, 1, 0, 1, 0],
      [0, 1, 0, 1, 0, 1, 0, 1, 0, 1],
      [2, 0, 2, 0, 2, 0, 2, 0, 2, 0],
      [0, 2, 0, 2, 0, 2, 0, 2, 0, 2],
      [3, 0, 3, 0, 3, 0, 3, 0, 3, 0],
      [0, 3, 0, 3, 0, 3, 0, 3, 0, 3],
      [4, 0, 4, 0, 4, 0, 4, 0, 4, 0],
      [0, 4, 0, 4, 0, 4, 0, 4, 0, 4],
    ],
  },
  {
    name: 'Huecos',
    cols: 10,
    rows: 7,
    grid: [
      [5, 5, 5, 0, 5, 5, 0, 5, 5, 5],
      [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
      [2, 2, 0, 2, 2, 2, 2, 0, 2, 2],
      [3, 3, 3, 3, 3, 3, 3, 3, 3, 3],
      [4, 4, 4, 0, 4, 4, 0, 4, 4, 4],
      [5, 5, 5, 5, 5, 5, 5, 5, 5, 5],
      [6, 6, 0, 6, 6, 6, 6, 0, 6, 6],
    ],
  },
  {
    name: 'Fortaleza',
    cols: 12,
    rows: 8,
    grid: [
      [0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0],
      [0, 0, 1, 1, 2, 2, 2, 2, 1, 1, 0, 0],
      [0, 1, 1, 2, 2, 3, 3, 2, 2, 1, 1, 0],
      [1, 1, 2, 2, 3, 3, 3, 3, 2, 2, 1, 1],
      [1, 1, 2, 2, 3, 3, 3, 3, 2, 2, 1, 1],
      [0, 1, 1, 2, 2, 3, 3, 2, 2, 1, 1, 0],
      [0, 0, 1, 1, 2, 2, 2, 2, 1, 1, 0, 0],
      [0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0],
    ],
  },
];

export const BALL_SPEEDS = [3, 3.3, 3.63, 3.99, 4.39];

import type { SkinId } from '../skins';

/**
 * Paletas por skin: claves semánticas que centralizan los colores de draw().
 * clasico replica los colores actuales del juego (spritesheet, sin cambio visual).
 * Las claves block1..block6 corresponden a las filas 1..6 (ROW_COLORS).
 */
export const PALETTES: Record<SkinId, Record<string, string>> = {
  clasico: {
    skinId: 'clasico',
    field: '#000',
    overlay: 'rgba(0,0,0,0.7)',
    hud: 'rgba(0,0,0,0.5)',
    hudText: '#fff',
    text: '#fff',
    textDim: '#888',
    accent: '#ff0',
    accentDim: '#3498db',
    accentSelected: '#2980b9',
    ball: '#fff',
    paddle: '#fff',
    block1: '#ff0000',
    block2: '#ffff00',
    block3: '#00ffff',
    block4: '#ff00ff',
    block5: '#ff69b4',
    block6: '#00ff00',
    gameOver: '#f44',
    victory: '#4f4',
  },
  retro: {
    skinId: 'retro',
    field: '#05010d',
    overlay: 'rgba(0,0,0,0.75)',
    hud: 'rgba(0,0,0,0.5)',
    hudText: '#00ff41',
    text: '#00ff41',
    textDim: 'rgba(0,255,65,0.7)',
    accent: '#00ffff',
    accentDim: '#00aa55',
    accentSelected: '#ffb000',
    ball: '#00ff41',
    paddle: '#00ff41',
    block1: '#ff3333',
    block2: '#ffb000',
    block3: '#00ffff',
    block4: '#ff7b00',
    block5: '#39ff14',
    block6: '#00ff41',
    gameOver: '#ff3333',
    victory: '#00ff41',
  },
  neon: {
    skinId: 'neon',
    field: '#05010f',
    overlay: 'rgba(0,0,0,0.78)',
    hud: 'rgba(0,0,0,0.55)',
    hudText: '#00fff0',
    text: '#00fff0',
    textDim: 'rgba(0,245,255,0.7)',
    accent: '#ff00e5',
    accentDim: '#5b21b6',
    accentSelected: '#ff2fd6',
    ball: '#00fff0',
    paddle: '#ff00e5',
    block1: '#ff00e5',
    block2: '#ff9f1c',
    block3: '#00fff0',
    block4: '#7df9ff',
    block5: '#ff2fd6',
    block6: '#39ff14',
    gameOver: '#ff2f4f',
    victory: '#39ff14',
  },
};
