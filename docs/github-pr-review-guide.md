# GitHub PR Review Guide

This guide covers the GitHub PR review workflow for the F-BASIC IDE repository.

## Listing Open PRs

```bash
gh pr list --state open --json number,title,author,files,additions,deletions,labels
```

## Getting PR Details

```bash
gh pr view <number> --json title,body,files,additions,deletions
gh pr diff <number>
```

## Submitting Reviews

### For Your Own PRs

GitHub does not allow self-approval. Use comments to document review decisions:

```bash
gh pr comment <number> --body "## Review: APPROVE

### Summary
Brief description of what was reviewed.

### Key Findings
- Finding 1
- Finding 2

🤖 Reviewed by Claude Code"
```

### For Others' PRs

Use formal review actions:

```bash
gh pr review <number> --approve --body "Review comment..."
gh pr review <number> --request-changes --body "Issues found..."
gh pr review <number> --comment --body "General feedback..."
```

## Review Verdicts

| Verdict | When to Use |
|---------|-------------|
| **APPROVE** | Code is correct, follows conventions, tests pass |
| **REQUEST CHANGES** | Critical issues found that must be fixed before merge |
| **NEEDS DISCUSSION** | Design decisions or requirements need clarification |

## Closing PRs with Wrong Requirements

If a PR is based on an incorrect requirement, close with explanation:

```bash
gh pr close <number> --comment "## Closing: <reason>

Explain why the original requirement was incorrect and what the correct behavior should be."
```

Close the associated issue as well:

```bash
gh issue close <number> --comment "Explanation..."
```

## Parallel PR Reviews with Specialists

For reviewing multiple PRs efficiently:

### 1. Create Coordination Team

Tech Lead creates a team with review tasks for each PR.

### 2. Spawn Specialists by Domain

| PR Type | Specialist |
|---------|------------|
| Parser changes | `/parser` |
| Executors, state, evaluation | `/runtime` |
| Sound/music | `/sound` |
| Device adapters | `/device` |
| Animation, sprites | `/graphics` |
| IDE, editor, console | `/ide` |
| Tools (viewer, editor) | `/tools` |

### 3. Collect Results

Each specialist reports one of:
- `APPROVE`
- `REQUEST CHANGES`
- `NEEDS DISCUSSION`

### 4. Post to GitHub

Add review comments to each PR with the verdict and findings.

### 5. Cleanup

Shutdown specialists and delete team when complete.

## Lessons Learned

### 1. Self-Approval Not Allowed

GitHub prevents approving your own PRs. Use `gh pr comment` to document review decisions instead of `gh pr review --approve`.

### 2. Requirements Can Be Wrong

Always validate the requirement before implementing. If a PR is based on incorrect assumptions:

- Close the PR with a clear explanation
- Close the associated issue
- Document the correct behavior

Example: PR #29 proposed STOP/CONT as program statements, but these should be REPL-only in F-BASIC.

### 3. Cross-Platform Scripts

When adding build/validation scripts, handle both environments:

```typescript
const child = process.platform === 'win32'
  ? spawn('cmd.exe', ['/d', '/s', '/c', 'pnpm vite build'])
  : spawn('pnpm', ['vite', 'build'])
```

### 4. Proprietary Assets

Use `local()` for fonts instead of bundled `url()`:

```css
/* Avoid: triggers build warnings for missing assets */
src: url('/fonts/Font.woff2') format('woff2');

/* Prefer: uses locally installed font */
src: local('FontName'), local('Font Name');
```

### 5. REPL-Only Commands

Some F-BASIC commands are REPL-only and should not be allowed as program statements:

- `STOP` - Pause for debugging (REPL command)
- `CONT` - Resume after STOP (REPL command)

These should remain in the parser's REPL-only rejection list.

## Quick Reference

| Command | Purpose |
|---------|---------|
| `gh pr list` | List open PRs |
| `gh pr view <n>` | View PR details |
| `gh pr diff <n>` | Get PR diff |
| `gh pr comment <n>` | Add comment (use for self-approval) |
| `gh pr review <n> --approve` | Approve PR (others only) |
| `gh pr close <n>` | Close PR |
| `gh issue close <n>` | Close issue |
