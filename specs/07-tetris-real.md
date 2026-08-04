# SPEC 07 — TETRIS, segundo juego real (port a Next.js)

> **Status:** Approved
> **Depends on:** SPEC 05 (juego real), SPEC 06 (leaderboard Supabase)
> **Date:** 2026-08-04
> **Objective:** Portar el Tetris de `references/started-games/03-tetris/` a la plataforma como segundo juego real — con su ficha, engine en `lib/games/tetris/`, layout de doble canvas, leaderboard Supabase y registro genérico que sustituye los checks hardcodeados de `asteroides`.

---

## Scope

**In:**

- Nueva entrada `tetris` en `app/data/games.ts` (índice 1, tras `asteroides`) con `real: true`. Cover `.cover-tetris` en `app/globals.css`.
- Refactor de registro genérico: `real?: boolean` en `Game`, nuevo `lib/games/registry.ts` (`REAL_GAMES`, `isRealGame`, `getRealGame`); `PlayerScreen`, `GameDetailScreen` y `HallOfFameScreen` dejan de comparar `game.id === 'asteroides'`; `asteroides` y `tetris` registrados. Default de pestaña del salón: `GAMES[0].id`.
- Extensión aditiva del contrato y host: `onLines?:` en `GameCallbacks`; `extra?: { previewCanvas }` en `GameEngineFactory`; `GameCanvas` acepta `width`/`height` y un `preview` opcional (2º canvas). `Asteroides` no cambia.
- Port literal a `lib/games/tetris/` (`constants.ts`/`engine.ts`/`index.ts`): tablero 10×20 (300×600), 8 piezas incl. tuerca "N", wall kicks `[0,±1,±2]`, ghost (alpha 0.2), soft/hard drop, `LINE_SCORES=[0,100,300,500,800]×nivel`, `dropInterval=max(100, 1000−(nivel−1)·90)ms`, nivel=`⌊líneas/10⌋+1`. Lives: engine emite `onLives(1)` al iniciar y `onLives(0)` al perder. Sin tecla P, sin tema claro/oscuro, sin overlay DOM ni botón restart. Guard `MAX_DT=50ms`. API `createTetrisGame(canvas, callbacks, extra)`.
- Wrapper aislado `components/games/TetrisGame.tsx` ("use client"): **dos canvas** — tablero 300×600 centrado + preview 120×120 a la derecha y desalineado (CSS), y panel `NEXT` + `LINES` + `SCORE` alimentado por `onLines`/`onScore`.
- Guardado: `tetris` persiste con `insertScore` (rama genérica `isRealGame`); toast "▸ PUNTUACIÓN GUARDADA_" solo tras éxito; bloqueo de doble guardado (flags existentes).
- Salón de la Fama: pestaña TETRIS top 12 real con empty state "SIN PUNTUACIONES TODAVÍA"; "▸ TU MEJOR MARCA" con `fetchPlayerBest` (solo con usuario).
- Leaderboard de detalle: `tetris` top 10 real con empty state.
- Migración SQL: fila seed `tetris` en `public.games` (`on conflict do nothing`). `scores` y su RLS intactos → **no** se regenera `app/database.types.ts`.

**Out of scope (para futuros specs):**

- Audio, controles táctiles, tema claro/oscuro (del fuente), DAS/auto-repeat (no está en el fuente).
- Migrar `caida` (tetris simulado) o `rocas`; quedan intactos y seeded.
- CRUD de juegos, catálogo dinámico desde DB.
- Actualización automática de `best`/`plays`.
- Realtime. Tests automatizados. i18n.

---

## Data model

### `app/data/games.ts` — nueva entrada (tras `asteroides`)

```ts
{
  id: "tetris",
  title: "TETRIS",
  short: "Rota, encaja y limpia líneas antes del colapso.",
  long: "Ocho piezas cromáticas descienden sin piedad desde la oscuridad. Rótalas, encástralas y limpia líneas para subir de nivel mientras la caída se acelera. Una sola vida y un techo implacable: cada bloque cuenta.",
  cat: "PUZZLE",
  cover: "cover-tetris",
  color: "cyan",
  real: true,
  best: 0,
  plays: "0",
}
```

### `lib/games/types.ts` — extensiones aditivas del contrato

```ts
export type GameCallbacks = {
  onScore?: (score: number) => void;
  onLives?: (lives: number) => void;
  onLevel?: (level: number) => void;
  onLines?: (lines: number) => void;
  onGameOver?: (finalScore: number) => void;
};

export type GameEngineFactory = (
  canvas: HTMLCanvasElement,
  callbacks: GameCallbacks,
  extra?: { previewCanvas?: HTMLCanvasElement | null },
) => GameEngine;
```

### `components/games/GameCanvas.tsx` — props nuevas (aditivas)

`width?: number` (defecto 800), `height?: number` (defecto 600), `preview?: { width: number; height: number; className?: string }` → renderiza un 2º canvas y lo pasa a la factory vía `extra.previewCanvas`. `destroy()`, pausa y handle intactos. `AsteroidesGame` sin cambios.

