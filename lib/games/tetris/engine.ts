import type { GameCallbacks, GameEngine } from '../types';
import {
  COLS,
  ROWS,
  BLOCK,
  MAX_DT,
  GRID_LINE,
  COLORS,
  PIECES,
  LINE_SCORES,
} from './constants';

type Piece = { type: number; shape: number[][]; x: number; y: number };

function createBoard(): number[][] {
  return Array.from({ length: ROWS }, () => new Array<number>(COLS).fill(0));
}

function randomPiece(): Piece {
  const type = Math.floor(Math.random() * 8) + 1;
  const shape = PIECES[type]!.map((row) => [...row]);
  return {
    type,
    shape,
    x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2),
    y: 0,
  };
}

function collide(
  board: number[][],
  shape: number[][],
  ox: number,
  oy: number,
): boolean {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (!shape[r][c]) continue;
      const nx = ox + c;
      const ny = oy + r;
      if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
      if (ny >= 0 && board[ny][nx]) return true;
    }
  }
  return false;
}

function rotateCW(shape: number[][]): number[][] {
  const rows = shape.length;
  const cols = shape[0].length;
  const result = Array.from({ length: cols }, () =>
    new Array<number>(rows).fill(0),
  );
  for (let r = 0; r < rows; r++)
    for (let c = 0; c < cols; c++) result[c][rows - 1 - r] = shape[r][c];
  return result;
}

function ghostY(
  board: number[][],
  shape: number[][],
  x: number,
  y: number,
): number {
  let gy = y;
  while (!collide(board, shape, x, gy + 1)) gy++;
  return gy;
}

function drawBlock(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  colorIndex: number,
  size: number,
  colors: (string | null)[],
  alpha?: number,
) {
  if (!colorIndex) return;
  const color = colors[colorIndex] as string;
  context.globalAlpha = alpha ?? 1;
  context.fillStyle = color;
  context.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
  context.fillStyle = 'rgba(255,255,255,0.12)';
  context.fillRect(x * size + 1, y * size + 1, size - 2, 4);
  context.globalAlpha = 1;
}

export class TetrisEngine implements GameEngine {
  private ctx: CanvasRenderingContext2D;
  private nextCtx: CanvasRenderingContext2D | null = null;
  private callbacks: GameCallbacks;
  private paletteRef: { current: (string | null)[] } | null = null;

  private board: number[][] = createBoard();
  private current!: Piece;
  private next!: Piece;
  private score = 0;
  private lines = 0;
  private level = 1;
  private paused = false;
  private gameOver = false;
  private running = false;
  private rafId = 0;
  private lastTime: number | null = null;
  private dropAccum = 0;
  private dropInterval = 1000;

  constructor(
    canvas: HTMLCanvasElement,
    callbacks: GameCallbacks,
    extra?: {
      previewCanvas?: HTMLCanvasElement | null;
      palette?: { current: (string | null)[] } | null;
    },
  ) {
    this.ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    this.nextCtx = extra?.previewCanvas?.getContext('2d') ?? null;
    this.paletteRef = extra?.palette ?? null;
    this.callbacks = callbacks;
    window.addEventListener('keydown', this.onKeyDown);
    this.initGame();
    this.running = true;
    this.rafId = requestAnimationFrame(this.loop);
  }

  private getColors() {
    return this.paletteRef?.current ?? COLORS;
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (this.paused || this.gameOver) return;
    switch (e.code) {
      case 'ArrowLeft':
        e.preventDefault();
        if (
          !collide(
            this.board,
            this.current.shape,
            this.current.x - 1,
            this.current.y,
          )
        )
          this.current.x--;
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (
          !collide(
            this.board,
            this.current.shape,
            this.current.x + 1,
            this.current.y,
          )
        )
          this.current.x++;
        break;
      case 'ArrowDown':
        e.preventDefault();
        this.softDrop();
        break;
      case 'ArrowUp':
      case 'KeyX':
        e.preventDefault();
        this.tryRotate();
        break;
      case 'Space':
        e.preventDefault();
        this.hardDrop();
        break;
    }
    this.notifyHUD();
  };

  private notifyHUD() {
    this.callbacks.onScore?.(this.score);
    this.callbacks.onLines?.(this.lines);
    this.callbacks.onLevel?.(this.level);
  }

  private initGame() {
    this.board = createBoard();
    this.score = 0;
    this.lines = 0;
    this.level = 1;
    this.gameOver = false;
    this.dropInterval = 1000;
    this.dropAccum = 0;
    this.lastTime = performance.now();
    this.next = randomPiece();
    this.spawn();
    this.notifyHUD();
    this.callbacks.onLives?.(1);
  }

  private tryRotate() {
    const rotated = rotateCW(this.current.shape);
    const kicks = [0, -1, 1, -2, 2];
    for (const kick of kicks) {
      if (
        !collide(this.board, rotated, this.current.x + kick, this.current.y)
      ) {
        this.current.shape = rotated;
        this.current.x += kick;
        return;
      }
    }
  }

