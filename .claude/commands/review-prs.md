# GitHub PR Review Command

Review all open GitHub PRs for the F-BASIC IDE repository following the PR review guide.

## Memory Management

### Step 0: Check Review History

Before reviewing, check if PRs have already been reviewed and whether they've changed:

```bash
# Get PR info including head commit SHA
gh pr list --state open --json number,title,headRefOid,files
```

Then search memory for previous reviews:

```
mcp__plugin_claude-mem_mcp-search__search: query="PR review #[number]"
```

**Skip PR if:**
- Previously reviewed AND
- Same head commit SHA (no changes since review) AND
- Verdict was APPROVE

**Re-review if:**
- New commits since last review (different SHA)
- Previous verdict was REQUEST CHANGES or NEEDS DISCUSSION
- No previous review found

### Step 8: Save Review Results to Memory

After each review, save to memory:

```
mcp__plugin_claude-mem_mcp-search__save_memory:
  title: "PR #[number] Review: [verdict] - [title]"
  text: "PR #[number]: [title]
Commit: [headRefOid]
Verdict: [APPROVE/REQUEST CHANGES/NEEDS DISCUSSION]
Date: [current date]
Specialist: [specialist name]

Summary: [review summary]
Key Findings: [findings]
Issues: [issues if any]"
  project: "fbasic-ide"
```

## Workflow

### Step 1: List Open PRs

```bash
gh pr list --state open --json number,title,author,files,additions,deletions,labels,headRefOid
```

### Step 2: Filter Already-Reviewed PRs

For each PR, check memory:

```
mcp__plugin_claude-mem_mcp-search__search:
  query: "PR #[number] review"
  project: "fbasic-ide"
```

Compare commit SHAs:
- **Same SHA + APPROVE** → Skip (no changes)
- **Same SHA + REQUEST CHANGES/NEEDS DISCUSSION** → Check if author responded
- **Different SHA** → Re-review needed
- **Not found** → New PR, needs review

### Step 3: Categorize Remaining PRs by Specialist

Map each PR to the appropriate specialist based on files changed:

| Files Changed | Specialist |
|---------------|------------|
| `src/core/parser/` | `/parser` |
| `src/core/execution/`, `src/core/evaluation/`, `src/core/state/` | `/runtime` |
| `src/core/sound/` | `/sound` |
| `src/core/devices/` | `/device` |
| `src/core/animation/`, `src/core/sprite/` | `/graphics` |
| `src/features/ide/`, `src/features/monaco-editor/`, `src/shared/` | `/ide` |
| `src/features/sprite-viewer/`, `src/features/bg-editor/`, `src/features/sound-test/` | `/tools` |
| Build scripts, package.json, tooling | `/tools` |

### Step 4: Create Coordination Team

```
TeamCreate: team_name="pr-review-session", description="Review open PRs"
```

Create a task for each PR needing review using TaskCreate.

### Step 5: Spawn Specialists in Parallel

For each PR, spawn a specialist agent:

```
Agent: subagent_type="general-purpose", team_name="pr-review-session"
Prompt: "You are [Specialist] for F-BASIC IDE.

First, invoke /[skill] to load your context.

Then review PR #[number]: '[title]'

Run:
gh pr view [number] --json title,body,files,additions,deletions,headRefOid
gh pr diff [number]

Review for:
1. Correctness - Does the code do what it claims?
2. Code quality - Follows conventions, proper patterns?
3. Test coverage - Adequate tests for the changes?
4. Edge cases - Error handling, boundary conditions?
5. Potential issues - Breaking changes, side effects?
6. **TEST INTEGRITY** - Were any tests removed, weakened, loosened, or skipped to avoid fixing a real bug? This is a CRITICAL check. Look for: deleted test cases, loosened assertions (e.g., toEqual→toContain), changed expected values to match wrong output, added skip/todo/pending. If detected, verdict MUST be REQUEST CHANGES.

Provide verdict: APPROVE / REQUEST CHANGES / NEEDS DISCUSSION

Include specific feedback on any issues found."
```

### Step 6: Collect Results and Post to GitHub

