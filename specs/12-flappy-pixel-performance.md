# SPEC 12 — Flappy Pixel Performance Audit & Reusable Game Engine Patterns

> **Status:** Implemented
> **Depends on:** None
> **Date:** 2026-09-04
> **Objective:** Auditar y optimizar el engine de flappy-pixel para prevenir cuellos de botella, y documentar un checklist reutilizable de performance para futuros juegos arcade.

---

## Scope

**In:**

- Auditoría del engine `lib/games/flappy-pixel/engine.ts` identificando ineficiencias en el game loop, rendering y gestión de memoria.
- Optimizaciones concretas en el engine de flappy-pixel (rendering batching, eliminación de allocaciones por frame, cacheo de propiedades estáticas del canvas).
- Eliminación de estado redundante (`gameOver` duplicado con `state`).
- Creación de `docs/game-performance-checklist.md` con patrón reutilizable para audits de engines futuros.
- Verificación de que el engine sigue pasando `tsc --noEmit` y que el juego se ejecuta a 60fps estable tras los cambios.

**Out of scope:**

- Cambios en otros juegos (asteroides, tetris, arkanoid, snake) — el checklist sirve como guía para specs futuros.
- Modificación del `GameEngine` interface global (`lib/games/types.ts`) a menos que sea estrictamente necesario para flappy-pixel.
- Optimizaciones de rendering avanzadas (offscreen canvas, WebGL, spatial partitioning) — se documentan como posibles mejoras futuras en el checklist pero no se implementan.
- Cambios en el sistema de skins o controles táctiles.

---

## Data model

No se introducen nuevas estructuras de datos. Se optimizan las existentes en `lib/games/flappy-pixel/engine.ts`:

### Propiedades del canvas que se cachean una sola vez (constructor)

```ts
// Actual: se asigna font y text props en cada frame de render()
// Propuesto: se cachean en el constructor
private cachedFont = 'bold 24px monospace';
private cachedSmallFont = '16px monospace';
```

### Eliminación de estado redundante

```ts
// Actual: dos señales de fin de juego
private gameOver = false;  // ← eliminar
private state: GameState = 'waiting' | 'playing' | 'gameover';

// Propuesto: usar solo `state`
private state: GameState = 'waiting';
// endGame() solo cambia state a 'gameover', se elimina gameOver
```

### Array de tuberías — sin cambios estructurales

Se mantiene `Pipe[]` como está. El patrón `filter()` por frame es aceptable para la cantidad típica de tuberías en un flappy bird (máximo ~6-8 visibles). No se introduce pooling ni spatial indexing dado el volumen de objetos.

---

## Implementation plan

1. **Auditoría y documentación del engine actual** — Leer `lib/games/flappy-pixel/engine.ts` y `constants.ts` línea por línea. Identificar todas las llamadas a Canvas API que ocurren por frame y clasificarlas como: estática (cambia rara vez), dinámica (cambia cada frame), o redundante (se puede eliminar). _Verificable:_ Lista de hallazgos en el diff.

2. **Eliminar estado redundante `gameOver`** — Remover la propiedad `private gameOver = false` del engine. Unificar lógica con `state === 'gameover'`. Actualizar `flap()`, `endGame()`, `checkCollisions()` y el loop para que lean `state` en vez de `gameOver`. _Verificable:_ `tsc --noEmit` pasa; juego funciona igual (game over al chocar, flap inhibited después de morir).

3. **Cachear propiedades estáticas del canvas** — Mover la asignación de `ctx.font` y `ctx.textAlign` al constructor (o a un método `init()` que se llame una vez). Eliminar estas líneas del método `render()`. _Verificable:_ El score y el mensaje "TAP TO START" siguen renderizándose correctamente; `render()` tiene 2 líneas menos.

4. **Optimizar batch de rendering en pipes** — Reordenar el loop de pipes en `render()` para dibujar primero todos los cuerpos principales (un solo `fillStyle`), luego todos los caps (otro `fillStyle`). Actualmente alterna `fillStyle` por cada pipe (2 cambios × N pipes). Propuesto: 2 cambios totales independientemente del número de pipes. _Verificable:_ Los pipes se ven idénticos visualmente; el diff muestra un solo bloque de `fillStyle` por tipo de dibujo.

5. **Reemplazar `fillRect` de background por `clearRect` + `fillRect`** — Actualmente `render()` hace `fillRect` del fondo completo cada frame. Cambiar a `ctx.clearRect()` + un solo `fillRect` con el color de fondo. Más limpio semánticamente y evita el overhead de llenar pixels que se van a sobreescribir. _Verificable:_ El fondo se renderiza igual; código es más legible.

6. **Optimizar `getColors()`** — Cacheear el resultado de `paletteRef.current` en una propiedad `private colors` que solo se actualice cuando el skin cambia (via callback o dirty flag), en vez de acceder al ref cada frame. _Verificable:_ Los colores de skin se aplican correctamente al cambiar de tema; `getColors()` ya no accede a `paletteRef` en cada llamada.

