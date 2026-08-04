# SPEC 02 — Animación de explosión de bloques

> **Estado:** Implemented
> **Depende de:** SPEC 01
> **Fecha:** 2026-07-17
> **Objetivo:** Reemplazar la desaparición instantánea de los bloques por una animación de explosión con sprites del spritesheet y dibujar los bloques con sprites en vez de rectángulos de color.

## Scope

**Incluye:**

- Animación de explosión al destruir un bloque usando `EXPLOSION_FRAMES.*` del spritesheet.
- La explosión se dibuja estirada al tamaño del bloque (52×20).
- El juego sigue corriendo durante las explosiones (pelota se mueve, otras colisiones se procesan).
- Múltiples explosiones simultáneas si se rompen varios bloques seguidos.
- La transición a victoria (`game.state = 'victory'`) espera a que terminen todas las explosiones activas.
- Los bloques se dibujan con `drawSprite(ctx, 'block_<color>', ...)` en vez de `ctx.fillRect`.
- Sin sonido — solo animación visual.

**No incluye (futuros specs):**

- Efectos de partículas.
- Animación de la pelota al rebotar.
- Animación del paddle.
- Diferentes tipos de explosión (más grande, más pequeña).

## Data model

```js
// Explosiones activas
const explosions = [];
// cada explosión: { x, y, w: 52, h: 20, frames, frameIndex: 0, timer: 0 }
// frames = EXPLOSION_FRAMES[color] (4 frames de 32×16, estirados a 52×20)

// ROW_COLORS se usa igual — ya coincide con las claves de EXPLOSION_FRAMES

// game cambia:
// - victory ya no se dispara con blocks.every(!alive)
// - se dispara solo cuando blocks.every(!alive) Y explosions.length === 0
```

**Nuevo arreglo global:** `explosions[]`. No hay cambios en `game`, `paddle`, `ball`, `blocks` ni `ROW_COLORS`.

## Implementation plan

1. **Agregar arreglo `explosions` global.** Inicializar como `const explosions = [];` junto a las demás variables globales.

2. **Cambiar dibujado de bloques.** En `draw()`, reemplazar `ctx.fillRect` por `drawSprite(ctx, 'block_' + b.color, ...)` para cada bloque vivo.

3. **Crear explosión al destruir bloque.** En `update()`, donde se marca `b.alive = false`, agregar: guardar posición/color del bloque, pushear `{ x, y, w: 52, h: 20, frames: EXPLOSION_FRAMES[b.color], frameIndex: 0, timer: 0 }` a `explosions[]`.

4. **Actualizar explosiones en update().** Recorrer `explosions`, incrementar `timer` por ~16ms (o usar frameDelta). Cuando `timer >= EXPLOSION_DURATION` (150ms), remover del arreglo. `frameIndex = Math.floor(timer / (EXPLOSION_DURATION / frames.length))`.

5. **Dibujar explosiones en draw().** Recorrer `explosions`, llamar `drawFrame(ctx, frame, x, y, w, h)` con el frame actual.

6. **Retrasar victoria.** Donde se verifica `blocks.every(!alive)`, agregar condición `&& explosions.length === 0`. Si `blocks.every(!alive)` pero hay explosiones, no activar victoria todavía.

7. **Limpiar explosiones en reinicio.** En el handler de ESPACIO para reiniciar (`gameover`/`victory`), limpiar también `explosions.length = 0`.

## Acceptance criteria

- [x] Al romper un bloque, aparece una animación de explosión de 4 frames en 150ms usando los sprites del spritesheet en la posición del bloque.
- [x] La explosión se dibuja estirada a 52×20 (el mismo tamaño del bloque).
- [x] Si el bloque se rompe, la explosión no bloquea el movimiento de la pelota ni el resto del juego.
- [x] Si se rompen varios bloques casi al mismo tiempo, todas las explosiones se reproducen simultáneamente.
- [x] Al romper el último bloque, la pantalla de victoria no aparece hasta que terminen todas las explosiones.
- [x] Los bloques vivos se dibujan con sprites del spritesheet (no rectángulos de color).
- [x] Al reiniciar la partida (ESPACIO en gameover/victory), no quedan explosiones activas visibles ni en memoria.

## Decisions

- **Sí:** Explosión con `EXPLOSION_FRAMES.*` existente del spritesheet. Ya está en los assets, solo había que usarlo.
- **Sí:** Frame estirado a 52×20 (tamaño del bloque). Coincide con el espacio que ocupaba el bloque.
- **Sí:** Bloques dibujados con sprites del spritesheet (`drawSprite`). Ya se carga la spritesheet para el paddle, no hay razón para no usarla.
- **Sí:** Victoria retrasada hasta que terminen las explosiones. Evita el salto visual de "GANASTE" superpuesto a la animación.
- **Sí:** `explosions` como arreglo global, mismo patrón que `blocks`. Simple, sin estructuras adicionales.
- **No:** Sonido de explosión. El usuario lo pidió explícitamente fuera del spec.
- **No:** Partículas o efectos adicionales. Se deja para otro spec si se quiere.

## What is **not** in this spec

- Efectos de partículas.
- Animación de la pelota al rebotar.
- Animación del paddle.
- Diferentes tipos de explosión.
- Sonido de explosión.

Cada uno de estos, si llega, va en su propio spec.
