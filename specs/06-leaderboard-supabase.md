# SPEC 06 — Leaderboard y tabla de juegos en Supabase

> **Status:** Implemented
> **Depends on:** SPEC 04 (integración Supabase), SPEC 05 (juego real ASTEROIDES)
> **Date:** 2026-08-04
> **Objective:** Crear en Supabase las tablas `games` (solo lectura, seed con ASTEROIDES) y `scores`, cablear el Salón de la Fama y el leaderboard de cada juego para leer puntuaciones reales, y persistir en la nube los scores de ASTEROIDES con `player_name` + `user_id` nullable, manteniendo los otros 8 juegos con sus datos seeded actuales.

---

## Scope

**In:**

- Migración SQL de Supabase con dos tablas nuevas:
  - `games` — `id` (text PK), `title`, `cat`, `best` (int), `plays` (int), `created_at`. Seed: solo `asteroides`.
  - `scores` — `id` (uuid PK, `gen_random_uuid()`), `game_id` (text FK → `games.id`, ON DELETE CASCADE), `player_name` (text), `score` (int ≥ 0), `user_id` (uuid nullable, sin uso por ahora), `created_at` (timestamptz default `now()`).
- **RLS:** `games` → SELECT público, sin escritura. `scores` → SELECT público, INSERT anónimo permitido, sin UPDATE ni DELETE.
- Regenerar `app/database.types.ts` con `supabase gen types` (queda con `Games` y `Scores`).
- Capa de datos nueva en `lib/supabase/scores.ts` (cliente browser): `fetchLeaderboard(gameId)`, `fetchPlayerBest(gameId, playerName)`, `insertScore(entry)`.
- **Guardado de score:** `asteroides` persiste en Supabase con `player_name` (del usuario logueado o `INVITADO`) y `user_id: null`; el toast "▸ PUNTUACIÓN GUARDADA_" aparece solo si el INSERT fue exitoso. Los otros 8 juegos conservan el guardado actual en localStorage (sin cambios).
- **Salón de la Fama (`HallOfFameScreen`):** la pestaña `asteroides` lee el top 12 real de `scores`; si no hay filas muestra "SIN PUNTUACIONES TODAVÍA"; la fila "▸ TU MEJOR MARCA" muestra el mejor score real del usuario (por `player_name`). Las otras 8 pestañas siguen con `seededScores`. Al entrar al Salón de la Fama, la pestaña activa por defecto es `asteroides` (no `GAMES[0]`).
- **Leaderboard del detalle (`Leaderboard`):** `asteroides` lee el top 10 real con empty state; el resto sigue seeded.
- La UI sigue leyendo el catálogo de `app/data/games.ts` (la tabla `games` es solo referencia/FK).
- **Orden del catálogo:** `asteroides` pasa a ser el primer juego de `GAMES` (afecta la biblioteca `/games`, el home y las pestañas del Salón de la Fama).

**Out of scope (para futuros specs):**

- Auth real de Supabase (sign up/login/sesiones).
- Edición/gestión de juegos (CRUD admin); `games` es solo lectura.
- Migración de `av_scores` (localStorage) a Supabase — se empieza limpio.
- Filas en `games` para los otros 8 juegos.
- Catálogo dinámico desde la DB (home, library, salon siguen con `games.ts`).
- Actualización automática de `best`/`plays` desde `scores`.
- Realtime (suscripciones a cambios).
- Tests automatizados.

---

## Data model

Dos tablas nuevas en Supabase (schema `public`). El resto de estructuras (catálogo, usuario, ScoreRow) siguen iguales.

### `games` — seed solo con `asteroides`

```sql
create table if not exists public.games (
  id         text primary key,
  title      text not null,
  cat        text not null,
  best       integer not null default 0,
  plays      integer not null default 0,
  created_at timestamptz not null default now()
);

insert into public.games (id, title, cat, best, plays)
values ('asteroides', 'ASTEROIDES', 'SHOOTER', 0, 0)
on conflict (id) do nothing;
```

### `scores`

```sql
create table if not exists public.scores (
  id          uuid primary key default gen_random_uuid(),
  game_id     text not null references public.games(id) on delete cascade,
  player_name text not null,
  score       integer not null check (score >= 0),
  user_id     uuid,
  created_at  timestamptz not null default now()
);

create index if not exists scores_game_idx on public.scores (game_id, score desc, created_at asc);
```

### RLS

```sql
alter table public.games enable row level security;
alter table public.scores enable row level security;

create policy "games_select" on public.games for select using (true);
create policy "scores_select" on public.scores for select using (true);
create policy "scores_insert" on public.scores for insert with check (true);
```

### Tipos generados

`app/database.types.ts` se regenera (`supabase gen types`) y queda con `Database["public"]["Tables"]` = `{ Games, Scores }`.

