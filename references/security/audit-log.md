# Audit Log — Arcade Vault Security

Bitacora de auditorias de seguridad. Una entrada por corrida, orden cronologico descendente.

---

## Auditoria 2026-09-14

**Commit:** `30212ab`
**Scope:** full
**Resumen:** 🔴 1 · 🟠 6 · 🟡 4 · 🔵 3

### Criticos

- ~~`next@16.2.10` — 11 CVEs incluyendo RCE en windows, SSRF en Server Actions, middleware bypass.~~ **Resuelto** (2026-09-14): upgrade a `next@16.3.5` + `eslint-config-next@16.3.5`. Build y lint pasan.

### Altos

- `brace-expansion <=1.1.17` — DoS via expansion sin limite
- `browserslist <=4.28.6` — Memory growth + prototype pollution
- `js-yaml 4.0.0-4.3.1` — CPU quadratic consumption
- `nanoid <3.3.18` — Loop infinito en generadores custom
- `postcss <=8.5.22` — XSS + arbitrary file read
- `sharp <=0.35.4-rc.0` — Vulnerabilidades en libvips/libheif

### Medios

- `auth_leaked_password_protection` — Leaked Password Protection deshabilitado en Dashboard
- `auth_rls_initplan` — 3 politicas en scores re-evaluan auth.uid() por fila (performance)
- `unindexed_foreign_keys` — scores_user_id_fkey sin indice coverting
- `scores_insert_auth` — INSERT solo valida IS NOT NULL, no IS NULL = user_id

### Info / Checks manuales

- [ ] Minimum password length >= 8 en Dashboard
- [ ] Leaked Password Protection = ON en Dashboard
- [ ] Max signup rate por IP configurado

### Delta vs anterior

- Nuevos: todos (primera auditoria)
- Resueltos: `next@16.2.10` critical CVEs (upgrade a 16.3.5)

---
