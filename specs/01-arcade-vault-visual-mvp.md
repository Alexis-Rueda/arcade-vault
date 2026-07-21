# SPEC 01 — MVP Visual Arcade Vault (5 pantallas)

> **Status:** Approved
> **Depends on:** —
> **Date:** 2026-07-21
> **Objective:** Portar el template HTML+JSX de Arcade Vault a Next.js 16 con App Router, rutas reales, persistencia en `localStorage` y componentes tipados, sin implementar la lógica interna de los juegos.

---

## Scope

**In:**

- Las cinco pantallas del template: `biblioteca`, `detalle`, `reproductor`, `auth`, `salon` (la sexta ruta es `/`, que redirige a `/biblioteca`).
- Componentes compartidos en `components/`: `Nav`, `Footer`, `GameCard`, `Modal`, `Podium`, `Leaderboard`, `CrtFrame`, `UserButton`, `SearchBar`, `CategoryChips`, `Button`, `ClientOnly`, `FadeIn`.
- Datos estáticos portados a TypeScript en `app/data/`: `GAMES`, `CATS`, `PLAYERS`, `seededScores`, más tipos (`Game`, `User`, `ScoreEntry`, `Route`).
- Hooks de cliente en `lib/hooks/`: `useLocalStorage`, `useUser`, `useScores`. La ruta activa se obtiene con `usePathname()` de `next/navigation`.
- Persistencia en `localStorage` para `av_user` (sesión) y `av_scores` (puntuaciones guardadas), igual que el template.
- Estilos retro del template migrados a `app/globals.css` (ya hechos) y consumidos con clases utility; sin Tailwind para las clases de marca (`.btn`, `.card`, `.cover-*`, `.crt`, `.modal`, `.podium`).
- Tipografía `Press Start 2P` + `JetBrains Mono` vía `next/font` (ya configurado en `app/layout.tsx`).
- Rutas reales del App Router: `/biblioteca`, `/detalle/[id]`, `/player/[id]`, `/auth`, `/salon`, más redirect `/` → `/biblioteca`.
- Componentes marcados como `"use client"` solo donde haya estado / efectos (los listados en `lib/hooks/` y los interactivos de cada pantalla). Las páginas que solo renderizan datos estáticos pueden quedar como Server Components.
- Sin elementos nuevos: nada de ranking social, ni comentarios, ni multiplayer, ni editor visual, ni carga dinámica de juegos desde API.

**Out of scope (para futuros specs):**

- Lógica interna de los 8 juegos (rebote de pelota, tetrominós, serpiente, etc.). El `reproductor` solo muestra el HUD, la pausa, el fin y el modal de guardado con datos simulados (igual que el template).
- Autenticación real (backend, JWT, OAuth). El `auth` acepta cualquier valor y lo guarda en `localStorage`; el botón de Google/GitHub es decorativo.
- Ranking global persistente. Las puntuaciones se guardan en `localStorage` y el `salon` las cruza con `seededScores`; no hay backend.
- Internacionalización. Todo el copy queda en español, igual que el template.
- Tests automatizados, Storybook o suite de accesibilidad.
- Modo oscuro/claro alterno. Solo el tema retro oscuro.
- Deploy y configuración de CI/CD.

---

## Data model

Toda la data mock vive en `app/data/` para que mañana esa carpeta se reemplace por una capa de acceso a base de datos sin tocar el resto. El resto del modelo (storage, hooks) se queda en `lib/`.

```ts
// app/data/games.ts — reemplazar en el futuro por queries a la DB
export type GameCategory = "ARCADE" | "PUZZLE" | "SHOOTER" | "VERSUS";

export type Game = {
  id: string;            // kebab-case, único
  title: string;
  short: string;
  long: string;
  cat: GameCategory;
  cover: string;         // clase CSS .cover-*
  color: "cyan" | "magenta" | "yellow" | "green";
  best: number;
  plays: string;
};

export const CATS: ReadonlyArray<"TODOS" | GameCategory> = [
  "TODOS", "ARCADE", "PUZZLE", "SHOOTER", "VERSUS",
];

export const GAMES: ReadonlyArray<Game> = [ /* 8 juegos del template */ ];
```

```ts
// app/data/players.ts
export const PLAYERS: ReadonlyArray<string> = [ /* 18 nicknames del template */ ];
```

