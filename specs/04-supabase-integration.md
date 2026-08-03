# SPEC 04 — Integración con Supabase

> **Status:** Implemented
> **Depends on:** SPEC 01, SPEC 02, SPEC 03
> **Date:** 2026-08-03
> **Objective:** Integrar Supabase como base de backend para la app de Next.js, creando clientes server/client, middleware, tipos TypeScript y configuración de entorno, sin migrar funcionalidad existente de localStorage.

---

## Scope

**In:**

- Instalar paquetes `@supabase/ssr` y `@supabase/supabase-js` como dependencias.
- Crear `lib/supabase/client-browser.ts` — cliente Supabase para componentes client-side (`createBrowserClient`).
- Crear `lib/supabase/client-server.ts` — cliente Supabase para Server Components, Route Handlers y Server Actions (`createServerClient` con cookies de Next.js).
- Crear `lib/supabase/middleware.ts` — wrapper que inyecta sesión de Supabase en el request de Next.js middleware.
- Crear `middleware.ts` en raíz del proyecto para que Supabase gestione las cookies de sesión en cada request.
- Actualizar `.env.template` con las variables `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, documentando su origen.
- Generar tipos TypeScript desde el schema de Supabase (`supabase gen types typescript`) y guardarlos en `app/database.types.ts`.
- Documentar en `lib/storage.ts`, `lib/hooks/useUser.ts` y `lib/hooks/useScores.ts` un comentario `// TODO(SPEC-04): migrar a Supabase` como referencia para futuros specs.

**Out of scope (para futuros specs):**

- Migrar `useUser` o `useScores` de localStorage a Supabase.
- Crear tablas en Supabase (auth, scores, mensajes).
- Implementar auth real (sign up, login, logout, sesiones).
- Implementar leaderboard persistente.
- Conectar el formulario de contacto a Supabase.
- UI/UX de autenticación.
- Realtime (suscripciones a cambios en DB).
- Edge Functions.
- Row Level Security policies.
- Tests de los clientes Supabase.

---

## Data model

Este spec introduce un archivo de tipos generado desde Supabase y no introduce tablas nuevas. La DB está vacía — los tipos se generarán con estructura vacía como punto de partida para specs futuros.

### `app/database.types.ts` (generado)

```ts
export type Database = {
  public: {
    Tables: Record<string, never>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
```

Se genera con `supabase gen types typescript --project-id <ref>` y se actualiza cada vez que se cree una tabla en un spec futuro.

### Clientes Supabase — firmas esperadas

```ts
// lib/supabase/client-browser.ts
import { createBrowserClient } from '@supabase/ssr';
export function createClient(): ReturnType<typeof createBrowserClient>;

// lib/supabase/client-server.ts
import { createServerClient } from '@supabase/ssr';
export async function createClient(): Promise<
  ReturnType<typeof createServerClient>
>;

// lib/supabase/middleware.ts
import { createServerClient } from '@supabase/ssr';
export async function updateSession(
  request: NextRequest,
): Promise<NextResponse>;
```

Las env vars se usan con `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (formato `sb_publishable_...`), no con la legacy anon key.

No hay tablas, no hay migraciones, no hay datos nuevos más allá de los tipos vacíos.

---

## Implementation plan

Cada paso deja el sistema funcional. Commits chicos.

1. **Instalar dependencias Supabase.** Ejecutar `npm install @supabase/ssr @supabase/supabase-js`. _Verificable:_ `package.json` lista ambos paquetes en `dependencies`; `npm run dev` arranca sin errores nuevos.

2. **Actualizar `.env.template`** añadiendo las dos variables de Supabase:

   ```dotenv
   # Supabase (https://supabase.com/dashboard → Settings → API)
   NEXT_PUBLIC_SUPABASE_URL=tu-url-aqui
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=tu-publishable-key-aqui
   ```

   _Verificable:_ `cat .env.template` lista las 5 variables (3 de Resend + 2 de Supabase).

3. **Crear `lib/supabase/client-browser.ts`.** Exporta `createClient()` que usa `createBrowserClient` de `@supabase/ssr` con `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. _Verificable:_ `tsc --noEmit` pasa; importar desde un Client Component no falla en runtime.

