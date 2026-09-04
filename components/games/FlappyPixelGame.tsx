'use client';

import { useEffect, useRef } from 'react';
import { GameCanvas } from './GameCanvas';
import { createFlappyPixelGame } from '@/lib/games/flappy-pixel';
import type { RealGameWrapperProps } from '@/lib/games/registry';
import { useSkin } from '@/lib/hooks/useSkin';
import { PALETTES } from '@/lib/games/flappy-pixel/constants';

export function FlappyPixelGame({
  paused,
  onScore,
  onLives,
  onLevel,
  onOver,
  handleRef,
}: RealGameWrapperProps) {
  const { skin } = useSkin();
  const paletteRef = useRef<Record<string, string>>(PALETTES.clasico);

  useEffect(() => {
    paletteRef.current = PALETTES[skin];
  }, [skin]);

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
        palette={paletteRef}
      />
    </div>
  );
}
