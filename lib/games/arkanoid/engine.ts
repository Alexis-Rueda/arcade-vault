import type { GameCallbacks, GameEngine, PaletteRef } from '../types';
import {
  W,
  H,
  PADDLE_W,
  PADDLE_H,
  BALL_R,
  BLOCK_W,
  BLOCK_H,
  BLOCK_GAP,
  BLOCKS_OFFSET_Y,
  SCORE_PER_BLOCK,
  ROW_COLORS,
  LEVELS,
  BALL_SPEEDS,
  PALETTES,
} from './constants';
import type { RowColor } from './constants';
import { drawWallBorder } from '../drawWallBorder';

interface Block {
  x: number;
  y: number;
  w: number;
  h: number;
  color: RowColor;
  alive: boolean;
}

interface Explosion {
  x: number;
  y: number;
  w: number;
  h: number;
  color: RowColor;
  frames: { sx: number; sy: number; sw: number; sh: number }[];
  frameIndex: number;
  timer: number;
}

const EXPLOSION_FRAMES: Record<
  RowColor,
  { sx: number; sy: number; sw: number; sh: number }[]
> = {
  red: [
    { sx: 256, sy: 176, sw: 32, sh: 16 },
    { sx: 288, sy: 176, sw: 32, sh: 16 },
    { sx: 320, sy: 176, sw: 32, sh: 16 },
    { sx: 352, sy: 176, sw: 32, sh: 16 },
  ],
  cyan: [
    { sx: 256, sy: 192, sw: 32, sh: 16 },
    { sx: 288, sy: 192, sw: 32, sh: 16 },
    { sx: 320, sy: 192, sw: 32, sh: 16 },
    { sx: 352, sy: 192, sw: 32, sh: 16 },
  ],
  green: [
    { sx: 256, sy: 208, sw: 32, sh: 16 },
    { sx: 288, sy: 208, sw: 32, sh: 16 },
    { sx: 320, sy: 208, sw: 32, sh: 16 },
    { sx: 352, sy: 208, sw: 32, sh: 16 },
  ],
  magenta: [
    { sx: 256, sy: 224, sw: 32, sh: 16 },
    { sx: 288, sy: 224, sw: 32, sh: 16 },
    { sx: 320, sy: 224, sw: 32, sh: 16 },
    { sx: 352, sy: 224, sw: 32, sh: 16 },
  ],
  yellow: [
    { sx: 256, sy: 240, sw: 32, sh: 16 },
    { sx: 288, sy: 240, sw: 32, sh: 16 },
    { sx: 320, sy: 240, sw: 32, sh: 16 },
    { sx: 352, sy: 240, sw: 32, sh: 16 },
  ],
  hotpink: [
    { sx: 256, sy: 256, sw: 32, sh: 16 },
    { sx: 288, sy: 256, sw: 32, sh: 16 },
    { sx: 320, sy: 256, sw: 32, sh: 16 },
    { sx: 352, sy: 256, sw: 32, sh: 16 },
  ],
};

const SPRITES = {
  paddle: { sx: 32, sy: 112, sw: 162, sh: 14 },
  ball: { sx: 32, sy: 32, sw: 16, sh: 16 },
  blocks: {
    gray: { sx: 32, sy: 288, sw: 32, sh: 16 },
    red: { sx: 32, sy: 176, sw: 32, sh: 16 },
    yellow: { sx: 32, sy: 240, sw: 32, sh: 16 },
    cyan: { sx: 32, sy: 192, sw: 32, sh: 16 },
    magenta: { sx: 32, sy: 224, sw: 32, sh: 16 },
    hotpink: { sx: 32, sy: 256, sw: 32, sh: 16 },
    green: { sx: 32, sy: 208, sw: 32, sh: 16 },
  },
};

type GameScreen = 'title' | 'playing' | 'transition';
type GameState = 'playing' | 'lifelost' | 'gameover' | 'victory';

export class ArkanoidEngine implements GameEngine {
  private ctx: CanvasRenderingContext2D;
  private callbacks: GameCallbacks;
  private paletteRef: PaletteRef | null = null;

  private ssImg: HTMLImageElement | null = null;
  private ssLoaded = false;

  private score = 0;
  private lives = 3;
  private levelIndex = 0;
  private screen: GameScreen = 'title';
  private state: GameState = 'playing';
  private transitionTimer = 0;

  private paddle = { x: 350, y: 570, w: PADDLE_W, h: PADDLE_H };
  private ball = { x: 400, y: 560, r: BALL_R, vx: 0, vy: 0, active: false };
  private blocks: Block[] = [];
  private explosions: Explosion[] = [];

