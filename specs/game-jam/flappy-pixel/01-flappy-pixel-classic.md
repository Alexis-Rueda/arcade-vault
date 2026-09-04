# SPEC 01 — FLAPPY PIXEL CLASSIC, flappy bird purista con un toque (variante A)

> **Status:** Approved
> **Depends on:** SPEC 05 (juego real), SPEC 06 (leaderboard Supabase)
> **Date:** 2026-08-27
> **Objective:** Diseñar FLAPPY PIXEL CLASSIC, un flappy bird puro con controles de un toque, tuberías y scoring por huecos superados, como game-jam del tema "un toque".

---

## Scope

**In:**

- Nueva entrada de juego `flappy-pixel` (título "FLAPPY PIXEL") en `app/data/games.ts` (índice tras los juegos existentes) con `real: true`. Cover `.cover-flappy-pixel` en `app/globals.css`.
- Engine en `lib/games/flappy-pixel/` (`constants.ts`/`engine.ts`/`index.ts`) con API `createFlappyPixelGame(canvas, callbacks): GameEngine`. Canvas 400×600 (portrait), pájaro pixel-art que cae con gravedad, flap al tocar/clic/Espacio, tuberías que scrollean de derecha a izquierda, colisión = muerte instantánea, reinicio inmediato. +1 por cada hueco superado.
- Wrapper aislado `components/games/FlappyPixelGame.tsx` ("use client") que enlaza engine ↔ `PlayerScreen` vía `GameCanvas`.
- Registrar `flappy-pixel` en `lib/games/registry.ts`.
- Migración SQL: fila seed `flappy-pixel` en `public.games` (`on conflict do nothing`). `scores` no cambia.
- Guardado: persiste con `insertScore`; toast "▸ PUNTUACIÓN GUARDADA_" solo tras éxito; bloqueo de doble guardado.
- Salón de la Fama: pestaña FLAPPY PIXEL top 12 real con empty state "SIN PUNTUACIONES TODAVÍA"; "▸ TU MEJOR MARCA" con `fetchPlayerBest`.
- Leaderboard del detalle: top 10 real con empty state.

**Out of scope (para futuros specs):**

- Controles táctiles/mobile (solo teclado/clic en desktop).
- Audio/sonido.
- Power-ups, monedas o elementos coleccionables (se exploran en la variante B).
- Modo versus / multijugador.
- CRUD de juegos / catálogo dinámico desde la DB.
- Realtime. Tests automatizados. i18n.

---

## Data model

### `app/data/games.ts` — nueva entrada

```ts
{
  id: "flappy-pixel",
  title: "FLAPPY PIXEL",
  short: "Salta entre tuberías con un toque.",
  long: "Un pájaro pixelado cae sin piedad. Un toque lo eleva, dos toques lo pierden. Las tuberías se acercan sin tregua: supera los huecos o muere intentándolo. Una vida, reinicio inmediato, score infinito.",
  cat: "ARCADE",
  cover: "cover-flappy-pixel",
  color: "cyan",
  real: true,
  best: 0,
  plays: "0",
}
```

### `lib/games/registry.ts` — añadir `flappy-pixel`

```ts
import { FlappyPixelGame } from '@/components/games/FlappyPixelGame';

// En REAL_GAMES:
{ id: 'flappy-pixel', Component: FlappyPixelGame },
```

### `public.games` — fila seed (migración SQL)

```sql
insert into public.games (id, title, cat, best, plays)
values ('flappy-pixel', 'FLAPPY PIXEL', 'ARCADE', 0, 0)
on conflict (id) do nothing;
```

No cambia el esquema → no se regenera `app/database.types.ts`.

### `lib/games/flappy-pixel/` — engine (desde cero)

