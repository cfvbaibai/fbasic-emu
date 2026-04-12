# Implement Issue

Autonomous issue implementation. This command orchestrates GitHub/git operations and delegates all code changes to `/lead` and specialist agents.

## References

- Prerequisites & config: `.claude/commands/_shared/automation-conventions.md`
- Paths: `.claude/commands/_shared/path-conventions.md`
- GitHub ops: `.claude/commands/_shared/github-operations.md`
- Self-improvement: `.claude/commands/_shared/self-improvement-protocol.md`

## Phase 0 — Prerequisites

Follow `.claude/commands/_shared/automation-conventions.md` prerequisites.

### Session Identity (for concurrent instance coordination)

Generate a unique session ID so multiple `/implement-issue` instances can detect each other and avoid picking the same issue:

```bash
SESSION_ID=$(python3 -c "import uuid; print(uuid.uuid4())")
```

If `SESSION_ID` is empty, skip coordination checks (single-instance mode). Store it for the duration of this run as `${SESSION_ID}`.

### Lock Directory Setup & Prune

Lock operations use `scripts/lock.sh` which resolves `REPO_ROOT` internally — safe to call from any CWD including worktrees.

```bash
scripts/lock.sh prune
```

**Resolve `REPO_ROOT` for non-lock operations** (worktree paths, etc.) — this is still needed for Phases 3-7:

```bash
REPO_ROOT=$(git -c safe.directory="$(pwd)" worktree list --porcelain | head -1 | sed -n 's/^worktree //p')
```

## Phase 1 — Sync & Scan

```bash
git fetch origin master
git merge --ff-only origin/master 2>/dev/null || echo "DIVERGED"
```

Update `config.md` with new `last_sync_commit` hash.

### Post-merge Integrity Check

After merging, verify that recent fixes to `.claude/commands/` files haven't been silently reverted by a fast-forward merge (this happens when a PR branch predates a command fix and merges after it):

```bash
# Check critical patterns that must not regress
grep -q 'uuid.uuid4()' .claude/commands/implement-issue.md || echo "INTEGRITY_WARN: SESSION_ID fix reverted"
grep -q 'scripts/lock.sh' .claude/commands/implement-issue.md || echo "INTEGRITY_WARN: lock.sh refactoring reverted"
```

If any integrity warning fires, **stop and re-apply the fix** before proceeding. This prevents the pipeline from operating with a broken command definition.

If DIVERGED, do NOT rebase/reset. Base all work on `origin/master` explicitly.

Check open PRs for maintenance needs (in this priority order):

```bash
gh pr list --json number,title,state,headRefName,baseRefName,mergeable,statusCheckRollup,reviews --state OPEN --limit 20
```

### PR Maintenance (stop after handling one if found)

Before handling any PR, extract the issue number and acquire a lock to prevent concurrent sessions from working on the same PR:

```bash
# Extract issue number from headRefName (stricter format: feat/issue-{N}-slug or fix/issue-{N}-slug)
ISSUE_NUM=$(echo "$HEAD_REF_NAME" | sed -n 's/.*\/issue-\([0-9]*\)-.*/\1/p')

# Fallback: extract from PR title (format: "feat: resolve #N - ..." or "fix: resolve #N - ...")
if [ -z "$ISSUE_NUM" ]; then
  ISSUE_NUM=$(echo "$PR_TITLE" | sed -n 's/.*#\([0-9]*\).*/\1/p')
fi

# Lock key: use issue-{N} if issue found, otherwise pr-{N}
if [ -n "$ISSUE_NUM" ]; then
  LOCK_RESULT=$(scripts/lock.sh acquire "issue-${ISSUE_NUM}" "$SESSION_ID" --pr "$PR_NUMBER" --issue "$ISSUE_NUM")
else
  LOCK_RESULT=$(scripts/lock.sh acquire "pr-${PR_NUMBER}" "$SESSION_ID" --pr "$PR_NUMBER")
fi
echo "$LOCK_RESULT"
```

**If `LOCK_BUSY` or `LOCK_STEAL_FAILED`**: another session owns this PR — skip to the next PR in the list.

