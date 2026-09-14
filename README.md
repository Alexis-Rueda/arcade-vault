# Arcade Vault

Plataforma de juegos arcade online con leaderboard persistente. Los usuarios juegan, competiran por las mayores puntuaciones y pueden autenticarse con email/password o OAuth (Google, GitHub).

## Tech Stack

- **Frontend:** Next.js 16.2.10 + React 19.2.4 + TypeScript 5
- **Styling:** Tailwind CSS v4 (PostCSS via `@tailwindcss/postcss`)
- **Backend:** Supabase (`@supabase/ssr` 0.12.4 + `@supabase/supabase-js` 2.112.0)
- **Email:** Resend 6.18.1
- **Metodologia:** Spec-Driven Design

## Juegos Implementados

Juegos con engines reales en `lib/games/<id>/` y catalogo en `app/data/games.ts`:

| ID             | Titulo       | Categoria | Skins | Motor Real |
| -------------- | ------------ | --------- | ----- | ---------- |
| `asteroides`   | ASTEROIDES   | SHOOTER   | Si    | Si         |
| `tetris`       | TETRIS       | PUZZLE    | Si    | Si         |
| `arkanoid`     | ARKANOID     | ARCADE    | Si    | Si         |
| `snake`        | SNAKE        | ARCADE    | Si    | Si         |
| `flappy-pixel` | FLAPPY PIXEL | ARCADE    | Si    | Si         |

Juegos mock (sin motor real, solo catalogo): `bloque-buster`, `caida`, `gloton`, `invasores`, `rocas`, `ranaria`, `duelo-pixel`.

## Arquitectura

```ts
app/
  layout.tsx, page.tsx, globals.css
  database.types.ts                    # Tipos generados desde Supabase
  (vault)/
    games/                             # Catalogo de juegos
    games/[id]/                        # Detalle de juego
    games/[id]/play/                   # PlayerScreen (canvas)
    player/[id]/                       # Perfil de jugador
    salon/                             # Hall of Fame
    about/                             # Pagina about + formulario contacto
    auth/                              # Login, registro, recuperar password
    auth/callback/route.ts             # OAuth callback
  api/contact/route.ts                 # Endpoint Resend

components/
  Nav.tsx, AuthScreen.tsx, HallOfFameScreen.tsx, PlayerScreen.tsx, ...
  games/                               # Canvas wrappers por juego

lib/
  supabase/
    client-browser.ts                  # Client components
    client-server.ts                   # Server Components / Route Handlers
    middleware.ts                      # Helper para proxy
    scores.ts                          # fetchLeaderboard, fetchPlayerBest, insertScore
  games/
    types.ts                           # GameEngine, GameCallbacks, GameHandle
    registry.ts                        # REAL_GAMES, isRealGame, getRealGame
    skins.ts                           # Sistema de skins (neon, retro, clasico)
    <id>/
      constants.ts                     # Constantes del juego
      engine.ts                        # Engine canvas
      index.ts                         # Factory create<Game>Game

  hooks/
    useReveal, useScores, useSkin, useUser

proxy.ts                               # Next 16 proxy (session + proteccion de rutas)
```

## Skills

Disponibles en `.agents/skills/`:

| Skill              | Uso                                                                              |
| ------------------ | -------------------------------------------------------------------------------- |
| `/frontend-design` | Diseno UI con direccion estetica intencional. Usar siempre al crear UI.          |
| `/spec`            | Disenar specs seccion por seccion en `specs/NN-slug.md` (estado `Draft`).        |
| `/spec-impl`       | Implementar specs en estado `Approved`. Crea branch `spec-NN-slug`.              |
| `/spec-impl-game`  | Implementa un spec aprobado y luego ejecuta `@skin-designer` y `@mobile-porter`. |
| `/add-game`        | Disenar el spec de un nuevo juego con su leaderboard en Supabase.                |

## Agents

Agents del proyecto en `.opencode/agents/` (se invocan con `@<nombre>`):

