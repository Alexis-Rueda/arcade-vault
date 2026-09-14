# SPEC 14 — Security Hardening

> **Status:** Implemented
> **Depends on:** SPEC 04 (Supabase Integration), SPEC 13 (Supabase Auth)
> **Date:** 2026-09-14
> **Objective:** Implementar las medidas de seguridad del checklist: RLS en ambas tablas, headers de seguridad en Next.js, fix del open redirect en OAuth callback, eliminación de la función SECURITY DEFINER innecesaria, protección de rutas con Proxy, y hardening de validación de contraseñas con regex (minúsculas, mayúsculas, dígitos, símbolos + mínimo 8 caracteres) incluyendo UI de error antes de enviar a Supabase.

---

## Scope

**In:**

- **RLS en `scores`**: INSERT solo usuarios autenticados, SELECT público, UPDATE/DELETE solo por el propio usuario o service_role.
- **RLS en `games`**: SELECT público, INSERT/UPDATE/DELETE solo service_role (tabla de catálogo gestionada por la app).
- **Headers de seguridad en Next.js** (`next.config.ts`): `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`.
- **Open redirect fix** en `app/(vault)/auth/callback/route.ts`: validar que el parámetro `next` empiece con `/` y no contenga `//` o dominio externo.
- **Eliminar función `rls_auto_enable()`**: revocar EXECUTE para `anon` y `authenticated`, luego DROP FUNCTION.
- **Hardening de contraseña** en `app/(vault)/auth/page.tsx`: expresión regular que exija mínimo 8 caracteres, al menos 1 minúscula, 1 mayúscula, 1 dígito y 1 símbolo. UI muestra error inline sin llamar a Supabase si no cumple.
- **Protección de rutas con Proxy** (`proxy.ts`): rutas `/games/[id]` y `/games/[id]/play` requieren sesión activa. La verificación lee las cookies de Supabase (check optimista). Sin sesión → redirect a `/auth`. El catálogo `/games` es público.
- **Documentar configuración de dashboard Supabase** como checklist manual: minimum password length (8), leaked password protection (habilitar), max signup rate.

**Out of scope:**

- CSP (Content Security Policy) — requiere análisis de todos los assets cargados; spec futuro.
- HSTS — depende de si se usa HTTPS en producción; pendiente de verificar.
- Rate limiting de signups por IP — configuración del dashboard de Supabase, no código.
- Rate limiting de inserción de scores — requiere edge function; spec futuro.
- Configuración de OAuth providers en el dashboard — el usuario lo hace manualmente.

---

## Data model

No se introducen nuevas estructuras de datos. Los cambios son:

### Expresión regular de validación de contraseña

```ts
const PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
```

Requisitos: mínimo 8 caracteres, al menos 1 minúscula, 1 mayúscula, 1 dígito y 1 símbolo.

### Estado de error de contraseña en `AuthScreen`

```ts
const [passwordError, setPasswordError] = useState<string | null>(null);
```

Se muestra debajo del campo de contraseña cuando `PASSWORD_REGEX.test(password)` es `false` y el campo ha sido tocado.

### Lógica de proxy para protección de rutas

```ts
// En proxy.ts — check optimista leyendo cookies de Supabase
function isAuthenticated(request: NextRequest): boolean {
  // @supabase/ssr usa cookies con prefijo sb-<project-ref>
  return request.cookies
    .getAll()
    .some((cookie) => cookie.name.startsWith('sb-'));
}
```

---

## Implementation plan

1. **RLS — `scores` table**: Crear migración SQL con políticas:
   - `scores_select_public`: USING (true) — cualquier persona puede leer el leaderboard.
   - `scores_insert_auth`: WITH CHECK (auth.uid() IS NOT NULL) — solo autenticados insertan.
   - `scores_update_owner`: USING (auth.uid() = user_id) — solo el propio usuario puede actualizar.
   - `scores_delete_owner`: USING (auth.uid() = user_id) — solo el propio usuario puede borrar.
   - Ejecutar `ALTER TABLE scores ENABLE ROW LEVEL SECURITY;`.
   - _Verificable:_ `SELECT * FROM pg_policies WHERE tablename = 'scores';` muestra 4 políticas.

