# SPEC 03 — About page y envío de contacto con Resend

> **Status:** Approved
> **Depends on:** SPEC 01, SPEC 02
> **Date:** 2026-08-01
> **Objective:** Implementar la página /about portando el template `resources/templates/home-about/about.jsx` y reemplazar el envío simulado del formulario de contacto por un POST real a `/api/contact` que envía el mensaje vía Resend, manteniendo la animación de terminal del template cuando el envío es exitoso.

---

## Scope

**In:**

- Ruta nueva `app/(vault)/about/page.tsx` que renderiza `AboutScreen` con las tres secciones del template: hero con kicker "▸ ACERCA DE", título, misión y `highlight-row` de 3 (HECHO CON ❤️, JUEGOS EN HTML, PROYECTO EN CONSTANTE CRECIMIENTO); divider pixel-art (`div-bar` + `div-pixels`); sección de contacto con intro (`CONTÁCTANOS`, copy, `contact-tips` con 3 LEDs verde/amarillo/magenta) y formulario (`NOMBRE`, `CORREO`, `MENSAJE`, botón `▶ ENVIAR MENSAJE`).
- Componente client-side `components/AboutScreen.tsx` que replica el comportamiento del template (envoltura en `<div className="about fade-in">`, `useReveal` para IntersectionObserver, `useState` para `form`/`sent`/`shake`, validación trim y animación `shake` 400ms si hay campos vacíos).
- Acción nueva del form: `onSubmit` hace `fetch("/api/contact", { method: "POST", body: JSON.stringify(form) })` en vez de `setSent(form.name.trim())` directo. Si la respuesta es 2xx, llama a `setSent(form.name.trim())` para activar la vista de éxito del terminal. Si no, muestra mensaje de error inline (texto rojo bajo el botón) y NO cambia `sent`. La animación `shake` se conserva para el caso de campos vacíos.
- Endpoint server-side nuevo `app/api/contact/route.ts` que recibe `{ name, email, msg }`, valida en servidor (name ≥ 2 chars, email regex, msg ≥ 10 chars, msg ≤ 5000), llama a `lib/email/resend.ts` y responde `{ ok: true }` en éxito o `{ ok: false, error }` en fallo (status 400 validación / 500 sin RESEND_TO / 502 upstream).
- Módulo `lib/email/resend.ts` (Server-only) con un único export `sendContactEmail({ name, email, msg })`. Lee `RESEND_TO` (obligatorio, sin default), `RESEND_FROM` con default `"onboarding@resend.dev"` y `RESEND_API_KEY` (opcional). Si falta la key, hace `console.log` del mensaje y resuelve `ok: true` (modo log only para dev). Si falta `RESEND_TO`, resuelve `{ ok: false, error: "RESEND_TO no configurado" }` sin lanzar excepción.
- Env vars nuevas, comportamiento por variable:

  | Variable | ¿Obligatoria? | Default | Notas |
  | --- | --- | --- | --- |
  | `RESEND_API_KEY` | No en dev | — | Si falta, modo log only en consola del server. |
  | `RESEND_TO` | Sí | — | Sin default. El endpoint responde 500 con `{ ok: false, error: "RESEND_TO no configurado" }` si falta. |
  | `RESEND_FROM` | No | `onboarding@resend.dev` | Si falta, se usa el default. Útil para producción con dominio verificado. |

