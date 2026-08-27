'use client';

import { useEffect, useRef } from 'react';
import { GameCanvas } from './GameCanvas';
import { createSnakeGame } from '@/lib/games/snake';
import { PALETTES } from '@/lib/games/snake/constants';
import { useSkin } from '@/lib/hooks/useSkin';
import type { RealGameWrapperProps } from '@/lib/games/registry';

export function SnakeGame({
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
        factory={createSnakeGame}
        callbacks={{ onScore, onLives, onLevel, onGameOver: onOver }}
        paused={paused}
        handleRef={handleRef}
        className="game-canvas"
        width={800}
        height={800}
        palette={paletteRef}
      />
    </div>
  );
}
