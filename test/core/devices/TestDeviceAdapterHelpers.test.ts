/**
 * Unit tests for TestDeviceAdapterHelpers
 *
 * Tests the standalone helper functions extracted from TestDeviceAdapter
 * in isolation: aggregateAllOutputs, hasOutputInArray, applyPaletteCombination,
 * and the default palette constants.
 */

import { describe, expect, it } from 'vitest'

import {
  aggregateAllOutputs,
  applyPaletteCombination,
  DEFAULT_BACKGROUND_PALETTES,
  DEFAULT_SPRITE_PALETTES,
  hasOutputInArray,
} from '@/core/devices/TestDeviceAdapterHelpers'

// ============================================================================
// aggregateAllOutputs
// ============================================================================

describe('aggregateAllOutputs', () => {
  it('should return empty string when all arrays are empty', () => {
    expect(aggregateAllOutputs([], [], [])).toBe('')
  })

  it('should return empty string when called with no outputs', () => {
    const result = aggregateAllOutputs([], [], [])
    expect(result).toBe('')
  })

  // ---------------------------------------------------------------------------
  // Print outputs
  // ---------------------------------------------------------------------------
  describe('print outputs', () => {
    it('should concatenate a single print output', () => {
      expect(aggregateAllOutputs(['Hello'], [], [])).toBe('Hello')
    })

    it('should concatenate multiple print outputs', () => {
      expect(aggregateAllOutputs(['Hello\n', 'World\n'], [], [])).toBe('Hello\nWorld\n')
    })

    it('should concatenate outputs without newlines directly', () => {
      expect(aggregateAllOutputs(['Hello', 'World'], [], [])).toBe('HelloWorld')
    })

    it('should handle mixed newline and non-newline print outputs', () => {
      expect(aggregateAllOutputs(['A\n', 'B', 'C\n'], [], [])).toBe('A\nBC\n')
    })

    it('should handle empty string print outputs', () => {
      expect(aggregateAllOutputs(['Hello', '', 'World'], [], [])).toBe('HelloWorld')
    })
  })

  // ---------------------------------------------------------------------------
  // Debug outputs
  // ---------------------------------------------------------------------------
  describe('debug outputs', () => {
    it('should prefix a single debug output with "DEBUG: "', () => {
      expect(aggregateAllOutputs([], ['info\n'], [])).toBe('DEBUG: info\n')
    })

    it('should prefix multiple debug outputs with "DEBUG: "', () => {
      expect(aggregateAllOutputs([], ['dbg1\n', 'dbg2\n'], [])).toBe('DEBUG: dbg1\nDEBUG: dbg2\n')
    })

    it('should handle debug output without newline', () => {
      expect(aggregateAllOutputs([], ['info'], [])).toBe('DEBUG: info')
    })
  })

  // ---------------------------------------------------------------------------
  // Error outputs
  // ---------------------------------------------------------------------------
  describe('error outputs', () => {
    it('should prefix a single error output with "RUNTIME: "', () => {
      expect(aggregateAllOutputs([], [], ['fail\n'])).toBe('RUNTIME: fail\n')
    })

    it('should prefix multiple error outputs with "RUNTIME: "', () => {
      expect(aggregateAllOutputs([], [], ['err1\n', 'err2\n'])).toBe('RUNTIME: err1\nRUNTIME: err2\n')
    })

    it('should handle error output without newline', () => {
      expect(aggregateAllOutputs([], [], ['fail'])).toBe('RUNTIME: fail')
    })
  })

  // ---------------------------------------------------------------------------
  // Mixed outputs
  // ---------------------------------------------------------------------------
  describe('mixed outputs', () => {
    it('should interleave print, debug, error outputs in order', () => {
      const result = aggregateAllOutputs(['print1\n'], ['debug1\n'], ['error1\n'])
      expect(result).toBe('print1\nDEBUG: debug1\nRUNTIME: error1\n')
    })

    it('should place all print outputs before all debug outputs', () => {
      const result = aggregateAllOutputs(['P1', 'P2'], ['D1'], [])
      expect(result).toBe('P1P2DEBUG: D1')
    })

    it('should place all debug outputs before all error outputs', () => {
      const result = aggregateAllOutputs([], ['D1'], ['E1'])
      expect(result).toBe('DEBUG: D1RUNTIME: E1')
    })

    it('should handle multiple outputs of each type', () => {
      const result = aggregateAllOutputs(
        ['A', 'B'],
        ['C', 'D'],
        ['E', 'F'],
      )
      expect(result).toBe('ABDEBUG: CDEBUG: DRUNTIME: ERUNTIME: F')
    })
  })
})

// ============================================================================
// hasOutputInArray
// ============================================================================