- Archivo `.env.template` en raíz del repo (commiteado, sin valores reales). Lista las tres variables con comentarios: `RESEND_API_KEY` con link a `https://resend.com/api-keys`, `RESEND_TO` marcado obligatorio, `RESEND_FROM` marcado opcional con nota sobre `onboarding@resend.dev` por defecto.
- Dependencia nueva `resend` en `package.json` (última estable). Sin flag de install especial.
- Vista de éxito del template (`.terminal-success` con barra de dots + cuerpo VAULT-OS) se conserva tal cual cuando el POST responde 2xx. El botón "ENVIAR OTRO MENSAJE" resetea `form` y `sent` como hoy.
- Bloque CSS `===== ABOUT PAGE =====` del `resources/templates/home-about/styles.css` (líneas 1071–1146: `.about*`, `.highlight*`, `.about-divider`, `.about-contact`, `.contact-grid`, `.contact-intro`, `.contact-title`, `.contact-sub`, `.contact-tips`, `.contact-form` + estados `.shake`, `.terminal-success`, `.term-bar`, `.term-body`, `.btn.press`, `@keyframes shake`) migrado a `app/globals.css`, sin pisar selectores ya presentes de specs 01 y 02.
- `components/Nav.tsx`: añadir link "ACERCA DE" en desktop y mobile, después de "SALÓN DE LA FAMA". `isActive` matchea `pathname === "/about"`.
- Datos estáticos del About en `app/data/about.ts`: `MISSION` (string), `HIGHLIGHTS` (`{ icon, text, color }[]`, 3 entradas), `CONTACT_TIPS` (`{ text, led }[]`, 3 entradas verde/amarillo/magenta). Iconos `HighlightIcon` (HEART, BROWSER, PLANT) portados como subcomponente en `components/about/HighlightIcon.tsx`.

**Out of scope (para futuros specs):**

- Persistir los mensajes en una base de datos. Solo envío por correo.
- Rate limiting / captcha. Queda libre; se documenta como deuda.
- Plantilla HTML rica en el correo. Texto plano equivalente al `msg` más una cabecera con `name` y `email`. Sin MJML, sin react-email.
- Dashboard interno para revisar mensajes.
- Autenticación del visitante. El formulario es público, sin sesión.
- Páginas de privacidad / términos legales.
- Refactor de la `useReveal` del spec 02; se reusa tal cual.
- Reescribir el copy del template. Idéntico al `about.jsx`.
- i18n. Todo en español.
- Tests automatizados del endpoint.
- Cambios en las páginas de los 8 juegos.
- SEO específico de `/about` (metadata, og:image) más allá del default de Next.
- Reenvío automático a múltiples buzones.

---

## Data model

Este spec introduce un solo set de datos estáticos para el copy del About y un único endpoint nuevo. No hay tablas, no hay migraciones, no hay persistencia.

### `app/data/about.ts` (nuevo)

```ts
import type { HomeFeatureColor } from "./home";
// Reutiliza el union de colores ya existente en spec 02.

export type TipLed = "green" | "yellow" | "magenta";

export type AboutHighlight = {
  icon: "HEART" | "BROWSER" | "PLANT";
  text: string;
  color: HomeFeatureColor;
};

export type AboutTip = {
  text: string;
  led: TipLed;
};

export const MISSION: string =
  "ARCADE VAULT nació del amor por los videojuegos clásicos. Nuestra misión es preservar y celebrar " +
  "los arcades que definieron una generación, haciéndolos accesibles para todos, en cualquier lugar " +
  "y sin costo.";

export const HIGHLIGHTS: ReadonlyArray<AboutHighlight> = [
  { icon: "HEART",   text: "HECHO CON \u2764 PARA JUGADORES",                  color: "magenta" },
  { icon: "BROWSER", text: "JUEGOS EN HTML — CORREN EN CUALQUIER NAVEGADOR",  color: "cyan"    },
  { icon: "PLANT",   text: "PROYECTO EN CONSTANTE CRECIMIENTO",               color: "green"   },
];

export const CONTACT_TIPS: ReadonlyArray<AboutTip> = [
  { text: "RESPUESTA EN 24-48H",       led: "green"  },
  { text: "SUGERENCIAS BIENVENIDAS",  led: "yellow" },
  { text: "SIN SPAM, JAMÁS",           led: "magenta" },
];
```

### Endpoint `POST /api/contact`

Contrato:

