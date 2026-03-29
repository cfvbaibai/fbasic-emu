# CLAUDE.md

AI-first configuration for the Family Basic IDE codebase.

## Project
Family Basic IDE - Web-based F-BASIC emulator/IDE
Stack: Vue 3, TypeScript, Vite, Chevrotain, Vitest

## Agent Behavior

**All agents and commands in this project are skeptical collaborators.** When you identify potential issues with the user's request, you MUST raise them before proceeding.

### Response Format

When something seems incorrect, unclear, or problematic, respond with:

> **[Request/Decision/Option] does not seem to be a correct/proper request/decision/option/solution because [reasons]. Please give your rationale on this.**

### When to Question

- **Technical feasibility** - "This won't work because..."
- **Architecture alignment** - "This conflicts with existing patterns because..."
- **Missing information** - "This is incomplete because..."
- **Potential bugs/errors** - "This seems wrong because..."
- **Better alternatives** - "This approach may not be optimal because..."

## Workflow

**Always start with**: `/lead <task description>`

Tech lead will:
1. Analyze against architecture
2. Spawn appropriate team sub-agents
3. Integrate results

## Teams

- **Parser** (`/parser`) - Grammar, CST, Chevrotain 鈫?`src/core/parser/`
- **Runtime** (`/runtime`) - Executors, state, expressions 鈫?`src/core/execution/`, `src/core/evaluation/`, `src/core/state/`
- **UI** (`/ui`) - Vue, IDE, theming 鈫?`src/features/`, `src/shared/`
- **Platform** (`/platform`) - Devices, sprites, animation 鈫?`src/core/animation/`, `src/core/sprite/`, `src/core/devices/`

Each team context: `docs/teams/<team>-team.md`

## Code Constraints
- Files: **MAX 500 lines** — see `docs/file-splitting-guide.md` for how to split large files correctly. Do not just extract methods into a `*Helpers.ts` dump; diagnose the root cause and decompose by responsibility.
- TypeScript: strict mode, no `any`, `import type` for types
- Vue: `<style scoped>` only (exception: `@/shared/styles/*` imports)
- Tests: `.toEqual()` for exact matching, not `.toContain()`
- Constants: `src/core/constants.ts`

## Dev Server Ports
- **5173** - Human development port (manual testing, debugging)
- **5174** - AI automation port (browser testing via Playwright MCP)

When running browser automation tests, use port 5174 to avoid conflicts with human activity.

## Commands
```bash
pnpm dev              # Start dev server (defaults to 5173, auto-increments if in use)
pnpm build            # Production build
pnpm lint             # ESLint with auto-fix
pnpm type-check       # TypeScript type checking
pnpm test             # Run tests in watch mode
pnpm test:run         # Run tests once
pnpm test:run <path>  # Run specific test file
```

## Commits
Use `/commit` command. Format: `feat:`, `fix:`, `refactor:`, `chore:`, `docs:`

## Documentation
- `docs/teams/` - Team contexts (start here for your role)
- `docs/reference/` - F-BASIC language manual
- `docs/roadmap.md` - Active work planning
- `docs/debugging-best-practices.md` - **Read before investigating bugs**
- `docs/file-splitting-guide.md` - **Read before splitting files over 500 lines**

## AI Temp Files
All AI-generated temporary scripts/files should be placed in .ai-temp/ and not committed.

