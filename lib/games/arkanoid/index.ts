import type { GameEngineFactory } from '../types';
import { ArkanoidEngine } from './engine';

export const createArkanoidGame: GameEngineFactory = (canvas, callbacks) => {
  return new ArkanoidEngine(canvas, callbacks);
};