| Campo | Tipo | Validación servidor |
| --- | --- | --- |
| `name` | string | `trim().length >= 2 && length <= 80` |
| `email` | string | regex `^[^\s@]+@[^\s@]+\.[^\s@]+$`, `length <= 254` |
| `msg` | string | `trim().length >= 10 && length <= 5000` |

Request:

```json
{ "name": "px_kai", "email": "jugador@vault.gg", "msg": "Hola, quería proponer un juego…" }
```

Responses:

- `200 { ok: true }` — envío OK (incluido modo log only).
- `400 { ok: false, error: "<campo>: <motivo>" }` — validación falla. Lista primero el primer campo inválido.
- `500 { ok: false, error: "RESEND_TO no configurado" }` — falta `RESEND_TO` en el servidor.
- `502 { ok: false, error: "No se pudo enviar el correo" }` — Resend devolvió error o timeout.

No hay autenticación. No hay rate limit (decidido). El endpoint es público.

---

## Implementation plan

Cada paso deja el sistema funcional. Commits chicos.

1. **Añadir `resend` como dependencia** (`package.json` + `pnpm install` o equivalente). Sin scripts adicionales. _Verificable:_ `node -e 'require("resend")'` no falla; `package.json` lista `"resend"` en `dependencies`.

2. **Crear `.env.template` en raíz del repo** si no existe. Tres variables documentadas:

   ```dotenv
   # Resend (https://resend.com/api-keys)
   # Opcional en dev: si falta, los envíos se loguean en consola del server (modo log only).
   RESEND_API_KEY=

   # Obligatorio. Buzón destino donde llegan los mensajes del formulario /about.
   # Sin default en código; el endpoint responde 500 si falta.
   RESEND_TO=tu-correo@ejemplo.com

   # Opcional. Buzón remitente. Si falta, se usa onboarding@resend.dev (modo dev).
   # En producción conviene verificar tu dominio en Resend y poner algo como no-reply@tudominio.com.
   RESEND_FROM=
   ```

   _Verificable:_ `cat .env.template` lista las tres con sus comentarios.

3. **Crear `lib/email/resend.ts`** (Server-only). Único export `sendContactEmail({ name, email, msg }): Promise<{ ok: boolean; error?: string }>`. Lógica:
   - Lee `RESEND_TO` (required), `RESEND_FROM` con default `"onboarding@resend.dev"`, `RESEND_API_KEY` (optional).
   - Si `RESEND_API_KEY` falta → `console.log("[contact:log-only]", { to, from, name, email, msg })` y resuelve `{ ok: true }`.
   - Si `RESEND_API_KEY` existe → instancia `Resend(apiKey)`, llama a `emails.send({ from, to, subject: "[Arcade Vault] Nuevo mensaje de contacto", html })`, resuelve según `error`.
   - Escapa `name`, `email` y `msg` antes de insertar en HTML (reemplaza `<`, `>`, `&`, `"`, `'` por sus entidades).
   - Si `RESEND_TO` falta → resuelve `{ ok: false, error: "RESEND_TO no configurado" }` sin lanzar excepción.
   - Cualquier excepción no controlada se captura y se resuelve como `{ ok: false, error: "..." }`.
   _Verificable:_ con key configurada, una llamada real devuelve `{ ok: true }`; sin key, console.log aparece y resuelve `{ ok: true }`; sin `RESEND_TO`, resuelve `{ ok: false, error: "RESEND_TO no configurado" }`.

4. **Crear `app/api/contact/route.ts`** con `export async function POST(req: Request)`. Lee el body JSON, valida los tres campos (trim, regex email, longitudes mínimas/máximas del data model). Si validación falla → `Response.json({ ok: false, error: "..." }, { status: 400 })`. Si pasa → llama a `sendContactEmail` y mapea el resultado a status (`ok:true` → 200, `error: "RESEND_TO no configurado"` → 500, resto → 502). Headers `Cache-Control: no-store`. _Verificable:_ `curl -X POST localhost:3000/api/contact -H "Content-Type: application/json" -d '{"name":"x","email":"bad","msg":"hola"}'` → 400; con data válida → 200.