describe('hasOutputInArray', () => {
  it('should return true when target exists in array', () => {
    expect(hasOutputInArray(['Hello', 'World'], 'Hello')).toBe(true)
  })

  it('should return false when target does not exist in array', () => {
    expect(hasOutputInArray(['Hello', 'World'], 'Missing')).toBe(false)
  })

  it('should return false for empty array', () => {
    expect(hasOutputInArray([], 'anything')).toBe(false)
  })

  it('should return true when target is the only element', () => {
    expect(hasOutputInArray(['only'], 'only')).toBe(true)
  })

  it('should return false when target is an empty string and array has no empty strings', () => {
    expect(hasOutputInArray(['Hello'], '')).toBe(false)
  })

  it('should return true when target is an empty string and array contains empty string', () => {
    expect(hasOutputInArray(['Hello', '', 'World'], '')).toBe(true)
  })

  it('should match exact string, not substring', () => {
    expect(hasOutputInArray(['Hello World'], 'Hello')).toBe(false)
  })

  it('should match the last element in array', () => {
    expect(hasOutputInArray(['A', 'B', 'C'], 'C')).toBe(true)
  })

  it('should handle outputs with special characters', () => {
    expect(hasOutputInArray(['Line1\n', 'Line2\n'], 'Line1\n')).toBe(true)
  })
})

// ============================================================================
// applyPaletteCombination
// ============================================================================

