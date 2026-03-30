/**
 * WebWorkerDeviceAdapter Integration Tests
 *
 * Tests for the actual device adapter behavior with shared buffer integration.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { createSharedDisplayBuffer } from '@/core/animation/sharedDisplayBuffer'
import { SharedDisplayBufferAccessor } from '@/core/animation/sharedDisplayBufferAccessor'
import { TIMING } from '@/core/constants'
import {
  createSharedJoystickBuffer,
  createViewsFromJoystickBuffer,
  setStickState,
} from '@/core/devices/sharedJoystickBuffer'
import { WebWorkerDeviceAdapter } from '@/core/devices/WebWorkerDeviceAdapter'
import type { AnyServiceWorkerMessage } from '@/core/types/worker-messages'

// Mock self.postMessage to capture messages
let capturedMessages: AnyServiceWorkerMessage[] = []
const originalPostMessage = (globalThis as typeof globalThis & {
  postMessage?: typeof self.postMessage
}).postMessage

beforeEach(() => {
  capturedMessages = []
  // Mock self.postMessage for testing.
  // In jsdom, self.postMessage has the window.postMessage signature (message, targetOrigin, transfer).
  // In real workers, postMessage has the worker signature (message, transfer).
  // The mock accepts the worker signature since that's what the production code uses.
  if (typeof self !== 'undefined') {
    const selfTyped = self as typeof self & {
      postMessage: ((message: unknown, transfer?: Transferable[]) => void) & typeof self.postMessage
    }
    selfTyped.postMessage = ((message: unknown, _transfer?: Transferable[]) => {
      capturedMessages.push(message as AnyServiceWorkerMessage)
    }) as typeof selfTyped.postMessage
  }
})

afterEach(() => {
  // Restore original
  if (typeof self !== 'undefined' && originalPostMessage) {
    ;(self as typeof self & { postMessage: typeof originalPostMessage }).postMessage =
      originalPostMessage
  }
})

describe('WebWorkerDeviceAdapter - Cursor Position', () => {
  let adapter: WebWorkerDeviceAdapter
  let accessor: SharedDisplayBufferAccessor

  beforeEach(() => {
    vi.useFakeTimers()

    // Create shared buffer and accessor
    const sharedViews = createSharedDisplayBuffer()
    accessor = new SharedDisplayBufferAccessor(sharedViews.buffer)

    adapter = new WebWorkerDeviceAdapter()
    adapter.setSharedDisplayBufferAccessor(accessor)
    adapter.setCurrentExecutionId('test-execution')
    capturedMessages = []
  })

  afterEach(() => {
    adapter.cancelPendingScreenUpdate()
    vi.useRealTimers()
  })

  it('should set cursor position correctly', () => {
    adapter.setCursorPosition(10, 5)

    // Flush screen update to ensure buffer is synced
    vi.advanceTimersByTime(50)

    // Check that cursor position is in shared buffer
    const cursor = accessor.readCursor()
    expect(cursor.x).toBe(10)
    expect(cursor.y).toBe(5)

    // Check that SCREEN_CHANGED was sent
    const screenChangedMessage = capturedMessages.find(msg => msg.type === 'SCREEN_CHANGED')
    expect(screenChangedMessage).toBeDefined()
  })

  it('should write characters at cursor position after LOCATE', () => {
    // Set cursor position
    adapter.setCursorPosition(10, 5)
    vi.advanceTimersByTime(50)
    capturedMessages = []

    // Print text
    adapter.printOutput('HELLO')
    vi.advanceTimersByTime(50)

    // Read screen buffer from shared buffer
    const screenState = accessor.readScreenState()

    // Check that characters were written at position (10, 5)
    expect(screenState.buffer[5]?.[10]?.character).toBe('H')
    expect(screenState.buffer[5]?.[11]?.character).toBe('E')
    expect(screenState.buffer[5]?.[12]?.character).toBe('L')
    expect(screenState.buffer[5]?.[13]?.character).toBe('L')
    expect(screenState.buffer[5]?.[14]?.character).toBe('O')
  })

  it('should write characters starting from (0, 0) by default', () => {
    // Don't set cursor position - should start at (0, 0)
    adapter.printOutput('TEST')
    vi.advanceTimersByTime(50)

    const screenState = accessor.readScreenState()

    expect(screenState.buffer[0]?.[0]?.character).toBe('T')
    expect(screenState.buffer[0]?.[1]?.character).toBe('E')
    expect(screenState.buffer[0]?.[2]?.character).toBe('S')
    expect(screenState.buffer[0]?.[3]?.character).toBe('T')
  })

  it('should advance cursor after printing', () => {
    adapter.setCursorPosition(10, 5)
    vi.advanceTimersByTime(50)

    adapter.printOutput('HI')
    vi.advanceTimersByTime(50)

    // After printing "HI" at (10, 5), cursor should be at (12, 5)
    // Check the screen buffer to see where next character would go
    let screenState = accessor.readScreenState()

    // Characters should be at (10,5) and (11,5)
    expect(screenState.buffer[5]?.[10]?.character).toBe('H')
    expect(screenState.buffer[5]?.[11]?.character).toBe('I')

    // Next print should continue from (12, 5)
    capturedMessages = []
    adapter.printOutput('BYE')
    vi.advanceTimersByTime(50)

    screenState = accessor.readScreenState()

    // Should continue from where we left off
    expect(screenState.buffer[5]?.[12]?.character).toBe('B')
    expect(screenState.buffer[5]?.[13]?.character).toBe('Y')
    expect(screenState.buffer[5]?.[14]?.character).toBe('E')
  })

  it('should handle LOCATE then PRINT sequence', () => {
    // Simulate: LOCATE 10, 10: PRINT "I LOVE YOU"
    adapter.setCursorPosition(10, 10)
    vi.advanceTimersByTime(50)
    capturedMessages = []

    adapter.printOutput('I LOVE YOU')
    vi.advanceTimersByTime(50)

    const screenState = accessor.readScreenState()

    // Check that text starts at position (10, 10)
    expect(screenState.buffer[10]?.[10]?.character).toBe('I')
    expect(screenState.buffer[10]?.[11]?.character).toBe(' ')
    expect(screenState.buffer[10]?.[12]?.character).toBe('L')
    expect(screenState.buffer[10]?.[13]?.character).toBe('O')
    expect(screenState.buffer[10]?.[14]?.character).toBe('V')
    expect(screenState.buffer[10]?.[15]?.character).toBe('E')
    expect(screenState.buffer[10]?.[16]?.character).toBe(' ')
    expect(screenState.buffer[10]?.[17]?.character).toBe('Y')
    expect(screenState.buffer[10]?.[18]?.character).toBe('O')
    expect(screenState.buffer[10]?.[19]?.character).toBe('U')
  })

  it('should handle multiple LOCATE and PRINT calls', () => {
    // LOCATE 5, 5: PRINT "FIRST"
    adapter.setCursorPosition(5, 5)
    vi.advanceTimersByTime(50)
    adapter.printOutput('FIRST')
    vi.advanceTimersByTime(50)

    let screenState = accessor.readScreenState()
    expect(screenState.buffer[5]?.[5]?.character).toBe('F')

    // LOCATE 15, 10: PRINT "SECOND"
    adapter.setCursorPosition(15, 10)
    vi.advanceTimersByTime(50)
    adapter.printOutput('SECOND')
    vi.advanceTimersByTime(50)

    screenState = accessor.readScreenState()

    // First text should still be there
    expect(screenState.buffer[5]?.[5]?.character).toBe('F')
    // Second text should be at new position
    expect(screenState.buffer[10]?.[15]?.character).toBe('S')
  })

  it('should handle newlines correctly', () => {
    adapter.setCursorPosition(10, 5)
    vi.advanceTimersByTime(50)
    capturedMessages = []

    adapter.printOutput('LINE1\nLINE2')
    vi.advanceTimersByTime(50)

    const screenState = accessor.readScreenState()

    // First line at (10, 5)
    expect(screenState.buffer[5]?.[10]?.character).toBe('L')
    expect(screenState.buffer[5]?.[11]?.character).toBe('I')
    expect(screenState.buffer[5]?.[12]?.character).toBe('N')
    expect(screenState.buffer[5]?.[13]?.character).toBe('E')
    expect(screenState.buffer[5]?.[14]?.character).toBe('1')

    // Second line should start at (0, 6) after newline
    expect(screenState.buffer[6]?.[0]?.character).toBe('L')
    expect(screenState.buffer[6]?.[1]?.character).toBe('I')
    expect(screenState.buffer[6]?.[2]?.character).toBe('N')
    expect(screenState.buffer[6]?.[3]?.character).toBe('E')
    expect(screenState.buffer[6]?.[4]?.character).toBe('2')
  })

  it('should wrap text at column 28', () => {
    adapter.setCursorPosition(25, 5)
    vi.advanceTimersByTime(50)
    capturedMessages = []

    // Print text that will wrap
    adapter.printOutput('ABCDEFGH')
    vi.advanceTimersByTime(50)

    const screenState = accessor.readScreenState()

    // First 3 characters at end of row 5
    expect(screenState.buffer[5]?.[25]?.character).toBe('A')
    expect(screenState.buffer[5]?.[26]?.character).toBe('B')
    expect(screenState.buffer[5]?.[27]?.character).toBe('C')

    // Next characters should wrap to row 6
    expect(screenState.buffer[6]?.[0]?.character).toBe('D')
    expect(screenState.buffer[6]?.[1]?.character).toBe('E')
  })

  it('should clear screen and reset cursor', () => {
    // Write something first
    adapter.printOutput('TEST')
    vi.advanceTimersByTime(50)
    capturedMessages = []

    // Clear screen
    adapter.clearScreen()

    // Check SCREEN_CHANGED was sent
    const screenChangedMessage = capturedMessages.find(msg => msg.type === 'SCREEN_CHANGED')
    expect(screenChangedMessage).toBeDefined()

    // After clear, cursor should be at (0, 0)
    capturedMessages = []
    adapter.printOutput('AFTER')
    vi.advanceTimersByTime(50)

    const screenState = accessor.readScreenState()

    // Should start at (0, 0)
    expect(screenState.buffer[0]?.[0]?.character).toBe('A')
  })

  it('should clear screen buffer completely', () => {
    // Write content at multiple positions
    adapter.setCursorPosition(5, 5)
    adapter.printOutput('FIRST')
    vi.advanceTimersByTime(50)
    adapter.setCursorPosition(10, 10)
    adapter.printOutput('SECOND')
    vi.advanceTimersByTime(50)
    adapter.setCursorPosition(15, 15)
    adapter.printOutput('THIRD')
    vi.advanceTimersByTime(50)
    capturedMessages = []

    // Clear screen
    adapter.clearScreen()

    // Check SCREEN_CHANGED was sent
    const screenChangedMessage = capturedMessages.find(msg => msg.type === 'SCREEN_CHANGED')
    expect(screenChangedMessage).toBeDefined()

    // Print something after clear and verify screen is empty except for new content
    capturedMessages = []
    adapter.printOutput('NEW')
    vi.advanceTimersByTime(50)

    const screenState = accessor.readScreenState()

    // New content should be at (0, 0)
    expect(screenState.buffer[0]?.[0]?.character).toBe('N')
    expect(screenState.buffer[0]?.[1]?.character).toBe('E')
    expect(screenState.buffer[0]?.[2]?.character).toBe('W')

    // Old content should be gone (check a few positions)
    expect(screenState.buffer[5]?.[5]?.character).toBe(' ')
    expect(screenState.buffer[10]?.[10]?.character).toBe(' ')
    expect(screenState.buffer[15]?.[15]?.character).toBe(' ')
  })

  it('should reset cursor position to (0, 0) after clearScreen', () => {
    // Set cursor to a different position
    adapter.setCursorPosition(20, 15)
    vi.advanceTimersByTime(50)
    capturedMessages = []

    // Clear screen
    adapter.clearScreen()

    // Verify SCREEN_CHANGED was sent
    const screenChangedMessage = capturedMessages.find(msg => msg.type === 'SCREEN_CHANGED')
    expect(screenChangedMessage).toBeDefined()

    // Print after clear - should start at (0, 0)
    capturedMessages = []
    adapter.printOutput('RESET')
    vi.advanceTimersByTime(50)

    const screenState = accessor.readScreenState()

    // Should be at (0, 0), not at previous position (20, 15)
    expect(screenState.buffer[0]?.[0]?.character).toBe('R')
    expect(screenState.buffer[15]?.[20]?.character).toBe(' ')
  })

  it('should handle multiple clearScreen calls', () => {
    // Write content
    adapter.printOutput('CONTENT1')
    vi.advanceTimersByTime(50)
    capturedMessages = []

    // First clear
    adapter.clearScreen()
    let screenChangedMessage = capturedMessages.find(msg => msg.type === 'SCREEN_CHANGED')
    expect(screenChangedMessage).toBeDefined()

    // Write more content
    capturedMessages = []
    adapter.printOutput('CONTENT2')
    vi.advanceTimersByTime(50)
    capturedMessages = []

    // Second clear
    adapter.clearScreen()
    screenChangedMessage = capturedMessages.find(msg => msg.type === 'SCREEN_CHANGED')
    expect(screenChangedMessage).toBeDefined()

    // Print after second clear
    capturedMessages = []
    adapter.printOutput('FINAL')
    vi.advanceTimersByTime(50)

    const screenState = accessor.readScreenState()

    // Should start at (0, 0)
    expect(screenState.buffer[0]?.[0]?.character).toBe('F')
  })

  it('should clear screen even when already empty', () => {
    // Clear screen without writing anything first
    adapter.clearScreen()

    const screenChangedMessage = capturedMessages.find(msg => msg.type === 'SCREEN_CHANGED')
    expect(screenChangedMessage).toBeDefined()

    // Should still work and reset cursor
    capturedMessages = []
    adapter.printOutput('EMPTY')
    vi.advanceTimersByTime(50)

    const screenState = accessor.readScreenState()

    expect(screenState.buffer[0]?.[0]?.character).toBe('E')
  })
})

describe('WebWorkerDeviceAdapter - STICK typematic lifecycle reset', () => {
  let adapter: WebWorkerDeviceAdapter
  let joystickView: ReturnType<typeof createViewsFromJoystickBuffer>

  beforeEach(() => {
    vi.useFakeTimers()
    adapter = new WebWorkerDeviceAdapter()
    const joystickBuffer = createSharedJoystickBuffer()
    joystickView = createViewsFromJoystickBuffer(joystickBuffer)
    adapter.setSharedJoystickBuffer(joystickBuffer)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns initial press immediately', () => {
    setStickState(joystickView, 0, 8)
    expect(adapter.getStickState(0)).toBe(8)
  })

  it('suppresses held direction reads until repeat interval elapses', () => {
    setStickState(joystickView, 0, 1)
    expect(adapter.getStickState(0)).toBe(1)

    vi.advanceTimersByTime(TIMING.STICK_REPEAT_INTERVAL_MS - 1)
    expect(adapter.getStickState(0)).toBe(0)

    vi.advanceTimersByTime(1)
    expect(adapter.getStickState(0)).toBe(1)
  })

  it('returns direction changes immediately', () => {
    setStickState(joystickView, 0, 1)
    expect(adapter.getStickState(0)).toBe(1)

    vi.advanceTimersByTime(1)
    expect(adapter.getStickState(0)).toBe(0)

    setStickState(joystickView, 0, 2)
    expect(adapter.getStickState(0)).toBe(2)
  })

  it('returns release immediately and resets typematic state', () => {
    setStickState(joystickView, 0, 4)
    expect(adapter.getStickState(0)).toBe(4)

    vi.advanceTimersByTime(1)
    expect(adapter.getStickState(0)).toBe(0)

    setStickState(joystickView, 0, 0)
    expect(adapter.getStickState(0)).toBe(0)

    setStickState(joystickView, 0, 4)
    expect(adapter.getStickState(0)).toBe(4)
  })

  it('should return held direction immediately after execution restart', () => {
    setStickState(joystickView, 0, 8)
    expect(adapter.getStickState(0)).toBe(8)

    vi.advanceTimersByTime(1)
    expect(adapter.getStickState(0)).toBe(0)

    adapter.setCurrentExecutionId(null)
    adapter.setCurrentExecutionId('run-2')
    expect(adapter.getStickState(0)).toBe(8)
  })

  it('should reset typematic suppression when execution is stopped', () => {
    setStickState(joystickView, 0, 4)
    expect(adapter.getStickState(0)).toBe(4)

    vi.advanceTimersByTime(1)
    expect(adapter.getStickState(0)).toBe(0)

    adapter.stopExecution()
    expect(adapter.getStickState(0)).toBe(4)
  })
})

describe('WebWorkerDeviceAdapter - Sprite Position Sync', () => {
  let adapter: WebWorkerDeviceAdapter
  let accessor: SharedDisplayBufferAccessor

  beforeEach(() => {
    // Create shared buffer and accessor
    const sharedViews = createSharedDisplayBuffer()
    accessor = new SharedDisplayBufferAccessor(sharedViews.buffer)

    adapter = new WebWorkerDeviceAdapter()
    adapter.setSharedDisplayBufferAccessor(accessor)
    capturedMessages = []
  })

  describe('getSpritePosition - live position sync from shared buffer', () => {
    it('should return live position from shared buffer, not cached POSITION value', () => {
      // Step 1: Set initial POSITION (this caches the position in lastPositionBySprite)
      adapter.setSpritePosition(0, 100, 50)

      // Verify the cached position is returned
      expect(adapter.getSpritePosition(0)).toEqual({ x: 100, y: 50 })

      // Step 2: Simulate animation by writing a new live position to shared buffer
      // This represents the AnimationWorker updating the sprite position during movement
      accessor.writeSpriteState(0, 200, 150, true, true, 0, 50, 100, 3, 5, 0, 0, 0)

      // Step 3: Verify getSpritePosition returns the LIVE position from shared buffer
      // NOT the cached POSITION value (100, 50)
      const pos = adapter.getSpritePosition(0)
      expect(pos).toEqual({ x: 200, y: 150 })
      expect(pos?.x).not.toBe(100) // Should NOT be the cached POSITION value
      expect(pos?.y).not.toBe(50)
    })

    it('should update cache with live position from shared buffer', () => {
      // Set initial POSITION
      adapter.setSpritePosition(0, 100, 50)

      // Write live animated position to shared buffer
      accessor.writeSpriteState(0, 200, 150, true, true, 0, 50, 100, 3, 5, 0, 0, 0)

      // First call reads from shared buffer and updates cache
      expect(adapter.getSpritePosition(0)).toEqual({ x: 200, y: 150 })

      // Second call should still return the live position (cache was updated)
      expect(adapter.getSpritePosition(0)).toEqual({ x: 200, y: 150 })
    })

    it('should handle multiple sprites with independent live positions', () => {
      // Set initial POSITIONs for multiple sprites
      adapter.setSpritePosition(0, 100, 50)
      adapter.setSpritePosition(1, 120, 60)
      adapter.setSpritePosition(2, 140, 70)

      // Animate all sprites to new positions
      accessor.writeSpriteState(0, 200, 150, true, true, 0, 50, 100, 3, 5, 0, 0, 0)
      accessor.writeSpriteState(1, 220, 160, true, true, 0, 40, 80, 2, 4, 0, 1, 0)
      accessor.writeSpriteState(2, 240, 170, true, true, 0, 30, 60, 1, 3, 0, 2, 0)

      // Each sprite should return its own live position
      expect(adapter.getSpritePosition(0)).toEqual({ x: 200, y: 150 })
      expect(adapter.getSpritePosition(1)).toEqual({ x: 220, y: 160 })
      expect(adapter.getSpritePosition(2)).toEqual({ x: 240, y: 170 })
    })

    it('should return null when sprite has no position and buffer is uninitialized', () => {
      // No POSITION set, and buffer is (0,0) which means uninitialized
      const pos = adapter.getSpritePosition(5)
      expect(pos).toBeNull()
    })

    it('should prefer shared buffer over cached POSITION when both exist', () => {
      // This is the key fix: shared buffer should take priority
      // Set cached POSITION
      adapter.setSpritePosition(0, 100, 50)

      // Write different position to shared buffer (simulating animation)
      accessor.writeSpriteState(0, 999, 888, true, true, 0, 50, 100, 3, 5, 0, 0, 0)

      // Should return shared buffer position, NOT cached POSITION
      expect(adapter.getSpritePosition(0)).toEqual({ x: 999, y: 888 })
    })

    it('should fall back to cached POSITION when shared buffer is (0,0) and sprite is inactive', () => {
      // Set cached POSITION
      adapter.setSpritePosition(0, 100, 50)

      // Shared buffer at (0,0) means uninitialized/invalid - should use cache
      accessor.writeSpriteState(0, 0, 0, false, false, 0, 0, 0, 0, 0, 0, -1, 0)

      // Should return cached POSITION since buffer (0,0) is treated as uninitialized
      expect(adapter.getSpritePosition(0)).toEqual({ x: 100, y: 50 })
    })

    it('should return live origin when shared buffer reports active sprite at (0,0)', () => {
      // Cached POSITION should not override a valid live origin
      adapter.setSpritePosition(0, 100, 50)

      // Active+visible sprite at origin is a valid state
      accessor.writeSpriteState(0, 0, 0, true, true, 0, 0, 0, 0, 0, 0, 2, 0)

      expect(adapter.getSpritePosition(0)).toEqual({ x: 0, y: 0 })
    })

    it('should sync position continuously as sprite animates', () => {
      adapter.setSpritePosition(0, 100, 50)

      // Simulate animation frame 1
      accessor.writeSpriteState(0, 110, 55, true, true, 0, 90, 100, 3, 5, 0, 0, 0)
      expect(adapter.getSpritePosition(0)).toEqual({ x: 110, y: 55 })

      // Simulate animation frame 2
      accessor.writeSpriteState(0, 120, 60, true, true, 0, 80, 100, 3, 5, 0, 0, 0)
      expect(adapter.getSpritePosition(0)).toEqual({ x: 120, y: 60 })

      // Simulate animation frame 3
      accessor.writeSpriteState(0, 130, 65, true, true, 0, 70, 100, 3, 5, 0, 0, 0)
      expect(adapter.getSpritePosition(0)).toEqual({ x: 130, y: 65 })
    })
  })
})
