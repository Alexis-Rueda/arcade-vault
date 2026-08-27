# Sugerencias de juegos — To-Do

> Mantenido por el agente `game-planner`. No editar manualmente sin avisar al agente.

## 🟡 Sugeridos (pendientes de decisión)

| ID                 | Título           | Categoría | Color   | Descripción breve                                                                      | Justificación                                                                                   | Fecha      |
| ------------------ | ---------------- | --------- | ------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ---------- |
| `flappy-pixel`     | FLAPPY PIXEL     | ARCADE    | yellow  | Salta entre tuberías con un toque. Muerte instantánea, reinicio inmediato.             | Mecánica "un-boton" inexistente en catálogo. Máximo engagement con mínimo código (~150 líneas). | 2026-08-26 |
| `puzzle-2048`      | PUZZLE 2048      | PUZZLE    | orange  | Desliza y combina números hasta llegar a 2048.                                         | PUZZLE solo tiene tetris; mecánica deslizar/combinar es nueva y adictiva.                       | 2026-08-26 |
| `checkers`         | DAMAS            | VERSUS    | red     | Tablero 8x8, salta y captura piezas rivales. 1v1 local o vs CPU.                       | VERSUS sin implementación real; único juego de tablero estratégico.                             | 2026-08-26 |
| `tank-battle`      | TANK BATTLE      | VERSUS    | red     | Tanques 1v1 top-down, movimiento libre + dirección de tiro + obstáculos destructibles. | Mayor score (24/25). VERSUS casi vacío, mecánica simple pero profunda.                          | 2026-08-27 |
| `minesweeper`      | MINESWEEPER      | PUZZLE    | orange  | Grilla de celdas, revela números para evitar minas. Banderas para marcar.              | Primera mecánica de deducción lógica. Cero física, trivial de implementar.                      | 2026-08-27 |
| `maze-chaser`      | MAZE CHASER      | ARCADE    | green   | Grilla con laberinto, persigue fantasmas, power-ups temporales invierten roles.        | Maze-chase ausente. IA por estados, score por racha de fantasmas comidos.                       | 2026-08-27 |
| `memory-match`     | MEMORY MATCH     | PUZZLE    | orange  | Grid de cartas boca abajo, flip para encontrar parejas. Modo contrarreloj.             | Accesible universal, estética retro. Primera mecánica de memoria en PUZZLE.                     | 2026-08-27 |
| `endless-runner`   | ENDLESS RUNNER   | ARCADE    | green   | Scroll horizontal infinito, esquivar obstáculos, power-ups. Distancia = score.         | Máximo "una partida más". Reinicio instantáneo, ~200 líneas.                                    | 2026-08-27 |
| `platformer-pixel` | PLATFORMER PIXEL | ARCADE    | green   | Niveles progresivos con salto, gravedad, monedas, enemigos. Tilemap-based.             | Género plataformas completamente ausente. Canvas-fit perfecto con sprites.                      | 2026-08-27 |
| `memori`           | MEMORI           | PUZZLE    | orange  | Variante de memoria con estética neón y glow sobre fondo oscuro.                       | Variante visual de memory-match. Twist estético en mecánica existente.                          | 2026-08-27 |
| `missile-command`  | MISSILE COMMAND  | SHOOTER   | red     | Protege ciudades de misiles entrantes. Primer shooter defensivo.                       | Mecánica inversa a todos los shooters actuales. Dificultad progresiva brutal.                   | 2026-08-27 |
| `space-divider`    | SPACE DIVIDER    | SHOOTER   | cyan    | Shoot-em-up vertical estilo Galaga. Oleadas + power-ups de disparo.                    | Añade variación dentro de SHOOTER sin solaparse con asteroides.                                 | 2026-08-27 |
| `shmup-galaga`     | SHMUP GALAGA     | SHOOTER   | cyan    | Hordas de enemigos con patrones, formaciones, bullet-hell lite.                        | Patrón clásico probado, muchos objetos en canvas. Engagement con power-ups.                     | 2026-08-27 |
| `quick-tap`        | QUICK TAP        | ARCADE    | yellow  | Aparece símbolo → toca antes de que expire. Timing puro, ~150 líneas.                  | Reflejos puros, género ausente. Extremadamente simple de implementar.                           | 2026-08-27 |
| `hex-fall`         | HEX FALL         | PUZZLE    | magenta | Grid hexagonal, match-3 por colores adyacentes con cascada.                            | Grid hexagonal es visualmente distinto a todo lo cuadrado existente.                            | 2026-08-27 |
| `match-3-gems`     | MATCH-3 GEMS     | PUZZLE    | orange  | Deslizar y combinar gemas en grilla. Combos encadenados + power-ups.                   | Mecánica deslizar/combinar ausente en PUZZLE. Adictivo con cascadas.                            | 2026-08-27 |
| `button-brawl`     | BUTTON BRAWL     | VERSUS    | red     | Combate 1v1 con ataque, bloqueo y habilidad especial. Best of 3.                       | Amplía VERSUS más allá de Pong. Complejidad media-alta de implementar.                          | 2026-08-27 |
| `battle-tanks`     | BATTLE TANKS     | VERSUS    | red     | Tanques 1v1, round-based, arena con obstáculos destructibles.                          | Variante de tank-battle. Visualmente fresco con estilo neon.                                    | 2026-08-27 |
| `drift-chaser`     | DRIFT CHASER     | ARCADE    | green   | Racing/supervivencia con física de drift. Distancia recorrida = score.                 | Género racing ausente. Física puede ser difícil de pulir.                                       | 2026-08-27 |

## 🟢 Aceptados / en desarrollo

| ID  | Título | Spec | Fecha aceptado |
| --- | ------ | ---- | -------------- |

## ✅ Implementados

| ID           | Título     | Categoría | Fecha |
| ------------ | ---------- | --------- | ----- |
| `asteroides` | ASTEROIDES | SHOOTER   | —     |
| `tetris`     | TETRIS     | PUZZLE    | —     |
| `arkanoid`   | ARKANOID   | ARCADE    | —     |
| `snake`      | SNAKE      | ARCADE    | —     |

## ❌ Descartados

| ID  | Título | Motivo | Fecha |
| --- | ------ | ------ | ----- |