```ts
// app/data/scores.ts — generador determinista; mañana: tabla de scores
export type ScoreRow = {
  rank: number;
  name: string;
  score: number;
  date: string;          // "DD/MM/2026"
};

export function seededScores(seed: number, count?: number): ScoreRow[];
```

```ts
// app/data/types.ts — tipos compartidos del dominio
export type User = {
  name: string;          // hasta 10 chars, mayúsculas
  loggedAt: number;
};

export type ScoreEntry = {
  game: string;          // Game.id
  name: string;
  score: number;
  at: number;
};

export type Route =
  | { name: "biblioteca" }
  | { name: "detalle"; id: string }
  | { name: "player"; id: string }
  | { name: "auth" }
  | { name: "salon" };
```

```ts
// lib/storage.ts — única pieza fuera de app/data; depende del navegador
const KEYS = {
  user: "av_user",
  scores: "av_scores",
} as const;

export function readUser(): User | null;
export function writeUser(u: User | null): void;
export function readScores(): ScoreEntry[];
export function appendScore(entry: Omit<ScoreEntry, "at">): void;
```

**Mapeo a la futura DB (documentado en spec, no en código):**

| Mock actual (`app/data/`)   | Reemplazo futuro              |
| --------------------------- | ----------------------------- |
| `games.ts` → `GAMES`        | `getGames()`, `getGameById()` |
| `players.ts` → `PLAYERS`    | `getRandomPlayers(n)`         |
| `scores.ts` → `seededScores`| `getTopScores(gameId, n)`     |
| `storage.ts` (`av_user`)    | sesión gestionada por el back |
| `storage.ts` (`av_scores`)  | tabla `scores` persistida     |

**Convenciones:**

- `id` en kebab-case, único dentro de `GAMES`.
- `seededScores` mantiene la misma firma `(seed, count=12)` y el mismo PRNG (`s = s * 9301 + 49297`) del template, para que los números visibles en `detalle` y `salon` coincidan.
- Hooks en `lib/hooks/` consumen `app/data/*` y `lib/storage.ts`; usan `useSyncExternalStore` con `getServerSnapshot` neutro para evitar mismatch de hidratación.
- Los componentes cliente importan con `@/app/data/games` etc. — alias `@/*` → raíz, ya configurado.

---

## Implementation plan

1. **Crear `app/data/`** con los 4 archivos de mock (`games.ts`, `players.ts`, `scores.ts`, `types.ts`) y portar literalmente los arrays y funciones del template. Verificar con `npx tsc --noEmit` que los tipos compilan. La app sigue mostrando el boilerplate de `app/page.tsx`.

2. **Crear `lib/storage.ts`** con los wrappers tipados `readUser`, `writeUser`, `readScores`, `appendScore` usando las claves `av_user` y `av_scores`. Sin consumidor todavía: solo el módulo existe.

3. **Crear `components/ClientOnly.tsx`** y `components/FadeIn.tsx`. Componentes sin lógica, solo plumbing. La app sigue igual.

4. **Crear `components/Nav.tsx`** (client component) consumiendo `usePathname()` y `useRouter()` de Next. Por ahora solo con el logo, los dos links (`/biblioteca`, `/salon`), el contador de créditos y un botón "Iniciar Sesión" estático que navega a `/auth`. Reemplazar el contenido de `app/page.tsx` para que renderice `<Nav>` + `<main>`. Verificar visualmente: el nav aparece en `/`.

5. **Crear `app/page.tsx` redirect** a `/biblioteca` con `redirect()` de `next/navigation`. Verificar que `http://localhost:3000` redirige.

6. **Crear `app/biblioteca/page.tsx`** (Server Component) que renderiza `<Nav>` + `<LibraryScreen>` y un `<Footer>`. Importar `GAMES` y `CATS` desde `app/data/`. **Crear `components/LibraryScreen.tsx`** (client) con la barra de búsqueda, los chips de categoría y la grilla. Crear `components/GameCard.tsx` con el tilt 3D por hover. Las portadas usan las clases `cover-*` ya definidas en `globals.css`. Navegación a `/detalle/[id]` con `useRouter().push()`. Verificar: `/biblioteca` muestra las 8 cards, búsqueda y filtro funcionan, click navega.

