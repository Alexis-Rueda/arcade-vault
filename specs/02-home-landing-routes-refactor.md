# SPEC 02 — Home landing y refactor de rutas (/games)

> **Status:** Approved
> **Depends on:** SPEC 01
> **Date:** 2026-07-21
> **Objective:** Portar la pantalla de home (landing) del template `resources/templates/home-about/home.jsx` a Next.js con `/` como entrada, mover los datos de la home a `app/data/home.ts`, y renombrar las rutas `biblioteca` y `detalle` a `games` y `games/[id]` para que los CTAs de la home apunten a URLs reales.

---

## Scope

**In:**

- Nueva pantalla `HomeScreen` en `app/page.tsx` que renderiza la landing del template `resources/templates/home-about/home.jsx` con sus 7 secciones: hero, why/features, games preview, stats, activity (ticker + top), pricing/FAQ, final CTA.
- Datos nuevos en `app/data/home.ts` con cuatro constantes `ReadonlyArray<...>`: `FEATURES` (4), `STATS` (3), `ACTIVITY_TICKER` (7), `TOP_PLAYERS_TODAY` (5). Datos copiados del template, sin conexión a `useScores`.
- Tipos en `app/data/types.ts`: `HomeFeature`, `HomeStat`, `ActivityRow`, `TopPlayer` (todos `export type`).
- Clases CSS del bloque `===== HOME PAGE =====` y los keyframes/utilidades usadas (`.home-*`, `.feature-*`, `.mini-*`, `.home-stats`, `.home-final`, `.reveal`, `@keyframes float/bounce/reveal`, `.activity-grid`, `.ticker`, `.top-list`, `.pricing-grid`, `.price-card`, `.pricing-faq`) migradas desde `resources/templates/home-about/styles.css` al `app/globals.css` existente, sin pisar las clases del spec 01.
- Iconos SVG de `FeatureIcon` y las `FloatingSilhouettes` (`s1`–`s8`) portados como subcomponentes locales en `components/home/`.
- Componente client-side `useReveal` (IntersectionObserver) implementado como hook en `lib/hooks/useReveal.ts` para que las secciones aparezcan al entrar en viewport.
- **`app/page.tsx` deja de redirigir a `/biblioteca` y pasa a renderizar la `HomeScreen`.**
- **Refactor de rutas:**
  - `app/(vault)/biblioteca/page.tsx` → `app/(vault)/games/page.tsx` (mover el archivo, no duplicar).
  - `app/(vault)/detalle/[id]/page.tsx` → `app/(vault)/games/[id]/page.tsx` (mover el archivo, no duplicar).
  - Carpeta `app/(vault)/biblioteca` y `app/(vault)/detalle` eliminadas tras la mudanza.
- **`Route` type renombrado** en `app/data/types.ts`: `biblioteca` → `games`, `detalle` → `games-detail`. Los consumidores que usen el type se actualizan en este spec.
- **Callsites que apuntan a las rutas viejas actualizados:**
  - `components/Nav.tsx`: `isActive` ahora matchea `/` (home), `/games`, `/games/...`, `/player/...`; se añade link "INICIO" como primer item, antes de "JUEGOS". Logo apunta a `/`.
  - `components/AuthScreen.tsx`: ambos `router.push("/biblioteca")` → `router.push("/games")`.
  - `components/PlayerScreen.tsx`: `/detalle/${game.id}` → `/games/${game.id}`; `/biblioteca` → `/games`.
  - `components/GameDetailScreen.tsx`: `/biblioteca` → `/games`.
  - `components/LibraryScreen.tsx`: `/detalle/${g.id}` → `/games/${g.id}`.
  - `components/HallOfFameScreen.tsx`: `/biblioteca` → `/games`.
- Links de la home usan `<Link href="/games">` y `<Link href="/games/${id}">` directamente.
- La home muestra solo `GAMES.slice(0, 6)` en el preview rail. Filtros y búsqueda viven en `/games`.

**Out of scope (para futuros specs):**

