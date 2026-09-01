# SPEC 11 — Gamepad MK-II Visual Overhaul

> **Status:** Implemented
> **Depends on:** SPEC 10 (Mobile Touch Controls)
> **Date:** 2026-09-01
> **Objective:** Sustituir el gamepad virtual actual por la interfaz visual y funcional del "Gamepad MK-II" basada en las referencias de assets.

---

## Scope

**In:**

- **Rediseño Visual Completo:** Implementación de la estética "Gamepad MK-II" incluyendo:
  - Fondo con gradiente lineal oscuro y bordes neón.
  - D-pad con botones individuales, sombras internas y el "gem" central pulsante.
  - Botones A y B circulares con efectos de brillo radial, anillos discontinuos al hacer hover y sombras profundas.
  - Efecto de "presionado" (transform y cambio de color) sincronizado con los inputs.
- **Sustitución de Componente:** Reemplazo total de `components/games/VirtualGamepad.tsx` por la nueva implementación visual.
- **Actualización de Mapeo:** Modificación de `lib/games/controls-mapping.ts` para integrar las teclas de acción referenciadas (`z/j` para A, `x/k` para B).
- **Adaptación Responsive:** Ajuste del layout para que el cambio de interfaz se active en el breakpoint `md` (768px) del proyecto.

**Out of scope:**

- Cambios en la lógica de los engines de los juegos.
- Implementación de nuevas acciones (ej. botones Start/Select).
- Animaciones complejas fuera de las definidas en la referencia CSS.

---

## Data model

### `lib/games/controls-mapping.ts` — Actualización de mapeos

Se mantienen las acciones `BTN_A` y `BTN_B` emitiendo la tecla funcional que cada engine ya reconoce (espacio/paso, etc.), para no romper el control táctil. Las teclas `z/j` y `x/k` de la referencia MK-II se gestionan SOLO como activación visual del resplandor (`VirtualGamepad`), desacopladas de la emisión funcional.

```ts
// Ejemplo de actualización en ControlMap:
{
  // ... otros juegos
  asteroides: {
    // ...
    BTN_A: ' ', // Tecla funcional del engine (disparo)
    BTN_B: 'p', // Tecla funcional del engine (pausa)
  },
  // z/j -> BTN_A y x/k -> BTN_B activan el resplandor visual (VirtualGamepad)
}
```

### `components/games/VirtualGamepad.tsx` — Definición de Estilos

No se crean nuevos archivos de datos, pero se implementarán variables de CSS (custom properties) para los colores neón (`--cyan`, `--magenta`) y gradientes, asegurando coherencia con la referencia.

---

## Implementation plan

1. **Actualizar Mapeos de Teclas** — Modificar `lib/games/controls-mapping.ts` para asignar `z/j` a `BTN_A` y `x/k` a `BTN_B` en todos los juegos reales. _Verificable:_ `tsc --noEmit`.
2. **Implementar Estilos Base del Gamepad** — Crear o actualizar el CSS en `components/games/VirtualGamepad.tsx` (o archivo de estilos asociado) replicando exactamente los colores, gradientes y sombras de la referencia MK-II. _Verificable:_ Inspección visual de los colores base.
3. **Reconstruir Estructura del D-Pad** — Implementar el layout de botones (`dp-up`, `dp-down`, etc.) con el "hub" central y el elemento `dp-hub-gem` con su animación de pulso. _Verificable:_ El D-pad renderiza la forma de cruz con el gema central.
4. **Reconstruir Botones de Acción** — Implementar los botones A y B circulares, incluyendo los gradientes radiales y los anillos discontinuos (`ab-ring`) que aparecen en hover. _Verificable:_ Botones circulares con brillo neón.
5. **Implementar Estados Activos (`.on`)** — Vincular la clase `.on` (activada por teclado o touch) a los estilos de transformación (`translateY`) y resplandor intenso definidos en la referencia. _Verificable:_ Los botones reaccionan visualmente al ser presionados.
6. **Ajustar Layout Responsive** — Asegurar que el componente se adapte correctamente al breakpoint `md` (768px), manteniendo la proporción y el centrado. _Verificable:_ El gamepad se ve correcto en modo móvil y escritorio.
7. **Verificación End-to-End** — Probar en emulador móvil y teclado físico:
   - Las teclas `z, x, j, k` activan visualmente los botones A/B.
   - El touch activa los botones con la animación de "hundido".
   - La estética es idéntica a `gamepad-neon.png`.

---

## Acceptance criteria

- [ ] El componente `VirtualGamepad` es visualmente idéntico a la referencia `gamepad-neon.png`.
- [ ] El D-pad incluye la gema central con animación de pulso activa.
- [ ] Los botones A y B son circulares, poseen gradientes radiales y muestran el anillo discontinuo al hacer hover.
- [ ] Todos los botones (D-pad y A/B) ejecutan la animación de "hundido" (`translateY`) al ser presionados.
- [ ] Las teclas físicas `z` y `j` activan visualmente el botón A.
- [ ] Las teclas físicas `x` y `k` activan visualmente el botón B.
- [ ] La interfaz se activa/desactiva correctamente siguiendo el breakpoint `md` (768px).
- [ ] No hay desbordamientos visuales ni distorsiones en pantallas móviles pequeñas.
- [ ] `tsc --noEmit` pasa sin errores tras actualizar los mapeos en `lib/games/controls-mapping.ts`.

---

## Decisions

- **Yes:** Replicar exactamente el CSS de la referencia MK-II (gradientes, sombras y animaciones) para garantizar la fidelidad visual.
- **Yes:** Sustitución total de `VirtualGamepad.tsx` en lugar de crear un sistema de skins, simplificando el mantenimiento del componente móvil.
- **Ambigüedad resuelta:** El plan original asignaba `z/x` a `BTN_A/B` en `controls-mapping.ts`, pero los engines de asteroides/arkanoid escuchan `espacio`/`p` (y tetris `q`/`e`) — asignar `z/x` rompía el control táctil. Decisión: desacoplar. El mapeo conserva la tecla funcional del engine y `z/j`/`x/k` quedan solo como resplandor visual del gamepad (gestionado en `VirtualGamepad`). Sin cambios en la lógica de los engines.
- **Yes:** Actualizar el mapeo de teclas físicas a `z/j` y `x/k` para alinear la experiencia de escritorio con la identidad del nuevo gamepad.
- **Yes:** Mantener el breakpoint `md` (768px) del proyecto para evitar inconsistencias con el resto de la interfaz de Arcade Vault.
- **No:** Usar imágenes externas para los botones; se implementarán mediante CSS puro y SVGs para asegurar nitidez en cualquier resolución.
