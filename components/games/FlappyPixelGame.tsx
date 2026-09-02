'use client';

import { useEffect, useRef } from 'react';
import { GameCanvas } from './GameCanvas';
import { createFlappyPixelGame } from '@/lib/games/flappy-pixel';
import type { RealGameWrapperProps } from '@/lib/games/registry';
import { useSkinWith } from '@/lib/hooks/useSkin';
import { PALETTES } from '@/lib/games/flappy-pixel/constants';
import { SKINS_BY_GAME } from '@/lib/games/skins';
import type { SkinConfig } from '@/lib/games/skins';

export function FlappyPixelGame({
  paused,
  onScore,
  onLives,
  onLevel,
  onOver,
  handleRef,
}: RealGameWrapperProps) {
  const { skin } = useSkinWith(SKINS_BY_GAME['flappy-pixel'] as SkinConfig);
  const paletteRef = useRef<Record<string, string>>(PALETTES[skin]);

  useEffect(() => {
    paletteRef.current = PALETTES[skin];
  }, [skin]);

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
        palette={paletteRef}
      />
    </div>
  );
}