### `lib/games/registry.ts` — registro genérico (nuevo)

```ts
export type RealGameWrapperProps = {
  paused: boolean;
  onScore: (score: number) => void;
  onLives: (lives: number) => void;
  onLevel: (level: number) => void;
  onLines: (lines: number) => void;
  onOver: (finalScore: number) => void;
  handleRef: { current: GameHandle | null };
};

export const REAL_GAMES: readonly {
  id: string;
  Component: ComponentType<RealGameWrapperProps>;
}[] = [
  { id: 'asteroides', Component: AsteroidesGame },
  { id: 'tetris', Component: TetrisGame },
];

export const isRealGame = (id: string): boolean;
export const getRealGame = (id: string): { id: string; Component: ComponentType<RealGameWrapperProps> } | undefined;
```

### `public.games` — fila seed (migración SQL)

```sql
insert into public.games (id, title, cat, best, plays)
values ('tetris', 'TETRIS', 'PUZZLE', 0, 0)
on conflict (id) do nothing;
```

No cambia el esquema → no se regenera `app/database.types.ts`.

### `lib/games/tetris/` — engine (port literal)

- `constants.ts` — COLS=10, ROWS=20, BLOCK=30, COLORS (8), PIECES (8), LINE_SCORES, MAX_DT=50.
- `engine.ts` — `TetrisEngine implements GameEngine`: board/current/next, rotateCW + tryRotate (kicks), collide, merge, clearLines, ghostY, soft/hard drop, spawn, loop por acumulador, draw (tablero) y drawNext (preview).
- `index.ts` — exporta `createTetrisGame: GameEngineFactory`.

### `app/globals.css` — `.cover-tetris`, `.tetris-stage`, `.tetris-panel`, `.tetris-preview`

Cover inspirada en `.cover-asteroides` (gradiente radial oscuro + bloques); clases del layout de doble canvas; sin tocar selectores existentes.

---

## Implementation plan

1. **Añadir entrada `tetris` a `app/data/games.ts`** (`real: true`, índice 1) + `.cover-tetris` en `app/globals.css`. _Verificable:_ `tsc --noEmit`; `/games` muestra 10 cards; `getGameById("tetris")` resuelve.
2. **Refactor a registro genérico:** `real?: boolean` en `Game`, crear `lib/games/registry.ts` con `asteroides` registrado, y que `PlayerScreen`/`GameDetailScreen`/`HallOfFameScreen` usen `isRealGame`/`getRealGame` (default de pestaña del salón = `GAMES[0].id`). _Verificable:_ sin regresiones; las rutas reales siguen funcionando.
3. **Extender contrato + host:** `onLines?` en `GameCallbacks`, `extra?` en `GameEngineFactory`, props `width`/`height`/`preview` en `GameCanvas`. _Verificable:_ `tsc --noEmit`; `/player/asteroides` idéntico.
4. **Crear `lib/games/tetris/`** con el port literal implementando el contrato (`setPaused`, `reset`, `endGame`, `destroy`, callbacks `onScore`/`onLives`/`onLevel`/`onLines`/`onGameOver`; lives 1→0; sin input en `gameover`; sin tecla P; sin tema ni overlay DOM; `MAX_DT=50`). _Verificable:_ `tsc --noEmit`.
5. **Crear `components/games/TetrisGame.tsx`** (wrapper aislado usando `GameCanvas` con `width=300`, `height=600` y `preview` 120×120 + panel NEXT/LINES/SCORE). _Verificable:_ compila; el canvas aparece en `/player/tetris`.
6. **Registrar `tetris` en `lib/games/registry.ts`**; `PlayerScreen` ramifica vía `getRealGame` (FIN → `end()`, JUGAR DE NUEVO → `reset()`). _Verificable:_ `/player/tetris` ejecuta el juego real.
7. **Migración SQL de seed** de `tetris` en `public.games` (vía `apply_migration`). _Verificable:_ `supabase_list_tables`; `insertScore` de prueba funciona con anon key.
8. **Leaderboard y Salón de la Fama reales** para `tetris` (ya genérico tras los pasos 2/6): top 10 detalle, top 12 salón, empty states, "TU MEJOR MARCA". _Verificable:_ las filas recién guardadas aparecen.
9. **Verificación end-to-end manual** (jugable, HUD React ↔ canvas, pausa, FIN, game over, guardado, navegación sin rAF huérfano; regresiones en los otros juegos).

---

## Acceptance criteria

