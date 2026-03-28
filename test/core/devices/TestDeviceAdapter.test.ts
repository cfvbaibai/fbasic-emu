/**
 * Unit tests for TestDeviceAdapter and TestDeviceAdapterHelpers
 */

import { describe, expect, it, vi } from 'vitest'

import { TestDeviceAdapter } from '@/core/devices/TestDeviceAdapter'
import {
  aggregateAllOutputs,
  applyPaletteCombination,
  DEFAULT_BACKGROUND_PALETTES,
  DEFAULT_SPRITE_PALETTES,
} from '@/core/devices/TestDeviceAdapterHelpers'

// Mock logger
vi.mock('@/shared/logger', () => ({
  logDevice: {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

// ============================================================================
// TestDeviceAdapterHelpers
// ============================================================================

describe('TestDeviceAdapterHelpers', () => {
  // ---------------------------------------------------------------------------
  // aggregateAllOutputs
  // ---------------------------------------------------------------------------
  describe('aggregateAllOutputs', () => {
    it('should return empty string when no outputs', () => {
      expect(aggregateAllOutputs([], [], [])).toBe('')
    })

    it('should concatenate print outputs', () => {
      expect(aggregateAllOutputs(['Hello\n', 'World\n'], [], [])).toBe('Hello\nWorld\n')
    })

    it('should prefix debug outputs with "DEBUG: "', () => {
      expect(aggregateAllOutputs([], ['info\n'], [])).toBe('DEBUG: info\n')
    })

    it('should prefix error outputs with "RUNTIME: "', () => {
      expect(aggregateAllOutputs([], [], ['fail\n'])).toBe('RUNTIME: fail\n')
    })

    it('should interleave print, debug, error outputs in order', () => {
      const result = aggregateAllOutputs(['print1\n'], ['debug1\n'], ['error1\n'])
      expect(result).toBe('print1\nDEBUG: debug1\nRUNTIME: error1\n')
    })

    it('should concatenate outputs without newlines directly', () => {
      expect(aggregateAllOutputs(['Hello', 'World'], [], [])).toBe('HelloWorld')
    })

    it('should handle mixed newline/non-newline outputs', () => {
      const result = aggregateAllOutputs(['A\n', 'B', 'C\n'], [], [])
      expect(result).toBe('A\nBC\n')
    })
  })

  // ---------------------------------------------------------------------------
  // applyPaletteCombination
  // ---------------------------------------------------------------------------
  describe('applyPaletteCombination', () => {
    it('should update background palette at correct index', () => {
      const bgPalettes = DEFAULT_BACKGROUND_PALETTES.map(p => p.map(c => [...c] as [number, number, number, number]))
      const spritePalettes = DEFAULT_SPRITE_PALETTES.map(p => p.map(c => [...c] as [number, number, number, number]))
      const colors: [number, number, number, number] = [0xFF, 0xFF, 0xFF, 0xFF]

      const result = applyPaletteCombination('B', 2, colors, 1, 0, bgPalettes, spritePalettes)

      expect(result).toEqual({
        target: 'B',
        paletteIndex: 1,
        combination: 2,
        colors: [0xFF, 0xFF, 0xFF, 0xFF],
      })
      expect(bgPalettes[1]![2]).toEqual([0xFF, 0xFF, 0xFF, 0xFF])
    })

    it('should update sprite palette at correct index', () => {
      const bgPalettes = DEFAULT_BACKGROUND_PALETTES.map(p => p.map(c => [...c] as [number, number, number, number]))
      const spritePalettes = DEFAULT_SPRITE_PALETTES.map(p => p.map(c => [...c] as [number, number, number, number]))
      const colors: [number, number, number, number] = [0xAA, 0xBB, 0xCC, 0xDD]

      const result = applyPaletteCombination('S', 0, colors, 0, 2, bgPalettes, spritePalettes)

      expect(result).toEqual({
        target: 'S',
        paletteIndex: 2,
        combination: 0,
        colors: [0xAA, 0xBB, 0xCC, 0xDD],
      })
      expect(spritePalettes[2]![0]).toEqual([0xAA, 0xBB, 0xCC, 0xDD])
    })

    it('should clamp bg palette index to valid range', () => {
      const bgPalettes = DEFAULT_BACKGROUND_PALETTES.map(p => p.map(c => [...c] as [number, number, number, number]))
      const spritePalettes = DEFAULT_SPRITE_PALETTES.map(p => p.map(c => [...c] as [number, number, number, number]))
      const colors: [number, number, number, number] = [1, 2, 3, 4]

      // bgPalette out of range high -> clamped to 1
      const result = applyPaletteCombination('B', 0, colors, 99, 0, bgPalettes, spritePalettes)
      expect(result.paletteIndex).toBe(1)

      // bgPalette out of range low -> clamped to 0
      const result2 = applyPaletteCombination('B', 0, colors, -1, 0, bgPalettes, spritePalettes)
      expect(result2.paletteIndex).toBe(0)
    })

    it('should clamp sprite palette index to valid range', () => {
      const bgPalettes = DEFAULT_BACKGROUND_PALETTES.map(p => p.map(c => [...c] as [number, number, number, number]))
      const spritePalettes = DEFAULT_SPRITE_PALETTES.map(p => p.map(c => [...c] as [number, number, number, number]))
      const colors: [number, number, number, number] = [1, 2, 3, 4]

      // spritePalette out of range high -> clamped to 2
      const result = applyPaletteCombination('S', 0, colors, 0, 99, bgPalettes, spritePalettes)
      expect(result.paletteIndex).toBe(2)

      // spritePalette out of range low -> clamped to 0
      const result2 = applyPaletteCombination('S', 0, colors, 0, -1, bgPalettes, spritePalettes)
      expect(result2.paletteIndex).toBe(0)
    })
  })

  // ---------------------------------------------------------------------------
  // Default palette constants
  // ---------------------------------------------------------------------------
  describe('DEFAULT_BACKGROUND_PALETTES', () => {
    it('should have 2 palettes with 4 combinations each', () => {
      expect(DEFAULT_BACKGROUND_PALETTES.length).toBe(2)
      for (const palette of DEFAULT_BACKGROUND_PALETTES) {
        expect(palette.length).toBe(4)
        for (const combo of palette) {
          expect(combo.length).toBe(4)
        }
      }
    })
  })

  describe('DEFAULT_SPRITE_PALETTES', () => {
    it('should have 3 palettes with 4 combinations each', () => {
      expect(DEFAULT_SPRITE_PALETTES.length).toBe(3)
      for (const palette of DEFAULT_SPRITE_PALETTES) {
        expect(palette.length).toBe(4)
        for (const combo of palette) {
          expect(combo.length).toBe(4)
        }
      }
    })
  })
})

// ============================================================================
// TestDeviceAdapter
// ============================================================================

describe('TestDeviceAdapter', () => {
  function createAdapter(): TestDeviceAdapter {
    return new TestDeviceAdapter()
  }

  // ---------------------------------------------------------------------------
  // Construction
  // ---------------------------------------------------------------------------
  describe('constructor', () => {
    it('should create an adapter with default state', () => {
      const adapter = createAdapter()
      expect(adapter.printOutputs).toEqual([])
      expect(adapter.debugOutputs).toEqual([])
      expect(adapter.errorOutputs).toEqual([])
      expect(adapter.clearScreenCalls).toBe(0)
      expect(adapter.cursorPosition).toEqual({ x: 0, y: 0 })
      expect(adapter.currentBackdropColor).toBe(0)
      expect(adapter.currentCgenMode).toBe(2)
      expect(adapter.currentColorPalette).toEqual({ bgPalette: 1, spritePalette: 1 })
      expect(adapter.beepCalls).toBe(0)
      expect(adapter.playSoundCalls).toEqual([])
      expect(adapter.copyBgGraphicToBackgroundCalls).toBe(0)
    })
  })

  // ---------------------------------------------------------------------------
  // Joystick
  // ---------------------------------------------------------------------------
  describe('joystick', () => {
    it('should return default joystick count of 2', () => {
      const adapter = createAdapter()
      expect(adapter.getJoystickCount()).toBe(2)
    })

    it('should get/set stick state', () => {
      const adapter = createAdapter()
      expect(adapter.getStickState(0)).toBe(0)
      adapter.setStickState(0, 8)
      expect(adapter.getStickState(0)).toBe(8)
    })

    it('should push and consume STRIG events', () => {
      const adapter = createAdapter()
      adapter.pushStrigState(0, 8)
      adapter.pushStrigState(0, 4)
      expect(adapter.consumeStrigState(0)).toBe(8)
      expect(adapter.consumeStrigState(0)).toBe(4)
      expect(adapter.consumeStrigState(0)).toBe(0)
    })

    it('should return 0 when consuming from empty buffer', () => {
      const adapter = createAdapter()
      expect(adapter.consumeStrigState(0)).toBe(0)
    })

    it('should handle multiple joysticks independently', () => {
      const adapter = createAdapter()
      adapter.setStickState(0, 8)
      adapter.setStickState(1, 4)
      expect(adapter.getStickState(0)).toBe(8)
      expect(adapter.getStickState(1)).toBe(4)
    })

    it('should setup joystick state via helper', () => {
      const adapter = createAdapter()
      adapter.setupJoystickState(0, 8, [1, 2])
      expect(adapter.getStickState(0)).toBe(8)
      expect(adapter.consumeStrigState(0)).toBe(1)
      expect(adapter.consumeStrigState(0)).toBe(2)
    })

    it('should simulate STRIG press', () => {
      const adapter = createAdapter()
      adapter.simulateStrigPress(0, 16)
      expect(adapter.consumeStrigState(0)).toBe(16)
    })

    it('should simulate STICK direction', () => {
      const adapter = createAdapter()
      adapter.simulateStickDirection(0, 4)
      expect(adapter.getStickState(0)).toBe(4)
    })

    it('should check pending STRIG events', () => {
      const adapter = createAdapter()
      expect(adapter.hasPendingStrigEvents(0)).toBe(false)
      adapter.pushStrigState(0, 8)
      expect(adapter.hasPendingStrigEvents(0)).toBe(true)
    })

    it('should count pending STRIG events', () => {
      const adapter = createAdapter()
      expect(adapter.getPendingStrigEventsCount(0)).toBe(0)
      adapter.pushStrigState(0, 8)
      adapter.pushStrigState(0, 4)
      expect(adapter.getPendingStrigEventsCount(0)).toBe(2)
    })

    it('should clear joystick state', () => {
      const adapter = createAdapter()
      adapter.setStickState(0, 8)
      adapter.pushStrigState(0, 1)
      adapter.clearJoystickState()
      expect(adapter.getStickState(0)).toBe(0)
      expect(adapter.hasPendingStrigEvents(0)).toBe(false)
    })
  })

  // ---------------------------------------------------------------------------
  // Keyboard (INKEY$)
  // ---------------------------------------------------------------------------
  describe('keyboard (INKEY$)', () => {
    it('should get/set/clear inkey state', () => {
      const adapter = createAdapter()
      expect(adapter.getInkeyState()).toBe('')
      adapter.setInkeyStateForTest('A')
      expect(adapter.getInkeyState()).toBe('A')
      adapter.clearInkeyStateForTest()
      expect(adapter.getInkeyState()).toBe('')
    })

    it('should resolve waitForInkey from queue', async () => {
      const adapter = createAdapter()
      adapter.waitForInkeyQueue = ['X', 'Y']
      expect(await adapter.waitForInkey!()).toBe('X')
      expect(await adapter.waitForInkey!()).toBe('Y')
    })

    it('should resolve waitForInkey from current state when queue is empty', async () => {
      const adapter = createAdapter()
      adapter.setInkeyStateForTest('Z')
      expect(await adapter.waitForInkey!()).toBe('Z')
    })

    it('should resolve waitForInkeyBlocking from queue', () => {
      const adapter = createAdapter()
      adapter.waitForInkeyQueue = ['X']
      expect(adapter.waitForInkeyBlocking!()).toBe('X')
    })

    it('should resolve waitForInkeyBlocking from current state when queue is empty', () => {
      const adapter = createAdapter()
      adapter.setInkeyStateForTest('W')
      expect(adapter.waitForInkeyBlocking!()).toBe('W')
    })
  })

  // ---------------------------------------------------------------------------
  // Sprite Position
  // ---------------------------------------------------------------------------
  describe('sprite position', () => {
    it('should return null for unset sprite position', () => {
      const adapter = createAdapter()
      expect(adapter.getSpritePosition(1)).toBeNull()
    })

    it('should set and get sprite position', () => {
      const adapter = createAdapter()
      adapter.setSpritePosition(1, 10, 20)
      expect(adapter.getSpritePosition(1)).toEqual({ x: 10, y: 20 })
    })

    it('should set sprite position for test (alias)', () => {
      const adapter = createAdapter()
      adapter.setSpritePositionForTest(2, 30, 40)
      expect(adapter.getSpritePosition(2)).toEqual({ x: 30, y: 40 })
    })
  })

  // ---------------------------------------------------------------------------
  // Input (INPUT/LINPUT)
  // ---------------------------------------------------------------------------
  describe('requestInput', () => {
    it('should return queued input responses', async () => {
      const adapter = createAdapter()
      adapter.inputResponseQueue = [['Hello', 'World'], ['Foo']]
      expect(await adapter.requestInput!('A=?')).toEqual(['Hello', 'World'])
      expect(await adapter.requestInput!('B=?')).toEqual(['Foo'])
    })

    it('should return ["0"] when queue is empty', async () => {
      const adapter = createAdapter()
      expect(await adapter.requestInput!('?')).toEqual(['0'])
    })
  })

  // ---------------------------------------------------------------------------
  // Sound
  // ---------------------------------------------------------------------------
  describe('sound', () => {
    it('should capture playSound calls', () => {
      const adapter = createAdapter()
      const audio = {
        channels: [[
          { frequency: 440, duration: 500, channel: 0, duty: 2, envelope: 0, volumeOrLength: 15 },
        ]],
      }
      adapter.playSound!(audio as never)
      expect(adapter.playSoundCalls.length).toBe(1)
    })

    it('should count beep calls', () => {
      const adapter = createAdapter()
      adapter.beep!()
      adapter.beep!()
      expect(adapter.beepCalls).toBe(2)
    })
  })

  // ---------------------------------------------------------------------------
  // BG Graphic
  // ---------------------------------------------------------------------------
  describe('BG graphic', () => {
    it('should count copyBgGraphicToBackground calls', () => {
      const adapter = createAdapter()
      adapter.copyBgGraphicToBackground!()
      adapter.copyBgGraphicToBackground!()
      expect(adapter.copyBgGraphicToBackgroundCalls).toBe(2)
    })
  })

  // ---------------------------------------------------------------------------
  // Text Output
  // ---------------------------------------------------------------------------
  describe('text output', () => {
    it('should capture print outputs', () => {
      const adapter = createAdapter()
      adapter.printOutput('Hello')
      adapter.printOutput('World')
      expect(adapter.printOutputs).toEqual(['Hello', 'World'])
    })

    it('should capture debug outputs', () => {
      const adapter = createAdapter()
      adapter.debugOutput('debug1')
      expect(adapter.debugOutputs).toEqual(['debug1'])
    })

    it('should capture error outputs', () => {
      const adapter = createAdapter()
      adapter.errorOutput('err1')
      expect(adapter.errorOutputs).toEqual(['err1'])
    })

    it('should clear screen and reset outputs', () => {
      const adapter = createAdapter()
      adapter.printOutput('Hello')
      adapter.clearScreen()
      expect(adapter.clearScreenCalls).toBe(1)
      expect(adapter.printOutputs).toEqual([])
      expect(adapter.debugOutputs).toEqual([])
      expect(adapter.errorOutputs).toEqual([])
    })

    it('should set and get cursor position', () => {
      const adapter = createAdapter()
      adapter.setCursorPosition(5, 10)
      expect(adapter.getCursorPosition()).toEqual({ x: 5, y: 10 })
    })

    it('should return space for getScreenCell', () => {
      const adapter = createAdapter()
      expect(adapter.getScreenCell(0, 0)).toBe(' ')
    })
  })

  // ---------------------------------------------------------------------------
  // Color / Palette
  // ---------------------------------------------------------------------------
  describe('color and palette', () => {
    it('should capture color pattern calls', () => {
      const adapter = createAdapter()
      adapter.setColorPattern(1, 2, 3)
      expect(adapter.colorPatternCalls).toEqual([{ x: 1, y: 2, pattern: 3 }])
    })

    it('should capture color palette calls and update current', () => {
      const adapter = createAdapter()
      adapter.setColorPalette(0, 2)
      expect(adapter.colorPaletteCalls).toEqual([{ bgPalette: 0, spritePalette: 2 }])
      expect(adapter.currentColorPalette).toEqual({ bgPalette: 0, spritePalette: 2 })
    })

    it('should apply palette combination for background', () => {
      const adapter = createAdapter()
      adapter.setPaletteCombination('B', 0, 0x11, 0x22, 0x33, 0x44)
      expect(adapter.paletteCombinationCalls.length).toBe(1)
      expect(adapter.paletteCombinationCalls[0]!.target).toBe('B')
      expect(adapter.paletteCombinationCalls[0]!.colors).toEqual([0x11, 0x22, 0x33, 0x44])
    })

    it('should apply palette combination for sprite', () => {
      const adapter = createAdapter()
      adapter.setPaletteCombination('S', 1, 0x55, 0x66, 0x77, 0x88)
      expect(adapter.paletteCombinationCalls.length).toBe(1)
      expect(adapter.paletteCombinationCalls[0]!.target).toBe('S')
      expect(adapter.paletteCombinationCalls[0]!.colors).toEqual([0x55, 0x66, 0x77, 0x88])
    })

    it('should capture backdrop color calls and update current', () => {
      const adapter = createAdapter()
      adapter.setBackdropColor(5)
      expect(adapter.backdropColorCalls).toEqual([5])
      expect(adapter.currentBackdropColor).toBe(5)
    })

    it('should capture CGEN mode calls and update current', () => {
      const adapter = createAdapter()
      adapter.setCharacterGeneratorMode(0)
      expect(adapter.cgenModeCalls).toEqual([0])
      expect(adapter.currentCgenMode).toBe(0)
      expect(adapter.getCharacterGeneratorMode()).toBe(0)
    })

    it('should return default CGEN mode of 2', () => {
      const adapter = createAdapter()
      expect(adapter.getCharacterGeneratorMode()).toBe(2)
    })
  })

  // ---------------------------------------------------------------------------
  // Test Helpers
  // ---------------------------------------------------------------------------
  describe('test helpers', () => {
    it('should clear all outputs', () => {
      const adapter = createAdapter()
      adapter.printOutput('a')
      adapter.debugOutput('b')
      adapter.errorOutput('c')
      adapter.clearScreen()
      adapter.clearOutputs()
      expect(adapter.printOutputs).toEqual([])
      expect(adapter.debugOutputs).toEqual([])
      expect(adapter.errorOutputs).toEqual([])
      expect(adapter.clearScreenCalls).toBe(0)
    })

    it('should reset all state', () => {
      const adapter = createAdapter()
      adapter.printOutput('hello')
      adapter.setStickState(0, 8)
      adapter.pushStrigState(0, 1)
      adapter.setSpritePosition(1, 5, 5)
      adapter.reset()
      expect(adapter.printOutputs).toEqual([])
      expect(adapter.getStickState(0)).toBe(0)
      expect(adapter.hasPendingStrigEvents(0)).toBe(false)
      expect(adapter.getSpritePosition(1)).toBeNull()
    })

    it('should get all outputs aggregated', () => {
      const adapter = createAdapter()
      adapter.printOutput('Hello\n')
      adapter.debugOutput('info')
      adapter.errorOutput('fail')
      expect(adapter.getAllOutputs()).toBe('Hello\nDEBUG: infoRUNTIME: fail')
    })

    it('should check hasOutput for print type', () => {
      const adapter = createAdapter()
      adapter.printOutput('test')
      expect(adapter.hasOutput('test')).toBe(true)
      expect(adapter.hasOutput('test', 'print')).toBe(true)
      expect(adapter.hasOutput('test', 'debug')).toBe(false)
      expect(adapter.hasOutput('missing')).toBe(false)
    })

    it('should check hasOutput for debug type', () => {
      const adapter = createAdapter()
      adapter.debugOutput('dbg')
      expect(adapter.hasOutput('dbg', 'debug')).toBe(true)
    })

    it('should check hasOutput for error type', () => {
      const adapter = createAdapter()
      adapter.errorOutput('err')
      expect(adapter.hasOutput('err', 'error')).toBe(true)
    })

    it('should return false for unknown output type', () => {
      const adapter = createAdapter()
      // Cast to bypass type checking for coverage
      expect(adapter.hasOutput('x', 'print' as 'print')).toBe(false)
    })

    it('should get clear screen call count', () => {
      const adapter = createAdapter()
      expect(adapter.getClearScreenCallCount()).toBe(0)
      adapter.clearScreen()
      adapter.clearScreen()
      expect(adapter.getClearScreenCallCount()).toBe(2)
    })
  })
})
