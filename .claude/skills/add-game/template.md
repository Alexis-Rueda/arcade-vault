# Plantilla del spec de un juego arcade

Archivo de referencia que `/add-game` consulta al generar specs. Es la **forma** del spec, con los ejemplos concretos de la plataforma. No es texto para copiar literal: los nombres reales (id, rutas, SQL) dependen del juego definido en la Phase 1.

Nota: las vallas de ejemplo usan 4 backticks para permitir bloques `ts`/`sql` anidados. El spec final usa vallas normales de 3 backticks.

---

## Header

```markdown
# SPEC NN — <Título corto y descriptivo>

> **Status:** Draft
> **Depends on:** SPEC 05 (juego real), SPEC 06 (leaderboard Supabase)
> **Date:** YYYY-MM-DD
> **Objective:** Una sola frase. Si necesitas dos, el feature es demasiado grande.
```

Estados válidos: `Draft`, `In review`, `Approved`, `Implemented`, `Obsolete`.

---

## Section 1 — Scope

Dos bloques explícitos, ambos obligatorios.

```markdown
## Scope

**In:**

- Nueva entrada de juego `<id>` en `app/data/games.ts` (catálogo a N+1 juegos) con `real: true`.
- Cover nueva `.cover-<id>` en `app/globals.css` siguiendo el patrón `.cover-asteroides`.
- Port del juego a TypeScript en `lib/games/<id>/` con API `create<Name>Game(canvas, callbacks): GameEngine`. [O: juego diseñado desde cero con estas mecánicas: …]
- Wrapper aislado `components/games/<Name>Game.tsx` ("use client") que enlaza engine ↔ `PlayerScreen`.
- Refactor de registro genérico: `real?: boolean` en `Game`, nuevo `lib/games/registry.ts` (`REAL_GAMES`, `isRealGame`, `getRealGame`); `PlayerScreen`, `GameDetailScreen` y `HallOfFameScreen` dejan de usar `game.id === 'asteroides'` y leen el registro. `asteroides` y `<id>` quedan registrados.
- Migración SQL: fila seed de `<id>` en `public.games` (`on conflict do nothing`). `scores` no cambia (RLS, CHECK, FK intactos).
- Guardado de score: `<id>` persiste en Supabase con `insertScore` (`player_name` del usuario logueado o `INVITADO`, `user_id: null`); toast "▸ PUNTUACIÓN GUARDADA_" solo tras éxito; bloqueo de doble guardado.
- Salón de la Fama: la pestaña `<id>` lee el top 12 real de `scores` con empty state "SIN PUNTUACIONES TODAVÍA"; fila "▸ TU MEJOR MARCA" con `fetchPlayerBest` (solo con usuario). Pestaña activa por defecto: primer juego real de `GAMES`.
- Leaderboard del detalle: `<id>` lee el top 10 real con empty state.

**Out of scope (para futuros specs):**

- [Lo que se decida diferir: audio, táctil, features que no están en el código fuente, CRUD, best/plays auto, realtime, tests, …]
```

---

## Section 2 — Data model

Estructuras concretas con nombres reales. Snippets cortos, no funciones completas.

````markdown
## Data model

### `app/data/games.ts` — nueva entrada

```ts
{
  id: "<id>",
  title: "<TÍTULO>",
  short: "<tagline>",
  long: "<descripción>",
  cat: "<CAT>",
  cover: "cover-<id>",
  color: "<cyan|magenta|yellow|green>",
  real: true,
  best: 0,
  plays: "0",
}
```

### `lib/games/registry.ts` — registro genérico (nuevo)

```ts
export type RealGameWrapperProps = {
  paused: boolean;
  onScore: (score: number) => void;
  onLives: (lives: number) => void;
  onLevel: (level: number) => void;
  onOver: (finalScore: number) => void;
  handleRef: { current: GameHandle | null };
};
export const REAL_GAMES: readonly { id: string; Component: ComponentType<RealGameWrapperProps> }[];
export const isRealGame = (id: string): boolean;
export const getRealGame = (id: string): { id: string; Component: ComponentType<RealGameWrapperProps> } | undefined;
```

### `public.games` — fila seed (migración SQL)

```sql
insert into public.games (id, title, cat, best, plays)
values ('<id>', '<TÍTULO>', '<CAT>', 0, 0)
on conflict (id) do nothing;
```

No cambia el esquema → no se regenera `app/database.types.ts`.

### `lib/games/<id>/` — engine (port o desde cero)

- `constants.ts` — W/H, MAX_DT, constantes de juego.
- `engine.ts` — clases y loop implementando `GameEngine`.
- `index.ts` — exporta `create<Name>Game: GameEngineFactory`.

### `app/globals.css` — `.cover-<id>`

Bloque inspirado en `.cover-asteroides` / `.cover-rocas` (gradiente radial oscuro + puntos), sin tocar selectores existentes.
````

---

## Section 3 — Implementation plan

Pasos numerados; cada uno deja el sistema funcional y commiteable. Si un paso requiere más de 30–50 líneas, divídelo. El último paso no es "probar todo" — eso es la sección de criterios.