7. **Crear `lib/hooks/useUser.ts`** y **`lib/hooks/useScores.ts`** usando `useSyncExternalStore` contra `lib/storage.ts`, con `getServerSnapshot` neutro para evitar el mismatch de hidratación. **Actualizar `components/Nav.tsx`** para que use `useUser()`: si hay usuario muestra `{user.name} ▾`; si no, botón a `/auth`. Verificar: el nav reacciona al login.

8. **Crear `app/auth/page.tsx`** + **`components/AuthScreen.tsx`** (client) con tabs `INICIAR SESIÓN` / `CREAR CUENTA`, los inputs y el botón de invitado. `onLogin` persiste via `useUser().setUser`. Botones Google/GitHub decorativos (sin handler). Verificar: al enviar, redirige a `/biblioteca` con el nombre en mayúsculas y persiste tras recargar.

9. **Crear `app/detalle/[id]/page.tsx`** (Server) que lee `params.id` y resuelve el `Game` con `app/data/games.ts`. Si no existe, `notFound()`. Renderiza `<Nav>` + `<GameDetailScreen>`. **Crear `components/GameDetailScreen.tsx`** (client) con la portada grande, tags, stat-strip, acciones (`/player/[id]`, `/biblioteca`) y el leaderboard lateral. **Crear `components/Leaderboard.tsx`** que consume `seededScores(id.length * 17 + 3, 10)`. Verificar: `/detalle/bloque-buster` muestra la ficha y los mismos 10 scores que en el template.

10. **Crear `app/player/[id]/page.tsx`** (Server) + **`components/PlayerScreen.tsx`** (client). HUD con `useState` para `score`, `lives`, `level`, `paused`, `over`, `name`, `saved`. El `useEffect` que suma puntos cada 220ms cuando no está en pausa/fin, y el de subida de nivel cada 2500. **Crear `components/CrtFrame.tsx`** con la `crt` y el `game-arena` decorativo (enemigos flotando, nave, grid). Modal de fin con input de iniciales (10 chars, mayúsculas) y botón "Guardar puntuación" que llama a `appendScore`. Botones `PAUSA`, `FIN`, `SALIR`. Verificar: entrar, ver puntaje subiendo, pausar, terminar, guardar, ver toast. Recargar no preserva la partida (no es objetivo), pero sí el `user`.

11. **Crear `app/salon/page.tsx`** + **`components/HallOfFameScreen.tsx`** (client). Tabs por juego (uno por `GAMES.id`), podio con los 3 primeros de `seededScores(tab.length * 23 + 7, 12)`, tabla con `animationDelay` por fila, y la fila "TU MEJOR MARCA" si `useUser()` devuelve usuario. **Crear `components/Podium.tsx`** con las tres slots (gold, silver, bronze) y la lógica para sacar posiciones 0, 1, 2. Verificar: cambiar de tab recarga el podio; sin login, no aparece la fila amarilla; con login, aparece con rank y score ficticios.

12. **Crear `components/Footer.tsx`** y montarlo en todas las pantallas a través de un layout compartido `app/(vault)/layout.tsx` que envuelva las 5 rutas y renderice `<Nav>` + `{children}` + `<Footer>`. Borrar las repeticiones del paso 4. Verificar: el footer aparece en las 5 rutas y no se duplica.

13. **Limpieza final.** Confirmar que `app/page.tsx` ya hace redirect (sí, paso 5). Confirmar que `app/globals.css` ya tiene todo el tema del template (sí, verificado al inicio). Correr `npx tsc --noEmit` y `npm run lint` (si existe script); si no, `npx next lint`. Manual QA: recorrer las 5 pantallas y los 3 estados del reproductor con login y sin login.

**Notas para la implementación:**

- Cada paso es commiteable por sí solo (el sistema sigue funcional entre pasos).
- Los pasos 2, 3 y 11 no tocan UI visible: la app se ve igual hasta el paso 4.
- `app/globals.css` ya contiene el tema retro completo (verificado al inicio); no hace falta tocarlo.
- No se crea `tailwind.config` ni `postcss.config` adicional; ya están.
- Los hooks en `lib/hooks/` son el único punto que toca `localStorage`: cualquier feature futura que necesite persistencia debe pasar por ahí.

---

## Acceptance criteria

**Estructura y compilación**

