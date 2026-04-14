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

Read config from `.automation/config.md` to get `total_runs` for run log numbering.

## Phase 2 — List & Filter PRs

### Step 2a: List Open PRs

```bash
gh pr list --state open --json number,title,author,files,additions,deletions,labels,headRefOid
```

### Step 2b: Check Review History

Check memory at `~/.claude/projects/C--Users-Tony-code-GitHub-fbasic-ide/memory/MEMORY.md` and `~/.claude/projects/C--Users-Tony-code-GitHub-fbasic-ide/memory/pr-reviews.md` for previous reviews.

**Verify review exists on GitHub:** For each PR that appears previously reviewed in memory, confirm the review was actually posted:
```bash
gh pr view <number> --json reviews,headRefOid --jq '{latest_sha: .headRefOid, latest_review: (.reviews | sort_by(.submittedAt) | last | .submittedAt // "none")}'
```

**Skip PR if:**
- Previously reviewed AND
- Review actually exists on GitHub (not just in memory) AND
- Latest GitHub review was submitted after (or at) the last known commit SHA AND
- Verdict was APPROVE

**Re-review if:**
- New commits since last review (different SHA, OR SHA matches but no review posted for it)
- Previous verdict was REQUEST CHANGES or NEEDS DISCUSSION
- No previous review found
- Review exists in memory but NOT on GitHub (review was never posted or was lost)

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

If no PRs need review AND no audit was requested, write run log noting "no PRs to review" and stop.

### Step 2d — Audit Recently Merged PRs (when ARGUMENTS contain "audit")

When the command is invoked with an argument containing "audit" (e.g., `/review-prs audit recently reviewed PRs`), perform a retroactive audit of recently merged PRs to find non-blocking observations that were missed during review and not filed as GitHub issues.

