/**
 * Tests for MainThreadDeviceAdapter
 *
 * Verifies the main-thread device adapter used by the export runtime.
 * Tests screen delegation, input handling, and stub methods for features
 * not yet supported in the export (sound, sprites, input dialog).
 */

import { describe, expect, it, vi } from 'vitest'

import { SCREEN_DIMENSIONS } from '@/core/constants'
import type { CanvasSurface } from '@/core/devices/CanvasScreenRenderer'
import { MainThreadDeviceAdapter } from '@/core/devices/MainThreadDeviceAdapter'

// ============================================================================
// Mock Canvas Factory
// ============================================================================

function createMockContext() {
  const ctx = {
    fillRect: vi.fn<(...args: unknown[]) => void>(),
    fillText: vi.fn<(...args: unknown[]) => void>(),
    measureText: vi.fn<(...args: unknown[]) => { width: number }>(() => ({ width: 8 })),
    fillStyle: '',
    font: '',
    textBaseline: '',
  }

  const canvas: CanvasSurface = {
    width: SCREEN_DIMENSIONS.SPRITE.WIDTH,
    height: SCREEN_DIMENSIONS.SPRITE.HEIGHT,
    getContext: (_contextId: '2d') => ctx,
  }

  return { ctx, canvas }
}

// ============================================================================
// Tests
// ============================================================================

