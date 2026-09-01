# SPEC 10 — Mobile Touch Controls

> **Status:** Approved
> **Depends on:** SPEC 05, 07, 08, 09 (Real Games)
> **Date:** 2026-09-01
> **Objective:** Implementar un sistema de controles táctiles y layout adaptativo para dispositivos móviles que permita jugar todos los juegos reales mediante un gamepad virtual.

---

## Scope

**In:**

- **Gamepad Virtual:** Implementación de un componente de controles táctiles fuera del canvas que incluya un D-pad (4 flechas) y 2 botones de acción.
- **Mapeo Dinámico:** Sistema de traducción de inputs del gamepad a las teclas/acciones específicas de cada juego real.
- **Layout Adaptativo:**
  - Uso de breakpoints de Tailwind (`md`) y `navigator.maxTouchPoints` para activar la interfaz móvil.
  - Estructura vertical: `Canvas` $\rightarrow$ `Virtual Gamepad` $\rightarrow$ `Footer de Acciones (Pause/SkinSwitcher)`.
  - Ocultar el HUD de React original en modo móvil.
  - Ajuste dinámico del tamaño del canvas para encajar en pantallas pequeñas.
- **Estética:** Estilo visual coherente con el diseño neon/retro de los juegos.
- **Compatibilidad:** Coexistencia con controles de teclado en dispositivos híbridos.

**Out of scope:**

- Implementación de gestos (swipes) o multitouch complejo.
- Adaptación de juegos que no sean "reales" (simulaciones).
- Cambios en la lógica interna de los engines (solo se inyectan inputs).

---

## Data model

### `lib/games/controls-mapping.ts` — Nueva definición de mapeo

Se crea un objeto de configuración que vincula los botones del Gamepad Virtual con las teclas físicas que el engine ya procesa.

```ts
type GamepadAction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'BTN_A' | 'BTN_B';

interface ControlMap {
  [key in GamepadAction]: string; // Ejemplo: 'BTN_A': ' ' (Espacio)
}

export const TOUCH_CONTROLS: Record<string, ControlMap> = {
  asteroides: {
    UP: 'w',
    DOWN: 's',
    LEFT: 'a',
    RIGHT: 'd',
    BTN_A: ' ',
    BTN_B: 'p',
  },
  tetris: {
    UP: 'w',
    DOWN: 's',
    LEFT: 'a',
    RIGHT: 'd',
    BTN_A: 'q',
    BTN_B: 'e',
  },
  // ... mapeos para arkanoid y snake
};
```

### `components/games/VirtualGamepad.tsx` — Nueva interfaz

Componente React ("use client") que emite eventos de teclado simulados o llama a callbacks del wrapper.

### `components/games/MobileGameLayout.tsx` — Nuevo contenedor

Componente que encapsula el `GameCanvas`, el `VirtualGamepad` y el footer de acciones, manejando la visibilidad según el breakpoint `md` y `maxTouchPoints`.

---

## Implementation plan

1. **Definir Mapeos de Control** — Crear `lib/games/controls-mapping.ts` con la configuración de teclas para cada juego real. _Verificable:_ `tsc --noEmit`.
2. **Crear `components/games/VirtualGamepad.tsx`** — Implementar el panel visual con D-pad y 2 botones. Debe disparar eventos de teclado sintéticos (`KeyboardEvent`) o callbacks que el engine pueda escuchar. _Verificable:_ Componente renderiza correctamente en modo dev; clics disparan logs de teclas.
3. **Crear `components/games/MobileGameLayout.tsx`** — Implementar el contenedor con Flexbox (`flex-col`).
   - Lógica de detección: `window.innerWidth < 768` (md) y `navigator.maxTouchPoints > 0`.
   - Organización: `Canvas` $\rightarrow$ `VirtualGamepad` $\rightarrow$ `Footer (Pause/SkinSwitcher)`.
   - Ocultar HUD de React mediante clases condicionales.
     _Verificable:_ El layout cambia dinámicamente al redimensionar la ventana o emular dispositivo móvil.
4. **Integrar Layout en `PlayerScreen`** — Envolver el `GameCanvas` con `MobileGameLayout` para que se active automáticamente en móviles. _Verificable:_ `/player/[id]` muestra la interfaz táctil en móvil.
5. **Adaptar Tamaño del Canvas** — Ajustar el CSS del `GameCanvas` para que sea responsivo y no desborde la pantalla al añadir el gamepad abajo. _Verificable:_ El canvas es visible y centrado sin scroll vertical innecesario.
6. **Verificación End-to-End** — Probar en dispositivo móvil real o emulador:
   - Navegación fluida.
   - Control total de los 4 juegos reales vía gamepad.
   - Visibilidad correcta de botones de Pausa y Temas.
   - HUD de React oculto.
   - Regresiones: teclado sigue funcionando en escritorio.

---

## Acceptance criteria

- [ ] `lib/games/controls-mapping.ts` existe y contiene mapeos válidos para Asteroides, Tetris, Arkanoid y Snake.
- [ ] El `VirtualGamepad` es visible solo en dispositivos con `maxTouchPoints > 0` y pantallas `< md` (Tailwind).
- [ ] El layout en móvil es estrictamente vertical: `Canvas` $\rightarrow$ `Gamepad` $\rightarrow$ `Footer (Pause/Skins)`.
- [ ] El HUD de React (puntuación, vidas, etc.) está completamente oculto en modo móvil.
- [ ] El canvas se ajusta dinámicamente para evitar el desbordamiento vertical en pantallas pequeñas.
- [ ] Presionar las flechas y botones del Gamepad ejecuta la acción correcta en los 4 juegos reales.
- [ ] El teclado físico sigue funcionando correctamente en modo escritorio y modo híbrido.
- [ ] El estilo visual del gamepad es coherente con la estética neon/retro del resto de la plataforma.
- [ ] `tsc --noEmit` pasa sin errores.

---

## Decisions

- **Yes:** Layout vertical estrictamente definido (`Canvas` $\rightarrow$ `Gamepad` $\rightarrow$ `Footer`) para optimizar el espacio en pantallas táctiles.
- **No:** Uso de gestos (swipes) o multitouch complejo; se prioriza la precisión de un gamepad virtual clásico.
- **Yes:** Mapeo dinámico basado en un archivo de configuración (`controls-mapping.ts`) para evitar modificar la lógica interna de cada engine.
- **No:** Mantener el HUD de React en móvil; se oculta para maximizar el área de juego y evitar ruido visual.
- **Yes:** Detección combinada de `navigator.maxTouchPoints` y breakpoints de Tailwind (`md`) para asegurar que la UI solo aparezca en contextos táctiles reales.
- **Yes:** Implementación de controles fuera del canvas mediante componentes React para facilitar el mantenimiento y el estilo CSS.
- **Yes:** Coexistencia de inputs (Táctil + Teclado) para soportar dispositivos híbridos.
