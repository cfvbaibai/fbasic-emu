---
name: ide
description: IDE Dev for Family Basic IDE. Deep specialist in the main IDE interface, code editor, console, and shared UI components. Owns src/features/ide/, src/features/home/, src/features/monaco-editor/, and src/shared/. Use when: (1) IDE components and layout, (2) Code editor (Monaco), (3) Console/output display, (4) Shared UI components, (5) Theme system, (6) Web worker communication from main thread. Invoke via /ide command.
---

# IDE Dev

Specialist for the main IDE interface — components, editor, console, and shared UI.

See [specialist-conventions.md](../references/specialist-conventions.md) for shared working approach, code constraints, and testing conventions.

## Domain

- `src/features/ide/` — Main IDE components and composables
- `src/features/home/` — Home page
- `src/features/monaco-editor/` — Monaco editor wrapper
- `src/shared/components/` — Reusable UI components
- `src/shared/styles/` — Theme system

## Files

| Directory | Purpose |
|-----------|---------|
| `src/features/ide/components/` | IDE-specific components |
| `src/features/ide/composables/` | Web worker utils, message handlers |
| `src/features/monaco-editor/` | Code editor |
| `src/shared/components/ui/` | Reusable Game* components |
| `src/shared/styles/theme.css` | Theme CSS variables |

## Key Patterns

### Worker Communication
- `useBasicIdeWebWorkerUtils.ts` — Send messages to worker
- `useBasicIdeMessageHandlers.ts` — Handle messages from worker

### Theme System
- Three-layer: Base → Game (PREFERRED) → Semantic
- Always use `--game-*` CSS variables
- Never hardcode colors

### Component Pattern
```vue
<script setup lang="ts">
// 1. Type imports
// 2. Value imports
// 3. Props/Emits
// 4. Composables
// 5. State
// 6. Computed
// 7. Methods
</script>

<template>...</template>

<style scoped>
/* Use CSS variables */
</style>
```

## Common Tasks

### Add IDE Feature

1. Read similar existing components in `ide/components/`
2. Create component following same patterns
3. Use theme CSS variables
4. Add to BasicIde.vue if needed
5. Add tests

### Add Message Handler

1. Read `useBasicIdeMessageHandlers.ts` for patterns
2. Add handler following the same pattern
3. Update types if needed

### Update Theme

1. Edit `src/shared/styles/theme.css`
2. Update both dark and light themes
3. Use CSS variables in components

## Integration

**From Device Dev**: They define message types to handle.
**From Graphics Dev**: They define SharedBuffer layout to read.
**To Runtime Dev**: User actions trigger via worker messages.

## Domain-Specific Constraints

- Vue: `<style scoped>` only (exception: `@/shared/styles/*` imports)
- Styling: CSS variables only, no hardcoded colors
