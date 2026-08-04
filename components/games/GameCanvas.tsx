'use client';

import { useEffect, useMemo, useRef } from 'react';
import type {
  GameCallbacks,
  GameEngine,
  GameEngineFactory,
  GameHandle,
} from '@/lib/games/types';

type Props = {
  factory: GameEngineFactory;
  callbacks: GameCallbacks;
  paused: boolean;
  handleRef: { current: GameHandle | null };
  className?: string;
};

export function GameCanvas({
  factory,
  callbacks,
  paused,
  handleRef,
  className,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
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
      onGameOver: (s: number) => callbacksRef.current.onGameOver?.(s),
    }),
    [],
  );

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const engine = factory(canvas, stableCallbacks);
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
  }, [factory, stableCallbacks, handleRef]);

  useEffect(() => {
    engineRef.current?.setPaused(paused);
  }, [paused]);

  return (
    <canvas ref={canvasRef} width={800} height={600} className={className} />
  );
}
