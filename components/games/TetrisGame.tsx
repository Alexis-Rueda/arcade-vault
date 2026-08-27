'use client';

import { useEffect, useRef, useState } from 'react';
import { GameCanvas } from './GameCanvas';
import { createTetrisGame } from '@/lib/games/tetris';
import { PALETTES } from '@/lib/games/tetris/constants';
import { useSkinWith } from '@/lib/hooks/useSkin';
import { SKINS_BY_GAME } from '@/lib/games/skins';
import type { GameHandle } from '@/lib/games/types';

type Props = {
  paused: boolean;
  onScore: (score: number) => void;
  onLives: (lives: number) => void;
  onLevel: (level: number) => void;
  onLines?: (lines: number) => void;
  onOver: (finalScore: number) => void;
  handleRef: { current: GameHandle | null };
};

export function TetrisGame({
  paused,
  onScore,
  onLives,
  onLevel,
  onLines,
  onOver,
  handleRef,
}: Props) {
  const [lines, setLines] = useState(0);
  const [score, setScore] = useState(0);
  const { skin } = useSkinWith(SKINS_BY_GAME.tetris);
  const paletteRef = useRef<(string | null)[]>(PALETTES[skin]);

  useEffect(() => {
    paletteRef.current = PALETTES[skin];
  }, [skin]);

  return (
    <div className="tetris-stage">
      <GameCanvas
        factory={createTetrisGame}
        callbacks={{
          onScore: (s) => {
            setScore(s);
            onScore(s);
          },
          onLives,
          onLevel,
          onLines: (l) => {
            setLines(l);
            onLines?.(l);
          },
          onGameOver: onOver,
        }}
        paused={paused}
        handleRef={handleRef}
        className="tetris-board"
        width={300}
        height={600}
        preview={{ width: 120, height: 120, className: 'tetris-preview' }}
        palette={paletteRef}
      />
      <aside className="tetris-panel">
        <div className="tetris-panel-section">
          <div className="tetris-label">NEXT</div>
        </div>
        <div className="tetris-panel-section">
          <div className="tetris-label">LINES</div>
          <div className="tetris-value">{lines}</div>
        </div>
        <div className="tetris-panel-section">
          <div className="tetris-label">SCORE</div>
          <div className="tetris-value">{score.toLocaleString('es-ES')}</div>
        </div>
      </aside>
    </div>
  );
}
