import type { GameEngine, GameCallbacks, PaletteRef } from '@/lib/games/types';
import {
  W,
  H,
  GRAVITY,
  FLAP_FORCE,
  PIPE_SPEED,
  PIPE_GAP,
  PIPE_WIDTH,
  PIPE_INTERVAL,
  BIRD_SIZE,
  POINTS_PER_PIPE,
  MAX_DT,
  PALETTES,
} from './constants';

interface Pipe {
  x: number;
  gapY: number; // top of gap
  scored?: boolean;
}

export class FlappyPixelEngine implements GameEngine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private callbacks: GameCallbacks;
  private rafId: number | null = null;
  private lastTime = 0;
  private dtAcc = 0;
  private paused = false;
  private paletteRef: PaletteRef | null = null;

  // state
  private birdY = H / 2;
  private birdV = 0;
  private pipes: Pipe[] = [];
  private nextPipeTime = 0;
  private score = 0;
  private gameOver = false;

  constructor(
    canvas: HTMLCanvasElement,
    callbacks: GameCallbacks,
    extra?: { palette?: PaletteRef | null },
  ) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D context not available');
    this.ctx = ctx;
    this.callbacks = callbacks;
    this.paletteRef = extra?.palette ?? null;
    this.init();
  }

  private init() {
    this.birdY = H / 2;
    this.birdV = 0;
    this.pipes = [];
    this.nextPipeTime = 0;
    this.score = 0;
    this.gameOver = false;
    this.clearCanvas();
    this.startLoop();
  }

  private clearCanvas() {
    this.ctx.clearRect(0, 0, W, H);
  }

  private startLoop() {
    const loop = (time: number) => {
      if (this.paused) {
        this.rafId = requestAnimationFrame(loop);
        return;
      }
      if (!this.lastTime) this.lastTime = time;
      const delta = time - this.lastTime;
      this.lastTime = time;
      this.dtAcc += delta;
      while (this.dtAcc >= MAX_DT) {
        this.update(MAX_DT);
        this.dtAcc -= MAX_DT;
      }
      this.render();
      if (!this.gameOver) this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  private getColors(): Record<string, string> {
    const cur = this.paletteRef?.current;
    return cur && !Array.isArray(cur) ? cur : PALETTES.clasico;
  }

  private update(dt: number) {
    // gravity
    this.birdV += GRAVITY;
    this.birdY += this.birdV;
    // spawn pipes
    this.nextPipeTime -= dt;
    if (this.nextPipeTime <= 0) {
      const gapY = Math.random() * (H - PIPE_GAP - 40) + 20;
      this.pipes.push({ x: W, gapY });
      this.nextPipeTime = PIPE_INTERVAL;
    }
    // move pipes
    this.pipes.forEach((p) => (p.x -= PIPE_SPEED));
    // remove off-screen
    this.pipes = this.pipes.filter((p) => p.x + PIPE_WIDTH > 0);
    // check collisions
    this.checkCollisions();
    // score when bird passes pipe center
    this.pipes.forEach((p) => {
      if (!p['scored'] && p.x + PIPE_WIDTH / 2 < BIRD_SIZE) {
        this.score += POINTS_PER_PIPE;
        p.scored = true;
        this.callbacks.onScore?.(this.score);
      }
    });
  }

  private checkCollisions() {
    if (this.birdY < 0 || this.birdY > H) this.endGame();
    const birdRect = { x: 50, y: this.birdY, w: BIRD_SIZE, h: BIRD_SIZE };
    for (const pipe of this.pipes) {
      const topRect = { x: pipe.x, y: 0, w: PIPE_WIDTH, h: pipe.gapY };
      const bottomRect = {
        x: pipe.x,
        y: pipe.gapY + PIPE_GAP,
        w: PIPE_WIDTH,
        h: H - pipe.gapY - PIPE_GAP,
      };
      if (
        this.intersect(birdRect, topRect) ||
        this.intersect(birdRect, bottomRect)
      ) {
        this.endGame();
        break;
      }
    }
  }

  private intersect(
    a: { x: number; y: number; w: number; h: number },
    b: { x: number; y: number; w: number; h: number },
  ) {
    return (
      a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y
    );
  }

  private render() {
    const colors = this.getColors();
    // background
    this.ctx.fillStyle = colors.field;
    this.ctx.fillRect(0, 0, W, H);
    // bird
    this.ctx.fillStyle = colors.player;
    this.ctx.fillRect(50, this.birdY, BIRD_SIZE, BIRD_SIZE);
    // pipes
    this.ctx.fillStyle = colors.accent;
    for (const pipe of this.pipes) {
      // top
      this.ctx.fillRect(pipe.x, 0, PIPE_WIDTH, pipe.gapY);
      // bottom
      this.ctx.fillRect(
        pipe.x,
        pipe.gapY + PIPE_GAP,
        PIPE_WIDTH,
        H - pipe.gapY - PIPE_GAP,
      );
    }
    // score HUD
    this.ctx.fillStyle = colors.hudText;
    this.ctx.font = '20px sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(`SCORE: ${this.score}`, W / 2, 30);
  }

  // external API
  public flap() {
    if (this.gameOver) return;
    this.birdV = FLAP_FORCE;
  }

  setPaused(paused: boolean) {
    this.paused = paused;
  }

  endGame() {
    if (this.gameOver) return;
    this.gameOver = true;
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
  }
}

export const createFlappyPixelGame = (
  canvas: HTMLCanvasElement,
  callbacks: GameCallbacks,
  extra?: { palette?: PaletteRef | null },
) => new FlappyPixelEngine(canvas, callbacks, extra);
