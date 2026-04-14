# Triage Issues

Analyze unlabeled open GitHub issues, classify them, and apply priority/type labels. Follows the same automation conventions as discover-issues and implement-issue.

## References

- Prerequisites & config: `.claude/commands/_shared/automation-conventions.md`
- Paths: `.claude/commands/_shared/path-conventions.md`
- GitHub ops: `.claude/commands/_shared/github-operations.md`
- Self-improvement: `.claude/commands/_shared/self-improvement-protocol.md`

## Phase 1 — Prerequisites

Follow `.claude/commands/_shared/automation-conventions.md` prerequisites.

Read config from `.automation/config.md` to get `last_triage_run` for delta detection.

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

### Tertiary: TOO COMPLEX check (always runs)
Regardless of label status, scan ALL open issues for "TOO COMPLEX" comments:

```bash
# NOTE: use gh api instead of gh issue comment list (which lacks --limit support in some gh versions)
REPO=$(gh repo view --json nameWithOwner --jq '.nameWithOwner')
gh issue list --state open --json number --limit 50 --jq '.[].number' | while read N; do
  gh api "repos/$REPO/issues/$N/comments?per_page=10" --jq '.[].body' 2>/dev/null | grep -q "TOO COMPLEX" && echo "$N"
done
```

Collect all issue numbers with TOO COMPLEX markers. These need decomposition even if already labeled. Do NOT skip them.

### Quaternary: TOO COMPLEX parent cleanup (always runs)
For each open issue that was previously decomposed (has closed sub-issues matching "Step N of M for #<parent>"), check if ALL its sub-issues are closed:

```bash
# For each open issue with TOO COMPLEX, find and check its sub-issues
PARENT_N=<number>
gh issue list --state all --search "for #$PARENT_N" --json number,state --limit 20 --jq '.[] | "\(.number) \(.state)"'
```

If all sub-issues are CLOSED, close the parent with a completion comment:

```bash
gh issue comment $PARENT_N --body "All sub-issues have been resolved. Closing parent."
gh issue close $PARENT_N
```

Note in the report under "Parents Closed (all sub-issues resolved)".

If all open issues have priority labels, none were recently updated, AND none have TOO COMPLEX markers, report "all triaged" and stop.

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

### Dependency Check
If issue A clearly depends on another issue B (e.g., A cannot be implemented until B is resolved), add a dependency comment to issue A:

```bash
gh issue comment $NUMBER --body "This issue depends on #B — it cannot be implemented until #B is resolved."
```

Note dependencies in the report under "Issue Dependencies Found".

### Complex Issue Decomposition
For each issue identified in Phase 2's TOO COMPLEX check, decompose it into smaller, independently-implementable sub-issues. This is the **triager's duty**, not the discoverer's. This step runs even for issues that already have priority/type labels.

**Steps:**
1. Read the implementer's comment to get the suggested split
2. Create focused sub-issues, each covering one logical step or subsystem
3. Title each sub-issue: `<type>: <focused action> — Step N of M for #<parent>`
   - Type should match the parent (use `feat:` or `fix:` based on context, default to `enhancement` for new features)
