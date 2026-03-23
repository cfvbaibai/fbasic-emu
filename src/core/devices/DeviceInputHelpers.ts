/**
 * Device Input Helpers
 *
 * Standalone functions for input handling in WebWorkerDeviceAdapter.
 * Extracted from WebWorkerDeviceAdapter.ts for modularity.
 *
 * Handles: Joystick (STICK), keyboard (INKEY$), and STRIG input.
 */

import { TIMING } from '@/core/constants'

import type { JoystickBufferView } from './sharedJoystickBuffer'
import { getStickState as getRawStickState } from './sharedJoystickBuffer'
import type { KeyboardBufferView } from './sharedKeyboardBuffer'
import {
  consumeKeyAvailable,
  getInkeyState as getInkeyFromBuffer,
  waitForInkeyBlocking as waitForInkeyBlockingFromBuffer,
} from './sharedKeyboardBuffer'

// ============================================================================
// Joystick Typematic State
// ============================================================================

/**
 * Typematic state for joystick repeat control.
 * Prevents continuous direction input when joystick is held.
 */
export interface StickTypematicState {
  lastStickValue: Map<number, number>
  lastStickReadTime: Map<number, number>
}

export function createStickTypematicState(): StickTypematicState {
  return {
    lastStickValue: new Map(),
    lastStickReadTime: new Map(),
  }
}

export function resetStickTypematicState(state: StickTypematicState): void {
  state.lastStickValue.clear()
  state.lastStickReadTime.clear()
}

/**
 * Get stick state with typematic-style repeat control.
 *
 * Prevents programs from registering continuous direction input when the
 * joystick is held in one direction. Instead:
 * - New directions are returned immediately
 * - Release (returning 0) is immediate
 * - Same direction held is only returned after repeat interval elapses
 */
export function getStickStateWithTypematic(
  sharedJoystickView: JoystickBufferView,
  typematicState: StickTypematicState
): number {
  const currentDirection = getRawStickState(sharedJoystickView, 0)
  const now = performance.now()

  // If current is 0 (no direction/released): return immediately, reset tracking
  if (currentDirection === 0) {
    typematicState.lastStickValue.delete(0)
    typematicState.lastStickReadTime.delete(0)
    return 0
  }

  const lastValue = typematicState.lastStickValue.get(0) ?? 0
  const lastTime = typematicState.lastStickReadTime.get(0) ?? 0

  // If current != last: new direction, return immediately, update tracking
  if (currentDirection !== lastValue) {
    typematicState.lastStickValue.set(0, currentDirection)
    typematicState.lastStickReadTime.set(0, now)
    return currentDirection
  }

  // Same direction held: check if enough time has elapsed since last return
  const elapsed = now - lastTime
  if (elapsed >= TIMING.STICK_REPEAT_INTERVAL_MS) {
    typematicState.lastStickReadTime.set(0, now)
    return currentDirection
  }

  // Not enough time elapsed: suppress repeat (return 0)
  return 0
}

// ============================================================================
// Keyboard Input (INKEY$)
// ============================================================================

/**
 * Get current keyboard state for INKEY$.
 * @returns Pressed character or empty string
 */
export function getInkeyState(sharedKeyboardView: KeyboardBufferView | null): string {
  if (!sharedKeyboardView) return ''
  const { keyChar } = getInkeyFromBuffer(sharedKeyboardView)
  return keyChar
}

/**
 * Wait for a key press synchronously using Atomics.wait (blocking mode for INKEY$(0)).
 */
export function waitForInkeyBlocking(
  sharedKeyboardView: KeyboardBufferView | null,
  isEnabled: () => boolean
): string {
  if (!sharedKeyboardView) return ''

  // First check if key already pressed
  const keyChar = getInkeyState(sharedKeyboardView)
  if (keyChar) {
    consumeKeyAvailable(sharedKeyboardView)
    return keyChar
  }

  // Block until key available or disabled
  const TIMEOUT_MS = 100
  while (isEnabled()) {
    const available = waitForInkeyBlockingFromBuffer(sharedKeyboardView, TIMEOUT_MS)
    if (available) {
      const char = getInkeyState(sharedKeyboardView)
      consumeKeyAvailable(sharedKeyboardView)
      return char
    }
  }

  return ''
}

// ============================================================================
// STRIG State
// ============================================================================

/**
 * Push a STRIG event into the click buffer.
 */
export function pushStrigEvent(
  strigClickBuffer: Map<number, number[]>,
  isEnabled: boolean,
  joystickId: number,
  state: number
): void {
  if (!isEnabled) return

  if (state > 0) {
    if (!strigClickBuffer.has(joystickId)) {
      strigClickBuffer.set(joystickId, [])
    }
    const buffer = strigClickBuffer.get(joystickId)!
    buffer.push(state)
  }
}

/**
 * Consume a STRIG event from the click buffer.
 */
export function consumeStrigEvent(
  strigClickBuffer: Map<number, number[]>,
  joystickId: number
): number {
  const buffer = strigClickBuffer.get(joystickId)
  if (!buffer || buffer.length === 0) {
    return 0
  }
  return buffer.shift()!
}
