# SPEC 08 — ARKANOID, tercer juego real (reescritura libre)

> **Status:** Implemented
> **Depends on:** SPEC 05 (juego real), SPEC 06 (leaderboard Supabase), SPEC 07 (registro genérico)
> **Date:** 2026-08-04
> **Objective:** Diseñar e integrar ARKANOID como tercer juego real del catálogo — reescritura libre del Arkanoid clásico con sprites del fuente, 5 niveles, audio, leaderboard Supabase y registro genérico.

---

## Scope

**In:**

- Nueva entrada de juego `arkanoid` (título "ARKANOID") en `app/data/games.ts` (índice 2, tras `tetris`) con `real: true`. Cover nueva `.cover-arkanoid` en `app/globals.css`.
- Reescritura libre del engine en `lib/games/arkanoid/` (`constants.ts`/`engine.ts`/`index.ts`) con API `createArkanoidGame(canvas, callbacks, extra?)`. Mismas mecánicas del fuente: paddle (mouse + teclado), pelota, bloques, explosiones, 5 niveles, 3 vidas, scoring +10/bloque, estados `title`/`playing`/`transition`/`gameover`/`victory`. Canvas 800×600. Sin dt cap heredado (se añade `MAX_DT=50ms` como guarda).
- Sprites del fuente (`assets/spritesheet-breakout.png` + `assets/spritesheet.js`): el engine carga el spritesheet y usa `drawSprite`/`drawFrame` para paddle, bloques y explosiones. Se copian los assets al proyecto.
- Audio del fuente: `ball-bounce.mp3` y `break-sound.mp3` (sin preloading, patrón `new Audio().play()`). Se copian los assets al proyecto.
- Wrapper aislado `components/games/ArkanoidGame.tsx` ("use client") que enlaza engine ↔ `PlayerScreen`. Usa `GameCanvas` con `width=800`, `height=600`.
- Guardado de score: `arkanoid` persiste en Supabase con `insertScore` (rama genérica `isRealGame`); toast "▸ PUNTUACIÓN GUARDADA_" solo tras éxito; bloqueo de doble guardado.
- Salón de la Fama: pestaña ARKANOID top 12 real con empty state "SIN PUNTUACIONES TODAVÍA"; "▸ TU MEJOR MARCA" con `fetchPlayerBest` (solo con usuario).
- Leaderboard del detalle: `arkanoid` top 10 real con empty state.
- Migración SQL: fila seed `arkanoid` en `public.games` (`on conflict do nothing`). `scores` y RLS intactos → no se regenera `app/database.types.ts`.

**Out of scope (para futuros specs):**

- Controles táctiles/mobile.
- Niveles custom o editor de niveles.
- Power-ups (no están en el fuente).
- CRUD de juegos, catálogo dinámico desde DB.
- Actualización automática de `best`/`plays`.
- Realtime. Tests automatizados. i18n.
- Migrar `bloque-buster` (simulación) ni reemplazarlo.

---

## Data model

### `app/data/games.ts` — nueva entrada (índice 2, tras `tetris`)

```ts
{
  id: "arkanoid",
  title: "ARKANOID",
  short: "Rebota la pelota y destruye muros de bloques.",
  long: "Pilota una nave-paleta y rebota un núcleo de plasma para pulverizar muros de bloques cromáticos. Cinco niveles con diseños imposibles, velocidad progresiva y explosiones de sprites. ¿Hasta dónde llegarás?",
  cat: "ARCADE",
  cover: "cover-arkanoid",
  color: "cyan",
  real: true,
  best: 0,
  plays: "0",
}
```

### `lib/games/registry.ts` — registro genérico (extensión aditiva)

Se añade `arkanoid` al array `REAL_GAMES`:

```ts
export const REAL_GAMES: readonly {
  id: string;
  Component: ComponentType<RealGameWrapperProps>;
}[] = [
  { id: 'asteroides', Component: AsteroidesGame },
  { id: 'tetris', Component: TetrisGame },
  { id: 'arkanoid', Component: ArkanoidGame },
];
```