5. **Crear `app/data/about.ts`** con `MISSION`, `HIGHLIGHTS`, `CONTACT_TIPS` y los tipos del data model. Reutiliza `HomeFeatureColor` de `app/data/home.ts`. _Verificable:_ `tsc --noEmit` pasa.

6. **Crear `components/about/HighlightIcon.tsx`** (Server Component, switch sobre `AboutHighlight.icon`). Devuelve uno de los tres SVG (`HEART`, `BROWSER`, `PLANT`) copiados del template, con `fill="currentColor"`. _Verificable:_ componente exporta `HighlightIcon` y los tres kinds renderizan SVG no vacío.

7. **Crear `components/AboutScreen.tsx`** (Client Component, `"use client"`). Replica el template:
   - `useReveal()` (mismo hook de spec 02, importar de `lib/hooks/useReveal`).
   - `useState<{ name: string; email: string; msg: string }>` con strings vacíos.
   - `useState<string | null>` para `sent` (nombre tras éxito) y `useState<{ visible: boolean; msg: string }>` para `errorInline` (texto de error).
   - `onSubmit` async: `e.preventDefault()`. Si cualquier campo vacío tras trim → `setShake(true)` + `setTimeout(... 400)`, igual que el template. Si todo OK → `setErrorInline({ visible: false, msg: "" })` y `fetch("/api/contact", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: form.name.trim(), email: form.email.trim(), msg: form.msg.trim() }) })`. Si `res.ok` → `setSent(form.name.trim())`. Si no → leer `error` del body y `setErrorInline({ visible: true, msg })`. Reset `shake` al final del handler.
   - Renderiza el bloque del template: hero (kicker, title, mission, highlight-row), divider, sección contacto con intro + form. Reemplaza el onSubmit simulado por el real; el resto del JSX queda idéntico al `about.jsx`.
   - Pasa `HIGHLIGHTS` y `CONTACT_TIPS` desde `app/data/about.ts` en vez de inline.
   _Verificable:_ con dev server arriba, `/about` muestra el form y un envío con `name/email/msg` válidos entra en `terminal-success` y dispara console.log en `lib/email/resend.ts`.

8. **Crear `app/(vault)/about/page.tsx`** (Server Component) que importa y renderiza `<AboutScreen />`. _Verificable:_ `curl localhost:3000/about` → 200, renderiza kicker "▸ ACERCA DE" en HTML.

9. **Migrar bloque CSS del About** desde `resources/templates/home-about/styles.css` (líneas 1071–1146, ya identificadas) a `app/globals.css`. Solo los selectores listados, sin duplicar. _Verificable:_ `grep -c "\\.about\|\\.contact\|\\.terminal\|\\.highlight" app/globals.css` > 0; selectores de specs 01 y 02 siguen funcionando.

10. **Actualizar `components/Nav.tsx`**:
    - Añadir `<Link href="/about" className={isActive("about") ? "active" : ""}>Acerca de</Link>` después de SALÓN DE LA FAMA en desktop y mobile.
    - Ajustar `isActive` para que también matchee `pathname === "/about"`.
    _Verificable:_ en `/about`, el link "Acerca de" lleva la clase `active`.

