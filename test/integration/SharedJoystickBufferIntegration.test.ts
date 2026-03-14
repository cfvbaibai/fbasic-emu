/**
 * Shared Joystick Buffer Integration Tests
 *
 * Tests the zero-copy joystick input flow:
 * - Main thread writes directly to shared buffer
 * - Executor Worker reads from shared buffer via STICK()
 * - STICK: lasting state (direct buffer read)
 * - STRIG: consume pattern (queue-based, not from buffer)
 */

import { beforeEach, describe, expect, it } from 'vitest'

import {
  createSharedJoystickBuffer,
  createViewsFromJoystickBuffer,
  type JoystickBufferView,
  setStickState,
} from '@/core/devices'

describe('Shared Joystick Buffer Integration', () => {
  let buffer: SharedArrayBuffer
  let view: JoystickBufferView

  beforeEach(() => {
    buffer = createSharedJoystickBuffer()
    view = createViewsFromJoystickBuffer(buffer)
  })

  describe('Buffer Creation and Layout', () => {
    it('should create buffer of correct size (32 bytes)', () => {
      expect(buffer.byteLength).toBe(32)
    })

    it('should initialize all values to 0', () => {
      expect(view.stickState[0]).toBe(0)
      expect(view.stickState[1]).toBe(0)
      expect(view.strigState[0]).toBe(0)
      expect(view.strigState[1]).toBe(0)
    })

    it('should create views with correct lengths', () => {
      expect(view.stickState.length).toBe(2)
      expect(view.strigState.length).toBe(2)
      expect(view.buffer).toBe(buffer)
    })
  })

  describe('STICK - Lasting State Behavior (Direct Buffer Read)', () => {
    it('should persist value across multiple reads (lasting state)', () => {
      // Simulate main thread writing to buffer
      setStickState(view, 0, 8) // UP

      // Simulate multiple worker reads
      const read1 = view.stickState[0]
      const read2 = view.stickState[0]
      const read3 = view.stickState[0]

      // All reads should return the same value (8 = UP)
      expect(read1).toBe(8)
      expect(read2).toBe(8)
      expect(read3).toBe(8)
    })

    it('should update to new value when changed', () => {
      // Start with RIGHT
      setStickState(view, 0, 1)
      expect(view.stickState[0]).toBe(1)

      // Change to LEFT
      setStickState(view, 0, 2)
      expect(view.stickState[0]).toBe(2)

      // Change to DOWN
      setStickState(view, 0, 4)
      expect(view.stickState[0]).toBe(4)
    })

    it('should reset to 0 on release', () => {
      // Press UP
      setStickState(view, 0, 8)
      expect(view.stickState[0]).toBe(8)

      // Release
      setStickState(view, 0, 0)
      expect(view.stickState[0]).toBe(0)
    })

    it('should handle both joysticks independently', () => {
      setStickState(view, 0, 1) // Joystick 0: RIGHT
      setStickState(view, 1, 8) // Joystick 1: UP

      expect(view.stickState[0]).toBe(1)
      expect(view.stickState[1]).toBe(8)

      // Release joystick 0 only
      setStickState(view, 0, 0)

      expect(view.stickState[0]).toBe(0) // Joystick 0 released
      expect(view.stickState[1]).toBe(8) // Joystick 1 still UP
    })

    it('should allow directional combinations (bit flags)', () => {
      // UP + RIGHT = 8 + 1 = 9
      setStickState(view, 0, 9)
      expect(view.stickState[0]).toBe(9)

      // DOWN + LEFT = 4 + 2 = 6
      setStickState(view, 0, 6)
      expect(view.stickState[0]).toBe(6)

      // All directions = 15
      setStickState(view, 0, 15)
      expect(view.stickState[0]).toBe(15)
    })
  })

  describe('STRIG - Buffer Write (But Production Uses Queue)', () => {
    it('should write STRIG values to buffer', () => {
      // Write A button press
      view.strigState[0] = 8

      // Buffer reflects the write
      expect(view.strigState[0]).toBe(8)
    })

    it('should allow multiple button combinations', () => {
      // A + B = 8 + 4 = 12
      view.strigState[0] = 12
      expect(view.strigState[0]).toBe(12)
    })

    it('should reset to 0', () => {
      view.strigState[0] = 8
      expect(view.strigState[0]).toBe(8)

      view.strigState[0] = 0
      expect(view.strigState[0]).toBe(0)
    })

    it('should handle both joysticks independently', () => {
      view.strigState[0] = 8 // Joystick 0: A button
      view.strigState[1] = 4 // Joystick 1: B button

      expect(view.strigState[0]).toBe(8)
      expect(view.strigState[1]).toBe(4)
    })
  })

  describe('Zero-Copy Performance Characteristics', () => {
    it('should support rapid writes without message overhead', () => {
      const iterations = 20_000

      const measureDuration = (writer: (state: number) => void): number => {
        const startTime = performance.now()
        for (let i = 0; i < iterations; i++) {
          writer(1) // RIGHT
          writer(2) // LEFT
          writer(0) // Release
        }
        return performance.now() - startTime
      }

      // Control path: raw buffer assignment under the same loop shape.
      const baselineDuration = measureDuration((state) => {
        view.stickState[0] = state
      })

      const setStickStateDuration = measureDuration((state) => {
        setStickState(view, 0, state)
      })

      // Relative threshold avoids flaky absolute wall-clock assumptions while still
      // detecting major overhead regressions (e.g., accidental messaging/sync work).
      const baselineFloorMs = Math.max(baselineDuration, 0.5)
      expect(setStickStateDuration).toBeLessThanOrEqual(baselineFloorMs * 8)
    })

    it('should support concurrent read/write (same joystick)', () => {
      // Simulate game loop: worker reads while main thread writes
      for (let i = 0; i < 100; i++) {
        // Main thread writes
        setStickState(view, 0, i % 16) // Various directions

        // Worker reads (should see latest value)
        const readValue = view.stickState[0]
        expect(readValue).toBe(i % 16)
      }
    })

    it('should maintain consistent state during rapid changes', () => {
      // Simulate dpad hold repeat (every 100ms)
      const values: number[] = []

      for (let i = 0; i < 10; i++) {
        setStickState(view, 0, 1) // RIGHT
        values.push(view.stickState[0] ?? 0)

        // Simulate some "processing time"
        void Array(100).fill(0)

        setStickState(view, 0, 2) // LEFT
        values.push(view.stickState[0] ?? 0)
      }

      // All values should be consistent (no torn reads)
      values.forEach((val, idx) => {
        const expected = idx % 2 === 0 ? 1 : 2
        expect(val).toBe(expected)
      })
    })
  })

  describe('Production Flow Simulation', () => {
    it('should simulate typical game loop: read → process → read', () => {
      // Simulate: user holds RIGHT, game loop reads multiple times
      setStickState(view, 0, 1)

      // Game loop iteration 1
      const s1 = view.stickState[0]
      const aimX1 = 100 + (s1 === 1 ? 1 : 0) // Move RIGHT if pressed

      // Game loop iteration 2
      const s2 = view.stickState[0]
      const aimX2 = aimX1 + (s2 === 1 ? 1 : 0)

      // Game loop iteration 3
      const s3 = view.stickState[0]
      const aimX3 = aimX2 + (s3 === 1 ? 1 : 0)

      // All reads should return 1 (RIGHT)
      expect(s1).toBe(1)
      expect(s2).toBe(1)
      expect(s3).toBe(1)

      // Aim should move right each time
      expect(aimX1).toBe(101)
      expect(aimX2).toBe(102)
      expect(aimX3).toBe(103)
    })

    it('should simulate button release during game loop', () => {
      // Hold RIGHT
      setStickState(view, 0, 1)
      const s1 = view.stickState[0] // Should be 1

      // Release
      setStickState(view, 0, 0)
      const s2 = view.stickState[0] // Should be 0

      expect(s1).toBe(1)
      expect(s2).toBe(0)
    })
  })
})
