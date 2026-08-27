<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Arcade Vault

Online arcade games platform with persistent leaderboard. Next.js 16.2.10 + React 19.2.4 + Tailwind CSS v4 + TypeScript 5. Backend: Supabase (`@supabase/ssr` 0.12.4 + `@supabase/supabase-js` 2.112.0). Transactional email: Resend 6.18.1.

## Skills

Available in `.agents/skills/`:

- **`/frontend-design`** — UI design with intentional aesthetic direction (avoids "AI slop"). Always use when creating UI.
- **`/spec`** — design specs section by section in `specs/NN-slug.md` (`Draft` state by default). Ask before assuming.
- **`/spec-impl`** — implement specs in `Approved` state. Creates branch `spec-NN-slug`. Works step by step with pauses to review diffs.
- **`/add-game`** — design the spec for a new game (ported from `references/started-games/` or from scratch) with its Supabase leaderboard. Only generates the spec; implement with `/spec-impl`.

## Agents

Project-scoped opencode agents in `.opencode/agents/` (invoke with `@<name>`):

- **`@game-jam`** — given a theme/concept, derives a `game-id` and writes **≥2 distinct design variants** of the same game as specs in `specs/game-jam/<game-id>/` (local numbering `01-`, `02-`). States specs `Draft`; writes only `.md`, never code. Lives at `.opencode/agents/game-jam.md`.
- **`@game-planner`** — plans and decides which arcade game to build next in Arcade Vault. Inventories the catalog and available references, proposes ranked candidates by criteria (genre gap, portability, canvas-fit, leaderboard engagement, visual novelty) and keeps a persistent memory of suggestions in `references/game-suggestions-todo.md` to avoid repeats. Only recommends and records — never implements or writes specs. Lives at `.opencode/agents/game-planner.md`.

## Implemented Games

Full table in `references/implemented-games.md`.

Implemented: `asteroides`, `tetris`, `arkanoid`, `snake` and more (real engines in `lib/games/<id>/`, catalog in `app/data/games.ts` with `real: true`).

## Architecture

- `app/` — Next.js App Router.
  - `layout.tsx`, `page.tsx`, `globals.css` (Tailwind v4 + `.cover-*`, `.game-canvas`, `.game-arena` classes).
  - `database.types.ts` — types generated from Supabase (`supabase gen types typescript`).
  - `(vault)/` route group: `games/`, `games/[id]/`, `player/[id]/`, `salon/` (Hall of Fame), `about/`, `auth/`.
  - `api/contact/route.ts` — Resend endpoint for the About form.
  - `data/` — static catalogs (`games.ts`, `players.ts`, `scores.ts`, `home.ts`, `about.ts`, `types.ts`).
- `components/` — UI. Subfolders `games/` (canvas wrappers), `home/`, `about/`.
- `lib/`
  - `supabase/` — `client-browser.ts`, `client-server.ts`, `middleware.ts`, `scores.ts` (`fetchLeaderboard`, `fetchPlayerBest`, `insertScore`).
  - `games/` — `types.ts` (engine contract), `registry.ts` (`REAL_GAMES`, `isRealGame`, `getRealGame`), `drawWallBorder.ts`, and one directory per game (`<id>/{constants,engine,index}.ts` with `create<Game>Game(canvas, callbacks)`).
  - `hooks/` — `useReveal`, `useScores`, `useUser`.
  - `email/resend.ts`, `storage.ts`.
- `proxy.ts` (root) — Next 16 proxy that keeps the Supabase session on every request (replaces the old `middleware.ts`).
- `@/*` path alias maps to the project root (`.`).
- Tailwind v4: `@import "tailwindcss"` + `@theme` blocks. No `@tailwind` directives, no `tailwind.config`. PostCSS via the `@tailwindcss/postcss` plugin.

## Spec-Driven Workflow

Specs in **`specs/`**. State flow: `Draft` → `Approved` (set by a human) → `Implemented`. Implementations go directly in `app/`/`components/`/`lib/`. `/spec-impl` only acts on `Approved` specs.

## Backend (Supabase + Resend)

- **Clients**: `lib/supabase/client-browser.ts` (client components), `client-server.ts` (Server Components / Route Handlers / Server Actions), `middleware.ts` (helper).
- **Session**: managed by `proxy.ts` at the root (Next 16 replaces `middleware.ts`).
- **Types**: regenerate `app/database.types.ts` with `supabase gen types typescript --project-id <ref>` whenever the schema changes.
- **Env vars** (`.env.template`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- **Resend**: `lib/email/resend.ts` + `app/api/contact/route.ts`. The `components/AboutScreen.tsx` form posts to this endpoint.

## Playwright MCP

Playwright screenshots in `.playwright-screenshots/`.

## Commands

- `npm run dev` — dev server.
- `npm run build` — production build.
- `npm run lint` — ESLint (flat config `eslint.config.mjs`).
- `npm run lint:fix` — ESLint with `--fix`.
- `npm run format` — Prettier.
- No `typecheck` or `test` scripts.
