/**
 * Unit tests for DeviceSpritePositionHelpers
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { createSharedDisplayBuffer } from '@/core/animation/sharedDisplayBuffer'
import { SharedDisplayBufferAccessor } from '@/core/animation/sharedDisplayBufferAccessor'
import {
  getSpritePosition,
  postSpriteStates,
  type SpritePositionCache,
} from '@/core/devices/DeviceSpritePositionHelpers'
import type { DefSpriteDefinition, SpriteState } from '@/core/sprite/types'

// ============================================================================
// Helpers
// ============================================================================

/** Create a real SharedDisplayBufferAccessor with fresh shared buffer. */
function createAccessor(): SharedDisplayBufferAccessor {
  const sharedViews = createSharedDisplayBuffer()
  return new SharedDisplayBufferAccessor(sharedViews.buffer)
}

/** Complete DefSpriteDefinition mock with all required properties. */
function createMockDefSpriteDefinition(overrides: Partial<DefSpriteDefinition> = {}): DefSpriteDefinition {
  return {
    spriteNumber: 0,
    colorCombination: 0,
    size: 0,
    priority: 0,
    invertX: 0,
    invertY: 0,
    characterSet: [],
    tiles: [],
    ...overrides,
  }
}

/** Complete SpriteState mock with all required properties. */
function createMockSpriteState(overrides: Partial<SpriteState> = {}): SpriteState {
  return {
    spriteNumber: 0,
    x: 0,
    y: 0,
    visible: false,
    priority: 0,
    definition: null,
    ...overrides,
  }
}

// ============================================================================
// postMessage mock
// ============================================================================

let capturedMessages: unknown[] = []

beforeEach(() => {
  capturedMessages = []
  const selfTyped = self as typeof self & {
    postMessage: (msg: unknown, transfer?: Transferable[]) => void
  }
  selfTyped.postMessage = (msg: unknown) => {
    capturedMessages.push(msg)
  }
})

afterEach(() => {
  capturedMessages = []
})

// ============================================================================
// getSpritePosition
// ============================================================================