2. **RLS — `games` table**: Crear migración SQL con políticas:
   - `games_select_public`: USING (true) — leaderboard público.
   - `games_insert_service`: USING (current_setting('role') = 'service_role') — solo service_role inserta.
   - `games_update_service`: USING (current_setting('role') = 'service_role').
   - `games_delete_service`: USING (current_setting('role') = 'service_role').
   - Ejecutar `ALTER TABLE games ENABLE ROW LEVEL SECURITY;`.
   - _Verificable:_ `SELECT * FROM pg_policies WHERE tablename = 'games';` muestra 4 políticas.

3. **Eliminar `rls_auto_enable()`**: Ejecutar `REVOKE EXECUTE ON FUNCTION rls_auto_enable() FROM anon, authenticated;` y luego `DROP FUNCTION rls_auto_enable();`.
   - _Verificable:_ La función no aparece en `pg_proc` y los advisories de Supabase desaparecen.

4. **Headers de seguridad en `next.config.ts`**: Añadir array `securityHeaders` con las 3 cabeceras y configurar `headers()` en la config de Next.js.
   - _Verificable:_ `curl -I http://localhost:3000` muestra las 3 cabeceras en la respuesta.

5. **Fix open redirect en `auth/callback/route.ts`**: Validar el parámetro `next` antes de usarlo en el redirect:

   ```ts
   const safeNext = next.startsWith('/') && !next.includes('//') ? next : '/';
   ```
   - _Verificable:_ `?next=https://evil.com` redirige a `/` en vez de a evil.com.

6. **Protección de rutas en `proxy.ts`**: Añadir lógica que verifique la sesión antes de permitir acceso a `/games/[id]` y `/games/[id]/play`. El check lee las cookies de Supabase (optimista, sin round-trip). Sin sesión → redirect a `/auth`. El matcher se mantiene amplio; la lógica interna filtra las rutas protegidas.
   - _Verificable:_ Acceder a `/games/asteroides/play` sin sesión redirige a `/auth`; con sesión carga el juego.

7. **Hardening de contraseña en `auth/page.tsx`**: Añadir `PASSWORD_REGEX` como constante. En el handler de registro, antes de llamar a `supabase.auth.signUp`, validar: si `!PASSWORD_REGEX.test(password)` → `setPasswordError('...')` y `return`. Limpiar el error al escribir en el campo. Añadir mensaje de error visual debajo del input.
   - _Verificable:_ Contraseña `abc123` muestra error y no llama a Supabase; contraseña `Abc123!@` pasa la validación.

8. **Documentar checklist de dashboard**: Crear sección en `references/security/dashboard-checklist.md` con los pasos manuales: minimum password length (8), leaked password protection (ON), max signup rate (configurar según necesidad).
   - _Verificable:_ El archivo existe y es legible.

9. **Verificación final**: Ejecutar `npm run build` sin errores. Probar login/registro. Verificar headers con `curl -I`. Verificar que RLS bloquea inserts anónimos. Verificar que `/games/[id]/play` sin sesión redirige a `/auth`.
   - _Verificable:_ Todos los checks pasan.

---

## Acceptance criteria

- [ ] `scores` tiene RLS habilitado con 4 políticas: SELECT público, INSERT autenticado, UPDATE/DELETE por owner.
- [ ] `games` tiene RLS habilitado con 4 políticas: SELECT público, INSERT/UPDATE/DELETE solo service_role.
- [ ] La función `rls_auto_enable()` ya no existe en la base de datos.
- [ ] `next.config.ts` incluye las cabeceras `X-Content-Type-Options`, `X-Frame-Options` y `Referrer-Policy`.
- [ ] Las cabeceras aparecen en la respuesta HTTP (verificable con `curl -I`).
- [ ] El parámetro `next` en `/auth/callback` valida que empiece con `/` y no contenga `//`.
- [ ] Un link con `?next=https://evil.com` redirige a `/` en vez de a evil.com.
- [ ] La expresión regular de contraseña exige: mínimo 8 chars, 1 minúscula, 1 mayúscula, 1 dígito, 1 símbolo.
- [ ] Contraseña que no cumple la regex muestra error inline y no llama a Supabase.
- [ ] Contraseña que cumple la regex permite el registro normalmente.
- [ ] El error se limpia cuando el usuario escribe en el campo de contraseña.
- [ ] `/games/[id]/play` sin sesión activa redirige a `/auth`.
- [ ] `/games/[id]/play` con sesión activa carga el juego normalmente.
- [ ] El catálogo `/games` es accesible sin sesión.
- [ ] `npm run build` completa sin errores de TypeScript.
- [ ] `references/security/dashboard-checklist.md` existe con los pasos de configuración manual.

