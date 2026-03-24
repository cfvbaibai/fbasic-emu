# Discover Issues

Scan the codebase for problems and create GitHub issues. Follows expanded scope: hardcoded strings, code quality, test gaps, recent commit analysis, and cross-reference with existing issues.

## References

- Prerequisites & config: `_shared/automation-conventions.md`
- Paths: `_shared/path-conventions.md`
- GitHub ops: `_shared/github-operations.md`
- Self-improvement: `_shared/self-improvement-protocol.md`

## Phase 1 — Prerequisites

Follow `_shared/automation-conventions.md` prerequisites. Sync with origin:

```bash
git fetch origin master
```

Read config from `~/.claude/automations/fbasic-ide/config.md` to get `total_runs` for rotation logic.

## Phase 2 — Open Issue Cap

Follow `_shared/github-operations.md` open issue cap logic. Threshold: 20.

If cap reached, write run log and report noting "cap reached", update config `total_runs`, and stop.

## Phase 3 — Multi-Angle Scan

Use `total_runs` modulo to rotate focus areas. Every run does a **baseline scan** of common patterns, then rotates deeper analysis:

| Run % 5 | Primary focus (deeper analysis) |
|---------|---------------------------------|
| 0 | Hardcoded strings / i18n gaps |
| 1 | Test coverage gaps |
| 2 | Code quality patterns |
| 3 | Accessibility (a11y) audit |
| 4 | Type safety & error handling |

Every run performs these baseline scans (lighter):

### 3a. Hardcoded Strings / i18n Gaps

Search Vue SFC templates (`src/features/`) and composables for:
- String literals in templates not wrapped in `$t()` or `t()`
- Hardcoded English in `placeholder`, `title`, `aria-label`, `aria-description` attributes
- String literals in `alert()`, `confirm()`, `console.warn()` calls in Vue files

Cross-reference existing open issues to avoid duplicates. Check if the file already has i18n imports — if not, it's a stronger signal.

### 3b. Code Quality Patterns

Search for:
- `TODO`, `FIXME`, `HACK` comments that aren't tracked as issues
- `console.log()` calls in non-test files (not `console.warn`/`console.error`)
- TypeScript `any` type usage
- Files approaching the 500-line limit (CLAUDE.md constraint)

### 3c. Test Coverage Gaps

For `src/core/` modules (parser, execution, evaluation, state, animation, sprite, devices, sound):
- List source files that lack corresponding test files in `test/`
- Prioritize: executor files, parser files, device adapters

### 3d. Recent Commit Analysis

Check the last 20 commits on `origin/master` for:
- Commit messages containing "workaround", "temporary", "hack", "fix later", "should refactor"
- Large files that grew past the 500-line threshold
- New components added without corresponding tests

```bash
git log origin/master --oneline -20
git diff origin/master~20..origin/master --stat
```

### 3e. Accessibility (a11y) Baseline

Search Vue SFCs for common a11y issues:
- Icon-only `<button>` elements (no text content) missing `aria-label` or `aria-labelledby`
- `<input>`, `<select>`, `<textarea>` without associated `<label>`, `aria-label`, or `aria-labelledby`
- `<img>` elements without `alt` attribute
- Clickable `<div>` or `<span>` elements with `@click` but without `role="button"` and keyboard handler (`@keydown.enter`)

**Important**: Buttons with icon components (e.g., `<GameIcon>`) as their only content are icon-only buttons and need `aria-label`. Use context + grep to verify — don't flag buttons that contain visible text.

### 3f. Type Safety Baseline

Search for type escape hatches:
- `as any` type assertions
- `// @ts-ignore` or `// @ts-expect-error` comments
- Excessive non-null assertions (`!.`) in a single file (more than 3 occurrences)

### 3g. Error Handling Baseline

Search for fragile error handling:
- Empty `catch {}` blocks or `catch (e) {}` where `e` is unused
- Promise chains with `.then()` but no `.catch()` or `.finally()` (in `src/`, not `node_modules`)

### 3h. Existing Issue Cross-Reference

Before proposing any new issue:
```bash
gh issue list --state open --json number,title --limit 50
```

Check if the same problem is already tracked. If so, skip or add a comment to the existing issue instead.

### 3i. Sample Program Review

Review FBASIC sample programs in `src/core/samples/programs/` for issues that would prevent them from running or reduce their educational value.

**Baseline (every run):**