- Página `/about` (template `resources/templates/home-about/about.jsx`). Spec propio si se pide.
- Conectar `ACTIVITY_TICKER` o `TOP_PLAYERS_TODAY` a `useScores` / `seededScores`. Spec 01 ya marca "no hay backend" y eso se respeta.
- Internacionalización. El copy queda en español, mismo idioma que el resto del proyecto.
- Animaciones adicionales (parallax, scroll-snap, video bg). Solo los keyframes del template.
- SEO específico de la home (metadata, og:image, sitemap). Se hereda lo que Next 16 genere por defecto.
- Lógica interna de los juegos (sigue pendiente desde spec 01).
- Autenticación real, ranking global persistente, tests, Storybook, CI/CD (sigue pendiente desde spec 01).
- Tests automatizados de la home.

---

## Data model

La home introduce cuatro arrays de datos estáticos y cuatro tipos asociados. Todo vive en `app/data/home.ts`. Los tipos se exportan también para que `HomeScreen` los importe sin duplicar.

```ts
// app/data/home.ts
import type { Game } from "./types";

export type HomeFeatureColor = "cyan" | "magenta" | "yellow" | "green";

export type HomeFeature = {
  icon: "GAMEPAD" | "FREE" | "TROPHY" | "ROCKET";
  title: string;
  desc: string;
  color: HomeFeatureColor;
};

export type HomeStat = {
  n: string; // valor grande, ej. "12+"
  u: string; // unidad/etiqueta, ej. "JUEGOS"
  s: string; // subtítulo, ej. "Y CONTANDO"
  color: HomeFeatureColor;
};

export type ActivityRow = {
  p: string; // nickname
  g: string; // nombre del juego
  s: number; // score
  t: string; // texto relativo, ej. "hace 2 min"
  c: HomeFeatureColor;
};

export type TopPlayer = {
  r: number; // rank 1-5
  p: string; // nickname
  s: number; // score
};

export const FEATURES: ReadonlyArray<HomeFeature> = [
  {
    icon: "GAMEPAD",
    title: "JUEGOS CLÁSICOS",
    desc: "Arkanoid, Tetris, Snake y muchos más. Los mejores arcades de todos los tiempos en un solo lugar.",
    color: "cyan",
  },
  {
    icon: "FREE",
    title: "100% GRATIS",
    desc: "Sin suscripciones, sin pagos ocultos. Todos los juegos disponibles de forma gratuita.",
    color: "yellow",
  },
  {
    icon: "TROPHY",
    title: "LADDER BOARDS",
    desc: "Compite con jugadores de todo el mundo. Escala el ranking y demuestra quién es el mejor.",
    color: "magenta",
  },
  {
    icon: "ROCKET",
    title: "SIEMPRE CRECIENDO",
    desc: "Agregamos nuevos juegos constantemente. Vuelve seguido, siempre habrá algo nuevo que jugar.",
    color: "green",
  },
];

export const STATS: ReadonlyArray<HomeStat> = [
  { n: "12+", u: "JUEGOS", s: "Y CONTANDO", color: "yellow" },
  { n: "MILES", u: "DE PARTIDAS", s: "JUGADAS CADA DÍA", color: "magenta" },
  { n: "GLOBAL", u: "RANKING", s: "COMPITE CON EL MUNDO", color: "cyan" },
];

export const ACTIVITY_TICKER: ReadonlyArray<ActivityRow> = [
  { p: "NEONFOX", g: "Caída", s: 184220, t: "hace 2 min", c: "magenta" },
  { p: "PX_KAI", g: "Glotón", s: 96400, t: "hace 5 min", c: "yellow" },
  { p: "Z3R0COOL", g: "Invasores", s: 54190, t: "hace 8 min", c: "green" },
  { p: "VAULT_07", g: "Rocas", s: 41200, t: "hace 12 min", c: "cyan" },
  { p: "GLITCHA", g: "Bloque Buster", s: 28450, t: "hace 18 min", c: "cyan" },
  { p: "ARKADYA", g: "Serpentina", s: 7820, t: "hace 24 min", c: "green" },
  { p: "CYBER_LU", g: "Ranaria", s: 18900, t: "hace 31 min", c: "yellow" },
];

export const TOP_PLAYERS_TODAY: ReadonlyArray<TopPlayer> = [
  { r: 1, p: "NEONFOX", s: 312840 },
  { r: 2, p: "PX_KAI", s: 248110 },
  { r: 3, p: "M00NRYU", s: 196720 },
  { r: 4, p: "VAULT_07", s: 154300 },
  { r: 5, p: "GLITCHA", s: 138900 },
];
```

