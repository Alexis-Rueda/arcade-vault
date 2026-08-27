'use client';

import { useEffect, useRef } from 'react';
import { GameCanvas } from './GameCanvas';
import { createArkanoidGame } from '@/lib/games/arkanoid';
import { PALETTES } from '@/lib/games/arkanoid/constants';
import { useSkin } from '@/lib/hooks/useSkin';
import type { GameHandle } from '@/lib/games/types';

type Props = {
  paused: boolean;
  onScore: (score: number) => void;
  onLives: (lives: number) => void;
  onLevel: (level: number) => void;
  onOver: (finalScore: number) => void;
  handleRef: { current: GameHandle | null };
};

export function ArkanoidGame({
  paused,
  onScore,
  onLives,
  onLevel,
  onOver,
  handleRef,
}: Props) {
  const { skin } = useSkin();
  const paletteRef = useRef<Record<string, string>>(PALETTES.clasico);

  useEffect(() => {
    paletteRef.current = PALETTES[skin];
  }, [skin]);

  return (
    <div className="game-arena">
      <GameCanvas
        factory={createArkanoidGame}
        callbacks={{
          onScore,
          onLives,
          onLevel,
          onGameOver: onOver,
        }}
        paused={paused}
        handleRef={handleRef}
        className="game-canvas"
        width={800}
        height={600}
        palette={paletteRef}
      />
    </div>
  );
}
