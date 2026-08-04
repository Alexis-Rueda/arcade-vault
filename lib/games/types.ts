export type GameCallbacks = {
  onScore?: (score: number) => void;
  onLives?: (lives: number) => void;
  onLevel?: (level: number) => void;
  onGameOver?: (finalScore: number) => void;
};

export interface GameEngine {
  reset(): void; // re-inicia la partida (initGame) y reanuda
  destroy(): void; // cancela rAF y remueve listeners de window
  setPaused(paused: boolean): void; // congela/reanuda el loop
  endGame(): void; // fuerza game over → dispara onGameOver(score)
}

export type GameEngineFactory = (
  canvas: HTMLCanvasElement,
  callbacks: GameCallbacks,
) => GameEngine;

export type GameHandle = { end(): void; reset(): void };