- `constants.ts` — `W = 400`, `H = 600`, `MAX_DT = 50`, `GRAVITY = 0.5`, `FLAP_FORCE = -8`, `PIPE_SPEED = 2`, `PIPE_GAP = 150`, `PIPE_WIDTH = 60`, `PIPE_INTERVAL = 1500` (ms), `BIRD_SIZE = 20`, `POINTS_PER_PIPE = 1`.
- `engine.ts` — clase `FlappyPixelEngine implements GameEngine`. Estado `title`/`playing`/`gameover`. Loop `rAF` con acumulador y dt cap 50ms. El pájaro cae con gravedad constante; al tocar/clic/Espacio aplica `FLAP_FORCE` hacia arriba. Tuberías spawnean cada `PIPE_INTERVAL` ms con gap aleatorio centrado. Scroll de izquierda a derecha. Colisión con tubería o suelo/techo → `onGameOver(score)`. Score = huecos superados (+1 cada vez que el pájaro supera el centro de una tubería). HUD canvas: SCORE centrado arriba. Sin input en gameover (reinicio vía `reset()` desde el contenedor). `setPaused` congela loop; `endGame` fuerza game over; `reset` reinicia; `destroy` cancela rAF y remueve listeners.
- `index.ts` — exporta `createFlappyPixelGame: GameEngineFactory`.

### `components/games/FlappyPixelGame.tsx` — wrapper

```ts
// "use client"
// Props: RealGameWrapperProps (paused, onScore, onLives, onLevel, onOver, handleRef)
// Usa GameCanvas con createFlappyPixelGame, className="game-canvas"
```

### `app/globals.css` — `.cover-flappy-pixel`

Bloque inspirado en `.cover-asteroides` (gradiente radial oscuro + pájaro y tuberías pixeladas), sin tocar selectores existentes.

---

## Implementation plan

1. **Añadir entrada `flappy-pixel` a `app/data/games.ts`** (`real: true`) + `.cover-flappy-pixel` en `globals.css`. _Verificable:_ `tsc --noEmit`; `getGameById("flappy-pixel")` resuelve.
2. **Crear `lib/games/flappy-pixel/constants.ts`**. _Verificable:_ `tsc --noEmit`.
3. **Crear `lib/games/flappy-pixel/engine.ts`** — clase `FlappyPixelEngine implements GameEngine`: loop rAF+MAX_DT, gravedad, flap, tuberías, colisión, score, HUD, `setPaused`/`endGame`/`reset`/`destroy`. _Verificable:_ `tsc --noEmit`.
4. **Crear `lib/games/flappy-pixel/index.ts`** exportando `createFlappyPixelGame`. _Verificable:_ `tsc --noEmit`.
5. **Crear `components/games/FlappyPixelGame.tsx`** (wrapper aislado usando `GameCanvas`). _Verificable:_ compila; canvas en `/player/flappy-pixel`.
6. **Registrar `flappy-pixel` en `lib/games/registry.ts`**. _Verificable:_ `isRealGame("flappy-pixel")` retorna `true`.
7. **Migración SQL de seed** en `public.games` (vía `apply_migration`). _Verificable:_ `supabase_list_tables`; insertar score de prueba funciona.
8. **Guardado de score**: `PlayerScreen` ya usa `isRealGame`. _Verificable:_ guardar crea una fila en `scores`.
9. **Leaderboard y Salón de la Fama reales**. _Verificable:_ filas nuevas en `/games/flappy-pixel` y `/salon`.
10. **Verificación end-to-end manual** (flap con clic/Espacio, tuberías scrollean, colisión = muerte, reinicio inmediato, score sube, pausa, FIN, guardado, sin rAF huérfano; regresiones en otros juegos).

---

## Acceptance criteria

