# GitHub PR Review Command

Review all open GitHub PRs for the F-BASIC IDE repository following the PR review guide.

## References

- Prerequisites & config: `.claude/commands/_shared/automation-conventions.md`
- Paths: `.claude/commands/_shared/path-conventions.md`
- GitHub ops: `.claude/commands/_shared/github-operations.md`
- Self-improvement: `.claude/commands/_shared/self-improvement-protocol.md`
- Review guide: `docs/github-pr-review-guide.md`

## Phase 1 — Prerequisites

Follow `.claude/commands/_shared/automation-conventions.md` prerequisites.

Read config from `~/.claude/automations/fbasic-ide/config.md` to get `total_runs` for run log numbering.

## Phase 2 — List & Filter PRs

### Step 2a: List Open PRs

```bash
gh pr list --state open --json number,title,author,files,additions,deletions,labels,headRefOid
```

### Step 2b: Check Review History

Check memory at `~/.claude/projects/C--Users-Tony-code-GitHub-fbasic-ide/memory/MEMORY.md` and `~/.claude/projects/C--Users-Tony-code-GitHub-fbasic-ide/memory/pr-reviews.md` for previous reviews.

**Skip PR if:**
- Previously reviewed AND
- Same head commit SHA (no changes since review) AND
- Verdict was APPROVE

**Re-review if:**
- New commits since last review (different SHA)
- Previous verdict was REQUEST CHANGES or NEEDS DISCUSSION
- No previous review found

### Step 2c: Identify Specialist

Map each PR to the appropriate specialist based on files changed (for review comment attribution):

| Files Changed | Specialist |
|---------------|------------|
| `src/core/parser/` | Parser |
| `src/core/execution/`, `src/core/evaluation/`, `src/core/state/` | Runtime |
| `src/core/sound/` | Sound |
| `src/core/devices/` | Device |
| `src/core/animation/`, `src/core/sprite/` | Graphics |
| `src/features/ide/`, `src/features/monaco-editor/`, `src/shared/` | IDE |
| `src/features/sprite-viewer/`, `src/features/bg-editor/`, `src/features/sound-test/` | Tools |
| Build scripts, package.json, tooling | Tools |

If no PRs need review, write run log noting "no PRs to review" and stop.

## Phase 3 — Review PRs

For each PR that needs review, fetch the diff and review it directly (no team agents):

```bash
gh pr view <number> --json title,body,files,additions,deletions,headRefOid
gh pr diff <number>
```

For complex PRs or multiple PRs, you MAY use the Agent tool with `subagent_type="general-purpose"` (NOT team_name) to parallelize reviews. Each agent should return its verdict and feedback as text — do NOT use TeamCreate, SendMessage, or team-based features.

**Review checklist:**
1. **Correctness** — Does the code do what it claims?
2. **Code quality** — Follows conventions (TypeScript strict, import type, no any, files under 500 lines, scoped styles)?
3. **Test coverage** — Adequate tests? Use `.toEqual()` not `.toContain()`?
4. **Edge cases** — Error handling, boundary conditions?
5. **Potential issues** — Breaking changes, side effects?
6. **TEST INTEGRITY (CRITICAL)** — Were any tests removed, weakened, loosened, or skipped to avoid fixing a real bug? Look for: deleted test cases, loosened assertions (e.g., toEqual→toContain), changed expected values to match wrong output, added skip/todo/pending. If detected, verdict MUST be REQUEST CHANGES.

## Phase 4 — Post Reviews

**APPROVE:**
```bash
# Note: Use --comment instead of --approve for own PRs (GitHub doesn't allow self-approval)
gh pr review <number> --comment --body "## Review: APPROVE

### Summary
[Brief description]

### Key Findings
- [Finding 1]
- [Finding 2]

🤖 Reviewed by Claude Code ([Specialist] specialist)"
```

**REQUEST CHANGES:**
```bash
gh pr review <number> --request-changes --body "## Review: REQUEST CHANGES

### Issues Found
1. [Issue 1]
2. [Issue 2]

### Required Changes
- [Required change 1]
- [Required change 2]

🤖 Reviewed by Claude Code ([Specialist] specialist)"
```

