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
