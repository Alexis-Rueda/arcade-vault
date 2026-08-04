export const COLS = 10;
export const ROWS = 20;
export const BLOCK = 30;

export const MAX_DT = 50;

export const GRID_LINE = '#22222e';

export const COLORS: (string | null)[] = [
  null,
  '#4dd0e1', // I - cyan
  '#ffd54f', // O - yellow
  '#ba68c8', // T - purple
  '#81c784', // S - green
  '#e57373', // Z - red
  '#90caf9', // J - pale blue
  '#ffb74d', // L - orange
  '#9e9e9e', // N - tuerca (gris metálico)
];

export const PIECES: (number[][] | null)[] = [
  null,
  [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0],
  ], // I
  [
    [2, 2],
    [2, 2],
  ], // O
  [
    [0, 3, 0],
    [3, 3, 3],
    [0, 0, 0],
  ], // T
  [
    [0, 4, 4],
    [4, 4, 0],
    [0, 0, 0],
  ], // S
  [
    [5, 5, 0],
    [0, 5, 5],
    [0, 0, 0],
  ], // Z
  [
    [6, 0, 0],
    [6, 6, 6],
    [0, 0, 0],
  ], // J
  [
    [0, 0, 7],
    [7, 7, 7],
    [0, 0, 0],
  ], // L
  [
    [8, 8, 8],
    [8, 0, 8],
    [8, 8, 8],
  ], // N (tuerca)
];

export const LINE_SCORES = [0, 100, 300, 500, 800];

export const PALETTES: Record<string, (string | null)[]> = {
  retro: [
    null,
    '#4dd0e1', // I
    '#ffd54f', // O
    '#ba68c8', // T
    '#81c784', // S
    '#e57373', // Z
    '#90caf9', // J
    '#ffb74d', // L
    '#9e9e9e', // N
  ],
  neon: [
    null,
    '#00f5ff',
    '#f5ff00',
    '#ff00e5',
    '#00ff88',
    '#ff1744',
    '#2979ff',
    '#ff9100',
    '#e0e0e0',
  ],
  pastel: [
    null,
    '#a5e8d5',
    '#ffd9a0',
    '#c9b8f0',
    '#b0e8b0',
    '#ffb3ba',
    '#a8d8f0',
    '#ffc98a',
    '#d9cfc4',
  ],
  pixel: [
    null,
    '#00a2ff',
    '#ffde00',
    '#ff6eab',
    '#00c84c',
    '#ff1e3c',
    '#00d8ff',
    '#ff8c00',
    '#6e6e6e',
  ],
};