4. **Crear `lib/supabase/client-server.ts`.** Exporta `createClient()` **async** que usa `createServerClient` de `@supabase/ssr`, leyendo cookies con `cookies()` de `next/headers` (async en Next.js 16). `setAll` en try/catch — las cookies de sesión las refresca el proxy (Step 6). _Verificable:_ `tsc --noEmit` pasa.

5. **Crear `lib/supabase/middleware.ts`.** Exporta `updateSession(request: NextRequest)` que crea un `createServerClient` con las cookies del request, ejecuta `supabase.auth.getUser()`, y retorna el response con las cookies actualizadas. _Verificable:_ `tsc --noEmit` pasa.

6. **Crear `proxy.ts` en raíz del proyecto** (o integrar si ya existe). Next.js 16 deprecó `middleware.ts` en favor de `proxy.ts` — usamos la convención nueva. Exporta `proxy()` que llama a `updateSession` de `lib/supabase/middleware.ts` en cada request. Excluye rutas estáticas (`_next/static`, `_next/image`, `favicon.ico`) vía `config.matcher`. _Verificable:_ `npm run dev` arranca; navegar a `/` no rompe; cookies de Supabase se inyectan.

7. **Generar tipos TypeScript.** Ejecutar `npx supabase gen types typescript --project-id thgwxvlxcusuzmtzwctf > app/database.types.ts`. _Verificable:_ `app/database.types.ts` existe y exporta `Database` con estructura vacía.

8. **Añadir comentarios TODO en archivos existentes.** En `lib/storage.ts`, `lib/hooks/useUser.ts` y `lib/hooks/useScores.ts`, añadir al inicio del archivo un comentario `// TODO(SPEC-04): migrar a Supabase — ver spec de integración`. _Verificable:_ `grep -rn "TODO(SPEC-04)" lib/` devuelve 3 hits.

9. **Verificación end-to-end manual:**
   - `npm run dev` arranca sin errores.
   - Navegación completa (`/`, `/games`, `/games/caida`, `/player/caida`, `/auth`, `/salon`, `/about`) funciona igual que antes.
   - Consola del navegador sin errores ni warnings nuevos.
   - Consola del server sin errores.
   - `tsc --noEmit` pasa.
   - `next build` pasa sin nuevos warnings.

---

## Acceptance criteria

- [ ] `@supabase/ssr` y `@supabase/supabase-js` aparecen en `package.json` como dependencias y están instaladas.
- [ ] `.env.template` lista 5 variables: `RESEND_API_KEY`, `RESEND_TO`, `RESEND_FROM`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- [ ] `lib/supabase/client-browser.ts` existe, exporta `createClient()` y usa `createBrowserClient`.
- [ ] `lib/supabase/client-server.ts` existe, exporta `createClient()` async y usa `createServerClient`.
- [ ] `lib/supabase/middleware.ts` existe, exporta `updateSession(request)` y ejecuta `supabase.auth.getUser()`.
- [ ] `proxy.ts` existe en la raíz del proyecto y llama a `updateSession` en cada request, excluyendo rutas estáticas.
- [ ] `app/database.types.ts` existe y exporta un tipo `Database` con estructura vacía (`Tables: Record<string, never>`).
- [ ] `grep -rn "TODO(SPEC-04)" lib/` devuelve exactamente 3 hits (`storage.ts`, `useUser.ts`, `useScores.ts`).
- [ ] `npm run dev` arranca sin errores ni warnings nuevos.
- [ ] Navegación a todas las rutas existentes (`/`, `/games`, `/games/caida`, `/player/caida`, `/auth`, `/salon`, `/about`) funciona sin regresiones.
- [ ] Consola del navegador sin errores ni warnings en todas las rutas.
- [ ] Consola del server sin errores.
- [ ] `tsc --noEmit` pasa sin errores.
- [ ] `next build` pasa sin nuevos warnings atribuibles a este spec.
- [ ] `lib/storage.ts`, `lib/hooks/useUser.ts` y `lib/hooks/useScores.ts` siguen funcionando igual que antes (localStorage intacto).

---

## Decisions

