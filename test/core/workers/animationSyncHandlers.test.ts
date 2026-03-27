/**
 * animationSyncHandlers unit tests
 *
 * Covers getDirectionDeltas, handleStartMovementFromSync, handleStopMovementFromSync,
 * handleEraseMovementFromSync, handleSetPositionFromSync, handleClearAllMovementsFromSync,
 * and pollSyncCommands (command dispatch, lifecycle, error handling, edge cases).
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { SHARED_DISPLAY_BUFFER_BYTES, SyncCommandType } from '@/core/animation/sharedDisplayBuffer'
import { SharedDisplayBufferAccessor } from '@/core/animation/sharedDisplayBufferAccessor'
import type { WorkerMovementState } from '@/core/workers/animationSyncHandlers'
import {
  getDirectionDeltas,
  handleClearAllMovementsFromSync,
  handleEraseMovementFromSync,
  handleSetPositionFromSync,
  handleStartMovementFromSync,
  handleStopMovementFromSync,
  pollSyncCommands,
} from '@/core/workers/animationSyncHandlers'

vi.mock('@/shared/logger', () => ({
  logWorker: { debug: vi.fn(), info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}))

function createAccessor(): SharedDisplayBufferAccessor {
  return new SharedDisplayBufferAccessor(new SharedArrayBuffer(SHARED_DISPLAY_BUFFER_BYTES))
}

/** Presets characterType=5, colorCombination=2, then calls handleStartMovementFromSync. */
function startMovement(
  accessor: SharedDisplayBufferAccessor,
  states: Map<number, WorkerMovementState>,
  actionNumber: number,
  overrides: Partial<{
    startX: number; startY: number; direction: number
    speed: number; distance: number; priority: number
  }> = {},
): void {
  accessor.writeSpriteState(actionNumber, 0, 0, false, false, 0, 0, 0, 0, 0, 0, 5, 2)
  handleStartMovementFromSync(actionNumber, {
    startX: overrides.startX ?? 100, startY: overrides.startY ?? 50,
    direction: overrides.direction ?? 3, speed: overrides.speed ?? 60,
    distance: overrides.distance ?? 10, priority: overrides.priority ?? 0,
  }, states, accessor)
}

