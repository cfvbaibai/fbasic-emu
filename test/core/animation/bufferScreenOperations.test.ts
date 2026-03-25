/**
 * bufferScreenOperations unit tests
 *
 * Covers cellIndex, read/write screen char/pattern, cursor operations,
 * sequence operations, and bulk screen state read/write.
 */

import { beforeEach, describe, expect, it } from 'vitest'

import {
  cellIndex,
  incrementSequence,
  readCursor,
  readScreenBuffer,
  readScreenChar,
  readScreenPattern,
  readScreenState,
  readSequence,
  writeCursor,
  writeScreenChar,
  writeScreenPattern,
  writeScreenState,
} from '@/core/animation/bufferScreenOperations'
import { COLS, ROWS } from '@/core/animation/sharedDisplayBuffer'

describe('bufferScreenOperations', () => {
  describe('cellIndex', () => {
    it('should return 0 for (0,0)', () => {
      expect(cellIndex(0, 0)).toEqual(0)
    })

    it('should calculate index as y * COLS + x', () => {
      expect(cellIndex(5, 3)).toEqual(3 * COLS + 5)
    })

    it('should return index for last cell', () => {
      expect(cellIndex(COLS - 1, ROWS - 1)).toEqual(ROWS * COLS - 1)
    })
  })

  describe('readScreenChar / writeScreenChar', () => {
    let charView: Uint8Array

    beforeEach(() => {
      charView = new Uint8Array(ROWS * COLS)
    })

    it('should write and read character code at valid position', () => {
      writeScreenChar(charView, 5, 3, 65)

      expect(readScreenChar(charView, 5, 3)).toEqual(65)
    })

    it('should return space (0x20) for out-of-bounds x (negative)', () => {
      expect(readScreenChar(charView, -1, 5)).toEqual(0x20)
    })

    it('should return space (0x20) for out-of-bounds x (too large)', () => {
      expect(readScreenChar(charView, COLS, 5)).toEqual(0x20)
    })

    it('should return space (0x20) for out-of-bounds y (negative)', () => {
      expect(readScreenChar(charView, 5, -1)).toEqual(0x20)
    })

    it('should return space (0x20) for out-of-bounds y (too large)', () => {
      expect(readScreenChar(charView, 5, ROWS)).toEqual(0x20)
    })

    it('should not write for out-of-bounds coordinates', () => {
      writeScreenChar(charView, -1, -1, 65)
      writeScreenChar(charView, COLS, 0, 65)
      writeScreenChar(charView, 0, ROWS, 65)

      // All cells should remain 0 (default)
      expect(charView[0]).toEqual(0)
    })

    it('should clamp char code to 0-255 range', () => {
      writeScreenChar(charView, 0, 0, 300)
      expect(readScreenChar(charView, 0, 0)).toEqual(255)

      writeScreenChar(charView, 0, 0, -10)
      expect(readScreenChar(charView, 0, 0)).toEqual(0)
    })

    it('should return 0 for uninitialized cell (Uint8Array defaults to 0)', () => {
      // Uint8Array is zero-initialized, so the ?? 0x20 fallback does not trigger
      // (it only triggers for undefined, which doesn't happen with typed arrays)
      expect(readScreenChar(charView, 0, 0)).toEqual(0)
    })
  })

  describe('readScreenPattern / writeScreenPattern', () => {
    let patternView: Uint8Array

    beforeEach(() => {
      patternView = new Uint8Array(ROWS * COLS)
    })

    it('should write and read pattern at valid position', () => {
      writeScreenPattern(patternView, 5, 3, 3)

      expect(readScreenPattern(patternView, 5, 3)).toEqual(3)
    })

    it('should return 0 for out-of-bounds coordinates', () => {
      expect(readScreenPattern(patternView, -1, 0)).toEqual(0)
      expect(readScreenPattern(patternView, COLS, 0)).toEqual(0)
      expect(readScreenPattern(patternView, 0, -1)).toEqual(0)
      expect(readScreenPattern(patternView, 0, ROWS)).toEqual(0)
    })

    it('should not write for out-of-bounds coordinates', () => {
      writeScreenPattern(patternView, -1, 0, 3)
      expect(patternView[0]).toEqual(0)
    })

    it('should mask pattern to 2 bits (& 3)', () => {
      writeScreenPattern(patternView, 0, 0, 7)
      expect(readScreenPattern(patternView, 0, 0)).toEqual(3)

      writeScreenPattern(patternView, 0, 0, 15)
      expect(readScreenPattern(patternView, 0, 0)).toEqual(3)
    })
  })

  describe('readCursor / writeCursor', () => {
    let cursorView: Uint8Array

    beforeEach(() => {
      cursorView = new Uint8Array(2)
    })

    it('should write and read cursor position', () => {
      writeCursor(cursorView, 10, 5)

      expect(readCursor(cursorView)).toEqual({ x: 10, y: 5 })
    })

    it('should clamp x to 0..COLS-1', () => {
      writeCursor(cursorView, -1, 0)
      expect(readCursor(cursorView).x).toEqual(0)

      writeCursor(cursorView, COLS + 5, 0)
      expect(readCursor(cursorView).x).toEqual(COLS - 1)
    })

    it('should clamp y to 0..ROWS-1', () => {
      writeCursor(cursorView, 0, -1)
      expect(readCursor(cursorView).y).toEqual(0)

      writeCursor(cursorView, 0, ROWS + 5)
      expect(readCursor(cursorView).y).toEqual(ROWS - 1)
    })

    it('should return default (0,0) for empty view', () => {
      expect(readCursor(new Uint8Array(0))).toEqual({ x: 0, y: 0 })
    })
  })

  describe('readSequence / incrementSequence', () => {
    let sequenceView: Int32Array

    beforeEach(() => {
      sequenceView = new Int32Array(1)
    })

    it('should return 0 initially', () => {
      expect(readSequence(sequenceView)).toEqual(0)
    })

    it('should increment sequence', () => {
      incrementSequence(sequenceView)
      expect(readSequence(sequenceView)).toEqual(1)

      incrementSequence(sequenceView)
      expect(readSequence(sequenceView)).toEqual(2)
    })

    it('should return 0 for empty view', () => {
      expect(readSequence(new Int32Array(0))).toEqual(0)
    })
  })

  describe('writeScreenState', () => {
    let charView: Uint8Array
    let patternView: Uint8Array
    let cursorView: Uint8Array
    let scalarsView: Uint8Array

    beforeEach(() => {
      charView = new Uint8Array(ROWS * COLS)
      patternView = new Uint8Array(ROWS * COLS)
      cursorView = new Uint8Array(2)
      scalarsView = new Uint8Array(4)
    })

    it('should write character and pattern data', () => {
      const screenBuffer = Array.from({ length: ROWS }, (_, y) =>
        Array.from({ length: COLS }, (_, x) => ({
          character: 'A',
          colorPattern: 1,
          x,
          y,
        }))
      )

      writeScreenState(charView, patternView, cursorView, scalarsView, screenBuffer, 5, 3, 0, 0, 0, 2)

      // Check that screen was written (character 'A' should produce a non-zero code)
      expect(charView[0]).toBeGreaterThan(0)
      expect(patternView[0]).toEqual(1)
    })

    it('should write cursor and scalar values', () => {
      const screenBuffer = Array.from({ length: ROWS }, (_, y) =>
        Array.from({ length: COLS }, (_, x) => ({
          character: ' ',
          colorPattern: 0,
          x,
          y,
        }))
      )

      writeScreenState(charView, patternView, cursorView, scalarsView, screenBuffer, 10, 15, 1, 2, 30, 3)

      expect(cursorView[0]).toEqual(10)
      expect(cursorView[1]).toEqual(15)
      expect(scalarsView[0]).toEqual(1) // bgPalette & 1
      expect(scalarsView[1]).toEqual(2) // spritePalette & 3
      expect(scalarsView[2]).toEqual(30) // backdropColor
      expect(scalarsView[3]).toEqual(3) // cgenMode & 3
    })

    it('should skip when screenBuffer is null', () => {
      expect(() =>
        writeScreenState(charView, patternView, cursorView, scalarsView, null as never, 0, 0, 0, 0, 0, 0)
      ).not.toThrow()
    })

    it('should clamp scalar values', () => {
      const screenBuffer = Array.from({ length: ROWS }, (_, y) =>
        Array.from({ length: COLS }, (_, x) => ({
          character: ' ',
          colorPattern: 0,
          x,
          y,
        }))
      )

      writeScreenState(charView, patternView, cursorView, scalarsView, screenBuffer, 0, 0, 5, 7, 100, 9)

      expect(scalarsView[0]).toEqual(1) // bgPalette & 1
      expect(scalarsView[1]).toEqual(3) // spritePalette & 3
      expect(scalarsView[2]).toEqual(60) // backdropColor clamped to 60
      expect(scalarsView[3]).toEqual(1) // cgenMode & 3
    })
  })

  describe('readScreenState', () => {
    let charView: Uint8Array
    let patternView: Uint8Array
    let cursorView: Uint8Array
    let scalarsView: Uint8Array

    beforeEach(() => {
      charView = new Uint8Array(ROWS * COLS)
      patternView = new Uint8Array(ROWS * COLS)
      cursorView = new Uint8Array(2)
      scalarsView = new Uint8Array(4)
    })

    it('should read screen buffer with correct dimensions', () => {
      const state = readScreenState(charView, patternView, cursorView, scalarsView)

      expect(state.buffer.length).toEqual(ROWS)
      expect(state.buffer[0]?.length).toEqual(COLS)
    })

    it('should read cursor and scalar values', () => {
      cursorView[0] = 10
      cursorView[1] = 15
      scalarsView[0] = 1
      scalarsView[1] = 2
      scalarsView[2] = 30
      scalarsView[3] = 3

      const state = readScreenState(charView, patternView, cursorView, scalarsView)

      expect(state.cursorX).toEqual(10)
      expect(state.cursorY).toEqual(15)
      expect(state.bgPalette).toEqual(1)
      expect(state.spritePalette).toEqual(2)
      expect(state.backdropColor).toEqual(30)
      expect(state.cgenMode).toEqual(3)
    })

    it('should return 0 for uninitialized scalar values (Uint8Array defaults to 0)', () => {
      const state = readScreenState(charView, patternView, cursorView, scalarsView)

      // Uint8Array is zero-initialized, so ?? fallbacks do not trigger
      expect(state.bgPalette).toEqual(0)
      expect(state.spritePalette).toEqual(0)
      expect(state.backdropColor).toEqual(0)
      expect(state.cgenMode).toEqual(0)
    })
  })

  describe('readScreenBuffer', () => {
    let charView: Uint8Array
    let patternView: Uint8Array

    beforeEach(() => {
      charView = new Uint8Array(ROWS * COLS)
      patternView = new Uint8Array(ROWS * COLS)
    })

    it('should return buffer with correct dimensions', () => {
      const buffer = readScreenBuffer(charView, patternView)

      expect(buffer.length).toEqual(ROWS)
      expect(buffer[0]?.length).toEqual(COLS)
    })

    it('should include x,y coordinates in each cell', () => {
      const buffer = readScreenBuffer(charView, patternView)

      expect(buffer[5]?.[10]?.x).toEqual(10)
      expect(buffer[5]?.[10]?.y).toEqual(5)
    })
  })
})
