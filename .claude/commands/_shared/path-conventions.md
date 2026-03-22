# Path Conventions

All automation paths are relative to: `~/.claude/automations/fbasic-ide/`

## Directory Structure

```
~/.claude/automations/fbasic-ide/
├── config.md                    # Shared config (run counts, last sync, etc.)
├── memory/
│   ├── issues/
│   │   ├── issue-{N}.md         # Per-issue memory (implementation tracking)
│   │   └── pr-{N}.md            # Per-PR memory
│   ├── runs/
│   │   └── YYYY-MM/
│   │       └── YYYY-MM-DD-NNN.md  # Run logs (increment NNN per day)
│   └── improvements.md          # Self-improvement history
├── reports/
│   └── YYYY-MM/
│       └── YYYY-MM-DD.md        # Daily reports (one per command type, append if same day)
└── worktrees/
    └── {branch-or-issue-id}/    # Git worktrees for isolated work
```

## Naming Conventions

| Item | Pattern | Example |
|------|---------|---------|
| Issue memory | `issue-{N}.md` | `issue-42.md` |
| PR memory | `pr-{N}.md` | `pr-15.md` |
| Run log | `YYYY-MM-DD-NNN.md` | `2026-03-22-001.md` |
| Report | `YYYY-MM-DD.md` | `2026-03-22.md` |
| Worktree dir | `{branch}` or `{issue-id}` | `fix/issue-42-...` or `42` |
| Branch name | `fix/issue-{N}-slug` or `feat/issue-{N}-slug` | `fix/issue-42-hash-routing` |

## Config Path

```
~/.claude/automations/fbasic-ide/config.md
```

Always read config at the start of each run to get `last_sync_commit`, `last_triage_run`, etc.
Always update config counters at the end of each run.