For each completed review:

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

### Step 7: Create Follow-up Issues for Non-blocking Suggestions

**IMPORTANT: Create a GitHub issue for EVERY non-blocking suggestion found during review, regardless of size or perceived importance.** The triage process decides what to work on, not the reviewer. Every suggestion becomes a tracked issue.

After posting each review, create issues for all non-blocking observations:

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
From PR #<number> review: https://github.com/cfvbaibai/fbasic-ide/pull/<number>"
```

Issue title prefixes: `fix:` for bugs/correctness, `style:` for formatting, `refactor:` for patterns, `docs:` for documentation/samples.

### Step 8: Handle Wrong Requirements

If a PR is based on an incorrect requirement:

```bash
gh pr close <number> --comment "## Closing: <reason>

[Explanation of why the requirement was wrong]"
gh issue close <issue-number> --comment "[Explanation]"
```

### Step 9: Save to Memory

After posting each review:

```
mcp__plugin_claude-mem_mcp-search__save_memory:
  title: "PR #[number] Review: [verdict] - [title]"
  text: "PR #[number]: [title]
Commit: [headRefOid]
Verdict: [APPROVE/REQUEST CHANGES/NEEDS DISCUSSION]
Date: [current date]
Specialist: [specialist name]

Summary: [review summary]
Key Findings: [findings]"
  project: "fbasic-ide"
```

### Step 10: Cleanup

Shutdown all specialists and delete the team:

```
SendMessage: to="*", message={"type": "shutdown_request", "reason": "Reviews complete"}
TeamDelete
```

## Review Checklist

For each PR, verify:

### Code Quality
- [ ] Follows TypeScript strict mode (no `any`)
- [ ] Uses `import type` for type-only imports
- [ ] Files under 500 lines
- [ ] Vue components use `<script setup lang="ts">`
- [ ] Scoped styles only (exception: `@/shared/styles/*`)

### Test Integrity (CRITICAL)

**RED FLAG: Implementers may escape difficult challenges by loosening or removing tests instead of fixing the actual bug. This is NEVER acceptable.** Always investigate when tests are modified alongside source code.

- [ ] No tests were removed or weakened to make broken code pass
- [ ] No assertions were loosened (e.g., `.toEqual()` → `.toContain()`, exact match → partial match, strict equality → loose equality)
- [ ] No test cases were deleted to hide regressions
- [ ] No `skip`, `xit`, `xdescribe`, `todo`, or `pending` added to suppress failing tests
- [ ] No expected values in assertions were changed to match wrong output (instead of fixing the code)
- [ ] If source code changes, tests must validate the NEW correct behavior — not just avoid failing
- [ ] When in doubt, check the git blame/history of the test file to see if assertions were recently weakened

**If any of the above are detected, verdict MUST be REQUEST CHANGES regardless of other factors.**

### Testing
- [ ] Tests use `.toEqual()` for exact matching
- [ ] Edge cases covered
- [ ] Error conditions tested

### F-BASIC Specific
- [ ] Parser changes match F-BASIC grammar
- [ ] Executor changes handle all statement variants
- [ ] REPL-only commands not allowed as program statements

### Build & Scripts
- [ ] Cross-platform support (Windows/Unix)
- [ ] No hardcoded paths
- [ ] Proper error handling with exit codes

## Output Format

After completing all reviews, provide a summary:

```
## PR Review Summary

| PR | Title | Verdict | Link |
|----|-------|---------|------|
| #N | Title | ✅ APPROVE / ❌ REQUEST CHANGES / ⚠️ NEEDS DISCUSSION / ⏭️ Skipped | [Link] |

### Skipped (No Changes)
- PR #N - Title (Reviewed: [date], Commit: [short SHA])

### Ready to Merge
- PR #N - Title

### Requires Changes
- PR #N - Title (Issue: description)

### Needs Discussion
- PR #N - Title (Question: description)

### Closed
- PR #N - Title (Reason: description)

### Issues Created
- #N - Title (Source: PR #M)
```

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

## Reference

Full guide: `docs/github-pr-review-guide.md`