describe('animationSyncHandlers', () => {
  describe('getDirectionDeltas', () => {
    it.each([
      [0, 0, 0], [1, 0, -1], [2, 1, -1], [3, 1, 0], [4, 1, 1],
      [5, 0, 1], [6, -1, 1], [7, -1, 0], [8, -1, -1],
    ] as const)('direction %i => deltaX=%i, deltaY=%i', (dir, dx, dy) => {
      expect(getDirectionDeltas(dir)).toEqual({ deltaX: dx, deltaY: dy })
    })

    it('should return (0,0) for unknown directions', () => {
      expect(getDirectionDeltas(9)).toEqual({ deltaX: 0, deltaY: 0 })
      expect(getDirectionDeltas(-1)).toEqual({ deltaX: 0, deltaY: 0 })
      expect(getDirectionDeltas(100)).toEqual({ deltaX: 0, deltaY: 0 })
    })
  })

  describe('handleStartMovementFromSync', () => {
    let accessor: SharedDisplayBufferAccessor
    let states: Map<number, WorkerMovementState>
    beforeEach(() => { accessor = createAccessor(); states = new Map() })

    it('should add movement state to the map', () => {
      startMovement(accessor, states, 0)
      expect(states.has(0)).toEqual(true)
      expect(states.get(0)!.actionNumber).toEqual(0)
      expect(states.get(0)!.isActive).toEqual(true)
    })

    it('should set position and calculate derived values', () => {
      startMovement(accessor, states, 2, { startX: 150, startY: 75, distance: 20, speed: 30, direction: 5 })
      const s = states.get(2)!
      expect(s.x).toEqual(150)
      expect(s.y).toEqual(75)
      expect(s.totalDistance).toEqual(40) // 2 * 20
      expect(s.remainingDistance).toEqual(40)
      expect(s.speedDotsPerSecond).toEqual(2) // 60 / 30
      expect(s.directionDeltaX).toEqual(0) // direction 5 = down
      expect(s.directionDeltaY).toEqual(1)
    })

    it('should use 60/256 speed for zero speed', () => {
      startMovement(accessor, states, 0, { speed: 0 })
      expect(states.get(0)!.speedDotsPerSecond).toEqual(60 / 256)
    })

    it('should read characterType/colorCombination from buffer or default to 0', () => {
      startMovement(accessor, states, 0)
      expect(states.get(0)!.definition.characterType).toEqual(5)
      expect(states.get(0)!.definition.colorCombination).toEqual(2)

      handleStartMovementFromSync(3, {
        startX: 10, startY: 20, direction: 1, speed: 60, distance: 10, priority: 0,
      }, states, accessor)
      expect(states.get(3)!.definition.characterType).toEqual(0)
    })

    it('should initialize animation counters and write full state to buffer', () => {
      startMovement(accessor, states, 1, {
        startX: 100, startY: 50, direction: 3, speed: 60, distance: 10, priority: 1,
      })
      const s = states.get(1)!
      expect(s.currentFrameIndex).toEqual(0)
      expect(s.frameCounter).toEqual(0)
      expect(accessor.readSpritePosition(1)).toEqual({ x: 100, y: 50 })
      expect(accessor.readSpriteIsActive(1)).toEqual(true)
      expect(accessor.readSpriteIsVisible(1)).toEqual(true)
      expect(accessor.readSpriteTotalDistance(1)).toEqual(20)
      expect(accessor.readSpriteDirection(1)).toEqual(3)
      expect(accessor.readSpriteSpeed(1)).toEqual(60)
      expect(accessor.readSpritePriority(1)).toEqual(1)
      expect(accessor.readSpriteCharacterType(1)).toEqual(5)
    })

    it('should overwrite existing movement for same actionNumber', () => {
      startMovement(accessor, states, 0, { startX: 10, startY: 20 })
      startMovement(accessor, states, 0, { startX: 200, startY: 100 })
      expect(states.size).toEqual(1)
      expect(states.get(0)!.x).toEqual(200)
    })
  })

  describe('handleStopMovementFromSync', () => {
    let accessor: SharedDisplayBufferAccessor
    let states: Map<number, WorkerMovementState>
    beforeEach(() => { accessor = createAccessor(); states = new Map() })

    it('should deactivate movement and write state but keep in map', () => {
      startMovement(accessor, states, 0, { startX: 100, startY: 50, direction: 3, speed: 60, priority: 1 })
      handleStopMovementFromSync(0, states, accessor)
      expect(states.get(0)!.isActive).toEqual(false)
      expect(states.has(0)).toEqual(true)
      expect(accessor.readSpriteIsActive(0)).toEqual(false)
      expect(accessor.readSpriteIsVisible(0)).toEqual(true) // visible after CUT
      expect(accessor.readSpritePosition(0)).toEqual({ x: 100, y: 50 })
    })

    it('should be a no-op for non-existent actionNumber', () => {
      handleStopMovementFromSync(99, states, accessor)
      expect(states.size).toEqual(0)
    })
  })

  describe('handleEraseMovementFromSync', () => {
    let accessor: SharedDisplayBufferAccessor
    let states: Map<number, WorkerMovementState>
    beforeEach(() => { accessor = createAccessor(); states = new Map() })

    it('should remove movement and reset buffer state', () => {
      startMovement(accessor, states, 3)
      handleEraseMovementFromSync(3, states, accessor)
      expect(states.has(3)).toEqual(false)
      expect(accessor.readSpriteIsActive(3)).toEqual(false)
      expect(accessor.readSpriteIsVisible(3)).toEqual(false)
      expect(accessor.readSpritePosition(3)).toEqual({ x: 0, y: 0 })
      expect(accessor.readSpriteCharacterType(3)).toEqual(-1)
    })

    it('should throw RangeError for out-of-range actionNumber', () => {
      expect(() => handleEraseMovementFromSync(99, states, accessor)).toThrow(RangeError)
    })
  })

  describe('handleSetPositionFromSync', () => {
    let accessor: SharedDisplayBufferAccessor
    let states: Map<number, WorkerMovementState>
    beforeEach(() => { accessor = createAccessor(); states = new Map() })

    it('should update position on existing movement and preserve buffer fields', () => {
      startMovement(accessor, states, 0)
      handleSetPositionFromSync(0, 200, 75, states, accessor)
      expect(states.get(0)!.x).toEqual(200)
      expect(states.get(0)!.y).toEqual(75)
      expect(accessor.readSpritePosition(0)).toEqual({ x: 200, y: 75 })
      expect(accessor.readSpriteIsActive(0)).toEqual(true)
      expect(accessor.readSpriteCharacterType(0)).toEqual(5)
      expect(accessor.readSpriteColorCombination(0)).toEqual(2)
    })

    it('should write position for non-existent movement preserving buffer values', () => {
      accessor.writeSpriteState(5, 0, 0, false, false, 0, 0, 0, 0, 0, 0, 3, 1)
      handleSetPositionFromSync(5, 150, 80, states, accessor)
      expect(accessor.readSpritePosition(5)).toEqual({ x: 150, y: 80 })
      expect(accessor.readSpriteIsActive(5)).toEqual(false)
      expect(accessor.readSpriteIsVisible(5)).toEqual(false)
      expect(accessor.readSpriteCharacterType(5)).toEqual(3)
      expect(accessor.readSpriteColorCombination(5)).toEqual(1)
    })

    it('should set inactive/invisible for unknown sprite', () => {
      handleSetPositionFromSync(7, 50, 30, states, accessor)
      expect(accessor.readSpritePosition(7)).toEqual({ x: 50, y: 30 })
      expect(accessor.readSpriteIsActive(7)).toEqual(false)
      expect(accessor.readSpriteIsVisible(7)).toEqual(false)
    })
  })

  describe('handleClearAllMovementsFromSync', () => {
    let accessor: SharedDisplayBufferAccessor
    let states: Map<number, WorkerMovementState>
    beforeEach(() => { accessor = createAccessor(); states = new Map() })

    it('should clear all movements and reset buffer', () => {
      startMovement(accessor, states, 0); startMovement(accessor, states, 3); startMovement(accessor, states, 7)
      handleClearAllMovementsFromSync(states, accessor)
      expect(states.size).toEqual(0)
      for (let i = 0; i < 8; i++) {
        expect(accessor.readSpriteIsActive(i)).toEqual(false)
        expect(accessor.readSpriteIsVisible(i)).toEqual(false)
        expect(accessor.readSpriteCharacterType(i)).toEqual(-1)
      }
    })

    it('should work on empty states', () => {
      expect(() => handleClearAllMovementsFromSync(states, accessor)).not.toThrow()
    })
  })

  describe('pollSyncCommands', () => {
    let accessor: SharedDisplayBufferAccessor
    let states: Map<number, WorkerMovementState>
    beforeEach(() => { accessor = createAccessor(); states = new Map() })

    it('should return false when no command is pending', () => {
      expect(pollSyncCommands(states, accessor)).toEqual(false)
    })

    it('should process START_MOVEMENT command', () => {
      accessor.writeSpriteState(0, 0, 0, false, false, 0, 0, 0, 0, 0, 0, 5, 2)
           accessor.writeSyncCommand(SyncCommandType.START_MOVEMENT, 0, {
        startX: 100, startY: 50, direction: 3, speed: 60, distance: 10, priority: 0,
      })
      expect(pollSyncCommands(states, accessor)).toEqual(true)
      expect(states.get(0)!.isActive).toEqual(true)
    })

    it('should process STOP_MOVEMENT command', () => {
      startMovement(accessor, states, 1)
      accessor.writeSyncCommand(SyncCommandType.STOP_MOVEMENT, 1)
      pollSyncCommands(states, accessor)
      expect(states.get(1)!.isActive).toEqual(false)
    })

    it('should process ERASE_MOVEMENT command', () => {
      startMovement(accessor, states, 2)
      accessor.writeSyncCommand(SyncCommandType.ERASE_MOVEMENT, 2)
      pollSyncCommands(states, accessor)
      expect(states.has(2)).toEqual(false)
    })

    it('should process SET_POSITION command', () => {
      startMovement(accessor, states, 0)
      accessor.writeSyncCommand(SyncCommandType.SET_POSITION, 0, { startX: 200, startY: 100 })
      pollSyncCommands(states, accessor)
      expect(states.get(0)!.x).toEqual(200)
    })

    it('should process CLEAR_ALL_MOVEMENTS and clear command', () => {
      startMovement(accessor, states, 0); startMovement(accessor, states, 3)
      accessor.writeSyncCommand(SyncCommandType.CLEAR_ALL_MOVEMENTS, 0)
      pollSyncCommands(states, accessor)
      expect(states.size).toEqual(0)
      expect(pollSyncCommands(states, accessor)).toEqual(false) // command cleared
    })

    it('should write acknowledgment after processing', () => {
      const spy = vi.spyOn(accessor, 'notifyAck')
      accessor.writeSyncCommand(SyncCommandType.STOP_MOVEMENT, 0)
      pollSyncCommands(states, accessor)
      expect(spy).toHaveBeenCalledOnce()
    })

    it('should write acknowledgment even when handler throws', () => {
      accessor.writeSyncCommand(SyncCommandType.START_MOVEMENT, 0, {
        startX: 0, startY: 0, direction: 0, speed: 0, distance: 0, priority: 0,
      })
      const writeSpy = vi.spyOn(accessor, 'writeSpriteState').mockImplementation(() => { throw new Error('boom') })
      const ackSpy = vi.spyOn(accessor, 'notifyAck')
      expect(() => pollSyncCommands(states, accessor)).not.toThrow()
      expect(ackSpy).toHaveBeenCalledOnce()
      writeSpy.mockRestore()
    })

    it('should return true after processing a command', () => {
      accessor.writeSyncCommand(SyncCommandType.STOP_MOVEMENT, 5)
      expect(pollSyncCommands(states, accessor)).toEqual(true)
    })

    it('should handle STOP_MOVEMENT for non-existent actionNumber and still ack', () => {
      const spy = vi.spyOn(accessor, 'notifyAck')
      accessor.writeSyncCommand(SyncCommandType.STOP_MOVEMENT, 99)
      expect(() => pollSyncCommands(states, accessor)).not.toThrow()
      expect(spy).toHaveBeenCalledOnce()
    })

    it('should process same command on consecutive polls (not cleared for non-CLEAR)', () => {
      startMovement(accessor, states, 0)
      accessor.writeSyncCommand(SyncCommandType.STOP_MOVEMENT, 0)
      expect(pollSyncCommands(states, accessor)).toEqual(true)
      expect(states.get(0)!.isActive).toEqual(false)
      expect(pollSyncCommands(states, accessor)).toEqual(true) // still in buffer
    })
  })

  describe('lifecycle integration', () => {
    let accessor: SharedDisplayBufferAccessor
    let states: Map<number, WorkerMovementState>
    beforeEach(() => { accessor = createAccessor(); states = new Map() })

    it('should handle START -> STOP -> ERASE lifecycle', () => {
      startMovement(accessor, states, 0)
      expect(accessor.readSpriteIsActive(0)).toEqual(true)
      handleStopMovementFromSync(0, states, accessor)
      expect(accessor.readSpriteIsActive(0)).toEqual(false)
      expect(accessor.readSpriteIsVisible(0)).toEqual(true)
      handleEraseMovementFromSync(0, states, accessor)
      expect(states.has(0)).toEqual(false)
      expect(accessor.readSpriteIsVisible(0)).toEqual(false)
    })

    it('should handle START -> SET_POSITION -> STOP lifecycle', () => {
      startMovement(accessor, states, 3, { startX: 10, startY: 20 })
      handleSetPositionFromSync(3, 150, 80, states, accessor)
      expect(accessor.readSpritePosition(3)).toEqual({ x: 150, y: 80 })
      handleStopMovementFromSync(3, states, accessor)
      expect(accessor.readSpriteIsActive(3)).toEqual(false)
      expect(accessor.readSpriteIsVisible(3)).toEqual(true)
    })

    it('should handle multiple sprites independently', () => {
      startMovement(accessor, states, 0, { direction: 3 })
      startMovement(accessor, states, 5, { direction: 7 })
      expect(states.get(0)!.directionDeltaX).toEqual(1)
      expect(states.get(5)!.directionDeltaX).toEqual(-1)
      handleStopMovementFromSync(0, states, accessor)
      expect(states.get(0)!.isActive).toEqual(false)
      expect(states.get(5)!.isActive).toEqual(true)
    })

    it('should handle CLEAR_ALL resetting all 8 sprites', () => {
      for (let i = 0; i < 8; i++) startMovement(accessor, states, i, { direction: i + 1 })
      handleClearAllMovementsFromSync(states, accessor)
      expect(states.size).toEqual(0)
      for (let i = 0; i < 8; i++) {
        expect(accessor.readSpriteIsActive(i)).toEqual(false)
        expect(accessor.readSpriteCharacterType(i)).toEqual(-1)
      }
    })
  })
})
