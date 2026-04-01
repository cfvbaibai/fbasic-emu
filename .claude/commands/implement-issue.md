# Implement Issue

Autonomous issue implementation. This command orchestrates GitHub/git operations and delegates all code changes to `/lead` and specialist agents.

## References

- Prerequisites & config: `.claude/commands/_shared/automation-conventions.md`
- Paths: `.claude/commands/_shared/path-conventions.md`
- GitHub ops: `.claude/commands/_shared/github-operations.md`
- Self-improvement: `.claude/commands/_shared/self-improvement-protocol.md`

## Phase 0 — Prerequisites

Follow `.claude/commands/_shared/automation-conventions.md` prerequisites.

## Phase 1 — Sync & Scan

```bash
git fetch origin master
git merge --ff-only origin/master 2>/dev/null || echo "DIVERGED"
```

Update `config.md` with new `last_sync_commit` hash.

If DIVERGED, do NOT rebase/reset. Base all work on `origin/master` explicitly.

Check open PRs for maintenance needs (in this priority order):

```bash
gh pr list --json number,title,state,headRefName,baseRefName,mergeable,statusCheckRollup,reviews --state OPEN --limit 20
```

### PR Maintenance (stop after handling one if found)

1. **Merge conflicts**: Any PR with `mergeable: CONFLICTING` → rebase on origin/master in the PR's existing worktree (or `worktrees/`), force push, report
2. **Failing CI**: Any PR with failing check runs → `/lead` investigate and fix in worktree, push, report
3. **Changes requested**: Any PR with review state `CHANGES_REQUESTED` or comments containing "REQUEST CHANGES" / "Request Change" → `/lead` address concerns in worktree, push, report

**Important**: Before pushing any PR maintenance fix, always rebase the PR branch onto latest `origin/master`. CI runs on the merge commit, so the branch must be up-to-date with master to avoid phantom failures.

If any PR was handled above, **stop here**. Write PR memory, run log, and report. Do not start new issue work.

## Phase 2 — Pick Issue

Query triaged, unassigned issues sorted by priority, **excluding invalid issues**:

```bash
gh issue list --state open --search "no:assignee" --json number,title,labels,assignees,body --limit 20
```

Filter out issues with the `invalid` label — do not pick up issues that contradict F-BASIC manual behavior.

### Dependency Check

For each candidate issue, check for dependency comments:

```bash
gh issue comment list $ISSUE_NUM --limit 10 --json body --jq '.[] | .body'
```

**A dependency exists ONLY when a comment explicitly says "depends on #N"** (or "dependency: #N", "blocked by #N"). Extract the referenced issue number and verify it is closed. If the dependency is not yet closed, **skip this issue**.