`Game` (existente, de spec 01) se reusa en la sección "games preview" via `GAMES.slice(0, 6)`.

### Cambio colateral en `app/data/types.ts`

El union `Route` se renombra para reflejar las URLs reales:

```ts
// app/data/types.ts — diff
export type Route =
  | { name: "home" } // nuevo
  | { name: "games" } // antes "biblioteca"
  | { name: "games-detail"; id: string } // antes "detalle"
  | { name: "player"; id: string }
  | { name: "auth" }
  | { name: "salon" };
```

---

## Implementation plan

Cada paso deja el sistema funcional. Commits chicos.

1. **Refactor de tipos `Route` en `app/data/types.ts`.** Cambiar `biblioteca` → `games` y `detalle` → `games-detail`. Aún no se usa el type en runtime, pero el cambio deja el union correcto. _Verificable:_ `tsc --noEmit` pasa; `grep -rn '"biblioteca"\|"detalle"' app/ components/` da 0 hits.

2. **Mover `app/(vault)/biblioteca/page.tsx` a `app/(vault)/games/page.tsx`.** Crear carpeta `app/(vault)/games/`, mover archivo, eliminar `app/(vault)/biblioteca/`. _Verificable:_ `curl localhost:3000/games` carga biblioteca; `curl localhost:3000/biblioteca` da 404.

3. **Mover `app/(vault)/detalle/[id]/page.tsx` a `app/(vault)/games/[id]/page.tsx`.** Crear `app/(vault)/games/[id]/`, mover archivo, eliminar `app/(vault)/detalle/`. _Verificable:_ `curl localhost:3000/games/caida` carga detalle; `curl localhost:3000/detalle/caida` da 404.

4. **Actualizar callsites de rutas en componentes existentes:**
   - `components/Nav.tsx`: `isActive("biblioteca")` → `isActive("games")` con paths `/games`, `/games/`, `/player/`. Logo apunta a `/games` por ahora (paso 13 lo cambia a `/`).
   - `components/AuthScreen.tsx`: 2 × `/biblioteca` → `/games`.
   - `components/PlayerScreen.tsx`: `/detalle/${game.id}` → `/games/${game.id}`, `/biblioteca` → `/games`.
   - `components/GameDetailScreen.tsx`: `/biblioteca` → `/games`.
   - `components/LibraryScreen.tsx`: `/detalle/${g.id}` → `/games/${g.id}`.
   - `components/HallOfFameScreen.tsx`: `/biblioteca` → `/games`.
     _Verificable:_ `grep -rn '"/biblioteca"\|"/detalle' app/ components/` da 0 hits; flujos de navegación no rompen.

5. **Crear `app/data/home.ts`** con los cuatro arrays y los cuatro tipos del Data model. Sin consumo aún. _Verificable:_ `tsc --noEmit` no falla; `import { FEATURES } from "@/app/data/home"` resuelve.

6. **Crear `lib/hooks/useReveal.ts`.** Hook client-side que envuelve `IntersectionObserver`. Marca `.reveal` con `.reveal.in` al entrar en viewport. Requiere `"use client"`.

7. **Crear `components/home/FloatingSilhouettes.tsx`** (Server Component, SVG inline). Exporta las 8 siluetas (`s1`–`s8`) del template.