describe('DeviceSpritePositionHelpers', () => {
  describe('getSpritePosition', () => {
    it('should return null when accessor is null and cache is empty', () => {
      const cache: SpritePositionCache = new Map()
      const result = getSpritePosition(null, cache, 0)
      expect(result).toBeNull()
    })

    it('should return cached position when accessor is null', () => {
      const cache: SpritePositionCache = new Map()
      cache.set(2, { x: 100, y: 200 })
      const result = getSpritePosition(null, cache, 2)
      expect(result).toEqual({ x: 100, y: 200 })
    })

    it('should return cached position when accessor has no sprite data', () => {
      const accessor = createAccessor()
      const cache: SpritePositionCache = new Map()
      cache.set(3, { x: 50, y: 75 })
      // Fresh accessor has no sprite data written, so readSpritePosition returns null
      const result = getSpritePosition(accessor, cache, 3)
      expect(result).toEqual({ x: 50, y: 75 })
    })

    it('should return live position when non-origin and accessor has data', () => {
      const accessor = createAccessor()
      accessor.writeSpriteState(1, 120, 80, true, true)
      const cache: SpritePositionCache = new Map()
      const result = getSpritePosition(accessor, cache, 1)
      expect(result).toEqual({ x: 120, y: 80 })
    })

    it('should cache live position when returning it', () => {
      const accessor = createAccessor()
      accessor.writeSpriteState(1, 120, 80, true, true)
      const cache: SpritePositionCache = new Map()
      getSpritePosition(accessor, cache, 1)
      expect(cache.get(1)).toEqual({ x: 120, y: 80 })
    })

    it('should return origin position when sprite is active', () => {
      const accessor = createAccessor()
      // Write sprite at origin (0,0) with isActive=true
      accessor.writeSpriteState(0, 0, 0, true, false)
      const cache: SpritePositionCache = new Map()
      const result = getSpritePosition(accessor, cache, 0)
      expect(result).toEqual({ x: 0, y: 0 })
    })

    it('should return origin position when sprite is visible', () => {
      const accessor = createAccessor()
      // Write sprite at origin (0,0) with isVisible=true
      accessor.writeSpriteState(0, 0, 0, false, true)
      const cache: SpritePositionCache = new Map()
      const result = getSpritePosition(accessor, cache, 0)
      expect(result).toEqual({ x: 0, y: 0 })
    })

    it('should fall back to cache when origin position and sprite is inactive and invisible', () => {
      const accessor = createAccessor()
      // Write sprite at origin (0,0) with isActive=false, isVisible=false
      accessor.writeSpriteState(0, 0, 0, false, false)
      const cache: SpritePositionCache = new Map()
      cache.set(0, { x: 42, y: 99 })
      const result = getSpritePosition(accessor, cache, 0)
      expect(result).toEqual({ x: 42, y: 99 })
    })

    it('should return null when origin position, sprite inactive/invisible, and no cache', () => {
      const accessor = createAccessor()
      // Write sprite at origin (0,0) with isActive=false, isVisible=false
      accessor.writeSpriteState(0, 0, 0, false, false)
      const cache: SpritePositionCache = new Map()
      const result = getSpritePosition(accessor, cache, 0)
      expect(result).toBeNull()
    })

    it('should handle different actionNumbers independently', () => {
      const accessor = createAccessor()
      // Only action 1 has data; action 0 has nothing written
      accessor.writeSpriteState(1, 10, 20, true, true)
      const cache: SpritePositionCache = new Map()
      cache.set(0, { x: 100, y: 200 })

      const result0 = getSpritePosition(accessor, cache, 0)
      const result1 = getSpritePosition(accessor, cache, 1)

      expect(result0).toEqual({ x: 100, y: 200 }) // fallback to cache
      expect(result1).toEqual({ x: 10, y: 20 })   // live position
      expect(cache.get(1)).toEqual({ x: 10, y: 20 }) // live was cached
    })

    it('should update cache when live position changes for same actionNumber', () => {
      const accessor1 = createAccessor()
      accessor1.writeSpriteState(1, 10, 20, true, true)

      const accessor2 = createAccessor()
      accessor2.writeSpriteState(1, 30, 40, true, true)

      const cache: SpritePositionCache = new Map()

      getSpritePosition(accessor1, cache, 1)
      expect(cache.get(1)).toEqual({ x: 10, y: 20 })

      getSpritePosition(accessor2, cache, 1)
      expect(cache.get(1)).toEqual({ x: 30, y: 40 })
    })

    it('should handle boundary actionNumber 7 (max sprite slot)', () => {
      const accessor = createAccessor()
      accessor.writeSpriteState(7, 255, 255, true, true)
      const cache: SpritePositionCache = new Map()
      const result = getSpritePosition(accessor, cache, 7)
      expect(result).toEqual({ x: 255, y: 255 })
      expect(cache.get(7)).toEqual({ x: 255, y: 255 })
    })

    it('should handle actionNumber 0 correctly', () => {
      const accessor = createAccessor()
      accessor.writeSpriteState(0, 1, 1, true, true)
      const cache: SpritePositionCache = new Map()
      const result = getSpritePosition(accessor, cache, 0)
      expect(result).toEqual({ x: 1, y: 1 })
    })

    it('should not modify cache for other actionNumbers when reading one', () => {
      const accessor = createAccessor()
      accessor.writeSpriteState(1, 50, 60, true, true)
      const cache: SpritePositionCache = new Map()
      cache.set(2, { x: 100, y: 200 })

      getSpritePosition(accessor, cache, 1)

      expect(cache.get(2)).toEqual({ x: 100, y: 200 }) // untouched
      expect(cache.get(1)).toEqual({ x: 50, y: 60 })   // newly set
    })

    it('should not cache origin position when sprite is inactive and invisible', () => {
      const accessor = createAccessor()
      accessor.writeSpriteState(0, 0, 0, false, false)
      const cache: SpritePositionCache = new Map()
      getSpritePosition(accessor, cache, 0)
      // Cache should NOT be updated since origin + inactive + invisible = fallback
      expect(cache.has(0)).toBe(false)
    })

    it('should cache origin position when sprite is active', () => {
      const accessor = createAccessor()
      accessor.writeSpriteState(0, 0, 0, true, false)
      const cache: SpritePositionCache = new Map()
      getSpritePosition(accessor, cache, 0)
      expect(cache.get(0)).toEqual({ x: 0, y: 0 })
    })

    it('should cache origin position when sprite is visible', () => {
      const accessor = createAccessor()
      accessor.writeSpriteState(0, 0, 0, false, true)
      const cache: SpritePositionCache = new Map()
      getSpritePosition(accessor, cache, 0)
      expect(cache.get(0)).toEqual({ x: 0, y: 0 })
    })

    it('should prefer live position over cache even when cache exists', () => {
      const accessor = createAccessor()
      accessor.writeSpriteState(1, 50, 60, true, true)
      const cache: SpritePositionCache = new Map()
      cache.set(1, { x: 200, y: 300 }) // stale cached position
      const result = getSpritePosition(accessor, cache, 1)
      expect(result).toEqual({ x: 50, y: 60 }) // live wins
      expect(cache.get(1)).toEqual({ x: 50, y: 60 }) // cache updated
    })
  })

  // ============================================================================
  // postSpriteStates
  // ============================================================================

  describe('postSpriteStates', () => {
    it('should post a SPRITE_STATES message via postMessage', () => {
      const states: SpriteState[] = []
      postSpriteStates(states, true)
      expect(capturedMessages.length).toBe(1)
      const msg = capturedMessages[0] as Record<string, unknown>
      expect(msg.type).toBe('SPRITE_STATES')
    })

    it('should include spriteStates in the data field', () => {
      const states: SpriteState[] = [
        createMockSpriteState({ spriteNumber: 0, x: 10, y: 20, visible: true }),
        createMockSpriteState({ spriteNumber: 1, x: 30, y: 40, visible: false }),
      ]
      postSpriteStates(states, true)
      const msg = capturedMessages[0] as Record<string, unknown>
      const data = msg.data as Record<string, unknown>
      expect(data.spriteStates).toEqual(states)
    })

    it('should include spriteEnabled true in the data field', () => {
      postSpriteStates([], true)
      const msg = capturedMessages[0] as Record<string, unknown>
      const data = msg.data as Record<string, unknown>
      expect(data.spriteEnabled).toBe(true)
    })

    it('should include spriteEnabled false in the data field', () => {
      postSpriteStates([], false)
      const msg = capturedMessages[0] as Record<string, unknown>
      const data = msg.data as Record<string, unknown>
      expect(data.spriteEnabled).toBe(false)
    })

    it('should include an id field with "sprite-states-" prefix', () => {
      postSpriteStates([], true)
      const msg = capturedMessages[0] as Record<string, unknown>
      expect(msg.id).toMatch(/^sprite-states-\d+$/)
    })

    it('should include a timestamp field', () => {
      const before = Date.now()
      postSpriteStates([], true)
      const after = Date.now()
      const msg = capturedMessages[0] as Record<string, unknown>
      expect(msg.timestamp).toBeGreaterThanOrEqual(before)
      expect(msg.timestamp).toBeLessThanOrEqual(after)
    })

    it('should handle empty sprite states array', () => {
      postSpriteStates([], true)
      const msg = capturedMessages[0] as Record<string, unknown>
      const data = msg.data as Record<string, unknown>
      expect(data.spriteStates).toEqual([])
    })

    it('should handle sprite states with definitions', () => {
      const defSprite = createMockDefSpriteDefinition({ spriteNumber: 3, colorCombination: 2 })
      const states: SpriteState[] = [
        createMockSpriteState({
          spriteNumber: 3,
          x: 100,
          y: 150,
          visible: true,
          priority: 1,
          definition: defSprite,
        }),
      ]
      postSpriteStates(states, false)
      const msg = capturedMessages[0] as Record<string, unknown>
      const data = msg.data as Record<string, unknown>
      expect(data.spriteStates).toEqual(states)
      expect(data.spriteEnabled).toBe(false)
    })

    it('should handle sprite states with null definition', () => {
      const states: SpriteState[] = [
        createMockSpriteState({ spriteNumber: 0, definition: null }),
      ]
      postSpriteStates(states, true)
      const msg = capturedMessages[0] as Record<string, unknown>
      const data = msg.data as { spriteStates: SpriteState[]; spriteEnabled: boolean }
      expect(data.spriteStates).toEqual(states)
      expect(data.spriteStates.length).toBe(1)
    })

    it('should handle multiple sprite states (up to 8)', () => {
      const states: SpriteState[] = Array.from({ length: 8 }, (_, i) =>
        createMockSpriteState({ spriteNumber: i, x: i * 10, y: i * 20 })
      )
      postSpriteStates(states, true)
      const msg = capturedMessages[0] as Record<string, unknown>
      const data = msg.data as { spriteStates: SpriteState[]; spriteEnabled: boolean }
      expect(data.spriteStates.length).toBe(8)
    })

    it('should generate correctly formatted ids for consecutive calls', () => {
      postSpriteStates([], true)
      postSpriteStates([], true)
      const msg1 = capturedMessages[0] as Record<string, unknown>
      const msg2 = capturedMessages[1] as Record<string, unknown>
      // IDs are based on Date.now() so they could theoretically be the same
      // if called within the same millisecond, but the message format is consistent
      expect(msg1.id).toMatch(/^sprite-states-\d+$/)
      expect(msg2.id).toMatch(/^sprite-states-\d+$/)
    })
  })
})
