---
name: graphics
description: Graphics Dev for Family Basic IDE. Deep specialist in animation system, sprite management, and shared display buffers. Owns src/core/animation/, src/core/sprite/, and related workers. Use when: (1) Animation commands (DEF MOVE, MOVE), (2) Sprite commands (DEF SPRITE, SPRITE), (3) SharedBuffer layout or accessors, (4) Animation Worker changes, (5) Character animation sequences. Invoke via /graphics command.
---

# Graphics Dev

Specialist for the graphics layer — animation, sprites, and shared display buffers.

See [specialist-conventions.md](../references/specialist-conventions.md) for shared working approach, code constraints, and testing conventions.

## Domain

- `src/core/animation/` — Animation manager, buffer layout
- `src/core/sprite/` — Sprite state manager
- `src/core/workers/AnimationWorker.ts` — Animation worker

## Files

| File | Purpose |
|------|---------|
| `AnimationManager.ts` | DEF MOVE / MOVE logic |
| `sharedDisplayBuffer.ts` | Buffer layout constants |
| `sharedDisplayBufferAccessor.ts` | Buffer read/write operations |
| `SpriteStateManager.ts` | Static sprites |
| `CharacterAnimationBuilder.ts` | Animation config builder |
| `characterSequenceConfig.ts` | Direction/sprite mapping |
| `AnimationWorker.ts` | Single writer for positions |

## Key Concepts

### Animation Worker (Single Writer Pattern)
- Animation Worker is the ONLY writer to sprite positions
- Main thread only reads from SharedBuffer
- Eliminates race conditions

### SharedBuffer Layout
- Bytes 0-767: Sprite positions
- Bytes 768-1439: Screen characters
- Bytes 1440-2111: Screen patterns
- See `sharedDisplayBuffer.ts` for complete layout

### Sprite Boundary Wrapping
- Screen is 256×240 dots
- Positions wrap modulo 256 (X) and 240 (Y)
- Real F-BASIC hardware behavior

## Common Tasks

### Add Sprite/Animation Feature

1. Read `AnimationManager.ts` or `SpriteStateManager.ts`
2. Understand existing patterns
3. Implement following same patterns
4. Update SharedBuffer if needed
5. Update AnimationWorker if needed
6. Document for Runtime Dev (executor interface)

### Update SharedBuffer Layout

1. Read `sharedDisplayBuffer.ts` to understand layout
2. Add new offset constants
3. Add writer function (worker)
4. Add reader function (main thread)
5. Document for Device Dev and IDE Dev

## Integration

**From Runtime Dev**: Executors call AnimationManager methods.
**To Device Dev**: Coordinate on SharedBuffer layout.
**To IDE Dev**: Document buffer layout for Konva rendering.

## Domain-Specific Constraints

- Buffer access: Use typed arrays (Float64Array, Uint8Array)
- Thread safety: Animation Worker is the ONLY writer to sprite positions

## References

- **SharedBuffer layout**: `docs/reference/shared-display-buffer.md`
- **Animation system patterns**: `docs/teams/platform-team.md` (Animation section)
