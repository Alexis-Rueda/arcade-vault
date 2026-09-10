import type { GameCallbacks, GameEngine, PaletteRef } from '../types';
import {
  W,
  H,
  CELL,
  COLS,
  ROWS,
  MAX_DT,
  BASE_TICK,
  MIN_TICK,
  SPEED_INTERVAL,
  POINTS_PER_FRUIT,
  PALETTES,
} from './constants';
import { drawWallBorder } from '../drawWallBorder';

/* ── Module-level constants (P1) ── */
const FONT_HUD = '16px monospace';
const FONT_PAUSE = '36px monospace';
const FONT_GAMEOVER = '48px monospace';
const FONT_GAMEOVER_SUB = '18px monospace';

// Coordenadas de recorte de cada fruta dentro de fruits.png
const FRUIT_SPRITES: { x: number; y: number; w: number; h: number }[] = [
  { x: 34, y: 136, w: 110, h: 160 },
  { x: 186, y: 136, w: 150, h: 160 },
  { x: 378, y: 136, w: 110, h: 160 },
  { x: 540, y: 136, w: 130, h: 160 },
  { x: 712, y: 136, w: 130, h: 160 },
  { x: 894, y: 136, w: 110, h: 160 },
  { x: 1066, y: 136, w: 110, h: 160 },
  { x: 1228, y: 136, w: 130, h: 160 },
  { x: 1400, y: 136, w: 130, h: 160 },
  { x: 1582, y: 136, w: 110, h: 160 },
  { x: 1734, y: 136, w: 150, h: 160 },
  { x: 1906, y: 136, w: 150, h: 160 },
  { x: 2068, y: 136, w: 170, h: 160 },
  { x: 2250, y: 136, w: 140, h: 160 },
  { x: 2432, y: 136, w: 130, h: 160 },
  { x: 2604, y: 136, w: 130, h: 160 },
  { x: 2786, y: 136, w: 110, h: 160 },
  { x: 2948, y: 136, w: 130, h: 160 },
  { x: 3110, y: 136, w: 150, h: 160 },
  { x: 3302, y: 136, w: 110, h: 160 },
  { x: 3454, y: 136, w: 150, h: 160 },
  { x: 3637, y: 136, w: 130, h: 160 },
];

type Direction = 'up' | 'down' | 'left' | 'right';

interface Point {
  x: number;
  y: number;
}

const OPPOSITE: Record<Direction, Direction> = {
  up: 'down',
  down: 'up',
  left: 'right',
  right: 'left',
};

const DIR_VECTOR: Record<Direction, Point> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

// Escala un color hex hacia negro por un factor [0,1] (usado en el degradado del cuerpo)
function shade(hex: string, factor: number): string {
  const n = parseInt(hex.slice(1), 16);
  const r = Math.floor(((n >> 16) & 255) * factor);
  const g = Math.floor(((n >> 8) & 255) * factor);
  const b = Math.floor((n & 255) * factor);
  return `rgb(${r},${g},${b})`;
}

export class SnakeEngine implements GameEngine {
  private ctx: CanvasRenderingContext2D;
  private callbacks: GameCallbacks;
  private paletteRef: PaletteRef | null = null;

  private ssImg: HTMLImageElement | null = null;
  private ssLoaded = false;

  private score = 0;
  private level = 1;
  private fruitsEaten = 0;
  private state: 'playing' | 'gameover' = 'playing';

  private snake: Point[] = [];
  private direction: Direction = 'right';
  private pendingDirection: Direction | null = null;

  private fruit: Point = { x: 0, y: 0 };
  private fruitSpriteIndex = 0;

  private paused = false;
  private gameOver = false;
  private running = false;
  private rafId = 0;
  private lastTime: number | null = null;
  private tickAccumulator = 0;
  private tickInterval = BASE_TICK;
  private pauseDrawn = false; // P2: solo un frame al entrar en pausa

  private cachedColors: Record<string, string> = PALETTES.clasico; // P5
  private snakeCells = new Set<string>(); // P4: lookup O(1) para spawnFruit

  private keys: Record<string, boolean> = {};

  constructor(
    canvas: HTMLCanvasElement,
    callbacks: GameCallbacks,
    extra?: {
      previewCanvas?: HTMLCanvasElement | null;
      palette?: PaletteRef | null;
    },
  ) {
    this.ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
    this.callbacks = callbacks;
    this.paletteRef = extra?.palette ?? null;

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);

