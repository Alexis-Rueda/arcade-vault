---
name: spec-impl-game
description: Implements an approved game spec (Phases 1–4 identical to /spec-impl), then sequentially runs @skin-designer and @mobile-porter on the resulting game to close the full implementation cycle.
disable-model-invocation: true
argument-hint: <NN-spec-name>
allowed-tools:
  - Bash(git status:*)
  - Bash(git branch:*)
  - Bash(git checkout:*)
  - Bash(cat:*)
  - Bash(ls:*)
---

# /spec-impl-game — Game spec implementer with automatic skin + mobile post‑processing

## Session context

Current repository state:
!`git status --short`

Current branch:
!`git branch --show-current`

Specs available in this folder:
!`ls specs/ 2>/dev/null || echo "The specs/ folder does not exist"`

---

## Instructions

Follow these five phases in strict order. **Do not advance to the next phase if the previous one did not complete correctly.**

### Phase 1 — Identify the spec

The received argument is: `$ARGUMENTS`

If `$ARGUMENTS` is empty:

- List the files available in `specs/` (you already have them above).
- Ask the user to specify the exact name of the spec.
- Stop and wait for an answer. Do not continue.

If `$ARGUMENTS` has a value:

- Look for the file in `specs/`. Accept full name (`07-snake`), number only (`07`), or slug only (`snake`).
- If not found, show the available specs and ask the user to correct the name.
- If found, continue to Phase 2.

### Phase 2 — Validate the spec's state

Read the spec file:
!`cat specs/$ARGUMENTS.md 2>/dev/null || echo "FILE_NOT_FOUND"`

Search for a line indicating the spec state (e.g., `**Status:**` or `**Estado:**`). Accept any language. The state must mean **Approved**. Recognised equivalents:

- English: `Approved`
- Spanish: `Aprobado`
- Portuguese: `Aprovado`
- French: `Approuvé`
- German: `Genehmigt`
- Italian: `Approvato`

Any other state (Draft, In review, Implemented, Obsolete, missing) stops execution. Show this error message:

```
❌ I cannot implement this spec.

Current state: [STATE FOUND]
I only work with specs whose state means "Approved" (e.g. `Approved`, `Aprobado`, …).

To continue you have two options:
  1. Change the state to "Approved" manually.
  2. Use /spec [name] to resume editing.
```

### Phase 3 — Create the git branch, switch to it, and resolve the game‑id

1. Derive branch name `spec‑NN‑slug` from the spec filename (without extension).
2. If branch does not exist, create with `git checkout -b spec‑NN‑slug`; otherwise inform the user and still `git checkout spec‑NN‑slug`.
3. Show a confirmation block:

```
✅ Ready to implement.

Spec:   specs/NN‑slug.md
Branch: spec‑NN‑slug (active)
State:  Approved
```

4. Resolve game‑id from the slug (e.g., `snake` from `07‑snake`). Verify a file exists at `components/games/<Slug>Game.tsx` (case‑insensitive). If not found, stop and ask the user to confirm the game‑id.
5. Show spec summary (objective, scope, implementation plan, acceptance criteria) by extracting the relevant sections regardless of language.

### Phase 4 — Implement step by step

Prompt the user:

```
I am going to implement the spec following the implementation plan exactly.
I will pause after each step so you can review the diff.
Shall we start with Step 1?
```

Wait for affirmative confirmation.
Implement one step, show touched files, then ask to continue to the next step. If ambiguity appears, stop, present options, and wait for user decision.
When all steps are done, show:

```
✅ All steps of the plan are implemented.

Next: verify acceptance criteria, update spec state to "Implemented", final commit before merge.

Now proceeding to Phase 5 — automatic post‑processing.
```

### Phase 5 — Sequential post‑processing: skin‑designer → mobile‑porter

Announce start:

```
🎨 Encadenando agentes post‑implementación para el juego "<game-id>".

Paso 1 de 2: lanzando @skin-designer …
```

**Step 1 – skin‑designer** (foreground, wait):
Run agent `@skin-designer` with prompt:

```
Aplica los 3 skins canónicos (classic, retro, neon) al juego "<game-id>" siguiendo el patrón de TetrisGame. Lee references/game-with-themes.md antes de actuar y actualízalo al terminar.
```

Wait for result, then show brief summary. If error, ask user whether to continue to mobile‑porter.

**Step 2 – mobile‑porter** (foreground, wait):
Run agent `@mobile-porter` with prompt:

```
Porta el juego "<game-id>" a mobile aplicando el patrón de la spec 10: cable <MobileGamepad> en app/games/<game-id>/play/page.tsx sin tocar el componente canvas.
```

Wait for result, show brief summary.

Final message:

```
✅ Implementación + skins + mobile completados para "<game-id>".

Próximos pasos manuales:
  1. Verificar los acceptance criteria del spec.
  2. Probar los 3 skins en /games/<game-id>/play.
  3. Probar controles táctiles en viewport mobile.
  4. Marcar el spec como "Implemented" y commitear el resultado final.
```

---

**Critical execution rule:** Phase 5 must be performed with two separate tool‑call turns; the second agent is only invoked after the first agent’s result is received.

---
