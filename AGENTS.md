<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Arcade Vault

Next.js 16.2.10 + React 19.2.4 + Tailwind CSS v4 + TypeScript 5.

## Skills

Usa siempre /frontend-design para diseñar interfaces de usuario.

## Architecture

- `app/` — Next.js App Router entrypoints (`layout.tsx`, `page.tsx`, `globals.css`)
- `@/*` path alias maps to project root (`.`)
- Tailwind v4: uses `@import "tailwindcss"` + `@theme` blocks (no `@tailwind` directives, no `tailwind.config`)
- PostCSS via `@tailwindcss/postcss` plugin (v4 PostCSS plugin)

## Spec-Driven Workflow

- Write specs in `spec/`, implementations in `spec-impl/` (directories don't exist yet — create as needed)
- Methodology: `https://github.com/Klerith/fernando-skills`
- Run `npx skills@latest add Klerith/fernando-skills` to install tooling