- [ ] `npx tsc --noEmit` no muestra errores.
- [ ] `npm run lint` (o `npx next lint`) no muestra errores.
- [ ] `app/data/` contiene exactamente `games.ts`, `players.ts`, `scores.ts`, `types.ts`.
- [ ] `components/` contiene `Nav`, `Footer`, `GameCard`, `Modal`, `Podium`, `Leaderboard`, `CrtFrame`, `UserButton`, `SearchBar`, `CategoryChips`, `Button`, `ClientOnly`, `FadeIn` (puede haber extras si surge durante impl; lo que no puede faltar está listado).
- [ ] `lib/` contiene `storage.ts` y `hooks/useUser.ts`, `hooks/useScores.ts`.
- [ ] El alias `@/*` resuelve a la raíz y se usa en todos los imports cross-folder.

**Rutas (App Router real)**

- [ ] `GET /` redirige a `/biblioteca` (HTTP 307/308 o redirect del server).
- [ ] `GET /biblioteca` renderiza la pantalla de biblioteca.
- [ ] `GET /detalle/<id-válido>` renderiza la ficha; `<id-inválido>` devuelve 404.
- [ ] `GET /player/<id-válido>` renderiza el reproductor; id inválido → 404.
- [ ] `GET /auth` renderiza la pantalla de auth.
- [ ] `GET /salon` renderiza el hall of fame.
- [ ] Las 5 rutas comparten `<Nav>` y `<Footer>` desde un layout único.
- [ ] No hay navegación por `location.hash` en ningún archivo de `app/` o `components/`.

**Biblioteca**

- [ ] Renderiza las 8 cards de `GAMES` con su `cover-*` y color correctos.
- [ ] La búsqueda por título es case-insensitive y filtra en vivo.
- [ ] Los chips `TODOS / ARCADE / PUZZLE / SHOOTER / VERSUS` filtran por categoría.
- [ ] Si no hay resultados, aparece el mensaje "NO HAY RESULTADOS".
- [ ] Click en una card o en su botón `JUGAR` navega a `/detalle/[id]`.
- [ ] El tilt 3D por hover en la card se ve y se desactiva al salir el puntero.

**Detalle**

- [ ] Muestra cover grande, título, descripción larga y los 4 tags (`<cat>`, `1 JUGADOR`, `TECLADO / TÁCTIL`, `RETRO 1985`).
- [ ] El stat-strip muestra `Partidas`, `Mejor global` y `Dificultad` con los colores del template.
- [ ] `JUGAR AHORA` navega a `/player/[id]`; `VOLVER AL VAULT` navega a `/biblioteca`.
- [ ] El leaderboard lateral muestra exactamente 10 filas generadas con `seededScores(id.length * 17 + 3, 10)`.
- [ ] Las 3 primeras filas del leaderboard tienen las clases `top1/top2/top3` con colores oro/plata/bronce.

**Reproductor (visual, sin lógica de juego)**

- [ ] El HUD muestra Jugador, Puntuación, Vidas (`♥ ♥ ♥`), Nivel (`01`).
- [ ] La puntuación se incrementa automáticamente cada 220ms mientras no esté en pausa ni en game-over.
- [ ] El nivel sube a `02` cuando el score cruza 2500 (mismo comportamiento que el template).
- [ ] `PAUSA` detiene el contador y muestra el overlay "EN PAUSA"; `REANUDAR` lo retoma desde donde iba.
- [ ] `FIN` abre el modal "FIN DEL JUEGO" con la puntuación final.
- [ ] El modal permite escribir hasta 10 iniciales en mayúsculas y guarda la entrada en `av_scores` con `{ game, name, score, at }`.
- [ ] Tras guardar, aparece el toast "▸ PUNTUACIÓN GUARDADA_" y el botón Guardar desaparece.
- [ ] `JUGAR DE NUEVO` resetea el estado y vuelve a la arena.
- [ ] `VOLVER AL VAULT` desde el modal navega a `/biblioteca`.
- [ ] `SALIR` desde el HUD navega a `/detalle/[id]`.

**Auth**

