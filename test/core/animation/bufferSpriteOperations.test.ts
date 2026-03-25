/**
 * bufferSpriteOperations unit tests
 *
 * Covers writeSpriteStateToView, clearAllSprites, all individual sprite
 * property readers (position, flags, animation, visual), and readAllMovementStates.
 */

import { describe, expect, it } from 'vitest'

import {
  clearAllSprites,
  readAllMovementStates,
  readSpriteCharacterTypeFromView,
  readSpriteColorCombinationFromView,
  readSpriteDirectionFromView,
  readSpriteFrameIndexFromView,
  readSpriteIsActiveFromView,
  readSpriteIsVisibleFromView,
  readSpritePositionFromView,
  readSpritePriorityFromView,
  readSpriteRemainingDistanceFromView,
  readSpriteSpeedFromView,
  readSpriteTotalDistanceFromView,
  writeSpriteStateToView,
} from '@/core/animation/bufferSpriteOperations'
import { MAX_SPRITES, slotBase,SPRITE_DATA_FLOATS } from '@/core/animation/sharedDisplayBuffer'

function createView(): Float64Array {
  return new Float64Array(SPRITE_DATA_FLOATS)
}

describe('bufferSpriteOperations', () => {
  describe('writeSpriteStateToView / readSpritePositionFromView', () => {
    it('should write and read sprite position', () => {
      const view = createView()

      writeSpriteStateToView(view, 0, 100, 50, true, true)

      expect(readSpritePositionFromView(view, 0)).toEqual({ x: 100, y: 50 })
    })

    it('should write position for multiple sprites', () => {
      const view = createView()

      writeSpriteStateToView(view, 0, 10, 20, false, false)
      writeSpriteStateToView(view, 3, 200, 150, false, false)
      writeSpriteStateToView(view, 7, 255, 240, false, false)

      expect(readSpritePositionFromView(view, 0)).toEqual({ x: 10, y: 20 })
      expect(readSpritePositionFromView(view, 3)).toEqual({ x: 200, y: 150 })
      expect(readSpritePositionFromView(view, 7)).toEqual({ x: 255, y: 240 })
    })
  })

  describe('readSpriteIsActiveFromView', () => {
    it('should return true when active', () => {
      const view = createView()
      writeSpriteStateToView(view, 0, 0, 0, true, false)

      expect(readSpriteIsActiveFromView(view, 0)).toEqual(true)
    })

    it('should return false when inactive', () => {
      const view = createView()
      writeSpriteStateToView(view, 0, 0, 0, false, false)

      expect(readSpriteIsActiveFromView(view, 0)).toEqual(false)
    })

    it('should return false for out-of-range action number', () => {
      const view = createView()

      expect(readSpriteIsActiveFromView(view, -1)).toEqual(false)
      expect(readSpriteIsActiveFromView(view, MAX_SPRITES)).toEqual(false)
    })
  })

  describe('readSpriteIsVisibleFromView', () => {
    it('should return true when visible', () => {
      const view = createView()
      writeSpriteStateToView(view, 0, 0, 0, false, true)

      expect(readSpriteIsVisibleFromView(view, 0)).toEqual(true)
    })

    it('should return false when not visible', () => {
      const view = createView()
      writeSpriteStateToView(view, 0, 0, 0, false, false)

      expect(readSpriteIsVisibleFromView(view, 0)).toEqual(false)
    })

    it('should return false for out-of-range action number', () => {
      const view = createView()

      expect(readSpriteIsVisibleFromView(view, -1)).toEqual(false)
      expect(readSpriteIsVisibleFromView(view, MAX_SPRITES)).toEqual(false)
    })
  })

  describe('readSpriteFrameIndexFromView', () => {
    it('should read frame index', () => {
      const view = createView()
      writeSpriteStateToView(view, 0, 0, 0, true, true, 5)

      expect(readSpriteFrameIndexFromView(view, 0)).toEqual(5)
    })

    it('should return 0 for out-of-range action number', () => {
      const view = createView()

      expect(readSpriteFrameIndexFromView(view, -1)).toEqual(0)
    })
  })

  describe('readSpriteRemainingDistanceFromView', () => {
    it('should read remaining distance', () => {
      const view = createView()
      writeSpriteStateToView(view, 0, 0, 0, true, true, 0, 100)

      expect(readSpriteRemainingDistanceFromView(view, 0)).toEqual(100)
    })

    it('should return 0 for out-of-range action number', () => {
      const view = createView()

      expect(readSpriteRemainingDistanceFromView(view, MAX_SPRITES)).toEqual(0)
    })
  })

  describe('readSpriteTotalDistanceFromView', () => {
    it('should read total distance', () => {
      const view = createView()
      writeSpriteStateToView(view, 0, 0, 0, true, true, 0, 0, 200)

      expect(readSpriteTotalDistanceFromView(view, 0)).toEqual(200)
    })

    it('should return 0 for out-of-range action number', () => {
      const view = createView()

      expect(readSpriteTotalDistanceFromView(view, MAX_SPRITES)).toEqual(0)
    })
  })

  describe('readSpriteDirectionFromView', () => {
    it('should read direction', () => {
      const view = createView()
      writeSpriteStateToView(view, 0, 0, 0, true, true, 0, 0, 0, 3)

      expect(readSpriteDirectionFromView(view, 0)).toEqual(3)
    })

    it('should return 0 for out-of-range action number', () => {
      const view = createView()

      expect(readSpriteDirectionFromView(view, -1)).toEqual(0)
    })
  })

  describe('readSpriteSpeedFromView', () => {
    it('should read speed', () => {
      const view = createView()
      writeSpriteStateToView(view, 0, 0, 0, true, true, 0, 0, 0, 0, 60)

      expect(readSpriteSpeedFromView(view, 0)).toEqual(60)
    })

    it('should return 0 for out-of-range action number', () => {
      const view = createView()

      expect(readSpriteSpeedFromView(view, -1)).toEqual(0)
    })
  })

  describe('readSpritePriorityFromView', () => {
    it('should read priority', () => {
      const view = createView()
      writeSpriteStateToView(view, 0, 0, 0, true, true, 0, 0, 0, 0, 0, 1)

      expect(readSpritePriorityFromView(view, 0)).toEqual(1)
    })

    it('should return 0 for out-of-range action number', () => {
      const view = createView()

      expect(readSpritePriorityFromView(view, -1)).toEqual(0)
    })
  })

  describe('readSpriteCharacterTypeFromView', () => {
    it('should read character type', () => {
      const view = createView()
      writeSpriteStateToView(view, 0, 0, 0, true, true, 0, 0, 0, 0, 0, 0, 5)

      expect(readSpriteCharacterTypeFromView(view, 0)).toEqual(5)
    })

    it('should return 0 for out-of-range action number', () => {
      const view = createView()

      expect(readSpriteCharacterTypeFromView(view, MAX_SPRITES)).toEqual(0)
    })
  })

  describe('readSpriteColorCombinationFromView', () => {
    it('should read color combination', () => {
      const view = createView()
      writeSpriteStateToView(view, 0, 0, 0, true, true, 0, 0, 0, 0, 0, 0, 0, 3)

      expect(readSpriteColorCombinationFromView(view, 0)).toEqual(3)
    })

    it('should return 0 for out-of-range action number', () => {
      const view = createView()

      expect(readSpriteColorCombinationFromView(view, -1)).toEqual(0)
    })
  })

  describe('clearAllSprites', () => {
    it('should clear all 8 sprite slots', () => {
      const view = createView()

      // Set up some sprites
      writeSpriteStateToView(view, 0, 100, 50, true, true, 0, 0, 0, 3, 60, 0, 5, 2)
      writeSpriteStateToView(view, 7, 200, 150, true, true, 2, 0, 0, 5, 80, 1, 3, 1)

      clearAllSprites(view)

      // All sprites should be inactive, invisible, characterType = -1
      for (let i = 0; i < 8; i++) {
        expect(readSpriteIsActiveFromView(view, i)).toEqual(false)
        expect(readSpriteIsVisibleFromView(view, i)).toEqual(false)
        expect(readSpriteCharacterTypeFromView(view, i)).toEqual(-1)
      }
    })
  })

  describe('readAllMovementStates', () => {
    it('should return states only for initialized sprites (characterType >= 0)', () => {
      const view = createView()

      // Sprite 0: initialized with characterType 5
      writeSpriteStateToView(view, 0, 100, 50, true, true, 0, 0, 100, 3, 60, 0, 5, 2)
      // Sprite 1: uninitialized (characterType stays 0 from clearAllSprites or default)
      // Sprite 2: uninitialized
      // Sprite 3: initialized with characterType 10
      writeSpriteStateToView(view, 3, 200, 150, true, true, 1, 0, 200, 5, 80, 1, 10, 1)

      const states = readAllMovementStates(
        view,
        (n) => readSpriteCharacterTypeFromView(view, n),
        (n) => readSpriteTotalDistanceFromView(view, n),
        (n) => readSpriteDirectionFromView(view, n),
        (n) => readSpriteSpeedFromView(view, n),
        (n) => readSpritePriorityFromView(view, n),
        (n) => readSpriteColorCombinationFromView(view, n)
      )

      // Default view has characterType = 0 for all slots, so all are "initialized"
      // Only slots with explicitly set data will have meaningful values
      expect(states.length).toBeGreaterThanOrEqual(2)

      // Find sprite 0
      const state0 = states.find(s => s.actionNumber === 0)
      expect(state0).toBeDefined()
      expect(state0!.definition.characterType).toEqual(5)
      expect(state0!.definition.direction).toEqual(3)
      expect(state0!.definition.speed).toEqual(60)
      expect(state0!.definition.distance).toEqual(50) // totalDistance / 2
      expect(state0!.definition.priority).toEqual(0)
      expect(state0!.definition.colorCombination).toEqual(2)
    })

    it('should exclude sprites with characterType = -1 (cleared)', () => {
      const view = createView()
      clearAllSprites(view) // Sets all characterType to -1

      // Now initialize only sprite 5
      writeSpriteStateToView(view, 5, 100, 50, true, true, 0, 0, 100, 3, 60, 0, 5, 2)

      const states = readAllMovementStates(
        view,
        (n) => readSpriteCharacterTypeFromView(view, n),
        (n) => readSpriteTotalDistanceFromView(view, n),
        (n) => readSpriteDirectionFromView(view, n),
        (n) => readSpriteSpeedFromView(view, n),
        (n) => readSpritePriorityFromView(view, n),
        (n) => readSpriteColorCombinationFromView(view, n)
      )

      expect(states.length).toEqual(1)
      expect(states[0]?.actionNumber).toEqual(5)
    })

    it('should return empty array when no sprites are initialized', () => {
      const view = createView()
      clearAllSprites(view)

      const states = readAllMovementStates(
        view,
        (n) => readSpriteCharacterTypeFromView(view, n),
        (n) => readSpriteTotalDistanceFromView(view, n),
        (n) => readSpriteDirectionFromView(view, n),
        (n) => readSpriteSpeedFromView(view, n),
        (n) => readSpritePriorityFromView(view, n),
        (n) => readSpriteColorCombinationFromView(view, n)
      )

      expect(states).toEqual([])
    })

    it('should calculate distance as totalDistance / 2', () => {
      const view = createView()
      clearAllSprites(view)
      writeSpriteStateToView(view, 0, 0, 0, true, true, 0, 0, 100, 0, 0, 0, 0, 0)

      const states = readAllMovementStates(
        view,
        (n) => readSpriteCharacterTypeFromView(view, n),
        (n) => readSpriteTotalDistanceFromView(view, n),
        (n) => readSpriteDirectionFromView(view, n),
        (n) => readSpriteSpeedFromView(view, n),
        (n) => readSpritePriorityFromView(view, n),
        (n) => readSpriteColorCombinationFromView(view, n)
      )

      expect(states[0]?.definition.distance).toEqual(50) // 100 / 2
    })
  })

  describe('slotBase integration', () => {
    it('should compute correct base indices for each sprite', () => {
      for (let i = 0; i < MAX_SPRITES; i++) {
        expect(slotBase(i)).toEqual(i * 12)
      }
    })

    it('should throw for invalid action number', () => {
      expect(() => slotBase(-1)).toThrow('actionNumber must be 0-7')
      expect(() => slotBase(8)).toThrow('actionNumber must be 0-7')
    })
  })

  describe('writeSpriteStateToView full fields', () => {
    it('should write all 12 fields correctly', () => {
      const view = createView()

      writeSpriteStateToView(view, 2, 100, 200, true, true, 3, 50, 100, 5, 60, 1, 7, 2)

      const base = slotBase(2)
      expect(view[base + 0]).toEqual(100) // x
      expect(view[base + 1]).toEqual(200) // y
      expect(view[base + 2]).toEqual(1) // isActive (true -> 1)
      expect(view[base + 3]).toEqual(1) // isVisible (true -> 1)
      expect(view[base + 4]).toEqual(3) // frameIndex
      expect(view[base + 5]).toEqual(50) // remainingDistance
      expect(view[base + 6]).toEqual(100) // totalDistance
      expect(view[base + 7]).toEqual(5) // direction
      expect(view[base + 8]).toEqual(60) // speed
      expect(view[base + 9]).toEqual(1) // priority
      expect(view[base + 10]).toEqual(7) // characterType
      expect(view[base + 11]).toEqual(2) // colorCombination
    })

    it('should convert boolean flags to 0/1', () => {
      const view = createView()

      writeSpriteStateToView(view, 0, 0, 0, false, false)

      const base = slotBase(0)
      expect(view[base + 2]).toEqual(0) // isActive false
      expect(view[base + 3]).toEqual(0) // isVisible false
    })
  })
})
