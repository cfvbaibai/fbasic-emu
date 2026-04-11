// @vitest-environment jsdom
/**
 * Palette Reset Integration Tests (issue #435)
 *
 * Tests that main-thread palette arrays (BACKGROUND_PALETTES, SPRITE_PALETTES)
 * are properly reset when a new program starts, preventing visual state from
 * a previous program from persisting on screen.
 *
 * ## Why this is an integration test
 *
 * TestProgram creates a fresh adapter per instance with its own deep-copied
 * palettes, so it cannot reproduce this bug. The actual bug surface is the
 * module-level BACKGROUND_PALETTES / SPRITE_PALETTES arrays in palette.ts,
 * which are shared across all program runs on the main thread and mutated
 * in place by setRuntimePaletteCombination().
 *
 * ## Root Cause
 *
 * PR #437 added postPaletteCombinationResetMessages() to DeviceScreenManager
 * to send palette reset messages at program start. However, the fix is broken:
 *
 * ScreenStateManager.resetPalettes() copies from module-level BACKGROUND_PALETTES
 * as the "original" source. But BACKGROUND_PALETTES has already been mutated by
 * the previous program's PALETB execution (via setRuntimePaletteCombination()).
 * So resetPalettes() copies the MUTATED values back into the worker's instance
 * copy, and the reset messages contain wrong values.
 *
 * The fix needs ORIGINAL_BACKGROUND_PALETTES / ORIGINAL_SPRITE_PALETTES as
 * immutable source-of-truth constants that are never mutated.
 *
 * ## TDD Status
 *
 * The "fix verification" tests FAIL until the correct fix is implemented:
 * 1. Store immutable original palette values in palette.ts
 * 2. Use those originals in resetRuntimePalettes() to restore module-level arrays
 * 3. Use those originals in ScreenStateManager.resetPalettes() (instead of
 *    reading from the mutable BACKGROUND_PALETTES)
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DeviceScreenManager } from '@/core/devices/DeviceScreenManager'
import {
  BACKGROUND_PALETTES,
  resetRuntimePalettes,
  setRuntimePaletteCombination,
  SPRITE_PALETTES,
} from '@/shared/data/palette'

/** Deep-clone palette arrays for snapshot comparison. */
function clonePalettes(
  palettes: readonly (readonly number[])[][]
): number[][][] {
  return palettes.map(p => p.map(c => [...c]))
}

