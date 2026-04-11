/**
 * Focused unit tests for createPaletteRefTarget factory
 *
 * createPaletteRefTarget() is tested indirectly through 19 useBasicIdeExecution
 * integration tests. This file provides direct coverage of the getter/setter proxy
 * behavior to guard against regressions.
 *
 * @see src/core/constants.ts createPaletteRefTarget()
 * @see PR #558 review follow-up issue #559
 */

import { describe, expect, it } from 'vitest'

import {
  createPaletteRefTarget,
  PALETTE_DEFAULTS,
  PALETTE_STATE_KEY_MAP,
  type PaletteStateValues,
  resetPaletteState,
} from '@/core/constants'

/**
 * Helper: create plain ref-like objects ({ value: number }) for each palette key.
 */
function makeRefs(initial: Partial<PaletteStateValues> = {}): {
  [K in keyof PaletteStateValues]: { value: number }
} {
  return {
    bgPalette: { value: initial.bgPalette ?? PALETTE_DEFAULTS.BG_PALETTE },
    spritePalette: { value: initial.spritePalette ?? PALETTE_DEFAULTS.SPRITE_PALETTE },
    backdropColor: { value: initial.backdropColor ?? PALETTE_DEFAULTS.BACKDROP_COLOR },
    cgenMode: { value: initial.cgenMode ?? PALETTE_DEFAULTS.CGEN_MODE },
  }
}

describe('createPaletteRefTarget', () => {
  describe('getter proxy', () => {
    it('reads .value from the backing ref', () => {
      const refs = makeRefs({ bgPalette: 42 })
      const target = createPaletteRefTarget(refs)

      expect(target.bgPalette).toEqual(42)
    })

    it('reflects ref value changes after target creation', () => {
      const refs = makeRefs()
      const target = createPaletteRefTarget(refs)

      refs.backdropColor.value = 7

      expect(target.backdropColor).toEqual(7)
    })

    it('returns independent values for each property', () => {
      const refs = makeRefs({ bgPalette: 0, spritePalette: 2, backdropColor: 30, cgenMode: 3 })
      const target = createPaletteRefTarget(refs)

      expect(target.bgPalette).toEqual(0)
      expect(target.spritePalette).toEqual(2)
      expect(target.backdropColor).toEqual(30)
      expect(target.cgenMode).toEqual(3)
    })
  })

  describe('setter proxy', () => {
    it('writes .value on the backing ref', () => {
      const refs = makeRefs()
      const target = createPaletteRefTarget(refs)

      target.bgPalette = 99

      expect(refs.bgPalette.value).toEqual(99)
    })

    it('writes are visible through subsequent reads on the same target', () => {
      const refs = makeRefs()
      const target = createPaletteRefTarget(refs)

      target.cgenMode = 1
      target.spritePalette = 0

      expect(target.cgenMode).toEqual(1)
      expect(target.spritePalette).toEqual(0)
    })

    it('each setter writes to its own ref without cross-contamination', () => {
      const refs = makeRefs()
      const target = createPaletteRefTarget(refs)

      target.bgPalette = 10

      expect(refs.spritePalette.value).toEqual(PALETTE_DEFAULTS.SPRITE_PALETTE)
      expect(refs.backdropColor.value).toEqual(PALETTE_DEFAULTS.BACKDROP_COLOR)
      expect(refs.cgenMode.value).toEqual(PALETTE_DEFAULTS.CGEN_MODE)
    })
  })

  describe('enumerability', () => {
    it('makes all properties enumerable via Object.keys', () => {
      const refs = makeRefs()
      const target = createPaletteRefTarget(refs)

      const keys = Object.keys(target) as (keyof PaletteStateValues)[]

      expect(keys.sort()).toEqual(['backdropColor', 'bgPalette', 'cgenMode', 'spritePalette'])
    })

    it('includes all PALETTE_STATE_KEY_MAP values as enumerable keys', () => {
      const refs = makeRefs()
      const target = createPaletteRefTarget(refs)

      const expectedKeys = Object.values(PALETTE_STATE_KEY_MAP).sort()
      const actualKeys = Object.keys(target).sort()

      expect(actualKeys).toEqual(expectedKeys)
    })
  })

  describe('integration with resetPaletteState', () => {
    it('resetPaletteState restores defaults through the proxy', () => {
      const refs = makeRefs({ bgPalette: 99, spritePalette: 99, backdropColor: 99, cgenMode: 99 })
      const target = createPaletteRefTarget(refs)

      // Verify mutated state before reset
      expect(target.bgPalette).toEqual(99)
      expect(target.spritePalette).toEqual(99)

      resetPaletteState(target)

      // All refs should now hold default values
      expect(refs.bgPalette.value).toEqual(PALETTE_DEFAULTS.BG_PALETTE)
      expect(refs.spritePalette.value).toEqual(PALETTE_DEFAULTS.SPRITE_PALETTE)
      expect(refs.backdropColor.value).toEqual(PALETTE_DEFAULTS.BACKDROP_COLOR)
      expect(refs.cgenMode.value).toEqual(PALETTE_DEFAULTS.CGEN_MODE)
    })

    it('resetPaletteState values are visible through the target getter', () => {
      const refs = makeRefs({ backdropColor: 50 })
      const target = createPaletteRefTarget(refs)

      resetPaletteState(target)

      expect(target.bgPalette).toEqual(PALETTE_DEFAULTS.BG_PALETTE)
      expect(target.spritePalette).toEqual(PALETTE_DEFAULTS.SPRITE_PALETTE)
      expect(target.backdropColor).toEqual(PALETTE_DEFAULTS.BACKDROP_COLOR)
      expect(target.cgenMode).toEqual(PALETTE_DEFAULTS.CGEN_MODE)
    })
  })

})
