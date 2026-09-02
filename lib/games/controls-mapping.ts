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

// BTN_A/B emiten la tecla que el engine ya reconoce (funcionalidad táctil).
// z/j/x/k activan el resplandor visual del gamepad MK-II (ver VirtualGamepad).
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
  'flappy-pixel': {
    UP: 'w',
    DOWN: 's',
    LEFT: 'a',
    RIGHT: 'd',
    BTN_A: ' ',
    BTN_B: 'p',
  },
};