### `public.games` — fila seed (migración SQL)

```sql
insert into public.games (id, title, cat, best, plays)
values ('arkanoid', 'ARKANOID', 'ARCADE', 0, 0)
on conflict (id) do nothing;
```

No cambia el esquema → no se regenera `app/database.types.ts`.

### `lib/games/arkanoid/` — engine (reescritura libre)

- `constants.ts` — W=800, H=600, MAX_DT=50, ROW_COLORS (6 colores), LEVELS (5 diseños con grid), BALL_SPEEDS (5 velocidades progresivas), PADDLE_W=120, PADDLE_H=16, BALL_R=8, BLOCK_W=52, BLOCK_H=20, BLOCK_GAP=2, BLOCKS_OFFSET_Y=60, SCORE_PER_BLOCK=10.
- `engine.ts` — `ArkanoidEngine implements GameEngine`: objetos `game`/`paddle`/`ball`/`blocks[]`/`explosions[]`, estados `title`/`playing`/`transition`/`gameover`/`victory`, loop con `requestAnimationFrame` + `MAX_DT=50ms`, carga de spritesheet, input (mouse + teclado), física de pelota (rebote en paredes/paddle/bloques con detección de solapamiento), scoring +10/bloque, vidas 3, transiciones 2s entre niveles, overlay de pausa con selector de niveles, dibujo de HUD en canvas (PUNTOS, VIDAS, NIVEL).
- `index.ts` — exporta `createArkanoidGame: GameEngineFactory`.

### Assets copiados al proyecto

- `public/games/arkanoid/spritesheet.png` — sprite atlas del fuente (`spritesheet-breakout.png`).
- `public/games/arkanoid/ball-bounce.mp3` — SFX rebote.
- `public/games/arkanoid/break-sound.mp3` — SFX rotura de bloque.

El engine carga el spritesheet via `Image()` y lo dibuja con `drawImage` (patrón del fuente `drawSprite`/`drawFrame`).

### `app/globals.css` — `.cover-arkanoid`

Bloque inspirado en `.cover-asteroides` / `.cover-tetris` (gradiente radial oscuro + bloques), sin tocar selectores existentes.

### `lib/games/types.ts` — sin cambios

El contrato ya tiene todo lo necesario: `GameCallbacks` (onScore, onLives, onLevel, onGameOver), `GameEngine` (reset, destroy, setPaused, endGame), `GameEngineFactory` con `extra?` (palette, previewCanvas). Arkanoid no usa onLines ni previewCanvas; palette es opcional.

---

## Implementation plan