- [ ] Tabs `INICIAR SESIÓN` / `CREAR CUENTA` cambian el copy del botón principal.
- [ ] El tab "Crear cuenta" muestra el campo `Correo electrónico` con animación.
- [ ] Al enviar, persiste `{ name, loggedAt }` en `av_user` y redirige a `/biblioteca`.
- [ ] El nombre se trunca a 10 chars y se fuerza a mayúsculas.
- [ ] `JUGAR COMO INVITADO` setea `av_user = null` y va a `/biblioteca`.
- [ ] Los botones `GOOGLE` y `GITHUB` no hacen nada (decorativos).

**Salón de la Fama**

- [ ] Hay un tab por cada `GAMES.id` (8 tabs), el primero seleccionado por defecto.
- [ ] El podio muestra 3 slots (gold/silver/bronze) con los puestos 1, 2, 3 de `seededScores(tab.length * 23 + 7, 12)`.
- [ ] La tabla de ranking debajo del podio lista los 12 jugadores con `animationDelay` incremental.
- [ ] Si hay usuario logueado, aparece la fila amarilla "▸ TU MEJOR MARCA EN <juego>" con rank y score ficticios.
- [ ] Si no hay usuario, la fila amarilla no se renderiza.
- [ ] El botón `VOLVER A LA BIBLIOTECA` navega a `/biblioteca`.

**Nav global**

- [ ] El logo navega a `/biblioteca`.
- [ ] Los links `Biblioteca` y `Salón de la Fama` navegan a sus rutas.
- [ ] El item activo tiene la clase `.active` y el underline neón cyan.
- [ ] Si hay `av_user`, el botón muestra `{user.name} ▾`; si no, muestra "Iniciar Sesión" y va a `/auth`.
- [ ] En mobile (`max-width: 840px`) se ocultan links y contador de créditos y aparece el `≡` que abre el panel lateral.
- [ ] El panel lateral tiene backdrop oscuro y cierra al hacer click fuera o en un link.

**Persistencia e hidratación**

- [ ] `av_user` y `av_scores` son las únicas claves usadas en `localStorage`.
- [ ] Recargar la página con sesión iniciada conserva el usuario en el nav.
- [ ] No hay warnings de hydration mismatch en la consola del navegador.
- [ ] `lib/storage.ts` es el único módulo que llama a `localStorage.getItem/setItem/removeItem` directamente.

**Tema y tipografía**

- [ ] `app/globals.css` ya contiene todas las clases del template (`.btn`, `.card`, `.cover-*`, `.crt`, `.modal`, `.podium`, `.lb-row`, `.hall-table`, etc.); no se duplica ni se renombra nada.
- [ ] Las fuentes `Press Start 2P` y `JetBrains Mono` se cargan vía `next/font` (ya hecho en `app/layout.tsx`).
- [ ] Las clases utility de Tailwind v4 siguen disponibles (`@import "tailwindcss"`) por si se usan en algún componente.

**Lo que NO se verifica (recordatorio):**

- Lógica de los 8 juegos: no se implementa.
- Autenticación real: cualquier password "funciona".
- Backend: no hay.

---

## Decisions

- **Yes:** App Router con rutas reales. Mejor para SEO, deep links, prefetch, y es el patrón nativo de Next.js 16.
- **No:** Mantener el routing por hash del template (`#{"name":"biblioteca"}`). Era un truco del HTML estático; al portarlo a Next.js sería un downgrade gratuito.
- **No:** Routing paralelo con `parallel routes` o `intercepting routes`. El MVP no tiene flujos que se solapen (no hay modal sobre detalle, ni drawers compartidos). YAGNI.

- **Yes:** `localStorage` con claves `av_user` y `av_scores`. Consistente con el template, sin backend, y ya demostrado que cubre el caso "recargar conserva la sesión".
- **No:** IndexedDB. Overengineering: <5KB de datos, no hay queries, no hay transacciones.
- **No:** Estado en memoria puro. Perderíamos la sesión al recargar y romperíamos el flujo "login → recargar → seguir logueado" que el template ya tiene.
- **No:** Cookies / `httpOnly`. No hay backend, no hay auth real, sería teatro.

- **Yes:** Mock data en `app/data/` (no en `lib/`). En el futuro esa carpeta se reemplaza por una capa de fetch a la DB; tenerla bajo `app/` la deja pegada a los consumidores y deja claro su rol.
- **No:** `lib/games.ts` y compañía. Mezclar "data layer" con "utils de cliente" (storage, hooks) dificulta el reemplazo futuro.
- **No:** Llamar a la carpeta `app/db/` o `app/repositories/`. En este MVP no hay nada que merezca ese nombre; `app/data/` describe mejor que es mock.

