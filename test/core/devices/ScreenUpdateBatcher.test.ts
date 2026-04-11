// @vitest-environment jsdom
/**
 * Unit tests for ScreenUpdateBatcher
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ScreenUpdateBatcher } from '@/core/devices/ScreenUpdateBatcher'

describe('ScreenUpdateBatcher', () => {
  let flushCallback: () => void
  let batcher: ScreenUpdateBatcher

  beforeEach(() => {
    vi.useFakeTimers()
    flushCallback = vi.fn<() => void>()
    batcher = new ScreenUpdateBatcher(flushCallback)
  })

  afterEach(() => {
    batcher.cancel()
    vi.useRealTimers()
  })

  describe('constructor', () => {
    it('should use default target FPS of 60', () => {
      expect(() => new ScreenUpdateBatcher(flushCallback)).not.toThrow()
    })

    it('should accept custom target FPS', () => {
      expect(() => new ScreenUpdateBatcher(flushCallback, { targetFps: 30 })).not.toThrow()
    })

    it('should accept custom max batch delay', () => {
      expect(() => new ScreenUpdateBatcher(flushCallback, { maxBatchDelayMs: 50 })).not.toThrow()
    })
  })

  describe('schedule', () => {
    it('should flush immediately when enough time has elapsed', () => {
      // Advance time past the frame interval (~16.67ms at 60fps)
      vi.advanceTimersByTime(20)

      batcher.schedule()
      expect(flushCallback).toHaveBeenCalledTimes(1)
    })

    it('should delay flush when called within same frame', () => {
      batcher.schedule()
      expect(flushCallback).not.toHaveBeenCalled()

      // Advance past frame interval
      vi.advanceTimersByTime(20)
      expect(flushCallback).toHaveBeenCalledTimes(1)
    })

    it('should batch multiple schedule calls within same frame', () => {
      batcher.schedule()
      batcher.schedule()
      batcher.schedule()

      expect(flushCallback).not.toHaveBeenCalled()

      vi.advanceTimersByTime(20)
      expect(flushCallback).toHaveBeenCalledTimes(1)
    })

    it('should not call flush when cancelled before timeout fires', () => {
      batcher.schedule()
      batcher.cancel()

      vi.advanceTimersByTime(100)
      expect(flushCallback).not.toHaveBeenCalled()
    })
  })

  describe('cancel', () => {
    it('should cancel pending scheduled flush', () => {
      batcher.schedule()
      batcher.cancel()

      vi.advanceTimersByTime(100)
      expect(flushCallback).not.toHaveBeenCalled()
    })

    it('should be safe to call when nothing is scheduled', () => {
      expect(() => batcher.cancel()).not.toThrow()
    })
  })

  describe('flush', () => {
    it('should call the flush callback', () => {
      batcher.schedule()
      vi.advanceTimersByTime(20)
      expect(flushCallback).toHaveBeenCalledTimes(1)
    })

    it('should not flush again if no pending update', () => {
      batcher.schedule()
      vi.advanceTimersByTime(20)
      expect(flushCallback).toHaveBeenCalledTimes(1)

      // Manually call flush again - should not call callback
      batcher.cancel()
      expect(() => batcher.schedule()).not.toThrow()
      vi.advanceTimersByTime(20)
      expect(flushCallback).toHaveBeenCalledTimes(2) // Only one more from the new schedule
    })

    it('should allow scheduling after flush', () => {
      batcher.schedule()
      vi.advanceTimersByTime(20)
      expect(flushCallback).toHaveBeenCalledTimes(1)

      // Schedule again
      batcher.schedule()
      vi.advanceTimersByTime(20)
      expect(flushCallback).toHaveBeenCalledTimes(2)
    })
  })

  describe('max batch delay', () => {
    it('should respect custom max batch delay', () => {
      const slowBatcher = new ScreenUpdateBatcher(flushCallback, {
        targetFps: 60,
        maxBatchDelayMs: 10,
      })

      slowBatcher.schedule()
      // Advance past maxBatchDelay but before frame interval
      vi.advanceTimersByTime(12)
      expect(flushCallback).toHaveBeenCalledTimes(1)

      slowBatcher.cancel()
    })
  })
})
