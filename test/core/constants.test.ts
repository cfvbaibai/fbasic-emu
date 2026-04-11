/**
 * Unit tests for palette state utilities in constants.ts
 *
 * Covers createPaletteRefTarget() getter/setter proxy behavior
 * and its integration with resetPaletteState().
 */

import { describe, expect, it } from 'vitest'

import type { PaletteStateValues } from '@/core/constants'
import {
  createPaletteRefTarget,
  PALETTE_DEFAULTS,
  PALETTE_STATE_KEY_MAP,
  resetPaletteState,
} from '@/core/constants'

/** Create plain { value: number } wrappers — no Vue dependency needed. */
function makeRefs(
  values: Record<string, number>,
): { [K in keyof PaletteStateValues]: { value: number } } {
  return {
    bgPalette: { value: values.bgPalette ?? 0 },
    spritePalette: { value: values.spritePalette ?? 0 },
    backdropColor: { value: values.backdropColor ?? 0 },
    cgenMode: { value: values.cgenMode ?? 0 },
  }
}

describe('createPaletteRefTarget', () => {
  it('should create a target with all PaletteStateValues keys', () => {
    const refs = makeRefs({ bgPalette: 1, spritePalette: 2, backdropColor: 3, cgenMode: 0 })
    const target = createPaletteRefTarget(refs)

    expect(Object.keys(target).sort()).toEqual(
      ['backdropColor', 'bgPalette', 'cgenMode', 'spritePalette'],
    )
  })

  it('should make all properties enumerable', () => {
    const refs = makeRefs({ bgPalette: 1, spritePalette: 1, backdropColor: 0, cgenMode: 2 })
    const target = createPaletteRefTarget(refs)

    const descriptor = Object.getOwnPropertyDescriptor(target, 'bgPalette')
    expect(descriptor?.enumerable).toBe(true)
  })

  describe('getter behavior', () => {
    it('should read values from the underlying refs', () => {
      const refs = makeRefs({ bgPalette: 1, spritePalette: 2, backdropColor: 3, cgenMode: 4 })
      const target = createPaletteRefTarget(refs)

      expect(target.bgPalette).toEqual(1)
      expect(target.spritePalette).toEqual(2)
      expect(target.backdropColor).toEqual(3)
      expect(target.cgenMode).toEqual(4)
    })

    it('should reflect ref mutations immediately (live proxy)', () => {
      const refs = makeRefs({ bgPalette: 1, spritePalette: 1, backdropColor: 0, cgenMode: 2 })
      const target = createPaletteRefTarget(refs)

      expect(target.bgPalette).toEqual(1)

      // Mutate the underlying ref directly
      refs.bgPalette.value = 99
      expect(target.bgPalette).toEqual(99)
    })
  })

  describe('setter behavior', () => {
    it('should write values through to the underlying refs', () => {
      const refs = makeRefs({ bgPalette: 1, spritePalette: 1, backdropColor: 0, cgenMode: 2 })
      const target = createPaletteRefTarget(refs)

      target.bgPalette = 42
      target.spritePalette = 43
      target.backdropColor = 44
      target.cgenMode = 45

      expect(refs.bgPalette.value).toEqual(42)
      expect(refs.spritePalette.value).toEqual(43)
      expect(refs.backdropColor.value).toEqual(44)
      expect(refs.cgenMode.value).toEqual(45)
    })
  })

  describe('integration with resetPaletteState', () => {
    it('should reset all ref values to PALETTE_DEFAULTS via the proxy', () => {
      const refs = makeRefs({ bgPalette: 99, spritePalette: 99, backdropColor: 99, cgenMode: 99 })
      const target = createPaletteRefTarget(refs)

      resetPaletteState(target)

      // Verify the underlying refs were updated through the proxy
      for (const key of Object.keys(PALETTE_DEFAULTS) as (keyof typeof PALETTE_DEFAULTS)[]) {
        const camelKey = PALETTE_STATE_KEY_MAP[key]
        expect(refs[camelKey].value).toEqual(PALETTE_DEFAULTS[key])
      }
    })

    it('should round-trip: write via target, reset, then read defaults', () => {
      const refs = makeRefs({ bgPalette: 0, spritePalette: 0, backdropColor: 0, cgenMode: 0 })
      const target = createPaletteRefTarget(refs)

      // Write non-default values via the target proxy
      target.bgPalette = 99
      target.spritePalette = 99
      target.backdropColor = 99
      target.cgenMode = 99

      // Reset through the proxy
      resetPaletteState(target)

      // Read back — should be defaults
      expect(target.bgPalette).toEqual(PALETTE_DEFAULTS.BG_PALETTE)
      expect(target.spritePalette).toEqual(PALETTE_DEFAULTS.SPRITE_PALETTE)
      expect(target.backdropColor).toEqual(PALETTE_DEFAULTS.BACKDROP_COLOR)
      expect(target.cgenMode).toEqual(PALETTE_DEFAULTS.CGEN_MODE)
    })
  })

  describe('isolation', () => {
    it('should return a distinct object (not the refs input)', () => {
      const refs = makeRefs({ bgPalette: 1, spritePalette: 1, backdropColor: 0, cgenMode: 2 })
      const target = createPaletteRefTarget(refs)

      expect(target).not.toBe(refs)
    })

    it('should not share property descriptors across calls', () => {
      const refs1 = makeRefs({ bgPalette: 1, spritePalette: 1, backdropColor: 0, cgenMode: 2 })
      const refs2 = makeRefs({ bgPalette: 5, spritePalette: 5, backdropColor: 5, cgenMode: 5 })
      const target1 = createPaletteRefTarget(refs1)
      const target2 = createPaletteRefTarget(refs2)

      expect(target1.bgPalette).toEqual(1)
      expect(target2.bgPalette).toEqual(5)

      target1.bgPalette = 100
      expect(target1.bgPalette).toEqual(100)
      expect(target2.bgPalette).toEqual(5)
      expect(refs2.bgPalette.value).toEqual(5)
    })
  })
})
