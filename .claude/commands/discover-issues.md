# Discover Issues

Scan the codebase for problems and create GitHub issues. Follows expanded scope: hardcoded strings, code quality, test gaps, recent commit analysis, and cross-reference with existing issues.

## References

- Prerequisites & config: `.claude/commands/_shared/automation-conventions.md`
- Paths: `.claude/commands/_shared/path-conventions.md`
- GitHub ops: `.claude/commands/_shared/github-operations.md`
- Self-improvement: `.claude/commands/_shared/self-improvement-protocol.md`

## Phase 1 — Prerequisites

Follow `.claude/commands/_shared/automation-conventions.md` prerequisites. Sync with origin:

```bash
git fetch origin master
```

Read config from `.automation/config.md` to get `total_runs` for rotation logic.

## Phase 2 — Open Issue Cap

Follow `.claude/commands/_shared/github-operations.md` open issue cap logic. Threshold: 20.

If cap reached, write run log and report noting "cap reached", update config `total_runs`, and stop.

## Phase 3 — Multi-Angle Scan

Use `total_runs` modulo to rotate focus areas. Every run does a **baseline scan** (3a–3d), then one **focus area** (3e) for deeper analysis.

Every run also performs these lighter baseline scans:

### 3a. Hardcoded Strings / i18n Gaps

Search Vue SFC templates (`src/features/`) and composables for:
- String literals in templates not wrapped in `$t()` or `t()`
- Hardcoded English in `placeholder`, `title`, `aria-label`, `aria-description` attributes
- String literals in `alert()`, `confirm()`, `console.warn()` calls in Vue files

**Exclude from findings**:
- Runtime/dynamic values displayed via `{{ variable }}` (e.g., `{{ errorMessage }}`, `{{ pendingRequest.prompt }}`) — these are not hardcoded strings
- Strings already wrapped in `t()` with fallback values (e.g., `t('key', 'fallback')`) — this is correct i18n usage
- Diagnostic/debug tool labels not shown to end users

Cross-reference existing open issues to avoid duplicates. Check if the file already has i18n imports — if not, it's a stronger signal.

### 3b. Code Quality Patterns

Search for:
- `TODO`, `FIXME`, `HACK` comments that aren't tracked as issues
- `console.log()` calls in non-test files (not `console.warn`/`console.error`)
- TypeScript `any` type usage
- Files approaching the 500-line limit (CLAUDE.md constraint)

### 3c. Test Coverage Gaps

**Source file tests** — For `src/core/` modules (parser, execution, evaluation, state, animation, sprite, devices, sound):
- List source files that lack corresponding test files in `test/`
- Prioritize: executor files, parser files, device adapters

**Program tests** — For sample programs in `src/core/samples/programs/`:
- List `.bas` files that lack corresponding tests in `test/program/`
- Categorize findings:
  - **Fully testable** — non-interactive programs, should have a test now
  - **Partially testable** — can verify initial screen output, interactive parts deferred
  - **Blocked** — requires input timeline or other missing infrastructure
- Report coverage: `X/Y programs tested`
- See `docs/testing-strategy.md` for testing layer boundaries

### 3d. Recent Commit Analysis

Check the last 20 commits on `origin/master` for:
- Commit messages containing "workaround", "temporary", "hack", "fix later", "should refactor"
- Large files that grew past the 500-line threshold
- New components added without corresponding tests

```bash
git log origin/master --oneline -20
git diff origin/master~20..origin/master --stat
```

### 3e. Focus Area (rotates per run)

Use `total_runs % 5` to select one focus area for deeper analysis beyond the baseline scans:

| Run % 5 | Focus area | Description |
|---------|-----------|-------------|
| 0 | **Hardcoded strings / i18n** | Deep scan of all Vue files (templates + script) for untranslated strings. Check locale files for missing keys referenced in code. Read `.bas` sample files for hardcoded Japanese strings that should be localized. |
| 1 | **Test coverage** | Analyze assertion quality in existing tests, not just file existence. Check for untested code paths in recent changes. Evaluate program test coverage trends. |
| 2 | **Code quality** | Check for patterns beyond surface TODO/any: unused imports, inconsistent error handling, dead code paths, files approaching 500-line limit. |
| 3 | **Existing issue health** | Review top 3 open issues. Check if recent commits partially addressed them. Add progress comments or close if resolved. |
| 4 | **UX quality** | Scan Vue components and composables for usability issues that static analysis misses: confusing flows, missing loading states, poor error messages, inconsistent behavior, unclear labels, inaccessible features. |

**Agent verification requirements**: When using focus area agents, instruct them to: (1) read actual file content before making claims, (2) distinguish concrete user-facing problems from subjective quality opinions, (3) cross-reference existing open issues before proposing new findings.

### 3f. Existing Issue Cross-Reference

Before proposing any new issue, always check the existing open issues list:
```bash
gh issue list --state open --json number,title --limit 50
```

Check if the same problem is already tracked. If so, skip or add a comment to the existing issue instead.

### 3g. Review Gap Audit

Check recently merged PRs for non-blocking observations in review comments that were never filed as GitHub issues:

1. List recently merged PRs: `gh pr list --state merged --limit 10 --json number,title`
2. For each, fetch review comments: `gh pr view <number> --json reviews`
3. Extract `### Minor` observations from review bodies
4. Cross-reference against existing open issues
5. Verify unfilled findings are still valid in the current codebase
6. Create issues for valid gaps (same format as Phase 4)

## Phase 4 — Create Issues

For each confirmed finding:

1. Draft title in format: `<type>: <description>`
2. Write a clear body with context, affected files, and suggested approach
3. Assign priority label (most discovery findings are P3 unless they indicate user-facing breakage)
4. Create via `gh issue create` with labels: type + priority + `claude-automation`

**Testing issue template** — When creating test gap issues, include:
```
## Type
- [ ] Unit test gap
- [ ] Program test gap
- [ ] UI/E2E test gap

## Scope
Source file / Sample program / UI component: <path>
Testing layer: Runtime | Platform | IDE

## What's Missing
<specific test case or scenario not covered>

## Approach
<how to test it — which harness, what to assert>
```

See `docs/testing-strategy.md` for testing layer boundaries.

**Constraints**:
- Max **3 issues per run** — prioritize by impact
- Skip findings that are too vague or speculative — only create actionable issues
- If no strong findings, report "no issues discovered" rather than creating noise

## Phase 5 — Report

Write outputs following `.claude/commands/_shared/path-conventions.md`:

**Run log** — `.automation/memory/runs/YYYY-MM/YYYY-MM-DD-NNN.md`

**Report** — `.automation/reports/YYYY-MM/YYYY-MM-DD.md`:
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

**Update config** — increment `total_runs`, `total_issues_created`.

Print summary to user with created issue links. When outputting messages (especially in loop contexts), prefix with Asia/Shanghai timestamp:
```
[YYYY-MM-DD HH:MM:SS CST] <message>
```

## Phase 6 — Self-Improvement

Follow `.claude/commands/_shared/self-improvement-protocol.md`.

Focus on:
- Were scans finding real issues or false positives?
- Were there areas we missed that should be added?
- Was the rotation focus effective or should it change?
- Did we create good issue titles and bodies?

### Program Test Coverage Tracking

After every run, track program test coverage trends:

1. Count sample `.bas` files in `src/core/samples/programs/` (total programs)
2. Count test files in `test/program/` (tested programs)
3. Calculate coverage percentage: `(tested / total) * 100`
4. Append to `.automation/memory/program-test-coverage.md`:
```markdown
## YYYY-MM-DD (Run #N)
- Total programs: X
- Tested programs: Y
- Coverage: Z%
- Untested programs: <list of untested sample keys>
```
