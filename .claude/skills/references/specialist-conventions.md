# Specialist Conventions

Shared working approach and constraints for all F-BASIC IDE specialists.

## Working Approach

Build expertise through doing, not just reading reference docs.

1. **Explore first** — Read relevant files in the domain
2. **Find patterns** — Look at similar existing implementations
3. **Implement** — Apply the patterns found
4. **Test** — Run tests to validate
5. **Document** — Leave integration notes for dependent specialists

## Code Constraints

| Constraint | Value |
|------------|-------|
| File size limit | MAX 500 lines |
| TypeScript mode | strict, no `any` |
| Import types | `import type` for type-only imports |
| Test assertions | `.toEqual()` for exact matching |
| Constants location | `src/core/constants.ts` |

## Testing

Run tests after every change:

```bash
pnpm test:run <domain-specific-path>
```

Use `pnpm test:run` (no path) to run the full suite when changes may affect other domains.

## File Splitting

When a file approaches 500 lines, see `docs/file-splitting-guide.md` before splitting. Diagnose the root cause and decompose by responsibility — do not just extract methods into a helpers file.
