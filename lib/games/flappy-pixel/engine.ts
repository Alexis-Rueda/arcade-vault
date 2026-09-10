import type { GameEngine, GameCallbacks, PaletteRef } from '@/lib/games/types';
import {
  W,
  H,
  GRAVITY,
  FLAP_FORCE,
  PIPE_SPEED,
  PIPE_GAP,
  PIPE_WIDTH,
  PIPE_DISTANCE,
  BIRD_X,
  BIRD_SIZE,
  POINTS_PER_PIPE,
  MAX_DT,
  PALETTES,
} from './constants';

interface Pipe {
  x: number;
  gapY: number;
  passed: boolean;
}

type GameState = 'waiting' | 'playing' | 'gameover';

export class FlappyPixelEngine implements GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private callbacks: GameCallbacks;
  private rafId: number | null = null;
  private lastTime = 0;
  private dtAcc = 0;
  private paused = false;
  private pauseDrawn = false;
  private paletteRef: PaletteRef | null = null;
  private cachedColors: Record<string, string> = PALETTES.clasico;
  private readonly FONT_MAIN = 'bold 24px monospace';
  private readonly FONT_WAITING = '16px monospace';

  private birdY = H / 2;
  private birdV = 0;
  private pipes: Pipe[] = [];
  private score = 0;
  private state: GameState = 'waiting';
  private lastGapY = H / 2 - PIPE_GAP / 2;

  private onKeyDown = (e: KeyboardEvent) => {
    if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
      e.preventDefault();
      this.flap();
    }
  };

  private onClick = () => {
    this.flap();
  };

  constructor(
    canvas: HTMLCanvasElement,
    callbacks: GameCallbacks,
    extra?: { palette?: PaletteRef | null },
  ) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context not available');
    this.ctx = ctx;
    this.ctx.font = this.FONT_MAIN;
    this.ctx.textAlign = 'center';
    this.callbacks = callbacks;
    this.paletteRef = extra?.palette ?? null;

    window.addEventListener('keydown', this.onKeyDown);
    canvas.addEventListener('click', this.onClick);

    this.init();
  }

  private init() {
    this.birdY = H / 2 - 50 - BIRD_SIZE / 2;
    this.birdV = 0;
    this.pipes = [];
    this.score = 0;
    this.state = 'waiting';
    this.lastGapY = H / 2 - PIPE_GAP / 2;
    this.clearCanvas();
    this.startLoop();
  }

  private clearCanvas() {
    this.ctx.clearRect(0, 0, W, H);
  }

  private startLoop() {
    const loop = (time: number) => {
      if (this.paused) {
        if (!this.pauseDrawn) {
          this.render();
          this.pauseDrawn = true;
        }
        this.rafId = requestAnimationFrame(loop);
        return;
      }
      this.pauseDrawn = false;
      if (!this.lastTime) this.lastTime = time;
      const delta = time - this.lastTime;
      this.lastTime = time;
      this.dtAcc += delta;
      while (this.dtAcc >= MAX_DT) {
        this.update(MAX_DT);
        this.dtAcc -= MAX_DT;
      }
      this.render();
      if (this.state !== 'gameover') this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  private getColors(): Record<string, string> {
    const cur = this.paletteRef?.current;
    const colors = cur && !Array.isArray(cur) ? cur : PALETTES.clasico;
    if (colors !== this.cachedColors) this.cachedColors = colors;
    return this.cachedColors;
  }

  private spawnPipe() {
    const isFirst = this.pipes.length === 0;
    const minGapY = 60;
    const maxGapY = H - PIPE_GAP - 60;
    const maxDelta = 100;
    const min = Math.max(minGapY, this.lastGapY - maxDelta);
    const max = Math.min(maxGapY, this.lastGapY + maxDelta);
    const gapY = isFirst
      ? H / 2 - PIPE_GAP / 2
      : min + Math.random() * (max - min);
    this.lastGapY = gapY;
    this.pipes.push({ x: W, gapY, passed: false });
  }

  private update(_dt: number) {
    if (this.state !== 'playing') return;

    this.birdV += GRAVITY;
    this.birdY += this.birdV;

    // Spawn pipes by distance
    const lastPipe = this.pipes[this.pipes.length - 1];
    if (!lastPipe || lastPipe.x <= W - PIPE_DISTANCE) {
      this.spawnPipe();
    }

    // Move pipes
    for (const pipe of this.pipes) {
      pipe.x -= PIPE_SPEED;
    }

    // Score
    for (const pipe of this.pipes) {
      if (!pipe.passed && pipe.x + PIPE_WIDTH < BIRD_X) {
        pipe.passed = true;
        this.score += POINTS_PER_PIPE;
        this.callbacks.onScore?.(this.score);
      }
    }

    // Remove off-screen
    this.pipes = this.pipes.filter((p) => p.x + PIPE_WIDTH > -10);

    this.checkCollisions();
  }

  private checkCollisions() {
    // Floor / ceiling
    if (this.birdY < 0 || this.birdY + BIRD_SIZE > H) {
      this.endGame();
      return;
    }

    const bx = BIRD_X;
    const by = this.birdY;
    const bw = BIRD_SIZE;
    const bh = BIRD_SIZE;

    for (const pipe of this.pipes) {
      const px = pipe.x;
      const pw = PIPE_WIDTH;

      // Horizontal overlap check first
      if (bx + bw <= px || bx >= px + pw) continue;

      // Top pipe: from y=0 to y=gapY
      if (by < pipe.gapY) {
        this.endGame();
        return;
      }

      // Bottom pipe: from y=gapY+PIPE_GAP to y=H
      if (by + bh > pipe.gapY + PIPE_GAP) {
        this.endGame();
        return;
      }
    }
  }

  private render() {
    const colors = this.getColors();

    // Background
    this.ctx.clearRect(0, 0, W, H);
    this.ctx.fillStyle = colors.field;
    this.ctx.fillRect(0, 0, W, H);

    // Pipes
    if (this.state === 'playing' || this.state === 'gameover') {
      // Pipe bodies
      this.ctx.fillStyle = colors.accent;
      for (const pipe of this.pipes) {
        this.ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.gapY);
        this.ctx.fillRect(
          pipe.x,
          pipe.gapY + PIPE_GAP,
          PIPE_WIDTH,
          H - pipe.gapY - PIPE_GAP,
        );
      }
      // Pipe caps
      this.ctx.fillStyle = colors.accentDim;
      for (const pipe of this.pipes) {
        this.ctx.fillRect(pipe.x - 3, pipe.gapY - 12, PIPE_WIDTH + 6, 12);
        this.ctx.fillRect(pipe.x - 3, pipe.gapY + PIPE_GAP, PIPE_WIDTH + 6, 12);
      }
    }

    // Bird
    this.ctx.fillStyle = colors.player;
    this.ctx.fillRect(BIRD_X, this.birdY, BIRD_SIZE, BIRD_SIZE);

    // Score HUD
    this.ctx.fillStyle = colors.hudText;
    this.ctx.fillText(String(this.score), W / 2, 36);

    // Waiting message
    if (this.state === 'waiting') {
      this.ctx.fillStyle = colors.text;
      this.ctx.font = this.FONT_WAITING;
      this.ctx.fillText('TAP TO START', W / 2, H / 2 + 60);
      this.ctx.font = this.FONT_MAIN;
    }
  }

  public flap() {
    if (this.state === 'gameover') return;
    if (this.state === 'waiting') {
      this.state = 'playing';
      this.spawnPipe();
    }
    this.birdV = FLAP_FORCE;
  }

  setPaused(paused: boolean) {
    this.paused = paused;
    if (!paused) this.lastTime = 0;
  }

  endGame() {
    if (this.state === 'gameover') return;
    this.state = 'gameover';
    this.callbacks.onGameOver?.(this.score);
    if (this.rafId) cancelAnimationFrame(this.rafId);
  }

  reset() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.lastTime = 0;
    this.dtAcc = 0;
    this.init();
  }

  destroy() {
    if (this.rafId) cancelAnimationFrame(this.rafId);
    window.removeEventListener('keydown', this.onKeyDown);
    this.canvas.removeEventListener('click', this.onClick);
  }
}

export const createFlappyPixelGame = (
  canvas: HTMLCanvasElement,
  callbacks: GameCallbacks,
  extra?: { palette?: PaletteRef | null },
) => new FlappyPixelEngine(canvas, callbacks, extra);
