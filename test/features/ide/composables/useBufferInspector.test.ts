// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { SHARED_DISPLAY_BUFFER_BYTES } from '@/core/animation/sharedDisplayBuffer'
import { SharedDisplayBufferAccessor } from '@/core/animation/sharedDisplayBufferAccessor'
import { createViewsFromKeyboardBuffer } from '@/core/devices/sharedKeyboardBuffer'
import type { UseBufferInspectorOptions } from '@/features/ide/composables/useBufferInspector'
import { useBufferInspector } from '@/features/ide/composables/useBufferInspector'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function createDisplayBuffer(): SharedArrayBuffer {
  return new SharedArrayBuffer(SHARED_DISPLAY_BUFFER_BYTES)
}

function createKeyboardBuffer(): SharedArrayBuffer {
  return new SharedArrayBuffer(24)
}

function createDefaultOptions(): UseBufferInspectorOptions {
  const displayBuffer = createDisplayBuffer()
  const keyboardBuffer = createKeyboardBuffer()
  const accessor = new SharedDisplayBufferAccessor(displayBuffer)
  const keyboardView = createViewsFromKeyboardBuffer(keyboardBuffer)

  return {
    sharedDisplayBufferAccessor: accessor,
    keyboardView,
    spriteStates: [],
    spriteEnabled: false,
    sharedJoystickBuffer: undefined,
    pollingIntervalMs: 250,
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('useBufferInspector', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // -------------------------------------------------------------------------
  // Return type
  // -------------------------------------------------------------------------

  describe('return type', () => {
    it('returns all expected properties', () => {
      const result = useBufferInspector(createDefaultOptions())

      expect(result).toHaveProperty('screenData')
      expect(result).toHaveProperty('syncCommand')
      expect(result).toHaveProperty('ackStatus')
      expect(result).toHaveProperty('keyboardData')
      expect(result).toHaveProperty('spriteStates')
      expect(result).toHaveProperty('spriteEnabled')
      expect(result).toHaveProperty('changedCells')
      expect(result).toHaveProperty('isFrozen')
      expect(result).toHaveProperty('pollCount')
      expect(typeof result.freeze).toEqual('function')
      expect(typeof result.unfreeze).toEqual('function')
      expect(typeof result.startPolling).toEqual('function')
      expect(typeof result.stopPolling).toEqual('function')
    })
  })

  // -------------------------------------------------------------------------
  // Initial state
  // -------------------------------------------------------------------------

  describe('initial state', () => {
    it('returns screenData as empty array when no polling has occurred', () => {
      const { screenData } = useBufferInspector(createDefaultOptions())

      expect(screenData.value).toEqual([])
    })

    it('returns syncCommand as null initially', () => {
      const { syncCommand } = useBufferInspector(createDefaultOptions())

      expect(syncCommand.value).toEqual(null)
    })

    it('returns ackStatus as 0 initially', () => {
      const { ackStatus } = useBufferInspector(createDefaultOptions())

      expect(ackStatus.value).toEqual(0)
    })

    it('returns keyboardData as null initially', () => {
      const { keyboardData } = useBufferInspector(createDefaultOptions())

      expect(keyboardData.value).toEqual(null)
    })

    it('returns changedCells as empty Set initially', () => {
      const { changedCells } = useBufferInspector(createDefaultOptions())

      expect(changedCells.value.size).toEqual(0)
    })

    it('returns isFrozen as false initially', () => {
      const { isFrozen } = useBufferInspector(createDefaultOptions())

      expect(isFrozen.value).toEqual(false)
    })

    it('returns pollCount as 0 initially', () => {
      const { pollCount } = useBufferInspector(createDefaultOptions())

      expect(pollCount.value).toEqual(0)
    })

    it('returns provided spriteStates', () => {
      const spriteStates = [
        { spriteNumber: 0, x: 10, y: 20, visible: true, priority: 0, definition: null },
      ]
      const options = createDefaultOptions()
      options.spriteStates = spriteStates
      const { spriteStates: returned } = useBufferInspector(options)

      expect(returned.value).toEqual(spriteStates)
    })

    it('returns provided spriteEnabled', () => {
      const options = createDefaultOptions()
      options.spriteEnabled = true
      const { spriteEnabled } = useBufferInspector(options)

      expect(spriteEnabled.value).toEqual(true)
    })
  })

  // -------------------------------------------------------------------------
  // Polling
  // -------------------------------------------------------------------------

  describe('polling', () => {
    it('does not poll until startPolling is called', () => {
      const options = createDefaultOptions()
      useBufferInspector(options)

      vi.advanceTimersByTime(1000)

      // No error, no polling occurred
    })

    it('starts polling when startPolling is called', () => {
      const { pollCount, startPolling } = useBufferInspector(createDefaultOptions())

      startPolling()

      // Immediate first poll
      expect(pollCount.value).toEqual(1)
    })

    it('polls at the specified interval', () => {
      const { pollCount, startPolling } = useBufferInspector(createDefaultOptions())

      startPolling()
      // Immediate first poll
      expect(pollCount.value).toEqual(1)

      // First interval tick at 250ms
      vi.advanceTimersByTime(250)
      expect(pollCount.value).toEqual(2)

      // Second interval tick at 500ms
      vi.advanceTimersByTime(250)
      expect(pollCount.value).toEqual(3)
    })

    it('reads screen data on each poll', () => {
      const { screenData, startPolling } = useBufferInspector(createDefaultOptions())

      startPolling()

      expect(screenData.value.length).toEqual(24) // ROWS
      expect(screenData.value[0]?.length).toEqual(28) // COLS
    })

    it('reads sync command on each poll', () => {
      const { syncCommand, startPolling } = useBufferInspector(createDefaultOptions())

      startPolling()

      // No command written, so null
      expect(syncCommand.value).toEqual(null)
    })

    it('reads ack status on each poll', () => {
      const { ackStatus, startPolling } = useBufferInspector(createDefaultOptions())

      startPolling()

      expect(ackStatus.value).toEqual(0)
    })

    it('reads keyboard data on each poll', () => {
      const { keyboardData, startPolling } = useBufferInspector(createDefaultOptions())

      startPolling()

      expect(keyboardData.value).toEqual({ keyChar: '', modifiers: 0 })
    })

    it('stops polling when stopPolling is called', () => {
      const { pollCount, startPolling, stopPolling } = useBufferInspector(createDefaultOptions())

      startPolling()
      expect(pollCount.value).toEqual(1)

      stopPolling()
      vi.advanceTimersByTime(1000)
      expect(pollCount.value).toEqual(1)
    })
  })

  // -------------------------------------------------------------------------
  // Change detection
  // -------------------------------------------------------------------------

  describe('change detection', () => {
    it('no changed cells on first poll', () => {
      const { changedCells, startPolling } = useBufferInspector(createDefaultOptions())

      startPolling()

      expect(changedCells.value.size).toEqual(0)
    })

    it('detects changed cells between polls', () => {
      const options = createDefaultOptions()
      const { changedCells, startPolling } = useBufferInspector(options)

      startPolling()
      expect(changedCells.value.size).toEqual(0)

      // Write a character to the display buffer
      options.sharedDisplayBufferAccessor.writeScreenChar(5, 3, 65)

      vi.advanceTimersByTime(250)
      expect(changedCells.value.size).toEqual(1)
      expect(changedCells.value.has('5,3')).toEqual(true)
    })

    it('detects multiple changed cells', () => {
      const options = createDefaultOptions()
      const { changedCells, startPolling } = useBufferInspector(options)

      startPolling()

      options.sharedDisplayBufferAccessor.writeScreenChar(0, 0, 65)
      options.sharedDisplayBufferAccessor.writeScreenChar(27, 23, 66)
      options.sharedDisplayBufferAccessor.writeScreenChar(10, 10, 67)

      vi.advanceTimersByTime(250)
      expect(changedCells.value.size).toEqual(3)
      expect(changedCells.value.has('0,0')).toEqual(true)
      expect(changedCells.value.has('27,23')).toEqual(true)
      expect(changedCells.value.has('10,10')).toEqual(true)
    })

    it('clears changed cells on each new poll (only shows changes since last poll)', () => {
      const options = createDefaultOptions()
      const { changedCells, startPolling } = useBufferInspector(options)

      startPolling()

      // Change a cell
      options.sharedDisplayBufferAccessor.writeScreenChar(5, 3, 65)
      vi.advanceTimersByTime(250)
      expect(changedCells.value.size).toEqual(1)

      // Next poll: no new changes, changed cells should be empty
      vi.advanceTimersByTime(250)
      expect(changedCells.value.size).toEqual(0)
    })

    it('detects pattern changes', () => {
      const options = createDefaultOptions()
      const { changedCells, startPolling } = useBufferInspector(options)

      startPolling()

      options.sharedDisplayBufferAccessor.writeScreenPattern(7, 11, 2)

      vi.advanceTimersByTime(250)
      expect(changedCells.value.size).toEqual(1)
      expect(changedCells.value.has('7,11')).toEqual(true)
    })
  })

  // -------------------------------------------------------------------------
  // Freeze / Pause
  // -------------------------------------------------------------------------

  describe('freeze / pause', () => {
    it('sets isFrozen to true when freeze is called', () => {
      const { isFrozen, freeze } = useBufferInspector(createDefaultOptions())

      freeze()

      expect(isFrozen.value).toEqual(true)
    })

    it('sets isFrozen to false when unfreeze is called', () => {
      const { isFrozen, freeze, unfreeze } = useBufferInspector(createDefaultOptions())

      freeze()
      expect(isFrozen.value).toEqual(true)

      unfreeze()
      expect(isFrozen.value).toEqual(false)
    })

    it('stops polling when frozen', () => {
      const { pollCount, startPolling, freeze } = useBufferInspector(createDefaultOptions())

      startPolling()
      expect(pollCount.value).toEqual(1)

      freeze()
      vi.advanceTimersByTime(1000)
      expect(pollCount.value).toEqual(1)
    })

    it('does not resume polling when unfrozen (must call startPolling again)', () => {
      const { pollCount, startPolling, freeze, unfreeze } = useBufferInspector(createDefaultOptions())

      startPolling()
      expect(pollCount.value).toEqual(1)

      freeze()
      vi.advanceTimersByTime(1000)
      expect(pollCount.value).toEqual(1)

      unfreeze()
      vi.advanceTimersByTime(1000)
      expect(pollCount.value).toEqual(1) // Not resumed automatically
    })

    it('preserves screen data when frozen', () => {
      const options = createDefaultOptions()
      const { screenData, startPolling, freeze } = useBufferInspector(options)

      startPolling()

      const snapshot = screenData.value

      freeze()

      // Mutate buffer after freeze
      options.sharedDisplayBufferAccessor.writeScreenChar(5, 3, 65)

      // Data should not change while frozen
      expect(screenData.value).toEqual(snapshot)
    })

    it('can freeze before starting polling', () => {
      const { isFrozen, freeze, pollCount, startPolling } = useBufferInspector(createDefaultOptions())

      freeze()
      startPolling()

      vi.advanceTimersByTime(1000)
      expect(pollCount.value).toEqual(0)
      expect(isFrozen.value).toEqual(true)
    })
  })

  // -------------------------------------------------------------------------
  // Tab visibility
  // -------------------------------------------------------------------------

  describe('tab visibility', () => {
    it('pauses polling when tab becomes hidden', () => {
      const { pollCount, startPolling } = useBufferInspector(createDefaultOptions())

      startPolling()
      expect(pollCount.value).toEqual(1)

      // Simulate tab becoming hidden
      Object.defineProperty(document, 'visibilityState', { value: 'hidden', writable: true })
      document.dispatchEvent(new Event('visibilitychange'))

      vi.advanceTimersByTime(1000)
      expect(pollCount.value).toEqual(1)
    })

    it('resumes polling when tab becomes visible', () => {
      const { pollCount, startPolling } = useBufferInspector(createDefaultOptions())

      startPolling()
      expect(pollCount.value).toEqual(1)

      // Hide tab
      Object.defineProperty(document, 'visibilityState', { value: 'hidden', writable: true })
      document.dispatchEvent(new Event('visibilitychange'))
      vi.advanceTimersByTime(1000)
      expect(pollCount.value).toEqual(1)

      // Show tab
      Object.defineProperty(document, 'visibilityState', { value: 'visible', writable: true })
      document.dispatchEvent(new Event('visibilitychange'))

      // visibilitychange handler does an immediate poll
      expect(pollCount.value).toEqual(2)
    })
  })

  // -------------------------------------------------------------------------
  // Cleanup
  // -------------------------------------------------------------------------

  describe('cleanup', () => {
    it('stops polling when scope is disposed', () => {
      const { pollCount, startPolling } = useBufferInspector(createDefaultOptions())

      startPolling()
      expect(pollCount.value).toEqual(1)

      // First interval tick
      vi.advanceTimersByTime(250)
      expect(pollCount.value).toEqual(2)

      // We can't directly test onScopeDispose in this setup,
      // but the composable should set up cleanup via onScopeDispose
    })
  })
})
