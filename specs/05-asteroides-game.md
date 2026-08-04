# SPEC 05 — Asteroides, primer juego real (port a Next.js)

> **Status:** Implemented
> **Depends on:** SPEC 01, SPEC 02
> **Date:** 2026-08-04
> **Objective:** Adaptar el juego Asteroides (HTML5 canvas vanilla en `resources/started-games/02-asteroids/`) a la plataforma Next.js como primer juego real del catálogo, portándolo a un engine TypeScript que vive en su propio canvas conservando su HUD y controles, notificando score/vidas/nivel/game-over a React para el HUD del contenedor, la pausa y el guardado de puntuación.

---

## Scope

**In:**

- Nueva entrada de juego **`asteroides`** (título "ASTEROIDES") en `app/data/games.ts`, independiente de `rocas` (que se queda intacto). Catálogo pasa a 9 juegos: 9 cards en `/games`, 9 tabs en `/salon`. Cover nueva `.cover-asteroides` en `app/globals.css`.
- Port del juego a TypeScript en `lib/games/asteroides/` con API `createAsteroidesGame(canvas, callbacks): GameEngine`. Se conserva el juego tal cual: clases `Bullet`/`Asteroid`/`Ship`/`PowerUp`/`Particle`, canvas 800×600, espacio toroidal (`wrap`), power-up 3×, partículas de explosión, estados `playing/dead/gameover`, y el **HUD propio dibujado en canvas** (`SCORE`, `NIVEL`, vidas, indicador `3x`). Controles de teclado (`←` `→` `↑` `Espacio`).
- El engine **notifica a React** vía callbacks: `onScore`, `onLives`, `onLevel`, `onGameOver(finalScore)`. El HUD del contenedor refleja los mismos valores (se usan ambos HUDs, no se borra el del juego).
- Contrato tipado compartido en `lib/games/types.ts`: `GameCallbacks`, `GameEngine` (`reset`, `destroy`, `setPaused`, `endGame`), `GameEngineFactory`, `GameHandle`.
- Host genérico `components/games/GameCanvas.tsx` (monta el canvas, instancia el engine, sincroniza pausa, expone handle, destroy en unmount) — reutilizable por los próximos juegos.
- Wrapper aislado `components/games/AsteroidesGame.tsx` ("use client") que enlaza engine ↔ `PlayerScreen`.
- Ruta genérica `/player/[id]`: `PlayerScreen` queda como cascarón común (barra HUD, botones PAUSA/FIN/SALIR, overlay "EN PAUSA", modal "FIN DEL JUEGO" + guardado). Ramifica: si `game.id === "asteroides"` → `<AsteroidesGame>`, si no → la simulación actual, sin tocar los otros 8 juegos.
- **Pausa controlada desde el contenedor:** el botón PAUSA del `PlayerScreen` llama a `engine.setPaused(true)`, que congela el loop; el overlay "EN PAUSA" es el del contenedor.
- **Game over:** al perder las 3 vidas (o al pulsar FIN) → `onGameOver` → se abre el modal con el puntaje final → guardado en `av_scores` con el flujo actual (`addScore` + "▸ PUNTUACIÓN GUARDADA_").
- **Reinicio:** "JUGAR DE NUEVO" llama a `engine.reset()`. Se **desactiva el reinicio por Space** del propio juego (el modal controla el reinicio).
- Protecciones: listeners de teclado se registran/desregistran con el lifecycle del engine (sin rAF huérfano tras navegar); el engine no procesa input en `gameover` (evita que las teclas del input de iniciales disparen el juego).

**Out of scope (para futuros specs):**

- Controles táctiles/mobile.
- OVNIs (la descripción de la ficha los menciona, pero `game.js` no los implementa).
- Los otros 7 juegos reales (siguen en simulación).
- Migrar `rocas` a juego real o reemplazarlo.
- Persistencia nueva: sigue `av_scores` en localStorage.
- Leaderboard Supabase / backend.
- Sonido/audio.
- Pausa automática por blur de pestaña (el dt cap de 50ms del original ya evita el espiral de muerte).
- i18n.
- Tests automatizados.
- Rediseño del contenedor player.

