# Code Review Process

This document outlines the code review process for the F-BASIC IDE project, ensuring consistent quality, maintainability, and adherence to best practices.

## Overview

All code changes go through a structured review process involving specialized agents and automated checks.

## Review Workflow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Tech Lead (/lead)                                 │
│   Analyzes request → Identifies specialists → Coordinates review            │
└────────────────────────────────┬────────────────────────────────────────────┘
                                  │
                                  ▼
        ┌────────────────────────────────────────────────────────────┐
        │                     Specialists                              │
        │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
        │  │ Parser   │  │ Runtime  │  │   UI     │  │Platform │   │
        │  │  Dev     │  │   Dev    │  │   Dev   │  │   Dev   │   │
        │  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
        └─────────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                        ┌────────────────────┐
                        │  Automated Checks  │
                        │  ├───────────────┤
                        │  │ TypeScript    │
                        │  │ ESLint        │
                        │  │ Tests         │
                        │  └───────────────┘
                        └────────────────────┘
```

## Pre-Commit Checklist

Run `/pre-commit` before committing. This executes:

### Step 1: Get Changed Files
```bash
git diff --name-only master...HEAD  # Compare against master branch
git status --short                   # Fallback if on master/main
```

### Step 2: Load Required Skills

| File Pattern | Skills to Load |
|-------------|-----------------|
| ANY `.ts` or `.vue` file | `vue-best-practices`, `vueuse-functions` |
| `**/*.test.ts`, `**/*.spec.ts` | `vue-testing-best-practices` |
| `**/stores/**`, `**/*Store*.ts` | `vue-pinia-best-practices` |
| `**/router/**`, `**/*Router*.ts` | `vue-router-best-practices` |
| `**/composables/use*.ts` (new) | `create-adaptable-composable` |

### Step 3: Apply Skills and Review
For each loaded skill:
1. Read required references
2. Review matching changed files
3. Fix any issues found

### Step 4: Run Automated Checks
```bash
pnpm type-check    # TypeScript: vue-tsc --noEmit
pnpm lint           # ESLint with auto-fix
pnpm test:run        # Run test suite
```

## Code Constraints

All code must adhere to these constraints:

| Constraint | Requirement |
|------------|-------------|
| File Size | MAX 500 lines - extract to focused modules |
| TypeScript | Strict mode, no `any`, `import type` for types |
| Vue | `<style scoped>` only (exception: `@/shared/styles/*`) |
| Tests | `.toEqual()` for exact matching, not `.toContain()` |
| Constants | `src/core/constants.ts` |

## Commit Process

Use `/commit` to create commits with conventional commit format:

```
<type>: <description>

- Bullet point 1
- Bullet point 2

Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
```

### Commit Types
- `feat:` - New features
- `fix:` - Bug fixes
- `refactor:` - Code restructuring without changing functionality
- `chore:` - Maintenance, dependencies, data files
- `docs:` - Documentation updates

## Specialists

| Specialist | Domain | Directories | Invoke With |
|------------|--------|-------------|-------------|
| Parser Dev | Grammar, CST | `src/core/parser/` | `/parser` |
| Runtime Dev | Executors, evaluation, state | `src/core/execution/`, `src/core/evaluation/`, `src/core/state/` | `/runtime` |
| Sound Dev | Music DSL, sound state | `src/core/sound/` | `/sound` |
| Device Dev | Device adapters, interfaces | `src/core/devices/` | `/device` |
| Graphics Dev | Animation, sprites, buffers | `src/core/animation/`, `src/core/sprite/` | `/graphics` |
| IDE Dev | IDE interface, editor, console | `src/features/ide/`, `src/features/monaco-editor/`, `src/shared/` | `/ide` |
| Tools Dev | Sprite viewer, BG editor, etc. | `src/features/sprite-viewer/`, `src/features/bg-editor/`, etc. | `/tools` |

## Best Practices

### TypeScript
- Use strict mode with proper typing
- No `any` types - define proper interfaces
- Use `import type` for type-only imports

### Vue
- Composition API with `<script setup lang="ts">`
- Keep components focused - split when responsibilities grow
- Props down, events up for component communication
- Use `computed` for derived state
- Use watchers for side effects only

### Testing
- Write tests for executors and utility functions
- Use `.toEqual()` for exact matching
- Test edge cases and error conditions
- Keep tests focused and fast

## Quick Reference

- **Architecture**: `CLAUDE.md` - Project overview and constraints
- **Team Contexts**: `docs/teams/*.md` - Specialist documentation
- **F-BASIC Manual**: `docs/reference/family-basic-manual/` - Language reference
- **Debugging**: `docs/debugging-best-practices.md` - Debugging guide
- **GitHub PR Reviews**: `docs/github-pr-review-guide.md` - PR review workflow