- [ ] `getGameById("tetris")` resuelve; entrada con `real: true` en índice 1; `caida` sin cambios.
- [ ] `lib/games/tetris/` exporta `createTetrisGame`; conserva las 8 piezas (incl. tuerca), ghost, wall kicks, soft/hard drop y scoring del fuente.
- [ ] `lib/games/registry.ts` registra `asteroides` y `tetris`; ningún componente compara `game.id === 'asteroides'`.
- [ ] `GameCanvas` soporta `width`/`height`/`preview`; `AsteroidesGame` sin cambios visuales.
- [ ] `/player/tetris` muestra el tablero centrado y el preview a la derecha desalineado; el panel muestra NEXT/LINES/SCORE.
- [ ] El HUD React coincide en vivo (score, nivel, vidas=1); LINES llega vía `onLines`.
- [ ] PAUSA congela y muestra "EN PAUSA"; FIN y game over abren el modal con el puntaje real.
- [ ] Guardar crea una fila en `scores` con `player_name`, `score` y `user_id: null`; el toast aparece solo tras éxito.
- [ ] Pulsar GUARDAR dos veces no duplica la fila.
- [ ] `/salon` muestra el top 12 real en la pestaña TETRIS; con 0 filas muestra "SIN PUNTUACIONES TODAVÍA".
- [ ] Con usuario logueado, "TU MEJOR MARCA" muestra el mejor score real; sin usuario no se muestra.
- [ ] `/games/tetris` muestra el top 10 real; los juegos no registrados siguen seeded.
- [ ] `tsc --noEmit` pasa; `next build` pasa sin warnings nuevos.
- [ ] Consola del navegador sin errores en `/player/tetris`.

---

## Decisions

- **Yes:** id `tetris`, separado de `caida` (que queda intacto y seeded). Pedido explícito del usuario.
- **No:** sustituir `caida` por `tetris`. El usuario pidió dejar `caida` intacto.
- **Yes:** port literal de `references/started-games/03-tetris/` con las 8 piezas incl. la tuerca "N". Pedido explícito.
- **No:** reducir a 7 piezas. No es port literal; el usuario confirmó las 8.
- **Yes:** layout de dos canvas — tablero 300×600 centrado + preview 120×120 a la derecha desalineado, con `GameCanvas` extendido aditivamente (`width`/`height`/`preview`). Pedido explícito del usuario.
- **No:** canvas único 800×600 dibujando tablero + preview en una sola superficie. El usuario pidió dos canvas con esa disposición.
- **Yes:** `onLines?` opcional en `GameCallbacks` para alimentar el panel del wrapper. Aditivo; `Asteroides` no lo usa.
- **No:** wrapper autónomo fuera de `GameCanvas`. Se mantiene el host genérico reutilizable.
- **Yes:** pausa solo desde el contenedor (`engine.setPaused`); se elimina la tecla P del port.
- **No:** tema claro/oscuro, overlay DOM de game over y botón restart del fuente. Los sustituyen el modal FIN + JUGAR DE NUEVO.
- **Yes:** Tetris tiene 1 vida: `onLives(1)` al iniciar, `onLives(0)` al perder; el HUD del contenedor muestra las vidas fijas.
- **No:** input en `gameover`; sin reinicio por tecla. El modal controla el reinicio con `engine.reset()`.
- **Yes:** registro genérico (`lib/games/registry.ts`) sustituye los checks hardcodeados de `asteroides` en `PlayerScreen`/`GameDetailScreen`/`HallOfFameScreen`.
- **Yes:** seed en `public.games` (`on conflict do nothing`); `scores` y RLS intactos; no se regeneran tipos.
- **Yes:** `best: 0` / `plays: "0"`.
- **Yes:** `tetris` tras `asteroides` en `GAMES`; default de pestaña del salón = `GAMES[0]` (asteroides).
- **Yes:** guard `MAX_DT=50ms` en el acumulador del loop (no está en el fuente) para evitar espiral de muerte por blur, como en Asteroides.
- **No:** audio, táctil, DAS/auto-repeat, realtime, tests automatizados.

---

## Risks

| Riesgo                                       | Mitigación                                                                                           |
| -------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| El port a TS altera la jugabilidad           | Port literal: mismas constantes y puntuación; QA comparando comportamiento.                          |
| El layout de 2 canvas se descoloca           | Clases `.tetris-stage`/`.tetris-panel`/`.tetris-preview` con flex; verificación visual en el paso 9. |
| `GameCanvas` extendido rompe Asteroides      | Cambios aditivos con defaults; verificar `/player/asteroides` sin regresiones.                       |
| INSERT duplicado al pulsar GUARDAR dos veces | Flags `saving`/`saved` ya existentes en `PlayerScreen`.                                              |
| rAF huérfano al navegar                      | `destroy()` cancela rAF y remueve listeners en el cleanup del host.                                  |
| Drop enorme tras blur de pestaña             | `MAX_DT=50ms` en el acumulador del loop.                                                             |

---

## What is **not** in this spec

- Audio, controles táctiles, tema claro/oscuro, DAS/auto-repeat (ausentes en el fuente).
- Migrar `caida` ni `rocas`; edición de juegos; CRUD; catálogo dinámico desde la DB.
- Actualización de `best`/`plays` desde `scores`.
- Realtime.
- Tests automatizados.
- Regenerar `app/database.types.ts` (no hay cambios de esquema).
