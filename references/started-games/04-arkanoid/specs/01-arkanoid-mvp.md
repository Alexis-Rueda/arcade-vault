# SPEC 01 — Arkanoid MVP

> **Estado:** Implemented
> **Depende de:** Ninguno
> **Fecha:** 2026-07-17
> **Objetivo:** Implementar un MVP jugable de Arkanoid en un solo nivel con paddle, pelota, ladrillos, 3 vidas y puntaje, renderizado con Canvas 800x600.

## Scope

**Incluye:**

- Canvas 800x600 centrado en la página.
- Paddle (100×16px) controlado por mouse y teclado (flechas ←/→) simultáneamente.
- Pelota (10×10px) con rebote simple: inversión de vy al golpear el paddle, inversión de vx/vy en paredes y bloques.
- Parrilla de 10 columnas × 6 filas de ladrillos (52×20px c/u), un color distinto por fila.
- Puntaje: +10 puntos por cada ladrillo destruido.
- 3 vidas. Al perder la pelota, esperar presionar Espacio para re-saquear.
- Velocidad de pelota constante.
- Overlay semitransparente mostrando vidas y puntaje durante la partida.
- Overlay semitransparente de "GAME OVER" (0 vidas) y "¡GANASTE!" (todos los bloques rotos).

**No incluye (futuros specs):**

- Múltiples niveles.
- Power-ups.
- Pantalla de título o menú principal.
- High scores persistentes.
- Bloques especiales (varios golpes, indestructibles, etc.).
- Física de ángulo en el paddle.
- Sonidos.
- Explosiones animadas.

## Data model

```js
const game = {
  score: 0,
  lives: 3,
  state: 'playing', // 'playing' | 'lifelost' | 'gameover' | 'victory'
};

const paddle = { x: 350, y: 570, w: 100, h: 16 };

const ball = { x: 400, y: 560, r: 5, vx: 3, vy: -3, active: false };

const blocks = [];
// { x, y, w: 52, h: 20, color: string, alive: true }
```

Convenciones:
- Coordenadas: origen top-left.
- Velocidades en píxeles/frame (60 fps).
- `ball.active = false` → pelota pegada al paddle, esperando Espacio.
- `ball.active = true` → pelota en movimiento.

## Implementation plan

1. Crear `index.html` con estructura mínima: canvas 800×600 centrado, `<script>` inline con todo el JS. Incluir y cargar `assets/spritesheet.js`.

2. Definir constantes y estado inicial (`game`, `paddle`, `ball`, `blocks`, colores por fila) en JS global.

3. Implementar función `initBlocks()` que genera la parrilla 10×6 con espaciado.

4. Implementar bucle de juego (`requestAnimationFrame`) con `update()` y `draw()`.

5. Implementar `draw()`: fondo negro, paddle (rectángulo blanco), pelota (círculo blanco), bloques vivos (rectángulos coloreados), overlay con vidas y score.

6. Implementar control de paddle: mouse (movimiento horizontal) y teclado (flechas ←/→) actualizando `paddle.x`.

7. Implementar `update()` con movimiento de pelota (`ball.x += ball.vx`, `ball.y += ball.vy`), rebote en paredes (invertir vx/vy según corresponda), y pérdida de vida si `ball.y > 600`.

8. Implementar colisión pelota-paddle: si la pelota intersecta el paddle, invertir `ball.vy`.

9. Implementar colisión pelota-bloques: recorrer `blocks`, detectar intersección, marcar `alive = false`, sumar 10 puntos, invertir `ball.vy`.

10. Implementar lógica de estados: `playing` (juego normal), `lifelost` (pelota perdida, overlay "Vidas restantes: N — Presiona ESPACIO"), `gameover` (0 vidas, overlay "GAME OVER" semitransparente, ESPACIO para reiniciar), `victory` (sin bloques vivos, overlay "¡GANASTE!", ESPACIO para reiniciar).

11. Implementar reinicio al presionar ESPACIO en estado `gameover` o `victory`: resetear todo a valores iniciales.

## Acceptance criteria

- [x] El canvas de 800×600 se renderiza centrado sin errores en consola.
- [x] El paddle sigue el movimiento del mouse y las flechas ←/→ simultáneamente.
- [x] Al presionar ESPACIO la pelota sale del paddle y se mueve a velocidad constante.
- [x] La pelota rebota en paredes izquierda, derecha y techo.
- [x] La pelota rebota al golpear el paddle (inversión de vy).
- [x] La pelota rebota al golpear un ladrillo (inversión de vx/vy según corresponda).
- [x] Al romper un ladrillo: desaparece y el score aumenta en +10.
- [x] Si la pelota cae al fondo: se resta 1 vida y aparece overlay pidiendo ESPACIO para continuar.
- [x] Al llegar a 0 vidas: aparece overlay "GAME OVER". ESPACIO reinicia la partida.
- [x] Al romper todos los ladrillos: aparece overlay "¡GANASTE!". ESPACIO reinicia la partida.
- [x] El overlay siempre muestra vidas restantes y puntaje actual.

## Decisions

- **Sí:** Todo el JS en `index.html` (sin archivos separados). MVP no justifica dividir.
- **Sí:** Paddle, pelota y bloques dibujados con primitivas Canvas (rectángulos/círculos). Sin sprites.
- **Sí:** Spritesheet cargado vía `loadSpritesheet()` para mantener compatibilidad con expansiones futuras.
- **Sí:** Parrilla 10×6, un color por fila. Clásico Arkanoid.
- **Sí:** Rebote simple (inversión de vy en paddle, vy/vx en bloques). Sin física de ángulo.
- **Sí:** Velocidad de pelota constante. Sin aceleración.
- **Sí:** Mouse + teclado simultáneo para paddle.
- **No:** Sonidos. Se añadirán en otro spec.
- **No:** Explosiones animadas con spritesheet. Se añadirán en otro spec.
- **No:** Pantalla de título o menú. Solo overlay in-game.
- **Sí:** Un solo nivel para el MVP.

## What is **not** in this spec

- Múltiples niveles.
- Power-ups.
- Pantalla de título o menú principal.
- High scores persistentes.
- Bloques especiales (varios golpes, indestructibles, etc.).
- Física de ángulo en el paddle.
- Sonidos.
- Explosiones animadas.

Cada uno de estos, si llega, va en su propio spec.