7. **Crear `docs/game-performance-checklist.md`** — Documentar el checklist reutilizable con las optimizaciones aplicadas a flappy-pixel como ejemplos concretos. Incluir secciones: Rendering, State Management, Memory, Canvas API best practices. _Verificable:_ El archivo existe y es legible; contiene al menos 8 items verificables.

8. **Verificación final** — Ejecutar `tsc --noEmit` y `npm run lint`. Probar el juego manualmente: flap, colisiones, pausa, cambio de skin, mobile touch controls. Confirmar que no hay regresiones en otros juegos que usan el mismo patrón de wrapper. _Verificable:_ Todos los checks pasan sin errores.

---

## Acceptance criteria

- [ ] `lib/games/flappy-pixel/engine.ts` no tiene la propiedad `gameOver` — toda la lógica de fin de juego usa `state === 'gameover'`.
- [ ] `ctx.font` y `ctx.textAlign` se asignan una sola vez (constructor o `init()`), no en cada frame de `render()`.
- [ ] `render()` dibuja primero todos los cuerpos de pipes, luego todos los caps, con un máximo de 2 cambios de `fillStyle` por frame (independiente del número de pipes).
- [ ] El fondo se renderiza con `clearRect()` + un solo `fillRect`, no un `fillRect` sobre canvas sucio.
- [ ] `getColors()` cachea el resultado y no accede a `paletteRef.current` en cada llamada.
- [ ] `tsc --noEmit` pasa sin errores tras los cambios.
- [ ] `npm run lint` pasa sin errores o warnings nuevos.
- [ ] El juego funciona correctamente: flap, colisiones, pausa, cambio de skin, controles táctiles en móvil.
- [ ] `docs/game-performance-checklist.md` existe y contiene al menos 8 items verificables.
- [ ] No hay regresiones en otros juegos reales (verificar que `npm run build` completa sin errores).

---

## Decisions

- **Yes:** Eliminar `gameOver` y unificar con `state`. Dos fuentes de verdad para el mismo estado es un anti-patrón que complica maintenance y crea riesgo de desincronización.
- **No:** Introducir object pooling para tuberías. El flappy bird típico tiene máximo 6-8 tuberías visibles simultáneamente. El overhead de `filter()` por frame es despreciable para ese volumen.
- **No:** Offscreen canvas para pre-renderizar pipes. El costo de crear y mantener un offscreen canvas no se justifica con 2 rectángulos por tubería y menos de 10 tuberías activas.
- **Yes:** Cachear `ctx.font` en el constructor. Asignar una fuente en Canvas 2D es una operación costosa que implica parsing y resolución de fuentes del sistema. Hacerlo una vez elimina ese overhead del hot path.
- **Yes:** Reordenar el batch de pipes (todos los cuerpos, luego todos los caps) para minimizar cambios de `fillStyle`. Cada cambio de fillStyle puede disparar una sincronización interna del renderer del browser.
- **No:** Introducir dirty rectangle rendering. El canvas es 400×600 (240K pixels). Redibujar completo cada frame es barato en hardware moderno. Dirty rectangles añadirían complejidad de tracking sin beneficio medible.
- **Yes:** Crear el checklist como archivo independiente (`docs/game-performance-checklist.md`) en vez de documentarlo dentro del spec. Así el checklist vive como referencia viva después de que el spec esté "Implemented".
- **No:** Modificar `GameEngine` interface global. Los cambios son internos al engine de flappy-pixel y no requieren cambios en el contrato que comparten los otros juegos.

---

## Risks

| Risk                                                                                  | Mitigation                                                                                                                                                                       |
| ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Eliminar `gameOver` rompe lógica en `flap()` o `endGame()` que dependa de la booleana | Revisar cada referencia a `this.gameOver` en el diff y reemplazar por `this.state === 'gameover'`. El state ya cubre los mismos casos de uso.                                    |
| Cambiar el orden de dibujado de pipes altera la visual (z-order incorrecta)           | Los caps se dibujan encima de los cuerpos en el código actual. Mantener ese orden: primero cuerpos, luego caps. Verificar visualmente que los caps siguen superpuestos.          |
| Cachear `getColors()` causa que el skin no se actualice al cambiar de tema            | El cache se invalida cuando `paletteRef.current` cambia. Verificar que el wrapper `FlappyPixelGame.tsx` sigue actualizando `paletteRef` correctamente en el `useEffect` de skin. |

---

## What is **not** in this spec

- Optimizaciones de rendering avanzadas (offscreen canvas, WebGL, dirty rectangles).
- Object pooling o spatial partitioning para colisiones.
- Modificaciones al `GameEngine` interface global.
- Optimización de otros juegos (asteroides, tetris, arkanoid, snake) — el checklist sirve como guía para specs dedicados.
- Cambios en el sistema de skins o controles táctiles.
- Targets de performance más allá de 60fps estable.

Cada uno de estos, si se implementa, va en su propio spec.
