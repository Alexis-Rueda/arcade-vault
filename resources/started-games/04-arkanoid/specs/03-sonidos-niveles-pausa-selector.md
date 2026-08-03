# SPEC 03 — Sonidos, niveles, pausa y selector de niveles

> **Estado:** Implemented
> **Depende de:** SPEC 01, SPEC 02
> **Fecha:** 2026-07-20
> **Objetivo:** Agregar sonidos de rebote y destrucción desde los assets existentes, implementar 5 niveles con patrones de bloques variados, velocidad de pelota progresiva (+10% por nivel) con tope máximo, sistema de pausa con tecla P, selector de niveles accesible desde inicio y pausa, y HUD de controles en pantalla.

## Scope

**Incluye:**

- Sonido `ball-bounce.mp3` en cada rebote (paddle, paredes, bloques).
- Sonido `break-sound.mp3` al destruir cada bloque.
- 5 niveles con patrones de bloques variados (pirámide, tablero de ajedrez, filas con huecos, etc.) definidos como arrays 2D hardcodeados en JSON.
- Velocidad de pelota base (nivel 1) = 3px/frame, +10% por nivel, con tope en 5px/frame.
- Parrilla de tamaño variable según nivel (no fija a 10×6).
- Transición automática entre niveles: mantiene puntaje, vidas y estado de la pelota.
- Overlay de transición tipo "¡Nivel X!".
- Pausa con tecla P: congela todo (pelota, explosiones).
- Selector de niveles como lista en overlay al iniciar y al pausar.
- HUD que muestra teclas y acciones (controles visibles en pantalla).
- Reinicio de partida tras gameover/victoria vuelve al selector de niveles.

**No incluye (futuros specs):**

- Sonidos adicionales (música de fondo, perder vida, victoria).
- Más de 5 niveles.
- Power-ups.
- Pantalla de título con animaciones.
- High scores persistentes.

## Data model

```js
// Definiciones de niveles
const LEVELS = [
  {
    name: 'Clásico',
    cols: 10, rows: 6,
    grid: [
      [1,1,1,1,1,1,1,1,1,1],
      [2,2,2,2,2,2,2,2,2,2],
      [3,3,3,3,3,3,3,3,3,3],
      [4,4,4,4,4,4,4,4,4,4],
      [5,5,5,5,5,5,5,5,5,5],
      [6,6,6,6,6,6,6,6,6,6],
    ]
  },
  // ... 5 niveles con patrones variados
];

// Velocidad por nivel
const BALL_SPEEDS = [3, 3.3, 3.63, 3.99, 4.39]; // +10% c/u, tope 5

// Game se amplía
const game = {
  score: 0, lives: 3,
  state: 'playing',     // 'playing' | 'lifelost' | 'gameover' | 'victory'
  screen: 'title',      // 'title' | 'playing' | 'paused' | 'transition'
  level: 0,             // índice del nivel actual
  levelsUnlocked: 1,    // niveles desbloqueados (1 = solo nivel 1)
  paused: false,
};

// HUD de controles
const CONTROLS_HUD = [
  { key: '← → / Mouse', action: 'Mover paddle' },
  { key: 'Espacio',      action: 'Sacar / Reiniciar' },
  { key: 'P',            action: 'Pausa' },
];
```

Convenciones adicionales:
- `game.screen` controla qué se renderiza en canvas.
- `grid[row][col]`: 0 = sin bloque, 1-6 = color del bloque.
- Parrilla centrada horizontalmente en canvas 800×600.

## Implementation plan

1. **Agregar sonidos.** En `update()`, reproducir `ball-bounce.mp3` en rebotes y `break-sound.mp3` al destruir bloque con `new Audio('assets/sounds/...mp3').play()`.

2. **Definir `LEVELS` y `BALL_SPEEDS`.** Agregar arreglo global con 5 niveles (arrays 2D con patrones variados) y velocidades calculadas (+10% por nivel, tope 5).