### Funciones de `lib/supabase/scores.ts` (nuevo, cliente browser)

```ts
type ScoreInsert = { gameId: string; playerName: string; score: number; userId?: string | null };

fetchLeaderboard(gameId: string, limit: number = 12): Promise<ScoreRow[]> // score desc, created_at asc
fetchPlayerBest(gameId: string, playerName: string): Promise<number | null>
insertScore(entry: ScoreInsert): Promise<void> // user_id = null por ahora
```

**Nota:** el campo de jugador en `scores` se llama `player_name` (no `name`) y `user_id` queda nullable porque hoy no hay auth real. `scores.id` se añade como PK de fila (buena práctica para RLS y futuras operaciones), además de las columnas que pediste.

---

## Implementation plan

Cada paso deja el sistema funcional. Commits chicos.

1. **Migración SQL en Supabase:** crear `games` + `scores` con seed de `asteroides` y políticas RLS (SQL del data model, vía dashboard o `supabase db`). _Verificable:_ las tablas existen en `supabase_list_tables`; insertar un score de prueba y borrarlo manualmente funciona con anon key.

2. **Regenerar tipos:** `npx supabase gen types typescript --project-id thgwxvlxcusuzmtzwctf > app/database.types.ts`. _Verificable:_ el archivo exporta `Database` con `Tables.Games` y `Tables.Scores`.

3. **Crear `lib/supabase/scores.ts`** con `fetchLeaderboard`, `fetchPlayerBest`, `insertScore` usando `createBrowserClient`. `insertScore` lanza error si falla. _Verificable:_ `tsc --noEmit` pasa (aún sin consumidores).

4. **Guardado de score en `PlayerScreen`:** si `game.id === 'asteroides'` → `insertScore` async (gameId, playerName del estado `name`, score, user_id null); el toast "▸ PUNTUACIÓN GUARDADA_" solo si resuelve. Si no → flujo actual localStorage. Evitar doble insert si el usuario pulsa dos veces. _Verificable:_ en `/player/asteroides`, guardar crea una fila en `scores`; los otros 8 juegos guardan igual que hoy.

5. **Leaderboard de detalle (`Leaderboard.tsx`):** prop `real` (gameId real o no). Si real → `fetchLeaderboard(gameId, 10)` con empty state "SIN PUNTUACIONES TODAVÍA"; si no → `seededScores`. _Verificable:_ `/games/asteroides` muestra filas reales; `/games/caida` seeded igual que hoy.

6. **Salón de la Fama (`HallOfFameScreen.tsx`):** pestaña `asteroides` → `fetchLeaderboard('asteroides', 12)` real con empty state; fila "▸ TU MEJOR MARCA" → `fetchPlayerBest('asteroides', user.name)` real (solo si hay user). Otras pestañas → `seededScores` sin cambios. _Verificable:_ `/salon` muestra el score recién guardado en la pestaña ASTEROIDES; el resto idéntico.

7. **Verificación end-to-end manual:**
   - `npm run dev` arranca sin errores.
   - Jugar y guardar en `/player/asteroides`: toast aparece; la fila aparece en `/salon` pestaña ASTEROIDES y en `/games/asteroides`.
   - Sin sesión (no logueado): guarda como `INVITADO`, `user_id` null; fila "TU MEJOR MARCA" no se muestra.
   - Con sesión: fila "TU MEJOR MARCA" muestra el mejor score real del usuario.
   - Score 0 o nombre vacío se guardan sin romper.
   - Pulsar GUARDAR dos veces crea una sola fila.
   - `/games/caida`, `/salon` (otras pestañas), home, about sin regresiones.
   - `tsc --noEmit` pasa; `next build` pasa sin warnings nuevos.

---

## Acceptance criteria