**The following are NOT dependencies** — do NOT skip issues for these:
- Parent/sub-issue relationships (e.g., "Part of #N", "Sub-issue of #N", GitHub's built-in parent tracking)
- Casual references (e.g., "Related to #N", "See also #N", "Fixes #N")
- Any issue number mentioned in the body that is not an explicit dependency statement

Only explicit "depends on #N" / "dependency: #N" / "blocked by #N" phrasing in comments counts as a dependency.

If all candidate issues are blocked by real dependencies, report "no issues to implement" and stop.

```bash
gh issue list --state open --search "no:assignee" --json number,title,labels,assignees,body --limit 50
```

**Skip issues with the `invalid` label** — they contradict F-BASIC manual behavior and should not be implemented.

Select the **highest-priority unassigned** issue:
- Prefer issues with `P1` or `P2` labels
- Among same priority, prefer bugs over enhancements
- Among same priority and type, **prefer lower issue numbers** (older issues have been waiting longer)
- Scan `~/.claude/automations/fbasic-ide/memory/issues/` for existing `issue-*.md` files to avoid re-picking

If all remaining open issues are too complex for the pipeline (multi-module features requiring architectural decisions), post a `## TOO COMPLEX` comment with suggested sub-issue splits. Then report "no issues to implement" and stop.

Too-complex comment template:
```
## TOO COMPLEX for automated pipeline

This issue is too large for the automated pipeline. **Please split into smaller, focused sub-issues** that can be implemented independently.

Suggested split:
1. <sub-issue 1>
2. <sub-issue 2>
...

**Blocked for automation until decomposed.**
```

Only post this comment once per issue (check for existing "TOO COMPLEX" comments first).

## Phase 3 — Worktree Setup

Before creating a worktree, check for collisions (existing worktrees for the same branch or from Codex):

```bash
# Check if branch already exists as a worktree
git -c safe.directory="$(pwd)" worktree list | grep "$BRANCH"
```

If a worktree already exists for this branch, reuse it. If it exists but is stale (directory missing), prune it first.

Create a worktree under the automation directory:

```bash
# Branch name: fix/issue-{N}-short-description or feat/issue-{N}-short-description
BRANCH="fix/issue-${ISSUE_NUM}-$(echo "$ISSUE_TITLE" | tr '[:upper:]' '[:lower:]' | sed 's/[^a-z0-9]/-/g' | cut -c1-40)"

# Worktree path — single folder named by issue ID
WT_PATH="$HOME/.claude/automations/fbasic-ide/worktrees/${ISSUE_NUM}"

# Clean up stale worktree entry if directory doesn't exist
if [ ! -d "$WT_PATH" ]; then
  git -c safe.directory="$(pwd)" worktree prune
fi

# Create worktree on origin/master
git -c safe.directory="$(pwd)" worktree add -b "$BRANCH" "$WT_PATH" origin/master
```

Update `config.md` `active_worktrees` with the new worktree path.

## Phase 4 — Delegate to /lead

**Do NOT implement any code yourself.** Spawn a sub-agent via the `Agent` tool (not the `Skill` tool) with `subagent_type="general-purpose"`. This keeps the pipeline context intact — the Skill tool would replace your context with `/lead`'s instructions, causing the pipeline to lose momentum at this boundary.

Agent prompt:

```
Invoke the /lead skill, then pass the following task to it:

Fix issue #${ISSUE_NUM}: ${ISSUE_TITLE}

Issue URL: ${ISSUE_URL}
Issue body: ${ISSUE_BODY}

Working directory: ${WT_PATH}

This worktree contains a fresh checkout of origin/master. All implementation must happen inside this worktree.

After implementation, run targeted tests for the files you changed:
  cd ${WT_PATH} && pnpm install --frozen-lockfile && pnpm -s test:run -- <relevant-test-paths>

Also always run type-check and eslint on changed files to catch errors before committing:
  cd ${WT_PATH} && pnpm -s type-check
  cd ${WT_PATH} && pnpm exec eslint --fix <changed-files> && git diff --exit-code  # fail if fix changed files (need to amend)
  cd ${WT_PATH} && pnpm exec eslint <changed-files>  # catch non-fixable errors (max-len, etc.)
Note: eslint --fix does NOT fix max-len — always do a final eslint pass without --fix to catch line length violations.

Do NOT run full lint/test/build unless the change scope warrants it. Do NOT commit — I will handle the commit and PR.

When creating new `.ts` files outside `src/`, `test/`, or `scripts/` (e.g., at the project root), also update `tsconfig.json` include array if the file is not already covered by existing glob patterns.

When changing Vue component structure (removing/renaming CSS classes, changing DOM hierarchy), grep ALL E2E test files for affected selectors (e.g., old class names like `.features-grid`, component test IDs) and update them. E2E test breakage from UI changes is the most common CI failure — catch it before pushing.

When done, report back: (1) root cause, (2) files changed, (3) test results.
```

When the sub-agent returns, **proceed to Phase 5** without outputting a summary or stopping.

## Phase 5 — Commit & PR

```bash
cd "$WT_PATH"

# Single-commit squash rule
git add <changed-files>
git commit -m "fix: resolve #${ISSUE_NUM} - <short description>

Closes #${ISSUE_NUM}

Co-Authored-By: Claude <noreply@anthropic.com>"

git push -u origin "$BRANCH"
```

Create/update PR:

```bash
gh pr create --title "fix: resolve #${ISSUE_NUM} - <short description>" \
  --body "$(cat <<'EOF'
## Summary
- Fixes #${ISSUE_NUM}

## Changes
- <list key changes from specialist output>

## Test plan
- [ ] Targeted tests pass
- [ ] CI passes
EOF
)" --base master --head "$BRANCH"
```

## Phase 6 — Wait for CI & Fix

**You MUST NOT proceed past this phase until all CI checks pass.** This is a hard gate — do not stop, do not report "awaiting CI", do not move to cleanup.

After pushing, poll CI status every 30 seconds until all checks complete:

```bash
gh pr view ${PR_NUMBER} --json statusCheckRollup --jq '.statusCheckRollup[] | "\(.name): \(.conclusion // .status)"'
```

Wait for all checks to reach `SUCCESS` or `FAILURE` (not `QUEUED`/`IN_PROGRESS`).

### If CI passes (all SUCCESS)

Proceed to Phase 7.

### If CI fails

**Fix immediately.** Do not stop or defer to a future run.

1. Fetch the CI failure logs:
   ```bash
   gh run view ${RUN_ID} --log-failed 2>&1 | head -200
   ```

2. Re-create the worktree from the PR branch:
   ```bash
   git -c safe.directory="$(pwd)" worktree prune
   git -c safe.directory="$(pwd)" worktree add "$WT_PATH" origin/"$BRANCH"
   ```

3. **Follow systematic debugging** — do NOT guess or apply blind fixes. Work through these phases:

   **Phase 1 — Root Cause Investigation:**
   - Read CI error logs carefully (line numbers, error codes, stack traces)
   - Reproduce locally: run `pnpm -s type-check` or the specific failing test in the worktree
   - Check `git diff` of changes to understand what was introduced
   - Trace data flow backward from the error to find the source

   **Phase 2 — Pattern Analysis:**
   - Find working examples of the same pattern in the codebase
   - Compare against reference implementations (e.g., existing test patterns, helper usage)
   - Identify what differs between working code and the failing change

   **Phase 3 — Hypothesis & Test:**
   - Form a single hypothesis: "I think X fails because Y"
   - Make the SMALLEST possible change to test it (one variable at a time)
   - Verify locally before amending: run the failing check command

   **Phase 4 — Implement & Verify:**
   - Amend the fix into the original commit and force-push (see step 4 below)
   - Return to CI polling (step 6 below)

   Common CI failures and local reproduction:
   - **Type errors**: `pnpm -s type-check` — use codebase helpers (e.g., `getFirstCstNode()` from `cst-helpers.ts`) instead of raw CST access
   - **Lint errors**: `pnpm exec eslint --fix <files>` then amend if needed
   - **Test failures**: `pnpm -s test:run -- <failing-test-file>`
   - **Build failures**: Usually type errors — check type-check output first

4. Amend the fix into the original commit and force-push:
   ```bash
   cd "$WT_PATH"
   git add <changed-files>
   git commit --amend --no-edit
   git push origin "$BRANCH" --force-with-lease
   ```

5. **Do NOT create a separate fix commit** — always amend to maintain the single-commit rule.

6. Return to the top of Phase 6 and poll again.

### CI retry limit

If CI fails 3 times on the same PR (after 3 fix attempts), stop and report the persistent failure with full logs. This prevents infinite loops on truly broken CI infrastructure.

## Phase 7 — Cleanup

After PR is created/updated and CI is green, remove the worktree defensively (Windows worktree removal is unreliable):

```bash
# Remove worktree — may fail on Windows, use fallback
git -c safe.directory="$(pwd)" worktree remove "$WT_PATH" --force 2>/dev/null
git -c safe.directory="$(pwd)" worktree prune 2>/dev/null
rm -rf "$WT_PATH" 2>/dev/null
```

Branch stays on remote for CI.

**Always** update `config.md` to remove the worktree from `active_worktrees`, even if removal partially failed.

## Phase 8 — Report

Write memory, run log, and report following `.claude/commands/_shared/path-conventions.md`:

**Issue memory** — `memory/issues/issue-{N}.md`:
```markdown
# Issue #N
- Title: <title>
- Priority: <P1/P2/P3>
- Status: pr-open
- PR: <url>
- Picked: YYYY-MM-DD
- Root cause: <brief>
- Fix: <brief>
- Files: <list>
```

**Report** — `reports/YYYY-MM/YYYY-MM-DD.md`:
```markdown
# Implement Issue Run — YYYY-MM-DD

## Issue
- **#N**: <title> (<priority>)
- **URL**: <issue URL>

## Dependencies
- <list any dependencies and their resolution status>

## Root Cause
<detailed explanation from specialist>

## Fix
<detailed explanation from specialist>

## Files Changed
- <file> (<change summary>)

## Validation
- <test commands and results from specialist>

## CI Status
- <CI check results>

## PR
- **URL**: <PR URL>
```

**Update config.md** — increment `total_runs`, `total_issues_implemented` or `total_pr_maintenance`.

Print a summary to the user with issue link, PR link, and key details. When outputting messages (especially in loop contexts), prefix with Asia/Shanghai timestamp:
```
[YYYY-MM-DD HH:MM:SS CST] <message>
```

## Phase 9 — Self-Improvement

Follow `.claude/commands/_shared/self-improvement-protocol.md`. Focus on:
- Worktree failures or collision handling
- Wrong issue picked or specialist confusion
- CI surprises or PR merge issues
- Phase gaps or deviations from documented flow

## Important Rules

- **Never implement code directly** — always delegate to `/lead` and specialist agents
- **Never modify the main repo directory** — all work in worktree
- **Single-commit rule** — squash to exactly one commit before pushing; CI fix commits must be amended into the original, not pushed separately
- **Targeted validation only** — don't run full test suite for narrow changes
- **CI is a hard gate** — wait for all CI checks to pass before cleanup/report; fix failures immediately, do not defer
- **Run type-check locally** — always run `pnpm -s type-check` in the worktree before pushing; CI type errors are the most common failure mode
- **Stop after one issue** — handle one issue per run
- **PR title must include issue number** and use closing keyword `Closes #N`
- **Systematic CI debugging** — follow the 4-phase debugging process for CI failures (root cause → pattern analysis → hypothesis → implement); no guess-and-fix
