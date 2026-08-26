# SPEC 09 — SNAKE, juego real desde cero

> **Status:** Approved
> **Depends on:** SPEC 05 (juego real), SPEC 06 (leaderboard Supabase)
> **Date:** 2026-08-26
> **Objective:** Añadir el juego SNAKE como cuarto juego real del catálogo, con engine desde cero, leaderboard en Supabase y sprites de frutas del atlas existente.

---

## Scope

**In:**

- Reemplazar `serpentina` por `snake` en `app/data/games.ts` (nueva entrada con `real: true`, posición 4 tras `arkanoid`). `.cover-snake` ya existe en `globals.css` — sin cambios CSS.
- Engine nuevo desde cero en `lib/games/snake/` (`constants.ts`, `engine.ts`, `index.ts`) con API `createSnakeGame(canvas, callbacks): GameEngine`. Canvas 800×800, grilla 20×20 (celdas 40px), controles WASD, frutas del sprite atlas `fruits.png`, 1 vida, game over por pared o auto-mordedura, +10 por fruta, velocidad sube cada 5 frutas (tick 150ms → 60ms min). HUD propio en canvas (SCORE, LEVEL). Sin reinicio por tecla en gameover.
- Wrapper aislado `components/games/SnakeGame.tsx` ("use client") que enlaza engine ↔ `PlayerScreen` vía `GameCanvas`.
- Registrar `snake` en `lib/games/registry.ts` (`REAL_GAMES`); `PlayerScreen`, `GameDetailScreen` y `HallOfFameScreen` ya usan `isRealGame`/`getRealGame` — sin cambios en estos componentes.
- Migración SQL: fila seed de `snake` en `public.games` (`on conflict do nothing`). `scores` no cambia (RLS, CHECK, FK intactos).
- Guardado de score: `snake` persiste en Supabase con `insertScore` (`player_name` del usuario logueado o `INVITADO`, `user_id: null`); toast "▸ PUNTUACIÓN GUARDADA_" solo tras éxito; bloqueo de doble guardado.
- Salón de la Fama: la pestaña `snake` lee el top 12 real de `scores` con empty state "SIN PUNTUACIONES TODAVÍA"; fila "▸ TU MEJOR MARCA" con `fetchPlayerBest` (solo con usuario).
- Leaderboard del detalle: `snake` lee el top 10 real con empty state.
- Eliminar la entrada `serpentina` del catálogo (id `serpentina` deja de existir).

**Out of scope (para futuros specs):**

- Controles táctiles/mobile.
- Audio/sonido.
- OVNIs, power-ups o features extra no descritas arriba.
- CRUD de juegos / catálogo dinámico desde la DB.
- Actualización automática de `best`/`plays` desde `scores`.
- Realtime (suscripciones a cambios).
- Tests automatizados.
- Pausa automática por blur de pestaña.
- i18n.

---

## Data model

### `app/data/games.ts` — reemplazar `serpentina` por `snake` (posición 4)

```ts
{
  id: "snake",
  title: "SNAKE",
  short: "Crece sin morder tu propia cola.",
  long: "Una serpiente de luz recorre la grilla buscando núcleos magenta. Cada bocado la alarga y la hace más veloz. Un movimiento en falso y se devora a sí misma.",
  cat: "ARCADE",
  cover: "cover-snake",
  color: "green",
  real: true,
  best: 0,
  plays: "0",
}
```

### `lib/games/registry.ts` — añadir `snake`

```ts
import { SnakeGame } from '@/components/games/SnakeGame';

// En REAL_GAMES:
{ id: 'snake', Component: SnakeGame },
```

### `public.games` — fila seed (migración SQL)

```sql
insert into public.games (id, title, cat, best, plays)
values ('snake', 'SNAKE', 'ARCADE', 0, 0)
on conflict (id) do nothing;
```

No cambia el esquema → no se regenera `app/database.types.ts`.

### `lib/games/snake/` — engine desde cero

- **`constants.ts`** — `W = 800`, `H = 800`, `CELL = 40`, `COLS = 20`, `ROWS = 20`, `MAX_DT = 50`, `BASE_TICK = 150`, `MIN_TICK = 60`, `SPEED_INTERVAL = 5`, `POINTS_PER_FRUIT = 10`.
- **`engine.ts`** — clase `SnakeEngine` implementando `GameEngine`. Estado: `playing` / `gameover`. Loop con `requestAnimationFrame` + acumulador de tiempo y `dt` cap de 50ms. La serpiente avanza un tick (no frame) — velocidad controlada por `tickInterval`. Dirección en buffer de 1 tecla (evita giro de 180°). Colisión con pared o自身 → game over. Fruta aleatoria del sprite atlas (imagen cargada via `new Image()`), nueva fruta al comer. HUD propio en canvas: SCORE arriba a la izquierda, LEVEL arriba a la derecha.
- **`index.ts`** — exporta `createSnakeGame: GameEngineFactory`.