**If `LOCK_ACQUIRED`, `LOCK_STOLEN`, or `LOCK_REACQUIRED`**: proceed with maintenance, then release the lock in Phase 7 cleanup via `scripts/lock.sh release`.

For each PR that passes the lock check, handle in this priority order:

1. **Merge conflicts**: Any PR with `mergeable: CONFLICTING` → rebase on origin/master in the PR's existing worktree (or `worktrees/`), force push, report
2. **Failing CI**: Any PR with failing check runs → `/lead` investigate and fix in worktree, push, report
3. **Changes requested**: Any PR with review state `CHANGES_REQUESTED` or comments containing "REQUEST CHANGES" / "Request Change" → `/lead` address concerns in worktree, push, report

**File size after conflict resolution**: After resolving merge conflicts, check all changed files with `wc -l`. If any file exceeds 500 lines, you MUST do real structural refactoring following `docs/file-splitting-guide.md` — decompose by responsibility, extract cohesive modules. **Cosmetic tricks are forbidden**: do NOT condense JSDoc comments, remove blank lines, or compress formatting to save lines. These are not refactoring — they degrade readability without improving code structure.

**Important**: Before pushing any PR maintenance fix, always rebase the PR branch onto latest `origin/master`. CI runs on the merge commit, so the branch must be up-to-date with master to avoid phantom failures.

If any PR was handled above, **stop here**. Write PR memory, run log, and report. Do not start new issue work.

## Phase 2 — Pick Issue

Query triaged, unassigned issues sorted by priority, **excluding invalid issues**:

```bash
gh issue list --state open --search "no:assignee" --json number,title,labels,assignees,body --limit 20
```

Filter out issues with the `invalid` label — do not pick up issues that contradict F-BASIC manual behavior.

### Busy Lock Pre-filter

Before spending time on dependency checks and lock acquisition attempts, pre-scan existing locks to eliminate already-claimed issues:

```bash
# Get issue numbers locked by OTHER active sessions (excludes own locks and stale locks)
LOCKED_ISSUES=$(scripts/lock.sh list --exclude-session "$SESSION_ID" | sed 's/^issue-//' | sort -n)
echo "Locked issues (other sessions): $LOCKED_ISSUES"
```

**Remove any candidate issue whose number appears in `$LOCKED_ISSUES`** from the candidate list. This avoids:
- Wasting GitHub API calls checking dependencies for locked issues
- Wasting lock acquisition bash calls that would just return `LOCK_BUSY`

> **What gets excluded from this list**: Locks owned by `$SESSION_ID` (current session can resume interrupted work) and stale locks (>2 hours, which `acquire` would steal anyway). Only truly busy locks from other active sessions are returned.

> **Race condition note**: A lock could be acquired between this pre-filter and the actual `lock.sh acquire` call below. That's fine — the atomic `acquire` in the "Atomic Issue Locking" section is still the authoritative gate. This pre-filter is purely an optimization to skip obviously busy issues early.

If all candidates are filtered out by this step, report "no issues to implement (all candidates locked)" and stop.

### Dependency Check

For each candidate issue, check for dependency comments:

```bash
REPO=$(gh repo view --json nameWithOwner --jq '.nameWithOwner')
gh api "repos/$REPO/issues/$ISSUE_NUM/comments?per_page=10" --jq '.[].body'
```

> **gh CLI fallback**: If any `gh` command fails, do NOT retry the same command. See `.claude/commands/_shared/github-operations.md` "Error Recovery" section for fallback patterns.

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

### Atomic Issue Locking

Use per-issue lock files for atomic issue claiming. The `scripts/lock.sh` script handles REPO_ROOT resolution, directory creation, and atomic noclobber — safe to call from any CWD.

For each candidate issue **in priority order**, attempt to acquire a lock:

```bash
LOCK_RESULT=$(scripts/lock.sh acquire "issue-${ISSUE_NUM}" "$SESSION_ID")
echo "$LOCK_RESULT"
```

**If `LOCK_ACQUIRED`, `LOCK_STOLEN`, or `LOCK_REACQUIRED`**: this issue is ours — stop iterating, this is the selected issue.

**If `LOCK_BUSY` or `LOCK_STEAL_FAILED`**: another instance owns this issue — skip to the next candidate in priority order.

