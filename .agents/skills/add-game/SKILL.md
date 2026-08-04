---
name: add-game
description: >-
  Diseña y guarda el spec para crear e integrar un nuevo juego arcade en Arcade
  Vault con su leaderboard en Supabase, siguiendo los patrones de SPEC 05
  (engine + canvas + wrapper + PlayerScreen) y SPEC 06 (games/scores + Salón de
  la Fama). El juego puede portarse desde references/started-games/ o diseñarse
  desde cero. Solo genera el spec (specs/NN-<slug>.md en estado Draft) — no
  implementa.
disable-model-invocation: true
argument-hint: '<id-del-juego o ruta en references/started-games>'
---

# /add-game — Diseñador de specs de juegos arcade

Este skill produce el spec que permite **crear e integrar un nuevo juego** en Arcade Vault con su **leaderboard en Supabase**, usando los patrones que ya se probaron en SPEC 05 (primer juego real) y SPEC 06 (leaderboard y scores). El spec resultante se implementa después con `/spec-impl`.

**El skill solo escribe el spec** (`specs/NN-<slug>.md`). No toca código de la plataforma.

Lee `template.md` (en este mismo directorio) en cada paso: es la forma exacta que debe seguir el spec, con los ejemplos concretos de la plataforma.

## Reglas duras

- **Nunca escribir código durante el comando.** Solo el archivo `.md` del spec al final.
- **Nunca proponer implementar el spec al guardarlo.** El trabajo termina cuando se escribe el archivo. El usuario corre `/spec-impl` cuando quiera.
- **Nunca asumir decisiones que el usuario no confirmó.** Si falta información, preguntar.
- **Nunca generar el spec completo en una sola respuesta.** Sección por sección, con confirmación.
- **Responder en el idioma del prompt inicial** (el repo usa español).
- Si el usuario quiere saltarse las preguntas, recordarle: "Las preguntas de ahora ahorran horas después. ¿Seguro?". Si insiste, respetarlo y anotarlo en Decisions ("Definición rápida sin aclaraciones en profundidad").

## Phase 0 — Contexto de la plataforma

Antes de preguntar, lee estos archivos para fundamentar el spec con nombres y patrones reales (lea solo lo necesario; el engine completo es largo, basta su cabeza y el `index.ts`):

- `specs/05-asteroides-game.md` y `specs/06-leaderboard-supabase.md` — los patrones a replicar.
- `app/data/types.ts` — tipo `Game` y `ScoreRow`.
- `app/data/games.ts` — catálogo (formato de ficha, orden, `getGameById`).
- `lib/games/types.ts` — contrato `GameCallbacks` / `GameEngine` / `GameEngineFactory` / `GameHandle`.
- `lib/games/asteroides/index.ts` y cabecera de `lib/games/asteroides/engine.ts` — ejemplo de factory y de port.
- `components/games/GameCanvas.tsx` y `components/games/AsteroidesGame.tsx` — host genérico y wrapper de referencia.
- `components/PlayerScreen.tsx` — ramificación actual (`game.id === 'asteroides'`), guardado y HUD.
- `components/GameDetailScreen.tsx` y `components/Leaderboard.tsx` — detalle con leaderboard real/seeded.
- `components/HallOfFameScreen.tsx` — pestañas, top 12 real, fila "TU MEJOR MARCA".
- `lib/supabase/scores.ts` — `fetchLeaderboard`, `fetchPlayerBest`, `insertScore`.
- `app/globals.css` — bloques `.cover-*` (`.cover-asteroides`, `.cover-rocas`), `.game-canvas`, `.game-arena`.
- `app/database.types.ts` — tipos `Games` y `Scores`.

Lista también `specs/` para conocer la numeración y las convenciones.

## Phase 1 — Definir el juego

Pregunta en bloques de 3 a 5, con opciones concretas y marcando tu recomendación. Espera respuesta tras cada bloque.

**Bloque A — Identidad** (si el usuario no la dio en el argumento):

1. **Id del juego** (slug, `kebab-case`, único). Recomendación: nombre corto en minúsculas.
2. **Título** (estilo arcade, en mayúsculas: "ASTEROIDES", "BLOQUE BUSTER").
3. **`short`** (una frase de tagline) y **`long`** (párrafo de descripción para el detalle).
4. **`cat`**: `ARCADE`, `PUZZLE`, `SHOOTER` o `VERSUS`.
5. **`color`**: `cyan`, `magenta`, `yellow` o `green`.

**Bloque B — Fuente del juego** (el usuario lo aclara: "pueden venir o no desde la carpeta de referencias"):

- **Opción 1 — Port desde `references/started-games/<carpeta>`:**
  - Localiza la carpeta (p. ej. `02-asteroids`, `03-tetris`, `04-arkanoid`).
  - Lee el `CLAUDE.md` / `AGENTS.md` / `README.md` de esa carpeta y su `game.js` (o archivos equivalentes) para extraer la arquitectura real.
  - Pide confirmación de la lista extraída: clases, loop, input, scoring, niveles, vidas, canvas size, estados, power-ups/features.
  - El spec exigirá un **port literal** a TypeScript: mismas constantes, mismo dt cap (50ms), misma jugabilidad; solo cambia la API (factory + callbacks).
- **Opción 2 — Juego desde cero:**
  - Preguntas de diseño: mecánica central, controles, scoring, vidas/niveles, condiciones de win/lose/game over, canvas (recomendación 800×600), estado visual/HUD propio en canvas.
  - El spec describe el juego nuevo; el engine se escribe de cero en el mismo contrato.
  - Para la dirección estética del cover usa `/frontend-design` o replica los `.cover-*` existentes (gradiente radial oscuro + puntos).

