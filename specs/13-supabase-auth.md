# SPEC 13 — Autenticación con Supabase Auth

> **Status:** Implemented
> **Depends on:** SPEC 04 (Supabase Integration), SPEC 06 (Leaderboard Supabase)
> **Date:** 2026-09-11
> **Objective:** Conectar la pantalla de auth con Supabase Auth (email+password, OAuth Google y GitHub), migrar UserContext al usuario real de Supabase, y añadir flujos de verificación de email y recuperación de contraseña.

---

## Scope

**In:**

- `app/(vault)/auth/page.tsx` — conectar los formularios de login, registro y "olvidé mi contraseña" con Supabase Auth. La UI existente se conserva; solo cambia la lógica.
- `app/(vault)/auth/callback/route.ts` — nueva Route Handler que intercambia el código OAuth / confirmación de email por una sesión y redirige al home.
- `app/(vault)/auth/reset-password/page.tsx` — nueva página con el formulario para establecer la nueva contraseña (lee el token de la URL).
- Layout sin navegación para la pantalla de auth (landing style).
- Migración completa del `useUser` hook y `User` type: sustituir localStorage por la sesión de Supabase (`User | null`, `Session | null`, `username`, `signOut`).
- `components/Nav.tsx` — mostrar avatar (inicial del username), nombre de usuario y botón "Cerrar sesión" cuando hay sesión activa.
- Validaciones de contraseña (longitud mínima 8, al menos una mayúscula y un número).
- Eliminación del botón "JUGAR COMO INVITADO".
- Eliminación completa de `localStorage.getItem('av_user')` y `localStorage.setItem('av_user')`.
- `lib/supabase/scores.ts` — enviar `user_id` del usuario autenticado al insertar scores.
- FK de `scores.user_id` → `auth.users(id)` en la base de datos.

**Out of scope:**

- RLS (Row Level Security) en la tabla `scores` — queda para un spec de seguridad.
- Edición de perfil (cambio de username, avatar real, email) — spec futuro.
- Sesiones múltiples / gestión de dispositivos — fuera de scope.
- Autenticación en rutas de servidor con middleware — las rutas de juego siguen siendo accesibles sin sesión.
- Magic link / OTP por SMS — solo email+password y OAuth en este spec.
- Configuración de OAuth providers en el dashboard de Supabase — el usuario lo hará después.
- Migración de scores locales a Supabase.

---

## Data model

No se crean tablas nuevas. Cambios sobre lo existente:

### `scores.user_id`

Ya existe como `uuid nullable` sin FK. En este spec se empieza a poblar con el `id` del usuario autenticado al guardar una puntuación. Se añade FK formal:

```sql
ALTER TABLE scores
ADD CONSTRAINT scores_user_id_fkey
FOREIGN KEY (user_id) REFERENCES auth.users(id)
ON DELETE SET NULL;
```

### `useUser` hook — nueva firma

```ts
import { User, Session } from '@supabase/supabase-js';

interface UserContextValue {
  user: User | null;
  session: Session | null;
  username: string | null; // user.user_metadata.username ?? null
  signOut: () => Promise<void>;
}
```

- El campo `login(name)` desaparece — el login lo gestiona Supabase directamente en `app/(vault)/auth/page.tsx`.
- `localStorage.getItem('av_user')` y `localStorage.setItem('av_user')` se eliminan por completo; la sesión vive en las cookies gestionadas por `@supabase/ssr`.

### `user_metadata` al registrarse

Al llamar a `supabase.auth.signUp`, se pasa:

```ts
options: {
  data: {
    username: username.trim().toUpperCase().slice(0, 10);
  }
}
```

### Validación de contraseña

Se validan en el cliente antes de enviar a Supabase:

- Mínimo 8 caracteres
- Al menos 1 letra mayúscula
- Al menos 1 número

Supabase aplica sus políticas de password en el servidor; la validación cliente es UX (feedback inmediato).

---

## Implementation plan

1. **Habilitar proveedores en Supabase Dashboard**
   - Authentication → Providers → Email: activado, "Confirm email" ON.
   - Authentication → Providers → Google: activar, pegar Client ID y Secret.
   - Authentication → Providers → GitHub: activar, pegar Client ID y Secret.
   - Authentication → URL Configuration → Site URL: `http://localhost:3000` (producción: dominio real).
   - Añadir a Redirect URLs: `http://localhost:3000/(vault)/auth/callback`.
     Verificación: los tres proveedores aparecen como "Enabled" en el dashboard.

2. **Migración SQL — FK en `scores.user_id`**
   Ejecutar el `ALTER TABLE` para agregar la FK a `auth.users(id)` con `ON DELETE SET NULL`.
   Verificación: la constraint aparece en `information_schema.table_constraints`.

