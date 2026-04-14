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
import type { DefSpriteDefinition, SpriteState } from '@/core/sprite/types'
import type { Tile } from '@/shared/data/types'

// ============================================================================
// Mock Canvas Factory
// ============================================================================

function createMockContext() {
  const ctx = {
    fillRect: vi.fn<(...args: unknown[]) => void>(),
    fillText: vi.fn<(...args: unknown[]) => void>(),
    measureText: vi.fn<(...args: unknown[]) => { width: number }>(() => ({ width: 8 })),
    putImageData: vi.fn<(...args: unknown[]) => void>(),
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
// Sprite Test Helpers
// ============================================================================

/** Creates a minimal 8x8 tile with the given color index. */
function createSolidTile(colorIndex: number): Tile {
  return Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => colorIndex))
}

/** Creates a minimal DefSpriteDefinition for testing. */
function createSpriteDefinition(
  overrides: Partial<DefSpriteDefinition> = {},
): DefSpriteDefinition {
  return {
    spriteNumber: 0,
    colorCombination: 0,
    size: 0,
    priority: 0,
    invertX: 0,
    invertY: 0,
    characterSet: '@',
    tiles: [createSolidTile(1)],
    ...overrides,
  }
}

/** Creates a SpriteState for testing. */
function createSpriteState(
  overrides: Partial<SpriteState> = {},
): SpriteState {
  return {
    spriteNumber: 0,
    x: 0,
    y: 0,
    visible: true,
    priority: 0,
    definition: createSpriteDefinition(),
    ...overrides,
  }
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

  describe('sprite position methods', () => {
    it('getSpritePosition returns null when no position stored', () => {
      const { canvas } = createMockContext()
      const adapter = new MainThreadDeviceAdapter({ canvas })
      expect(adapter.getSpritePosition(0)).toBeNull()
    })

    it('setSpritePosition stores and getSpritePosition retrieves position', () => {
      const { canvas } = createMockContext()
      const adapter = new MainThreadDeviceAdapter({ canvas })

      adapter.setSpritePosition(0, 100, 50)

      expect(adapter.getSpritePosition(0)).toEqual({ x: 100, y: 50 })
    })

    it('clearSpritePosition removes stored position', () => {
      const { canvas } = createMockContext()
      const adapter = new MainThreadDeviceAdapter({ canvas })

      adapter.setSpritePosition(0, 100, 50)
      adapter.clearSpritePosition(0)

      expect(adapter.getSpritePosition(0)).toBeNull()
    })

    it('stores positions for multiple action numbers independently', () => {
      const { canvas } = createMockContext()
      const adapter = new MainThreadDeviceAdapter({ canvas })

      adapter.setSpritePosition(0, 10, 20)
      adapter.setSpritePosition(3, 200, 150)

      expect(adapter.getSpritePosition(0)).toEqual({ x: 10, y: 20 })
      expect(adapter.getSpritePosition(3)).toEqual({ x: 200, y: 150 })
      expect(adapter.getSpritePosition(1)).toBeNull()
    })
  })

  describe('sendSpriteStates', () => {
    it('stores sprite states and enables sprite rendering', () => {
      const { ctx, canvas } = createMockContext()
      const adapter = new MainThreadDeviceAdapter({ canvas })

      const sprite = createSpriteState({ spriteNumber: 0, x: 10, y: 20 })
      adapter.sendSpriteStates([sprite], true)

      // Sprite should be rendered via putImageData
      expect(ctx.putImageData).toHaveBeenCalled()
      const callArgs = ctx.putImageData.mock.calls[0]!
      expect(callArgs[1]).toEqual(10)
      expect(callArgs[2]).toEqual(20)
    })

    it('does not render sprites when spriteEnabled is false', () => {
      const { ctx, canvas } = createMockContext()
      const adapter = new MainThreadDeviceAdapter({ canvas })

      const sprite = createSpriteState({ spriteNumber: 0, x: 10, y: 20 })
      adapter.sendSpriteStates([sprite], false)

      expect(ctx.putImageData).not.toHaveBeenCalled()
    })

    it('skips invisible sprites even when enabled', () => {
      const { ctx, canvas } = createMockContext()
      const adapter = new MainThreadDeviceAdapter({ canvas })

      const sprite = createSpriteState({ visible: false })
      adapter.sendSpriteStates([sprite], true)

      expect(ctx.putImageData).not.toHaveBeenCalled()
    })

    it('renders multiple visible sprites', () => {
      const { ctx, canvas } = createMockContext()
      const adapter = new MainThreadDeviceAdapter({ canvas })

      const sprite0 = createSpriteState({ spriteNumber: 0, x: 10, y: 20 })
      const sprite1 = createSpriteState({
        spriteNumber: 1,
        x: 50,
        y: 60,
        definition: createSpriteDefinition({ spriteNumber: 1 }),
      })

      adapter.sendSpriteStates([sprite0, sprite1], true)

      expect(ctx.putImageData).toHaveBeenCalledTimes(2)
    })

    it('re-renders sprites on subsequent sendSpriteStates calls', () => {
      const { ctx, canvas } = createMockContext()
      const adapter = new MainThreadDeviceAdapter({ canvas })

      const sprite = createSpriteState({ x: 10, y: 20 })
      adapter.sendSpriteStates([sprite], true)

      const callCount = ctx.putImageData.mock.calls.length

      // Send updated position
      const updatedSprite = createSpriteState({ x: 30, y: 40 })
      adapter.sendSpriteStates([updatedSprite], true)

      expect(ctx.putImageData.mock.calls.length).toEqual(callCount + 1)
      const lastCall = ctx.putImageData.mock.calls[callCount]!
      expect(lastCall[1]).toEqual(30)
      expect(lastCall[2]).toEqual(40)
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

    it('resets sprite renderer state and clears sprite positions', () => {
      const { ctx, canvas } = createMockContext()
      const adapter = new MainThreadDeviceAdapter({ canvas })

      // Set up sprite state
      adapter.setSpritePosition(0, 100, 50)
      const sprite = createSpriteState({ x: 10, y: 20 })
      adapter.sendSpriteStates([sprite], true)

      // Verify sprite was rendered before reset
      expect(ctx.putImageData).toHaveBeenCalled()

      // Reset
      adapter.resetState()

      // Sprite positions should be cleared
      expect(adapter.getSpritePosition(0)).toBeNull()

      // After reset, sending sprites with enabled=true should still render
      ctx.putImageData.mockClear()
      const newSprite = createSpriteState({ x: 5, y: 10 })
      adapter.sendSpriteStates([newSprite], true)
      expect(ctx.putImageData).toHaveBeenCalled()
    })
  })
})