8. **Crear `components/home/FeatureIcon.tsx`** (Server Component, switch sobre `HomeFeature.icon`). Devuelve SVG pixel correspondiente.

9. **Crear `components/home/MiniCard.tsx`** (Server Component, recibe `{ game: Game }` y renderiza `cover-bg` + título + categoría). Click envuelto en `<Link href={`/games/${game.id}`}>`.

10. **Crear `components/home/HomeReveal.tsx`** (Client Component). Renderiza `<section className="home-section reveal">` y se auto-marca `.reveal.in` al entrar en viewport usando `useReveal`. Recibe `children` y `delayMs` opcional.

11. **Crear `components/HomeScreen.tsx`** (Server Component). Compone las 7 secciones del template. Secciones animadas envueltas en `<HomeReveal>`. CTAs:
    - "EXPLORAR JUEGOS" → `<Link href="/games">`
    - "CREAR CUENTA" → `<Link href="/auth">`
    - "VER TODOS LOS JUEGOS" → `<Link href="/games">`
    - "VER SALÓN" → `<Link href="/salon">`
    - "EMPEZAR GRATIS" → `<Link href="/auth">`
    - "INSERTAR MONEDA" → `<Link href="/games">`

12. **Reemplazar `app/page.tsx` con la `HomeScreen`.** Eliminar `redirect("/biblioteca")`, importar y renderizar `HomeScreen`. _Verificable:_ `curl localhost:3000/` devuelve 200 y muestra la landing.

13. **Actualizar `components/Nav.tsx` para incluir "INICIO" y apuntar logo a `/`.**
    - Logo: `Link href="/"`.
    - `isActive`: matchea "home" (`pathname === "/"`), "games" (`/games` o `/games/...` o `/player/...`).
    - Links visibles: `INICIO` (`/`), `JUEGOS` (`/games`), `SALÓN DE LA FAMA` (`/salon`).
      _Verificable:_ navegar cada ruta resalta el link correcto.

14. **Migrar bloque CSS de la home** desde `resources/templates/home-about/styles.css` (líneas 930–1147: `.home*`, `.feature-*`, `.mini-*`, `.home-stats`, `.home-final`, `.reveal`, `@keyframes float/bounce/reveal`, `.activity-grid`, `.ticker`, `.top-list`, `.pricing-grid`, `.price-card`, `.pricing-faq`) a `app/globals.css`. Sin duplicar selectores ya presentes. _Verificable:_ home se ve idéntica al template; pantallas de spec 01 no se alteran.

15. **Verificación end-to-end manual.** Checklist del navegador:
    - `localhost:3000/` muestra la landing completa (7 secciones).
    - Click en "EXPLORAR JUEGOS" → `/games`.
    - Click en MiniCard → `/games/${id}`.
    - Click en "VER SALÓN" → `/salon`.
    - En `/games`, click en GameCard → `/games/${id}`.
    - En `/games/${id}`, "VOLVER AL VAULT" → `/games`.
    - En player, "SALIR" → `/games/${id}`, "VOLVER AL VAULT" → `/games`.
    - En `/auth`, tras login → `/games`.
    - En `/salon`, "VOLVER" → `/games`.
    - Nav resalta correctamente en cada ruta.
    - Secciones de la home aparecen con animación al scrollear.
    - Consola del navegador sin errores ni warnings.

---

## Acceptance criteria