- **Yes:** Portar `seededScores` con la misma firma y el mismo PRNG (`s = s * 9301 + 49297`) del template. Garantiza que las cifras visibles en `detalle` y `salon` coincidan con la versión HTML, lo que sirve como "test de paridad visual" durante QA.
- **No:** Cambiar a `Math.random()` o a un PRNG moderno. Cualquier divergencia numérica abriría dudas sobre si el rediseño rompió algo.
- **No:** Precalcular los scores en build. La firma `(seed, count)` es barata y la dinámica de "cambiar de tab" se siente más natural recalculando.

- **Yes:** Hooks en `lib/hooks/` que envuelven `lib/storage.ts` con `useSyncExternalStore` y `getServerSnapshot` neutro. Evita el warning de hydration mismatch que el template arrastra al ejecutarse en SSR.
- **No:** Marcar todas las pantallas como `"use client"`. Pierdes Server Components sin motivo y增大 el bundle.
- **No:** `dynamic(import, { ssr: false })` por componente. Más fricción que el `ClientOnly` wrapper, y `<ClientOnly>` permite un fallback explícito (esqueleto neón) que ayuda a que el primer paint no parpadee.

- **Yes:** Layout compartido `app/(vault)/layout.tsx` que envuelve las 5 rutas y monta `<Nav>` + `{children}` + `<Footer>`. Evita repetir nav/footer en cada página.
- **No:** Un `_app.tsx`-equivalente o un wrapper dentro de cada `page.tsx`. Más boilerplate, más fácil olvidarlo en una pantalla nueva.
- **No:** Route groups sin paréntesis (`app/vault/...`). Los paréntesis aclaran que es un agrupador lógico, no una URL real.

- **Yes:** Migrar el tema retro de `styles.css` a `app/globals.css` tal cual (verificado: ya está hecho). Cero refactor de marcas/CSS durante la impl.
- **No:** Aprovechar para "limpiar" el CSS, renombrar `.btn` a algo más semántico, o convertir todo a Tailwind. Cambios cosméticos en una pantalla que ya quedó aprobada rompen la paridad visual sin aportar nada.
- **No:** Usar `clsx`/`cva` para variantes de botón. Con 4 variantes (default, magenta, yellow, ghost) y CSS clips ya definidos, una `className` literal o `template literal` es más legible.

- **Yes:** Componentes interactivos marcados como `"use client"`. Regla clara: si tiene `useState`, `useEffect`, `usePathname`, `useRouter` o toca `localStorage` → client.
- **No:** `"use client"` en el layout. El layout puede ser server y pasarle `{children}` ya hidratado.
- **No:** "Todo client" en `app/data/games.ts`. Los arrays son estáticos, los consumen tanto server como client sin problema.

- **Yes:** `usePathname()` de `next/navigation` como fuente de "ruta activa" en `<Nav>`. Es la API oficial y ya reacciona a navegaciones del App Router.
- **No:** Pasar `route` por props desde cada página al `<Nav>`. Acopla cada pantalla al nav y rompe la idea de layout compartido.

- **Yes:** IDs de juego en kebab-case (`bloque-buster`, `caida`, `serpentina`, `gloton`, `invasores`, `rocas`, `ranaria`, `duelo-pixel`). Mismas IDs que el template.
- **No:** Cambiar a camelCase o IDs numéricos. Cualquier migración futura a DB heredará estas IDs; cambiarlas ahora obligaría a un mapping.

- **Yes:** "Quick definition without detailed clarification" para la decisión de mantener el branding como **Arcade Vault** (no Arcade Bot). El usuario mencionó "Arcade Bot" pero el proyecto y todos los templates dicen Arcade Vault; preguntar no habría cambiado el resultado esperado.
- **No:** Abrir la puerta a un rebranding. Fuera del scope de este spec.

---

## Risks

