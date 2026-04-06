# Platform Team

## Ownership
- **Files**:
  - `src/core/animation/*`
  - `src/core/sprite/*`
  - `src/core/devices/*`
  - `src/core/workers/AnimationWorker.ts`
  - `src/core/workers/animation-worker.ts`
  - `src/features/ide/composables/useAnimationWorker.ts`
  - `src/features/ide/composables/useScreenAnimationLoopRenderOnly.ts`
  - `test/animation/*`
  - `test/sprite/*`
- **Responsibilities**: Device adapters, sprite system, animation, shared buffers, screen/joystick I/O, Animation Worker

## Architecture

### Device System Overview
```
┌─────────────────────────────────────────┐
│  BasicDeviceAdapter Interface           │
│  (Platform-agnostic I/O contract)       │
└─────────────────────────────────────────┘
         │
         ├─ WebWorkerDeviceAdapter (worker side)
         └─ Main Thread (Konva rendering)
              ↕
         SharedArrayBuffer (sprite positions)
```

### Multi-Layer Screen System
- **Background Screen** (28×24 characters) - All PRINT output
- **Sprite Screen** (Front/Back, 256×240 dots) - 8 sprite slots
- **Backdrop Screen** (32×30 characters)
- **BG GRAPHIC Screen** (28×21 characters)

### Key Pattern: Worker + SharedBuffer
- **Worker side**: Holds state, executes commands, writes to buffer
- **Main thread**: Reads buffer, renders with Konva (60fps via RAF)

## Core Interfaces

### BasicDeviceAdapter
```typescript
interface BasicDeviceAdapter {
  // Screen output
  printOutput(text: string): void
  clearScreen(): void
  setCursorPosition(x: number, y: number): void

  // Joystick input (polling)
  getStickState(joystickId: number): number
  consumeStrigState(joystickId: number): number

  // Sprite commands (queued)
  getSpritePosition(actionNumber: number): { x: number; y: number } | null
}
```

### SharedDisplayBuffer Layout
```
Bytes 0-767:    Sprite positions (8 sprites × 12 floats × 8 bytes)
Bytes 768-1439: Screen characters (672 cells)
Bytes 1440-2111: Screen patterns (672 cells)
Bytes 2112-2113: Cursor (2 bytes)
Bytes 2116-2119: Sequence (4 bytes)
Bytes 2120-2123: Scalars (4 bytes)
Bytes 2124-2127: Padding (4 bytes)
Bytes 2128-2199: Animation sync (72 bytes)
Total:          2200 bytes
```

See `docs/reference/shared-display-buffer.md` for complete layout.

### Shared Joystick Buffer Layout
```typescript
// Shared joystick state (main thread writes, workers read)
const JOYSTICK_BUFFER_BYTES = 2 × 2 × 8  // 2 joysticks × 2 fields × 8 bytes

interface JoystickBufferView {
  stickState: Float64Array   // [stick0, stick1]
  strigState: Float64Array   // [strig0, strig1]
}
```

**Files:**
- `src/core/devices/sharedJoystickBuffer.ts` - Buffer creation and access functions

## Animation System

### Architecture (Single Writer Pattern)
```
┌─────────────────────────────────────────────────────────────────┐
│                   Animation Worker (Single Writer)              │
│  - Receives START_MOVEMENT, STOP_MOVEMENT, ERASE_MOVEMENT      │
│  - Calculates positions (x += dx * speed * dt)                 │
│  - Handles screen wrapping (modulo 256×240)                   │
│  - Manages movement lifecycle (isActive, remainingDistance)    │
│  - Writes positions to shared buffer (ONLY writer)             │
│  - Runs at fixed 60Hz tick rate                               │
└────────────────────────────┬────────────────────────────────────┘
                             │ postMessage
                             ▼
                      ┌──────────────┐
                      │ Shared Buffer │
                      │  XPOS, YPOS  │
                      └──────────────┘
                             │ read
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                   Main Thread (Render-Only)                    │
│  - Reads positions from shared buffer                         │
│  - Updates Konva nodes for rendering                          │
│  - NO position calculation (delegated to Animation Worker)    │
└─────────────────────────────────────────────────────────────────┘
```

