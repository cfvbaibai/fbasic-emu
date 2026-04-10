/**
 * Screen integration: shared display buffer and render/sync callbacks.
 * Worker writes to shared buffer; Screen reads and decodes; setDecodedScreenState updates refs.
 */

import { ref } from 'vue'

import {
  createSharedDisplayBuffer,
  type SharedDisplayViews,
} from '@/core/animation/sharedDisplayBuffer'
import { SyncCommandType } from '@/core/animation/sharedDisplayBuffer'
import {
  type DecodedScreenState,
  SharedDisplayBufferAccessor,
} from '@/core/animation/sharedDisplayBufferAccessor'
import { TIMING } from '@/core/constants'
import {
  createSharedJoystickBuffer,
  createSharedKeyboardBuffer,
  createViewsFromKeyboardBuffer,
  type KeyboardBufferView,
} from '@/core/devices'

import type { BasicIdeState } from './useBasicIdeState'

export interface BasicIdeScreenIntegration {
  sharedDisplayViews: SharedDisplayViews
  sharedDisplayBufferAccessor: SharedDisplayBufferAccessor
  sharedAnimationBuffer: SharedArrayBuffer
  sharedJoystickBuffer: SharedArrayBuffer
  sharedKeyboardBuffer: SharedArrayBuffer
  sharedKeyboardBufferView: KeyboardBufferView
  registerScheduleRender: (fn: () => void) => void
  /** Register callback from Screen.vue to invalidate last-rendered background buffer. */
  registerInvalidateBackgroundBuffer: (fn: () => void) => void
  setDecodedScreenState: (decoded: DecodedScreenState) => void
  /** Invalidate last-rendered background buffer so next render does a full redraw. */
  invalidateBackgroundBuffer: () => void
  /** Called by message handlers when SCREEN_CHANGED is received. */
  scheduleRender: () => void
  /** Coalesced: at most one scheduleRender per frame. Use for SCREEN_CHANGED to avoid main-thread flood. */
  scheduleRenderForScreenChanged: () => void
  /** Write current (cleared) state to shared buffer and bump sequence so Screen redraws. Call after clearOutput. */
  clearDisplayToSharedBuffer: () => void
  /** Cleanup pending animation frames and timeouts. Call on component unmount. */
  cleanup: () => void
}

/**
 * Create shared display buffer and callbacks that sync decoded state into IDE state refs.
 */
export function useBasicIdeScreenIntegration(state: BasicIdeState): BasicIdeScreenIntegration {
  const sharedDisplayViews = createSharedDisplayBuffer()
  const sharedAnimationBuffer = sharedDisplayViews.buffer
  const sharedDisplayBufferAccessor = new SharedDisplayBufferAccessor(sharedAnimationBuffer)

  // Shared joystick buffer (main thread writes, workers read)
  const sharedJoystickBuffer = createSharedJoystickBuffer()

  // Shared keyboard buffer for INKEY$ function (main thread writes, workers read)
  const sharedKeyboardBuffer = createSharedKeyboardBuffer()
  const sharedKeyboardBufferView = createViewsFromKeyboardBuffer(sharedKeyboardBuffer)

  const scheduleScreenRenderRef = ref<(() => void) | null>(null)
  const registerScheduleRender = (fn: () => void) => {
    scheduleScreenRenderRef.value = fn
  }

  const invalidateBackgroundBufferRef = ref<(() => void) | null>(null)
  const registerInvalidateBackgroundBuffer = (fn: () => void) => {
    invalidateBackgroundBufferRef.value = fn
  }
  const invalidateBackgroundBuffer = () => invalidateBackgroundBufferRef.value?.()

  const setDecodedScreenState = (decoded: DecodedScreenState) => {
    state.screenBuffer.value = decoded.buffer
    state.cursorX.value = decoded.cursorX
    state.cursorY.value = decoded.cursorY
    state.bgPalette.value = decoded.bgPalette
    state.spritePalette.value = decoded.spritePalette
    state.backdropColor.value = decoded.backdropColor
    state.cgenMode.value = decoded.cgenMode
  }

  const scheduleRender = () => scheduleScreenRenderRef.value?.()

  /** Write current state to shared buffer and bump sequence so Screen re-decodes and redraws. */
  const clearDisplayToSharedBuffer = () => {
    sharedDisplayBufferAccessor.writeScreenState(
      state.screenBuffer.value,
      state.cursorX.value,
      state.cursorY.value,
      state.bgPalette.value ?? 1,
      state.spritePalette.value ?? 1,
      state.backdropColor.value ?? 0,
      state.cgenMode.value ?? 2
    )
    // Clear shared sprite buffer FIRST so render immediately sees empty data
    // This prevents race condition where render happens before AnimationWorker processes command
    sharedDisplayBufferAccessor.clearAllSprites()

    // Send CLEAR_ALL_MOVEMENTS command to AnimationWorker
    // AnimationWorker will clear its internal movement states when it processes this
    sharedDisplayBufferAccessor.writeSyncCommand(SyncCommandType.CLEAR_ALL_MOVEMENTS, 0)

    // Clear local sprite node maps so render creates fresh layers (will be empty since buffer is being cleared)
    state.frontSpriteNodes.value.clear()
    state.backSpriteNodes.value.clear()
    sharedDisplayBufferAccessor.incrementSequence()
    scheduleRender()
  }

  // Coalesce SCREEN_CHANGED with adaptive frame rate throttling
  // Throttle to ~20 FPS (50ms) during rapid PRINT operations to reduce CPU usage
  // (60 FPS is overkill for text output; sprites run at separate 30 FPS animation loop)
  let screenChangedRafId: number | null = null
  let lastRenderTime = 0
  const MIN_RENDER_INTERVAL_MS = TIMING.SCREEN_RENDER_INTERVAL_MS

  const scheduleRenderForScreenChanged = () => {
    if (screenChangedRafId !== null) return

    const now = performance.now()
    const timeSinceLastRender = now - lastRenderTime

    if (timeSinceLastRender >= MIN_RENDER_INTERVAL_MS) {
      // Enough time has passed since last render - schedule immediately
      screenChangedRafId = requestAnimationFrame(() => {
        screenChangedRafId = null
        lastRenderTime = performance.now()
        scheduleScreenRenderRef.value?.()
      })
    } else {
      // Throttle: wait until MIN_RENDER_INTERVAL_MS has passed
      const delay = MIN_RENDER_INTERVAL_MS - timeSinceLastRender
      screenChangedRafId = window.setTimeout(() => {
        screenChangedRafId = requestAnimationFrame(() => {
          screenChangedRafId = null
          lastRenderTime = performance.now()
          scheduleScreenRenderRef.value?.()
        })
      }, delay)
    }
  }

  /**
   * Cleanup pending animation frames and timeouts.
   * Call on component unmount to prevent memory leaks.
   */
  const cleanup = () => {
    if (screenChangedRafId !== null) {
      // Cancel both - one will be a no-op since IDs don't overlap between raf and timeout
      cancelAnimationFrame(screenChangedRafId)
      clearTimeout(screenChangedRafId)
      screenChangedRafId = null
    }
  }

  return {
    sharedDisplayViews,
    sharedDisplayBufferAccessor,
    sharedAnimationBuffer,
    sharedJoystickBuffer,
    sharedKeyboardBuffer,
    sharedKeyboardBufferView,
    registerScheduleRender,
    registerInvalidateBackgroundBuffer,
    setDecodedScreenState,
    invalidateBackgroundBuffer,
    scheduleRender,
    scheduleRenderForScreenChanged,
    clearDisplayToSharedBuffer,
    cleanup,
  }
}