- [ ] `app/data/home.ts` existe y exporta `FEATURES` (4), `STATS` (3), `ACTIVITY_TICKER` (7) y `TOP_PLAYERS_TODAY` (5) como `ReadonlyArray<...>`, junto con sus tipos `HomeFeature`, `HomeStat`, `ActivityRow`, `TopPlayer`.
- [ ] `app/data/types.ts` define `Route` con los miembros: `home`, `games`, `games-detail` (con `id: string`), `player` (con `id: string`), `auth`, `salon`. No contiene `"biblioteca"` ni `"detalle"`.
- [ ] `grep -rn '"biblioteca"\|"/detalle\|/detalle/' app/ components/ lib/` devuelve 0 coincidencias.
- [ ] `curl localhost:3000/` responde 200 y renderiza la `HomeScreen` (no redirige).
- [ ] `curl localhost:3000/biblioteca` y `curl localhost:3000/detalle/caida` devuelven 404.
- [ ] `curl localhost:3000/games` y `curl localhost:3000/games/caida` responden 200.
- [ ] La `HomeScreen` renderiza las siete secciones en orden: hero, why/features, games preview, stats, activity (ticker + top), pricing/FAQ, final CTA.
- [ ] La sección "games preview" muestra exactamente 6 cards obtenidas de `GAMES.slice(0, 6)`, cada una envuelta en un `<Link>` a `/games/${game.id}`.
- [ ] El CTA "EXPLORAR JUEGOS" apunta a `/games`; "CREAR CUENTA" a `/auth`; "INSERTAR MONEDA" a `/games`.
- [ ] El ticker de activity muestra 7 filas de `ACTIVITY_TICKER` y top muestra 5 jugadores de `TOP_PLAYERS_TODAY`.
- [ ] `Nav` muestra links "INICIO", "JUEGOS", "SALÓN DE LA FAMA" en ese orden, desktop y mobile.
- [ ] Link "INICIO" activo cuando `pathname === "/"`.
- [ ] Link "JUEGOS" activo cuando `pathname` es `/games`, `/games/...` o `/player/...`.
- [ ] Logo del `Nav` apunta a `/`.
- [ ] Secciones con `.reveal` aparecen con animación al scrollear, sin parpadeo visible en primera pantalla.
- [ ] Pantallas existentes (`/auth`, `/salon`, `/player/[id]`, `/games`, `/games/[id]`) sin regresiones visuales ni de flujo.
- [ ] "VOLVER AL VAULT" desde `/games/[id]`, `/player/[id]` y modal de game-over llevan a `/games`.
- [ ] Bloque CSS de home está en `app/globals.css`. No quedan selectores `.home-*`, `.feature-*`, `.mini-*`, `.home-stats`, `.home-final`, `.activity-grid`, `.ticker`, `.top-list`, `.pricing-grid`, `.price-card`, `.pricing-faq` ni keyframes `float`/`bounce`/`reveal` sin migrar.
- [ ] `app/globals.css` no contiene selectores `.about-*`, `.contact-*`, `.contact-form`, `.terminal-success`, `.highlight*`.
- [ ] Consola del navegador sin errores ni warnings en `/`, `/games`, `/games/caida`, `/player/caida`, `/auth`, `/salon`.
- [ ] `tsc --noEmit` pasa sin errores.

---

## Decisions

