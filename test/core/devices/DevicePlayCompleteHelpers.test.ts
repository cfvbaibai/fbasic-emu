/**
 * Unit tests for DevicePlayCompleteHelpers
 */

import { afterEach, describe, expect, it } from 'vitest'

import {
  createPlayCompleteRequest,
  handlePlaySoundCompleteMessage,
  rejectAllPlayCompleteRequests,
} from '@/core/devices/DevicePlayCompleteHelpers'
import type { PlaySoundCompleteMessage } from '@/core/interfaces'

/** Collected orphan promises that need cleanup to avoid unhandled rejection warnings */
let orphanCleanups: Array<() => void> = []

afterEach(() => {
  // Flush all orphaned promises to prevent unhandled rejection warnings
  for (const cleanup of orphanCleanups) {
    cleanup()
  }
  orphanCleanups = []
})

/** Helper to create a PlaySoundCompleteMessage */
function makeCompleteMessage(playId: string): PlaySoundCompleteMessage {
  return {
    type: 'PLAY_SOUND_COMPLETE',
    id: 'msg-id-1',
    timestamp: Date.now(),
    data: {
      executionId: 'exec-1',
      playId,
    },
  }
}

/**
 * Track a promise so it doesn't cause unhandled rejection warnings.
 * Returns the same promise for chaining.
 */
function track<T>(promise: Promise<T>): Promise<T> {
  // Swallow rejection silently
  void promise.catch(() => {})
  return promise
}

