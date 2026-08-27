# SPEC 02 — FLAPPY PIXEL GRAVITY, flappy con inversión de gravedad y monedas (variante B)

> **Status:** Draft
> **Depends on:** SPEC 05 (juego real), SPEC 06 (leaderboard Supabase), game-jam SPEC 01 (variante A)
> **Date:** 2026-08-27
> **Objective:** Diseñar FLAPPY PIXEL GRAVITY, variante del mismo concepto que invierte la gravedad con cada toque, añade monedas coleccionables y zonas de dificultad, como game-jam del tema "un toque".

---

## Scope

**In:**

- Nueva entrada de juego `flappy-pixel-gravity` (título "FLAPPY PIXEL GRAVITY") en `app/data/games.ts` (tras `flappy-pixel`) con `real: true`. Cover `.cover-flappy-gravity` en `app/globals.css`.
- Engine en `lib/games/flappy-pixel-gravity/` (`constants.ts`/`engine.ts`/`index.ts`) con API `createFlappyPixelGravityGame(canvas, callbacks): GameEngine`. Canvas 800×600 (landscape), pájaro que cae constantemente; cada toque invierte la dirección de la gravedad (clic/Espacio). Tuberías verticales que scrollean con gaps. Monedas doradas aleatorias dentro de los gaps (+5 puntos). Zonas de dificultad cada 10 puntos (velocidad sube, gaps se reducen). Muerte por tubería o borde del canvas.
- Wrapper aislado `components/games/FlappyPixelGravityGame.tsx` ("use client") que enlaza engine ↔ `PlayerScreen` vía `GameCanvas`.
- Registrar `flappy-pixel-gravity` en `lib/games/registry.ts`.
- Migración SQL: fila seed `flappy-pixel-gravity` en `public.games` (`on conflict do nothing`). `scores` no cambia.
- Guardado: persiste con `insertScore`; toast "▸ PUNTUACIÓN GUARDADA_" solo tras éxito; bloqueo de doble guardado.
- Salón de la Fama: pestaña FLAPPY PIXEL GRAVITY top 12 real con empty state "SIN PUNTUACIONES TODAVÍA"; "▸ TU MEJOR MARCA" con `fetchPlayerBest`.
- Leaderboard del detalle: top 10 real con empty state.

**Out of scope (para futuros specs):**

- Controles táctiles/mobile.
- Audio/sonido.
- Modo versus / multijugador.
- Power-ups disminuyentes (solo monedas que puntúan más).
- CRUD de juegos / catálogo dinámico desde la DB.
- Realtime. Tests automatizados. i18n.

---

## Data model

### `app/data/games.ts` — nueva entrada (tras `flappy-pixel`)

```ts
{
  id: "flappy-pixel-gravity",
  title: "FLAPPY PIXEL GRAVITY",
  short: "Invierte la gravedad y colecciona monedas.",
  long: "El pájaro no vuela: cae y cada toque invierte su gravedad. Monedas doradas brillan entre tuberías que se cierran. Sobrevive lo suficiente para alcanzar la zona de glitch donde todo se acelera.",
  cat: "ARCADE",
  cover: "cover-flappy-gravity",
  color: "magenta",
  real: true,
  best: 0,
  plays: "0",
}
```

### `lib/games/registry.ts` — añadir `flappy-pixel-gravity`

```ts
import { FlappyPixelGravityGame } from '@/components/games/FlappyPixelGravityGame';

// En REAL_GAMES:
{ id: 'flappy-pixel-gravity', Component: FlappyPixelGravityGame },
```

### `public.games` — fila seed (migración SQL)

```sql
insert into public.games (id, title, cat, best, plays)
values ('flappy-pixel-gravity', 'FLAPPY PIXEL GRAVITY', 'ARCADE', 0, 0)
on conflict (id) do nothing;
```

No cambia el esquema → no se regenera `app/database.types.ts`.

### `lib/games/flappy-pixel-gravity/` — engine (desde cero)

