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

**Detect force-push (MANDATORY):** Even when `headRefOid` matches memory and a review exists on GitHub, a force-push may have replaced the reviewed commit with different content. The GitHub reviews API does not expose which commit a review was submitted against, so use commit timestamps as a proxy:
```bash
# Get HEAD commit's committer date
gh api repos/cfvbaibai/fbasic-ide/pulls/<number>/commits --jq '.[-1].commit.committer.date'
```

If the HEAD commit date is **after** the latest review submission time, the branch was pushed after the review — the review is stale and the PR **must** be re-reviewed.

**Skip PR if ALL of:**
- Previously reviewed AND
- Review actually exists on GitHub (not just in memory) AND
- Latest GitHub review was submitted after (or at) the last known commit SHA AND
- HEAD commit date is **not after** the latest review submission time (no force-push) AND
- Verdict was APPROVE

**Re-review if ANY of:**
- New commits since last review (different SHA, OR SHA matches but no review posted for it)
- HEAD commit date is after the latest review submission time (force-push detected)
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

**Core principle: address in one shot.** If something is worth fixing, it should be a blocking finding so it gets fixed in the PR — not deferred to a follow-up issue. Err on the side of REQUEST CHANGES rather than approving with a list of Minor items.

**Checklist:**
1. **Correctness** — Does the code do what it claims?
2. **Code quality** — Follows conventions (TypeScript strict, import type, no any, files under 500 lines, scoped styles)?
3. **Test coverage** — Adequate tests? Use `.toEqual()` not `.toContain()`?
4. **Edge cases** — Error handling, boundary conditions?
5. **Potential issues** — Breaking changes, side effects?
6. **TEST INTEGRITY (CRITICAL)** — Were any tests removed, weakened, loosened, or skipped to avoid fixing a real bug? Look for: deleted test cases, loosened assertions (e.g., toEqual→toContain), changed expected values to match wrong output, added skip/todo/pending. If detected, verdict MUST be REQUEST CHANGES.
7. **Code duplication** — Is logic, helpers, or setup/teardown duplicated across functions or test files that could be extracted? If fixable within the PR scope, REQUEST CHANGES.
8. **Magic numbers** — Are hardcoded values used where named constants should be (e.g., duplicated across files, shared meanings)? If a constant already exists or can easily be added, REQUEST CHANGES.
9. **Inconsistent patterns** — Are mixed styles used within the same PR (e.g., regex vs literal assertions, different approaches to similar problems)? If unifiable within scope, REQUEST CHANGES.

**Judgment call — blocking vs minor:**
- **Blocking (REQUEST CHANGES):** The fix is within the PR's scope and effort. Fix it now.
- **Minor:** The fix requires work outside the PR's scope (e.g., new feature, cross-cutting refactor touching many files, or a decision from product/design).

**Output:** Verdict (APPROVE / REQUEST CHANGES / NEEDS DISCUSSION) + key findings for review body.

### Step 3b — Minor Analysis (scope-gated only)

This step is for observations that are **genuinely out of scope** for the current PR but worth tracking. Most observations from the checklist in Step 3a should have already been caught as blocking findings.

Only produce Minor items when the fix would require work **outside the PR's scope**:
- A cross-cutting refactor touching 5+ files (not feasible as a PR amendment)
- A new feature or capability not related to the PR's purpose
- A design/product decision that needs discussion before proceeding
- Something that depends on an unmerged PR or future milestone

**Do NOT produce Minor items for things that could be fixed with a small amendment to the current PR.** Those should be blocking findings in Step 3a.

**Output:** A list of scope-gated observations (may be empty — most well-scoped PRs will have zero Minor items).

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
[Only scope-gated items from Step 3b — fixes outside the PR's scope. Omit this section entirely if none.]
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
[Only scope-gated items from Step 3b — fixes outside the PR's scope. Omit this section entirely if none.]
- [Observation 1]
- [Observation 2]

🤖 Reviewed by Claude Code ([Specialist] specialist)"
```

### Step 4b — Create Follow-up Issues (scope-gated only)

For each review just posted, create a GitHub issue for each Minor observation listed in the review body. Since Minor items are now scope-gated (Step 3b), every Minor item represents work that is genuinely outside the current PR's scope.

**Create an issue for every Minor item** — the scope gate in Step 3b already filtered out noise.

**Skip when:**
- An existing GitHub issue already covers the exact same suggestion

For each qualifying suggestion, create an issue immediately after posting the review:

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

**If a PR had no Minor items (N=0):** This is a good outcome — the PR was clean enough that no follow-up issues were needed. No further action required.

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
- **Issue quality over quantity: Were filed issues genuinely worth tracking as separate work, or should they have been blocking findings or omitted entirely?** (target: high-signal, low-noise issues)
- Were actionable findings addressed as blocking changes instead of being deferred to follow-up issues?
- Did the specialist mapping match the actual PR scope?
- Were any real issues missed during review?
- When audit was run, what percentage of findings were already tracked? (target: >90%)
- **Skip accuracy: Were any PRs incorrectly skipped due to force-push or SHA mismatch?** (target: 0 false skips)

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
