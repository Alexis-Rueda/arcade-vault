import type { GameCallbacks, GameEngine, GameEngineFactory } from '../types';
import { TetrisEngine } from './engine';

export const createTetrisGame: GameEngineFactory = (
  canvas: HTMLCanvasElement,
  callbacks: GameCallbacks,
  extra?: { previewCanvas?: HTMLCanvasElement | null },
): GameEngine => new TetrisEngine(canvas, callbacks, extra);
