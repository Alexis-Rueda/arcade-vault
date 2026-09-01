import type { GameCallbacks, GameEngine, PaletteRef } from '../types';
import {
  W,
  H,
  MAX_DT,
  POWERUP_DROP_CHANCE,
  POWERUP_DURATION,
  POWERUP_TTL,
  TRIPLE_SPREAD,
  RADII,
  SPEEDS,
  POINTS,
  START_ASTEROIDS,
  SAFE_DIST,
  DEAD_TIMER,
  PALETTES,
} from './constants';

const wrap = (v: number, max: number) => ((v % max) + max) % max;
const dist = (a: { x: number; y: number }, b: { x: number; y: number }) =>
  Math.hypot(a.x - b.x, a.y - b.y);
const rand = (min: number, max: number) => min + Math.random() * (max - min);
const randInt = (min: number, max: number) => Math.floor(rand(min, max + 1));

class Bullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  ttl: number;
  radius = 2;
  dead = false;

  constructor(x: number, y: number, angle: number) {
    const SPEED = 520;
    this.x = x;
    this.y = y;
    this.vx = Math.cos(angle) * SPEED;
    this.vy = Math.sin(angle) * SPEED;
    this.ttl = 1.1;
  }

  update(dt: number) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw(ctx: CanvasRenderingContext2D, colors: Record<string, string>) {
    ctx.fillStyle = colors.player;
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
  }
}

class Asteroid {
  x: number;
  y: number;
  size: number;
  radius: number;
  dead = false;
  vx: number;
  vy: number;
  rotSpeed: number;
  rot: number;
  verts: Array<[number, number]> = [];

  constructor(x: number, y: number, size = 3) {
    this.x = x;
    this.y = y;
    this.size = size;
    this.radius = RADII[size];
    const angle = rand(0, Math.PI * 2);
    const speed = SPEEDS[size] + rand(-15, 15);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.rotSpeed = rand(-1.2, 1.2);
    this.rot = rand(0, Math.PI * 2);
    const n = randInt(8, 13);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const r = this.radius * rand(0.6, 1.0);
      this.verts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
  }

  update(dt: number) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.rot += this.rotSpeed * dt;
  }

  split() {
    if (this.size <= 1) return [];
    return [
      new Asteroid(this.x, this.y, this.size - 1),
      new Asteroid(this.x, this.y, this.size - 1),
    ];
  }

  draw(ctx: CanvasRenderingContext2D, colors: Record<string, string>) {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rot);
    ctx.strokeStyle = colors.player;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(this.verts[0][0], this.verts[0][1]);
    for (let i = 1; i < this.verts.length; i++)
      ctx.lineTo(this.verts[i][0], this.verts[i][1]);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }
}

class PowerUp {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius = 12;
  ttl: number;
  dead = false;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(20, 40);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.ttl = POWERUP_TTL;
  }

  update(dt: number) {
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw(ctx: CanvasRenderingContext2D, colors: Record<string, string>) {
    if (this.ttl < 2 && Math.floor(this.ttl * 8) % 2 === 0) return;
    const pulse = 0.85 + Math.sin(performance.now() / 150) * 0.15;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(Math.PI / 4);
    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = 2;
    const r = this.radius * pulse;
    ctx.strokeRect(-r, -r, r * 2, r * 2);
    ctx.restore();
    ctx.fillStyle = colors.accent;
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('3x', this.x, this.y);
  }
}

class Ship {
  tripleShot = 0;
  x = W / 2;
  y = H / 2;
  angle = -Math.PI / 2;
  vx = 0;
  vy = 0;
  radius = 12;
  thrusting = false;
  invincible = 3;
  shootCooldown = 0;
  dead = false;

  constructor() {
    this.reset();
  }

  reset() {
    this.x = W / 2;
    this.y = H / 2;
    this.angle = -Math.PI / 2;
    this.vx = 0;
    this.vy = 0;
    this.radius = 12;
    this.thrusting = false;
    this.invincible = 3;
    this.shootCooldown = 0;
    this.dead = false;
  }

