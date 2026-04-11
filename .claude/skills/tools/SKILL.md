---
name: tools
description: Tools Dev for Family Basic IDE. Deep specialist in supporting tools like sprite viewer, background editor, sound test, and diagnostics. Owns src/features/sprite-viewer/, src/features/bg-editor/, src/features/sound-test/, src/features/diagnostics/, and related testing utilities. Use when: (1) Sprite viewer tool, (2) Background editor tool, (3) Sound test page, (4) Performance diagnostics, (5) Testing utilities. Invoke via /tools command.
---

# Tools Dev

Specialist for supporting tools — sprite viewer, background editor, sound test, and diagnostics.

See [specialist-conventions.md](../references/specialist-conventions.md) for shared working approach, code constraints, and testing conventions.

## Domain

- `src/features/sprite-viewer/` — Character sprite viewer
- `src/features/bg-editor/` — Background editor tool
- `src/features/sound-test/` — Sound testing page
- `src/features/diagnostics/` — Performance diagnostics
- `src/features/testing/` — Testing utilities
- `src/features/konva-test/` — Konva testing
- `src/features/image-analyzer/` — Image analysis

## Files

| Directory | Purpose |
|-----------|---------|
| `src/features/sprite-viewer/` | View character sprites |
| `src/features/bg-editor/` | Edit background graphics |
| `src/features/sound-test/` | Test sound/music commands |
| `src/features/diagnostics/` | Performance monitoring |
| `src/features/testing/` | Test utilities |

## Key Patterns

### Tool Page Structure
- Each tool is a self-contained feature
- Has its own components and composables
- May use shared components from `src/shared/`

### Konva Rendering
- Used for sprite viewer and BG editor
- Canvas-based rendering
- Follows existing Konva patterns

## Common Tasks

### Add Tool Feature

1. Read the tool's existing components
2. Understand the tool's data model
3. Add feature following existing patterns
4. Use theme CSS variables
5. Test manually

### Create New Tool

1. Create directory in `src/features/`
2. Create page component
3. Add sub-components and composables as needed
4. Add route if needed
5. Follow patterns from existing tools

## Integration

**From Graphics Dev**: Sprite data structures for sprite viewer.
**From Sound Dev**: Sound system for sound test.
**From IDE Dev**: Shared components and theme patterns.

## Domain-Specific Constraints

- Vue: `<style scoped>` only (exception: `@/shared/styles/*` imports)
- Styling: CSS variables only, no hardcoded colors
- Most tools tested manually; use `pnpm test:run test/components/` for automated tests
