# GitHub Operations

Shared GitHub CLI patterns for all automation commands.

## Existing Labels

| Label | Purpose |
|-------|---------|
| `bug` | Bug reports |
| `enhancement` | Feature requests |
| `refactor` | Code improvements |
| `documentation` | Doc changes |
| `duplicate` | Duplicate issue/PR |
| `good first issue` | Beginner-friendly |
| `help wanted` | Needs attention |
| `p1` | Critical priority |
| `p2` | High priority |
| `p3` | Low priority |
| `claude-automation` | Created/modified by Claude automation |

## Issue Querying

### All open issues
```bash
gh issue list --state open --json number,title,labels,assignees,body,author,createdAt,updatedAt --limit 50
```

### Issues with specific label
```bash
gh issue list --label triage --state open --json number,title,labels,assignees,body --limit 20
```

### Unassigned issues
```bash
gh issue list --state open --search "no:assignee" --json number,title,labels,body --limit 20
```

### Open issue count
```bash
gh issue list --state open --json number --jq '. | length'
```

### PR listing (for maintenance)
```bash
gh pr list --json number,title,state,headRefName,baseRefName,mergeable,statusCheckRollup,reviews --state OPEN --limit 20
```

## Label Management

### Add labels
```bash
gh issue edit $NUMBER --add-label "label1,label2"
```

### Read current labels on an issue
```bash
gh issue view $NUMBER --json labels --jq '.labels[].name'
```

## Issue Creation

Title format: `<type>: <description>` where type is `bug`, `enhancement`, `refactor`, `docs`, `test`, `chore`.

```bash
gh issue create --title "type: description" \
  --body "$(cat <<'EOF'
## Context
<why this matters>

## Details
<specific finding or request>

## Suggested Approach
<optional: how to fix/implement>
EOF
)" \
  --label "type-label,priority-label,claude-automation"
```

## Open Issue Cap

Threshold: **20 open issues**

```bash
OPEN_COUNT=$(gh issue list --state open --json number --jq '. | length')
if [ "$OPEN_COUNT" -ge 20 ]; then
  echo "CAP_REACHED"
fi
```

When cap is reached, report and stop. Do not create new issues.

## Error Recovery

**When any `gh` command fails, do NOT retry the same command with the same arguments.** This is the most common failure loop — the agent retries an identical failing call multiple times.

### Recovery procedure

1. **Read the error message** — identify whether it's a flag, subcommand, or API error
2. **Try the `gh api` equivalent** — every `gh` command maps to a GitHub REST API endpoint. `gh api` is more stable across versions and supports pagination natively.
3. **If `gh api` works** — continue. Record the fix in self-improvement (Phase 9).
4. **If both fail** — skip the step gracefully. Report in run log. Do NOT stall the pipeline.

### Known workarounds

| Broken command | Error | Working alternative |
|---|---|---|
| `gh issue comment list $N --limit 10` | `unknown flag: --limit` / no `list` subcommand | `gh api "repos/$REPO/issues/$N/comments?per_page=10" --jq '.[].body'` |

Before using any `gh` command, verify the subcommand and flags exist:
```bash
gh <command> <subcommand> --help 2>&1 | head -5
```

### Cross-command propagation

When a `gh` CLI failure is discovered and fixed in one command (e.g., `triage-issues.md`), **search ALL other command files for the same pattern** and fix them too. The same `gh` version runs all commands — if it fails in one, it fails in all.

```bash
# After fixing a gh CLI pattern in one command, check all others
grep -r "<broken-pattern>" .claude/commands/
```