---

## Data model

No hay tablas ni persistencia nueva. Dos estructuras nuevas:

### `app/data/games.ts` — nueva entrada (insertada tras `rocas`)

```ts
{
  id: "asteroides",
  title: "ASTEROIDES",
  short: "Pulveriza rocas en gravedad cero.",
  long: "Tu nave triangular flota en vacío absoluto. Dispara y rota para dividir rocas en fragmentos cada vez más pequeños. Con la racha justa desbloqueas disparo triple.",
  cat: "SHOOTER",
  cover: "cover-asteroides",
  color: "yellow",
  best: 0,
  plays: "0",
}
```

### `lib/games/types.ts` — contrato (nuevo)

```ts
export type GameCallbacks = {
  onScore?: (score: number) => void;
  onLives?: (lives: number) => void;
  onLevel?: (level: number) => void;
  onGameOver?: (finalScore: number) => void;
};

export interface GameEngine {
  reset(): void; // re-inicia la partida (initGame) y reanuda
  destroy(): void; // cancela rAF y remueve listeners de window
  setPaused(paused: boolean): void; // congela/reanuda el loop
  endGame(): void; // fuerza game over → dispara onGameOver(score)
}

export type GameEngineFactory = (
  canvas: HTMLCanvasElement,
  callbacks: GameCallbacks,
) => GameEngine;

export type GameHandle = { end(): void; reset(): void };
```

### `app/globals.css` — `.cover-asteroides`

Bloque nuevo inspirado en `.cover-rocas` (gradiente radial oscuro + puntos), sin tocar los selectores existentes.

---

## Implementation plan

Cada paso deja el sistema funcional. Commits chicos.

1. **Añadir entrada `asteroides` a `app/data/games.ts`** (ficha completa, `best: 0`, `plays: "0"`). _Verificable:_ `tsc --noEmit` pasa; `/games` muestra 9 cards; `getGameById("asteroides")` resuelve; `/games/asteroides` carga el detalle; `rocas` intacto.

2. **Añadir `.cover-asteroides` a `app/globals.css`.** _Verificable:_ la card de ASTEROIDES muestra su cover; `grep "cover-asteroides" app/globals.css` → 1 hit.

3. **Crear `lib/games/types.ts`** con el contrato. _Verificable:_ `tsc --noEmit` pasa (aún sin consumidores).

4. **Portar el engine a `lib/games/asteroides/`** (`constants.ts`, `engine.ts`, `index.ts`). Port fiel de `game.js` con estos cambios:
   - API `createAsteroidesGame(canvas, callbacks)`; sin referencias globales (W/H se derivan del canvas o constantes).
   - Notificaciones: `onScore` al cambiar score, `onLives` al cambiar vidas, `onLevel` al avanzar de nivel, `onGameOver(finalScore)` al terminar.
   - `setPaused`: congela el loop (no avanza `dt`); `endGame()`: fuerza game over; `reset()`: `initGame()` + reanuda; `destroy()`: cancela rAF + `removeEventListener` de `keydown`/`keyup`.
   - Eliminar el reinicio por `Space` en estado `gameover`; el input solo se procesa en `playing`/`dead`.
   - Conservar: HUD en canvas, power-ups 3×, partículas, wrap, dt cap 50ms.
     _Verificable:_ `tsc --noEmit` pasa; `next build` no mete el engine en el bundle del servidor (solo lo importa un client component).

5. **Crear `components/games/GameCanvas.tsx`** (host genérico, `"use client"`). Props: `{ factory, callbacks, paused, handleRef }`. Crea el `<canvas>`, instancia el engine en `useEffect`, sincroniza `paused`, expone `GameHandle`, `destroy()` en cleanup. _Verificable:_ `tsc` pasa (sin consumidor todavía).

6. **Crear `components/games/AsteroidesGame.tsx`** (wrapper aislado). Props: `{ paused, onScore, onLives, onLevel, onOver, handleRef }`. Usa `GameCanvas` con `createAsteroidesGame`; canvas con `className="game-canvas"`. _Verificable:_ compila; el canvas aparece en `/player/asteroides` (aún sin llamadas del contenedor).