### `components/games/SnakeGame.tsx` — wrapper

```ts
// "use client"
// Props: RealGameWrapperProps (paused, onScore, onLives, onLevel, onOver, handleRef)
// Usa GameCanvas con createSnakeGame, className="game-canvas"
```

### `app/globals.css` — `.cover-snake`

Ya existe (línea 732). Sin cambios.

### `lib/supabase/scores.ts`

Ya existe con `fetchLeaderboard`, `fetchPlayerBest`, `insertScore`. Sin cambios.

---

## Implementation plan

1. **Reemplazar `serpentina` por `snake` en `app/data/games.ts`** — nueva entrada con `real: true`, posición 4 (tras `arkanoid`). _Verificable:_ `tsc --noEmit`; `/games` muestra la card SNAKE; `getGameById("snake")` resuelve; `serpentina` ya no aparece.

2. **Crear `lib/games/snake/constants.ts`** — `W`, `H`, `CELL`, `COLS`, `ROWS`, `MAX_DT`, `BASE_TICK`, `MIN_TICK`, `SPEED_INTERVAL`, `POINTS_PER_FRUIT`. _Verificable:_ `tsc --noEmit`.

3. **Crear `lib/games/snake/engine.ts`** — clase `SnakeEngine` implementando `GameEngine`. Loop `rAF` con acumulador de tiempo y `dt` cap 50ms. Serpiente avanza por tick (no por frame). Estado `playing`/`gameover`. Dirección en buffer de 1 tecla (WASD, sin giro 180°). Colisión con pared o自身 → `onGameOver`. Fruta aleatoria del sprite atlas (`new Image()` con `fruits.png`). HUD canvas: SCORE arriba-izquierda, LEVEL arriba-derecha. `setPaused` congela loop; `endGame` fuerza game over; `reset` reinicia; `destroy` cancela rAF y remueve listeners. _Verificable:_ `tsc --noEmit`; `next build` no mete el engine en el bundle del servidor.

4. **Crear `lib/games/snake/index.ts`** — exporta `createSnakeGame: GameEngineFactory`. _Verificable:_ `tsc --noEmit`.

5. **Crear `components/games/SnakeGame.tsx`** — wrapper aislado ("use client") usando `GameCanvas` con `createSnakeGame`, `className="game-canvas"`. Props: `RealGameWrapperProps`. _Verificable:_ compila; el canvas aparece en `/player/snake`.

6. **Registrar `snake` en `lib/games/registry.ts`** — importar `SnakeGame`, añadir `{ id: 'snake', Component: SnakeGame }` a `REAL_GAMES`. _Verificable:_ `tsc --noEmit`; `isRealGame("snake")` retorna `true`.

7. **Migración SQL de seed** — insertar fila `snake` en `public.games` via `supabase_apply_migration` (`on conflict do nothing`). _Verificable:_ `supabase_list_tables`; insertar un score de prueba funciona con anon key.

8. **Guardado de score** — `PlayerScreen` ya maneja `realGame` con `insertScore`; `snake` se beneficia automáticamente al estar registrado. _Verificable:_ guardar crea una fila en `scores`.

9. **Leaderboard y Salón de la Fama reales** — `Leaderboard` y `HallOfFameScreen` ya usan `isRealGame`; `snake` se beneficia automáticamente. _Verificable:_ las filas recién guardadas aparecen en `/games/snake` (top 10) y `/salon` pestaña SNAKE (top 12).

10. **Verificación end-to-end manual** — `npm run dev` sin errores. `/player/snake`: serpiente visible y controlable con WASD; frutas del atlas aparecen; score sube al comer; velocidad aumenta cada 5 frutas; HUD canvas y barra React coinciden; game over por pared o自身; PAUSA congela; FIN modal con puntaje real; guardar crea fila; salón top 12 real; empty state si no hay filas; regresiones en los otros juegos verificadas.

---

## Acceptance criteria