  private keys: Record<string, boolean> = {};
  private paused = false;
  private gameOver = false;
  private running = false;
  private rafId = 0;
  private lastTime: number | null = null;

  private levelButtons: { x: number; y: number; w: number; h: number }[] = [];
  private selectedLevel = 0;

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
    canvas.addEventListener('mousemove', this.onMouseMove);
    canvas.addEventListener('click', this.onClick);
    canvas.addEventListener('contextmenu', this.onContextMenu);

    this.loadSpritesheet();
  }

  // Paleta activa: se lee en cada tick → cambio de skin instantáneo sin remount.
  // Arkanoid usa el formato Record; el array pertenece al patrón Tetris.
  private getColors(): Record<string, string> {
    const cur = this.paletteRef?.current;
    return cur && !Array.isArray(cur) ? cur : PALETTES.clasico;
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
    img.src = '/games/arkanoid/spritesheet.png';
  }

  private startGame() {
    this.score = 0;
    this.lives = 3;
    this.levelIndex = 0;
    this.selectedLevel = 0;
    this.screen = 'title';
    this.state = 'playing';
    this.gameOver = false;
    this.running = true;
    this.notifyHUD();
    this.rafId = requestAnimationFrame(this.loop);
  }

  private onKeyDown = (e: KeyboardEvent) => {
    const key = e.key;
    const code = e.code;
    this.keys[code] = true;
    this.keys[key] = true;
    if (this.screen === 'title') {
      if (code === 'ArrowUp' || key === 'w') {
        this.selectedLevel = Math.max(0, this.selectedLevel - 1);
      } else if (code === 'ArrowDown' || key === 's') {
        this.selectedLevel = Math.min(
          LEVELS.length - 1,
          this.selectedLevel + 1,
        );
      } else if (code === 'Enter' || code === 'Space' || key === ' ') {
        this.loadLevel(this.selectedLevel);
      }
      return;
    }
    if (
      (code === 'KeyP' || code === 'Escape' || key === 'p') &&
      this.screen === 'playing'
    ) {
      this.paused = !this.paused;
    }
    if (code === 'Space' || key === ' ') {
      this.launchBall();
    }
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys[e.code] = false;
    this.keys[e.key] = false;
  };

  private onMouseMove = (e: MouseEvent) => {
    const rect = (this.ctx.canvas as HTMLCanvasElement).getBoundingClientRect();
    const scaleX = W / rect.width;
    this.paddle.x = (e.clientX - rect.left) * scaleX - this.paddle.w / 2;
    this.paddle.x = Math.max(0, Math.min(W - this.paddle.w, this.paddle.x));
  };

  private onClick = (e: MouseEvent) => {
    if (this.screen === 'title') {
      const rect = (
        this.ctx.canvas as HTMLCanvasElement
      ).getBoundingClientRect();
      const scaleX = W / rect.width;
      const scaleY = H / rect.height;
      const mx = (e.clientX - rect.left) * scaleX;
      const my = (e.clientY - rect.top) * scaleY;
      for (let i = 0; i < this.levelButtons.length; i++) {
        const b = this.levelButtons[i];
        if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
          this.loadLevel(i);
          return;
        }
      }
      return;
    }
    if (
      this.gameOver ||
      this.state === 'gameover' ||
      this.state === 'victory'
    ) {
      this.startGame();
      return;
    }
    this.launchBall();
  };

  private onContextMenu = (e: Event) => {
    e.preventDefault();
    if (this.screen === 'playing') {
      this.paused = !this.paused;
    }
  };

  private launchBall() {
    if (
      (this.state === 'playing' || this.state === 'lifelost') &&
      !this.ball.active
    ) {
      const speed = BALL_SPEEDS[this.levelIndex];
      this.ball.vx = speed;
      this.ball.vy = -speed;
      this.ball.active = true;
      this.state = 'playing';
    }
  }

  private notifyHUD() {
    this.callbacks.onScore?.(this.score);
    this.callbacks.onLives?.(this.lives);
    this.callbacks.onLevel?.(this.levelIndex + 1);
  }

  private initBlocks() {
    this.blocks = [];
    const lvl = LEVELS[this.levelIndex];
    const totalW = lvl.cols * BLOCK_W + (lvl.cols - 1) * BLOCK_GAP;
    const offsetX = (W - totalW) / 2;
    for (let r = 0; r < lvl.rows; r++) {
      for (let c = 0; c < lvl.cols; c++) {
        const val = lvl.grid[r][c];
        if (val === 0) continue;
        this.blocks.push({
          x: offsetX + c * (BLOCK_W + BLOCK_GAP),
          y: BLOCKS_OFFSET_Y + r * (BLOCK_H + BLOCK_GAP),
          w: BLOCK_W,
          h: BLOCK_H,
          color: ROW_COLORS[val - 1],
          alive: true,
        });
      }
    }
  }

  private loadLevel(index: number) {
    this.levelIndex = index;
    this.screen = 'playing';
    this.state = 'playing';
    this.initBlocks();
    this.paddle.x = (W - this.paddle.w) / 2;
    this.ball.x = W / 2;
    this.ball.y = 560;
    this.ball.vx = 0;
    this.ball.vy = 0;
    this.ball.active = false;
    this.explosions = [];
  }

  private update() {
    if (this.screen === 'title' || this.paused || this.gameOver) return;

    if (this.screen === 'transition') {
      this.transitionTimer -= 16;
      if (this.transitionTimer <= 0) {
        this.loadLevel(this.levelIndex);
      }
      return;
    }

    if (this.keys['ArrowLeft'] || this.keys['a']) this.paddle.x -= 6;
    if (this.keys['ArrowRight'] || this.keys['d']) this.paddle.x += 6;
    this.paddle.x = Math.max(0, Math.min(W - this.paddle.w, this.paddle.x));

    if (!this.ball.active) {
      this.ball.x = this.paddle.x + this.paddle.w / 2;
      this.ball.y = this.paddle.y - this.ball.r;
      return;
    }

    this.ball.x += this.ball.vx;
    this.ball.y += this.ball.vy;

    if (this.ball.x - this.ball.r <= 0) {
      this.ball.x = this.ball.r;
      this.ball.vx = -this.ball.vx;
      this.playSound('ball-bounce');
    }
    if (this.ball.x + this.ball.r >= W) {
      this.ball.x = W - this.ball.r;
      this.ball.vx = -this.ball.vx;
      this.playSound('ball-bounce');
    }
    if (this.ball.y - this.ball.r <= 0) {
      this.ball.y = this.ball.r;
      this.ball.vy = -this.ball.vy;
      this.playSound('ball-bounce');
    }

    if (
      this.ball.vy > 0 &&
      this.ball.y + this.ball.r >= this.paddle.y &&
      this.ball.y + this.ball.r <=
        this.paddle.y + this.paddle.h + this.ball.vy &&
      this.ball.x >= this.paddle.x - this.ball.r &&
      this.ball.x <= this.paddle.x + this.paddle.w + this.ball.r
    ) {
      this.ball.vy = -this.ball.vy;
      this.ball.y = this.paddle.y - this.ball.r;
      this.playSound('ball-bounce');
    }

    for (const b of this.blocks) {
      if (!b.alive) continue;
      if (
        this.ball.x + this.ball.r > b.x &&
        this.ball.x - this.ball.r < b.x + b.w &&
        this.ball.y + this.ball.r > b.y &&
        this.ball.y - this.ball.r < b.y + b.h
      ) {
        b.alive = false;
        this.playSound('break-sound');
        this.explosions.push({
          x: b.x,
          y: b.y,
          w: BLOCK_W,
          h: BLOCK_H,
          color: b.color,
          frames: EXPLOSION_FRAMES[b.color],
          frameIndex: 0,
          timer: 0,
        });
        this.score += SCORE_PER_BLOCK;
        this.notifyHUD();
        const overlapX = Math.min(
          this.ball.x + this.ball.r - b.x,
          b.x + b.w - (this.ball.x - this.ball.r),
        );
        const overlapY = Math.min(
          this.ball.y + this.ball.r - b.y,
          b.y + b.h - (this.ball.y - this.ball.r),
        );
        if (overlapX < overlapY) {
          this.ball.vx = -this.ball.vx;
        } else {
          this.ball.vy = -this.ball.vy;
        }
        break;
      }
    }

    for (let i = this.explosions.length - 1; i >= 0; i--) {
      const e = this.explosions[i];
      e.timer += 16;
      if (e.timer >= 150) {
        this.explosions.splice(i, 1);
      } else {
        e.frameIndex = Math.floor((e.timer / 150) * e.frames.length);
      }
    }

    if (this.blocks.every((b) => !b.alive) && this.explosions.length === 0) {
      if (this.levelIndex >= LEVELS.length - 1) {
        this.state = 'victory';
        this.gameOver = true;
        this.callbacks.onGameOver?.(this.score);
      } else {
        this.screen = 'transition';
        this.levelIndex++;
        this.transitionTimer = 2000;
        this.notifyHUD();
      }
    }

    if (this.ball.y - this.ball.r > H) {
      this.lives--;
      this.ball.active = false;
      this.notifyHUD();
      if (this.lives > 0) {
        this.state = 'lifelost';
      } else {
        this.state = 'gameover';
        this.gameOver = true;
        this.callbacks.onGameOver?.(this.score);
      }
    }
  }

  private draw() {
    const ctx = this.ctx;
    const colors = this.getColors();
    ctx.fillStyle = colors.field;
    ctx.fillRect(0, 0, W, H);

    drawWallBorder(ctx, W, H);

    if (this.screen === 'title') {
      this.drawTitle(colors);
      return;
    }

    this.drawPaddle(colors);
    this.drawBall(colors);
    this.drawBlocks(colors);
    this.drawExplosions(colors);

    ctx.fillStyle = colors.hud;
    ctx.fillRect(0, 0, W, 32);
    ctx.fillStyle = colors.hudText;
    ctx.font = '16px monospace';
    ctx.textAlign = 'left';
    ctx.fillText(`PUNTOS: ${this.score}`, 10, 22);
    ctx.textAlign = 'right';
    ctx.fillText(`VIDAS: ${'♥'.repeat(this.lives)}`, W - 10, 22);

    if (this.screen === 'transition') {
      ctx.fillStyle = colors.overlay;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = colors.accent;
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`¡NIVEL ${this.levelIndex + 1}!`, W / 2, H / 2 - 20);
      ctx.fillStyle = colors.text;
      ctx.font = '18px monospace';
      ctx.fillText(
        `Nivel ${this.levelIndex + 1} - ${LEVELS[this.levelIndex].name}`,
        W / 2,
        H / 2 + 20,
      );
      return;
    }

    if (this.paused) {
      ctx.fillStyle = colors.overlay;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = colors.text;
      ctx.font = '36px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PAUSA', W / 2, 60);
      return;
    }

    if (this.state === 'lifelost') {
      ctx.fillStyle = colors.overlay;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = colors.text;
      ctx.font = '24px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(
        `VIDAS RESTANTES: ${this.lives} — PRESIONA ESPACIO`,
        W / 2,
        H / 2,
      );
    }

    if (this.state === 'gameover') {
      ctx.fillStyle = colors.overlay;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = colors.gameOver;
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('GAME OVER', W / 2, H / 2 - 20);
      ctx.fillStyle = colors.text;
      ctx.font = '18px monospace';
      ctx.fillText('Haz clic para reiniciar', W / 2, H / 2 + 30);
    }

    if (this.state === 'victory') {
      ctx.fillStyle = colors.overlay;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = colors.victory;
      ctx.font = '48px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('¡GANASTE!', W / 2, H / 2 - 20);
      ctx.fillStyle = colors.text;
      ctx.font = '18px monospace';
      ctx.fillText('Haz clic para reiniciar', W / 2, H / 2 + 30);
    }
  }

  // En clasico se conserva el spritesheet original (sin cambio visual);
  // retro/neon dibujan figuras planas con brillo de alto contraste.
  private isClassic(colors: Record<string, string>): boolean {
    return colors.skinId === 'clasico';
  }

  private drawPaddle(colors: Record<string, string>) {
    const ctx = this.ctx;
    if (this.ssLoaded && this.isClassic(colors)) {
      this.drawSprite(
        'paddle',
        this.paddle.x,
        this.paddle.y,
        this.paddle.w,
        this.paddle.h,
      );
      return;
    }
    ctx.save();
    ctx.fillStyle = colors.paddle;
    ctx.shadowColor = colors.paddle;
    ctx.shadowBlur = 14;
    ctx.fillRect(this.paddle.x, this.paddle.y, this.paddle.w, this.paddle.h);
    ctx.shadowBlur = 0;
    ctx.fillStyle = 'rgba(255,255,255,0.35)';
    ctx.fillRect(this.paddle.x, this.paddle.y, this.paddle.w, 4);
    ctx.restore();
  }

  private drawBall(colors: Record<string, string>) {
    const ctx = this.ctx;
    if (this.ssLoaded && this.isClassic(colors)) {
      const sp = SPRITES.ball;
      ctx.drawImage(
        this.ssImg!,
        sp.sx,
        sp.sy,
        sp.sw,
        sp.sh,
        this.ball.x - this.ball.r,
        this.ball.y - this.ball.r,
        this.ball.r * 2,
        this.ball.r * 2,
      );
      return;
    }
    ctx.save();
    ctx.fillStyle = colors.ball;
    ctx.shadowColor = colors.ball;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(this.ball.x, this.ball.y, this.ball.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  private drawBlocks(colors: Record<string, string>) {
    const ctx = this.ctx;
    for (const b of this.blocks) {
      if (!b.alive) continue;
      if (this.ssLoaded && this.isClassic(colors)) {
        this.drawSprite('block_' + b.color, b.x, b.y, b.w, b.h);
        continue;
      }
      const fill = colors['block' + (ROW_COLORS.indexOf(b.color) + 1)];
      ctx.save();
      ctx.fillStyle = fill;
      ctx.shadowColor = fill;
      ctx.shadowBlur = 8;
      ctx.fillRect(b.x, b.y, b.w, b.h);
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,255,255,0.22)';
      ctx.fillRect(b.x, b.y, b.w, 3);
      ctx.restore();
    }
  }

  private drawExplosions(colors: Record<string, string>) {
    const ctx = this.ctx;
    for (const e of this.explosions) {
      if (this.isClassic(colors) && this.ssLoaded && e.frames[e.frameIndex]) {
        const f = e.frames[e.frameIndex];
        ctx.drawImage(this.ssImg!, f.sx, f.sy, f.sw, f.sh, e.x, e.y, e.w, e.h);
        continue;
      }
      const fill = colors['block' + (ROW_COLORS.indexOf(e.color) + 1)];
      ctx.save();
      ctx.globalAlpha = 1 - e.timer / 150;
      ctx.fillStyle = fill;
      ctx.fillRect(e.x, e.y, e.w, e.h);
      ctx.restore();
    }
  }

  private drawTitle(colors: Record<string, string>) {
    const ctx = this.ctx;
    ctx.fillStyle = colors.text;
    ctx.font = '48px monospace';
    ctx.textAlign = 'center';
    ctx.fillText('ARKANOID', W / 2, 80);
    ctx.font = '20px monospace';
    ctx.fillText('Selecciona un nivel:', W / 2, 130);
    const startY = 170;
    const itemH = 44;
    const gap = 6;
    this.levelButtons = [];
    for (let i = 0; i < LEVELS.length; i++) {
      const y = startY + i * (itemH + gap);
      this.levelButtons.push({ x: 300, y, w: 200, h: itemH });
      ctx.fillStyle =
        i === this.selectedLevel ? colors.accentSelected : colors.accentDim;
      ctx.fillRect(300, y, 200, itemH);
      ctx.fillStyle = colors.text;
      ctx.font = '16px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(`Nivel ${i + 1} - ${LEVELS[i].name}`, W / 2, y + 28);
    }
    ctx.font = '14px monospace';
    ctx.fillStyle = colors.textDim;
    ctx.fillText('Haz clic en un nivel para comenzar', W / 2, 560);
  }

  private drawSprite(name: string, x: number, y: number, w: number, h: number) {
    if (!this.ssLoaded) {
      this.ctx.fillStyle = this.getColors().textDim;
      this.ctx.fillRect(x, y, w, h);
      return;
    }
    let sp: { sx: number; sy: number; sw: number; sh: number } | undefined;
    if (name.startsWith('block_')) {
      const color = name.slice(6);
      if (color in SPRITES.blocks) {
        sp = SPRITES.blocks[color as keyof typeof SPRITES.blocks];
      }
    } else if (name === 'paddle') {
      sp = SPRITES.paddle;
    } else if (name === 'ball') {
      sp = SPRITES.ball;
    }
    if (!sp) return;
    this.ctx.drawImage(this.ssImg!, sp.sx, sp.sy, sp.sw, sp.sh, x, y, w, h);
  }

  private playSound(name: string) {
    try {
      const audio = new Audio(`/games/arkanoid/${name}.mp3`);
      audio.play().catch(() => {});
    } catch {}
  }

  private loop = (ts: number) => {
    if (!this.running) return;
    this.lastTime = ts;
    if (!this.paused) {
      this.update();
    }
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
    const canvas = this.ctx.canvas as HTMLCanvasElement;
    canvas.removeEventListener('mousemove', this.onMouseMove);
    canvas.removeEventListener('click', this.onClick);
    canvas.removeEventListener('contextmenu', this.onContextMenu);
  }

  setPaused(paused: boolean) {
    this.paused = paused;
  }

  endGame() {
    if (this.gameOver) return;
    this.gameOver = true;
    this.state = 'gameover';
    this.callbacks.onGameOver?.(this.score);
  }
}