describe('applyPaletteCombination', () => {
  function clonePalettes() {
    const bgPalettes = DEFAULT_BACKGROUND_PALETTES.map(p => p.map(c => [...c] as [number, number, number, number]))
    const spritePalettes = DEFAULT_SPRITE_PALETTES.map(p => p.map(c => [...c] as [number, number, number, number]))
    return { bgPalettes, spritePalettes }
  }

  // ---------------------------------------------------------------------------
  // Background target
  // ---------------------------------------------------------------------------
  describe('background target (B)', () => {
    it('should update background palette at index 0', () => {
      const { bgPalettes, spritePalettes } = clonePalettes()
      const colors: [number, number, number, number] = [0xFF, 0xEE, 0xDD, 0xCC]

      const result = applyPaletteCombination('B', 2, colors, 0, 0, bgPalettes, spritePalettes)

      expect(result).toEqual({
        target: 'B',
        paletteIndex: 0,
        combination: 2,
        colors: [0xFF, 0xEE, 0xDD, 0xCC],
      })
      expect(bgPalettes[0]![2]).toEqual([0xFF, 0xEE, 0xDD, 0xCC])
    })

    it('should update background palette at index 1', () => {
      const { bgPalettes, spritePalettes } = clonePalettes()
      const colors: [number, number, number, number] = [0x11, 0x22, 0x33, 0x44]

      const result = applyPaletteCombination('B', 3, colors, 1, 0, bgPalettes, spritePalettes)

      expect(result.paletteIndex).toBe(1)
      expect(bgPalettes[1]![3]).toEqual([0x11, 0x22, 0x33, 0x44])
    })

    it('should not modify sprite palettes', () => {
      const { bgPalettes, spritePalettes } = clonePalettes()
      const original = DEFAULT_SPRITE_PALETTES.map(
        p => p.map(c => [...c] as [number, number, number, number]),
      )

      applyPaletteCombination('B', 0, [1, 2, 3, 4], 0, 0, bgPalettes, spritePalettes)

      expect(spritePalettes).toEqual(original)
    })
  })

  // ---------------------------------------------------------------------------
  // Sprite target
  // ---------------------------------------------------------------------------
  describe('sprite target (S)', () => {
    it('should update sprite palette at index 0', () => {
      const { bgPalettes, spritePalettes } = clonePalettes()
      const colors: [number, number, number, number] = [0xAA, 0xBB, 0xCC, 0xDD]

      const result = applyPaletteCombination('S', 0, colors, 0, 0, bgPalettes, spritePalettes)

      expect(result).toEqual({
        target: 'S',
        paletteIndex: 0,
        combination: 0,
        colors: [0xAA, 0xBB, 0xCC, 0xDD],
      })
      expect(spritePalettes[0]![0]).toEqual([0xAA, 0xBB, 0xCC, 0xDD])
    })

    it('should update sprite palette at index 1', () => {
      const { bgPalettes, spritePalettes } = clonePalettes()
      const colors: [number, number, number, number] = [0x55, 0x66, 0x77, 0x88]

      const result = applyPaletteCombination('S', 1, colors, 0, 1, bgPalettes, spritePalettes)

      expect(result.paletteIndex).toBe(1)
      expect(spritePalettes[1]![1]).toEqual([0x55, 0x66, 0x77, 0x88])
    })

    it('should update sprite palette at index 2', () => {
      const { bgPalettes, spritePalettes } = clonePalettes()
      const colors: [number, number, number, number] = [0x99, 0x88, 0x77, 0x66]

      const result = applyPaletteCombination('S', 3, colors, 0, 2, bgPalettes, spritePalettes)

      expect(result.paletteIndex).toBe(2)
      expect(spritePalettes[2]![3]).toEqual([0x99, 0x88, 0x77, 0x66])
    })

    it('should not modify background palettes', () => {
      const { bgPalettes, spritePalettes } = clonePalettes()
      const original = DEFAULT_BACKGROUND_PALETTES.map(
        p => p.map(c => [...c] as [number, number, number, number]),
      )

      applyPaletteCombination('S', 0, [1, 2, 3, 4], 0, 0, bgPalettes, spritePalettes)

      expect(bgPalettes).toEqual(original)
    })
  })

  // ---------------------------------------------------------------------------
  // Palette index clamping
  // ---------------------------------------------------------------------------
  describe('palette index clamping', () => {
    it('should clamp bg palette index to max of 1 when exceeding range', () => {
      const { bgPalettes, spritePalettes } = clonePalettes()
      const colors: [number, number, number, number] = [1, 2, 3, 4]

      const result = applyPaletteCombination('B', 0, colors, 99, 0, bgPalettes, spritePalettes)

      expect(result.paletteIndex).toBe(1)
    })

    it('should clamp bg palette index to min of 0 when below range', () => {
      const { bgPalettes, spritePalettes } = clonePalettes()
      const colors: [number, number, number, number] = [1, 2, 3, 4]

      const result = applyPaletteCombination('B', 0, colors, -1, 0, bgPalettes, spritePalettes)

      expect(result.paletteIndex).toBe(0)
    })

    it('should clamp sprite palette index to max of 2 when exceeding range', () => {
      const { bgPalettes, spritePalettes } = clonePalettes()
      const colors: [number, number, number, number] = [1, 2, 3, 4]

      const result = applyPaletteCombination('S', 0, colors, 0, 99, bgPalettes, spritePalettes)

      expect(result.paletteIndex).toBe(2)
    })

    it('should clamp sprite palette index to min of 0 when below range', () => {
      const { bgPalettes, spritePalettes } = clonePalettes()
      const colors: [number, number, number, number] = [1, 2, 3, 4]

      const result = applyPaletteCombination('S', 0, colors, 0, -1, bgPalettes, spritePalettes)

      expect(result.paletteIndex).toBe(0)
    })

    it('should handle extreme negative indices', () => {
      const { bgPalettes, spritePalettes } = clonePalettes()
      const colors: [number, number, number, number] = [1, 2, 3, 4]

      const resultBg = applyPaletteCombination('B', 0, colors, -9999, 0, bgPalettes, spritePalettes)
      expect(resultBg.paletteIndex).toBe(0)

      const { bgPalettes: bg2, spritePalettes: sp2 } = clonePalettes()
      const resultSp = applyPaletteCombination('S', 0, colors, 0, -9999, bg2, sp2)
      expect(resultSp.paletteIndex).toBe(0)
    })

    it('should handle extreme positive indices', () => {
      const { bgPalettes, spritePalettes } = clonePalettes()
      const colors: [number, number, number, number] = [1, 2, 3, 4]

      const resultBg = applyPaletteCombination('B', 0, colors, 9999, 0, bgPalettes, spritePalettes)
      expect(resultBg.paletteIndex).toBe(1)

      const { bgPalettes: bg2, spritePalettes: sp2 } = clonePalettes()
      const resultSp = applyPaletteCombination('S', 0, colors, 0, 9999, bg2, sp2)
      expect(resultSp.paletteIndex).toBe(2)
    })
  })

  // ---------------------------------------------------------------------------
  // Return value structure
  // ---------------------------------------------------------------------------
  describe('return value', () => {
    it('should return target in result for background', () => {
      const { bgPalettes, spritePalettes } = clonePalettes()
      const result = applyPaletteCombination('B', 1, [0, 0, 0, 0], 0, 0, bgPalettes, spritePalettes)
      expect(result.target).toBe('B')
    })

    it('should return target in result for sprite', () => {
      const { bgPalettes, spritePalettes } = clonePalettes()
      const result = applyPaletteCombination('S', 1, [0, 0, 0, 0], 0, 0, bgPalettes, spritePalettes)
      expect(result.target).toBe('S')
    })

    it('should return the combination index in result', () => {
      const { bgPalettes, spritePalettes } = clonePalettes()
      const result = applyPaletteCombination('B', 3, [0, 0, 0, 0], 0, 0, bgPalettes, spritePalettes)
      expect(result.combination).toBe(3)
    })

    it('should return the colors tuple in result', () => {
      const { bgPalettes, spritePalettes } = clonePalettes()
      const colors: [number, number, number, number] = [0x12, 0x34, 0x56, 0x78]
      const result = applyPaletteCombination('B', 0, colors, 0, 0, bgPalettes, spritePalettes)
      expect(result.colors).toEqual([0x12, 0x34, 0x56, 0x78])
    })
  })

  // ---------------------------------------------------------------------------
  // Mutation behavior
  // ---------------------------------------------------------------------------
  describe('mutation behavior', () => {
    it('should mutate the palettes array in place', () => {
      const { bgPalettes, spritePalettes } = clonePalettes()
      const colors: [number, number, number, number] = [0xAB, 0xCD, 0xEF, 0x01]

      applyPaletteCombination('B', 0, colors, 0, 0, bgPalettes, spritePalettes)

      // The mutation should be visible in the original array
      expect(bgPalettes[0]![0]).toEqual([0xAB, 0xCD, 0xEF, 0x01])
    })

    it('should overwrite existing combination values', () => {
      const { bgPalettes, spritePalettes } = clonePalettes()
      const colors1: [number, number, number, number] = [0x11, 0x22, 0x33, 0x44]
      const colors2: [number, number, number, number] = [0x55, 0x66, 0x77, 0x88]

      applyPaletteCombination('B', 0, colors1, 0, 0, bgPalettes, spritePalettes)
      applyPaletteCombination('B', 0, colors2, 0, 0, bgPalettes, spritePalettes)

      expect(bgPalettes[0]![0]).toEqual([0x55, 0x66, 0x77, 0x88])
    })
  })
})

