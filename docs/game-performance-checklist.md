# Game Engine Performance Checklist

Reusable checklist for auditing and optimizing Canvas 2D game engines in Arcade Vault.
Based on optimizations applied to `flappy-pixel` (SPEC 12).

---

## Rendering

- [ ] **Batch `fillStyle` changes** — Group draw calls by fill color. Draw all shapes with the same color first, then switch once. Each `fillStyle` assignment may trigger internal renderer sync.
  - _Example:_ Draw all pipe bodies (color A), then all pipe caps (color B) — 2 changes total instead of 2×N.
- [ ] **Avoid redundant `fillRect` on full canvas** — If you fill the entire canvas and then draw over it, consider `clearRect()` first for semantic clarity.
- [ ] **Cache static canvas properties** — `ctx.font`, `ctx.textAlign`, `ctx.lineWidth`, `ctx.lineCap` do not change per frame. Set them once in the constructor or `init()`.
- [ ] **Minimize text rendering calls** — `fillText` is expensive (involves glyph rasterization). Cache font settings and only re-render text when the value changes.

## State Management

- [ ] **No duplicate state flags** — If a boolean (`gameOver`) duplicates an enum (`state === 'gameover'`), remove the boolean. Two sources of truth for the same state is an anti-pattern that risks desynchronization.
- [ ] **Guard game-over conditions once** — Use a single check (`state === 'gameover'`) in `flap()`, `endGame()`, and the game loop. Avoid scattered boolean checks.

## Memory

- [ ] **No allocations in hot paths** — Avoid creating objects, arrays, or closures inside `update()` or `render()`. Pre-allocate and reuse.
- [ ] **Filter vs. splice for array cleanup** — `Array.filter()` creates a new array each frame. For small arrays (< 20 items), this is acceptable. For larger arrays, consider in-place removal or pooling.

## Canvas API Best Practices

- [ ] **Prefer `fillRect` over `strokeRect` for filled shapes** — Avoid unnecessary stroke calculations.
- [ ] **Batch draw calls by type** — Draw all rectangles, then all arcs, then all paths. Canvas internal state switches between draw types.
- [ ] **Avoid `getImageData` / `putImageData` in hot paths** — These are among the slowest Canvas operations. Use only for post-processing effects.

## Palette / Skin Caching

- [ ] **Cache palette lookups** — If colors come from a `React.Ref`, do not read `.current` every frame. Cache the result and invalidate only when the ref object itself changes.
- [ ] **Dirty flag for expensive computations** — If a value depends on external state that changes rarely, use a flag to recompute only when needed.

## Game Loop

- [ ] **Fixed timestep** — Use a fixed `dt` accumulator pattern to ensure deterministic physics regardless of frame rate.
- [ ] **Cap delta time** — Prevent spiral of death by clamping `delta` to a max value (e.g., `MAX_DT = 50ms`).
- [ ] **Cancel RAF on destroy/end** — Always `cancelAnimationFrame` in `destroy()`, `endGame()`, and `reset()` to prevent leaked loops.

## What NOT to optimize (premature)

- Object pooling for < 20 active entities
- Offscreen canvas for simple shapes (rectangles, circles)
- Dirty rectangle rendering on small canvases (< 500×500)
- Spatial partitioning for < 50 collision checks per frame

---

_Last updated: 2026-09-10 — SPEC 12 (flappy-pixel performance audit)_