| Risk | Mitigation |
| --- | --- |
| **Hydration mismatch** en `<Nav>` y `<LibraryScreen>` si se lee `localStorage` en el render inicial. | Los hooks de `lib/hooks/` usan `useSyncExternalStore` con `getServerSnapshot` neutro y se sincronizan tras el mount. `<Nav>` y `<UserButton>` van envueltos en `<ClientOnly>` con un esqueleto (`"INICIAR SESIÓN"` placeholder) hasta el mount. |
| **Pérdida de la sesión** al limpiar `localStorage` del navegador. | Es el comportamiento esperado; no es un bug. Documentado en los criterios como "recargar conserva, limpiar localStorage no". No se considera riesgo del producto. |
| **`seededScores` diverge** del template si alguien toca el PRNG durante la impl. | El test de paridad visual lo cubre: los números en `/detalle/bloque-buster` y `/salon` deben coincidir con la versión HTML. Cualquier divergencia se detecta en QA. |
| **Cover arts no se ven** porque faltan las clases `.cover-*` en `globals.css`. | Verificado al inicio del spec: `globals.css` ya las tiene (`.cover-bricks`, `.cover-tetro`, `.cover-snake`, `.cover-glot`, `.cover-invaders`, `.cover-rocas`, `.cover-rana`, `.cover-duelo`). El impl no toca `globals.css`. |
| **Tilt 3D de la card se siente pegajoso en trackpad** (eventos `mousemove` constantes). | Mantener el `transform` como inline style sin `will-change: transform` permanente; el `transition` solo se aplica al hover, no durante el `mousemove`. Si en QA se siente mal, fallback: quitar el tilt y dejar solo el `translateY(-6px)`. |
| **El `useEffect` de `score` suma puntos incluso cuando el tab no está visible** y "quema" vidas/levels en background. | Aceptado para el MVP. Es comportamiento del template original; no es objetivo del spec arreglarlo. Documentado como "fuera de scope". |
| **Next.js 16 rompe APIs de routing** (`usePathname`, `useRouter`, `redirect`). | El `AGENTS.md` del proyecto advierte: "This is NOT the Next.js you know". El impl debe leer `node_modules/next/dist/docs/` antes de usar cualquier API de routing. Si alguna API cambia, ajustar en el momento, no antes. |
| **Bundle se infla** por meter 5 pantallas client-side. | Server Components donde se pueda: `page.tsx` de cada ruta hace `import { GAMES } from "@/app/data/games"` y solo el sub-árbol interactivo (`<LibraryScreen>`, `<GameDetailScreen>`, etc.) lleva `"use client"`. Las pages quedan como `<Nav>` + `<Screen />` + `<Footer>`, todo lo demás server. |
| **Confusión `app/data/` vs futura DB** durante la impl. | El spec lo deja escrito: `app/data/` **es** la "DB" hoy. Cualquier función nueva que pida datos (ej. `getGameById`) se escribe en `app/data/games.ts` como función helper, no como fetch. Cuando llegue el spec de DB, esas funciones se reescriben in-place y los consumidores no se enteran. |
| **`localStorage` no disponible** (modo incógnito estricto, Safari ITP). | Aceptado: si falla, `lib/storage.ts` devuelve `null`/vacío y la app sigue funcionando sin persistencia. No hay try/catch silencioso que oculte el problema. |
| **Tipado de `usePathname()`** en el App Router con grupos `(vault)`. | El pathname será `/biblioteca`, `/detalle/<id>`, etc. — el prefijo del grupo `(vault)` no aparece en la URL, así que la comparación directa funciona sin prefijo extra. |
| **Doble render del `<Nav>`** si se monta tanto en el layout como en cada page por copy-paste. | El layout `app/(vault)/layout.tsx` es la única fuente de `<Nav>` y `<Footer>`. Los `page.tsx` solo renderizan su pantalla. El impl incluye un grep final para detectar duplicaciones. |

---

## What is **not** in this spec

- Lógica interna de los 8 juegos (rebote de pelota, tetrominós, serpiente, asteroides, etc.).
- Autenticación real: backend, JWT, OAuth, Google/GitHub.
- Ranking global persistente ni sincronización entre dispositivos.
- Internacionalización (todo el copy queda en español, igual que el template).
- Tests automatizados, Storybook o auditoría de accesibilidad.
- Modo claro/oscuro alterno. Solo el tema retro oscuro.
- Deploy y configuración de CI/CD.
- Rebranding. El proyecto se llama Arcade Vault, no Arcade Bot.

Cada uno de esos puntos, si aterriza, va en su propio spec.
