import type { ComponentType } from 'react';
import { AsteroidesGame } from '@/components/games/AsteroidesGame';
import { TetrisGame } from '@/components/games/TetrisGame';
import { ArkanoidGame } from '@/components/games/ArkanoidGame';
import { SnakeGame } from '@/components/games/SnakeGame';
import { FlappyPixelGame } from '@/components/games/FlappyPixelGame';
import type { GameHandle } from '@/lib/games/types';

export type RealGameWrapperProps = {
  paused: boolean;
  onScore: (score: number) => void;
  onLives: (lives: number) => void;
  onLevel: (level: number) => void;
  onLines?: (lines: number) => void;
  onOver: (finalScore: number) => void;
  handleRef: { current: GameHandle | null };
};

export const REAL_GAMES: readonly {
  id: string;
  Component: ComponentType<RealGameWrapperProps>;
}[] = [
  { id: 'asteroides', Component: AsteroidesGame },
  { id: 'tetris', Component: TetrisGame },
  { id: 'arkanoid', Component: ArkanoidGame },
  { id: 'snake', Component: SnakeGame },
  { id: 'flappy-pixel', Component: FlappyPixelGame },
];

export const isRealGame = (id: string): boolean =>
  REAL_GAMES.some((g) => g.id === id);

export const getRealGame = (id: string) => REAL_GAMES.find((g) => g.id === id);