describe('Palette reset across program runs (issue #435)', () => {
  let originalBg: number[][][]
  let originalSprite: number[][][]

  beforeEach(() => {
    originalBg = clonePalettes(BACKGROUND_PALETTES)
    originalSprite = clonePalettes(SPRITE_PALETTES)
  })

  afterEach(() => {
    // Restore module-level arrays to prevent cross-test contamination.
    for (let i = 0; i < originalBg.length; i++) {
      for (let j = 0; j < originalBg[i]!.length; j++) {
        BACKGROUND_PALETTES[i]![j]![0] = originalBg[i]![j]![0]!
        BACKGROUND_PALETTES[i]![j]![1] = originalBg[i]![j]![1]!
        BACKGROUND_PALETTES[i]![j]![2] = originalBg[i]![j]![2]!
        BACKGROUND_PALETTES[i]![j]![3] = originalBg[i]![j]![3]!
      }
    }
    for (let i = 0; i < originalSprite.length; i++) {
      for (let j = 0; j < originalSprite[i]!.length; j++) {
        SPRITE_PALETTES[i]![j]![0] = originalSprite[i]![j]![0]!
        SPRITE_PALETTES[i]![j]![1] = originalSprite[i]![j]![1]!
        SPRITE_PALETTES[i]![j]![2] = originalSprite[i]![j]![2]!
        SPRITE_PALETTES[i]![j]![3] = originalSprite[i]![j]![3]!
      }
    }
  })

  // =========================================================================
  // Bug demonstration: setRuntimePaletteCombination mutates module-level arrays
  // =========================================================================

  describe('setRuntimePaletteCombination mutates module-level arrays', () => {
    it('should mutate BACKGROUND_PALETTES[0] combination 0 in place', () => {
      setRuntimePaletteCombination('B', 0, 0, [1, 0, 0, 0])
      expect(BACKGROUND_PALETTES[0][0]).toEqual([1, 0, 0, 0])
    })

    it('should mutate SPRITE_PALETTES[0] combination 0 in place', () => {
      setRuntimePaletteCombination('S', 0, 0, [0x21, 0x22, 0x23, 0x24])
      expect(SPRITE_PALETTES[0][0]).toEqual([0x21, 0x22, 0x23, 0x24])
    })

    it('should not affect other combinations in the same palette', () => {
      const before = clonePalettes(BACKGROUND_PALETTES)
      setRuntimePaletteCombination('B', 0, 0, [1, 0, 0, 0])
      expect(BACKGROUND_PALETTES[0][1]).toEqual(before[0]![1])
      expect(BACKGROUND_PALETTES[0][2]).toEqual(before[0]![2])
      expect(BACKGROUND_PALETTES[0][3]).toEqual(before[0]![3])
    })
  })

  // =========================================================================
  // Fix verification: resetRuntimePalettes restores original values
  // These tests FAIL until the fix is implemented.
  // =========================================================================

  describe('resetRuntimePalettes restores original values', () => {
    it('should restore BACKGROUND_PALETTES after PALETB mutation', () => {
      setRuntimePaletteCombination('B', 0, 0, [1, 0, 0, 0])

      resetRuntimePalettes()

      expect(clonePalettes(BACKGROUND_PALETTES)).toEqual(originalBg)
    })

    it('should restore SPRITE_PALETTES after PALETS mutation', () => {
      setRuntimePaletteCombination('S', 1, 2, [0x30, 0x31, 0x32, 0x33])

      resetRuntimePalettes()

      expect(clonePalettes(SPRITE_PALETTES)).toEqual(originalSprite)
    })

    it('should restore all palettes after extensive mutations (Screen sample scenario)', () => {
      // Simulate the Screen sample: PALETB 0, 1, 0, 0, 0 sets dark blue background
      setRuntimePaletteCombination('B', 0, 0, [1, 0, 0, 0])
      setRuntimePaletteCombination('B', 0, 1, [0x21, 0x22, 0x23, 0x24])
      setRuntimePaletteCombination('B', 1, 0, [5, 5, 5, 5])
      setRuntimePaletteCombination('S', 0, 0, [0x30, 0x31, 0x32, 0x33])
      setRuntimePaletteCombination('S', 2, 3, [0x3C, 0x3C, 0x3C, 0x3C])

      resetRuntimePalettes()

      expect(clonePalettes(BACKGROUND_PALETTES)).toEqual(originalBg)
      expect(clonePalettes(SPRITE_PALETTES)).toEqual(originalSprite)
    })

    it('should be safe to call multiple times (idempotent)', () => {
      setRuntimePaletteCombination('B', 0, 0, [1, 0, 0, 0])

      resetRuntimePalettes()
      resetRuntimePalettes()

      expect(clonePalettes(BACKGROUND_PALETTES)).toEqual(originalBg)
    })

    it('should be safe to call when palettes are already at defaults', () => {
      resetRuntimePalettes()

      expect(clonePalettes(BACKGROUND_PALETTES)).toEqual(originalBg)
      expect(clonePalettes(SPRITE_PALETTES)).toEqual(originalSprite)
    })
  })

  // =========================================================================
  // Worker→Main thread message flow verification
  // Tests that palette reset messages contain correct original values.
  // =========================================================================

  describe('palette reset messages contain original values', () => {
    it('should send palette reset messages with unmutated values after PALETB', () => {
      // Save originals BEFORE any mutation
      const savedBg = clonePalettes(BACKGROUND_PALETTES)
      const savedSprite = clonePalettes(SPRITE_PALETTES)

      // Create manager BEFORE mutation (simulates fresh worker with unmutated module)
      const manager = new DeviceScreenManager()

      // Mutate module-level arrays (simulates main thread after program A)
      setRuntimePaletteCombination('B', 0, 0, [1, 0, 0, 0])

      // Capture postMessage calls
      type PaletteMsg = {
        data: {
          updateType: string
          paletteTarget?: string
          paletteIndex?: number
          paletteCombination?: number
          paletteColors?: number[]
        }
      }
      const messages: PaletteMsg[] = []
      const spy = vi.spyOn(self, 'postMessage').mockImplementation((msg: unknown) => {
        messages.push(msg as typeof messages[0])
      })

      // Start new execution — should send palette reset messages
      manager.setCurrentExecutionId('test-exec')

      spy.mockRestore()

      // Extract palette-combination reset messages
      const paletteMessages = messages.filter(m => m.data?.updateType === 'palette-combination')
      expect(paletteMessages.length).toBeGreaterThan(0)

      // Apply reset messages to module-level arrays (simulating main thread handler)
      for (const msg of paletteMessages) {
        const { paletteTarget, paletteIndex, paletteCombination, paletteColors } = msg.data
        if (paletteTarget && paletteIndex !== undefined && paletteCombination !== undefined && paletteColors) {
          setRuntimePaletteCombination(
            paletteTarget as 'B' | 'S',
            paletteIndex,
            paletteCombination,
            paletteColors as [number, number, number, number],
          )
        }
      }

      // CRITICAL ASSERTION: palettes must be restored to ORIGINAL values
      // If this fails, resetPalettes() copied from already-mutated BACKGROUND_PALETTES
      expect(clonePalettes(BACKGROUND_PALETTES)).toEqual(savedBg)
      expect(clonePalettes(SPRITE_PALETTES)).toEqual(savedSprite)
    })
  })
})