3. **Refactorizar `initBlocks()`.** Aceptar parámetros `cols`, `rows`, `grid` del nivel actual. Layout dinámico y colores según valor en grid.

4. **Aplicar velocidad por nivel.** En inicio de nivel y re-saque, usar `BALL_SPEEDS[game.level]` para velocidad base de la pelota.

5. **Agregar `game.screen` y transición entre niveles.** Cuando bloques destruidos y explosiones terminen: overlay "¡Nivel X!" por ~2s, cargar siguiente nivel. Nivel 5 → victoria.

6. **Implementar pausa (tecla P).** Si `game.paused === true`, saltar `update()`. Alternar con tecla P.

7. **Implementar selector de niveles.** Lista en `game.screen === 'title'` y `'paused'`. Click para seleccionar. `game.levelsUnlocked` controla visibilidad.

8. **Agregar HUD de controles.** Tabla de teclas visible durante la partida.

9. **Reinicio vuelve al selector.** Gameover/victoria → Espacio lleva a `game.screen = 'title'`.

## Acceptance criteria

- [x] Al iniciar el juego, se muestra el selector de niveles (lista de 5, solo nivel 1 desbloqueable).
- [] Al hacer clic en un nivel bloqueado, no hace nada o muestra mensaje.
- [x] Al seleccionar un nivel, comienza la partida con ese nivel.
- [x] La pelota suena `ball-bounce.mp3` en cada rebote (paddle, pared, bloque).
- [x] Al destruir un bloque, suena `break-sound.mp3`.
- [x] Cada nivel tiene un patrón de bloques diferente.
- [x] Velocidad aumenta ~10% por nivel (3 → 3.3 → 3.63 → 3.99 → 4.39 px/frame). Tope 5.
- [x] Al completar un nivel, overlay "¡Nivel X!" por ~2s y avanza al siguiente manteniendo puntaje y vidas.
- [x] Al completar nivel 5, overlay "¡GANASTE!". Espacio vuelve al selector.
- [x] Al perder todas las vidas, overlay "GAME OVER". Espacio vuelve al selector.
- [x] Presionar P pausa el juego (todo congelado). Presionar P reanuda.
- [x] Durante pausa, se muestra selector de niveles. Al seleccionar uno, cambia a ese nivel.
- [x] Durante la partida se ven los controles en pantalla.

## Decisions

- **Sí:** Sonidos con `new Audio().play()` — mismo patrón de AGENTS.md, sin dependencias.
- **Sí:** Solo los 2 sonidos existentes. Perder vida/ganar sin sonido (requeriría assets nuevos).
- **Sí:** `LEVELS` como arreglo global de objetos con `grid` (array 2D). Reutiliza `initBlocks()`.
- **Sí:** Velocidad +10% por nivel con tope 5px/frame. Progresión predecible.
- **Sí:** Selector de niveles desde inicio Y pausa. Permite testing sin perder feature para el jugador.
- **Sí:** `game.screen` nuevo campo que controla render. Separa responsabilidades sin romper loop existente.
- **Sí:** Tecla P para pausa. Simple, sin conflicto con controles existentes.
- **Sí:** Este spec agrupa sonido, niveles, pausa y selector — idealmente 2-3 specs separados, pero el usuario prefirió uno solo.

## Risks

| Riesgo | Mitigación |
|---|---|
| Sonidos no cargan (archivo faltante o ruta rota) | `new Audio()` falla silenciosamente — el juego sigue sin sonido. |
| Nivel sin bloques (grid mal definido) | Validar en desarrollo que cada nivel tenga al menos un bloque vivo. |
| Pausa + selector congelan explosiones | `update()` no se ejecuta en pausa, explosiones se quedan donde están. |

## What is **not** in this spec

- Sonidos adicionales (música de fondo, perder vida, victoria).
- Más de 5 niveles.
- Power-ups.
- Pantalla de título animada.
- High scores persistentes.
- Edición visual de niveles.

Cada uno de estos, si llega, va en su propio spec.
