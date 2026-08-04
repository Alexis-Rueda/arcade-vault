'use client';

import { GameCanvas } from './GameCanvas';
import { createAsteroidesGame } from '@/lib/games/asteroides';
import type { GameHandle } from '@/lib/games/types';

type Props = {
  paused: boolean;
  onScore: (score: number) => void;
  onLives: (lives: number) => void;
  onLevel: (level: number) => void;
  onOver: (finalScore: number) => void;
  handleRef: { current: GameHandle | null };
};

export function AsteroidesGame({
  paused,
  onScore,
  onLives,
  onLevel,
  onOver,
  handleRef,
}: Props) {
  return (
    <div className="game-arena">
      <GameCanvas
        factory={createAsteroidesGame}
        callbacks={{ onScore, onLives, onLevel, onGameOver: onOver }}
        paused={paused}
        handleRef={handleRef}
        className="game-canvas"
      />
    </div>
  );
}
