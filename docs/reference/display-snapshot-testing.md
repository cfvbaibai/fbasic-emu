# Display Snapshot Testing

Deterministic screen-content testing for canvas rendering without OCR.

## Why

Canvas screenshots + OCR are lossy for F-BASIC:

- text recognition can drift with font/rendering differences
- sprite layers are hard to decode from pixels
- tiny visual differences create flaky comparisons

This project uses the shared display buffer as the source of truth.

## Source of truth

Snapshot data is read from `SharedDisplayBufferAccessor` and includes:

- screen chars (`28 x 24`)
- color patterns (`28 x 24`)
- cursor (`x`, `y`)
- scalar state (`bgPalette`, `spritePalette`, `backdropColor`, `cgenMode`)
- sprite slots (`0..7`) with position/visibility/frame/move fields
- sequence number

Schema lives in:

- `test/integration/displaySnapshotTestUtils.ts` (`DisplaySnapshotV1`)

## Tests

Main integration test:

- `test/integration/SampleDisplaySnapshot.test.ts`

Fixture directory:

- `test/fixtures/display-snapshots/`

Current fixture-backed deterministic samples:

- `hello`
- `basic`
- `variables`
- `screen`
- `screenFill`
- `spriteBasic`

Interactive checkpoint sample:

- `joystick` (deterministic input checkpoint via queued `STRIG` event)

## Run

```bash
npm run test:display-snapshots
```

## Update fixtures

PowerShell:

```powershell
$env:UPDATE_DISPLAY_SNAPSHOTS='1'
npm run test:display-snapshots
```

Bash:

```bash
UPDATE_DISPLAY_SNAPSHOTS=1 npm run test:display-snapshots
```

Only update fixtures when behavior change is intentional.

## Determinism rules

- wait for sequence stabilization before capture
- prefer terminating samples for golden fixtures
- for interactive samples, use explicit input checkpoints first
- keep timed `stop()` as fallback for truly non-terminating loops
- avoid random/input-heavy/race-prone samples in fixture set unless checkpointed