### Key Files
**Animation Worker:**
- `src/core/workers/AnimationWorker.ts` - Single writer for sprite positions
- `src/core/workers/animation-worker.ts` - Worker entry point
- `src/features/ide/composables/useAnimationWorker.ts` - Worker lifecycle manager
- `src/core/devices/sharedJoystickBuffer.ts` - Shared joystick state

**Animation Manager (Executor Worker):**
- `AnimationManager.ts` - DEF MOVE / MOVE commands, 8 action slots
- `CharacterAnimationBuilder.ts` - Builds animation configs from CHARACTER_SPRITES
- `characterSequenceConfig.ts` - Direction/sprite mapping per character (0-15)

**Shared Buffers:**
- `sharedDisplayBuffer.ts` - Buffer layout constants and factory functions (2200 bytes)
- `sharedDisplayBufferAccessor.ts` - All buffer operations (screen, sprite, sync, Atomics)

**Main Thread:**
- `useScreenAnimationLoopRenderOnly.ts` - Render-only animation loop

### Commands
- `DEF SPRITE` - Define static sprite
- `SPRITE` - Place static sprite
- `DEF MOVE` - Define movement pattern
- `MOVE` - Execute movement pattern
- `POSITION` - Set sprite position
- `CUT` - Hide sprite
- `ERA` - Clear movement slot

### MOVE sprite boundary wrapping (real-machine confirmed)
On real F-BASIC hardware, when a MOVE sprite reaches a screen edge and keeps moving, it **wraps** to the opposite side:
- Right edge → reappears on left
- Left edge → reappears on right
- Bottom edge → reappears on top
- Top edge → reappears on bottom

Sprite screen is 256×240 dots (X: 0–255, Y: 0–239). Position wraps modulo 256 (X) and 240 (Y).

When a sprite is **crossing** an edge (e.g. moving right past x=255), the real machine can show the sprite **split**: e.g. left half of Mario on the right edge and right half on the left edge. The emulator currently implements wrap-only (single draw at wrapped position); split rendering is a possible future enhancement.

## Sprite System

### Two Types of Sprites

**Static Sprites** (SpriteStateManager):
- 8 slots
- No animation
- Executors: `DefSpriteExecutor`, `SpriteExecutor`, `SpriteOnOffExecutor`

**Animated Sprites** (AnimationManager):
- 8 action slots
- Movement patterns
- Executors: `DefMoveExecutor`, `MoveExecutor`, `CutExecutor`, `EraExecutor`, `PositionExecutor`

### Character Animation Frames
- Each character (0-15) has directional sprites
- Defined in `characterSequenceConfig.ts`
- Built by `CharacterAnimationBuilder`

## Joystick System

### F-BASIC v3 Spec
- `STICK(n)` - Cross-button bitmask: 1=right, 2=left, 4=down, 8=top
- `STRIG(n)` - Action button bitmask: 1=start, 2=select, 4=B, 8=A
- Supports 0-3 joystick IDs (4 joysticks max)

### Implementation
- Browser Gamepad API
- Polling-based (not frame-synchronized)
- Provided via `BasicDeviceAdapter`

## Common Tasks

### Add New Device Method

1. **Update interface** in `BasicDeviceAdapter.ts`:
   ```typescript
   interface BasicDeviceAdapter {
     // ... existing methods
     drawCircle(x: number, y: number, radius: number): void
   }
   ```

2. **Implement in worker adapter** (`WebWorkerDeviceAdapter.ts`):
   ```typescript
   drawCircle(x: number, y: number, radius: number): void {
     this.postMessage({
       type: 'DRAW_CIRCLE',
       payload: { x, y, radius }
     })
   }
   ```

3. **Handle in main thread** (UI team integrates):
   - Add message handler
   - Implement Konva rendering

4. **Hand off to Runtime Team** to use in executors

### Add New Sprite Command

