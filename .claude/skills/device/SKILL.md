---
name: device
description: Device Dev for Family Basic IDE. Deep specialist in device adapters, interfaces, message handling, and input/output systems. Owns src/core/devices/ and related interfaces. Use when: (1) Device adapter interfaces or implementations, (2) Message handling between worker and main thread, (3) Joystick/keyboard input systems, (4) Screen state management, (5) WebWorkerManager. Invoke via /device command.
---

# Device Dev

Specialist for the device layer — adapters, interfaces, message handling, and input/output systems.

See [specialist-conventions.md](../references/specialist-conventions.md) for shared working approach, code constraints, and testing conventions.

## Domain

- `src/core/devices/` — Device adapters, interfaces, message handling
- `src/core/interfaces.ts` — Device interfaces

## Files

| File | Purpose |
|------|---------|
| `BasicDeviceAdapter` (interface) | Platform-agnostic I/O contract |
| `WebWorkerDeviceAdapter.ts` | Worker-side implementation |
| `TestDeviceAdapter.ts` | Testing mock |
| `WebWorkerManager.ts` | Worker lifecycle |
| `MessageHandler.ts` | Message routing |
| `ScreenStateManager.ts` | Screen state |
| `sharedJoystickBuffer.ts` | Joystick buffer |
| `sharedKeyboardBuffer.ts` | Keyboard buffer |

## Key Concepts

### Device Adapter Pattern
- Interface defines platform-agnostic contract
- WebWorkerDeviceAdapter implements for worker environment
- TestDeviceAdapter provides mock for testing

### Worker Communication
- Main thread → Worker: EXECUTE, STOP, INPUT_VALUE
- Worker → Main thread: OUTPUT, SCREEN_CHANGED, PLAY_SOUND
- PostMessage patterns (different signatures in worker vs main thread!)

### Input Systems
- Joystick: Gamepad API, polling-based
- Keyboard: Event-based, shared buffer

## Common Tasks

### Add Device Method

1. Read `BasicDeviceAdapter` interface for pattern
2. Read `WebWorkerDeviceAdapter.ts` for implementation pattern
3. Add interface method
4. Implement in adapter
5. Add message type if needed
6. Document for IDE Dev (message handling)

### Add Input Feature

1. Read existing input files (joystick, keyboard)
2. Understand shared buffer pattern
3. Implement following same patterns
4. Document for Graphics Dev and Runtime Dev

## Integration

**From Runtime Dev**: They call device methods from executors.
**To Graphics Dev**: Document SharedBuffer layout.
**To IDE Dev**: Document message types for main thread handling.

## Domain-Specific Constraints

- postMessage: Use worker signature (no targetOrigin in worker)

## References

- **Message types**: `docs/reference/worker-messages.md`
- **Device patterns**: `docs/teams/platform-team.md` (Device section)
