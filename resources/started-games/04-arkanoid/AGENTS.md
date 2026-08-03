# AGENTS.md — Arkanoid

## Project

Vanilla Arkanoid game (HTML/CSS/JS, zero dependencies, no build system).

## Quick start

- Open `index.html` in a browser — no server needed.
- All game logic must be client-side, single-page, no imports/bundlers.

## Workflow

- **Spec-driven**: use `/spec` skill to design features, `/spec-impl` to implement them.
- Specs go in `specs/` (named `NN-slug.md`). Config in `specs/.spec-config.yml`.
- Implementation branches follow `spec-NN-slug`.
- No tests, no linters, no typecheckers exist — none expected.
- Before writing code, check `specs/` for active specs.
- `/spec-impl` auto-creates branches (set `AutoCreateBranch: false` to prompt).

## Project layout

| Path | Purpose |
|---|---|
| `index.html` | Entry point — canvas 800×600, HUD bar, loads `spritesheet.js` → `levels.js` → `game.js` |
| `game.js` | All game logic: loop, update, draw, input, state machine, paddle/ball/blocks/explosions |
| `levels.js` | `LEVELS` array (level grids, names) + `BALL_SPEEDS` array (speed per level) |
| `assets/spritesheet.js` | `SPRITES`, `EXPLOSION_FRAMES`, `loadSpritesheet(cb)`, `drawSprite()`, `drawFrame()` |
| `assets/spritesheet-breakout.png` | Sprite atlas (paddle, ball, blocks, explosions) |
| `assets/sounds/ball-bounce.mp3` | Paddle/ball bounce SFX |
| `assets/sounds/break-sound.mp3` | Block destroy SFX |
| `specs/` | Spec-driven design documents (`NN-slug.md`) |
| `.agents/skills/` + `.claude/skills/` | Duplicated skill definitions — edit both |

## Data model (globals in `game.js`)

```js
const game = { score, lives, state, screen, level, levelsUnlocked, transitionTimer, paused };
const paddle = { x, y, w, h };
const ball = { x, y, r, vx, vy, active };
const blocks = [];     // { x, y, w, h, color, alive }
const explosions = []; // { x, y, w, h, frames, frameIndex, timer }
```

**Screens:** `'title'` | `'playing'` | `'transition'`
**States (on `'playing'` screen):** `'playing'` | `'lifelost'` | `'gameover'` | `'victory'`

- `ball.active = false` → ball stuck to paddle, waiting for Space/click.
- `ball.active = true` → ball in flight.
- `game.screen === 'transition'` → inter-level overlay for 2 s.
- `game.paused` → pause overlay with level selector.

## Levels API (`levels.js`)

```js
LEVELS[i] = { name: string, cols: number, rows: number, grid: number[][] };
BALL_SPEEDS[i] = number;  // indexed by level, speeds increase per level
```

## Spritesheet API (`assets/spritesheet.js`)

```js
loadSpritesheet(() => { /* SPRITES.paddle, SPRITES.blocks.red, EXPLOSION_FRAMES.red */ });
drawSprite(ctx, 'paddle' | 'block_' + color, x, y, w, h);
drawFrame(ctx, frame, x, y, w, h);
EXPLOSION_DURATION  // 150ms
```

Sound playback (no preloading): `new Audio('assets/sounds/...mp3').play()`

## Conventions

- **Language**: code and comments in English; spec skill auto-matches user language.
- No frameworks, no import/export, no bundlers — all globals.
- `ROW_COLORS` = `['red', 'yellow', 'cyan', 'magenta', 'hotpink', 'green']`, grid values are 1-based indices.
- Coordinates: origin top-left. Velocities in px/frame at ~60 fps.
- Paddle input: mouse (`mousemove` on canvas) + keyboard (`ArrowLeft`/`ArrowRight`) simultaneously.
- Launch ball: Space key or left click.
- Pause: `P`/`Escape` key or right click.
- Click on a level button in title/pause screen → load that level.
- If adding a `.gitignore`, remember `assets/.DS_Store`.
- `README.md` exists — update it for notable additions.