**Scope:** Audit the last ~30 merged PRs (adjust based on recency — cover the current review session's PRs).

**Process:**

1. List recently merged PRs:
   ```bash
   gh pr list --state merged --limit 30 --json number,title,mergedAt
   ```

2. Fetch review comments for each PR:
   ```bash
   gh pr view <number> --json reviews --jq '.reviews[] | " reviewer: \(.author.login) state: \(.state) body: \(.body)"'
   ```

3. Extract all `### Minor` observations from each review body.

4. Cross-reference each observation against existing GitHub issues:
   ```bash
   gh issue list --state all --limit 100 --json number,title
   ```

5. For each observation NOT covered by an existing issue, verify it's still valid in the current codebase (files may have changed since the PR merged).

6. Create GitHub issues for valid missed findings (same format as Phase 5).

**Skip filing when:**
- An existing GitHub issue already covers the exact same suggestion
- The finding is invalid or no longer applicable (code changed, file removed, etc.)
- The finding was explicitly noted as "not actionable" or "acceptable" in the review

**PRs with no review comments** (e.g., merged without formal review) should also have their diffs checked for non-blocking findings.

**Output:** Append audit section to the report with:
- PRs audited: N
- Findings extracted: N
- Already tracked: N
- Invalid/no longer applicable: N
- Missed (issues created): N
- Too minor to file: N

## Phase 3 — Review PRs

For each PR that needs review, fetch the diff and review it directly (no team agents):

```bash
gh pr view <number> --json title,body,files,additions,deletions,headRefOid
gh pr diff <number>
```

For complex PRs or multiple PRs, you MAY use the Agent tool with `subagent_type="general-purpose"` (NOT team_name) to parallelize reviews. Each agent should return its verdict and feedback as text — do NOT use TeamCreate, SendMessage, or team-based features.

### Step 3a — Blocking Analysis (determines verdict)

Evaluate whether the PR is safe to merge. This step determines the verdict.

**Checklist:**
1. **Correctness** — Does the code do what it claims?
2. **Code quality** — Follows conventions (TypeScript strict, import type, no any, files under 500 lines, scoped styles)?
3. **Test coverage** — Adequate tests? Use `.toEqual()` not `.toContain()`?
4. **Edge cases** — Error handling, boundary conditions?
5. **Potential issues** — Breaking changes, side effects?
6. **TEST INTEGRITY (CRITICAL)** — Were any tests removed, weakened, loosened, or skipped to avoid fixing a real bug? Look for: deleted test cases, loosened assertions (e.g., toEqual→toContain), changed expected values to match wrong output, added skip/todo/pending. If detected, verdict MUST be REQUEST CHANGES.

**Output:** Verdict (APPROVE / REQUEST CHANGES / NEEDS DISCUSSION) + key findings for review body.

### Step 3b — Non-Blocking Analysis (MANDATORY — feeds Phase 5)

This step is **always executed**, even if the verdict is APPROVE. It is a separate, dedicated scan for improvement opportunities. Do NOT skip this step. Do NOT write "(none)" without actively searching.

**Scan categories (check each one):**
1. **Magic numbers** — Hardcoded values that should be named constants (e.g., default palette values duplicated across files)
2. **Code duplication** — Logic, helpers, or setup/teardown blocks repeated across functions or test files
3. **Inconsistent patterns** — Mixed styles within the same PR (e.g., regex vs literal assertions, different timeout strategies)
4. **Missing test coverage** — Smoke-only tests without assertions, untested code paths, interactive programs only testing exit paths
5. **Potential improvements** — Opportunities for refactoring, better abstractions, or clearer naming

**Output:** A list of non-blocking observations. Each observation MUST become a GitHub issue in Phase 5.

**Rule:** If the scan produces zero observations for a non-trivial PR (>20 lines changed or >2 files), re-examine the diff — you likely missed something.

## Phase 4 — Post Reviews & Create Follow-up Issues

**IMPORTANT: These two steps are coupled.** After posting each review, immediately create issues for ALL Minor items in that review before moving to the next PR. Do NOT batch reviews first and create issues later — issues must be created inline, one PR at a time.

### Step 4a — Post Review

**APPROVE:**
```bash
# Note: Use --comment instead of --approve for own PRs (GitHub doesn't allow self-approval)
gh pr review <number> --comment --body "## Review: APPROVE

### Summary
[Brief description]

### Key Findings
- [Finding 1]
- [Finding 2]

### Minor
[Every non-blocking observation from Step 3b MUST be listed here. Each item will become a GitHub issue in Step 4b.]
- [Observation 1]
- [Observation 2]

🤖 Reviewed by Claude Code ([Specialist] specialist)"
```

**REQUEST CHANGES:**
```bash
# Note: Use --comment instead of --request-changes for own PRs (GitHub doesn't allow self-request-changes)
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

### Minor
[Every non-blocking observation from Step 3b MUST be listed here. Each item will become a GitHub issue in Step 4b.]
- [Observation 1]
- [Observation 2]

🤖 Reviewed by Claude Code ([Specialist] specialist)"
```

### Step 4b — Create Follow-up Issues (MANDATORY, inline with Step 4a)

**STOP: Do NOT proceed to Phase 6 until this step is complete for every PR reviewed in Step 4a.**

For each review just posted, create a GitHub issue for **every** Minor observation listed in the review body.

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

### Step 4c — Verify Issue Count (MANDATORY)

After creating issues for a review, verify the count matches:

1. Count the Minor items listed in the review body → `N`
2. Count the issues just created for that PR → `M`
3. Assert `N == M`

**If N > M:** Issues are missing. Review each Minor item and create the missing issues before proceeding.
**If N < M:** Duplicate issues were created. This should not happen — if it does, close the duplicates.

Record the count in the run log: "PR #X: N Minor items → M issues created"

## Phase 5 — Verify Issue Creation

**Before saving results, verify Phase 4b completed for every PR reviewed.**

For each PR reviewed in Phase 4 with Minor items in its review body:

1. Count Minor items in the review body → `N`
2. Count issues created for that PR (from Step 4c log) → `M`
3. Assert `N == M`

**If any PR has N > M:** Go back and create the missing issues now. Do NOT proceed until all Minor items have corresponding issues.

**If a PR had no Minor items (N=0):** This is acceptable only for trivial PRs (<20 lines, 1-2 files). For non-trivial PRs with zero Minor items, flag this in the run log as a potential missed scan.

## Phase 6 — Handle Wrong Requirements

If a PR is based on an incorrect requirement:

```bash
gh pr close <number> --comment "## Closing: <reason>

[Explanation of why the requirement was wrong]"
gh issue close <issue-number> --comment "[Explanation]"
```

## Phase 7 — Save Review Results

**Before saving, confirm Phase 5 verification passed for all PRs.** Do not save results if any PR has missing issues.

After posting each review, update memory files:

- `~/.claude/projects/C--Users-Tony-code-GitHub-fbasic-ide/memory/MEMORY.md` — add review entry to PR review history section. Include the issue count: "Minor: N → M issues created"
- `~/.claude/projects/C--Users-Tony-code-GitHub-fbasic-ide/memory/pr-reviews.md` — detailed per-PR review notes. Include a `Follow-up Issues` section listing all issue numbers created from the review

## Phase 8 — Report

Write outputs following `.claude/commands/_shared/path-conventions.md`:

**Run log** — `.automation/memory/runs/YYYY-MM/YYYY-MM-DD-NNN.md`

**Report** — `.automation/reports/YYYY-MM/YYYY-MM-DD.md`:
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

## Audit (if run)
- PRs audited: N
- Findings extracted: N
- Already tracked: N
- Invalid/no longer applicable: N
- Missed (issues created): N
- Too minor to file: N
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
- **Issue creation completeness: Did every Minor item in every review get a corresponding GitHub issue?** (target: 100% — any gap here is a process failure)
- Were follow-up issues well-scoped and actionable?
- Did the specialist mapping match the actual PR scope?
- Were any real issues missed during review?
- When audit was run, what percentage of findings were already tracked? (target: >90%)

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
