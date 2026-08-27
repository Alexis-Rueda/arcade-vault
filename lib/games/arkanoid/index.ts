import type { GameEngineFactory } from '../types';
import { ArkanoidEngine } from './engine';

export const createArkanoidGame: GameEngineFactory = (
  canvas,
  callbacks,
  extra,
) => {
  return new ArkanoidEngine(canvas, callbacks, extra);
};
