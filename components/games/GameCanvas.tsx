'use client';

import { useEffect, useMemo, useRef } from 'react';
import type {
  GameCallbacks,
  GameEngine,
  GameEngineFactory,
  GameHandle,
} from '@/lib/games/types';
import type { PaletteRef } from '@/lib/games/types';

type Props = {
  factory: GameEngineFactory;
  callbacks: GameCallbacks;
  paused: boolean;
  handleRef: { current: GameHandle | null };
  className?: string;
  width?: number;
  height?: number;
  preview?: { width: number; height: number; className?: string };
  palette?: PaletteRef | null;
};

export function GameCanvas({
  factory,
  callbacks,
  paused,
  handleRef,
  className,
  width = 800,
  height = 600,
  preview,
  palette,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const previewRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<GameEngine | null>(null);
  const callbacksRef = useRef(callbacks);

  useEffect(() => {
    callbacksRef.current = callbacks;
  });

  const stableCallbacks = useMemo(
    () => ({
      onScore: (s: number) => callbacksRef.current.onScore?.(s),
      onLives: (l: number) => callbacksRef.current.onLives?.(l),
      onLevel: (l: number) => callbacksRef.current.onLevel?.(l),
      onLines: (l: number) => callbacksRef.current.onLines?.(l),
      onGameOver: (s: number) => callbacksRef.current.onGameOver?.(s),
    }),
    [],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = factory(canvas, stableCallbacks, {
      previewCanvas: previewRef.current,
      palette,
    });
    engineRef.current = engine;
    handleRef.current = {
      end: () => engine.endGame(),
      reset: () => engine.reset(),
    };
    return () => {
      engine.destroy();
      engineRef.current = null;
      handleRef.current = null;
    };
  }, [factory, stableCallbacks, handleRef, palette]);

  useEffect(() => {
    engineRef.current?.setPaused(paused);
  }, [paused]);

  return (
    <>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className={className}
      />
      {preview && (
        <canvas
          ref={previewRef}
          width={preview.width}
          height={preview.height}
          className={preview.className}
        />
      )}
    </>
  );
}