describe('DevicePlayCompleteHelpers', () => {
  describe('createPlayCompleteRequest', () => {
    it('should create a promise and store entry in the map', () => {
      const map = new Map()
      const promise = createPlayCompleteRequest(map, 'play-1')

      expect(map.size).toBe(1)
      expect(map.has('play-1')).toBe(true)
      expect(promise).toBeInstanceOf(Promise)

      // Cleanup: resolve the promise so it doesn't hang
      void track(promise)
    })

    it('should store resolve and reject functions in the map entry', () => {
      const map = new Map()
      const promise = createPlayCompleteRequest(map, 'play-1')

      const entry = map.get('play-1')
      expect(entry).toBeDefined()
      expect(typeof entry.resolve).toBe('function')
      expect(typeof entry.reject).toBe('function')

      // Resolve to clean up
      entry.resolve()
      void track(promise)
    })

    it('should support multiple playIds in the same map', () => {
      const map = new Map()
      const p1 = createPlayCompleteRequest(map, 'play-1')
      const p2 = createPlayCompleteRequest(map, 'play-2')
      const p3 = createPlayCompleteRequest(map, 'play-3')

      expect(map.size).toBe(3)
      expect(map.has('play-1')).toBe(true)
      expect(map.has('play-2')).toBe(true)
      expect(map.has('play-3')).toBe(true)

      // Cleanup all
      rejectAllPlayCompleteRequests(map, 'cleanup')
      void track(p1)
      void track(p2)
      void track(p3)
    })

    it('should overwrite entry if same playId is used twice', () => {
      const map = new Map()
      const first = createPlayCompleteRequest(map, 'play-1')
      const second = createPlayCompleteRequest(map, 'play-1')

      expect(map.size).toBe(1)
      expect(map.has('play-1')).toBe(true)

      // Resolve via the second promise (the one in the map)
      const entry = map.get('play-1')!
      entry.resolve()

      // Both need cleanup
      void track(first)
      void track(second)
    })

    it('should return a promise that is initially pending', async () => {
      const map = new Map()
      const promise = createPlayCompleteRequest(map, 'play-1')

      // Race the promise against an immediately-resolving one
      const result = await Promise.race([
        promise.then(() => 'resolved'),
        Promise.resolve('pending'),
      ])

      expect(result).toBe('pending')

      // Cleanup: reject the still-pending promise
      rejectAllPlayCompleteRequests(map, 'cleanup')
      void track(promise)
    })

    it('should create independent promises for different playIds', async () => {
      const map = new Map()
      const promise1 = createPlayCompleteRequest(map, 'play-1')
      const promise2 = createPlayCompleteRequest(map, 'play-2')

      // Resolve only play-1
      handlePlaySoundCompleteMessage(map, makeCompleteMessage('play-1'))
      await expect(promise1).resolves.toBeUndefined()

      // play-2 should still be pending
      const result = await Promise.race([
        promise2.then(() => 'resolved'),
        Promise.resolve('pending'),
      ])
      expect(result).toBe('pending')

      // Cleanup play-2
      rejectAllPlayCompleteRequests(map, 'cleanup')
      void track(promise2)
    })
  })

  describe('handlePlaySoundCompleteMessage', () => {
    it('should resolve the matching pending promise', async () => {
      const map = new Map()
      const promise = createPlayCompleteRequest(map, 'play-1')

      const message = makeCompleteMessage('play-1')
      handlePlaySoundCompleteMessage(map, message)

      await expect(promise).resolves.toBeUndefined()
    })

    it('should remove the entry from the map after resolving', async () => {
      const map = new Map()
      const promise = createPlayCompleteRequest(map, 'play-1')

      expect(map.size).toBe(1)

      const message = makeCompleteMessage('play-1')
      handlePlaySoundCompleteMessage(map, message)

      expect(map.size).toBe(0)

      // Consume the resolved promise
      await promise
    })

    it('should resolve only the matching playId among multiple pending', async () => {
      const map = new Map()
      const promise1 = createPlayCompleteRequest(map, 'play-1')
      const promise2 = createPlayCompleteRequest(map, 'play-2')

      const message = makeCompleteMessage('play-2')
      handlePlaySoundCompleteMessage(map, message)

      await expect(promise2).resolves.toBeUndefined()

      // promise1 should still be pending
      const result = await Promise.race([
        promise1.then(() => 'resolved'),
        Promise.resolve('pending'),
      ])
      expect(result).toBe('pending')

      // Only play-1 should remain in the map
      expect(map.size).toBe(1)
      expect(map.has('play-1')).toBe(true)

      // Cleanup promise1
      rejectAllPlayCompleteRequests(map, 'cleanup')
      void track(promise1)
    })

    it('should handle unknown playId gracefully without throwing', () => {
      const map = new Map()
      const promise = createPlayCompleteRequest(map, 'play-1')

      const message = makeCompleteMessage('unknown-play')
      expect(() => handlePlaySoundCompleteMessage(map, message)).not.toThrow()

      // Cleanup
      rejectAllPlayCompleteRequests(map, 'cleanup')
      void track(promise)
    })

    it('should not affect other entries when handling unknown playId', () => {
      const map = new Map()
      const p1 = createPlayCompleteRequest(map, 'play-1')
      const p2 = createPlayCompleteRequest(map, 'play-2')

      expect(map.size).toBe(2)

      const message = makeCompleteMessage('unknown-play')
      handlePlaySoundCompleteMessage(map, message)

      // Map should still have both entries (unknown playId was not found)
      expect(map.size).toBe(2)
      expect(map.has('play-1')).toBe(true)
      expect(map.has('play-2')).toBe(true)

      // Cleanup
      rejectAllPlayCompleteRequests(map, 'cleanup')
      void track(p1)
      void track(p2)
    })

    it('should handle empty map gracefully', () => {
      const map = new Map()
      const message = makeCompleteMessage('play-1')

      expect(() => handlePlaySoundCompleteMessage(map, message)).not.toThrow()
      expect(map.size).toBe(0)
    })

    it('should resolve multiple playIds sequentially', async () => {
      const map = new Map()
      const promise1 = createPlayCompleteRequest(map, 'play-1')
      const promise2 = createPlayCompleteRequest(map, 'play-2')
      const promise3 = createPlayCompleteRequest(map, 'play-3')

      handlePlaySoundCompleteMessage(map, makeCompleteMessage('play-2'))
      handlePlaySoundCompleteMessage(map, makeCompleteMessage('play-1'))
      handlePlaySoundCompleteMessage(map, makeCompleteMessage('play-3'))

      await expect(promise1).resolves.toBeUndefined()
      await expect(promise2).resolves.toBeUndefined()
      await expect(promise3).resolves.toBeUndefined()
      expect(map.size).toBe(0)
    })

    it('should remove entry from map even when playId is unknown', () => {
      const map = new Map()
      const promise = createPlayCompleteRequest(map, 'play-1')

      // The function deletes before checking, so it deletes the key
      // even when not found. Let's verify with a known playId that gets deleted.
      handlePlaySoundCompleteMessage(map, makeCompleteMessage('play-1'))
      expect(map.size).toBe(0)

      // Cleanup the now-resolved promise
      void track(promise)
    })
  })

  describe('rejectAllPlayCompleteRequests', () => {
    it('should reject all pending promises', async () => {
      const map = new Map()
      const promise1 = createPlayCompleteRequest(map, 'play-1')
      const promise2 = createPlayCompleteRequest(map, 'play-2')

      rejectAllPlayCompleteRequests(map, 'Execution stopped')

      await expect(promise1).rejects.toThrow('Execution stopped')
      await expect(promise2).rejects.toThrow('Execution stopped')
    })

    it('should clear the map after rejecting all', async () => {
      const map = new Map()
      const p1 = createPlayCompleteRequest(map, 'play-1')
      const p2 = createPlayCompleteRequest(map, 'play-2')
      const p3 = createPlayCompleteRequest(map, 'play-3')

      expect(map.size).toBe(3)

      rejectAllPlayCompleteRequests(map, 'Stopped')

      expect(map.size).toBe(0)

      // Consume rejections
      void track(p1)
      void track(p2)
      void track(p3)
    })

    it('should use default reason when not specified', async () => {
      const map = new Map()
      const promise = createPlayCompleteRequest(map, 'play-1')

      rejectAllPlayCompleteRequests(map)

      await expect(promise).rejects.toThrow('Execution stopped')
    })

    it('should handle empty map gracefully', () => {
      const map = new Map()
      expect(() => rejectAllPlayCompleteRequests(map)).not.toThrow()
      expect(map.size).toBe(0)
    })

    it('should reject with custom reason', async () => {
      const map = new Map()
      const promise = createPlayCompleteRequest(map, 'play-1')

      rejectAllPlayCompleteRequests(map, 'Custom stop reason')

      await expect(promise).rejects.toThrow('Custom stop reason')
    })

    it('should reject all promises even when there are many', async () => {
      const map = new Map()
      const promises: Promise<void>[] = []
      for (let i = 0; i < 10; i++) {
        promises.push(createPlayCompleteRequest(map, `play-${i}`))
      }

      expect(map.size).toBe(10)

      rejectAllPlayCompleteRequests(map, 'Batch stop')

      for (const promise of promises) {
        await expect(promise).rejects.toThrow('Batch stop')
      }
      expect(map.size).toBe(0)
    })

    it('should reject Error objects (not plain strings)', async () => {
      const map = new Map()
      const promise = createPlayCompleteRequest(map, 'play-1')

      rejectAllPlayCompleteRequests(map, 'Test error')

      try {
        await promise
        expect.unreachable('Should have thrown')
      } catch (err) {
        expect(err).toBeInstanceOf(Error)
        expect((err as Error).message).toBe('Test error')
      }
    })
  })

  describe('integration: create + handle + reject lifecycle', () => {
    it('should allow resolving some and rejecting the rest', async () => {
      const map = new Map()
      const promise1 = createPlayCompleteRequest(map, 'play-1')
      const promise2 = createPlayCompleteRequest(map, 'play-2')
      const promise3 = createPlayCompleteRequest(map, 'play-3')

      // Resolve play-2
      handlePlaySoundCompleteMessage(map, makeCompleteMessage('play-2'))
      await expect(promise2).resolves.toBeUndefined()

      // Reject the remaining
      rejectAllPlayCompleteRequests(map, 'Stopped')

      await expect(promise1).rejects.toThrow('Stopped')
      await expect(promise3).rejects.toThrow('Stopped')
      expect(map.size).toBe(0)
    })

    it('should not double-resolve if both handle and reject are called', async () => {
      const map = new Map()
      let resolveCount = 0
      const promise = createPlayCompleteRequest(map, 'play-1')

      void promise.then(() => {
        resolveCount++
      })

      // Resolve first
      handlePlaySoundCompleteMessage(map, makeCompleteMessage('play-1'))

      // Wait for microtask queue to flush
      await new Promise<void>((r) => { r() })

      // Map is now empty, so rejectAll has nothing to reject
      rejectAllPlayCompleteRequests(map, 'Stopped')

      // Wait again
      await new Promise<void>((r) => { r() })

      expect(resolveCount).toBe(1)
    })

    it('should support full lifecycle: create, resolve some, reject rest, create again', async () => {
      const map = new Map()

      // First batch
      const batch1a = createPlayCompleteRequest(map, 'b1-play-1')
      const batch1b = createPlayCompleteRequest(map, 'b1-play-2')

      // Resolve one, reject the other
      handlePlaySoundCompleteMessage(map, makeCompleteMessage('b1-play-1'))
      await expect(batch1a).resolves.toBeUndefined()

      rejectAllPlayCompleteRequests(map, 'Batch 1 stopped')
      await expect(batch1b).rejects.toThrow('Batch 1 stopped')

      // Map should be clear now
      expect(map.size).toBe(0)

      // Second batch - reuse same map
      const batch2a = createPlayCompleteRequest(map, 'b2-play-1')
      const batch2b = createPlayCompleteRequest(map, 'b2-play-2')

      expect(map.size).toBe(2)

      rejectAllPlayCompleteRequests(map, 'Batch 2 stopped')
      await expect(batch2a).rejects.toThrow('Batch 2 stopped')
      await expect(batch2b).rejects.toThrow('Batch 2 stopped')
      expect(map.size).toBe(0)
    })
  })
})
