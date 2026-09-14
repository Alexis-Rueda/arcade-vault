# Supabase Dashboard — Security Checklist

Configuración manual en el dashboard de Supabase (Authentication > Settings).

## 1. Minimum Password Length

- **Valor:** 8
- **Ruta:** Authentication → Settings → Password
- **Acción:** Establecer `Minimum password length` a `8`.
- **Razón:** Complementa la validación regex en el frontend (SPEC 14).

## 2. Leaked Password Protection

- **Valor:** ON (habilitar)
- **Ruta:** Authentication → Settings → Password
- **Acción:** Activar `Check passwords against HaveIBeenPwned`.
- **Razón:** Bloquea contraseñas comprometidas conocidas en breaches públicos.

## 3. Max Signup Rate

- **Valor:** Configurar según necesidad (ej: 30/hour por IP)
- **Ruta:** Authentication → Settings → Security
- **Acción:** Definir límite de intentos de registro por período.
- **Razón:** Previene abuso de la funcionalidad de signup.
- **Nota:** Rate limiting de inserción de scores requiere edge function (spec futuro).

---

> Estos ajustes son independientes del código y se configuran directamente en el dashboard de Supabase.
