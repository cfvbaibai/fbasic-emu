/**
 * Unit tests for ScreenPaletteState in isolation
 *
 * ScreenPaletteState was extracted from ScreenStateManager in PR #573.
 * These tests cover palette state management directly without the
 * screen buffer/cursor overhead of ScreenStateManager integration tests.
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { PALETTE_DEFAULTS } from '@/core/constants'
import { ScreenPaletteState } from '@/core/devices/ScreenPaletteState'
import { ORIGINAL_BACKGROUND_PALETTES, ORIGINAL_SPRITE_PALETTES } from '@/shared/data/palette'

// Mock logger to suppress warnings in test output
vi.mock('@/shared/logger', () => ({
  logDevice: {
    warn: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

describe('ScreenPaletteState', () => {
  let state: ScreenPaletteState

  beforeEach(() => {
    state = new ScreenPaletteState()
  })

  // ===========================================================================
  // Construction / initial state
  // ===========================================================================

  describe('construction', () => {
    it('should initialize bgPalette to PALETTE_DEFAULTS.BG_PALETTE', () => {
      expect(state.getPalette().bgPalette).toBe(PALETTE_DEFAULTS.BG_PALETTE)
    })

    it('should initialize spritePalette to PALETTE_DEFAULTS.SPRITE_PALETTE', () => {
      expect(state.getPalette().spritePalette).toBe(PALETTE_DEFAULTS.SPRITE_PALETTE)
    })

    it('should initialize backdropColor to PALETTE_DEFAULTS.BACKDROP_COLOR', () => {
      expect(state.getBackdropColor()).toBe(PALETTE_DEFAULTS.BACKDROP_COLOR)
    })

    it('should initialize cgenMode to PALETTE_DEFAULTS.CGEN_MODE', () => {
      expect(state.getCgenMode()).toBe(PALETTE_DEFAULTS.CGEN_MODE)
    })
  })

  // ===========================================================================
  // setColorPalette
  // ===========================================================================

  describe('setColorPalette', () => {
    it('should set bgPalette and spritePalette to valid values', () => {
      state.setColorPalette(0, 2)
      expect(state.getPalette()).toEqual({ bgPalette: 0, spritePalette: 2 })
    })

    it('should clamp bgPalette below 0 to 0', () => {
      state.setColorPalette(-1, 0)
      expect(state.getPalette().bgPalette).toBe(0)
    })

    it('should clamp bgPalette above 1 to 1', () => {
      state.setColorPalette(5, 0)
      expect(state.getPalette().bgPalette).toBe(1)
    })

    it('should clamp spritePalette below 0 to 0', () => {
      state.setColorPalette(0, -3)
      expect(state.getPalette().spritePalette).toBe(0)
    })

    it('should clamp spritePalette above 2 to 2', () => {
      state.setColorPalette(0, 10)
      expect(state.getPalette().spritePalette).toBe(2)
    })

    it('should accept boundary values 0 and 1 for bgPalette', () => {
      state.setColorPalette(0, 0)
      expect(state.getPalette().bgPalette).toBe(0)

      state.setColorPalette(1, 0)
      expect(state.getPalette().bgPalette).toBe(1)
    })

    it('should accept boundary values 0, 1, and 2 for spritePalette', () => {
      for (const val of [0, 1, 2]) {
        state.setColorPalette(0, val)
        expect(state.getPalette().spritePalette).toBe(val)
      }
    })
  })

  // ===========================================================================
  // setBackdropColor
  // ===========================================================================

  describe('setBackdropColor', () => {
    it('should set backdropColor to a valid value', () => {
      state.setBackdropColor(30)
      expect(state.getBackdropColor()).toBe(30)
    })

    it('should clamp values below 0 to 0', () => {
      state.setBackdropColor(-10)
      expect(state.getBackdropColor()).toBe(0)
    })

    it('should clamp values above 60 to 60', () => {
      state.setBackdropColor(100)
      expect(state.getBackdropColor()).toBe(60)
    })

    it('should accept boundary values 0 and 60', () => {
      state.setBackdropColor(0)
      expect(state.getBackdropColor()).toBe(0)

      state.setBackdropColor(60)
      expect(state.getBackdropColor()).toBe(60)
    })
  })

  // ===========================================================================
  // setCharacterGeneratorMode
  // ===========================================================================

  describe('setCharacterGeneratorMode', () => {
    it('should set cgenMode to a valid value', () => {
      state.setCharacterGeneratorMode(1)
      expect(state.getCgenMode()).toBe(1)
    })

    it('should clamp values below 0 to 0', () => {
      state.setCharacterGeneratorMode(-5)
      expect(state.getCgenMode()).toBe(0)
    })

    it('should clamp values above 3 to 3', () => {
      state.setCharacterGeneratorMode(99)
      expect(state.getCgenMode()).toBe(3)
    })

    it('should accept all valid values 0 through 3', () => {
      for (const mode of [0, 1, 2, 3]) {
        state.setCharacterGeneratorMode(mode)
        expect(state.getCgenMode()).toBe(mode)
      }
    })
  })

  // ===========================================================================
  // resetState
  // ===========================================================================

  describe('resetState', () => {
    it('should restore all scalar fields to PALETTE_DEFAULTS', () => {
      state.setColorPalette(0, 0)
      state.setBackdropColor(50)
      state.setCharacterGeneratorMode(0)

      state.resetState()

      expect(state.getPalette()).toEqual({
        bgPalette: PALETTE_DEFAULTS.BG_PALETTE,
        spritePalette: PALETTE_DEFAULTS.SPRITE_PALETTE,
      })
      expect(state.getBackdropColor()).toBe(PALETTE_DEFAULTS.BACKDROP_COLOR)
      expect(state.getCgenMode()).toBe(PALETTE_DEFAULTS.CGEN_MODE)
    })

    it('should restore background palettes to ORIGINAL_BACKGROUND_PALETTES after mutation', () => {
      state.setPaletteCombination('B', 0, [99, 99, 99, 99])

      state.resetState()

      const { background } = state.getAllPaletteCombinations()
      for (const entry of background) {
        const original = ORIGINAL_BACKGROUND_PALETTES[entry.paletteIndex]![entry.combination]!
        expect(entry.colors).toEqual([...original] as [number, number, number, number])
      }
    })

    it('should restore sprite palettes to ORIGINAL_SPRITE_PALETTES after mutation', () => {
      state.setPaletteCombination('S', 2, [88, 88, 88, 88])

      state.resetState()

      const { sprite } = state.getAllPaletteCombinations()
      for (const entry of sprite) {
        const original = ORIGINAL_SPRITE_PALETTES[entry.paletteIndex]![entry.combination]!
        expect(entry.colors).toEqual([...original] as [number, number, number, number])
      }
    })
  })

  // ===========================================================================
  // getAllPaletteCombinations
  // ===========================================================================

  describe('getAllPaletteCombinations', () => {
    it('should return 8 background entries (2 palettes x 4 combinations)', () => {
      const { background } = state.getAllPaletteCombinations()
      expect(background.length).toBe(8)
    })

    it('should return 12 sprite entries (3 palettes x 4 combinations)', () => {
      const { sprite } = state.getAllPaletteCombinations()
      expect(sprite.length).toBe(12)
    })

    it('should return correct paletteIndex and combination for each background entry', () => {
      const { background } = state.getAllPaletteCombinations()

      // Expected palette indices: 0,0,0,0, 1,1,1,1
      // Expected combination indices: 0,1,2,3 repeated
      for (let p = 0; p < 2; p++) {
        for (let c = 0; c < 4; c++) {
          const entry = background[p * 4 + c]!
          expect(entry.paletteIndex).toBe(p)
          expect(entry.combination).toBe(c)
        }
      }
    })

    it('should return correct paletteIndex and combination for each sprite entry', () => {
      const { sprite } = state.getAllPaletteCombinations()

      for (let p = 0; p < 3; p++) {
        for (let c = 0; c < 4; c++) {
          const entry = sprite[p * 4 + c]!
          expect(entry.paletteIndex).toBe(p)
          expect(entry.combination).toBe(c)
        }
      }
    })

    it('should return colors matching ORIGINAL_BACKGROUND_PALETTES on fresh instance', () => {
      const { background } = state.getAllPaletteCombinations()

      for (const entry of background) {
        const expected = ORIGINAL_BACKGROUND_PALETTES[entry.paletteIndex]![entry.combination]!
        expect(entry.colors).toEqual([...expected] as [number, number, number, number])
      }
    })

    it('should return colors matching ORIGINAL_SPRITE_PALETTES on fresh instance', () => {
      const { sprite } = state.getAllPaletteCombinations()

      for (const entry of sprite) {
        const expected = ORIGINAL_SPRITE_PALETTES[entry.paletteIndex]![entry.combination]!
        expect(entry.colors).toEqual([...expected] as [number, number, number, number])
      }
    })

    it('should reflect mutations made by setPaletteCombination', () => {
      state.setColorPalette(0, 0)
      state.setPaletteCombination('B', 1, [10, 20, 30, 40])

      const { background } = state.getAllPaletteCombinations()
      const entry = background.find(e => e.paletteIndex === 0 && e.combination === 1)
      expect(entry!.colors).toEqual([10, 20, 30, 40])
    })
  })

  // ===========================================================================
  // setPaletteCombination
  // ===========================================================================

  describe('setPaletteCombination', () => {
    it('should mutate background palette and return correct paletteIndex for target B', () => {
      state.setColorPalette(0, 0)
      const result = state.setPaletteCombination('B', 2, [5, 10, 15, 20])

      expect(result.paletteIndex).toBe(0)
      expect(result.colors).toEqual([5, 10, 15, 20])
    })

    it('should use current bgPalette index for target B', () => {
      state.setColorPalette(1, 0)
      const result = state.setPaletteCombination('B', 0, [1, 2, 3, 4])

      expect(result.paletteIndex).toBe(1)
    })

    it('should mutate sprite palette and return correct paletteIndex for target S', () => {
      state.setColorPalette(0, 2)
      const result = state.setPaletteCombination('S', 3, [50, 51, 52, 53])

      expect(result.paletteIndex).toBe(2)
      expect(result.colors).toEqual([50, 51, 52, 53])
    })

    it('should use current spritePalette index for target S', () => {
      state.setColorPalette(0, 1)
      const result = state.setPaletteCombination('S', 0, [7, 8, 9, 10])

      expect(result.paletteIndex).toBe(1)
    })

    it('should clamp combination index below 0 to 0', () => {
      state.setColorPalette(0, 0)
      state.setPaletteCombination('B', -5, [1, 2, 3, 4])

      // Combination was clamped to 0, so palette 0 combination 0 should now be [1,2,3,4]
      const { background } = state.getAllPaletteCombinations()
      const entry = background.find(e => e.paletteIndex === 0 && e.combination === 0)
      expect(entry!.colors).toEqual([1, 2, 3, 4])
    })

    it('should clamp combination index above 3 to 3', () => {
      state.setColorPalette(0, 0)
      state.setPaletteCombination('B', 10, [11, 12, 13, 14])

      const { background } = state.getAllPaletteCombinations()
      const entry = background.find(e => e.paletteIndex === 0 && e.combination === 3)
      expect(entry!.colors).toEqual([11, 12, 13, 14])
    })

    it('should clamp color values below 0 to 0', () => {
      state.setColorPalette(0, 0)
      const result = state.setPaletteCombination('B', 0, [-1, -2, -3, -4])

      expect(result.colors).toEqual([0, 0, 0, 0])
    })

    it('should clamp color values above 60 to 60', () => {
      state.setColorPalette(0, 0)
      const result = state.setPaletteCombination('B', 0, [100, 200, 300, 400])

      expect(result.colors).toEqual([60, 60, 60, 60])
    })

    it('should produce independent copies in getAllPaletteCombinations (not references)', () => {
      state.setColorPalette(0, 0)
      state.setPaletteCombination('B', 0, [10, 20, 30, 40])

      const snapshot1 = state.getAllPaletteCombinations()
      const entry1 = snapshot1.background.find(e => e.paletteIndex === 0 && e.combination === 0)!

      // Mutate the returned snapshot — should not affect internal state
      entry1.colors[0] = 999

      const snapshot2 = state.getAllPaletteCombinations()
      const entry2 = snapshot2.background.find(e => e.paletteIndex === 0 && e.combination === 0)!
      expect(entry2.colors).toEqual([10, 20, 30, 40])
    })
  })

  // ===========================================================================
  // Palette isolation (mutations do not cross between B and S)
  // ===========================================================================

  describe('palette isolation', () => {
    it('should not affect sprite palettes when mutating background', () => {
      state.setColorPalette(0, 0)
      state.setPaletteCombination('B', 0, [99, 99, 99, 99])

      const { sprite } = state.getAllPaletteCombinations()
      const spriteEntry = sprite.find(e => e.paletteIndex === 0 && e.combination === 0)
      const original = ORIGINAL_SPRITE_PALETTES[0][0]
      expect(spriteEntry!.colors).toEqual([...original] as [number, number, number, number])
    })

    it('should not affect background palettes when mutating sprite', () => {
      state.setColorPalette(0, 0)
      state.setPaletteCombination('S', 0, [99, 99, 99, 99])

      const { background } = state.getAllPaletteCombinations()
      const bgEntry = background.find(e => e.paletteIndex === 0 && e.combination === 0)
      const original = ORIGINAL_BACKGROUND_PALETTES[0][0]
      expect(bgEntry!.colors).toEqual([...original] as [number, number, number, number])
    })
  })
})