7. **Refactorizar `components/PlayerScreen.tsx`:**
   - `lives` pasa a estado con setter (hoy es fijo 3).
   - Nivel: alimentado por `onLevel` del engine para `asteroides`; derivado de score como hoy para el resto.
   - `gameRef = useRef<GameHandle | null>(null)`.
   - Ramificación en el `CrtFrame`: `game.id === "asteroides"` → `<AsteroidesGame paused={paused} onScore={setScore} onLives={setLives} onLevel={setLevel} onOver={(final) => { setScore(final); setOver(true); }} handleRef={gameRef} />`; si no → arena simulada actual (sin cambios).
   - Botón FIN: si `asteroides` → `gameRef.current?.end() ?? endGame()`; si no → `endGame()`.
   - `restart()`: resetea estados + `gameRef.current?.reset()`.
   - Modal, guardado (`addScore`), overlay "EN PAUSA" y botones intactos.
     _Verificable:_ `/player/asteroides` ejecuta el juego real; los 8 juegos restantes idénticos a hoy.

8. **Verificación end-to-end manual:**
   - `npm run dev` arranca sin errores.
   - `/player/asteroides`: nave visible y controlable con `←` `→` `↑` `Espacio`; asteroides parten en fragmentos; puntaje sube (HUD canvas y barra React coinciden en vivo); vidas bajan al colisionar con reaparición parpadeante; nivel avanza al limpiar el campo; power-up 3× aparece y funciona.
   - PAUSA congela el juego y muestra "EN PAUSA"; REANUDAR continúa.
   - FIN → modal con el puntaje real.
   - Perder 3 vidas → modal automático con puntaje final.
   - Guardar → "▸ PUNTUACIÓN GUARDADA_"; JUGAR DE NUEVO resetea engine; SALIR → `/games/asteroides`.
   - Escribir iniciales en el modal no dispara el juego.
   - Navegar a otra ruta y volver: sin rAF huérfano, sin errores de consola.
   - `/games` (9 cards), `/salon` (9 tabs), home, auth, about sin regresiones.
   - `tsc --noEmit` pasa; `next build` pasa sin warnings nuevos.

---

## Acceptance criteria

- [ ] `getGameById("asteroides")` resuelve; entrada con `id: "asteroides"`, `title: "ASTEROIDES"`, `cat: "SHOOTER"`, `cover: "cover-asteroides"`. `rocas` sin cambios.
- [ ] `grep "cover-asteroides" app/globals.css` → 1 hit; card de ASTEROIDES muestra cover propio.
- [ ] `lib/games/types.ts` exporta `GameCallbacks`, `GameEngine`, `GameEngineFactory`, `GameHandle`.
- [ ] `lib/games/asteroides/` existe y exporta `createAsteroidesGame`.
- [ ] El engine conserva clases `Bullet`/`Asteroid`/`Ship`/`PowerUp`/`Particle`, wrap, power-up 3×, partículas y HUD propio en canvas (SCORE/NIVEL/vidas/3x).
- [ ] El engine no reinicia con Space en `gameover`.
- [ ] `components/games/GameCanvas.tsx` (host) y `components/games/AsteroidesGame.tsx` (wrapper) existen; ningún otro juego importa el engine de asteroides.
- [ ] En `/player/asteroides` el canvas muestra el juego real; los 8 juegos restantes muestran la simulación actual sin cambios.
- [ ] Score, vidas y nivel de la barra React coinciden en vivo con el HUD del canvas.
- [ ] PAUSA congela y muestra "EN PAUSA"; REANUDAR continúa.
- [ ] FIN y game over natural abren el modal "FIN DEL JUEGO" con el puntaje real.
- [ ] Guardar llama a `addScore` y muestra "▸ PUNTUACIÓN GUARDADA_".
- [ ] JUGAR DE NUEVO resetea el engine.
- [ ] Escribir en el input del modal no dispara input del juego.
- [ ] Navegar fuera de `/player/asteroides` no deja rAF huérfano (consola sin errores).
- [ ] `tsc --noEmit` pasa; `next build` pasa sin warnings nuevos.
- [ ] Consola del navegador sin errores en `/player/asteroides`.

