'use client';

import { useRef, useState } from 'react';
import { GameCanvas } from './GameCanvas';
import { createTetrisGame } from '@/lib/games/tetris';
import { PALETTES } from '@/lib/games/tetris/constants';
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

const SKINS = [
  { id: 'retro', label: 'RETRO' },
  { id: 'neon', label: 'NEON' },
  { id: 'pastel', label: 'PASTEL' },
  { id: 'pixel', label: 'PIXEL ART' },
] as const;

type SkinId = (typeof SKINS)[number]['id'];

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
  const [skin, setSkin] = useState<SkinId>('retro');
  const paletteRef = useRef<(string | null)[]>(PALETTES.retro);

  const selectSkin = (id: SkinId) => {
    paletteRef.current = PALETTES[id];
    setSkin(id);
  };

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
      <div className="tetris-skins">
        {SKINS.map((s) => (
          <button
            key={s.id}
            className={'tetris-skin-chip' + (skin === s.id ? ' active' : '')}
            onClick={() => selectSkin(s.id)}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