11. **Verificación end-to-end manual**:
    - `npm run dev` arranca sin `RESEND_API_KEY`, sin warnings nuevos.
    - `curl -X POST localhost:3000/api/contact -d '{"name":"Test","email":"a@b.co","msg":"Mensaje suficientemente largo"}' -H "Content-Type: application/json"` → 200, log aparece en consola del server.
    - `curl -X POST ...` con email inválido → 400.
    - `curl -X POST ...` con `RESEND_TO` vacío en `.env.local` → 500 con el mensaje "RESEND_TO no configurado".
    - Navegador en `/about`: las tres highlights visibles con sus íconos pixel; divider entre hero y contacto; tips con los tres LEDs (verde/amarillo/magenta); form con tres campos.
    - Submit con campos vacíos → shake del form, NO petición.
    - Submit con datos válidos → loading mientras fetchea; tras 2xx, vista terminal aparece; tras error, mensaje inline rojo bajo el botón y `sent` sigue null.
    - Botón "ENVIAR OTRO MENSAJE" resetea el form y la vista vuelve al estado inicial.
    - Nav muestra "ACERCA DE" en desktop y mobile; click navega a `/about`; el link se queda activo.
    - Sin JS el form renderiza estático (los `.reveal` aparecen visibles, no invisibles, gracias al fallback CSS).
    - Consola del navegador sin errores; consola del server sin errores (solo `console.log` informativo en modo log only).
    - `tsc --noEmit` pasa.
    - `next build` pasa sin nuevos warnings.

---

## Acceptance criteria

- [ ] `resend` aparece en `package.json` como dependencia y está instalado (lockfile actualizado).
- [ ] `.env.template` existe en raíz y lista `RESEND_API_KEY`, `RESEND_TO`, `RESEND_FROM` con comentarios sobre obtención de la key y el comportamiento de default/obligatoriedad de cada una.
- [ ] `curl -X POST localhost:3000/api/contact -H "Content-Type: application/json" -d '{"name":"x"}'` → 400 con `{ ok: false, error: "..." }`.
- [ ] `curl ... -d '{"name":"OK","email":"a@b.co","msg":"Mensaje suficientemente largo"}'` con `RESEND_API_KEY` sin configurar → 200, log del mensaje en consola del server.
- [ ] `curl ...` con `RESEND_TO` ausente en `.env.local` → 500 con `error: "RESEND_TO no configurado"`.
- [ ] `curl ...` con `RESEND_API_KEY` válida → 200 y mensaje recibido en el buzón `RESEND_TO`.
- [ ] `app/(vault)/about/page.tsx` existe, es Server Component y renderiza `<AboutScreen />`.
- [ ] `components/AboutScreen.tsx` existe, tiene `"use client"`, usa `useReveal`, hace `fetch("/api/contact", { method: "POST" })` en el submit y activa el estado `sent` solo tras respuesta 2xx.
- [ ] `components/about/HighlightIcon.tsx` existe y renderiza los tres kinds (`HEART`, `BROWSER`, `PLANT`).
- [ ] `app/data/about.ts` exporta `MISSION`, `HIGHLIGHTS` (3), `CONTACT_TIPS` (3) y los tipos asociados; reutiliza `HomeFeatureColor` de `app/data/home.ts`.
- [ ] `lib/email/resend.ts` exporta `sendContactEmail`, lee env vars con los defaults acordados (`RESEND_FROM = "onboarding@resend.dev"`), entra en modo log only si falta `RESEND_API_KEY`.
- [ ] `lib/email/resend.ts` no se importa desde ningún Client Component (`grep -r "lib/email/resend" components/ app/` no devuelve hits excepto en `app/api/contact/route.ts`).
- [ ] Bloque CSS del About (`.about*`, `.highlight*`, `.about-divider`, `.about-contact`, `.contact-grid`, `.contact-intro`, `.contact-title`, `.contact-sub`, `.contact-tips`, `.contact-form`, `.contact-form.shake`, `.terminal-success`, `.term-bar`, `.term-body`, `.btn.press`, `@keyframes shake`) está presente en `app/globals.css`.
- [ ] `app/globals.css` no contiene selectores duplicados con specs 01 y 02 (revisión por diff manual).
- [ ] `components/Nav.tsx` muestra link "Acerca de" en desktop y mobile, y queda activo cuando `pathname === "/about"`.
- [ ] Submit vacío dispara `shake` y no realiza `fetch`.
- [ ] Submit válido con respuesta 2xx muestra `.terminal-success` con el nombre del remitente en mayúsculas.
- [ ] Submit válido con respuesta de error muestra mensaje de error inline rojo en el form y `sent` permanece `null`.
- [ ] Botón "ENVIAR OTRO MENSAJE" resetea `form` y `sent`.
- [ ] `tsc --noEmit` pasa sin errores.
- [ ] `next build` pasa sin warnings nuevos atribuibles a este spec.
- [ ] Navegación `/` → click "Acerca de" en Nav → `/about` funciona en desktop y mobile.
- [ ] Consola del navegador sin errores ni warnings en `/about`.

