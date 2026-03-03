/**
 * Keyboard Input Composable for INKEY$ function
 *
 * Tracks keyboard events and writes to shared keyboard buffer for INKEY$.
 * Only active when input mode is 'keyboard' and program is running.
 */

import { useEventListener } from '@vueuse/core'
import type { MaybeRefOrGetter } from 'vue'
import { toValue } from 'vue'

import {
  clearInkeyState,
  type KeyboardBufferView,
  setInkeyState,
} from '@/core/devices'
import { logComposable } from '@/shared/logger'

export type InputMode = 'joystick' | 'keyboard'

export interface UseKeyboardInputOptions {
  /** Shared keyboard buffer view (reactive or static) */
  sharedKeyboardView?: MaybeRefOrGetter<KeyboardBufferView | null | undefined>
  /** Function that returns true when keyboard input should be processed */
  enabled?: () => boolean
  /** Current input mode (reactive or static) - only process keys when mode is 'keyboard' */
  inputMode?: MaybeRefOrGetter<InputMode>
}

/**
 * Composable for tracking keyboard input and writing to shared buffer for INKEY$.
 *
 * This composable:
 * - Listens for keydown/keyup events using VueUse's useEventListener
 * - Writes pressed key character to shared buffer
 * - Only processes keys when input mode is 'keyboard' and enabled() returns true
 * - Only printable characters (key.length === 1) are tracked
 * - Automatically cleans up listeners on component unmount
 */
export function useKeyboardInput(options: UseKeyboardInputOptions = {}) {
  const { sharedKeyboardView, enabled = () => true, inputMode } = options

  /**
   * Check if keyboard input should be processed
   */
  const shouldProcessInput = (): boolean => {
    // Must be enabled
    if (!enabled()) return false
    // Must be in keyboard mode
    if (inputMode && toValue(inputMode) !== 'keyboard') return false
    return true
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (!shouldProcessInput()) return

    // Only track printable characters (single character keys)
    if (event.key.length !== 1) return

    const view = sharedKeyboardView ? toValue(sharedKeyboardView) : null
    if (!view) return

    // F-BASIC only uses uppercase letters - convert lowercase to uppercase
    const key = event.key.length === 1 && event.key >= 'a' && event.key <= 'z'
      ? event.key.toUpperCase()
      : event.key

    setInkeyState(view, key)
    logComposable.debug('[useKeyboardInput] Key pressed:', key)
  }

  const handleKeyUp = (_event: KeyboardEvent) => {
    if (!shouldProcessInput()) return

    const view = sharedKeyboardView ? toValue(sharedKeyboardView) : null
    if (!view) return

    // Clear the keyboard state when any key is released
    clearInkeyState(view)
    logComposable.debug('[useKeyboardInput] Key released, buffer cleared')
  }

  // Use VueUse's useEventListener for automatic cleanup on unmount
  useEventListener(window, 'keydown', handleKeyDown)
  useEventListener(window, 'keyup', handleKeyUp)

  return {
    // No public methods needed - event handlers are automatic
  }
}
