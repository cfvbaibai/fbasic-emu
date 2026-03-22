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

**Scope**: Update only the specific command being run. Only modify shared docs (`_shared/`) if the improvement applies to all commands.

## Record

Append to `~/.claude/automations/fbasic-ide/memory/improvements.md`:

```markdown
## YYYY-MM-DD
- **Command**: <discover-issues | triage-issues | implement-issue>
- **Problem**: <what went wrong>
- **Fix applied**: <what changed in the command>
- **Phase affected**: <which phase>
```