### @game-jam

Genera al menos 2 variantes de diseno de un juego arcade como specs en `specs/game-jam/`.

```bash
@game-jam space invaders    # genera variantes del juego
@game-jam puzzle platform   # concepto abstracto
```

### @game-planner

Planifica que juego construir siguiente, rankeando candidatos por hueco de genero, portabilidad y engagement.

```bash
@game-planner               # analiza catalogo y propone siguiente juego
```

### @skin-designer

Aplica skins (neon, retro, clasico) a un juego por invocacion. Crea infra compartida al primer uso.

```bash
@skin-designer tetris       # aplica skins a tetris
@skin-designer snake        # aplica skins a snake
@skin-designer flappy-pixel # aplica skins a flappy-pixel
```

### @mobile-porter

Adapta juegos para movil: UI responsiva, canvas responsive y controles tactiles.

```bash
@mobile-porter tetris       # adapta tetris para movil
@mobile-porter asteroides   # adapta asteroides para movil
```

### @game-performance-booster

Optimiza performance de engines canvas: constantes, render en pausa, timers, lookups O(1), cache.

```bash
@game-performance-booster tetris       # optimiza performance de tetris
@game-performance-booster flappy-pixel # optimiza flappy-pixel
```

### @security-auditor

Audita seguridad de DB (Supabase) y aplicacion (Next.js). Solo lectura — reporta hallazgos pero NO aplica fixes. Mantiene bitacora en `references/security/audit-log.md`.

```bash
@security-auditor full        # ambas categorias (default)
@security-auditor database    # solo Supabase (RLS, policies, advisors, SECURITY DEFINER)
@security-auditor application # solo Next.js (headers, proxy, regex, secrets)
@security-auditor dependencies # solo npm audit (vulnerabilidades)
```

**Checks de database:** RLS habilitado, politicas correctas, funciones SECURITY DEFINER, foreign keys sin indices, advisors Supabase.

**Checks de aplicacion:** Headers HTTP, proxy de rutas, validacion de contrasena, open redirect fix, secrets hardcodeados, .gitignore, dependencias vulnerables, service-role key, inserciones a scores.

## Spec-Driven Workflow

Specs en `specs/`. Flujo de estados:

```txt
Draft → Approved (humano) → Implemented
```

Implementaciones van directamente en `app/`, `components/`, `lib/`. `/spec-impl` solo actua sobre specs `Approved`.

Specs creados: 01 hasta 14 (MVP visual, home, about, Supabase, asteroides, leaderboard, tetris, arkanoid, snake, mobile touch, gamepad, flappy performance, auth, security hardening).

## Backend

### Supabase

- **Clientes:** `lib/supabase/client-browser.ts` (client components), `client-server.ts` (Server Components / Route Handlers), `middleware.ts` (helper).
- **Session:** manejada por `proxy.ts` en la raiz (Next 16 reemplaza `middleware.ts`).
- **Tipos:** regenerar `app/database.types.ts` con `supabase gen types typescript --project-id <ref>` cuando cambie el schema.
- **RLS:** habilitado en `games` y `scores`. Politicas documentadas en SPEC 14.

### Resend

- `lib/email/resend.ts` + `app/api/contact/route.ts`
- Formulario de contacto en `components/AboutScreen.tsx`

### Env Vias

Definidas en `.env.template`:

```txt
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

## Playwright MCP

**Regla:** Todas las screenshots se guardan obligatoriamente en `.playwright-screenshots/`. Usar `filename` relativo a esa carpeta.

```bash
# Ejemplo correcto
.playwright-screenshots/tetris-skin-test.png

# Ejemplo incorrecto
tetris-skin-test.png  # NO en la raiz
```

## Commands

```bash
npm run dev        # dev server
npm run build      # production build
npm run lint       # ESLint (flat config eslint.config.mjs)
npm run lint:fix   # ESLint con --fix
npm run format     # Prettier
```

No existen scripts `typecheck`, `test` o `format`.
