# Arkanoid

Juego de Arkanoid clásico hecho con HTML, CSS y JavaScript vanilla — cero dependencias, cero build tools.

## Cómo jugar

Abrí `index.html` en cualquier navegador moderno.

| Control | Acción |
|---|---|
| ← → / Mouse | Mover paddle |
| Espacio / Clic izq. | Sacar pelota |
| P / Esc / Clic der. | Pausa |
| Clic en nivel | Seleccionar nivel (título / pausa) |
| Clic (game over / victoria) | Reiniciar |

## Características

- 5 niveles con diseños distintos (Clásico, Pirámide, Ajedrez, Huecos, Fortaleza)
- Velocidad de pelota progresiva por nivel
- Sprites desde spritesheet (paddle, bloques, animaciones de explosión)
- Efectos de sonido (rebote, rotura)
- Pantalla de título con selector de niveles
- Pausa con selector de niveles
- Transiciones entre niveles
- 3 vidas por partida

## Estructura del proyecto

| Archivo | Propósito |
|---|---|
| `index.html` | Punto de entrada — canvas 800×600, barra de controles |
| `game.js` | Toda la lógica del juego (loop, update, draw, input, estados) |
| `levels.js` | Definiciones de niveles y velocidades de pelota |
| `assets/spritesheet.js` | Spritesheet loader + API de dibujo |
| `assets/spritesheet-breakout.png` | Sprite atlas |
| `assets/sounds/ball-bounce.mp3` | SFX rebote |
| `assets/sounds/break-sound.mp3` | SFX rotura de bloque |
| `specs/` | Documentos de diseño spec-driven |
| `AGENTS.md` | Configuración para opencode |

## Desarrollo

Este proyecto sigue un flujo **spec-driven**: las features se diseñan en `specs/` y se implementan con `spec-impl`. No hay build system, tests, linters ni bundlers.