describe('MainThreadDeviceAdapter', () => {
  describe('constructor', () => {
    it('creates an adapter with a canvas', () => {
      const { canvas } = createMockContext()
      const adapter = new MainThreadDeviceAdapter({ canvas })
      expect(adapter).toBeDefined()
    })
  })

  describe('joystick methods (stubbed)', () => {
    it('getJoystickCount returns 0', () => {
      const { canvas } = createMockContext()
      const adapter = new MainThreadDeviceAdapter({ canvas })
      expect(adapter.getJoystickCount()).toEqual(0)
    })

    it('getStickState returns 0', () => {
      const { canvas } = createMockContext()
      const adapter = new MainThreadDeviceAdapter({ canvas })
      expect(adapter.getStickState(0)).toEqual(0)
    })

    it('setStickState does not throw', () => {
      const { canvas } = createMockContext()
      const adapter = new MainThreadDeviceAdapter({ canvas })
      expect(() => adapter.setStickState(0, 1)).not.toThrow()
    })

    it('pushStrigState does not throw', () => {
      const { canvas } = createMockContext()
      const adapter = new MainThreadDeviceAdapter({ canvas })
      expect(() => adapter.pushStrigState(0, 1)).not.toThrow()
    })

    it('consumeStrigState returns 0', () => {
      const { canvas } = createMockContext()
      const adapter = new MainThreadDeviceAdapter({ canvas })
      expect(adapter.consumeStrigState(0)).toEqual(0)
    })
  })

  describe('keyboard input (INKEY$)', () => {
    it('getInkeyState returns empty string by default', () => {
      const { canvas } = createMockContext()
      const adapter = new MainThreadDeviceAdapter({ canvas })
      expect(adapter.getInkeyState()).toEqual('')
    })

    it('setInkeyState stores the key character', () => {
      const { canvas } = createMockContext()
      const adapter = new MainThreadDeviceAdapter({ canvas })
      adapter.setInkeyState('A')
      expect(adapter.getInkeyState()).toEqual('A')
    })

    it('clearInkeyState clears the stored key', () => {
      const { canvas } = createMockContext()
      const adapter = new MainThreadDeviceAdapter({ canvas })
      adapter.setInkeyState('A')
      adapter.clearInkeyState()
      expect(adapter.getInkeyState()).toEqual('')
    })
  })

  describe('sprite methods (stubbed)', () => {
    it('getSpritePosition returns null', () => {
      const { canvas } = createMockContext()
      const adapter = new MainThreadDeviceAdapter({ canvas })
      expect(adapter.getSpritePosition(0)).toBeNull()
    })
  })

  describe('text output delegation', () => {
    it('printOutput writes characters to screen buffer', () => {
      const { canvas } = createMockContext()
      const adapter = new MainThreadDeviceAdapter({ canvas })

      adapter.printOutput('A')

      // The character 'A' should be at position (0, 0) in the screen buffer
      expect(adapter.getScreenCell(0, 0)).toEqual('A')
    })

    it('printOutput triggers canvas render', () => {
      const { ctx, canvas } = createMockContext()
      const adapter = new MainThreadDeviceAdapter({ canvas })

      adapter.printOutput('X')

      // Canvas should have been rendered (fillText called for 'X')
      expect(ctx.fillText).toHaveBeenCalledWith('X', 0, 0)
    })

    it('debugOutput delegates to same screen buffer', () => {
      const { canvas } = createMockContext()
      const adapter = new MainThreadDeviceAdapter({ canvas })

      adapter.debugOutput('D')

      expect(adapter.getScreenCell(0, 0)).toEqual('D')
    })

    it('errorOutput delegates to same screen buffer', () => {
      const { canvas } = createMockContext()
      const adapter = new MainThreadDeviceAdapter({ canvas })

      adapter.errorOutput('E')

      expect(adapter.getScreenCell(0, 0)).toEqual('E')
    })

    it('clearScreen resets screen buffer and clears canvas', () => {
      const { ctx, canvas } = createMockContext()
      const adapter = new MainThreadDeviceAdapter({ canvas })

      adapter.printOutput('A')
      adapter.clearScreen()

      // Screen buffer should be cleared (all spaces)
      expect(adapter.getScreenCell(0, 0)).toEqual(' ')

      // Canvas should be cleared
      expect(ctx.fillRect).toHaveBeenCalledWith(
        0,
        0,
        SCREEN_DIMENSIONS.SPRITE.WIDTH,
        SCREEN_DIMENSIONS.SPRITE.HEIGHT,
      )
    })

    it('setCursorPosition and getCursorPosition work', () => {
      const { canvas } = createMockContext()
      const adapter = new MainThreadDeviceAdapter({ canvas })

      adapter.setCursorPosition(5, 10)
      expect(adapter.getCursorPosition()).toEqual({ x: 5, y: 10 })
    })

    it('getScreenCell returns space for empty cell', () => {
      const { canvas } = createMockContext()
      const adapter = new MainThreadDeviceAdapter({ canvas })

      expect(adapter.getScreenCell(0, 0)).toEqual(' ')
    })

    it('getScreenCell with colorSwitch returns 0 for empty cell', () => {
      const { canvas } = createMockContext()
      const adapter = new MainThreadDeviceAdapter({ canvas })

      expect(adapter.getScreenCell(0, 0, 1)).toEqual(0)
    })
  })

  describe('palette methods delegation', () => {
    it('setColorPalette delegates to screen state', () => {
      const { canvas } = createMockContext()
      const adapter = new MainThreadDeviceAdapter({ canvas })

      expect(() => adapter.setColorPalette(0, 1)).not.toThrow()
    })

    it('setBackdropColor delegates to screen state', () => {
      const { canvas } = createMockContext()
      const adapter = new MainThreadDeviceAdapter({ canvas })

      expect(() => adapter.setBackdropColor(5)).not.toThrow()
    })

    it('setCharacterGeneratorMode delegates to screen state', () => {
      const { canvas } = createMockContext()
      const adapter = new MainThreadDeviceAdapter({ canvas })

      expect(() => adapter.setCharacterGeneratorMode(1)).not.toThrow()
    })

    it('getCharacterGeneratorMode returns default value', () => {
      const { canvas } = createMockContext()
      const adapter = new MainThreadDeviceAdapter({ canvas })

      expect(adapter.getCharacterGeneratorMode()).toEqual(2)
    })

    it('setColorPattern delegates to screen state', () => {
      const { canvas } = createMockContext()
      const adapter = new MainThreadDeviceAdapter({ canvas })

      expect(() => adapter.setColorPattern(0, 0, 1)).not.toThrow()
    })
  })

  describe('resetState', () => {
    it('clears screen buffer and re-renders', () => {
      const { canvas } = createMockContext()
      const adapter = new MainThreadDeviceAdapter({ canvas })

      adapter.printOutput('A')
      adapter.resetState()

      expect(adapter.getScreenCell(0, 0)).toEqual(' ')
    })
  })
})