### Issue Selection

Iterate candidates **in priority order**, attempting atomic lock acquisition for each. The first issue we successfully lock is selected:

- Prefer issues with `P1` or `P2` labels
- Among same priority, prefer bugs over enhancements
- Among same priority and type, **prefer lower issue numbers** (older issues have been waiting longer)
- Scan `.automation/memory/issues/` for existing `issue-*.md` files to avoid re-picking

If all candidates are locked by other instances, report "no issues to implement" and stop.

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

### TDD Classification

After picking an issue, classify it into a TDD category. This classification determines what testing methodology the specialist agent follows in Phase 4.

| Category | Issue Pattern | TDD Approach |
|----------|--------------|-------------|
| **A (Feature)** | `feat:` adding new behavior in `src/` | Full TDD — write tests first, verify fail, implement, verify pass |
| **B (Bug fix)** | `fix:` fixing runtime behavior in `src/` | Full TDD — write regression test first, verify it reproduces bug, fix, verify pass |
| **C (Test-only)** | `test:` the issue IS adding/modifying tests, or deliverable is test files | No TDD — the test IS the deliverable; writing a test-for-a-test adds no value |
| **D (Refactor)** | `refactor:` no behavior change (rename, extract, split, delete) | Green-first — verify existing tests pass, refactor, verify they still pass |
| **E/F/G** | `style:`, `chore:`, `i18n:` formatting, CI/infra, locale data | No TDD — no testable application behavior |

Historical data: ~29% of pipeline implementations are A+B (TDD applies), ~71% are C/D/E/F/G (TDD does not apply or adds no value). Forcing TDD on C/D/E/F/G causes harm — artificial tests, backwards workflows, wasted context.

Set `${TDD_CATEGORY}` to one of: `A`, `B`, `C`, `D`, `E_F_G`.

## Phase 3 — Worktree Setup

> **REPO_ROOT was already resolved in Phase 0.** Do NOT re-resolve it here. Use `${REPO_ROOT}` for all worktree paths.

**Before creating a worktree, verify the lock exists.** If the lock file for this issue is missing, STOP — another session may have claimed it, or the lock was lost. Re-acquire the lock before proceeding:

```bash
LOCK_STATUS=$(scripts/lock.sh exists "issue-${ISSUE_NUM}")
if [ "$LOCK_STATUS" = "LOCK_MISSING" ]; then
  echo "ERROR: No lock file for issue #${ISSUE_NUM}. Cannot create worktree without lock."
  LOCK_RESULT=$(scripts/lock.sh acquire "issue-${ISSUE_NUM}" "$SESSION_ID")
  if echo "$LOCK_RESULT" | grep -q "LOCK_ACQUIRED\|LOCK_STOLEN\|LOCK_REACQUIRED"; then
    echo "LOCK_REACQUIRED"
  else
    echo "LOCK_BUSY — another session owns this issue. STOP."
  fi
fi
```

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

# Worktree path — single folder named by issue ID, relative to MAIN repo root
WT_PATH="${REPO_ROOT}/.automation/worktrees/${ISSUE_NUM}"

# Clean up stale worktree entry if directory doesn't exist
if [ ! -d "$WT_PATH" ]; then
  git -c safe.directory="$(pwd)" worktree prune
fi

# Create worktree on origin/master
git -c safe.directory="$(pwd)" worktree add -b "$BRANCH" "$WT_PATH" origin/master
```

Update `config.md` `active_worktrees` with the new worktree entry including session ID:

> **config.md is informational only, NOT authoritative.** It uses plain markdown with no atomicity — concurrent sessions may overwrite each other's entries. The lock file in `.automation/locks/` is the sole authoritative claim. Always read lock files to determine true ownership, never rely on config.md alone.

```markdown
- active_worktrees:
  - path: .automation/worktrees/${ISSUE_NUM}
    session: ${SESSION_ID}
    issue: ${ISSUE_NUM}
    claimed: YYYY-MM-DD HH:MM:SS CST