3. **Crear `app/(vault)/auth/callback/route.ts`**
   Route Handler GET que lee `code` de los search params, llama a `supabase.auth.exchangeCodeForSession(code)` y redirige a `/`. Si no hay `code`, redirige a `/auth`.
   Verificación: hacer clic en el link de confirmación del correo redirige al home con sesión activa.

4. **Migrar `useUser` hook (`lib/hooks/useUser.ts`)**
   - Sustituir el estado de string por `User | null` y `Session | null`.
   - Al montar: llamar a `supabase.auth.getSession()` para hidratar el estado inicial.
   - Suscribirse a `supabase.auth.onAuthStateChange` para mantener el contexto sincronizado.
   - `username` derivado de `user?.user_metadata?.username ?? null`.
   - `signOut` llama a `supabase.auth.signOut()`.
   - Eliminar toda referencia a `localStorage` (`av_user`).
     Verificación: `useUser().user` devuelve el objeto User tras login; `null` tras logout.

5. **Eliminar referencias a `av_user` en `lib/storage.ts` y `app/data/types.ts`**
   Remover las funciones `getUser`/`setUser` y el tipo `User` de localStorage.
   Verificación: `grep -r "av_user" .` no devuelve resultados.

6. **Crear layout para auth sin Nav**
   Crear `app/(vault)/auth/layout.tsx` que renderice solo `<main>` sin `<Nav>` ni `<Footer>`.
   Verificación: la pantalla de auth no muestra la barra de navegación.

7. **Actualizar `app/(vault)/auth/page.tsx`**
   - **Tab "INICIAR SESIÓN"**: llamar a `supabase.auth.signInWithPassword({ email, password })`. Si error → mensaje inline. Si OK → `router.push('/')`.
   - **Tab "CREAR CUENTA"**: llamar a `supabase.auth.signUp({ email, password, options: { data: { username } } })`. Si OK → vista "Revisa tu correo para confirmar tu cuenta" (sin redirigir).
   - **"Olvidé mi contraseña"**: añadir enlace debajo del formulario de login que muestra un mini-form con solo el campo email y llama a `resetPasswordForEmail(email, { redirectTo: '.../(vault)/auth/reset-password' })`. Tras llamada exitosa → mensaje "Te hemos enviado un enlace de recuperación".
   - **OAuth Google / GitHub**: los botones existentes llaman a `signInWithOAuth({ provider: 'google' | 'github', options: { redirectTo: '.../(vault)/auth/callback' } })`.
   - Eliminar el botón "JUGAR COMO INVITADO".
     Verificación: login con email+password correcto redirige a `/`; credenciales incorrectas muestran el error; el registro muestra el mensaje de confirmación.

8. **Crear `app/(vault)/auth/reset-password/page.tsx`**
   Página cliente que lee el token de la URL (hash o query params). Al montar verifica la sesión. Muestra form "Nueva contraseña" + "Confirmar contraseña". Al enviar llama a `supabase.auth.updateUser({ password })`. Tras éxito → mensaje "Contraseña actualizada" + enlace a `/auth`.
   Verificación: link del email de recuperación llega a esta página y permite cambiar la contraseña; la nueva contraseña funciona al iniciar sesión.

9. **Actualizar `components/Nav.tsx`**
   - Consumir `useUser()` para leer `user` y `username`.
   - Si hay sesión: mostrar avatar (div con la inicial del username), el username y botón "Cerrar sesión" que llama a `signOut()`.
   - Si no hay sesión: mostrar el enlace "ACCESO" existente que lleva a `/auth`.
     Verificación: tras login el Nav muestra el avatar e inicial; tras logout vuelve al enlace de acceso.

10. **Actualizar los play-pages de todos los juegos**
    En cada `app/(vault)/games/*/play/page.tsx` que tenga modal de game-over con campo `name`:
    - Pre-rellenar `name` con `username` del contexto si está disponible; si no, vacío.
    - Al insertar en `scores`, incluir `user_id: user?.id ?? null`.
      Verificación: un usuario autenticado ve su username pre-rellenado en el modal; el score guardado tiene `user_id` poblado en Supabase.

11. **Verificación final**
    `npm run build` completa sin errores de TypeScript. Ninguna ruta existente devuelve 500.

---

## Acceptance criteria