  private merge() {
    for (let r = 0; r < this.current.shape.length; r++)
      for (let c = 0; c < this.current.shape[r].length; c++)
        if (this.current.shape[r][c])
          this.board[this.current.y + r][this.current.x + c] =
            this.current.shape[r][c];
  }

  private clearLines() {
    let cleared = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (this.board[r].every((v) => v !== 0)) {
        this.board.splice(r, 1);
        this.board.unshift(new Array<number>(COLS).fill(0));
        cleared++;
        r++;
      }
    }
    if (cleared) {
      this.lines += cleared;
      this.score += (LINE_SCORES[cleared] || 0) * this.level;
      this.level = Math.floor(this.lines / 10) + 1;
      this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 90);
      this.notifyHUD();
    }
  }

  private hardDrop() {
    const gy = ghostY(
      this.board,
      this.current.shape,
      this.current.x,
      this.current.y,
    );
    this.score += (gy - this.current.y) * 2;
    this.current.y = gy;
    this.lockPiece();
  }

  private softDrop() {
    if (
      !collide(
        this.board,
        this.current.shape,
        this.current.x,
        this.current.y + 1,
      )
    ) {
      this.current.y++;
      this.score += 1;
      this.notifyHUD();
    } else {
      this.lockPiece();
    }
  }

  private lockPiece() {
    this.merge();
    this.clearLines();
    this.spawn();
  }

  private spawn() {
    this.current = this.next;
    this.next = randomPiece();
    if (
      collide(this.board, this.current.shape, this.current.x, this.current.y)
    ) {
      this.endGame();
    }
    this.drawNext();
  }

  private drawGrid() {
    const ctx = this.ctx;
    ctx.strokeStyle = GRID_LINE;
    ctx.lineWidth = 0.5;
    for (let c = 1; c < COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(c * BLOCK, 0);
      ctx.lineTo(c * BLOCK, ROWS * BLOCK);
      ctx.stroke();
    }
    for (let r = 1; r < ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * BLOCK);
      ctx.lineTo(COLS * BLOCK, r * BLOCK);
      ctx.stroke();
    }
  }

  private draw() {
    const ctx = this.ctx;
    const colors = this.getColors();
    ctx.clearRect(0, 0, COLS * BLOCK, ROWS * BLOCK);
    this.drawGrid();

    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++)
        drawBlock(ctx, c, r, this.board[r][c], BLOCK, colors);

    const gy = ghostY(
      this.board,
      this.current.shape,
      this.current.x,
      this.current.y,
    );
    for (let r = 0; r < this.current.shape.length; r++)
      for (let c = 0; c < this.current.shape[r].length; c++)
        if (this.current.shape[r][c])
          drawBlock(
            ctx,
            this.current.x + c,
            gy + r,
            this.current.shape[r][c],
            BLOCK,
            colors,
            0.2,
          );

    for (let r = 0; r < this.current.shape.length; r++)
      for (let c = 0; c < this.current.shape[r].length; c++)
        drawBlock(
          ctx,
          this.current.x + c,
          this.current.y + r,
          this.current.shape[r][c],
          BLOCK,
          colors,
        );
    this.drawNext();
  }

  private drawNext() {
    const ctx = this.nextCtx;
    if (!ctx) return;
    const colors = this.getColors();
    const NB = 30;
    ctx.clearRect(0, 0, NB * 4, NB * 4);
    const shape = this.next.shape;
    const offX = Math.floor((4 - shape[0].length) / 2);
    const offY = Math.floor((4 - shape.length) / 2);
    for (let r = 0; r < shape.length; r++)
      for (let c = 0; c < shape[r].length; c++)
        drawBlock(ctx, offX + c, offY + r, shape[r][c], NB, colors);
  }

  private loop = (ts: number) => {
    if (!this.running) return;
    const dt =
      this.lastTime === null ? 0 : Math.min(ts - this.lastTime, MAX_DT);
    this.lastTime = ts;
    if (!this.paused) {
      this.dropAccum += dt;
      if (this.dropAccum >= this.dropInterval) {
        this.dropAccum = 0;
        if (
          !collide(
            this.board,
            this.current.shape,
            this.current.x,
            this.current.y + 1,
          )
        ) {
          this.current.y++;
        } else {
          this.lockPiece();
        }
      }
    }
    if (this.gameOver) return;
    this.draw();
    this.rafId = requestAnimationFrame(this.loop);
  };

  reset() {
    this.initGame();
    this.paused = false;
    this.running = true;
    cancelAnimationFrame(this.rafId);
    this.rafId = requestAnimationFrame(this.loop);
  }

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.rafId);
    window.removeEventListener('keydown', this.onKeyDown);
  }

  setPaused(paused: boolean) {
    this.paused = paused;
  }

  endGame() {
    if (this.gameOver) return;
    this.gameOver = true;
    this.callbacks.onLives?.(0);
    this.callbacks.onGameOver?.(this.score);
  }
}