**Bloque C — Integración:**

6. **Leaderboard en Supabase:** default **sí** (persistir `insertScore`, top 12 en Salón de la Fama, top 10 en detalle). Preguntar solo si el juego podría no tenerlo.
7. **Registro como juego real:** default **sí** — el juego entra en el registro genérico `REAL_GAMES` (ver patrón abajo) y su pestaña del Salón de la Fama lee scores reales. Esto sustituye los checks hardcodeados de `asteroides`.
8. **Orden en el catálogo:** ¿dónde se inserta la ficha en `GAMES`? (default: tras `asteroides`, que es el primer juego real).
9. **`best` y `plays`:** seed del catálogo y de la fila en `public.games` (default `0` / `0`). No se actualizan automáticamente.

**Cuándo dejar de preguntar:** cuando puedas responder sin asumir (1) qué archivos aparecen o cambian, (2) cuál es el primer paso ejecutable y cuál el último, y (3) cómo se verifica que el juego está terminado.

## Phase 2 — Generar el spec sección por sección

Desarrolla `template.md` en orden estricto, mostrando cada sección formateada y esperando confirmación antes de pasar a la siguiente:

1. **Header** (Estado `Draft`, depende de SPEC 05 y SPEC 06, fecha, objetivo en una frase).
2. **Scope** (In / Out). El "Out" debe incluir lo que se decide diferir: audio, controles táctiles, OVNIs/features que no estén en el código fuente, CRUD de juegos, actualización de `best`/`plays`, realtime, tests.
3. **Data model** (ficha de catálogo, entrada del registro, cover CSS, SQL de seed en `games`, notas sobre `scores`).
4. **Implementation plan** (pasos numerados, cada uno deja el sistema funcional; ver la plantilla).
5. **Acceptance criteria** (checklist booleano y verificable).
6. **Decisions** (Yes/No con razón, estilo SPEC 05/06).
7. **Risks** (tabla; omitir solo si no hay riesgos relevantes).
8. **What is NOT in** (refuerzo final).

### Patrones de la plataforma que el spec debe respetar

Estos son los hechos confirmados que el spec debe reflejar con nombres reales:

- **Ficha de catálogo** en `app/data/games.ts` con `real: true` (campo nuevo opcional en `Game`). El catálogo es la fuente del UI; la tabla `games` de Supabase es solo referencia/FK.
- **Contrato del engine** en `lib/games/types.ts`: `GameCallbacks` (`onScore`/`onLives`/`onLevel`/`onGameOver`), `GameEngine` (`reset`/`destroy`/`setPaused`/`endGame`), `GameEngineFactory`, `GameHandle`. El engine vive en `lib/games/<id>/` (`constants.ts`/`engine.ts`/`index.ts`) y se crea con una factory `create<Name>Game(canvas, callbacks)`.
- **Host genérico** `components/games/GameCanvas.tsx` ya existe y es reutilizable. Cada juego añade su **wrapper** `components/games/<Name>Game.tsx` (isolado, "use client").
- **Registro genérico** (refactor necesario para soportar N juegos reales):
  - Nuevo `lib/games/registry.ts` con `RealGameWrapperProps`, `REAL_GAMES`, `isRealGame(id)` y `getRealGame(id)`.
  - `PlayerScreen`, `GameDetailScreen` y `HallOfFameScreen` dejan de comparar `game.id === 'asteroides'` y usan el registro. `asteroides` y el juego nuevo se registran.
  - Default de pestaña en el Salón de la Fama: primer juego real del catálogo (`GAMES[0]`).
- **Supabase:** `scores` ya existe (RLS: SELECT público + INSERT anónimo, sin UPDATE/DELETE; CHECK `score >= 0`). El juego nuevo necesita una **migración SQL de seed** en `public.games` (`on conflict (id) do nothing`) para que la FK de `scores.game_id` funcione. No cambia el esquema → no hay que regenerar `app/database.types.ts` salvo que el spec añada columnas.
- **Guardado de score** en `PlayerScreen` vía `insertScore({ gameId, playerName, score, userId: null })`: `player_name` del usuario logueado o `INVITADO`; toast "▸ PUNTUACIÓN GUARDADA_" solo tras éxito; bloqueo de doble guardado (flag `saving`/`saved`).
- **Port literal:** si el juego viene de `references/started-games/`, el port debe conservar constantes, dt cap, HUD del canvas y controles tal cual; sin reinicio por Space en `gameover`; los listeners se registran/desregistran con el lifecycle del engine (sin rAF huérfano).
- **Verificación final** en el spec: `tsc --noEmit`, `next build` sin warnings nuevos, `npm run dev`, y E2E manual (jugable, guardado crea fila, salón top 12 real, empty state si no hay filas, regresiones en los otros juegos).

## Phase 3 — Guardar el spec

Cuando todas las secciones estén confirmadas:

1. Determina el siguiente número secuencial de `specs/` (si el último es `06-...`, este será `07-`).
2. Genera el slug del objetivo (p. ej. `tetris-real` → `07-tetris-real.md`).
3. Confirma el nombre de archivo con el usuario antes de escribirlo.
4. Crea `specs/NN-slug.md` con todas las secciones aprobadas.
5. Estado **`Draft`** por defecto. No marcar `Approved` automáticamente.
6. Confirma al usuario:
   - Ruta del archivo creado.
   - Recordatorio: el spec está en `Draft`; cámbialo a `Approved` cuando lo revises.
   - Siguiente paso: una vez aprobado, correr `/spec-impl NN-slug` para implementarlo.
   - **Detente aquí.** No propongas implementar el spec ni tocar código.
