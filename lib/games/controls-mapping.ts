export type GamepadAction =
  'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'BTN_A' | 'BTN_B';

interface ControlMap {
  UP: string;
  DOWN: string;
  LEFT: string;
  RIGHT: string;
  BTN_A: string;
  BTN_B: string;
}

export const TOUCH_CONTROLS: Record<string, ControlMap> = {
  asteroides: {
    UP: 'w',
    DOWN: 's',
    LEFT: 'a',
    RIGHT: 'd',
    BTN_A: ' ',
    BTN_B: 'p',
  },
  tetris: {
    UP: 'w',
    DOWN: 's',
    LEFT: 'a',
    RIGHT: 'd',
    BTN_A: 'q',
    BTN_B: 'e',
  },
  arkanoid: {
    UP: 'w',
    DOWN: 's',
    LEFT: 'a',
    RIGHT: 'd',
    BTN_A: ' ',
    BTN_B: 'p',
  },
  snake: {
    UP: 'w',
    DOWN: 's',
    LEFT: 'a',
    RIGHT: 'd',
    BTN_A: ' ',
    BTN_B: 'p',
  },
};