  update(dt: number, keys: Record<string, boolean>) {
    if (this.dead) return;
    if (this.invincible > 0) this.invincible -= dt;
    if (this.shootCooldown > 0) this.shootCooldown -= dt;
    if (this.tripleShot > 0) this.tripleShot -= dt;

    const ROT = 3.5;
    const THRUST = 260;
    const DRAG = 0.987;

    if (keys['ArrowLeft'] || keys['a']) this.angle -= ROT * dt;
    if (keys['ArrowRight'] || keys['d']) this.angle += ROT * dt;

    this.thrusting = !!(keys['ArrowUp'] || keys['w']);
    if (this.thrusting) {
      this.vx += Math.cos(this.angle) * THRUST * dt;
      this.vy += Math.sin(this.angle) * THRUST * dt;
    }

    this.vx *= DRAG;
    this.vy *= DRAG;
    this.x = wrap(this.x + this.vx * dt, W);
    this.y = wrap(this.y + this.vy * dt, H);
  }

  tryShoot() {
    if (this.shootCooldown > 0 || this.dead) return [];
    this.shootCooldown = 0.2;
    const NOSE = 21;
    const ox = this.x + Math.cos(this.angle) * NOSE;
    const oy = this.y + Math.sin(this.angle) * NOSE;
    if (this.tripleShot > 0) {
      return [
        new Bullet(ox, oy, this.angle - TRIPLE_SPREAD),
        new Bullet(ox, oy, this.angle),
        new Bullet(ox, oy, this.angle + TRIPLE_SPREAD),
      ];
    }
    return [new Bullet(ox, oy, this.angle)];
  }

  draw(ctx: CanvasRenderingContext2D, colors: Record<string, string>) {
    if (this.dead) return;
    if (this.invincible > 0 && Math.floor(this.invincible * 8) % 2 === 0)
      return;

    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.angle);
    ctx.strokeStyle = colors.player;
    ctx.lineWidth = 1.5;
    ctx.lineJoin = 'round';

    ctx.beginPath();
    ctx.moveTo(20, 0);
    ctx.lineTo(-12, -9);
    ctx.lineTo(-7, 0);
    ctx.lineTo(-12, 9);
    ctx.closePath();
    ctx.stroke();

    if (this.thrusting && Math.random() > 0.35) {
      ctx.beginPath();
      ctx.moveTo(-8, -4);
      ctx.lineTo(-8 - rand(6, 14), 0);
      ctx.lineTo(-8, 4);
      ctx.strokeStyle = colors.accentDim;
      ctx.stroke();
    }

    ctx.restore();
  }
}

class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  ttl: number;
  dead = false;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    const angle = rand(0, Math.PI * 2);
    const speed = rand(30, 130);
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;
    this.life = rand(0.4, 1.1);
    this.ttl = this.life;
  }

  update(dt: number) {
    this.x += this.vx * dt;
    this.y += this.vy * dt;
    this.ttl -= dt;
    if (this.ttl <= 0) this.dead = true;
  }

  draw(ctx: CanvasRenderingContext2D, colors: Record<string, string>) {
    const alpha = this.ttl / this.life;
    ctx.globalAlpha = alpha;
    ctx.strokeStyle = colors.player;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(this.x, this.y);
    ctx.lineTo(this.x - this.vx * 0.05, this.y - this.vy * 0.05);
    ctx.stroke();
    ctx.globalAlpha = 1;
  }
}

type GameState = 'playing' | 'dead' | 'gameover';

export class AsteroidesEngine implements GameEngine {
  private ctx: CanvasRenderingContext2D;
  private callbacks: GameCallbacks;
  private paletteRef: PaletteRef | null = null;
  private keys: Record<string, boolean> = {};
  private justPressed: Record<string, boolean> = {};
  private rafId = 0;
  private lastTime: number | null = null;
  private running = false;
  private paused = false;