// ============================================================================
// DEFAULT_BACKGROUND_PALETTES
// ============================================================================

describe('DEFAULT_BACKGROUND_PALETTES', () => {
  it('should have exactly 2 palettes', () => {
    expect(DEFAULT_BACKGROUND_PALETTES.length).toBe(2)
  })

  it('should have 4 combinations per palette', () => {
    for (const palette of DEFAULT_BACKGROUND_PALETTES) {
      expect(palette.length).toBe(4)
    }
  })

  it('should have 4 color values per combination', () => {
    for (const palette of DEFAULT_BACKGROUND_PALETTES) {
      for (const combo of palette) {
        expect(combo.length).toBe(4)
      }
    }
  })

  it('should have specific known values for first palette first combination', () => {
    expect(DEFAULT_BACKGROUND_PALETTES[0]![0]).toEqual([0x00, 0x2c, 0x15, 0x07])
  })

  it('should have specific known values for second palette last combination', () => {
    expect(DEFAULT_BACKGROUND_PALETTES[1]![3]).toEqual([0x00, 0x29, 0x36, 0x17])
  })

  it('should have all color values in valid 0x00-0x36 range', () => {
    for (const palette of DEFAULT_BACKGROUND_PALETTES) {
      for (const combo of palette) {
        for (const color of combo) {
          expect(color).toBeGreaterThanOrEqual(0x00)
          expect(color).toBeLessThanOrEqual(0x36)
        }
      }
    }
  })
})

// ============================================================================
// DEFAULT_SPRITE_PALETTES
// ============================================================================

describe('DEFAULT_SPRITE_PALETTES', () => {
  it('should have exactly 3 palettes', () => {
    expect(DEFAULT_SPRITE_PALETTES.length).toBe(3)
  })

  it('should have 4 combinations per palette', () => {
    for (const palette of DEFAULT_SPRITE_PALETTES) {
      expect(palette.length).toBe(4)
    }
  })

  it('should have 4 color values per combination', () => {
    for (const palette of DEFAULT_SPRITE_PALETTES) {
      for (const combo of palette) {
        expect(combo.length).toBe(4)
      }
    }
  })

  it('should have specific known values for first palette first combination', () => {
    expect(DEFAULT_SPRITE_PALETTES[0]![0]).toEqual([0x00, 0x36, 0x16, 0x02])
  })

  it('should have specific known values for third palette last combination', () => {
    expect(DEFAULT_SPRITE_PALETTES[2]![3]).toEqual([0x00, 0x30, 0x26, 0x19])
  })

  it('should have all color values in valid 0x00-0x36 range', () => {
    for (const palette of DEFAULT_SPRITE_PALETTES) {
      for (const combo of palette) {
        for (const color of combo) {
          expect(color).toBeGreaterThanOrEqual(0x00)
          expect(color).toBeLessThanOrEqual(0x36)
        }
      }
    }
  })
})
