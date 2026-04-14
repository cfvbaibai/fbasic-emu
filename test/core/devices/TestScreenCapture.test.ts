/**
 * Unit tests for TestScreenCapture
 *
 * Tests the screen output capture and display state tracking module
 * that was extracted from TestDeviceAdapter.
 */

import { describe, expect, it } from 'vitest'

import { TestScreenCapture } from '@/core/devices/TestScreenCapture'

describe('TestScreenCapture', () => {
  function createCapture(): TestScreenCapture {
    return new TestScreenCapture()
  }

  // ---------------------------------------------------------------------------
  // Default State
  // ---------------------------------------------------------------------------
  describe('default state', () => {
    it('should initialize with empty output arrays', () => {
      const capture = createCapture()
      expect(capture.printOutputs).toEqual([])
      expect(capture.debugOutputs).toEqual([])
      expect(capture.errorOutputs).toEqual([])
    })

    it('should initialize with zero clear screen calls', () => {
      const capture = createCapture()
      expect(capture.clearScreenCalls).toBe(0)
    })

    it('should initialize with default cursor position', () => {
      const capture = createCapture()
      expect(capture.cursorPosition).toEqual({ x: 0, y: 0 })
    })

    it('should initialize with default backdrop color of 0', () => {
      const capture = createCapture()
      expect(capture.currentBackdropColor).toBe(0)
    })

    it('should initialize with default CGEN mode of 2', () => {
      const capture = createCapture()
      expect(capture.currentCgenMode).toBe(2)
    })

    it('should initialize with default color palette', () => {
      const capture = createCapture()
      expect(capture.currentColorPalette).toEqual({ bgPalette: 1, spritePalette: 1 })
    })

    it('should initialize with empty call arrays', () => {
      const capture = createCapture()
      expect(capture.colorPatternCalls).toEqual([])
      expect(capture.colorPaletteCalls).toEqual([])
      expect(capture.paletteCombinationCalls).toEqual([])
      expect(capture.backdropColorCalls).toEqual([])
      expect(capture.cgenModeCalls).toEqual([])
    })
  })

  // ---------------------------------------------------------------------------
  // Output Recording
  // ---------------------------------------------------------------------------
  describe('output recording', () => {
    it('should record print outputs', () => {
      const capture = createCapture()
      capture.recordPrintOutput('Hello')
      capture.recordPrintOutput('World')
      expect(capture.printOutputs).toEqual(['Hello', 'World'])
    })

    it('should record debug outputs', () => {
      const capture = createCapture()
      capture.recordDebugOutput('debug1')
      expect(capture.debugOutputs).toEqual(['debug1'])
    })

    it('should record error outputs', () => {
      const capture = createCapture()
      capture.recordErrorOutput('err1')
      expect(capture.errorOutputs).toEqual(['err1'])
    })
  })

  // ---------------------------------------------------------------------------
  // Clear Screen
  // ---------------------------------------------------------------------------
  describe('clearScreen', () => {
    it('should increment clear screen calls and reset outputs', () => {
      const capture = createCapture()
      capture.recordPrintOutput('Hello')
      capture.recordDebugOutput('info')
      capture.recordErrorOutput('err')
      capture.recordClearScreen()
      expect(capture.clearScreenCalls).toBe(1)
      expect(capture.printOutputs).toEqual([])
      expect(capture.debugOutputs).toEqual([])
      expect(capture.errorOutputs).toEqual([])
    })
  })

  // ---------------------------------------------------------------------------
  // Cursor Position
  // ---------------------------------------------------------------------------
  describe('cursor position', () => {
    it('should record cursor position', () => {
      const capture = createCapture()
      capture.recordCursorPosition(5, 10)
      expect(capture.cursorPosition).toEqual({ x: 5, y: 10 })
    })
  })

  // ---------------------------------------------------------------------------
  // Color Pattern
  // ---------------------------------------------------------------------------
  describe('color pattern', () => {
    it('should record color pattern calls', () => {
      const capture = createCapture()
      capture.recordColorPattern(1, 2, 3)
      expect(capture.colorPatternCalls).toEqual([{ x: 1, y: 2, pattern: 3 }])
    })
  })

  // ---------------------------------------------------------------------------
  // Color Palette
  // ---------------------------------------------------------------------------
  describe('color palette', () => {
    it('should record color palette calls and update current', () => {
      const capture = createCapture()
      capture.recordColorPalette(0, 2)
      expect(capture.colorPaletteCalls).toEqual([{ bgPalette: 0, spritePalette: 2 }])
      expect(capture.currentColorPalette).toEqual({ bgPalette: 0, spritePalette: 2 })
    })
  })

  // ---------------------------------------------------------------------------
  // Palette Combination
  // ---------------------------------------------------------------------------
  describe('palette combination', () => {
    it('should record palette combination for background', () => {
      const capture = createCapture()
      capture.recordPaletteCombination('B', 0, 0x11, 0x22, 0x33, 0x44)
      expect(capture.paletteCombinationCalls.length).toBe(1)
      expect(capture.paletteCombinationCalls[0]!.target).toBe('B')
      expect(capture.paletteCombinationCalls[0]!.colors).toEqual([0x11, 0x22, 0x33, 0x44])
    })

    it('should record palette combination for sprite', () => {
      const capture = createCapture()
      capture.recordPaletteCombination('S', 1, 0x55, 0x66, 0x77, 0x88)
      expect(capture.paletteCombinationCalls.length).toBe(1)
      expect(capture.paletteCombinationCalls[0]!.target).toBe('S')
      expect(capture.paletteCombinationCalls[0]!.colors).toEqual([0x55, 0x66, 0x77, 0x88])
    })
  })

  // ---------------------------------------------------------------------------
  // Backdrop Color
  // ---------------------------------------------------------------------------
  describe('backdrop color', () => {
    it('should record backdrop color calls and update current', () => {
      const capture = createCapture()
      capture.recordBackdropColor(5)
      expect(capture.backdropColorCalls).toEqual([5])
      expect(capture.currentBackdropColor).toBe(5)
    })
  })

  // ---------------------------------------------------------------------------
  // CGEN Mode
  // ---------------------------------------------------------------------------
  describe('CGEN mode', () => {
    it('should record CGEN mode calls and update current', () => {
      const capture = createCapture()
      capture.recordCgenMode(0)
      expect(capture.cgenModeCalls).toEqual([0])
      expect(capture.currentCgenMode).toBe(0)
    })
  })

  // ---------------------------------------------------------------------------
  // Query Methods
  // ---------------------------------------------------------------------------
  describe('query methods', () => {
    it('should aggregate all outputs', () => {
      const capture = createCapture()
      capture.recordPrintOutput('Hello\n')
      capture.recordDebugOutput('info')
      capture.recordErrorOutput('fail')
      expect(capture.getAllOutputs()).toBe('Hello\nDEBUG: infoRUNTIME: fail')
    })

    it('should return empty string when no outputs', () => {
      const capture = createCapture()
      expect(capture.getAllOutputs()).toBe('')
    })

    it('should check hasOutput for print type', () => {
      const capture = createCapture()
      capture.recordPrintOutput('test')
      expect(capture.hasOutput('test')).toBe(true)
      expect(capture.hasOutput('test', 'print')).toBe(true)
      expect(capture.hasOutput('test', 'debug')).toBe(false)
      expect(capture.hasOutput('missing')).toBe(false)
    })

    it('should check hasOutput for debug type', () => {
      const capture = createCapture()
      capture.recordDebugOutput('dbg')
      expect(capture.hasOutput('dbg', 'debug')).toBe(true)
    })

    it('should check hasOutput for error type', () => {
      const capture = createCapture()
      capture.recordErrorOutput('err')
      expect(capture.hasOutput('err', 'error')).toBe(true)
    })

    it('should return false for unknown output type', () => {
      const capture = createCapture()
      expect(capture.hasOutput('x', 'print' as 'print')).toBe(false)
    })

    it('should return clear screen call count', () => {
      const capture = createCapture()
      expect(capture.getClearScreenCallCount()).toBe(0)
      capture.recordClearScreen()
      capture.recordClearScreen()
      expect(capture.getClearScreenCallCount()).toBe(2)
    })

    it('should clear outputs without affecting clear screen count via clearOutputs', () => {
      const capture = createCapture()
      capture.recordPrintOutput('a')
      capture.recordDebugOutput('b')
      capture.recordErrorOutput('c')
      capture.recordClearScreen()
      capture.clearOutputs()
      expect(capture.printOutputs).toEqual([])
      expect(capture.debugOutputs).toEqual([])
      expect(capture.errorOutputs).toEqual([])
      expect(capture.clearScreenCalls).toBe(0)
    })
  })
})
