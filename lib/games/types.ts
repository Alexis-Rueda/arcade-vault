export type GameCallbacks = {
  onScore?: (score: number) => void;
  onLives?: (lives: number) => void;
  onLevel?: (level: number) => void;
  onLines?: (lines: number) => void;
  onGameOver?: (finalScore: number) => void;
};

export interface GameEngine {
  reset(): void; // re-inicia la partida (initGame) y reanuda
  destroy(): void; // cancela rAF y remueve listeners de window
  setPaused(paused: boolean): void; // congela/reanuda el loop
  endGame(): void; // fuerza game over → dispara onGameOver(score)
}

export type GamePalette = Record<string, string>;

export type PaletteRef = {
  current: (string | null)[] | GamePalette | null;
};

export type GameEngineFactory = (
  canvas: HTMLCanvasElement,
  callbacks: GameCallbacks,
  extra?: {
    previewCanvas?: HTMLCanvasElement | null;
    palette?: PaletteRef | null;
  },
) => GameEngine;

export type GameHandle = { end(): void; reset(): void };