- `constants.ts` — `W = 800`, `H = 600`, `MAX_DT = 50`, `BASE_GRAVITY = 0.4`, `PIPE_SPEED_BASE = 2.5`, `PIPE_GAP_BASE = 180`, `PIPE_WIDTH = 50`, `PIPE_INTERVAL = 1200` (ms), `BIRD_SIZE = 18`, `COIN_SIZE = 12`, `COIN_POINTS = 5`, `ZONE_INTERVAL = 10` (puntos), `SPEED_INCREMENT = 0.3`, `GAP_DECREMENT = 8`, `MAX_SPEED = 6`, `MIN_GAP = 100`.
- `engine.ts` — clase `FlappyPixelGravityEngine implements GameEngine`. Estado `title`/`playing`/`gameover`. Loop `rAF` con acumulador y dt cap 50ms. La gravedad tira del pájaro en una dirección (inicialmente hacia abajo); cada toque/clic/Espacio invierte la gravedad (`gravityDir *= -1`). Tuberías verticales scrollean de derecha a izquierda con gaps. Monedas doradas spawnean aleatoriamente dentro de los gaps (+5 puntos al recogerlas). Zonas de dificultad: cada `ZONE_INTERVAL` puntos, `PIPE_SPEED` sube `SPEED_INCREMENT` (hasta `MAX_SPEED`) y `PIPE_GAP` baja `GAP_DECREMENT` (hasta `MIN_GAP`). HUD canvas: SCORE arriba-izquierda, ZONE arriba-derecha. Colisión con tubería o borde del canvas → `onGameOver(score)`. `setPaused` congela loop; `endGame` fuerza game over; `reset` reinicia; `destroy` cancela rAF y remueve listeners.
- `index.ts` — exporta `createFlappyPixelGravityGame: GameEngineFactory`.

### `components/games/FlappyPixelGravityGame.tsx` — wrapper

```ts
// "use client"
// Props: RealGameWrapperProps (paused, onScore, onLives, onLevel, onOver, handleRef)
// Usa GameCanvas con createFlappyPixelGravityGame, className="game-canvas"
```

### `app/globals.css` — `.cover-flappy-gravity`

Bloque inspirado en `.cover-flappy-pixel` / `.cover-asteroides` (gradiente radial oscuro con efecto glitch/CRT + pájaro y monedas), sin tocar selectores existentes.

---

## Implementation plan

1. **Añadir entrada `flappy-pixel-gravity` a `app/data/games.ts`** (`real: true`, tras `flappy-pixel`) + `.cover-flappy-gravity` en `globals.css`. _Verificable:_ `tsc --noEmit`; `getGameById("flappy-pixel-gravity")` resuelve.
2. **Crear `lib/games/flappy-pixel-gravity/constants.ts`**. _Verificable:_ `tsc --noEmit`.
3. **Crear `lib/games/flappy-pixel-gravity/engine.ts`** — clase `FlappyPixelGravityEngine implements GameEngine`: gravedad invertible, tuberías, monedas, zonas de dificultad, HUD, `setPaused`/`endGame`/`reset`/`destroy`. _Verificable:_ `tsc --noEmit`.
4. **Crear `lib/games/flappy-pixel-gravity/index.ts`** exportando `createFlappyPixelGravityGame`. _Verificable:_ `tsc --noEmit`.
5. **Crear `components/games/FlappyPixelGravityGame.tsx`** (wrapper aislado usando `GameCanvas`). _Verificable:_ compila; canvas en `/player/flappy-pixel-gravity`.
6. **Registrar `flappy-pixel-gravity` en `lib/games/registry.ts`**. _Verificable:_ `isRealGame("flappy-pixel-gravity")` retorna `true`.
7. **Migración SQL de seed** en `public.games` (vía `apply_migration`). _Verificable:_ `supabase_list_tables`; insertar score de prueba funciona.
8. **Guardado de score**: `PlayerScreen` ya usa `isRealGame`. _Verificable:_ guardar crea una fila en `scores`.
9. **Leaderboard y Salón de la Fama reales**. _Verificable:_ filas nuevas en `/games/flappy-pixel-gravity` y `/salon`.
10. **Verificación end-to-end manual** (inversión de gravedad funciona, monedas se recogen, zonas suben dificultad, colisión = muerte, reinicio inmediato, score/zone en vivo, pausa, FIN, guardado, sin rAF huérfano; regresiones incluida variante A).

---

## Acceptance criteria