- **Yes:** instalar `@supabase/ssr` además de `@supabase/supabase-js`. La SDK base no maneja cookies de sesión en Server Components; `@supabase/ssr` es la forma correcta en Next.js 16.
- **No:** solo instalar `@supabase/supabase-js`. No soporta el patrón de cookies de Next.js, causaría problemas de sesión en server.
- **Yes:** tres archivos separados en `lib/supabase/` (browser, server, middleware). Separa concerns, cada uno importa solo lo que necesita.
- **No:** un solo archivo `lib/supabase/index.ts` con todo. Mezcla contextos de ejecución y complica tree-shaking.
- **Yes:** `proxy.ts` en raíz del proyecto (convención de Next.js 16, que deprecó `middleware.ts`). Supabase necesita interceptar cada request para refrescar cookies de sesión. Se mantiene `lib/supabase/middleware.ts` con `updateSession` como módulo utilidad.
- **No:** omitir middleware. Las sesiones expirarían sin refresh, el usuario se desloggearía sin aviso.
- **Yes:** excluir rutas estáticas (`_next/static`, `_next/image`, `favicon.ico`) en el middleware. Evita overhead innecesario en assets que no necesitan sesión.
- **No:** ejecutar middleware en cada request incluyendo estáticos. Impacto de rendimiento sin beneficio.
- **Yes:** generar tipos TypeScript ahora, aunque la DB está vacía. Establece el archivo `app/database.types.ts` como punto de referencia; se actualiza con `supabase gen types` cada vez que se crea una tabla.
- **No:** dejar la generación de tipos para un spec futuro. Crearía un paso fácil de olvidar y el archivo no existiría cuando se necesite.
- **Yes:** mantener `lib/storage.ts`, `useUser.ts` y `useScores.ts` intactos con comentarios TODO. La migración a Supabase es scope de specs futuros (auth, scores).
- **No:** migrar localStorage a Supabase en este spec. Acoplaría la integración base a features que aún no existen, violando el principio de un solo propósito por spec.
- **Yes:** usar `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (formato `sb_publishable_...`). Recomendado por Supabase para nuevas aplicaciones, mejor seguridad y rotación independiente.
- **No:** usar la legacy anon key (JWT). Válida pero menos segura; la publishable key es el estándar actual.
- **Yes:** usar `NEXT_PUBLIC_` como prefijo. Estándar de Supabase y de Next.js para variables accesibles en cliente.
- **No:** env vars sin prefijo. Next.js no las expone al bundle del cliente; el browser client no funcionaría.
- **Yes:** `.env.template` actualizado (no creado nuevo). Ya existe desde SPEC 03; agregar las vars de Supabase mantiene un solo archivo de referencia.
- **No:** crear un `.env.supabase.template` separado. Fragmentación innecesaria.

---

## Risks

| Riesgo                                                                  | Mitigación                                                                                                                                           |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `proxy.ts` en raíz intercepta assets estáticos y degrada rendimiento    | Excluye `_next/static`, `_next/image`, `favicon.ico` en el matcher del proxy.                                                                        |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` expuesta al cliente              | Es por diseño — la publishable key es pública. Row Level Security (RLS) protegerá los datos cuando existan tablas. Hoy la DB está vacía, sin riesgo. |
| Tipos generados quedan desactualizados al crear tablas en specs futuros | Cada spec que cree tablas debe ejecutar `supabase gen types typescript` y actualizar `app/database.types.ts`. Documentado en el archivo.             |
| `@supabase/ssr` puede tener breaking changes entre versiones            | Pinear versión mayor (`^0.x`). Aceptable en fase activa de desarrollo.                                                                               |
| Cookies de Supabase compiten con cookies de Resend o futuras features   | No hay conflicto hoy — Resend no usa cookies. Si surge, se documenta en el spec correspondiente.                                                     |
| El middleware añade latencia a cada request                             | La operación `getUser()` es ligera (~1ms). Si se vuelve cuello de botella, se puede cachear o condicionar por ruta.                                  |

---

## What is **not** in this spec

- Migrar `useUser`, `useScores` o `lib/storage.ts` a Supabase.
- Crear tablas en Supabase (auth, scores, mensajes de contacto).
- Implementar flujo de autenticación (sign up, login, logout, sesiones).
- Implementar leaderboard persistente.
- Conectar el formulario de contacto `/about` a Supabase.
- UI/UX de autenticación.
- Realtime (suscripciones a cambios en DB).
- Edge Functions.
- Row Level Security policies.
- Tests de los clientes Supabase.
- Cambios en la estética o diseño de la app.
