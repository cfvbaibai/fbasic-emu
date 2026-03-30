/**
 * SharedDisplayBufferAccessor unit tests
 *
 * Covers construction (valid/invalid buffer), screen char/pattern read/write,
 * cursor, sequence, scalars, sprite state delegation, sync commands,
 * and bulk screen state operations.
 */

import { beforeEach, describe, expect, it } from 'vitest'

import { SHARED_DISPLAY_BUFFER_BYTES } from '@/core/animation/sharedDisplayBuffer'
import { SyncCommandType } from '@/core/animation/sharedDisplayBuffer'
import { SharedDisplayBufferAccessor } from '@/core/animation/sharedDisplayBufferAccessor'
import type { ScreenCell } from '@/core/types/execution-types'

function createBuffer(): SharedArrayBuffer {
  return new SharedArrayBuffer(SHARED_DISPLAY_BUFFER_BYTES)
}

describe('SharedDisplayBufferAccessor', () => {
  describe('constructor', () => {
    it('should accept a valid SharedArrayBuffer', () => {
      const buffer = createBuffer()

      expect(() => new SharedDisplayBufferAccessor(buffer)).not.toThrow()
    })

    it('should throw RangeError for buffer too small', () => {
      const smallBuffer = new SharedArrayBuffer(100)

      expect(() => new SharedDisplayBufferAccessor(smallBuffer)).toThrow(RangeError)
      expect(() => new SharedDisplayBufferAccessor(smallBuffer)).toThrow('Buffer too small')
    })
  })

  describe('screen char operations', () => {
    let accessor: SharedDisplayBufferAccessor

    beforeEach(() => {
      accessor = new SharedDisplayBufferAccessor(createBuffer())
    })

    it('should write and read screen character', () => {
      accessor.writeScreenChar(5, 3, 65)

      expect(accessor.readScreenChar(5, 3)).toEqual(65)
    })

    it('should return space (0x20) for out-of-bounds', () => {
      expect(accessor.readScreenChar(-1, 0)).toEqual(0x20)
      expect(accessor.readScreenChar(28, 0)).toEqual(0x20)
      expect(accessor.readScreenChar(0, -1)).toEqual(0x20)
      expect(accessor.readScreenChar(0, 24)).toEqual(0x20)
    })

    it('should not write for out-of-bounds', () => {
      // The accessor's buffer is zero-initialized, so (0,0) starts at 0
      const original = accessor.readScreenChar(0, 0)

      accessor.writeScreenChar(-1, -1, 65)
      accessor.writeScreenChar(28, 0, 65)

      expect(accessor.readScreenChar(0, 0)).toEqual(original)
    })
  })

  describe('screen pattern operations', () => {
    let accessor: SharedDisplayBufferAccessor

    beforeEach(() => {
      accessor = new SharedDisplayBufferAccessor(createBuffer())
    })

    it('should write and read screen pattern', () => {
      accessor.writeScreenPattern(5, 3, 3)

      expect(accessor.readScreenPattern(5, 3)).toEqual(3)
    })

    it('should return 0 for out-of-bounds', () => {
      expect(accessor.readScreenPattern(-1, 0)).toEqual(0)
      expect(accessor.readScreenPattern(28, 0)).toEqual(0)
    })
  })

  describe('readScreenBuffer', () => {
    it('should return buffer with correct dimensions', () => {
      const accessor = new SharedDisplayBufferAccessor(createBuffer())

      const buffer = accessor.readScreenBuffer()

      expect(buffer.length).toEqual(24)
      expect(buffer[0]?.length).toEqual(28)
    })
  })

  describe('cursor operations', () => {
    let accessor: SharedDisplayBufferAccessor

    beforeEach(() => {
      accessor = new SharedDisplayBufferAccessor(createBuffer())
    })

    it('should write and read cursor position', () => {
      accessor.writeCursor(10, 5)

      expect(accessor.readCursor()).toEqual({ x: 10, y: 5 })
    })
  })

  describe('sequence operations', () => {
    let accessor: SharedDisplayBufferAccessor

    beforeEach(() => {
      accessor = new SharedDisplayBufferAccessor(createBuffer())
    })

    it('should return 0 initially', () => {
      expect(accessor.readSequence()).toEqual(0)
    })

    it('should increment sequence', () => {
      accessor.incrementSequence()

      expect(accessor.readSequence()).toEqual(1)
    })
  })

  describe('scalar operations', () => {
    let accessor: SharedDisplayBufferAccessor

    beforeEach(() => {
      accessor = new SharedDisplayBufferAccessor(createBuffer())
    })

    it('should read and write bgPalette', () => {
      accessor.writeBgPalette(1)
      expect(accessor.readBgPalette()).toEqual(1)
    })

    it('should mask bgPalette to 0-1', () => {
      accessor.writeBgPalette(5)
      expect(accessor.readBgPalette()).toEqual(1)
    })

    it('should read and write spritePalette', () => {
      accessor.writeSpritePalette(3)
      expect(accessor.readSpritePalette()).toEqual(3)
    })

    it('should mask spritePalette to 0-3', () => {
      accessor.writeSpritePalette(7)
      expect(accessor.readSpritePalette()).toEqual(3)
    })

    it('should read and write backdropColor', () => {
      accessor.writeBackdropColor(30)
      expect(accessor.readBackdropColor()).toEqual(30)
    })

    it('should clamp backdropColor to 0-60', () => {
      accessor.writeBackdropColor(100)
      expect(accessor.readBackdropColor()).toEqual(60)

      accessor.writeBackdropColor(-10)
      expect(accessor.readBackdropColor()).toEqual(0)
    })

    it('should read and write cgenMode', () => {
      accessor.writeCgenMode(3)
      expect(accessor.readCgenMode()).toEqual(3)
    })

    it('should mask cgenMode to 0-3', () => {
      accessor.writeCgenMode(7)
      expect(accessor.readCgenMode()).toEqual(3)
    })

    it('should read all scalars at once', () => {
      accessor.writeScalars(1, 2, 30, 3)

      const scalars = accessor.readScalars()
      expect(scalars).toEqual({
        bgPalette: 1,
        spritePalette: 2,
        backdropColor: 30,
        cgenMode: 3,
      })
    })

    it('should write all scalars at once', () => {
      accessor.writeScalars(0, 1, 15, 2)

      expect(accessor.readBgPalette()).toEqual(0)
      expect(accessor.readSpritePalette()).toEqual(1)
      expect(accessor.readBackdropColor()).toEqual(15)
      expect(accessor.readCgenMode()).toEqual(2)
    })
  })

  describe('sprite operations', () => {
    let accessor: SharedDisplayBufferAccessor

    beforeEach(() => {
      accessor = new SharedDisplayBufferAccessor(createBuffer())
    })

    it('should write and read sprite position', () => {
      accessor.writeSpriteState(0, 100, 50, true, true)

      expect(accessor.readSpritePosition(0)).toEqual({ x: 100, y: 50 })
    })

    it('should read isActive', () => {
      accessor.writeSpriteState(0, 0, 0, true, false)

      expect(accessor.readSpriteIsActive(0)).toEqual(true)
    })

    it('should read isVisible', () => {
      accessor.writeSpriteState(0, 0, 0, false, true)

      expect(accessor.readSpriteIsVisible(0)).toEqual(true)
    })

    it('should read frameIndex', () => {
      accessor.writeSpriteState(0, 0, 0, true, true, 5)

      expect(accessor.readSpriteFrameIndex(0)).toEqual(5)
    })

    it('should read remainingDistance', () => {
      accessor.writeSpriteState(0, 0, 0, true, true, 0, 100)

      expect(accessor.readSpriteRemainingDistance(0)).toEqual(100)
    })

    it('should read totalDistance', () => {
      accessor.writeSpriteState(0, 0, 0, true, true, 0, 0, 200)

      expect(accessor.readSpriteTotalDistance(0)).toEqual(200)
    })

    it('should read direction', () => {
      accessor.writeSpriteState(0, 0, 0, true, true, 0, 0, 0, 3)

      expect(accessor.readSpriteDirection(0)).toEqual(3)
    })

    it('should read speed', () => {
      accessor.writeSpriteState(0, 0, 0, true, true, 0, 0, 0, 0, 60)

      expect(accessor.readSpriteSpeed(0)).toEqual(60)
    })

    it('should read priority', () => {
      accessor.writeSpriteState(0, 0, 0, true, true, 0, 0, 0, 0, 0, 1)

      expect(accessor.readSpritePriority(0)).toEqual(1)
    })

    it('should read characterType', () => {
      accessor.writeSpriteState(0, 0, 0, true, true, 0, 0, 0, 0, 0, 0, 5)

      expect(accessor.readSpriteCharacterType(0)).toEqual(5)
    })

    it('should read colorCombination', () => {
      accessor.writeSpriteState(0, 0, 0, true, true, 0, 0, 0, 0, 0, 0, 0, 2)

      expect(accessor.readSpriteColorCombination(0)).toEqual(2)
    })

    it('should return null position for out-of-range', () => {
      expect(accessor.readSpritePosition(-1)).toBeNull()
      expect(accessor.readSpritePosition(8)).toBeNull()
    })

    it('should return false for out-of-range isActive/isVisible', () => {
      expect(accessor.readSpriteIsActive(-1)).toEqual(false)
      expect(accessor.readSpriteIsVisible(8)).toEqual(false)
    })

    it('should return 0 for out-of-range numeric properties', () => {
      expect(accessor.readSpriteFrameIndex(-1)).toEqual(0)
      expect(accessor.readSpriteDirection(8)).toEqual(0)
      expect(accessor.readSpriteSpeed(-1)).toEqual(0)
      expect(accessor.readSpritePriority(8)).toEqual(0)
      expect(accessor.readSpriteCharacterType(-1)).toEqual(0)
      expect(accessor.readSpriteColorCombination(8)).toEqual(0)
    })
  })

  describe('clearAllSprites', () => {
    it('should clear all sprite slots', () => {
      const accessor = new SharedDisplayBufferAccessor(createBuffer())

      accessor.writeSpriteState(0, 100, 50, true, true, 0, 0, 0, 3, 60, 0, 5, 2)
      accessor.writeSpriteState(7, 200, 150, true, true, 2, 0, 0, 5, 80, 1, 3, 1)

      accessor.clearAllSprites()

      for (let i = 0; i < 8; i++) {
        expect(accessor.readSpriteIsActive(i)).toEqual(false)
        expect(accessor.readSpriteIsVisible(i)).toEqual(false)
        expect(accessor.readSpriteCharacterType(i)).toEqual(-1)
      }
    })
  })

  describe('readAllMovementStates', () => {
    it('should return only initialized sprites', () => {
      const accessor = new SharedDisplayBufferAccessor(createBuffer())
      accessor.clearAllSprites()

      accessor.writeSpriteState(0, 0, 0, true, true, 0, 0, 100, 3, 60, 0, 5, 2)
      accessor.writeSpriteState(5, 0, 0, true, true, 0, 0, 200, 5, 80, 1, 10, 1)

      const states = accessor.readAllMovementStates()

      expect(states.length).toEqual(2)
      expect(states[0]?.actionNumber).toEqual(0)
      expect(states[0]?.definition.characterType).toEqual(5)
      expect(states[0]?.definition.distance).toEqual(50) // totalDistance / 2
      expect(states[1]?.actionNumber).toEqual(5)
      expect(states[1]?.definition.characterType).toEqual(10)
    })
  })

  describe('writeScreenState / readScreenState', () => {
    let accessor: SharedDisplayBufferAccessor

    beforeEach(() => {
      accessor = new SharedDisplayBufferAccessor(createBuffer())
    })

    it('should write and read screen state', () => {
      const screenBuffer: ScreenCell[][] = Array.from({ length: 24 }, (_, y) =>
        Array.from({ length: 28 }, (_, x) => ({
          character: 'A',
          colorPattern: 1,
          x,
          y,
        }))
      )

      accessor.writeScreenState(screenBuffer, 10, 5, 1, 2, 30, 3)

      const state = accessor.readScreenState()
      expect(state.cursorX).toEqual(10)
      expect(state.cursorY).toEqual(5)
      expect(state.bgPalette).toEqual(1)
      expect(state.spritePalette).toEqual(2)
      expect(state.backdropColor).toEqual(30)
      expect(state.cgenMode).toEqual(3)
      expect(state.buffer.length).toEqual(24)
      expect(state.buffer[0]?.length).toEqual(28)
    })
  })

  describe('sync command operations', () => {
    let accessor: SharedDisplayBufferAccessor

    beforeEach(() => {
      accessor = new SharedDisplayBufferAccessor(createBuffer())
    })

    it('should write and read sync command', () => {
      accessor.writeSyncCommand(SyncCommandType.START_MOVEMENT, 0, {
        startX: 100,
        startY: 50,
        direction: 3,
        speed: 60,
        distance: 100,
        priority: 0,
      })

      const cmd = accessor.readSyncCommand()

      expect(cmd).not.toBeNull()
      expect(cmd!.commandType).toEqual(SyncCommandType.START_MOVEMENT)
      expect(cmd!.actionNumber).toEqual(0)
      expect(cmd!.params.startX).toEqual(100)
      expect(cmd!.params.startY).toEqual(50)
      expect(cmd!.params.direction).toEqual(3)
      expect(cmd!.params.speed).toEqual(60)
      expect(cmd!.params.distance).toEqual(100)
      expect(cmd!.params.priority).toEqual(0)
    })

    it('should return null when no command is pending (type = NONE)', () => {
      expect(accessor.readSyncCommand()).toBeNull()
    })

    it('should clear sync command', () => {
      accessor.writeSyncCommand(SyncCommandType.START_MOVEMENT, 0)
      accessor.clearSyncCommand()

      expect(accessor.readSyncCommand()).toBeNull()
    })

    it('should write and read ack', () => {
      accessor.writeAck(1)

      expect(accessor.readAck()).toEqual(1)
    })
  })

  describe('notify', () => {
    it('should not throw', () => {
      const accessor = new SharedDisplayBufferAccessor(createBuffer())

      expect(() => accessor.notify()).not.toThrow()
    })
  })

  describe('notifyAck', () => {
    it('should not throw', () => {
      const accessor = new SharedDisplayBufferAccessor(createBuffer())

      expect(() => accessor.notifyAck()).not.toThrow()
    })
  })
})
