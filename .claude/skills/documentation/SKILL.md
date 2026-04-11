---
name: documentation
description: Maintains project documentation quality and consistency for Family Basic IDE. Use when: (1) Creating or updating any files in docs/, (2) Reviewing documentation structure, (3) Fixing stale references or outdated information, (4) Creating CHANGELOG entries, (5) Adding new feature documentation, (6) User asks about documentation standards or improvements.
---

# Documentation

Maintains documentation quality for the Family Basic IDE project.

See [style-guide.md](references/style-guide.md) for writing style, markdown conventions, and file organization patterns.

## Documentation Structure

```
docs/
├── README.md              # Documentation index (needs update)
├── roadmap.md             # Project status and active work
├── debugging-best-practices.md
├── teams/
│   ├── tech-lead.md       # Architecture overview, coordination
│   ├── parser-team.md     # Grammar, Chevrotain, CST
│   ├── runtime-team.md    # Executors, evaluation, state
│   ├── platform-team.md   # Devices, sprites, animation, buffers
│   └── ui-team.md         # Vue 3, IDE, theming
├── reference/
│   ├── worker-messages.md
│   ├── shared-display-buffer.md
│   └── family-basic-manual/
└── idea/                  # Future enhancement ideas
```

## Common Tasks

### Fix Stale Documentation

1. Verify paths in docs match actual file structure
2. Update outdated references (test counts, file limits)
3. Check cross-references work
4. Remove references to deleted/moved files

### Create CHANGELOG Entry

Format: Reverse chronological, grouped by type
```markdown
## 2026-02-20

### Features
- feat: Add X functionality

### Fixes
- fix: Resolve Y issue

### Refactoring
- refactor: Clean up Z

### Documentation
- docs: Update W
```

### Add New Feature Documentation

1. Determine which team owns the feature
2. Update relevant `docs/teams/<team>.md`
3. Update `docs/roadmap.md` if significant feature
4. Add reference docs in `docs/reference/` for complex features

### Create Idea Document

Location: `docs/idea/YYYYMMDD-NNN-brief-description.md`
Include: Problem, Solution, Implementation approach, Priority

## Validation Checklist

- [ ] File paths exist in codebase
- [ ] Cross-references are valid
- [ ] No duplicate information across files
- [ ] Follows existing documentation patterns
- [ ] Code examples compile (if any)
- [ ] Test counts are current (`pnpm test:run | grep "tests"`)

## Known Issues

| Issue | Location | Status |
|-------|----------|--------|
| Stale folder references | `docs/README.md` | References non-existent `guides/`, `analysis/`, `planning/` |
| Missing CHANGELOG | `docs/CHANGELOG.md` | Referenced in roadmap but doesn't exist |
| No idea index | `docs/idea/README.md` | Idea files with no summary |

## Related Resources

- **F-BASIC Reference**: `docs/reference/family-basic-manual/`
- **Team Contexts**: `docs/teams/*.md`
- **Architecture Overview**: `docs/teams/tech-lead.md`
