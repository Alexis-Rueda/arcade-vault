import type { GameCallbacks, GameEngine, GameEngineFactory } from '../types';
import { AsteroidesEngine } from './engine';

export const createAsteroidesGame: GameEngineFactory = (
  canvas: HTMLCanvasElement,
  callbacks: GameCallbacks,
): GameEngine => new AsteroidesEngine(canvas, callbacks);
