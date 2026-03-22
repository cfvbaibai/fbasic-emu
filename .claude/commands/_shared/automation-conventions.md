# Automation Conventions

Shared conventions for all Claude Code automation commands in this project.

## Prerequisites

Every command MUST verify these before starting:

1. **GitHub auth**: `gh auth status` — must be authenticated
2. **Clean working tree**: `git status --porcelain` must be empty

If prerequisites fail, report the specific blocker and stop immediately.

## Config

Location: `~/.claude/automations/fbasic-ide/config.md`

Schema:

```markdown
# Automation Config

- last_sync_commit: <git hash>
- last_triage_run: YYYY-MM-DDTHH:MM:SSZ
- total_runs: N
- total_issues_implemented: N
- total_issues_discovered: N
- total_issues_triaged: N
- total_pr_maintenance: N
- active_worktrees: []  # list of worktree paths currently in use
```

Update relevant counters after each run.

## Phase Ordering

Every command follows this structure:

1. **Prerequisites** — auth check, clean tree
2. **Main Work** — command-specific logic
3. **Report** — write run log and summary report
4. **Self-Improvement** — reflect, update command, record improvements (see `_shared/self-improvement-protocol.md`)

## Run Log

Location: `~/.claude/automations/fbasic-ide/memory/runs/YYYY-MM/YYYY-MM-DD-NNN.md`

Increment NNN for same-day runs. Template:

```markdown
# Run YYYY-MM-DD-NNN
- Type: <issue-discovery | issue-triage | issue-implementation | pr-maintenance>
- Started: HH:MM
- Duration: X min
- Outcome: success | blocked | cap-reached | no-issues
- Issues affected: #N, #N, ...
```

## Report

Location: `~/.claude/automations/fbasic-ide/reports/YYYY-MM/YYYY-MM-DD.md`

Each command has its own report schema. Use the date only (not NNN) — append if the file already exists from another command type the same day.