  private ship!: Ship;
  private bullets: Bullet[] = [];
  private asteroids: Asteroid[] = [];
  private particles: Particle[] = [];
  private powerUps: PowerUp[] = [];
  private score = 0;
  private lives = 3;
  private level = 1;
  private state: GameState = 'playing';
  private deadTimer = 0;
  private powerUpSpawned = false;
  private killsSinceSpawn = 0;
  private gameOverNotified = false;

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
    this.initGame();
    this.running = true;
    this.rafId = requestAnimationFrame(this.loop);
  }

  // Paleta activa: se lee en cada tick → cambio de skin instantáneo sin remount.
  // Asteroides usa el formato Record; el array pertenece al patrón Tetris.
  private getColors(): Record<string, string> {
    const cur = this.paletteRef?.current;
    return cur && !Array.isArray(cur) ? cur : PALETTES.clasico;
  }

  private onKeyDown = (e: KeyboardEvent) => {
    if (this.state === 'playing' || this.state === 'dead') {
      if (
        ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'Space'].includes(e.code) ||
        ['a', 'd', 'w', ' '].includes(e.key)
      ) {
        e.preventDefault();
      }
    }
    if (!this.keys[e.code]) this.justPressed[e.code] = true;
    if (!this.keys[e.key]) this.justPressed[e.key] = true;
    this.keys[e.code] = true;
    this.keys[e.key] = true;
  };

  private onKeyUp = (e: KeyboardEvent) => {
    this.keys[e.code] = false;
    this.keys[e.key] = false;
  };

  private pressed(code: string) {
    const val = this.justPressed[code];
    this.justPressed[code] = false;
    return val;
  }

  private notifyScore() {
    this.callbacks.onScore?.(this.score);
  }

  private notifyLives() {
    this.callbacks.onLives?.(this.lives);
  }

  private notifyGameOver() {
    if (this.gameOverNotified) return;
    this.gameOverNotified = true;
    this.callbacks.onGameOver?.(this.score);
  }

  private spawnAsteroids(count: number) {
    for (let i = 0; i < count; i++) {
      let x: number;
      let y: number;
      do {
        x = rand(0, W);
        y = rand(0, H);
      } while (Math.hypot(x - W / 2, y - H / 2) < SAFE_DIST);
      this.asteroids.push(new Asteroid(x, y, 3));
    }
  }

  private initGame() {
    this.ship = new Ship();
    this.bullets = [];
    this.asteroids = [];
    this.particles = [];
    this.powerUps = [];
    this.powerUpSpawned = false;
    this.killsSinceSpawn = 0;
    this.score = 0;
    this.lives = 3;
    this.level = 1;
    this.state = 'playing';
    this.deadTimer = 0;
    this.gameOverNotified = false;
    this.justPressed = {};
    this.spawnAsteroids(START_ASTEROIDS);
  }

  private nextLevel() {
    this.level++;
    this.bullets = [];
    this.particles = [];
    this.powerUps = [];
    this.powerUpSpawned = false;
    this.killsSinceSpawn = 0;
    this.ship.reset();
    this.spawnAsteroids(3 + this.level);
    this.callbacks.onLevel?.(this.level);
  }

  private explode(x: number, y: number, count = 8) {
    for (let i = 0; i < count; i++) this.particles.push(new Particle(x, y));
  }

  private killShip() {
    this.explode(this.ship.x, this.ship.y, 14);
    this.ship.dead = true;
    this.lives--;
    this.notifyLives();
    if (this.lives <= 0) {
      this.state = 'gameover';
      this.notifyGameOver();
    } else {
      this.state = 'dead';
      this.deadTimer = DEAD_TIMER;
    }
  }

  private update(dt: number) {
    if (this.state === 'gameover') {
      this.particles.forEach((p) => p.update(dt));
      this.particles = this.particles.filter((p) => !p.dead);
      return;
    }

    if (this.state === 'dead') {
      this.deadTimer -= dt;
      this.particles.forEach((p) => p.update(dt));
      this.particles = this.particles.filter((p) => !p.dead);
      this.asteroids.forEach((a) => a.update(dt));
      if (this.deadTimer <= 0) {
        this.state = 'playing';
        this.ship.reset();
      }
      return;
    }

    if (this.pressed('Space') || this.pressed(' ') || this.keys[' ']) {
      this.bullets.push(...this.ship.tryShoot());
    }

    this.ship.update(dt, this.keys);
    this.bullets.forEach((b) => b.update(dt));
    this.asteroids.forEach((a) => a.update(dt));
    this.particles.forEach((p) => p.update(dt));
    this.powerUps.forEach((p) => p.update(dt));

    this.bullets = this.bullets.filter((b) => !b.dead);
    this.particles = this.particles.filter((p) => !p.dead);
    this.powerUps = this.powerUps.filter((p) => !p.dead);

    for (const p of this.powerUps) {
      if (!p.dead && dist(this.ship, p) < this.ship.radius + p.radius) {
        p.dead = true;
        this.ship.tripleShot = POWERUP_DURATION;
      }
    }

    const newAsteroids: Asteroid[] = [];
    for (const b of this.bullets) {
      for (const a of this.asteroids) {
        if (!a.dead && !b.dead && dist(b, a) < a.radius) {
          b.dead = true;
          a.dead = true;
          this.score += POINTS[a.size];
          this.notifyScore();
          this.explode(a.x, a.y, a.size * 5);
          newAsteroids.push(...a.split());
          if (!this.powerUpSpawned) {
            this.killsSinceSpawn++;
            const guaranteed = this.killsSinceSpawn >= 5;
            if (guaranteed || Math.random() < POWERUP_DROP_CHANCE) {
              this.powerUps.push(new PowerUp(a.x, a.y));
              this.powerUpSpawned = true;
            }
          }
        }
      }
    }
    this.asteroids = this.asteroids.filter((a) => !a.dead).concat(newAsteroids);
    this.bullets = this.bullets.filter((b) => !b.dead);

    if (this.ship.invincible <= 0) {
      for (const a of this.asteroids) {
        if (dist(this.ship, a) < this.ship.radius + a.radius * 0.82) {
          this.killShip();
          break;
        }
      }
    }

    if (this.asteroids.length === 0) this.nextLevel();
  }

  private drawLifeIcon(
    ctx: CanvasRenderingContext2D,
    x: number,
    y: number,
    colors: Record<string, string>,
  ) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(-Math.PI / 2);
    ctx.strokeStyle = colors.player;
    ctx.lineWidth = 1.2;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(9, 0);
    ctx.lineTo(-6, -5);
    ctx.lineTo(-3, 0);
    ctx.lineTo(-6, 5);
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
  }

  private drawHUD(
    ctx: CanvasRenderingContext2D,
    colors: Record<string, string>,
  ) {
    ctx.fillStyle = colors.hudText;
    ctx.font = '15px monospace';

    ctx.textAlign = 'left';
    ctx.fillText(`SCORE  ${this.score}`, 14, 26);

    ctx.textAlign = 'center';
    ctx.fillText(`NIVEL ${this.level}`, W / 2, 26);

    for (let i = 0; i < this.lives; i++)
      this.drawLifeIcon(ctx, W - 16 - i * 22, 18, colors);

    if (this.ship.tripleShot > 0) {
      ctx.textAlign = 'left';
      ctx.fillStyle = colors.accent;
      ctx.fillText(`3x  ${this.ship.tripleShot.toFixed(1)}s`, 14, 46);
    }
  }

  private drawOverlay(
    ctx: CanvasRenderingContext2D,
    title: string,
    sub: string,
    colors: Record<string, string>,
  ) {
    ctx.textAlign = 'center';
    ctx.fillStyle = colors.text;
    ctx.font = 'bold 46px monospace';
    ctx.fillText(title, W / 2, H / 2 - 18);
    ctx.font = '18px monospace';
    ctx.fillStyle = colors.textDim;
    ctx.fillText(sub, W / 2, H / 2 + 22);
  }

  private draw() {
    const ctx = this.ctx;
    const colors = this.getColors();
    ctx.fillStyle = colors.field;
    ctx.fillRect(0, 0, W, H);

    this.particles.forEach((p) => p.draw(ctx, colors));
    this.asteroids.forEach((a) => a.draw(ctx, colors));
    this.powerUps.forEach((p) => p.draw(ctx, colors));
    this.bullets.forEach((b) => b.draw(ctx, colors));
    this.ship.draw(ctx, colors);

    this.drawHUD(ctx, colors);

    if (this.state === 'gameover')
      this.drawOverlay(ctx, 'GAME OVER', `PUNTAJE: ${this.score}`, colors);
  }

  private loop = (ts: number) => {
    if (!this.running) return;
    const dt =
      this.lastTime === null
        ? 0
        : Math.min((ts - this.lastTime) / 1000, MAX_DT);
    this.lastTime = ts;
    if (!this.paused) this.update(dt);
    this.draw();
    this.rafId = requestAnimationFrame(this.loop);
  };

  reset() {
    this.initGame();
    this.paused = false;
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
    if (this.state !== 'gameover') {
      this.state = 'gameover';
      this.notifyGameOver();
    }
  }
}