**NEEDS DISCUSSION:**
```bash
gh pr review <number> --comment --body "## Review: NEEDS DISCUSSION

### Questions
1. [Question 1]
2. [Question 2]

### Context
[Explanation of why discussion is needed]

🤖 Reviewed by Claude Code ([Specialist] specialist)"
```

## Phase 5 — Create Follow-up Issues

**IMPORTANT: Create a GitHub issue for EVERY non-blocking suggestion found during review, regardless of size or perceived importance.** The triage process decides what to work on, not the reviewer. Every suggestion becomes a tracked issue.

**The 20 open issue cap does NOT apply here** — review findings are real observations from actual code and must not be silently dropped. Do not check the issue cap before creating follow-up issues from reviews.

**Always create issues for:**
- Non-blocking improvement suggestions ("Consider...", "Optional...")
- Code style/formatting issues (missing spaces, inconsistent patterns)
- Test pattern improvements (`null as never`, better type safety)
- Missing coverage in samples/docs (missing operators, incomplete examples)
- Any observation noted as "minor" or "non-blocking" in the review body

**Only skip when:**
- An existing GitHub issue already covers the exact same suggestion

For each suggestion, create an issue immediately after posting the review:

```bash
gh issue create --title "<type>: <concise description>" \
  --body "## Summary
<Brief description of the issue and what to fix>

## Source
From PR #<number> review: https://github.com/cfvbaibai/fbasic-ide/pull/<number>" \
  --label "<type>,p3,claude-automation"
```

Issue title prefixes: `fix:` for bugs/correctness, `style:` for formatting, `refactor:` for patterns, `docs:` for documentation/samples.

## Phase 6 — Handle Wrong Requirements

If a PR is based on an incorrect requirement:

```bash
gh pr close <number> --comment "## Closing: <reason>

[Explanation of why the requirement was wrong]"
gh issue close <issue-number> --comment "[Explanation]"
```

## Phase 7 — Save Review Results

After posting each review, update memory files:

- `~/.claude/projects/C--Users-Tony-code-GitHub-fbasic-ide/memory/MEMORY.md` — add review entry to PR review history section
- `~/.claude/projects/C--Users-Tony-code-GitHub-fbasic-ide/memory/pr-reviews.md` — detailed per-PR review notes

## Phase 8 — Report

Write outputs following `.claude/commands/_shared/path-conventions.md`:

**Run log** — `~/.claude/automations/fbasic-ide/memory/runs/YYYY-MM/YYYY-MM-DD-NNN.md`

**Report** — `~/.claude/automations/fbasic-ide/reports/YYYY-MM/YYYY-MM-DD.md`:
```markdown
# PR Review Report — YYYY-MM-DD

## Reviews Completed
- #N: <title>
  Verdict: <APPROVE|REQUEST CHANGES|NEEDS DISCUSSION>
  Specialist: <team>
  Link: <PR URL>
  Notes: <brief reasoning>

## Skipped (already reviewed, no changes)
- #N: <title> — last reviewed <date>, commit <short SHA>

## Issues Created
- #N: <title> (Source: PR #M)

## Closed
- #N: <title> (Reason: <description>)

## Summary
- PRs reviewed: N
- PRs skipped: N
- Issues created: N
- PRs closed: N
```

**Update config** — increment `total_runs`, `total_pr_maintenance`.

Print summary to user with PR links. When outputting messages (especially in loop contexts), prefix with Asia/Shanghai timestamp:
```
[YYYY-MM-DD HH:MM:SS CST] <message>
```

## Phase 9 — Self-Improvement

Follow `.claude/commands/_shared/self-improvement-protocol.md`.

Focus on:
- Were verdicts accurate? Any false positives/negatives?
- Were follow-up issues well-scoped and actionable?
- Did the specialist mapping match the actual PR scope?
- Were any real issues missed during review?

## Periodic Execution

To run reviews periodically, use the `/loop` command:

```
/loop 1h /review-prs
```

This will:
1. Check for new PRs every hour
2. Skip already-reviewed PRs with no changes
3. Re-review PRs with new commits
4. Save all results to memory for future runs