1. **Update AnimationManager** or **SpriteStateManager**:
   ```typescript
   // In AnimationManager.ts
   public newCommand(params: CommandParams): void {
     // Update state
     // Write to shared buffer if needed
   }
   ```

2. **Create executor** (Runtime Team):
   - Executor calls `AnimationManager.newCommand()`

3. **Add tests**:
   - Test state updates
   - Test buffer writes

### Extend SharedBuffer Layout

To extend the buffer with new sections:

1. **Update** `sharedDisplayBuffer.ts`:
   ```typescript
   export const BUFFER_LAYOUT = {
     // ... existing offsets
     NEW_SECTION_OFFSET: 2200,  // SHARED_DISPLAY_BUFFER_BYTES (current end)
     NEW_SECTION_SIZE: 32,
   }
   ```

2. **Update writer** (worker side):
   ```typescript
   function writeNewSection(buffer: SharedArrayBuffer, data: number[]) {
     const view = new Float64Array(buffer, BUFFER_LAYOUT.NEW_SECTION_OFFSET)
     // Write data
   }
   ```

3. **Update reader** (main thread, UI team):
   ```typescript
   function readNewSection(buffer: SharedArrayBuffer) {
     const view = new Float64Array(buffer, BUFFER_LAYOUT.NEW_SECTION_OFFSET)
     // Read data
   }
   ```

## Integration Points

### Provides to Runtime Team
- **BasicDeviceAdapter** interface for I/O
- **AnimationManager** for sprite commands
- **SpriteStateManager** for static sprites

### Provides to UI Team
- **SharedArrayBuffer** layout and updates
- **Device message types** for rendering

### Uses from Runtime Team
- **Executor calls** to device adapter methods
- **Command execution** triggers state updates

## Patterns & Conventions

### Animation Worker (Single Writer Pattern)
The Animation Worker is the **single writer** to the shared animation buffer. This eliminates race conditions and ensures consistent sprite positions.

**Why:**
- Previous architecture had multiple writers (main thread position calculation + message queue updates)
- This caused race conditions → sprite teleportation bugs
- Single writer guarantees data consistency

**How:**
- Executor Worker sends commands via `AnimationWorkerCommand` (START_MOVEMENT, STOP_MOVEMENT, ERASE_MOVEMENT, SET_POSITION)
- Animation Worker processes commands and writes to shared buffer
- Main thread reads from shared buffer for rendering only

### Worker State Management
```typescript
// Animation Worker: State lives in AnimationWorker class
class AnimationWorker {
  private movementStates: Map<number, WorkerMovementState> = new Map()
  private sharedAnimationView: Float64Array | null = null

  private tick(deltaTime: number): void {
    // Calculate new positions: x += dx * speed * dt
    // Write to shared buffer (SINGLE WRITER)
    writeSpriteState(this.sharedAnimationView, actionNumber, x, y, isActive)
  }
}

// Executor Worker: AnimationManager holds definitions
class AnimationManager {
  private moveDefinitions: Map<number, MoveDefinition> = new Map()

  public startMovement(actionNumber: number, startX: number, startY: number): void {
    // Send command to Animation Worker
    this.deviceAdapter.sendAnimationWorkerCommand({
      type: 'START_MOVEMENT',
      actionNumber,
      definition: this.moveDefinitions.get(actionNumber),
      startX,
      startY
    })
  }
}
```

### SharedBuffer Writes (Worker)
```typescript
import { writeSpritePosition } from '@/core/animation/sharedDisplayBuffer'

function updateSpritePosition(actionNumber: number, x: number, y: number) {
  writeSpritePosition(sharedBuffer, actionNumber, { x, y, visible: true, ... })
}
```

### SharedBuffer Reads (Main Thread)
```typescript
import { readSpritePosition } from '@/core/animation/sharedDisplayBuffer'

function renderFrame() {
  for (let i = 0; i < 8; i++) {
    const sprite = readSpritePosition(sharedBuffer, i)
    if (sprite.visible) {
      // Update Konva sprite position
    }
  }
  requestAnimationFrame(renderFrame)
}
```

