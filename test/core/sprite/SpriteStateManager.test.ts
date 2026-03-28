/**
 * SpriteStateManager unit tests
 *
 * Covers sprite slot initialization, enable/disable, define, display, hide,
 * state retrieval, visibility filtering, clear, and reset.
 */

import { beforeEach, describe, expect, it } from 'vitest'

import { SpriteStateManager } from '@/core/sprite/SpriteStateManager'
import type { DefSpriteDefinition } from '@/core/sprite/types'
import type { Tile } from '@/shared/data/types'

function createDefinition(overrides: Partial<DefSpriteDefinition> = {}): DefSpriteDefinition {
  return {
    spriteNumber: 0,
    colorCombination: 0,
    size: 0,
    priority: 0,
    invertX: 0,
    invertY: 0,
    characterSet: '@',
    tiles: [[]] as Tile[],
    ...overrides,
  }
}

describe('SpriteStateManager', () => {
  let manager: SpriteStateManager

  beforeEach(() => {
    manager = new SpriteStateManager()
  })

  describe('constructor', () => {
    it('should initialize 8 sprite slots with defaults', () => {
      const states = manager.getAllSpriteStates()

      expect(states.length).toEqual(8)

      for (let i = 0; i < 8; i++) {
        expect(states[i]).toEqual({
          spriteNumber: i,
          x: 0,
          y: 0,
          visible: false,
          priority: 0,
          definition: null,
        })
      }
    })
  })

  describe('setSpriteEnabled / isSpriteEnabled', () => {
    it('should default to disabled', () => {
      expect(manager.isSpriteEnabled()).toEqual(false)
    })

    it('should enable sprite display', () => {
      manager.setSpriteEnabled(true)

      expect(manager.isSpriteEnabled()).toEqual(true)
    })

    it('should disable sprite display', () => {
      manager.setSpriteEnabled(true)
      manager.setSpriteEnabled(false)

      expect(manager.isSpriteEnabled()).toEqual(false)
    })
  })

  describe('defineSprite', () => {
    it('should store sprite definition', () => {
      const def = createDefinition({ spriteNumber: 0, priority: 1 })

      manager.defineSprite(def)

      const state = manager.getSpriteState(0)
      expect(state?.definition).toEqual(def)
      expect(state?.priority).toEqual(1)
    })

    it('should throw for invalid sprite number', () => {
      const def = createDefinition({ spriteNumber: 99 })

      expect(() => manager.defineSprite(def)).toThrow('Invalid sprite number: 99')
    })

    it('should not make sprite visible', () => {
      const def = createDefinition()

      manager.defineSprite(def)

      expect(manager.getSpriteState(0)?.visible).toEqual(false)
    })

    it('should define multiple sprites', () => {
      manager.defineSprite(createDefinition({ spriteNumber: 0 }))
      manager.defineSprite(createDefinition({ spriteNumber: 3, priority: 1 }))
      manager.defineSprite(createDefinition({ spriteNumber: 7, colorCombination: 2 }))

      expect(manager.getSpriteState(0)?.definition?.spriteNumber).toEqual(0)
      expect(manager.getSpriteState(3)?.priority).toEqual(1)
      expect(manager.getSpriteState(7)?.definition?.colorCombination).toEqual(2)
    })
  })

  describe('displaySprite', () => {
    it('should make sprite visible and set position', () => {
      manager.defineSprite(createDefinition({ spriteNumber: 0 }))

      manager.displaySprite(0, 100, 50)

      const state = manager.getSpriteState(0)
      expect(state?.visible).toEqual(true)
      expect(state?.x).toEqual(100)
      expect(state?.y).toEqual(50)
    })

    it('should throw if sprite has no definition', () => {
      expect(() => manager.displaySprite(0, 100, 50)).toThrow('Sprite 0 has no definition')
    })

    it('should throw for invalid sprite number', () => {
      expect(() => manager.displaySprite(99, 100, 50)).toThrow('Invalid sprite number: 99')
    })
  })

  describe('hideAllSprites', () => {
    it('should hide all visible sprites', () => {
      manager.defineSprite(createDefinition({ spriteNumber: 0 }))
      manager.defineSprite(createDefinition({ spriteNumber: 3 }))
      manager.defineSprite(createDefinition({ spriteNumber: 7 }))
      manager.displaySprite(0, 10, 20)
      manager.displaySprite(3, 50, 60)
      manager.displaySprite(7, 100, 110)

      manager.hideAllSprites()

      expect(manager.getVisibleSprites()).toEqual([])
    })

    it('should preserve sprite definitions after hiding', () => {
      const def0 = createDefinition({ spriteNumber: 0 })
      const def3 = createDefinition({ spriteNumber: 3, priority: 1 })
      manager.defineSprite(def0)
      manager.defineSprite(def3)
      manager.displaySprite(0, 10, 20)
      manager.displaySprite(3, 50, 60)

      manager.hideAllSprites()

      expect(manager.getSpriteState(0)?.definition).toEqual(def0)
      expect(manager.getSpriteState(3)?.definition).toEqual(def3)
    })

    it('should preserve sprite positions after hiding', () => {
      manager.defineSprite(createDefinition({ spriteNumber: 2 }))
      manager.displaySprite(2, 123, 45)

      manager.hideAllSprites()

      const state = manager.getSpriteState(2)
      expect(state?.x).toEqual(123)
      expect(state?.y).toEqual(45)
    })

    it('should work when no sprites are visible', () => {
      manager.hideAllSprites()

      expect(manager.getVisibleSprites()).toEqual([])
    })

    it('should work on already-hidden sprites', () => {
      manager.defineSprite(createDefinition({ spriteNumber: 0 }))
      manager.displaySprite(0, 10, 10)
      manager.hideSprite(0)

      manager.hideAllSprites()

      expect(manager.getSpriteState(0)?.visible).toEqual(false)
    })
  })

  describe('hideSprite', () => {
    it('should hide a visible sprite', () => {
      manager.defineSprite(createDefinition())
      manager.displaySprite(0, 100, 50)

      manager.hideSprite(0)

      expect(manager.getSpriteState(0)?.visible).toEqual(false)
    })

    it('should do nothing for non-existent sprite number', () => {
      expect(() => manager.hideSprite(99)).not.toThrow()
    })
  })

  describe('getSpriteState', () => {
    it('should return state for valid sprite number', () => {
      const state = manager.getSpriteState(3)

      expect(state).toBeDefined()
      expect(state?.spriteNumber).toEqual(3)
    })

    it('should return undefined for invalid sprite number', () => {
      expect(manager.getSpriteState(-1)).toBeUndefined()
      expect(manager.getSpriteState(8)).toBeUndefined()
      expect(manager.getSpriteState(99)).toBeUndefined()
    })
  })

  describe('getAllSpriteStates', () => {
    it('should return all 8 sprite states', () => {
      const states = manager.getAllSpriteStates()

      expect(states.length).toEqual(8)
      expect(states.map(s => s.spriteNumber)).toEqual([0, 1, 2, 3, 4, 5, 6, 7])
    })
  })

  describe('getVisibleSprites', () => {
    it('should return empty array when no sprites visible', () => {
      expect(manager.getVisibleSprites()).toEqual([])
    })

    it('should return only visible sprites', () => {
      manager.defineSprite(createDefinition({ spriteNumber: 0 }))
      manager.defineSprite(createDefinition({ spriteNumber: 2 }))
      manager.defineSprite(createDefinition({ spriteNumber: 5 }))

      manager.displaySprite(0, 10, 10)
      manager.displaySprite(5, 50, 50)

      const visible = manager.getVisibleSprites()
      expect(visible.length).toEqual(2)
      expect(visible.map(s => s.spriteNumber)).toEqual([0, 5])
    })
  })

  describe('clear', () => {
    it('should reset all sprite slots to defaults', () => {
      manager.defineSprite(createDefinition({ spriteNumber: 0 }))
      manager.displaySprite(0, 100, 50)
      manager.defineSprite(createDefinition({ spriteNumber: 3, priority: 1 }))
      manager.displaySprite(3, 200, 100)

      manager.clear()

      const states = manager.getAllSpriteStates()
      expect(states.length).toEqual(8)
      for (const state of states) {
        expect(state.x).toEqual(0)
        expect(state.y).toEqual(0)
        expect(state.visible).toEqual(false)
        expect(state.priority).toEqual(0)
        expect(state.definition).toBeNull()
      }
    })
  })

  describe('resetSprite', () => {
    it('should reset a specific sprite slot', () => {
      manager.defineSprite(createDefinition({ spriteNumber: 2, priority: 1 }))
      manager.displaySprite(2, 100, 50)

      manager.resetSprite(2)

      const state = manager.getSpriteState(2)
      expect(state).toEqual({
        spriteNumber: 2,
        x: 0,
        y: 0,
        visible: false,
        priority: 0,
        definition: null,
      })
    })

    it('should not affect other sprite slots', () => {
      manager.defineSprite(createDefinition({ spriteNumber: 0 }))
      manager.displaySprite(0, 10, 10)

      manager.resetSprite(0)

      expect(manager.getSpriteState(1)?.definition).toBeNull()
      expect(manager.getSpriteState(2)?.definition).toBeNull()
    })
  })
})