    this.loadSpritesheet();
  }

  // Paleta activa: cacheada por frame (P5).
  private getColors(): Record<string, string> {
    const cur = this.paletteRef?.current;
    const next = cur && !Array.isArray(cur) ? cur : PALETTES.clasico;
    this.cachedColors = next;
    return next;
  }

  // P4: reconstruir Set de celdas ocupadas (O(1) lookup para spawnFruit)
  private rebuildSnakeCells() {
    this.snakeCells.clear();
    for (const s of this.snake) {
      this.snakeCells.add(`${s.x},${s.y}`);
    }
  }

  private loadSpritesheet() {
    const img = new Image();
    img.onload = () => {
      this.ssImg = img;
      this.ssLoaded = true;
      this.startGame();
    };
    img.onerror = () => {
      this.ssLoaded = false;
      this.startGame();
    };
    img.src = '/references/source-assets/snake-assets/fruits.png';
  }

  private startGame() {
    this.score = 0;
    this.level = 1;
    this.fruitsEaten = 0;
    this.state = 'playing';
    this.gameOver = false;
    this.tickInterval = BASE_TICK;
    this.tickAccumulator = 0;
    this.lastTime = null;
    this.direction = 'right';
    this.pendingDirection = null;
    this.pauseDrawn = false;

    // Serpiente inicial: 3 segmentos en el centro, yendo a la derecha
    const startX = Math.floor(COLS / 2);
    const startY = Math.floor(ROWS / 2);
    this.snake = [
      { x: startX, y: startY },
      { x: startX - 1, y: startY },
      { x: startX - 2, y: startY },
    ];
    this.rebuildSnakeCells(); // P4

    this.spawnFruit();
    this.notifyHUD();
    this.running = true;
    this.rafId = requestAnimationFrame(this.loop);
  }

  private onKeyDown = (e: KeyboardEvent) => {
    this.keys[e.code] = true;

    if (this.gameOver) return;

    let dir: Direction | null = null;
    if (e.code === 'KeyW' || e.code === 'ArrowUp') dir = 'up';
    else if (e.code === 'KeyS' || e.code === 'ArrowDown') dir = 'down';
    else if (e.code === 'KeyA' || e.code === 'ArrowLeft') dir = 'left';
    else if (e.code === 'KeyD' || e.code === 'ArrowRight') dir = 'right';

    if (dir) {
      e.preventDefault();
      // Prevenir giro de 180°
      if (dir !== OPPOSITE[this.direction]) {
        this.pendingDirection = dir;
      }
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys[e.code] = false;
  };

  private notifyHUD() {
    this.callbacks.onScore?.(this.score);
    this.callbacks.onLevel?.(this.level);
  }

  private spawnFruit() {
    let pos: Point;
    // P4: uso del Set para lookup O(1) en vez de Array.some()
    do {
      pos = {
        x: Math.floor(Math.random() * COLS),
        y: Math.floor(Math.random() * ROWS),
      };
    } while (this.snakeCells.has(`${pos.x},${pos.y}`));
    this.fruit = pos;
    this.fruitSpriteIndex = Math.floor(Math.random() * FRUIT_SPRITES.length);
  }

  private tick() {
    if (this.state !== 'playing') return;

    // Aplicar dirección pendiente
    if (this.pendingDirection !== null) {
      this.direction = this.pendingDirection;
      this.pendingDirection = null;
    }

    const head = this.snake[0];
    const vec = DIR_VECTOR[this.direction];
    const newHead: Point = { x: head.x + vec.x, y: head.y + vec.y };

    // Colisión con pared
    if (
      newHead.x < 0 ||
      newHead.x >= COLS ||
      newHead.y < 0 ||
      newHead.y >= ROWS
    ) {
      this.triggerGameOver();
      return;
    }

    // Colisión con自身 (excluyendo la cola que va a desaparecer)
    const willEat = newHead.x === this.fruit.x && newHead.y === this.fruit.y;
    const bodyToCheck = willEat ? this.snake : this.snake.slice(0, -1);
    if (bodyToCheck.some((s) => s.x === newHead.x && s.y === newHead.y)) {
      this.triggerGameOver();
      return;
    }

    this.snake.unshift(newHead);
    this.snakeCells.add(`${newHead.x},${newHead.y}`); // P4

    if (willEat) {
      this.score += POINTS_PER_FRUIT;
      this.fruitsEaten++;
      this.notifyHUD();

      // Subir nivel cada SPEED_INTERVAL frutas
      if (this.fruitsEaten % SPEED_INTERVAL === 0) {
        this.level = Math.floor(this.fruitsEaten / SPEED_INTERVAL) + 1;
        this.tickInterval = Math.max(
          MIN_TICK,
          BASE_TICK - (this.level - 1) * 20,
        );
        this.notifyHUD();
      }

      this.spawnFruit();
    } else {
      const tail = this.snake.pop()!;
      this.snakeCells.delete(`${tail.x},${tail.y}`); // P4
    }
  }

  private triggerGameOver() {
    this.state = 'gameover';
    this.gameOver = true;
    this.callbacks.onGameOver?.(this.score);
  }

  private draw() {
    const ctx = this.ctx;
    const colors = this.getColors(); // P5: retorna cachedColors
    ctx.clearRect(0, 0, W, H); // Auditoría general: limpiar canvas antes de dibujar
    ctx.fillStyle = colors.field;
    ctx.fillRect(0, 0, W, H);

    // Dibujar grilla sutil
    ctx.strokeStyle = colors.grid;
    ctx.lineWidth = 1;
    for (let x = 0; x <= COLS; x++) {
      ctx.beginPath();
      ctx.moveTo(x * CELL, 0);
      ctx.lineTo(x * CELL, H);
      ctx.stroke();
    }
    for (let y = 0; y <= ROWS; y++) {
      ctx.beginPath();
      ctx.moveTo(0, y * CELL);
      ctx.lineTo(W, y * CELL);
      ctx.stroke();
    }

    // Borde de pared (zona de peligro)
    drawWallBorder(ctx, W, H);

    // Dibujar fruta
    if (this.ssLoaded && this.ssImg) {
      const sp = FRUIT_SPRITES[this.fruitSpriteIndex];
      ctx.drawImage(
        this.ssImg,
        sp.x,
        sp.y,
        sp.w,
        sp.h,
        this.fruit.x * CELL + 2,
        this.fruit.y * CELL + 2,
        CELL - 4,
        CELL - 4,
      );
    } else {
      // Fallback: círculo rojo
      ctx.fillStyle = colors.gameOver;
      ctx.beginPath();
      ctx.arc(
        this.fruit.x * CELL + CELL / 2,
        this.fruit.y * CELL + CELL / 2,
        CELL / 2 - 4,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }

    // Dibujar serpiente
    for (let i = 0; i < this.snake.length; i++) {
      const seg = this.snake[i];
      const isHead = i === 0;
      const intensity = isHead ? 1 : 0.6 + 0.4 * (1 - i / this.snake.length);
      ctx.fillStyle = isHead
        ? colors.player
        : shade(colors.playerBody, intensity);
      ctx.fillRect(seg.x * CELL + 1, seg.y * CELL + 1, CELL - 2, CELL - 2);

      // Borde de brillo en la cabeza
      if (isHead) {
        ctx.strokeStyle = colors.player;
        ctx.lineWidth = 2;
        ctx.strokeRect(seg.x * CELL + 1, seg.y * CELL + 1, CELL - 2, CELL - 2);
      }
    }

    // HUD en canvas (font cache: constante de módulo)
    ctx.fillStyle = colors.hudBg;
    ctx.fillRect(0, 0, W, 32);
    ctx.fillStyle = colors.hudText;
    ctx.font = FONT_HUD;
    ctx.textAlign = 'left';
    ctx.fillText(`SCORE: ${this.score}`, 10, 22);
    ctx.textAlign = 'right';
    ctx.fillText(`LEVEL: ${this.level}`, W - 10, 22);

    // Overlay pausa
    if (this.paused) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = colors.pause;
      ctx.font = FONT_PAUSE;
      ctx.textAlign = 'center';
      ctx.fillText('EN PAUSA', W / 2, H / 2);
    }

    // Overlay game over
    if (this.state === 'gameover') {
      ctx.fillStyle = 'rgba(0,0,0,0.7)';
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = colors.gameOver;
      ctx.font = FONT_GAMEOVER;
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', W / 2, H / 2 - 20);
      ctx.fillStyle = colors.text;
      ctx.font = FONT_GAMEOVER_SUB;
      ctx.fillText(`PUNTUACIÓN: ${this.score}`, W / 2, H / 2 + 20);
    }
  }

  private loop = (ts: number) => {
    if (!this.running) return;

    const dt =
      this.lastTime === null ? 0 : Math.min(ts - this.lastTime, MAX_DT);
    this.lastTime = ts;

    if (!this.paused && this.state === 'playing') {
      this.tickAccumulator += dt;
      while (this.tickAccumulator >= this.tickInterval) {
        this.tickAccumulator -= this.tickInterval;
        this.tick();
        if (this.state !== 'playing') break;
      }
    }

    // P2: solo dibujar un frame al entrar en pausa, luego congelar canvas
    if (this.paused) {
      if (!this.pauseDrawn) {
        this.draw();
        this.pauseDrawn = true;
      }
      this.rafId = requestAnimationFrame(this.loop);
      return;
    }
    this.pauseDrawn = false;

    this.draw();
    this.rafId = requestAnimationFrame(this.loop);
  };

  reset() {
    this.startGame();
  }

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.rafId);
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
  }

  setPaused(paused: boolean) {
    this.paused = paused;
  }

  endGame() {
    if (this.gameOver) return;
    this.triggerGameOver();
  }
}