```

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

**File size constraint**: MAX 500 lines per file. After implementation, check all changed files with `wc -l`. If any exceeds 500 lines, you MUST do real structural refactoring following `docs/file-splitting-guide.md` — diagnose why the file grew, then decompose by responsibility into cohesive modules. If a file needs splitting, split it properly.

**Cosmetic tricks are strictly forbidden.** The following are NEVER acceptable as "refactoring":
- Removing blank lines between functions/blocks
- Condensing JSDoc comments or removing documentation
- Joining multi-line statements into single lines
- Removing trailing commas or reformatting for line density
- Collapsing `if/else` blocks into ternaries just to save lines
- Moving code to a `*Helpers.ts` dump file without identifying a clear responsibility
- Any change whose ONLY effect is reducing line count without improving structure

**If a file exceeds 500 lines, the ONLY acceptable response is structural decomposition**: identify the mixed responsibilities, create focused modules with clear domain purpose, and distribute the code by responsibility. Read `docs/file-splitting-guide.md` for examples of correct vs incorrect splits.

**Bug fix test coverage**: When fixing a bug, add or update test cases that cover the bug scenario. A fix without a regression test is incomplete — the bug could silently reappear. Write a test that reproduces the bug (would fail before the fix) and verifies the fix (passes after). If existing tests already cover the scenario, verify they do and note it.

## TDD Methodology: ${TDD_CATEGORY}

${TDD_INSTRUCTIONS}

When done, report back: (1) TDD cycle summary (what tests were written, how they failed, how implementation made them pass — skip for categories C/D/E_F_G), (2) root cause, (3) files changed, (4) test results.
```

When the sub-agent returns, **proceed to Phase 5** without outputting a summary or stopping.

### TDD Instruction Blocks

Set `${TDD_INSTRUCTIONS}` based on the `${TDD_CATEGORY}` classification from Phase 2:

**Category A (Feature) — Full TDD:**
```
Follow strict test-driven development:

1. **RED**: Write failing tests FIRST that define the expected behavior/API. Write the test as if the feature already exists — call the API you wish you had.
2. **Verify RED**: Run the tests and confirm they fail for the RIGHT reason (feature missing, not typo/import error).
3. **GREEN**: Write the minimal implementation to make tests pass. Don't over-engineer — just enough to pass.
4. **Verify GREEN**: Run all tests and confirm they pass.
5. **REFACTOR**: Clean up while keeping tests green. Extract helpers, improve names, remove duplication.

If a test passes immediately, the test is wrong — it's not testing new behavior. Fix the test.
```

**Category B (Bug fix) — Full TDD with regression test:**
```
Follow strict test-driven development:

1. **RED**: Write a regression test that reproduces the bug FIRST. The test must fail with the exact bug symptom before the fix.
2. **Verify RED**: Run the test and confirm it fails, reproducing the bug.
3. **GREEN**: Write the minimal fix to make the regression test pass.
4. **Verify GREEN**: Run all tests and confirm they pass — regression test passes AND no existing tests broke.
5. **REFACTOR**: Clean up if needed while keeping tests green.

If existing tests already cover the bug scenario, verify they do and note it — but still confirm they would fail without the fix.
```

**Category C (Test-only) — No TDD:**
```
This issue's deliverable IS test code. TDD does not apply — writing a test-for-a-test adds no value.

Write the tests directly. Follow existing test patterns in the codebase (check nearby test files for conventions).
Run the tests to verify they pass. That's it.
```

**Category D (Refactor) — Green-first:**
```
This is a behavior-preserving refactor. TDD's red-green cycle does not apply — there's no new behavior to test.

1. **Verify GREEN**: Run existing tests and confirm they pass BEFORE making any changes. This is your safety net.
2. **Refactor**: Make the structural change (rename, extract, split, delete).
3. **Verify GREEN**: Run existing tests again and confirm they STILL pass.

If existing tests don't cover the code being refactored, add tests for the current behavior BEFORE refactoring. But don't write a "failing test" — the behavior already exists, so tests should pass immediately.
```

**Category E/F/G (Style/Chore/i18n) — No TDD:**
```
This issue involves formatting, infrastructure, or locale data — no testable application behavior.

Make the change directly. Run type-check and lint to verify nothing broke. No TDD cycle needed.
```

## Phase 5 — Commit & PR

### Pre-commit Validation

Before committing, run these checks in the worktree:

```bash
cd "$WT_PATH"

# 1. File size check — reject if any changed file exceeds 500 lines
git diff --name-only --diff-filter=ACMR origin/master | xargs wc -l | sort -rn | head -20

# 2. Cosmetic trick detection — check diff for line-saving tricks
git diff origin/master -- ':(exclude)*.snap' | grep -E '^\-' | grep -v '^\-\-\-' | grep -vE '(import|export|function|class|interface|type |const |return|if |for |while |switch |case )' | head -40
```

If any file exceeds 500 lines, **STOP**. Send the sub-agent back to do real structural refactoring. Do NOT proceed to commit.

If the diff shows removed blank lines, removed comments, or condensed formatting that doesn't correspond to actual logic changes, **STOP**. This indicates cosmetic tricks were used. Send the sub-agent back to undo them and do real refactoring instead.

### Commit & Push

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

After PR is created/updated and CI is green, **return to the main repo first** — subsequent steps must not run inside the worktree being deleted:

```bash
cd "$REPO_ROOT"
```

Remove the worktree defensively (Windows worktree removal is unreliable):

```bash
git -c safe.directory="$(pwd)" worktree remove "$WT_PATH" --force 2>/dev/null
git -c safe.directory="$(pwd)" worktree prune 2>/dev/null
rm -rf "$WT_PATH" 2>/dev/null
```

Remove the lock file (issue lock or PR lock, depending on how it was acquired). Pass `$SESSION_ID` to verify ownership — prevents accidentally releasing another session's lock:

```bash
scripts/lock.sh release "issue-${ISSUE_NUM}" "$SESSION_ID"
scripts/lock.sh release "pr-${PR_NUMBER}" "$SESSION_ID"
```

Branch stays on remote for CI.

**Always** update `config.md` to remove the worktree entry from `active_worktrees`, even if removal partially failed. Only remove entries matching `${SESSION_ID}` — never clear entries belonging to other sessions.

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
- **gh CLI failures** — any `gh` command that failed (wrong flag, missing subcommand, etc.):
  1. Fix the command in THIS file
  2. **Search ALL other `.claude/commands/*.md` files for the same broken pattern** — if a `gh` command fails here, it fails everywhere
  3. Add the workaround to `.claude/commands/_shared/github-operations.md` "Known workarounds" table
  4. Propagate the fix to every file that uses the broken pattern

## Important Rules

- **Concurrent instance coordination** — extract session GUID in Phase 0; acquire atomic lock via `scripts/lock.sh` in Phase 1 (PR maintenance) and Phase 2 (new issues); verify lock via `scripts/lock.sh exists` in Phase 3; release lock via `scripts/lock.sh release` in Phase 7. Never pick an issue or PR whose lock file exists and is not stale.
- **Never implement code directly** — always delegate to `/lead` and specialist agents
- **Never modify the main repo directory** — all work in worktree
- **Single-commit rule** — squash to exactly one commit before pushing; CI fix commits must be amended into the original, not pushed separately
- **Targeted validation only** — don't run full test suite for narrow changes
- **CI is a hard gate** — wait for all CI checks to pass before cleanup/report; fix failures immediately, do not defer
- **Run type-check locally** — always run `pnpm -s type-check` in the worktree before pushing; CI type errors are the most common failure mode
- **Stop after one issue** — handle one issue per run
- **PR title must include issue number** and use closing keyword `Closes #N`
- **Systematic CI debugging** — follow the 4-phase debugging process for CI failures (root cause → pattern analysis → hypothesis → implement); no guess-and-fix
- **No cosmetic line-saving** — if a file exceeds 500 lines, do REAL structural refactoring (decompose by responsibility), never cosmetic tricks (remove blank lines, condense comments, compress formatting). The pre-commit validation in Phase 5 will reject cosmetic changes.
- **Conditional TDD** — classify every issue into a TDD category (A/B/C/D/E_F_G) in Phase 2; apply full TDD only for features (A) and bug fixes (B); use green-first for refactors (D); skip TDD for test-only (C), style, chore, and i18n changes (E/F/G). Forcing TDD on non-applicable categories causes artificial tests, backwards workflows, and wasted agent context.