4. Body of each sub-issue must include: `Parent: #<N>` and a brief description of scope
5. Label each sub-issue: `enhancement` (or parent's type), `p3`, `claude-automation`
6. **Keep the parent issue open** — do not close it
7. Note the sub-issues in the report under "Complex Issues Decomposed"

**Sub-issue filing example:**
```bash
gh issue create --title "feat: add BGPLAY parser statement (grammar only) — Step 1 of 5 for #179" \
  --body "Parent: #179

Implements the grammar rule for the BGPLAY statement. No execution semantics." \
  --label "enhancement" --label "p3" --label "claude-automation"
```

**Rules:**
- Only file sub-issues if the implementer explicitly marked the parent as TOO COMPLEX
- Each sub-issue must be independently implementable (no cross-step dependencies unless clearly declared)
- Default to enhancement + p3 unless a sub-issue clearly warrants a different type/priority
- Do not attempt to estimate implementation order beyond what the implementer suggested
- The 20 open issue cap (see `.claude/commands/_shared/github-operations.md`) does NOT apply to sub-issue creation — decomposing a TOO COMPLEX issue always takes priority over the cap

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

## Phase 4b — Dependency Deadlock Detection (always runs)

Sub-issues can declare dependencies on other sub-issues or parent steps, creating circular dependency chains that block entire epics. Detect and resolve these.

### Build the dependency graph

For every open issue, extract `Depends on #N` references from the issue body. Also infer parent-child blocking: a parent cannot close until all its open sub-issues are resolved.

```bash
# Collect dependency declarations from all open issues
gh issue list --state open --json number,body --limit 50 | python3 -c "
import json, sys, re
data = json.load(sys.stdin)
for issue in data:
    body = issue.get('body') or ''
    for line in body.split('\n'):
        if re.search(r'depends?\s+on', line, re.IGNORECASE):
            deps = re.findall(r'#(\d+)', line)
            for d in deps:
                if int(d) != issue['number']:
                    print(f'{issue[\"number\"]} -> {d}')
"
```

### Detect cycles

Walk the graph looking for cycles. A cycle means a deadlock: no issue in the cycle can proceed.

**Common deadlock pattern:** Sub-issue of parent A depends on sub-issue of parent A (or parent A's other steps). Example:

```
#631 (Step 2 of #538) → #772 (Step 2b of #631) → #632 (Step 3 of #538) → #631
```

### Resolve deadlocks

For each cycle found:

1. **Identify the weakest link** — the dependency that is least justified. Common cases:
   - Sub-issue depends on a sibling step's *implementation*, but only needs its *interface/type* (can be defined independently)
   - Sub-issue depends on a parent step that only exists to coordinate, not to provide output
2. **Edit the dependency comment** to remove the circular dependency declaration. Find the comment that declared the removable dependency and rewrite it so it no longer matches implement-issue's dependency grep patterns (`depends on`, `dependency:`, `blocked by`):

```bash
# Find the comment ID that declares the dependency on #X (the weakest link)
COMMENT_ID=$(gh api "repos/$REPO/issues/$NUMBER/comments?per_page=20" \
  --jq '.[] | select(.body | test("depends on #X"; "i")) | .id' | head -1)

# Edit the comment to remove the dependency. The new body must NOT contain
# "depends on", "dependency:", or "blocked by" to avoid false blocking.
gh api -X PATCH "repos/$REPO/issues/comments/$COMMENT_ID" \
  -f body="Dependency on #X removed (deadlock resolution). Reason: [reason]. Updated scope: [new scope]."
```

3. **Note the resolution in the report** under "Dependency Deadlocks Resolved".

### Rules
- Only resolve cycles that actually block implementation (not theoretical)
- Prefer the minimal change — remove one dependency per cycle, not multiple
- If no clean resolution exists (both dependencies are genuinely needed), **merge the deadlocked issues** into a single issue. Pick the lower-numbered issue as the target, combine both scopes into its body, close the other with a "merged into" comment, and edit any dependency comments on the surviving issue to remove the now-self-referencing dependency:
  ```bash
  TARGET=<lower issue number>
  SOURCE=<higher issue number>

  # Read both bodies
  TARGET_BODY=$(gh issue view $TARGET --json body --jq '.body')
  SOURCE_BODY=$(gh issue view $SOURCE --json body --jq '.body')
  SOURCE_TITLE=$(gh issue view $SOURCE --json title --jq '.title')

  # Append source scope to target body
  gh issue edit $TARGET --body "$TARGET_BODY

  ---
  Merged from #$SOURCE: $SOURCE_TITLE

  $SOURCE_BODY"

  # Close source with merge comment
  gh issue comment $SOURCE --body "Merged into #$TARGET — deadlock between #$TARGET and #$SOURCE could not be resolved by removing a single dependency. Combined scope into #$TARGET."
  gh issue close $SOURCE

  # Edit dependency comments on target to remove self-reference
  COMMENT_ID=$(gh api "repos/$REPO/issues/$TARGET/comments?per_page=20" \
    --jq ".[] | select(.body | test(\"depends on #$SOURCE\"; \"i\")) | .id" | head -1)
  if [ -n "$COMMENT_ID" ]; then
    gh api -X PATCH "repos/$REPO/issues/comments/$COMMENT_ID" \
      -f body="Dependency on #$SOURCE removed (merged into this issue)."
  fi
  ```

## Phase 5 — Report

Write outputs following `.claude/commands/_shared/path-conventions.md`:

**Run log** — `.automation/memory/runs/YYYY-MM/YYYY-MM-DD-NNN.md`

**Report** — `.automation/reports/YYYY-MM/YYYY-MM-DD.md`:
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

## Issue Dependencies Found
- #A depends on #B — <reason>

## Complex Issues Decomposed
- #N (parent): marked TOO COMPLEX by implementer — filed as:
  - #N+1: <sub-issue title>
  - #N+2: <sub-issue title>
  ...

## Parents Closed (all sub-issues resolved)
- #N: all M sub-issues closed — parent closed with completion comment

## Dependency Deadlocks Resolved
- #A → #B → #C → #A: removed dependency #B → #C (reason: interface-only, no implementation needed)
- #A ↔ #B: merged #B into #A (both dependencies genuine, could not remove singly)

## Summary
- Issues triaged: N
- Issues skipped (already labeled): N
- Potential duplicates: N
- Issue dependencies found: N
- Complex issues decomposed: N
- Parents closed (all sub-issues resolved): N
- Dependency deadlocks resolved: N
```

**Update config** — increment `total_runs`, `total_issues_triaged`, update `last_triage_run`.

Print summary to user with triaged issue links. When outputting messages (especially in loop contexts), prefix with Asia/Shanghai timestamp:
```
[YYYY-MM-DD HH:MM:SS CST] <message>
```

## Phase 6 — Self-Improvement

Follow `.claude/commands/_shared/self-improvement-protocol.md`.

Focus on:
- Were priority assignments accurate? Any P1/P2 that should have been P3 or vice versa?
- Were type classifications correct?
- Were there issues we couldn't classify confidently?
- Did we miss any duplicate relationships?
- For decomposed "TOO COMPLEX" issues: were sub-issues well-scoped and independently implementable?
- Were dependency deadlocks detected? Did resolution comments correctly break cycles without side effects?
