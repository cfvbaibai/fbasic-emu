/**
 * Unit tests for DeviceInputHelpers
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { TIMING } from '@/core/constants'
import {
  consumeStrigEvent,
  createStickTypematicState,
  getInkeyState,
  getStickStateWithTypematic,
  pushStrigEvent,
  resetStickTypematicState,
} from '@/core/devices/DeviceInputHelpers'
import type { KeyboardBufferView } from '@/core/devices/sharedKeyboardBuffer'

// Mock the sharedKeyboardBuffer and sharedJoystickBuffer modules
vi.mock('@/core/devices/sharedKeyboardBuffer', () => ({
  consumeKeyAvailable: vi.fn(),
  getInkeyState: vi.fn(),
  waitForInkeyBlocking: vi.fn(),
}))

vi.mock('@/core/devices/sharedJoystickBuffer', () => ({
  getStickState: vi.fn(),
}))

import { getStickState as getRawStickState } from '@/core/devices/sharedJoystickBuffer'
import { getInkeyState as getInkeyFromBuffer } from '@/core/devices/sharedKeyboardBuffer'

// Typed mock references
const mockGetInkeyFromBuffer = vi.mocked(getInkeyFromBuffer)
const mockGetRawStickState = vi.mocked(getRawStickState)

describe('DeviceInputHelpers', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(0)
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  // ---------------------------------------------------------------------------
  // Stick Typematic State
  // ---------------------------------------------------------------------------
  describe('createStickTypematicState', () => {
    it('should return a state with empty maps', () => {
      const state = createStickTypematicState()
      expect(state.lastStickValue).toBeInstanceOf(Map)
      expect(state.lastStickValue.size).toBe(0)
      expect(state.lastStickReadTime).toBeInstanceOf(Map)
      expect(state.lastStickReadTime.size).toBe(0)
    })
  })

  describe('resetStickTypematicState', () => {
    it('should clear all tracking data', () => {
      const state = createStickTypematicState()
      state.lastStickValue.set(0, 8)
      state.lastStickReadTime.set(0, 100)
      resetStickTypematicState(state)
      expect(state.lastStickValue.size).toBe(0)
      expect(state.lastStickReadTime.size).toBe(0)
    })
  })

  describe('getStickStateWithTypematic', () => {
    it('should return 0 when no direction is pressed', () => {
      mockGetRawStickState.mockReturnValue(0)
      const state = createStickTypematicState()
      const joystickView = {} as never
      expect(getStickStateWithTypematic(joystickView, state)).toBe(0)
      expect(state.lastStickValue.size).toBe(0)
    })

    it('should return new direction immediately', () => {
      mockGetRawStickState.mockReturnValue(8) // Up
      const state = createStickTypematicState()
      const joystickView = {} as never
      expect(getStickStateWithTypematic(joystickView, state)).toBe(8)
      expect(state.lastStickValue.get(0)).toBe(8)
      expect(state.lastStickReadTime.get(0)).toBe(0) // systemTime = 0
    })

    it('should return new direction when direction changes', () => {
      const state = createStickTypematicState()
      state.lastStickValue.set(0, 4) // previously Down
      state.lastStickReadTime.set(0, 0)

      mockGetRawStickState.mockReturnValue(8) // now Up
      const joystickView = {} as never
      expect(getStickStateWithTypematic(joystickView, state)).toBe(8)
      expect(state.lastStickValue.get(0)).toBe(8)
    })

    it('should suppress same direction within repeat interval', () => {
      const state = createStickTypematicState()
      state.lastStickValue.set(0, 8) // Up
      state.lastStickReadTime.set(0, 0)

      // Advance time but not enough for repeat
      vi.advanceTimersByTime(TIMING.STICK_REPEAT_INTERVAL_MS - 10)
      mockGetRawStickState.mockReturnValue(8) // Still Up
      const joystickView = {} as never
      expect(getStickStateWithTypematic(joystickView, state)).toBe(0)
    })

    it('should allow same direction after repeat interval elapses', () => {
      const state = createStickTypematicState()
      state.lastStickValue.set(0, 8) // Up
      state.lastStickReadTime.set(0, 0)

      // Advance past repeat interval
      vi.advanceTimersByTime(TIMING.STICK_REPEAT_INTERVAL_MS + 1)
      mockGetRawStickState.mockReturnValue(8) // Still Up
      const joystickView = {} as never
      expect(getStickStateWithTypematic(joystickView, state)).toBe(8)
    })

    it('should return 0 and clear tracking on release', () => {
      const state = createStickTypematicState()
      state.lastStickValue.set(0, 8)
      state.lastStickReadTime.set(0, 100)

      mockGetRawStickState.mockReturnValue(0) // Released
      const joystickView = {} as never
      expect(getStickStateWithTypematic(joystickView, state)).toBe(0)
      expect(state.lastStickValue.size).toBe(0)
      expect(state.lastStickReadTime.size).toBe(0)
    })
  })

  // ---------------------------------------------------------------------------
  // INKEY$
  // ---------------------------------------------------------------------------
  describe('getInkeyState', () => {
    it('should return empty string when view is null', () => {
      expect(getInkeyState(null)).toBe('')
    })

    it('should return keyChar from buffer', () => {
      mockGetInkeyFromBuffer.mockReturnValue({ keyChar: 'A', modifiers: 0 })
      const view = {} as KeyboardBufferView
      expect(getInkeyState(view)).toBe('A')
      expect(mockGetInkeyFromBuffer).toHaveBeenCalledWith(view)
    })
  })

  // ---------------------------------------------------------------------------
  // STRIG
  // ---------------------------------------------------------------------------
  describe('pushStrigEvent / consumeStrigEvent', () => {
    it('should push and consume a STRIG event', () => {
      const buffer = new Map<number, number[]>()
      pushStrigEvent(buffer, true, 0, 8)
      expect(buffer.get(0)).toEqual([8])
      expect(consumeStrigEvent(buffer, 0)).toBe(8)
      expect(buffer.get(0)).toEqual([])
    })

    it('should not push event when disabled', () => {
      const buffer = new Map<number, number[]>()
      pushStrigEvent(buffer, false, 0, 8)
      expect(buffer.has(0)).toBe(false)
    })

    it('should not push event when state is 0', () => {
      const buffer = new Map<number, number[]>()
      pushStrigEvent(buffer, true, 0, 0)
      expect(buffer.has(0)).toBe(false)
    })

    it('should queue multiple events for same joystick', () => {
      const buffer = new Map<number, number[]>()
      pushStrigEvent(buffer, true, 0, 8)
      pushStrigEvent(buffer, true, 0, 4)
      expect(buffer.get(0)).toEqual([8, 4])
    })

    it('should return 0 when no events for joystick', () => {
      const buffer = new Map<number, number[]>()
      expect(consumeStrigEvent(buffer, 0)).toBe(0)
    })

    it('should handle events for different joysticks independently', () => {
      const buffer = new Map<number, number[]>()
      pushStrigEvent(buffer, true, 0, 8)
      pushStrigEvent(buffer, true, 1, 4)
      expect(consumeStrigEvent(buffer, 0)).toBe(8)
      expect(consumeStrigEvent(buffer, 1)).toBe(4)
    })
  })
})
