# Self-Improvement Protocol

Every automation command MUST execute this phase at the end of each run. This is not optional.

## Review

Answer these questions about the run that just completed:

1. **Problems** — What went wrong? (auth failures, wrong issues picked, poor analysis, label errors, CI surprises, etc.)
2. **Solutions** — How did we work around each problem?
3. **Missed steps** — Were there phases where we deviated from the documented flow? Why?

## Improve

Read the current command definition (the `.claude/commands/<name>.md` file that was just executed).

For each problem identified:

- **One-time workaround** — Note it in the run log only
- **Recurring pattern** — Update the command definition to handle it automatically:
  - Add missing checks or steps to existing phases
  - Add edge-case handling instructions
  - Strengthen instructions that were ignored or misunderstood
  - Remove instructions that caused confusion or unnecessary work

Keep the command definition concise — only add what prevents the same problem. Do not add speculative "what-if" handling for things that haven't happened.

### gh CLI Failure Propagation

When a `gh` command fails with a wrong flag, missing subcommand, or version incompatibility:

1. **Fix the command in the current command file** — replace with the working alternative
2. **Search ALL command files for the same broken pattern** — the same `gh` version runs every command, so if `gh issue comment list --limit` fails in `triage-issues.md`, it also fails in `implement-issue.md`:
   ```bash
   grep -rn "<broken-pattern>" .claude/commands/
   ```
3. **Fix every occurrence** — not just the file where the failure was observed
4. **Add the workaround** to `.claude/commands/_shared/github-operations.md` "Known workarounds" table so future commands avoid the broken pattern entirely
5. **Never retry the same failing command** — this is the #1 gh CLI failure loop. If a command fails, adapt immediately.

**Scope**: Update only the specific command being run. Only modify shared docs (`.claude/commands/_shared/`) if the improvement applies to all commands.

## Commit & Push

If the Improve step modified any command definition (`.claude/commands/<name>.md`) or shared doc (`.claude/commands/_shared/*.md`):

1. Stage only the changed `.claude/commands/` files
2. Commit with: `chore: improve <command-name> self-improvement — <brief summary>`
3. Push to `origin/master`

Do NOT push unrelated unstaged changes. If the working tree has other modifications, stage only the command files explicitly.

If no command definitions were modified, skip this step.

## Record

Append to `.automation/memory/improvements.md`:

```markdown
## YYYY-MM-DD
- **Command**: <discover-issues | triage-issues | implement-issue>
- **Problem**: <what went wrong>
- **Fix applied**: <what changed in the command>
- **Phase affected**: <which phase>
```

## Coverage Tracking (discover-issues only)

Program test coverage tracking is handled directly in `discover-issues.md` Phase 6.
