'use client';

import { GameCanvas } from './GameCanvas';
import { createSnakeGame } from '@/lib/games/snake';
import type { GameHandle } from '@/lib/games/types';
import type { RealGameWrapperProps } from '@/lib/games/registry';

export function SnakeGame({
  paused,
  onScore,
  onLives,
  onLevel,
  onOver,
  handleRef,
}: RealGameWrapperProps) {
  return (
    <div className="game-arena">
      <GameCanvas
        factory={createSnakeGame}
        callbacks={{ onScore, onLives, onLevel, onGameOver: onOver }}
        paused={paused}
        handleRef={handleRef}
        className="game-canvas"
        width={800}
        height={800}
      />
    </div>
  );
}
