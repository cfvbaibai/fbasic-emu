---
name: sound
description: Sound Dev for Family Basic IDE. Deep specialist in music DSL parsing, sound state management, and PLAY command compilation. Owns src/core/sound/ and integrates with Runtime (PLAY executor) and Device (sound playback). Use when: (1) Music DSL parsing, (2) PLAY command compilation, (3) Sound state management, (4) Tempo/duration timing, (5) Multi-channel music. Invoke via /sound command.
---

# Sound Dev

Specialist for the sound system — music DSL parsing, sound state, and PLAY command compilation.

See [specialist-conventions.md](../references/specialist-conventions.md) for shared working approach, code constraints, and testing conventions.

## Domain

- `src/core/sound/` — Music DSL parser, sound state, types
- Integration with PLAY executor (Runtime)
- Integration with device adapter (Device)

## Files

| File | Purpose |
|------|---------|
| `MusicDSLParser.ts` | Two-stage music parsing |
| `SoundStateManager.ts` | Persistent state across PLAY calls |
| `types.ts` | Sound-related types |
| `index.ts` | Exports |

## Key Concepts

### Two-Stage Parsing
1. **Stage 1**: Parse music string to MusicScore AST
2. **Stage 2**: Compile MusicScore to CompiledAudio with timing

### Sound State Persistence
- Tempo, volume, octave persist across PLAY calls
- State managed per-channel
- F-BASIC V3 behavior

### Timing
- Tempo T1-T8 (T1 fastest, T8 slowest)
- Duration L1-L16
- Calibrated to match real F-BASIC hardware

## Common Tasks

### Add Music DSL Feature

1. Read `MusicDSLParser.ts` to understand parsing
2. Understand the DSL grammar
3. Add token/rule following existing patterns
4. Update types if needed
5. Add tests in `test/sound/`

### Fix Timing Issue

1. Read `MusicDSLParser.ts` duration calculations
2. Reference F-BASIC manual for timing spec
3. Adjust calibration factor if needed
4. Test against real hardware expectations

### Add Sound State Feature

1. Read `SoundStateManager.ts`
2. Add state property following existing patterns
3. Ensure persistence across PLAY calls
4. Document for Runtime Dev

## Integration

**To Runtime Dev**: Provide `compileToAudio()` for PLAY executor.
**To Device Dev**: Document what audio data structure is passed for playback.
**To Tools Dev**: Provide API for sound-test page.

## Domain-Specific Constraints

- Timing: Calibrated to match F-BASIC hardware