- [ ] `supabase_list_tables` muestra `games` y `scores` en schema `public`.
- [ ] `games` contiene exactamente 1 fila: `asteroides` (title `ASTEROIDES`, cat `SHOOTER`, best `0`, plays `0`).
- [ ] `scores` tiene columnas `id`, `game_id`, `player_name`, `score`, `user_id` (nullable), `created_at`; FK a `games(id)` con ON DELETE CASCADE; CHECK `score >= 0`.
- [ ] RLS activo en ambas tablas: SELECT público; `scores` permite INSERT anónimo; no hay UPDATE ni DELETE permitidos.
- [ ] `app/database.types.ts` regenerado exporta `Database` con `Tables.Games` y `Tables.Scores`.
- [ ] `lib/supabase/scores.ts` exporta `fetchLeaderboard`, `fetchPlayerBest` e `insertScore`.
- [ ] En `/player/asteroides`, guardar un score crea una fila en `scores` con `player_name`, `score` y `user_id: null`; el toast aparece solo tras éxito.
- [ ] Pulsar GUARDAR dos veces no duplica la fila.
- [ ] Los otros 8 juegos guardan score exactamente como hoy (localStorage).
- [ ] En `/salon`, la pestaña ASTEROIDES muestra el top 12 real de `scores`; con 0 filas muestra "SIN PUNTUACIONES TODAVÍA".
- [ ] En `/salon`, con usuario logueado, la fila "▸ TU MEJOR MARCA" muestra el mejor score real de ese `player_name` para `asteroides`; sin usuario no se muestra.
- [ ] En `/games/asteroides`, el leaderboard muestra el top 10 real con empty state; en `/games/caida` sigue seeded.
- [ ] `tsc --noEmit` pasa sin errores.
- [ ] `next build` pasa sin warnings nuevos.
- [ ] `/salon` (otras pestañas), `/games`, home, about y auth sin regresiones visuales ni de consola.

---

## Decisions

- **Yes:** tabla `games` solo como referencia/FK, seed únicamente con `asteroides`. Pedido explícito del usuario ("solo asteroides"); la UI sigue leyendo `app/data/games.ts`.
- **No:** migrar el catálogo completo a Supabase. Los otros 8 juegos son simulaciones; su catálogo sigue en código.
- **Yes:** `games` con `id`, `title`, `cat`, `best`, `plays` (solo lectura). Pedido explícito; sin CRUD por ahora.
- **No:** `short`/`long`/`cover`/`color` en `games`. No se usan; la UI los lee de `games.ts`.
- **Yes:** `scores` con `id` (uuid PK), `game_id`, `player_name`, `score`, `created_at` y `user_id` nullable. Pedido explícito del usuario; `id` añadido como PK de fila.
- **No:** `name` como columna — se usa `player_name`. Denominación pedida por el usuario.
- **Yes:** persistir solo scores de `asteroides` en Supabase; los otros 8 conservan localStorage.
- **No:** migrar `av_scores` existentes — se empieza limpio. Pedido explícito.
- **Yes:** RLS con SELECT público + INSERT anónimo en `scores`, sin UPDATE/DELETE. Pedido explícito del usuario.
- **No:** auth real de Supabase en este spec. `user_id` queda null hasta un spec de auth.
- **No:** restringir inserción vía Edge Function. El INSERT anónimo con RLS es suficiente para hoy.
- **Yes:** el toast "▸ PUNTUACIÓN GUARDADA_" solo tras INSERT exitoso, y bloqueo de doble guardado.
- **Yes:** empty state "SIN PUNTUACIONES TODAVÍA" para `asteroides` sin filas; el resto sigue seeded. Pedido explícito.
- **Yes:** fila "▸ TU MEJOR MARCA" con el mejor score real del usuario (por `player_name`). Pedido explícito.
- **Yes:** pestaña inicial del Salón de la Fama = `asteroides` (en vez de `GAMES[0]`). Pedido explícito (amendment 2026-08-04).
- **Yes:** `asteroides` como primer juego del catálogo (`GAMES[0]`), para que sea el primero en biblioteca, home y pestañas del Salón de la Fama. Pedido explícito (amendment 2026-08-04).
- **No:** realtime/suscripciones. Refetch al montar y al cambiar de pestaña es suficiente.
- **No:** actualizar `best`/`plays` de `games` desde `scores`. Fuera de scope.
- **No:** tests automatizados (el proyecto no tiene infraestructura de tests).
- **Yes:** "Definición rápida sin aclaraciones en profundidad" — definido de forma concisa por decisión del usuario.

---

## Risks

| Riesgo                                                            | Mitigación                                                                                                  |
| ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| INSERT anónimo permite spam/score imposibles                      | RLS limita a INSERT sin UPDATE/DELETE; CHECK `score >= 0`. Límites más finos se deciden en un spec de auth. |
| Duplicados de score al pulsar GUARDAR dos veces                   | Deshabilitar el botón mientras inserta y bloquear re-save tras éxito (flag `saved` ya existente).           |
| Guardado falla por red → el usuario pierde el score               | Toast solo en éxito; en error se muestra mensaje sin marcar `saved`, permitiendo reintentar.                |
| `created_at` (timestamptz) se muestra en huso distinto            | Formateo en el cliente con `toLocaleDateString('es-ES')` (mismo patrón que los `seededScores`).             |
| Tabla `games` vacía o sin `asteroides` rompe la FK del guardado   | Seed idempotente (`on conflict do nothing`) en la migración.                                                |
| La fila "TU MEJOR MARCA" con duplicados de nombre mezcla personas | Aceptado: sin auth real no hay identidad fiable; se resolverá con `user_id` en el spec de auth.             |
