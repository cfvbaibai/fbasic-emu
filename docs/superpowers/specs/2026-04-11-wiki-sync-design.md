# Wiki Sync: Auto-publish Dev Stories to GitHub Wiki

**Date:** 2026-04-11
**Status:** Approved

## Problem

Dev stories live in `dev-stories/` in the main repo but have no public-facing presence. Publishing them manually to the GitHub Wiki is error-prone and easy to forget.

## Solution

A GitHub Actions workflow that automatically syncs dev stories to the GitHub Wiki on every push to master that changes `dev-stories/**/*.md`. Stories are copied as-is (they're already well-formatted markdown), and a Home page + sidebar are auto-generated from story metadata.

## Approach

**PAT-Based Direct Push.** A GitHub Classic PAT (stored as `WIKI_TOKEN` secret) authenticates a push to the wiki's git repo (`cfvbaibai/fbasic-ide.wiki.git`). This is the standard approach for wiki automation — fine-grained PATs don't support wiki repos.

## Design

### 1. Workflow Trigger & Authentication

- **Trigger:** Push to `master` when any `dev-stories/**/*.md` file changes.
- **Authentication:** Classic PAT with `repo` scope, stored as `WIKI_TOKEN` repo secret.
- **Wiki clone URL:** `https://x-access-token:${WIKI_TOKEN}@github.com/cfvbaibai/fbasic-ide.wiki.git`
- **Shallow clone** (depth 1) for speed.

### 2. Story Processing

- **Parse frontmatter:** Stories use bold-text format (`**Date:**`, `**Duration:**`, `**Result:**`), not YAML. Extracted via regex.
- **Copy as-is:** Stories are already well-formatted markdown. No content transformation needed.
- **Wiki naming:** Files are copied without `.md` extension (wiki convention): `the-147-second-mystery.md` becomes `The-147-Second-Mystery`.
- **Deletion detection:** Stories removed from `dev-stories/` are deleted from the wiki.
- **No-op detection:** If nothing changed, the script exits without pushing.

### 3. Home Page & Sidebar

**Home.md** — rebuilt from scratch on every sync:

- Stories grouped by month (descending), newest-first within each month.
- Each entry links to the wiki page and shows the `Result` line as a teaser.
- Footer note: "Stories are auto-synced from the main repository via GitHub Actions."

**_Sidebar.md** — persistent wiki navigation panel:

- Links to Home and all stories, grouped by month.
- Mirrors the Home page structure in compact form.

Both generated from the same parsed metadata.

### 4. Implementation Structure

```
scripts/
  sync-wiki.sh              # Main sync script

.github/
  workflows/
    sync-wiki.yml           # GitHub Actions workflow
```

**sync-wiki.sh** — single Bash script:

1. Clone wiki repo to temp directory (shallow clone, depth 1)
2. Compare `dev-stories/` against wiki clone to find new/modified/deleted stories
3. Copy new/modified stories, strip `.md` extension
4. Delete removed stories from wiki clone
5. Parse all story frontmatter, generate `Home.md` + `_Sidebar.md`
6. Commit and push if changes exist; no-op otherwise

**sync-wiki.yml** — minimal workflow:

- Single job, single step (calls `sync-wiki.sh`)
- No `pnpm install` or build steps — only touches markdown files

### 5. Edge Cases

- **Deleted stories:** Detected via diff, corresponding wiki page removed, Home/Sidebar regenerated.
- **Renamed stories:** Git sees rename as delete + add. Handled naturally by the script.
- **Wiki concurrent edits:** Script does `git pull --rebase` before pushing. If rebase fails (genuine conflict), workflow fails with a clear error for manual resolution.
- **First run on empty wiki:** Clone creates repo fresh, first sync populates everything.

### 6. One-time Setup

After merging:
1. Create a GitHub Classic PAT with `repo` scope
2. Add as repository secret named `WIKI_TOKEN`
3. Push any dev story to trigger first sync