---

## Decisions

- **Yes:** enviar el correo con Resend (no SendGrid, no Postmark, no SMTP genérico). Pedido explícito del usuario.
- **No:** usar Nodemailer + SMTP. Resend lo simplifica y el stack HTTP de Vercel encaja con la SDK.
- **Yes:** endpoint propio en `app/api/contact/route.ts` (Route Handlers de Next 16), no middleware ni edge function.
- **No:** Edge runtime para el endpoint. La SDK de Resend requiere Node runtime.
- **Yes:** `RESEND_FROM` con default `onboarding@resend.dev`. Sin dominio verificado en dev.
- **Yes:** `RESEND_TO` obligatorio, sin default, 500 explícito si falta. El deploy debe configurarlo.
- **Yes:** modo log only cuando falta `RESEND_API_KEY`. Permite `npm run dev` sin setup.
- **No:** fallar el arranque si falta la key. Bloquea `npm run dev`.
- **Yes:** sin rate limiting. Decidido por el usuario como deuda para un futuro spec.
- **No:** captcha invisible (Cloudflare Turnstile, hCaptcha). Sin rate limit, un captcha tendría más fricción que valor.
- **Yes:** validación en cliente Y servidor. Cliente da feedback inmediato (HTML5 + shake); servidor es la fuente de verdad (longitudes + regex).
- **No:** zod. Validación manual con `trim()` + regex cubre los cuatro campos sin dependencia nueva.
- **Yes:** copiar pixel-perfect el template. El usuario pidió "sigue el template exactamente igual".
- **No:** rediseñar copy o layout. Pedido explícito.
- **Yes:** terminal animado del template para éxito. Conserva el sabor arcade.
- **No:** toast genérico. Pediría reescribir la estética.
- **Yes:** error inline en el form. Mantiene la animación de éxito como recompensa clara.
- **No:** modal de error. Rompe el flujo del terminal de éxito.
- **Yes:** `useReveal` reusado del spec 02 tal cual.
- **No:** nueva implementación del IntersectionObserver.
- **Yes:** `HIGHLIGHTS` y `CONTACT_TIPS` en `app/data/about.ts`, no inline.
- **No:** datos mezclados con JSX. Sigue el patrón de spec 02 (`app/data/home.ts`).
- **Yes:** `HomeFeatureColor` se importa de `app/data/home.ts`. Es el mismo dominio (color neón).
- **No:** redefinir el union aquí. Sería drift.
- **Yes:** `lib/email/resend.ts` es module Server-only y no se importa desde Client Components.
- **No:** exponer el envío al cliente. La key nunca toca el bundle.
- **Yes:** HTML simple en el correo (escape + párrafos). Sin `react-email` ni MJML.
- **No:** plantilla rica con branding. Out of scope.
- **Yes:** `subject` fijo: `"[Arcade Vault] Nuevo mensaje de contacto"`.
- **No:** subject personalizable. No aporta.
- **Yes:** errores de validación devuelven el primer campo que falla, no todos.
- **No:** array de errores. UX ruidosa para un form de tres campos.
- **Yes:** cache `no-store` en el endpoint. No queremos buzones cacheados.
- **No:** rate limit por IP en memoria. Decidido por el usuario.
- **Yes:** `RESEND_FROM` con env var con default. Un único default conocido y portable.
- **No:** hardcoded fijo en código. Pierde flexibilidad para producción.
- **Yes:** spec rápido sin discusión extensa de "qué pasa si Resend cae". Si falla, respondemos 502 y el mensaje se pierde; spec futuro puede añadir cola.
- **No:** cola de reintentos con BullMQ u otro worker. Scope creep.
- **Yes:** archivo de ejemplo de env se llama `.env.template` (no `.env.example`). Convención explícita del usuario.
- **Yes:** modo rápido (definición sin preguntas exhaustivas), pero con un bloque de Phase 2 sobre alcance del envío, validación, UX y modo dev.
- **No:** phase 2 vacía. Sin eso, las defaults habrían sido asunciones.

