# Automation Conventions

Shared conventions for all Claude Code automation commands in this project.

## Prerequisites

Every command MUST verify these before starting:

1. **GitHub auth**: `gh auth status` — must be authenticated
2. **Clean working tree**: `git status --porcelain` must be empty

If prerequisites fail, report the specific blocker and stop immediately.

## Config

Location: `.automation/config.md`

Schema:

```markdown
# Automation Config

- last_sync_commit: <git hash>
- last_triage_run: YYYY-MM-DDTHH:MM:SSZ
- total_runs: N
- total_issues_implemented: N
- total_issues_created: N
- total_issues_triaged: N
- total_pr_maintenance: N
- active_worktrees: []  # list of worktree paths currently in use
```

Update relevant counters after each run.

## Timestamp Format

When outputting messages (especially in loop contexts), always include a timestamp in **Asia/Shanghai timezone** (UTC+8):

```
[YYYY-MM-DD HH:MM:SS CST] <message>
```

Get Shanghai time via the cst-time skill script (works on all platforms including Windows Git Bash):
```bash
python3 ~/.claude/skills/cst-time/scripts/cst_time.py
```

This applies to:
- Loop iteration start/end messages
- Status updates printed to user
- Report summaries

## Phase Ordering

Every command follows this structure:

1. **Prerequisites** — auth check, clean tree
2. **Main Work** — command-specific logic
3. **Report** — write run log and summary report
4. **Self-Improvement** — reflect, update command, record improvements (see `.claude/commands/_shared/self-improvement-protocol.md`)
5. **Context Compact** — run `/compact` to compress accumulated context

## Context Compact

After every iteration (all 4 phases above complete), run `/compact` to compress the conversation context. This prevents context window overflow on non-Claude models that have smaller context limits (e.g., 200K vs Claude's 1M). This is critical when commands run via `/loop` since context accumulates across iterations.

## Run Log

Location: `.automation/memory/runs/YYYY-MM/YYYY-MM-DD-NNN.md`

Increment NNN for same-day runs. Template:

```markdown
# Run YYYY-MM-DD-NNN
- Type: <issue-discovery | issue-triage | issue-implementation | pr-maintenance>
- Started: YYYY-MM-DD HH:MM:SS CST (Asia/Shanghai)
- Duration: X min
- Outcome: success | blocked | cap-reached | no-issues
- Issues affected: #N, #N, ...
```

## Report

Location: `.automation/reports/YYYY-MM/YYYY-MM-DD.md`

Each command has its own report schema. Use the date only (not NNN) — append if the file already exists from another command type the same day.