- [ ] `getGameById("flappy-pixel")` resuelve; entrada con `real: true`; resto del catálogo intacto.
- [ ] `lib/games/flappy-pixel/` exporta `createFlappyPixelGame` y cumple el contrato `GameEngine`.
- [ ] `/player/flappy-pixel` ejecuta el juego real; pájaro visible, cae con gravedad, flap al tocar/Espacio.
- [ ] Tuberías scrollean de izquierda a derecha con hueco aleatorio.
- [ ] Colisión con tubería o suelo/techo = muerte instantánea; reinicio inmediato vía `reset()`.
- [ ] Score = huecos superados (+1 por tubería); HUD canvas muestra SCORE.
- [ ] Score de la barra React coincide en vivo con el HUD del canvas.
- [ ] PAUSA congela y muestra "EN PAUSA"; FIN y game over abren el modal con el puntaje real.
- [ ] Guardar crea una fila en `scores` con `player_name`, `score` y `user_id: null`; toast solo tras éxito.
- [ ] Pulsar GUARDAR dos veces no duplica la fila.
- [ ] `/salon` muestra el top 12 real en la pestaña FLAPPY PIXEL; con 0 filas muestra "SIN PUNTUACIONES TODAVÍA".
- [ ] Con usuario logueado, "TU MEJOR MARCA" muestra el mejor score real; sin usuario no se muestra.
- [ ] `/games/flappy-pixel` muestra el top 10 real.
- [ ] `tsc --noEmit` pasa; `next build` pasa sin warnings nuevos.
- [ ] Consola del navegador sin errores en `/player/flappy-pixel`.

---

## Decisions

- **Yes:** id `flappy-pixel`, juego nuevo desde cero. No hay código fuente de referencia; es un port conceptual del flappy bird clásico.
- **No:** port desde `references/started-games/`. No existe código de flappy ahí.
- **Yes:** canvas 400×600 (portrait), orientación vertical como el flappy bird original. Más fiel al concepto.
- **No:** canvas 800×600 (landscape). El flappy bird es vertical por naturaleza.
- **Yes:** controles de un toque: clic del mouse o Espacio para flap. Simple y fiel al concepto "un toque".
- **No:** solo teclado (sin mouse) o solo mouse (sin teclado). Ambos por accesibilidad.
- **Yes:** 1 vida; muerte instantánea al tocar tubería/suelo/techo. Reinicio inmediato vía `reset()` desde el contenedor.
- **No:** múltiples vidas. El concepto pide "muerte instantánea, reinicio inmediato".
- **Yes:** +1 por cada hueco de tubería superado. Scoring simple y adictivo.
- **No:** scoring por distancia o tiempo. El flappy bird clásico puntúa por tuberías.
- **Yes:** gravedad constante + flap con fuerza fija. Física pura, sin aceleración artificial.
- **No:** gravedad variable o power-ups de gravedad (se exploran en la variante B).
- **Yes:** tuberías con gap fijo (150px) y velocidad constante. Dificultad por consistentencia, no por variación.
- **No:** gap variable o dificultad creciente por zonas (variante B).
- **Yes:** HUD propio en canvas (SCORE centrado arriba). Engine autónomo visualmente.
- **No:** audio, táctil, power-ups, modo versus. Out of scope.

---

## Risks

| Riesgo                                                       | Mitigación                                                                                    |
| ------------------------------------------------------------ | --------------------------------------------------------------------------------------------- |
| Canvas portrait (400×600) se descoloca en pantallas pequeñas | `GameCanvas` soporta `width`/`height`; escalado CSS preservando aspect ratio.                 |
| La física de gravedad se siente "pesada" o "ligera"          | Ajustar `GRAVITY` y `FLAP_FORCE` hasta que el flap se sienta responsivo; QA manual iterativo. |
| Tuberías spawnean demasiado rápido o lento                   | `PIPE_INTERVAL = 1500ms` como punto de partida; ajustar según QA.                             |
| rAF huérfano al navegar                                      | `destroy()` cancela rAF y remueve listeners (patrón probado).                                 |
| Colisión mal calculada con bordes de tubería                 | Detección AABB precisa: rectángulo del pájaro vs rectángulos de tubería superior e inferior.  |

---

## What is **not** in this spec

- Controles táctiles/mobile.
- Audio/sonido.
- Power-ups, monedas o elementos coleccionables (variante B).
- Modo versus / multijugador.
- Dificultad creciente por zonas o gap variable.
- CRUD de juegos / catálogo dinámico desde la DB.
- Actualización de `best`/`plays` desde `scores`.
- Realtime. Tests automatizados. i18n.
- Regenerar `app/database.types.ts` (no hay cambios de esquema).