## Testing

- **Unit tests**: `test/animation/*`, `test/sprite/*` — state updates, buffer writes, command logic
- **Program tests**: `test/program/` — headless full-program tests for sprite/BG/animation features
- **Mock**: SharedArrayBuffer when needed
- **See**: `docs/testing-strategy.md` for split-of-concern boundaries and ownership

### Test Template
```typescript
import { describe, test, expect } from 'vitest'
import { AnimationManager } from '@/core/animation/AnimationManager'

describe('AnimationManager', () => {
  test('schedules move correctly', () => {
    const buffer = new SharedArrayBuffer(2200)  // SHARED_DISPLAY_BUFFER_BYTES
    const manager = new AnimationManager(buffer)

    manager.defineMove(1, movePattern)
    manager.scheduleMove(0, 1)

    const position = readSpritePosition(buffer, 0)
    expect(position.x).toEqual(expectedX)
    expect(position.y).toEqual(expectedY)
  })
})
```

## Common Pitfalls

### Debugging Shared Buffer Issues

**See**: `docs/debugging-best-practices.md` for full debugging methodology.

**Quick pattern for buffer bugs**: Log writes and reads on both sides:
```typescript
// Writer: Log what you write
this.accessor.writeSpriteState(actionNumber, /* ... */, characterType, colorCombination)
console.log('[WRITE] action', actionNumber, 'characterType:', characterType)

// Reader: Log what you read
const charType = this.accessor.readSpriteCharacterType(actionNumber)
console.log('[READ] action', actionNumber, 'characterType:', charType)
```

If write shows correct value but read shows wrong value → bug is in buffer write/read logic.

### postMessage Signature Mismatch (Worker vs Main Thread)

**Problem**: `postMessage()` has different signatures in web workers vs main thread. Mixing them causes runtime errors.

**Worker signature** (DedicatedWorkerGlobalScope):
```typescript
self.postMessage(message: any, transfer?: Transferable[]): void
```

**Main thread signature** (window.postMessage):
```typescript
window.postMessage(message: any, targetOrigin: string, transfer?: Transferable[]): void
```

**The Pitfall**: In a web worker, passing `'*'` as the second argument causes "Overload resolution failed" error:
```typescript
// ❌ WRONG in web worker (fails in browser)
self.postMessage({ type: 'SCREEN_CHANGED' }, '*')
// Error: Failed to execute 'postMessage' on 'DedicatedWorkerGlobalScope': Overload resolution failed.
// '*' is not a valid Transferable
```

**The Fix**: Use worker signature in worker code:
```typescript
// ✅ CORRECT in web worker
self.postMessage({ type: 'SCREEN_CHANGED' })
```

**Why this is confusing**: Tests in jsdom use `window.postMessage` signature, so `'*'` works in tests but fails in real workers. When writing worker code:
- Use `postMessage(message)` or `postMessage(message, transfer[])`
- NEVER use `postMessage(message, '*')` or other `targetOrigin` strings

**Affected files**:
- `src/core/devices/WebWorkerDeviceAdapter.ts:296-304` (postScreenChanged method)

**Test mocks**: When mocking `postMessage` in tests, use the worker signature:
```typescript
const selfTyped = self as typeof self & {
  postMessage: ((message: any, transfer?: Transferable[]) => void) & typeof self.postMessage
}
selfTyped.postMessage = ((message: any, _transfer?: Transferable[]) => {
  capturedMessages.push(message)
}) as typeof selfTyped.postMessage
```

---

## Code Constraints

- Files: **MAX 500 lines**
- TypeScript: strict mode, no `any`, `import type` for types
- Buffer access: Use typed arrays (Float64Array, Uint8Array)
- Thread safety: **Animation Worker is the ONLY writer to sprite positions in shared buffer**; main thread is read-only

## Reference

- **F-BASIC manual**: `docs/reference/family-basic-manual/` (device behavior)
- **Shared buffer layout**: `docs/reference/shared-display-buffer.md`
- **Worker message types**: `docs/reference/worker-messages.md`