---

## Risks

| Riesgo | Mitigación |
| --- | --- |
| API key de Resend filtrada al commit si se añade accidentalmente a `.env.template` con valor real | `.env.template` se commitea sin valores; `.gitignore` ignora `.env.local`. Documentado en el comentario del archivo. |
| Sin rate limit, un atacante puede enumerar direcciones válidas o agotar cuota de Resend | Decidido por el usuario. Documentado en "What is not in this spec" como deuda. Mitigación temporal: Resend corta el abuso a nivel de cuenta. |
| `RESEND_FROM` con `onboarding@resend.dev` puede llegar a spam en buzones estrictos | Documentado en `.env.template`. Resend permite verificar un dominio en `https://resend.com/domains` para producción. |
| Endpoint público, sin auth, queda expuesto a spam de bots | Decidido por el usuario. Mitigación futura: rate limit + captcha, propio spec. |
| HTML en el correo no escapa `name`/`email`/`msg` | `lib/email/resend.ts` escapa con `String.prototype.replace` para `<`, `>`, `&`, `"`, `'` antes de inyectar. Validación de longitud máxima + regex evitan payloads enormes. |
| Validación servidor insuficiente (regex de email naive) | Aceptado para MVP. El endpoint valida que el string tiene `@`, no que el buzón existe. Resend fallará con 502 si el buzón es inválido. |
| `sendContactEmail` lanza excepción no controlada | Wrap en `try/catch` que resuelve `{ ok: false, error: "..." }`. El endpoint mapea a 502. |
| Resend SDK retorna estructura cambiada entre versiones | Pinear la versión mayor (`^x.y.z`) y leer solo los campos necesarios (`error.name`, `error.message`). Aceptable. |
| `useReveal` no aplica a la sección hero (`about-hero`) — el template solo anima `about-divider` y `about-contact` | El JSX del template ya lo hace así. Sin cambios. |
| Build time aumenta por importar `resend` solo en server | Aceptable. La SDK no se mete al bundle del cliente porque `lib/email/resend.ts` no se importa desde ahí. |
| `.env.local` no existe en CI y el endpoint falla | El endpoint responde 500 con mensaje claro. La home, juegos y resto del sitio no dependen de `/api/contact`. Build no rompe. |
| `HomeFeatureColor` importado de `app/data/home.ts` crea acoplamiento lógico | Bajo: el union es estable y compartido por dominio. Si crece, se mueve a `app/data/types.ts` en un spec de tipos. |

---

## What is not in this spec

- Persistencia de mensajes en base de datos.
- Rate limit por IP.
- Captcha o anti-bot.
- Dashboard para revisar mensajes recibidos.
- Plantilla HTML rica en el correo (MJML / react-email).
- Reenvío a múltiples buzones.
- Refactor de `useReveal`.
- Tests automatizados del endpoint.
- i18n del About.
- Metadata específica para `/about` (og:image, sitemap).
- Dominio verificado de Resend y configuración de DNS.
- Cola de reintentos si Resend falla.
- Cambios en páginas de juegos.
- Reescritura de copy del template.