---

## Decisions

- **Yes:** juego nuevo con id `asteroides`, separado de `rocas`. Pedido explícito del usuario; el catálogo ya tenía un juego parecido, pero este es independiente.
- **No:** reutilizar `rocas` para alojar el juego. El usuario pidió un juego nuevo con su propio id.
- **Yes:** port a TypeScript (`lib/games/asteroides/`). Proyecto 100% tipado; facilita callbacks, pausa y lifecycle.
- **No:** montar `game.js` vanilla. Perdería tipos y el puente engine↔React.
- **Yes:** el juego conserva su canvas, controles y HUD internos tal cual; React los refleja en el HUD del contenedor. Pedido explícito ("vamos a usar los dos").
- **No:** borrar el HUD del canvas. Pedido explícito del usuario.
- **Yes:** ruta genérica `/player/[id]` con `PlayerScreen` como cascarón común y cada juego aislado en `components/games/`. Pedido explícito ("ruta genérica para mantener cada juego aislado").
- **No:** ruta propia por juego (`/juegos/asteroides`) ni lógica mezclada en `PlayerScreen`.
- **Yes:** host genérico `GameCanvas`. Pedido explícito ("sí host mínimo").
- **Yes:** pausa controlada desde el contenedor (`engine.setPaused`). Pedido explícito del usuario.
- **No:** pausa por tecla dentro del juego.
- **Yes:** callbacks unidireccionales engine→React (`onScore`/`onLives`/`onLevel`/`onGameOver`).
- **Yes:** game over (natural o por FIN) → modal del contenedor → guardado en `av_scores` con el flujo actual. Confirmado.
- **Yes:** reinicio por Space desactivado; el modal controla el reinicio con `engine.reset()`. Evita conflicto con el input de iniciales.
- **No:** OVNIs (la descripción los menciona, el código no). Out.
- **No:** controles táctiles. Decidido por el usuario.
- **No:** audio/sonido.
- **No:** tests automatizados (el proyecto no tiene infraestructura de tests).
- **No:** pausa automática por blur. El dt cap de 50ms ya cubre el caso.
- **Yes:** escalado CSS del canvas (mantiene 800×600 internos, se escala con `max-width`/aspect ratio) para no desbordar en pantallas pequeñas.
- **Yes:** `best: 0` / `plays: "0"` en la entrada nueva; el salón genera sus scores con `seededScores` como los demás juegos.

---

## Risks

| Riesgo                                                           | Mitigación                                                                                                          |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| HUD duplicado (canvas + React) se desincroniza                   | El engine es la única fuente de verdad; los callbacks van solo engine→React. QA de paridad visual en el paso 8.     |
| Listeners globales de teclado interfieren con el input del modal | El engine solo procesa input en `playing`/`dead`; en `gameover` ignora teclas (incluido Space).                     |
| rAF huérfano al navegar                                          | `destroy()` cancela rAF y remueve listeners en el cleanup del host.                                                 |
| Canvas 800×600 desborda en pantallas pequeñas                    | Escalado CSS preservando aspect ratio; la resolución interna no cambia.                                             |
| El port a TS altera la jugabilidad del original                  | Port literal clase a clase con la misma lógica; dt cap y constantes idénticas. QA manual comparando comportamiento. |
| Catálogo a 9 juegos rompe algo (salon/home)                      | Se revisa en el paso 8: 9 tabs en salon, home preview sigue `slice(0,6)` sin cambios.                               |
| Pulsar FIN sin engine montado (`gameRef` null)                   | Fallback a `endGame()` del contenedor (mismo comportamiento simulado).                                              |

---

## What is **not** in this spec

- Controles táctiles.
- OVNIs.
- Los 7 juegos restantes reales.
- Migrar `rocas` a juego real ni reemplazarlo.
- Persistencia nueva (sigue `av_scores` en localStorage).
- Leaderboard Supabase / backend.
- Audio/sonido.
- Pausa automática por blur de pestaña.
- i18n.
- Tests automatizados.
- Rediseño del contenedor player.
- Cambios en la resolución interna del canvas (solo escalado CSS).
