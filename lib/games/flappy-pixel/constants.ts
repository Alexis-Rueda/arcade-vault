export const W = 400;
export const H = 600;
export const MAX_DT = 50;
export const GRAVITY = 0.5;
export const FLAP_FORCE = -8;
export const PIPE_SPEED = 2;
export const PIPE_GAP = 150;
export const PIPE_WIDTH = 60;
export const PIPE_INTERVAL = 1500; // ms
export const BIRD_SIZE = 20;
export const POINTS_PER_PIPE = 1;

import { createPalette } from '@/lib/games/skins';

export const PALETTES = createPalette({
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
});
export const H = 600;
export const MAX_DT = 50;
export const GRAVITY = 0.5;
export const FLAP_FORCE = -8;
export const PIPE_SPEED = 2;
export const PIPE_GAP = 150;
export const PIPE_WIDTH = 60;
export const PIPE_INTERVAL = 1500; // ms
export const BIRD_SIZE = 20;
export const POINTS_PER_PIPE = 1;