1. **REPL-only commands** — grep for commands that produce runtime errors in the web IDE. Source of truth: `REPL_ONLY_COMMANDS` and `REPL_ONLY_FUNCTIONS` in `src/core/parser/parse-with-chevrotain.ts`.
   ```bash
   grep -rn "\bLIST\b\|\bNEW\b\|\bRUN\b\|\bSAVE\b\|\bLOAD\b\|\bKEY\b\|\bKEYLIST\b\|\bCONT\b\|\bSYSTEM\b\|\bPOKE\b\|\bSTOP\b\|\bPEEK\b\|\bFRE\b" src/core/samples/programs/ --include="*.bas" | grep -v "\bREM\b"
   ```
   Note: FBASIC lines start with line numbers (e.g. `10 LIST`), so match word boundaries not line start. Pipe through `grep -v "\bREM\b"` to exclude mentions inside REM comments. Be careful with short words like `NEW`, `RUN`, `KEY` — they may appear inside longer identifiers or strings; verify matches manually before flagging.
   REPL-only commands (will error at runtime):
   - `LIST`, `NEW`, `RUN` — IDE handles these via UI, not program statements
   - `SAVE`, `LOAD` — use Import/Export UI instead
   - `KEY`, `KEYLIST` — no key mapping UI in web IDE
   - `CONT` — requires STOP implementation
   - `SYSTEM` — no system exit in web IDE
   - `POKE` — no memory access in browser
   - `STOP` — not implemented
   - `PEEK`, `FRE` — REPL-only functions

2. **Missing documentation** — find samples without any `REM` comments:
   ```bash
   grep -rL "^REM\|REM " src/core/samples/programs/ --include="*.bas"
   ```
   Flag as a group (e.g., "33 of 52 samples lack documentation") rather than per-file. Only create an issue if a significant portion (>50%) lack comments.

**Deep review (when baseline flags issues or context allows):**

Read affected samples and check for:
- Syntax correctness against supported commands (wrong parameter counts, missing operands)
- Logic issues (unreachable code after `END`, infinite loops without exit condition)
- Programs using supported commands with wrong syntax (e.g., `DEF SPRITE` format errors, wrong `PLAY` string format)
- Comprehensive/ category programs that are complex (>30 lines) but have zero comments
- Samples that reference features not yet implemented (check executor code for TODOs or blocked logic)

### Rotation Deep Scans

The rotation area gets **deeper analysis** beyond the baseline:

**Deep: Hardcoded Strings / i18n gaps (rotation 0)**
- Audit all `src/features/**/*.vue` templates line-by-line for string literals
- Check composables for hardcoded strings passed to child components as props
- Verify locale files have translations for all keys referenced in code

**Deep: Test Coverage Gaps (rotation 1)**
- Group untested files by domain (parser, execution, animation, devices, sound, sprite)
- Identify which untested domains have the highest risk (most user-facing, most complex logic)
- Check if recently modified files have corresponding test updates
- Look for test files with only `.skip` or `.todo` tests

**Deep: Code Quality Patterns (rotation 2)**
- Identify files growing toward the 500-line limit (400+ lines) before they breach it
- Check for duplicated logic patterns across files (copy-paste candidates)
- Search for large functions (50+ lines) that could be extracted

**Deep: Accessibility (a11y) Audit (rotation 3)**
- Full keyboard navigation audit: interactive elements reachable via Tab, activated via Enter/Space
- Check that ARIA live regions (`aria-live`, `role="alert"`, `role="status"`) are used for dynamic content updates
- Verify focus management: modals trap focus, dialogs return focus on close
- Check color contrast indicators exist for the IDE's palette system
- Audit form validation: error messages associated with form fields via `aria-describedby`

**Deep: Type Safety & Error Handling (rotation 4)**
- Count `as` type assertions per file — files with many casts may need better types
- Search for `eslint-disable` comments that suppress type rules
- Check async functions for missing error boundaries (await without try/catch in critical paths)
- Look for `Promise<void>` return types where the caller might need to handle rejection
- Check for error state handling in Vue components (loading/error/success patterns)

## Phase 4 — Create Issues

For each confirmed finding:

1. Draft title in format: `<type>: <description>`
2. Write a clear body with context, affected files, and suggested approach
3. Assign priority label (most discovery findings are P3 unless they indicate user-facing breakage)
4. Create via `gh issue create` with labels: type + priority + `claude-automation`

**Constraints**:
- Max **3 issues per run** — prioritize by impact
- Skip findings that are too vague or speculative — only create actionable issues
- If no strong findings, report "no issues discovered" rather than creating noise

## Phase 5 — Report

Write outputs following `_shared/path-conventions.md`:

**Run log** — `~/.claude/automations/fbasic-ide/memory/runs/YYYY-MM/YYYY-MM-DD-NNN.md`

**Report** — `~/.claude/automations/fbasic-ide/reports/YYYY-MM/YYYY-MM-DD.md`:
```markdown
# Issue Discovery Report — YYYY-MM-DD

## Scan Results
- Focus area: <rotated area>
- Files scanned: <count>
- Findings: <count>

## Created Issues
- #N: [title](url) — <one-line summary>

## Skipped (duplicates or too vague)
- <finding> — reason: <duplicate of #N / too vague / not actionable>

## Key Findings
- <notable patterns discovered during scan>

## Notes
- <anything noteworthy about this run>
```

**Update config** — increment `total_runs`, `total_issues_discovered`.

Print summary to user with created issue links.

## Phase 6 — Self-Improvement

Follow `_shared/self-improvement-protocol.md`.

Focus on:
- Were scans finding real issues or false positives?
- Were there areas we missed that should be added?
- Was the rotation focus effective or should it change?
- Did we create good issue titles and bodies?
