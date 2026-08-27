import type { GameEngineFactory } from '../types';
import { AsteroidesEngine } from './engine';

export const createAsteroidesGame: GameEngineFactory = (
  canvas,
  callbacks,
  extra,
) => new AsteroidesEngine(canvas, callbacks, extra);