- [ ] `getGameById("flappy-pixel-gravity")` resuelve; entrada con `real: true`; `flappy-pixel` y resto intactos.
- [ ] `lib/games/flappy-pixel-gravity/` exporta `createFlappyPixelGravityGame` y cumple el contrato `GameEngine`.
- [ ] `/player/flappy-pixel-gravity` ejecuta el juego real; pájaro cae y cada toque invierte la gravedad.
- [ ] Tuberías verticales scrollean con gaps; monedas doradas spawnean dentro de los gaps.
- [ ] Recoger moneda = +5 puntos; HUD canvas muestra SCORE y ZONE.
- [ ] Cada 10 puntos la zona sube: velocidad aumenta, gaps se reducen.
- [ ] Colisión con tubería o borde del canvas = muerte; reinicio inmediato vía `reset()`.
- [ ] Score/zone de la barra React coinciden en vivo con el HUD del canvas.
- [ ] PAUSA congela y muestra "EN PAUSA"; FIN y game over abren el modal con el puntaje real.
- [ ] Guardar crea una fila en `scores` con `player_name`, `score` y `user_id: null`; toast solo tras éxito.
- [ ] Pulsar GUARDAR dos veces no duplica la fila.
- [ ] `/salon` muestra el top 12 real en la pestaña FLAPPY PIXEL GRAVITY; con 0 filas muestra "SIN PUNTUACIONES TODAVÍA".
- [ ] Con usuario logueado, "TU MEJOR MARCA" muestra el mejor score real; sin usuario no se muestra.
- [ ] `/games/flappy-pixel-gravity` muestra el top 10 real.
- [ ] `tsc --noEmit` pasa; `next build` pasa sin warnings nuevos.
- [ ] Consola del navegador sin errores en `/player/flappy-pixel-gravity`.

---

## Decisions

- **Yes:** id `flappy-pixel-gravity`, variante B del mismo concepto que `flappy-pixel`. Coexiste sin reemplazarlo.
- **No:** reutilizar `flappy-pixel` para meter gravedad invertible y monedas. Son dos variantes de game-jam.
- **Yes:** canvas 800×600 (landscape), orientación horizontal. Diferencia visual clave frente a la variante A (portrait).
- **No:** canvas 400×600 portrait. La variante A ya ocupa ese formato.
- **Yes:** cada toque invierte la gravedad (no flap hacia arriba). Mecánica central diferente.
- **No:** flap clásico (variante A). La inversión de gravedad es la divergencia principal.
- **Yes:** monedas doradas (+5 puntos) spawnean dentro de los gaps de tuberías. Riesgo/recompensa: recoger moneda = puntear más pero arriesgar colisión.
- **No:** sin monedas, solo tuberías (variante A).
- **Yes:** zonas de dificultad cada 10 puntos (velocidad sube, gaps bajan). Progresión no lineal.
- **No:** dificultad constante (variante A).
- **Yes:** 1 vida; muerte por tubería o borde. Reinicio inmediato.
- **No:** múltiples vidas. El concepto pide "muerte instantánea".
- **Yes:** HUD propio en canvas (SCORE + ZONE). Engine autónomo visualmente.
- **No:** audio, táctil, power-ups, modo versus. Out of scope.

---

## Risks

| Riesgo                                              | Mitigación                                                                                           |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Inversión de gravedad confunde al jugador al inicio | Tutorial implícito: el estado `title` muestra el pájaro cayendo y una pista de "TOCA PARA INVERTIR". |
| Monedas en posiciones imposibles de recoger         | Monedas spawnean solo en gaps alcanzables; verificar en QA que siempre hay ruta viable.              |
| Canvas landscape (800×600) se descoloca             | `GameCanvas` soporta `width`/`height`; escalado CSS preservando aspect ratio.                        |
| Dificultad creciente demasiado agresiva             | `ZONE_INTERVAL=10`, `SPEED_INCREMENT=0.3`, `GAP_DECREMENT=8` con mínimos; QA para ajustar curva.     |
| Distinctness con la variante A                      | 3 ejes divergentes asegurados: gravedad invertible, monedas/zonas, canvas landscape.                 |
| rAF huérfano al navegar                             | `destroy()` cancela rAF y remueve listeners (patrón probado).                                        |

---

## What is **not** in this spec

- Controles táctiles/mobile.
- Audio/sonido.
- Power-ups disminuyentes.
- Modo versus / multijugador.
- Flap clásico (variante A).
- CRUD de juegos / catálogo dinámico desde la DB.
- Actualización de `best`/`plays` desde `scores`.
- Realtime. Tests automatizados. i18n.
- Regenerar `app/database.types.ts` (no hay cambios de esquema).
