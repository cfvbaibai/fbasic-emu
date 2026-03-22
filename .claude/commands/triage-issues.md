# Triage Issues

Analyze unlabeled open GitHub issues, classify them, and apply priority/type labels. Follows the same automation conventions as discover-issues and implement-issue.

## References

- Prerequisites & config: `_shared/automation-conventions.md`
- Paths: `_shared/path-conventions.md`
- GitHub ops: `_shared/github-operations.md`
- Self-improvement: `_shared/self-improvement-protocol.md`

## Phase 1 — Prerequisites

Follow `_shared/automation-conventions.md` prerequisites.

Read config from `~/.claude/automations/fbasic-ide/config.md` to get `last_triage_run` for delta detection.

## Phase 2 — Fetch Issues Needing Triage

### Primary: Unlabeled issues
Query open issues missing priority labels (p1/p2/p3):

```bash
gh issue list --state open --json number,title,labels,body,author,createdAt,updatedAt --limit 50
```

Filter to issues that don't have `p1`, `p2`, or `p3` labels. These need triage.

### Secondary: Recently updated issues
Also fetch issues updated since `last_triage_run` (from config). These may need label adjustments:

```bash
gh issue list --state open --search "updated:>YYYY-MM-DD" --json number,title,labels,body,updatedAt --limit 30
```

If all open issues already have priority labels and none were recently updated, report "all triaged" and stop.

## Phase 3 — Analyze & Classify

For each issue needing triage, determine:

### Type Classification
| Type | Label | When to use |
|------|-------|-------------|
| Bug | `bug` | Broken behavior, incorrect output, crash, regression |
| Enhancement | `enhancement` | New feature, new capability, missing support |
| Refactor | `refactor` | Code improvement, restructuring, no behavior change |
| Documentation | `documentation` | Missing/incorrect docs, README, comments |
| Tests | (no label, note in body) | Test coverage, test quality |

Read the issue body carefully. If the issue author already indicated a type in the title (e.g., "bug:", "refactor:"), respect that.

### Priority Classification
| Priority | Label | Criteria |
|----------|-------|----------|
| P1 | `p1` | User-blocking: data loss, security, broken core feature, CI gate failure |
| P2 | `p2` | Significant impact: UX regression, reliability issue, missing important feature |
| P3 | `p3` | Improvements: nice-to-have, code quality, minor UX, documentation |

Default to P3 when uncertain. Only assign P1/P2 for clear user-facing impact.

### Team Suggestion (note in report, not a label)
Based on the issue's domain, suggest which team should handle it:
- **Parser**: Grammar, CST, Chevrotain — `src/core/parser/`
- **Runtime**: Executors, evaluation, state — `src/core/execution/`, `src/core/evaluation/`, `src/core/state/`
- **Sound**: Music DSL, audio — `src/core/sound/`
- **Device**: Device adapters — `src/core/devices/`
- **Graphics**: Animation, sprites — `src/core/animation/`, `src/core/sprite/`
- **IDE**: IDE interface, editor — `src/features/ide/`, `src/features/monaco-editor/`, `src/shared/`
- **Tools**: Sprite viewer, BG editor — `src/features/sprite-viewer/`, `src/features/bg-editor/`
- **CI/Build**: Build config, CI pipelines, release — tooling issues

### Duplicate Check
Before classifying, cross-reference other open issues for potential duplicates. If a likely duplicate is found, note it in the report but don't apply labels to the newer one — suggest the author close it or add a `duplicate` label.

## Phase 4 — Apply Labels

For each classified issue:

```bash
# Add type label (if not already present)
gh issue edit $NUMBER --add-label "bug"        # or enhancement, refactor, documentation

# Add priority label
gh issue edit $NUMBER --add-label "p3"         # or p1, p2

# Add automation tracking label
gh issue edit $NUMBER --add-label "claude-automation"
```

**Rules**:
- Don't remove labels the author or other humans added
- If an issue already has a type label that matches our analysis, don't add a duplicate
- If an issue already has a priority label, skip it (it was already triaged by someone)

## Phase 5 — Report

Write outputs following `_shared/path-conventions.md`:

**Run log** — `~/.claude/automations/fbasic-ide/memory/runs/YYYY-MM/YYYY-MM-DD-NNN.md`

**Report** — `~/.claude/automations/fbasic-ide/reports/YYYY-MM/YYYY-MM-DD.md`:
```markdown
# Issue Triage Report — YYYY-MM-DD

## Triaged Issues
- #N: <title>
  Type: <bug|enhancement|...>
  Priority: <P1|P2|P3>
  Team: <suggested team>
  Labels applied: <label1, label2>
  Notes: <brief reasoning>

## Skipped (already labeled)
- #N: <title> — already has <labels>

## Potential Duplicates
- #N similar to #M — <similarity description>

## Summary
- Issues triaged: N
- Issues skipped (already labeled): N
- Potential duplicates: N
```

**Update config** — increment `total_runs`, `total_issues_triaged`, update `last_triage_run`.

Print summary to user with triaged issue links.

## Phase 6 — Self-Improvement

Follow `_shared/self-improvement-protocol.md`.

Focus on:
- Were priority assignments accurate? Any P1/P2 that should have been P3 or vice versa?
- Were type classifications correct?
- Were there issues we couldn't classify confidently?
- Did we miss any duplicate relationships?
