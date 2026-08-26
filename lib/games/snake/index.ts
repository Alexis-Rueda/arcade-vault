import type { GameEngineFactory } from '../types';
import { SnakeEngine } from './engine';

export const createSnakeGame: GameEngineFactory = (canvas, callbacks) => {
  return new SnakeEngine(canvas, callbacks);
};
