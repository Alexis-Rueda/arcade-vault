'use client';

import { useEffect, useRef } from 'react';
import { GameCanvas } from './GameCanvas';
import { createFlappyPixelGame } from '@/lib/games/flappy-pixel';
import type { RealGameWrapperProps } from '@/lib/games/registry';

export function FlappyPixelGame({
  paused,
  onScore,
  onLives,
  onLevel,
  onOver,
  handleRef,
}: RealGameWrapperProps) {
  // No palette system needed for flappy pixel; use default canvas size 400x600 (portrait)
  const engineRef = useRef(null);

  // Ensure callbacks stable via GameCanvas; no extra effect needed here
  return (
    <div className="game-arena">
      <GameCanvas
        factory={createFlappyPixelGame}
        callbacks={{ onScore, onLives, onLevel, onGameOver: onOver }}
        paused={paused}
        handleRef={handleRef}
        className="game-canvas"
        width={400}
        height={600}
      />
    </div>
  );
}