- [ ] Los proveedores Email, Google y GitHub están habilitados en el dashboard de Supabase.
- [ ] `GET /auth/callback` intercambia el código por sesión y redirige a `/`.
- [ ] `useUser` hook expone `user: User | null`, `session`, `username` y `signOut`.
- [ ] No queda ninguna referencia a `localStorage.getItem('av_user')` en el codebase.
- [ ] Login con email+password correcto redirige al home con sesión activa.
- [ ] Login con credenciales incorrectas muestra un mensaje de error inline (sin crash).
- [ ] Registro exitoso muestra el mensaje "Revisa tu correo" sin redirigir.
- [ ] El link de confirmación de email activa la sesión y lleva al home.
- [ ] "Olvidé mi contraseña" envía el correo de recuperación y muestra confirmación.
- [ ] `/auth/reset-password` permite cambiar la contraseña; la nueva contraseña funciona.
- [ ] OAuth Google inicia el flujo de redirección al proveedor.
- [ ] OAuth GitHub inicia el flujo de redirección al proveedor.
- [ ] La pantalla de auth no muestra Nav ni Footer.
- [ ] El Nav muestra avatar + username + "Cerrar sesión" cuando hay sesión.
- [ ] El Nav muestra el enlace "ACCESO" cuando no hay sesión.
- [ ] La contraseña se valida en cliente: mínimo 8 chars, 1 mayúscula, 1 número.
- [ ] En el modal de game-over, el campo `name` se pre-rellena con el username del usuario autenticado.
- [ ] Los scores guardados por usuarios autenticados tienen `user_id` poblado en Supabase.
- [ ] Los scores guardados por invitados tienen `user_id = null`.
- [ ] `npm run build` completa sin errores de TypeScript.

---

## Decisions

- **Yes:** Verificación de email activada (double opt-in). El registro no activa la sesión inmediatamente. Razón: evita cuentas con emails inválidos en el leaderboard; la fricción es baja (un clic).

- **Yes:** Username en `user_metadata`, sin tabla `profiles` adicional. Razón: para este spec el username es solo display; una tabla profiles con RLS, avatares y estadísticas merece su propio spec.

- **Yes:** Recuperación de contraseña en este spec, flujo completo con `/auth/reset-password`. Razón: sin recuperación la autenticación real es inutilizable en producción.

- **Yes:** FK en `scores.user_id` → `auth.users(id)` con `ON DELETE SET NULL`. Razón: la columna ya existe como nullable; la FK integra la relación desde este spec. RLS queda para un spec de seguridad.

- **Yes:** Layout sin Nav para la pantalla de auth. Razón: la pantalla de login/registro funciona mejor como landing sin distracciones de navegación.

- **Yes:** Validación de contraseña en cliente (mínimo 8, 1 mayúscula, 1 número). Razón: feedback inmediato sin esperar la respuesta de Supabase.

- **No:** Middleware Next.js para proteger rutas. Las rutas de juego siguen abiertas sin sesión. Razón: la app es accesible sin login; la protección de rutas añade fricción sin beneficio claro.

- **No:** Eliminar el botón "JUGAR COMO INVITADO". Se elimina silenciosamente. Razón: con auth real la app ya es accesible sin login; el botón era un artefacto del mock.

- **No:** Edición de perfil en este spec. Cambiar username, email o contraseña desde un panel de usuario queda para un spec futuro. Razón: ampliaría el scope más allá de la autenticación básica.

- **No:** Migración de scores locales a Supabase. Los scores en localStorage quedan como están. Razón: migración de datos existentes requiere un proceso cuidadoso y scope separado.

---

## Risks

| Risk                                                                                                              | Mitigation                                                                                                                                            |
| ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Credenciales OAuth no configuradas al implementar                                                                 | El paso 1 del plan requiere configurarlas antes de cualquier prueba OAuth. Se puede probar email+password mientras tanto.                             |
| URL de callback en producción — si el dominio no está en "Redirect URLs" de Supabase, OAuth falla silenciosamente | Al desplegar a producción, añadir el dominio real al dashboard antes de activar OAuth.                                                                |
| Token de reset en el hash de la URL — algunos proxies/routers eliminan el fragmento hash                          | Supabase soporta también el token en query params (`?token_hash=…&type=recovery`); si el hash falla, usar `supabase.auth.verifyOtp` como alternativa. |
| `onAuthStateChange` dispara múltiples eventos al cargar la página — puede causar flicker en el Nav                | Hidratar el estado inicial con `getSession()` antes de suscribirse; usar un flag para evitar doble render.                                            |
| FK en `scores.user_id` falla si hay scores con `user_id` que no existen en `auth.users`                           | Verificar que la tabla `scores` no tenga `user_id` huérfanos antes de crear la FK. Si los hay, limpiarlos o setear a NULL.                            |

---

## What is **not** in this spec

- RLS (Row Level Security) en la tabla `scores`.
- Edición de perfil (username, avatar, email, contraseña desde panel de usuario).
- Sesiones múltiples / gestión de dispositivos.
- Autenticación en rutas de servidor con middleware Next.js.
- Magic link / OTP por SMS.
- Configuración de OAuth providers en el dashboard de Supabase (el usuario lo hace después).
- Migración de scores locales a Supabase.
- Tabla `profiles` separada.

Cada uno de estos, si se implementa, va en su propio spec.