```markdown
## Implementation plan

1. **Añadir entrada `<id>` a `app/data/games.ts`** (`real: true`) + `.cover-<id>` en `app/globals.css`. _Verificable:_ `tsc --noEmit`; `/games` muestra la card; `getGameById("<id>")` resuelve.
2. **Refactor a registro genérico:** `real?: boolean` en `Game`, crear `lib/games/registry.ts`, y que `PlayerScreen`/`GameDetailScreen`/`HallOfFameScreen` usen `isRealGame`/`getRealGame` con `asteroides` registrado. _Verificable:_ sin regresiones; las rutas reales siguen funcionando.
3. **Crear `lib/games/<id>/`** con el port literal [o el juego desde cero] implementando el contrato (`setPaused`, `reset`, `endGame`, `destroy`, callbacks `onScore`/`onLives`/`onLevel`/`onGameOver`; sin input en `gameover`, sin reinicio por Space). _Verificable:_ `tsc --noEmit`.
4. **Crear `components/games/<Name>Game.tsx`** (wrapper aislado usando `GameCanvas`). _Verificable:_ compila; el canvas aparece en `/player/<id>`.
5. **Registrar `<id>` en `lib/games/registry.ts`** y cablear `PlayerScreen` vía `getRealGame` (FIN → `end()`, JUGAR DE NUEVO → `reset()`). _Verificable:_ `/player/<id>` ejecuta el juego real.
6. **Migración SQL de seed** en `public.games` (via `supabase` MCP `apply_migration` o CLI). _Verificable:_ `supabase_list_tables`; insertar un score de prueba funciona con anon key.
7. **Guardado de score:** rama `<id>` en `handleSave` → `insertScore` con doble-guard; toast solo tras éxito. _Verificable:_ guardar crea una fila en `scores`.
8. **Leaderboard y Salón de la Fama reales** para `<id>` (top 10 detalle, top 12 salón, empty states, "TU MEJOR MARCA"). _Verificable:_ las filas recién guardadas aparecen.
9. **Verificación end-to-end manual** (jugable, HUD React ↔ canvas, pausa, FIN, game over, guardado, navegación sin rAF huérfano; regresiones en los otros juegos).
```

---

## Section 4 — Acceptance criteria

Checklist booleano, cada ítem verificable con sí/no.

```markdown
## Acceptance criteria

- [ ] `getGameById("<id>")` resuelve; entrada con `real: true`; resto del catálogo intacto.
- [ ] `lib/games/<id>/` exporta `create<Name>Game` y cumple el contrato `GameEngine`.
- [ ] `lib/games/registry.ts` registra `asteroides` y `<id>`; ningún componente compara `game.id === 'asteroides'`.
- [ ] `/player/<id>` ejecuta el juego real; el HUD React coincide en vivo con el del canvas.
- [ ] PAUSA congela y muestra "EN PAUSA"; FIN y game over abren el modal con el puntaje real.
- [ ] Guardar crea una fila en `scores` con `player_name`, `score` y `user_id: null`; el toast aparece solo tras éxito.
- [ ] Pulsar GUARDAR dos veces no duplica la fila.
- [ ] `/salon` muestra el top 12 real en la pestaña <ID>; con 0 filas muestra "SIN PUNTUACIONES TODAVÍA".
- [ ] Con usuario logueado, "TU MEJOR MARCA" muestra el mejor score real; sin usuario no se muestra.
- [ ] `/games/<id>` muestra el top 10 real; los juegos no registrados siguen seeded.
- [ ] `tsc --noEmit` pasa; `next build` pasa sin warnings nuevos.
- [ ] Consola del navegador sin errores en `/player/<id>`.
```

---

## Section 5 — Decisions taken and discarded

Capture lo que se consideró, no solo lo elegido. Una línea Yes/No + razón breve.

```markdown
## Decisions

- **Yes:** <decisión>. <razón>.
- **No:** <alternativa descartada>. <razón>.
- …
```

Ejemplos típicos: port literal vs reescritura; fuente references vs desde cero; registro genérico vs hardcode; seed en `public.games`; `user_id` null hasta auth real; sin audio/táctil/OVNIs; empty state; pestaña default del salón; orden en el catálogo.

---

## Section 6 — Identified risks (optional)

Solo si hay riesgos no obvios. Tabla sencilla.

```markdown
## Risks

| Riesgo                                       | Mitigación                                                              |
| -------------------------------------------- | ----------------------------------------------------------------------- |
| El port a TS altera la jugabilidad           | Port literal: mismas constantes y dt cap; QA comparando comportamiento. |
| INSERT duplicado al pulsar GUARDAR dos veces | Bloquear el botón mientras inserta y flag `saved` tras éxito.           |
| rAF huérfano al navegar                      | `destroy()` cancela rAF y remueve listeners en el cleanup del host.     |
| Canvas desborda en pantallas pequeñas        | Escalado CSS preservando aspect ratio (resolución interna no cambia).   |
```

---

## Section 7 — What is **not** in this spec

Refuerzo final de lo que no se hace, cada item con su propio spec si llega.

```markdown
## What is **not** in this spec

- [Audio / táctil / features del código fuente no presentes / …].
- Actualización de `best`/`plays` desde `scores`.
- Auth real / edición de juegos / catálogo dinámico desde la DB.
- Realtime.
- Tests automatizados.
```