1. **Añadir entrada `arkanoid` a `app/data/games.ts`** (índice 2, `real: true`) + `.cover-arkanoid` en `app/globals.css`. _Verificable:_ `tsc --noEmit`; `/games` muestra 11 cards; `getGameById("arkanoid")` resuelve.
2. **Copiar assets del fuente:** `spritesheet-breakout.png` → `public/games/arkanoid/spritesheet.png`; `ball-bounce.mp3` y `break-sound.mp3` → `public/games/arkanoid/`. _Verificable:_ archivos existen; `next build` los incluye.
3. **Crear `lib/games/arkanoid/constants.ts`** con W=800, H=600, MAX_DT=50, ROW_COLORS, LEVELS (5 grids), BALL_SPEEDS, PADDLE_W/H, BALL_R, BLOCK_W/H/GAP/OFFSET_Y, SCORE_PER_BLOCK. _Verificable:_ `tsc --noEmit`.
4. **Crear `lib/games/arkanoid/engine.ts`** con `ArkanoidEngine implements GameEngine`: loop rAF+MAX_DT, carga de spritesheet, objetos game/paddle/ball/blocks/explosions, estados title/playing/transition/gameover/victory, input mouse+teclado, física de pelota, scoring, vidas, transiciones 2s, overlay pausa con selector de niveles, draw con sprites. Callbacks: `onScore` al cambiar score, `onLives` al cambiar vidas, `onLevel` al avanzar nivel, `onGameOver(finalScore)` al terminar. `setPaused` congela loop; `endGame` fuerza game over; `reset` reinicia; `destroy` cancela rAF+listeners. Sin input en gameover. _Verificable:_ `tsc --noEmit`.
5. **Crear `lib/games/arkanoid/index.ts`** exportando `createArkanoidGame: GameEngineFactory`. _Verificable:_ `tsc --noEmit`.
6. **Crear `components/games/ArkanoidGame.tsx`** (wrapper aislado, "use client") usando `GameCanvas` con `width=800`, `height=600`. _Verificable:_ compila; el canvas aparece en `/player/arkanoid`.
7. **Registrar `arkanoid` en `lib/games/registry.ts`** y cablear `PlayerScreen` vía `getRealGame` (FIN → `end()`, JUGAR DE NUEVO → `reset()`). _Verificable:_ `/player/arkanoid` ejecuta el juego real.
8. **Migración SQL de seed** de `arkanoid` en `public.games` (vía `apply_migration`). _Verificable:_ `supabase_list_tables`; `insertScore` de prueba funciona con anon key.
9. **Guardado de score:** rama `isRealGame` en `handleSave` → `insertScore` con doble-guard; toast solo tras éxito. _Verificable:_ guardar crea una fila en `scores`.
10. **Leaderboard y Salón de la Fama reales** para `arkanoid` (top 10 detalle, top 12 salón, empty states, "TU MEJOR MARCA"). _Verificable:_ las filas recién guardadas aparecen.
11. **Verificación end-to-end manual** (jugable, HUD React ↔ canvas, pausa, FIN, game over, guardado, audio, navegación sin rAF huérfano; regresiones en los otros juegos).

---

## Acceptance criteria

- [ ] `getGameById("arkanoid")` resuelve; entrada con `real: true` en índice 2; `tetris` y `asteroides` sin cambios.
- [ ] `lib/games/arkanoid/` exporta `createArkanoidGame` y cumple el contrato `GameEngine`.
- [ ] `lib/games/registry.ts` registra `asteroides`, `tetris` y `arkanoid`; ningún componente compara `game.id === 'asteroides'`.
- [ ] `/player/arkanoid` ejecuta el juego real; el canvas muestra paddle, pelota, bloques y explosiones con sprites del fuente.
- [ ] El HUD React coincide en vivo (score, nivel, vidas=3) con el del canvas.
- [ ] Controles: mouse mueve paddle, flechas también; Space/clic lanza pelota; P/Esc pausa.
- [ ] 5 niveles funcionan con transiciones de 2s y velocidades progresivas.
- [ ] PAUSA congela y muestra "EN PAUSA" (overlay del contenedor); el engine no dibuja su propio overlay de pausa.
- [ ] FIN y game over/victoria abren el modal "FIN DEL JUEGO" con el puntaje real.
- [ ] Audio: rebote y rotura de bloques suenan al ocurrir (sin preloading).
- [ ] Guardar crea una fila en `scores` con `player_name`, `score` y `user_id: null`; el toast aparece solo tras éxito.
- [ ] Pulsar GUARDAR dos veces no duplica la fila.
- [ ] `/salon` muestra el top 12 real en la pestaña ARKANOID; con 0 filas muestra "SIN PUNTUACIONES TODAVÍA".
- [ ] Con usuario logueado, "TU MEJOR MARCA" muestra el mejor score real; sin usuario no se muestra.
- [ ] `/games/arkanoid` muestra el top 10 real; los juegos no registrados siguen seeded.
- [ ] `tsc --noEmit` pasa; `next build` pasa sin warnings nuevos.
- [ ] Consola del navegador sin errores en `/player/arkanoid`.

---

## Decisions