---

## Decisions

- **Yes:** Regex estricta para contraseñas (minúscula + mayúscula + dígito + símbolo). Razón: el checklist lo requiere y mejora la seguridad de cuentas. La UX compensa con el error inline inmediato.
- **Yes:** Validación en cliente ANTES de llamar a Supabase. Razón: evita el round-trip innecesario y da feedback instantáneo. Supabase sigue validando en servidor como capa adicional.
- **Yes:** INSERT de scores solo para autenticados. Razón: el flujo de "jugar como invitado" fue eliminado en SPEC 13. Los scores sin `user_id` ya no deberían existir.
- **Yes:** SELECT público en `scores` y `games`. Razón: el leaderboard es la funcionalidad central de la app; debe ser visible sin login.
- **Yes:** Validar `next` con startWith('/') + no includes('//'). Razón: es la forma estándar de prevenir open redirects en OAuth callbacks. Cubre el 99% de los casos de ataque.
- **Yes:** Eliminar `rls_auto_enable()` completamente. Razón: si no se usa en la app, es una superficie de ataque innecesaria. No hay motivo para conservarla.
- **Yes:** Protección de rutas con proxy leyendo cookies directamente (check optimista). Razón: la documentación de Next.js 16 recomienda proxy para "optimistic checks" de permisos. No requiere round-trip a Supabase.
- **Yes:** Solo proteger `/games/[id]` y `/games/[id]/play`. El catálogo `/games` es público. Razón: la app es jugable sin login; la protección va en las rutas que ejecutan el juego.
- **Yes:** `/auth` no redirige cuando el usuario ya está logueado. Razón: el usuario puede querer cerrar sesión y volver a entrar desde la misma pantalla.
- **No:** CSP (Content Security Policy). Razón: requiere auditar todos los assets externos (fonts, scripts, analytics). Es un spec separado por la complejidad de configuración.
- **No:** Rate limiting de inserción de scores. Razón: requiere una edge function como proxy; el patrón actual de inserción directa desde el browser no lo soporta. Spec futuro.
- **No:** HSTS. Razón: solo aplica si se usa HTTPS en producción. Pendiente verificar la configuración de despliegue.

---

## Risks

| Risk                                                                                       | Mitigation                                                                                                                                                      |
| ------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RLS bloquea inserts legítimos de scores si la política de INSERT es demasiado estricta     | La política usa `auth.uid() IS NOT NULL` — cualquier autenticado puede insertar. Verificar con un usuario logueado que el score se guarda correctamente.        |
| Eliminar `rls_auto_enable()` rompe algo que dependa de ella                                | La función no se llama en ningún archivo del codebase. Si fue creada manualmente para habilitar RLS, sus efectos ya persisten en las tablas. DROP es seguro.    |
| Regex de contraseña muy estricta frustra a usuarios                                        | El mensaje de error explica los requisitos claramente. La app es de arcade casual; la fricción es aceptable para proteger cuentas.                              |
| Validación de `next` en callback bloquea redirects legítimos a subrutas                    | `next.startsWith('/')` permite `/games/`, `/salon/`, etc. Solo bloquea URLs absolutas con protocolo.                                                            |
| Check optimista de cookies en proxy puede fallar si Supabase cambia el nombre de la cookie | El prefijo `sb-` es el estándar de `@supabase/ssr`. Si Supabase lo cambia, el proxy simplemente no protege las rutas (falla abierto). Se puede refinar después. |

---

## What is **not** in this spec

- CSP (Content Security Policy).
- HSTS.
- Rate limiting de signups por IP (configuración del dashboard).
- Rate limiting de inserción de scores (requiere edge function).
- Configuración de OAuth providers en el dashboard de Supabase.
- Edición de perfil de usuario.
- Tabla `profiles` separada.

Cada uno de estos, si se implementa, va en su propio spec.
