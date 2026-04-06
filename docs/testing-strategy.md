# Testing Strategy

Defines the split-of-concern boundaries between headless Vitest tests and Playwright E2E tests.

## Testing Layers

| Layer | Tool | What to Test | Speed |
|-------|------|-------------|-------|
| **Unit** | Vitest | Individual statements, expressions, state, parsers | Fast |
| **Program integration** | Vitest + headless harness | Full programs, screen state, BG, sprites, input | Medium |
| **IDE UI** | Playwright | Buttons, modals, sample selector, Monaco, toolbar | Slow |
| **Visual/smoke** | Playwright screenshots | Full page rendering, responsive layout | Slow |

## Split-of-Concern

### Headless Vitest Owns (program correctness)

- Runtime logic: statement execution, expression evaluation, control flow
- Screen state: text grid, color patterns, cursor position
- BG data: tile data, VIEW command
- Sprite state: definitions, positions, colors
- Input mocking: STICK, STRIG, INKEY$, INPUT (via `TestDeviceAdapter`)
- Sound: muted in tests (via device adapter)
- Regression safety: verify fixes don't re-break programs

### Playwright E2E Owns (UI chrome only)

- Run/Stop button behavior
- Sample selector: loading, selecting, navigating
- INPUT modal: appearance, field interaction, submit
- Clear/Debug/Input mode toggles
- File operations: New, Open, Save
- Monaco editor: code loading, cursor behavior
- Sprite viewer: open, close, display
- Full page rendering and responsive layout

### What Playwright Must NOT Re-Test

- Program logic already covered by headless tests
- Screen output correctness (headless validates screen state data)
- Runtime error handling (headless catches these)

## Team Ownership

| Team | Responsible For |
|------|----------------|
| **Runtime** | Unit tests (`test/executors/`, `test/evaluation/`), program tests (`test/program/`) |
| **Platform** | Sprite/animation/BG program tests (`test/program/`, `test/animation/`, `test/sprite/`) |
| **IDE** | Playwright E2E (`test/e2e/`), component tests (`test/components/`) |
| **Tools** | Test harness infrastructure, CI pipeline, `/test-program` command |

## CI Pipeline Order

```
PR → unit tests (fast) → program tests (medium) → Playwright E2E (slow, merge gate only)
```

- **Every PR**: unit + program tests
- **Merge to master**: all layers including Playwright E2E

## Headless Harness Components

| Component | File | Purpose |
|-----------|------|---------|
| `TestDeviceAdapter` | `src/core/devices/TestDeviceAdapter.ts` | Mocks all I/O |
| `SharedBufferTestAdapter` | `test/adapters/SharedBufferTestAdapter.ts` | Tracks screen buffer state |
| `captureDisplaySnapshotV1()` | `test/integration/displaySnapshotTestUtils.ts` | Captures full screen state |
| `expectDisplaySnapshotToMatchFixture()` | same | Compares against JSON fixtures |
| Display snapshot fixtures | `test/fixtures/display-snapshots/` | Expected screen states |

## Program Test Location

- **Directory**: `test/program/`
- **Naming**: `<sample-key>.test.ts` (matches sample program key)
- **Coverage tracked**: `src/core/samples/programs/**/*.bas` vs `test/program/**/*.test.ts`

## Testing Issue Template

When creating issues for test gaps, use this format:

```
## Type
- [ ] Unit test gap
- [ ] Program test gap
- [ ] UI/E2E test gap

## Scope
Source file / Sample program / UI component: <path>
Testing layer: Runtime | Platform | IDE

## What's Missing
<specific test case or scenario not covered>

## Approach
<how to test it — which harness, what to assert>
```

## Bug Fix Testing Rule

When fixing a runtime bug, always add a headless regression test. When fixing a UI bug, always add a Playwright test. If a bug spans both layers, split into two test files.