- [ ] `getGameById("snake")` resuelve; entrada con `real: true`, `cat: "ARCADE"`, `cover: "cover-snake"`, posición 4. `serpentina` ya no existe en el catálogo.
- [ ] `lib/games/snake/` existe y exporta `createSnakeGame` que cumple el contrato `GameEngine`.
- [ ] `lib/games/registry.ts` registra `asteroides`, `tetris`, `arkanoid` y `snake`; ningún componente compara `game.id === 'asteroides'` para lógica de juego.
- [ ] `/player/snake` ejecuta el juego real; serpiente visible, controlable con WASD, frutas del atlas aparecen.
- [ ] Score y nivel de la barra React coinciden en vivo con el HUD del canvas.
- [ ] PAUSA congela y muestra "EN PAUSA"; FIN y game over abren el modal con el puntaje real.
- [ ] Guardar crea una fila en `scores` con `player_name`, `score` y `user_id: null`; el toast aparece solo tras éxito.
- [ ] Pulsar GUARDAR dos veces no duplica la fila.
- [ ] `/salon` muestra el top 12 real en la pestaña SNAKE; con 0 filas muestra "SIN PUNTUACIONES TODAVÍA".
- [ ] Con usuario logueado, "TU MEJOR MARCA" muestra el mejor score real; sin usuario no se muestra.
- [ ] `/games/snake` muestra el top 10 real; los juegos no registrados siguen seeded.
- [ ] `tsc --noEmit` pasa; `next build` pasa sin warnings nuevos.
- [ ] Consola del navegador sin errores en `/player/snake`.
- [ ] Regresiones verificadas en asteroides, tetris, arkanoid y juegos no reales.

---

## Decisions

- **Yes:** juego nuevo con id `snake`, reemplazando `serpentina`. El usuario lo pidió explícitamente; `serpentina` era simulación.
- **No:** mantener `serpentina` como entrada separada. Confuso tener dos juegos de serpiente.
- **Yes:** engine desde cero (no hay código fuente de referencia). Sprite atlas `fruits.png` como asset visual.
- **No:** port desde `references/started-games/`. No existe código de snake ahí.
- **Yes:** canvas 800×800 cuadrado con celdas 40px (grilla 20×20). Pedido explícito del usuario.
- **No:** canvas 800×600. El usuario pidió cuadrado.
- **Yes:** controles solo WASD. Pedido explícito del usuario.
- **No:** flechas del teclado. El usuario descartólas explícitamente.
- **Yes:** 1 sola vida (snake clásico). Game over al chocar pared o自身.
- **No:** múltiples vidas. No es el estilo de snake clásico.
- **Yes:** +10 por fruta, velocidad sube cada 5 frutas (tick 150ms → 60ms). Diseño propio del spec.
- **No:** wrap en paredes (la serpiente muere al chocar). Más fiel al snake clásico.
- **Yes:** sprite atlas para frutas (23 frutas, imagen cargada via `new Image()`). Assets ya disponibles.
- **No:** frutas dibujadas con primitivas del canvas. Los sprites ya existen y dan más color.
- **Yes:** HUD propio en canvas (SCORE + LEVEL). Patrón similar a asteroides.
- **No:** sin HUD en canvas, solo React. El engine debe ser autónomo visualmente.
- **Yes:** registrar `snake` en `lib/games/registry.ts` junto a los 3 juegos existentes. El registro ya soporta N juegos.
- **No:** hardcodear `snake` en `PlayerScreen` con un `if`. El registro genérico ya existe.
- **Yes:** seed de `snake` en `public.games` para que la FK de `scores` funcione. Mismo patrón que asteroides.
- **No:** sin migración SQL. La FK rompería al insertar scores.
- **Yes:** posición 4 en el catálogo (tras arkanoid). Pedido explícito del usuario.
- **No:** posición 1 (antes de asteroides). El usuario pidió posición 4.
- **No:** audio/sonido.
- **No:** controles táctiles.
- **No:** tests automatizados.

---

## Risks

| Riesgo                                                     | Mitigación                                                                                                                                           |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sprites de `fruits.png` no cargan (ruta incorrecta o CORS) | Cargar la imagen con `new Image()` usando ruta `/references/source-assets/snake-assets/fruits.png`; verificar en el paso 10 que las frutas aparecen. |
| La serpiente crece demasiado rápido y llena la grilla      | 20×20 = 400 celdas; con +10 por fruta y speed interval cada 5, el juego es jugable por varios minutos antes de llenarse.                             |
| Giro de 180° instantáneo mata al jugador                   | Buffer de 1 dirección pendiente; el giro se aplica en el siguiente tick, no instantáneamente.                                                        |
| `serpentina` referenciada en otros archivos                | Buscar `serpentina` con grep antes de eliminar; cubierto en el paso 1.                                                                               |
| rAF huérfano al navegar                                    | `destroy()` cancela rAF y remueve listeners, patrón ya probado en asteroides/tetris/arkanoid.                                                        |

---

## What is **not** in this spec

- Controles táctiles/mobile.
- Audio/sonido.
- OVNIs, power-ups o features extra.
- CRUD de juegos / catálogo dinámico desde la DB.
- Actualización automática de `best`/`plays` desde `scores`.
- Realtime (suscripciones a cambios).
- Tests automatizados.
- Pausa automática por blur de pestaña.
- i18n.
- Migración de `serpentina` a `snake` en la DB (se empieza limpio con el seed nuevo).