- **Yes:** la home se renderiza en `/` (no en `/home` ni `/biblioteca`). Convierte la landing en la entrada real del sitio.
- **No:** mantener `/biblioteca` como alias o redirect 308. Crea doble URL, complica SEO. Ningún link externo apunta a esas rutas.
- **Yes:** renombrar URLs a `/games` y `/games/[id]`. Más corto, consistente con copy del template, jerarquía natural.
- **No:** dejar `/detalle/caida`. Rompía consistencia con `/games`.
- **Yes:** contenido de home en `app/data/home.ts` con constantes. Aísla copy, sigue patrón `app/data/games.ts` de spec 01.
- **No:** dejar contenido inline en `HomeScreen.tsx`. Acopla copy y estructura.
- **Yes:** activity y top son mocks estáticos del template. Spec 01 ya marca "no backend". El ticker decorativo no se conecta a scores.
- **No:** conectar `ACTIVITY_TICKER` o `TOP_PLAYERS_TODAY` a `useScores`. Scope creep.
- **Yes:** stats hardcodeadas como `STATS`. Son promesa de marca, no métrica derivada.
- **No:** derivar `STATS[0]` de `GAMES.length`. Mentiría visualmente.
- **Yes:** `HomeScreen` es Server Component, reveal y hooks van en subcomponentes `"use client"`. Home rápida, solo se hidrata lo necesario.
- **No:** marcar toda `HomeScreen` como `"use client"`. JS innecesario.
- **Yes:** refactor de rutas entra en este spec, no en uno aparte. Home depende de estos paths.
- **No:** spec separado de rutas. Crearía ventana de dependencia rota entre specs.
- **Yes:** `Route` type se renombra a `"games"` y `"games-detail"`. Refleja la URL real.
- **No:** mantener alias viejos en el type. Mentiría a consumidores futuros.
- **Yes:** archivos se mueven, no se duplican, al refactorizar. Cero riesgo de drift.
- **No:** redirects desde rutas viejas. No existían en producción.
- **Yes:** bloque CSS de home pegado al final de `app/globals.css`. Mantiene convención de spec 01.
- **No:** CSS Modules. Las clases de marca son globales y no se llevan bien con módulos.
- **Yes:** iconos SVG portados como subcomponentes en `components/home/`. Reutilizan `currentColor`.
- **No:** cada icono en su propio archivo. Sobrediseño para 4 iconos.
- **Yes:** animación reveal con un solo hook `useReveal` y wrapper `HomeReveal`. Reutilizable, sin dependencias.
- **No:** `framer-motion` o similar. No está en el stack; `IntersectionObserver` nativo cubre el caso.
- **Yes:** el bloque CSS de home **no** incluye la sección about. About va en su propio spec.
- **No:** copiar todo `styles.css` y borrar about después. Deja selectores huérfanos.
- **Yes:** home se aprueba con refactor de rutas incluido. Una sola revisión.

---

## Risks

| Riesgo                                                                                        | Mitigación                                                                                                          |
| --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `useReveal` requiere JS; con JS deshabilitado las secciones `.reveal` quedan con `opacity: 0` | Regla CSS por defecto: `.reveal { opacity: 1; transform: none; }`. Sin JS el contenido es visible.                  |
| `IntersectionObserver` no existe en navegadores muy viejos                                    | No aplica a este proyecto. Si se requiere soporte legacy en el futuro, fallback a `requestAnimationFrame` + scroll. |
| Refactor de rutas sin redirects rompe links legacy si existieran                              | Spec 01 está en entorno dev, no publicado. No hay tráfico legacy.                                                   |
| Migración de CSS puede traer selectores no usados                                             | Paso 14 exige diff manual: solo los selectores listados. Verificación con `grep`.                                   |
| `STATS[0].n = "12+"` miente si `GAMES.length` cambia                                          | Número es promesa de marca, no métrica. Editar constante cuando el catálogo cambie significativamente.              |
| `ACTIVITY_TICKER` con timestamps hardcodeados envejece                                        | Mock decorativo. Cuando se quiera dinámico, se reemplaza la constante.                                              |
| `MiniCard` envuelve toda la card en `<Link>`. Si hay links anidados, HTML inválido            | Hoy no hay links anidados. Si se añaden, cambiar `MiniCard` para que solo el cover/título sea link.                 |
| Mover carpetas rompe caché de Next                                                            | `rm -rf .next && next build` antes de probar.                                                                       |
| `HomeReveal` aplica `opacity: 0` antes de marcar `.in`. Flash de invisibilidad si JS tarda    | Contenido visible sin JS; animación solo encima. Flash de ~100ms aceptable.                                         |

---

## What is **not** in this spec

- Página `/about`. Su propio spec cuando se pida.
- Conectar activity/top a `useScores` o `seededScores`.
- Autenticación real (backend, JWT, OAuth).
- Ranking global persistente.
- Internacionalización. Todo en español.
- SEO específico de la home.
- Animaciones extra: parallax, scroll-snap, video de fondo.
- Tests automatizados de la home.
- Deploy, CI/CD, configuración de hosting.
- Redirects 308 desde rutas viejas. No existían en producción.
- Reescritura de copy de la home más allá del template.
- Lógica interna de los 8 juegos. Sigue pendiente desde spec 01.
