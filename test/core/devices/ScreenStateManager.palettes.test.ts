/**
 * Unit tests for ScreenStateManager palette combination snapshot
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { ScreenStateManager } from '@/core/devices/ScreenStateManager'

// Mock logger to suppress warnings in test output
vi.mock('@/shared/logger', () => ({
  logDevice: {
    warn: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

describe('ScreenStateManager - palette combinations', () => {
  let manager: ScreenStateManager

  beforeEach(() => {
    manager = new ScreenStateManager()
  })

  describe('getAllPaletteCombinations', () => {
    it('should return all background palette combinations with correct count', () => {
      const { background } = manager.getAllPaletteCombinations()
      // 2 background palettes x 4 combinations each = 8
      expect(background.length).toBe(8)
    })

    it('should return all sprite palette combinations with correct count', () => {
      const { sprite } = manager.getAllPaletteCombinations()
      // 3 sprite palettes x 4 combinations each = 12
      expect(sprite.length).toBe(12)
    })

    it('should return original palette data after resetState', () => {
      // Mutate a palette combination — default bgPalette is 1, so this mutates backgroundPalettes[1][0]
      manager.setPaletteCombination('B', 0, [99, 99, 99, 99])
      // Reset
      manager.resetState()
      const { background } = manager.getAllPaletteCombinations()
      // paletteIndex=1, combination=0 should be restored to BACKGROUND_PALETTES[1][0] = [0x00, 0x30, 0x21, 0x02]
      const mutatedEntry = background.find(
        e => e.paletteIndex === 1 && e.combination === 0,
      )
      expect(mutatedEntry!.colors).toEqual([0x00, 0x30, 0x21, 0x02])
    })
  })
})
