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

## Phase 2.5 — Skip Check (Consecutive Low-Yield Detection)

Before scanning, check the last 3 discovery reports for this pattern:
- Report shows "no issues" or only 0-1 issues created
- Most findings are "skipped (duplicate of #N)"

If the last 3 consecutive runs all had 0-1 new issues, report "skip: diminishing returns — last 3 runs produced 0-1 issues each. Stopping early to save tokens. Run a full scan manually when new features/commits are added." Then write the run log, update config `total_runs`, and stop.

This prevents wasted token spend when the codebase is in a stable, well-tracked state.

## Phase 3 — Multi-Angle Scan

Use `total_runs` modulo to rotate focus areas. Every run does a **baseline scan** of the most common patterns, then rotates deeper analysis:

| Run % 3 | Primary focus (deeper analysis) |
|---------|---------------------------------|
| 0 | Hardcoded strings / i18n gaps |
| 1 | Test coverage gaps |
| 2 | Code quality patterns |

Every run also performs these lighter scans:

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

### 3e. Deep Analysis (rotates with primary focus)

Use these deeper analysis techniques to find issues beyond surface pattern matching. Rotate one per run based on `total_runs % 5`:

| Run % 5 | Deep analysis |
|---------|--------------|
| 0 | **Sample program quality** — Read `.bas` files in `src/core/samples/programs/`, evaluate whether they effectively demonstrate their target F-BASIC feature. Check: PAUSE/timing durations (too short to perceive?), visual output clarity, user feedback, completeness of use cases, educational value. Focus on samples visible in the SampleSelector. |
| 1 | **Edge case coverage** — Check if recent code changes handle boundary conditions (empty arrays, undefined values, max buffer sizes, overflow in arithmetic) |
| 2 | **Cross-module consistency** — Verify that related modules agree on interfaces (e.g., executor expectations match device adapter capabilities, parser output matches executor input shapes) |
| 3 | **Enrich existing issues** — Review the top 3 open issues and check if recent commits have partially addressed them. Add progress comments or close if resolved. |
| 4 | **UX quality review** — Scan Vue components and composables for usability issues that static analysis misses: confusing flows, missing loading states, poor error messages, inconsistent behavior, unclear labels, inaccessible features |

**Agent verification requirements**: When using deep analysis agents, instruct them to: (1) read actual file content before making claims, (2) distinguish concrete user-facing problems from subjective quality opinions, (3) cross-reference existing open issues before proposing new findings.

### 3f. Existing Issue Cross-Reference

Before proposing any new issue, always check the existing open issues list:
```bash
gh issue list --state open --json number,title --limit 50
```

Check if the same problem is already tracked. If so, skip or add a comment to the existing issue instead.

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

Print summary to user with created issue links. When outputting messages (especially in loop contexts), prefix with Asia/Shanghai timestamp:
```
[YYYY-MM-DD HH:MM:SS CST] <message>
```

## Phase 6 — Self-Improvement

Follow `_shared/self-improvement-protocol.md`.

Focus on:
- Were scans finding real issues or false positives?
- Were there areas we missed that should be added?
- Was the rotation focus effective or should it change?
- Did we create good issue titles and bodies?
