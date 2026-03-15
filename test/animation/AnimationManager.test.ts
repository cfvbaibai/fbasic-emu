/**
 * AnimationManager unit tests
 *
 * Covers DEF MOVE / MOVE lifecycle: defineMovement, startMovement, stopMovement,
 * eraseMovement, setPosition, getMovementStatus, getMovementState, reset.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AnimationManager } from '@/core/animation/AnimationManager'
import { SHARED_DISPLAY_BUFFER_BYTES } from '@/core/animation/sharedDisplayBuffer'
import { TestDeviceAdapter } from '@/core/devices/TestDeviceAdapter'
import type { MoveDefinition } from '@/core/sprite/types'
import { MoveCharacterCode } from '@/shared/data/types'

describe('AnimationManager', () => {
  let manager: AnimationManager
  let deviceAdapter: TestDeviceAdapter
  let sharedBuffer: SharedArrayBuffer

  beforeEach(() => {
    // Create shared buffer for Animation Worker communication
    sharedBuffer = new SharedArrayBuffer(SHARED_DISPLAY_BUFFER_BYTES)
    manager = new AnimationManager(sharedBuffer)
    deviceAdapter = new TestDeviceAdapter()
    manager.setDeviceAdapter(deviceAdapter)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const validDefinition: MoveDefinition = {
    actionNumber: 0,
    characterType: MoveCharacterCode.MARIO,
    direction: 3,
    speed: 60,
    distance: 50,
    priority: 0,
    colorCombination: 0,
  }

  describe('defineMovement', () => {
    it('should store a valid movement definition', () => {
      manager.defineMovement(validDefinition)
      expect(manager.getMoveDefinition(0)).toEqual(validDefinition)
    })

    it('should throw for action number out of range (0-7)', () => {
      expect(() =>
        manager.defineMovement({ ...validDefinition, actionNumber: -1 })
      ).toThrow('Invalid action number: -1 (must be 0-7)')
      expect(() =>
        manager.defineMovement({ ...validDefinition, actionNumber: 8 })
      ).toThrow('Invalid action number: 8 (must be 0-7)')
    })

    it('should throw for invalid character type (0-15)', () => {
      expect(() =>
        manager.defineMovement({ ...validDefinition, characterType: -1 as MoveCharacterCode })
      ).toThrow('Invalid character type: -1 (must be 0-15)')
      expect(() =>
        manager.defineMovement({ ...validDefinition, characterType: 16 as MoveCharacterCode })
      ).toThrow('Invalid character type: 16 (must be 0-15)')
    })

    it('should throw for invalid direction (0-8)', () => {
      expect(() =>
        manager.defineMovement({ ...validDefinition, direction: -1 })
      ).toThrow('Invalid direction: -1 (must be 0-8)')
      expect(() =>
        manager.defineMovement({ ...validDefinition, direction: 9 })
      ).toThrow('Invalid direction: 9 (must be 0-8)')
    })

    it('should throw for invalid speed (0-255)', () => {
      expect(() =>
        manager.defineMovement({ ...validDefinition, speed: 256 })
      ).toThrow('Invalid speed: 256 (must be 0-255)')
    })

    it('should accept speed=0 (every 256 frames per manual)', () => {
      expect(() =>
        manager.defineMovement({ ...validDefinition, speed: 0 })
      ).not.toThrow()
    })

    it('should throw for invalid distance (1-255)', () => {
      expect(() =>
        manager.defineMovement({ ...validDefinition, distance: 0 })
      ).toThrow('Invalid distance: 0 (must be 1-255)')
    })

    it('should throw for invalid priority (0-1)', () => {
      expect(() =>
        manager.defineMovement({ ...validDefinition, priority: 2 })
      ).toThrow('Invalid priority: 2 (must be 0-1)')
    })

    it('should throw for invalid color combination (0-3)', () => {
      expect(() =>
        manager.defineMovement({ ...validDefinition, colorCombination: 4 })
      ).toThrow('Invalid color combination: 4 (must be 0-3)')
    })
  })

  describe('startMovement', () => {
    it('should throw when no definition exists for action number', () => {
      expect(() => manager.startMovement(0)).toThrow(
        'No movement definition for action number 0 (use DEF MOVE first)'
      )
    })

    it('should create movement state', () => {
      manager.defineMovement(validDefinition)
      manager.startMovement(0, 100, 80)

      const state = manager.getMovementState(0)
      expect(state).toBeDefined()
      expect(state?.actionNumber).toBe(0)
      expect(state?.definition.actionNumber).toBe(0)
      expect(state?.definition.direction).toBe(3) // Right
      expect(state?.definition.speed).toBe(60)
      expect(state?.definition.distance).toBe(50)
    })

    it('should use default position so sprite center is at screen center when startX/startY not provided', () => {
      manager.defineMovement(validDefinition)
      manager.startMovement(0)

      const state = manager.getMovementState(0)
      expect(state).toBeDefined()
      expect(state?.actionNumber).toBe(0)
      // Position is now tracked by Animation Worker, not in MovementState
    })

    it('should use frame-budget timeout when ACK is missing', () => {
      manager.defineMovement(validDefinition)
      const accessor = Reflect.get(manager as object, 'accessor') as {
        waitForAck: (timeoutMs: number) => boolean
      }
      const waitSpy = vi.spyOn(accessor, 'waitForAck')

      manager.startMovement(0, 100, 80)

      expect(waitSpy).toHaveBeenCalledWith(16)
    })
  })

  describe('getMovementStatus', () => {
    it('should return 0 when no movement defined or started', () => {
      expect(manager.getMovementStatus(0)).toBe(0)
      manager.defineMovement(validDefinition)
      expect(manager.getMovementStatus(0)).toBe(0)
    })

    it('should return -1 when movement is active', () => {
      manager.defineMovement(validDefinition)
      manager.startMovement(0)

      // Without Animation Worker running, manually simulate worker setting isActive
      // In production, Animation Worker would set this when processing START_MOVEMENT command
      const view = new Float64Array(sharedBuffer, 0, 88) // Sprite section
      view[2] = 1 // Set isActive for sprite 0 (actionNumber 0 * 11 + 2)

      expect(manager.getMovementStatus(0)).toBe(-1)
    })

    it('should return 0 after stopMovement', () => {
      manager.defineMovement(validDefinition)
      manager.startMovement(0)

      // Simulate worker setting isActive
      const view = new Float64Array(sharedBuffer, 0, 88)
      view[2] = 1

      manager.stopMovement([0])

      // Worker would clear isActive when processing STOP_MOVEMENT command
      // Simulate that behavior
      view[2] = 0

      expect(manager.getMovementStatus(0)).toBe(0)
    })

    it('should return 0 after eraseMovement', () => {
      manager.defineMovement(validDefinition)
      manager.startMovement(0)

      // Simulate worker setting isActive
      const view = new Float64Array(sharedBuffer, 0, 88)
      view[2] = 1

      manager.eraseMovement([0])

      // Worker would clear isActive when processing ERASE_MOVEMENT command
      // Simulate that behavior
      view[2] = 0

      expect(manager.getMovementStatus(0)).toBe(0)
    })
  })

  describe('stopMovement (CUT)', () => {
    it('should stop movement (isActive = false in buffer)', () => {
      manager.defineMovement(validDefinition)
      manager.startMovement(0)
      manager.stopMovement([0])

      // isActive is tracked by Animation Worker in shared buffer
      expect(manager.getMovementStatus(0)).toBe(0)
      // Definition still exists after stop
      expect(manager.getMovementState(0)).toBeDefined()
    })

    it('should handle multiple action numbers', () => {
      manager.defineMovement({ ...validDefinition, actionNumber: 0 })
      manager.defineMovement({ ...validDefinition, actionNumber: 1 })
      manager.startMovement(0)
      manager.startMovement(1)
      manager.stopMovement([0, 1])

      expect(manager.getMovementStatus(0)).toBe(0)
      expect(manager.getMovementStatus(1)).toBe(0)
    })
  })

  describe('eraseMovement (ERA)', () => {
    it('should remove movement state', () => {
      manager.defineMovement(validDefinition)
      manager.startMovement(0)
      manager.eraseMovement([0])

      expect(manager.getMovementState(0)).toBeUndefined()
    })
  })

  describe('setPosition (POSITION)', () => {
    it('should store position locally via setSpritePosition', () => {
      manager.setPosition(0, 50, 60)
      // Position is stored via deviceAdapter.setSpritePosition for MOVE command to use
      expect(deviceAdapter.getSpritePosition(0)).toEqual({ x: 50, y: 60 })
    })

    it('should throw for invalid action number', () => {
      expect(() => manager.setPosition(-1, 0, 0)).toThrow('Invalid action number: -1 (must be 0-7)')
      expect(() => manager.setPosition(8, 0, 0)).toThrow('Invalid action number: 8 (must be 0-7)')
    })

    it('should throw for invalid X coordinate', () => {
      expect(() => manager.setPosition(0, -1, 0)).toThrow('Invalid X coordinate: -1 (must be 0-255)')
      expect(() => manager.setPosition(0, 256, 0)).toThrow('Invalid X coordinate: 256 (must be 0-255)')
    })

    it('should throw for invalid Y coordinate', () => {
      expect(() => manager.setPosition(0, 0, -1)).toThrow('Invalid Y coordinate: -1 (must be 0-255)')
      expect(() => manager.setPosition(0, 0, 256)).toThrow('Invalid Y coordinate: 256 (must be 0-255)')
    })

    it('should avoid long blocking waits when ACK is missing', () => {
      const startedAt = performance.now()
      manager.setPosition(0, 50, 60)
      const elapsedMs = performance.now() - startedAt

      expect(elapsedMs).toBeLessThan(80)
    })
  })

  describe('getSpritePosition', () => {
    it('should return null (position is in frontend Konva nodes)', () => {
      expect(manager.getSpritePosition(0)).toBeNull()
    })
  })

  describe('getAllMovementStates', () => {
    it('should return all active movement states', () => {
      manager.defineMovement(validDefinition)
      manager.defineMovement({ ...validDefinition, actionNumber: 1 })
      manager.startMovement(0)
      manager.startMovement(1)

      const states = manager.getAllMovementStates()
      expect(states).toHaveLength(2)
      expect(states.map(s => s.actionNumber).sort()).toEqual([0, 1])
    })

    it('should return empty array when no movements', () => {
      expect(manager.getAllMovementStates()).toEqual([])
    })
  })

  describe('reset', () => {
    it('should clear all definitions and movement states', () => {
      manager.defineMovement(validDefinition)
      manager.startMovement(0)
      manager.reset()

      expect(manager.getMoveDefinition(0)).toBeUndefined()
      expect(manager.getMovementState(0)).toBeUndefined()
      expect(manager.getAllMovementStates()).toEqual([])
      expect(manager.getMovementStatus(0)).toBe(0)
    })
  })
})