- **Yes:** id `arkanoid`, título `ARKANOID`, separado de `bloque-buster` (que queda intacto como simulación). Pedido explícito del usuario.
- **No:** reutilizar `bloque-buster` para alojar el juego real. El usuario pidió un id nuevo.
- **Yes:** reescritura libre del engine (no port literal de `game.js`). El usuario eligió esta opción; los bloques, niveles y mecánicas se reescriben desde cero manteniendo la misma jugabilidad.
- **No:** port literal clase a clase. El usuario descartó esta opción.
- **Yes:** sprites del fuente (`spritesheet-breakout.png`) para paddle, bloques y explosiones. El usuario confirmó que quiere los sprites originales.
- **No:** canvas puro (rectángulos/círculos sin sprites). El usuario prefirió sprites.
- **Yes:** audio del fuente (`ball-bounce.mp3`, `break-sound.mp3`) con patrón `new Audio().play()`. El usuario quiso incluir sonido.
- **No:** sin audio. El usuario descartó esta opción.
- **Yes:** 5 niveles (Clásico, Pirámide, Ajedrez, Huecos, Fortaleza) con `BALL_SPEEDS` progresivas. Confirmado por el usuario.
- **No:** reducir a 3 niveles. El usuario eligió los 5.
- **Yes:** `MAX_DT=50ms` como guarda en el loop (no está en el fuente). Patrón heredado de SPEC 05/07 para evitar espiral de muerte por blur.
- **No:** controles táctiles. Out of scope.
- **No:** power-ups. No están en el fuente.
- **No:** niveles custom o editor. Out of scope.
- **Yes:** registro genérico (`isRealGame`/`getRealGame`) para `arkanoid`. Sigue el patrón de SPEC 07.
- **Yes:** seed en `public.games` (`on conflict do nothing`); `scores` y RLS intactos; no se regeneran tipos.
- **Yes:** `best: 0` / `plays: "0"`.
- **Yes:** `arkanoid` en índice 2 de `GAMES` (tras `tetris`).
- **No:** migrar `bloque-buster` ni reemplazarlo. Queda intacto.
- **No:** realtime, tests automatizados, i18n, CRUD, catálogo dinámico.

---

## Risks

| Riesgo                                                             | Mitigación                                                                                                          |
| ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| Reescritura libre altera la jugabilidad del original               | Mismas constantes, niveles y mecánicas; QA manual comparando comportamiento con el fuente.                          |
| Carga de spritesheet falla en canvas del engine                    | Fallback: si la imagen no carga, dibujar bloques como rectángulos coloreados (patrón del fuente).                   |
| Audio con `new Audio()` causa lag o errores en algunos navegadores | Patrón del fuente; sin preloading; se ignora si falla.                                                              |
| Pausa del engine se solapa con overlay del contenedor              | El engine no dibuja overlay de pausa; `setPaused(true)` congela el loop y el contenedor muestra "EN PAUSA".         |
| Selector de niveles en pausa del fuente se omite en el engine      | El contenedor controla la pausa; el engine solo congela. Sin selector de niveles en pausa (el usuario no lo pidió). |
| INSERT duplicado al pulsar GUARDAR dos veces                       | Flags `saving`/`saved` ya existentes en `PlayerScreen`.                                                             |
| rAF huérfano al navegar                                            | `destroy()` cancela rAF y remueve listeners en el cleanup del host.                                                 |
| Canvas 800×600 desborda en pantallas pequeñas                      | Escalado CSS preservando aspect ratio; la resolución interna no cambia.                                             |
| `bloque-buster` (simulación) coexiste con `arkanoid` (real)        | Fichas independientes en `GAMES`; `bloque-buster` queda seeded sin cambios.                                         |

---

## What is **not** in this spec

- Controles táctiles/mobile.
- Power-ups (no están en el fuente).
- Niveles custom o editor de niveles.
- Migrar `bloque-buster` ni `rocas`; edición de juegos; CRUD; catálogo dinámico desde la DB.
- Actualización de `best`/`plays` desde `scores`.
- Realtime.
- Tests automatizados. i18n.
- Regenerar `app/database.types.ts` (no hay cambios de esquema).
