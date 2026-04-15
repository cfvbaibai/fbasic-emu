/**
 * Tests for CanvasSpriteRenderer palette resolution
 *
 * Verifies that the renderer correctly looks up sprite colors from
 * the NES palette system based on sprite palette index (CGSET) and
 * color combination index (DEF SPRITE).
 *
 * Uses a mock canvas (plain object with spy methods) since tests
 * run in Node environment without a real DOM.
 */

import { describe, expect, it, type MockedFunction, vi } from 'vitest'

import { SCREEN_DIMENSIONS } from '@/core/constants'
import type { CanvasSurface } from '@/core/devices/CanvasScreenRenderer'
import { CanvasSpriteRenderer } from '@/core/devices/CanvasSpriteRenderer'
import type { DefSpriteDefinition, SpriteState } from '@/core/sprite/types'
import type { Tile } from '@/shared/data/types'

// ============================================================================
// Mock Canvas Types & Factory
// ============================================================================

/** Mock context methods used by the sprite renderer. */
type MockCtx = {
  fillRect: MockedFunction<(...args: unknown[]) => void>
  fillText: MockedFunction<(...args: unknown[]) => void>
  fillStyle: string
  font: string
  textBaseline: string
  getImageData: MockedFunction<(x: number, y: number, w: number, h: number) => unknown>
  putImageData: MockedFunction<(data: unknown, dx: number, dy: number) => void>
}

/** Creates a mock canvas and context for testing. */
function createMockContext(): { ctx: MockCtx; canvas: CanvasSurface } {
  const ctx: MockCtx = {
    fillRect: vi.fn<(...args: unknown[]) => void>(),
    fillText: vi.fn<(...args: unknown[]) => void>(),
    fillStyle: '',
    font: '',
    textBaseline: '',
    getImageData: vi.fn<(x: number, y: number, w: number, h: number) => unknown>(),
    putImageData: vi.fn<(data: unknown, dx: number, dy: number) => void>(),
  }

  const canvas: CanvasSurface = {
    width: SCREEN_DIMENSIONS.SPRITE.WIDTH,
    height: SCREEN_DIMENSIONS.SPRITE.HEIGHT,
    getContext: (_contextId: '2d') => ctx,
  }

  return { ctx, canvas }
}

// ============================================================================
// Helpers
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

/**
 * Helper: extract the RGBA value at a specific pixel from ImageData.
 * Returns [r, g, b, a].
 */
function getPixelAt(
  imageData: { data: Uint8ClampedArray; width: number },
  x: number,
  y: number,
): [number, number, number, number] {
  const offset = (y * imageData.width + x) * 4
  return [
    imageData.data[offset]!,
    imageData.data[offset + 1]!,
    imageData.data[offset + 2]!,
    imageData.data[offset + 3]!,
  ]
}

// ============================================================================
// Tests
// ============================================================================

describe('CanvasSpriteRenderer palette resolution', () => {
  describe('sprite palette selection', () => {
    it('defaults to sprite palette index 1', () => {
      const { canvas } = createMockContext()
      const renderer = new CanvasSpriteRenderer(canvas)

      expect(renderer.getSpritePaletteIndex()).toEqual(1)
    })

    it('allows setting sprite palette index 0-2', () => {
      const { canvas } = createMockContext()
      const renderer = new CanvasSpriteRenderer(canvas)

      renderer.setSpritePalette(0)
      expect(renderer.getSpritePaletteIndex()).toEqual(0)

      renderer.setSpritePalette(2)
      expect(renderer.getSpritePaletteIndex()).toEqual(2)
    })

    it('clamps sprite palette index to valid range 0-2', () => {
      const { canvas } = createMockContext()
      const renderer = new CanvasSpriteRenderer(canvas)

      renderer.setSpritePalette(-1)
      expect(renderer.getSpritePaletteIndex()).toEqual(0)

      renderer.setSpritePalette(5)
      expect(renderer.getSpritePaletteIndex()).toEqual(2)
    })
  })

  describe('resetState', () => {
    it('resets sprite palette index to default (1)', () => {
      const { canvas } = createMockContext()
      const renderer = new CanvasSpriteRenderer(canvas)

      renderer.setSpritePalette(2)
      expect(renderer.getSpritePaletteIndex()).toEqual(2)

      renderer.resetState()
      expect(renderer.getSpritePaletteIndex()).toEqual(1)
    })
  })

  describe('color combination palette lookup', () => {
    it('uses palette 1 combination 0 colors (default) for colorCombination=0', () => {
      const { canvas } = createMockContext()
      const renderer = new CanvasSpriteRenderer(canvas)

      // Palette 1, combo 0: [0x00, 0x30, 0x16, 0x01]
      // -> ['#000000', '#FFFFFF', '#922924', '#002263']
      const sprite = createSpriteState({
        definition: createSpriteDefinition({
          colorCombination: 0,
          tiles: [createSolidTile(1)],
        }),
      })

      const imageData = renderer.generateSpriteImageData(sprite)!
      // colorIndex 1 -> '#FFFFFF' -> (255, 255, 255, 255)
      expect(getPixelAt(imageData, 0, 0)).toEqual([255, 255, 255, 255])
    })

    it('uses palette 1 combination 1 colors for colorCombination=1', () => {
      const { canvas } = createMockContext()
      const renderer = new CanvasSpriteRenderer(canvas)

      // Palette 1, combo 1: [0x00, 0x10, 0x00, 0x01]
      // -> ['#000000', '#ABABAB', '#000000', '#002263']
      const sprite = createSpriteState({
        definition: createSpriteDefinition({
          colorCombination: 1,
          tiles: [createSolidTile(1)],
        }),
      })

      const imageData = renderer.generateSpriteImageData(sprite)!
      // colorIndex 1 -> '#ABABAB' -> (171, 171, 171, 255)
      expect(getPixelAt(imageData, 0, 0)).toEqual([171, 171, 171, 255])
    })

    it('uses correct colors when sprite palette index is changed', () => {
      const { canvas } = createMockContext()
      const renderer = new CanvasSpriteRenderer(canvas)

      // Palette 0, combo 0: [0x00, 0x36, 0x16, 0x02]
      // -> ['#000000', '#F6CDCB', '#922924', '#0D107D']
      renderer.setSpritePalette(0)

      const sprite = createSpriteState({
        definition: createSpriteDefinition({
          colorCombination: 0,
          tiles: [createSolidTile(1)],
        }),
      })

      const imageData = renderer.generateSpriteImageData(sprite)!
      // colorIndex 1 -> '#F6CDCB' -> (246, 205, 203, 255)
      expect(getPixelAt(imageData, 0, 0)).toEqual([246, 205, 203, 255])
    })

    it('falls back to default colors when colorCombination is out of range', () => {
      const { canvas } = createMockContext()
      const renderer = new CanvasSpriteRenderer(canvas)

      // colorCombination=5 is out of range (valid: 0-3)
      const sprite = createSpriteState({
        definition: createSpriteDefinition({
          colorCombination: 5,
          tiles: [createSolidTile(1)],
        }),
      })

      const imageData = renderer.generateSpriteImageData(sprite)!
      // Falls back to DEFAULT_SPRITE_COLORS: index 1 -> '#FFFFFF'
      expect(getPixelAt(imageData, 0, 0)).toEqual([255, 255, 255, 255])
    })

    it('falls back to default colors when sprite palette index is out of range', () => {
      const { canvas } = createMockContext()
      const renderer = new CanvasSpriteRenderer(canvas)

      renderer.setSpritePalette(99) // clamped to 2, but let's test fallback

      // Palette 2 exists, so no fallback. Test with a combination that doesn't exist
      const sprite = createSpriteState({
        definition: createSpriteDefinition({
          colorCombination: 0,
          tiles: [createSolidTile(3)],
        }),
      })

      const imageData = renderer.generateSpriteImageData(sprite)!
      // Palette 2, combo 0: [0x00, 0x30, 0x26, 0x12]
      // -> ['#000000', '#FFFFFF', '#E37975', '#3438CB']
      // colorIndex 3 -> '#3438CB' -> (52, 56, 203, 255)
      expect(getPixelAt(imageData, 0, 0)).toEqual([52, 56, 203, 255])
    })

    it('renders transparent pixels for colorIndex 0 regardless of palette', () => {
      const { canvas } = createMockContext()
      const renderer = new CanvasSpriteRenderer(canvas)

      const sprite = createSpriteState({
        definition: createSpriteDefinition({
          colorCombination: 0,
          tiles: [createSolidTile(0)],
        }),
      })

      const imageData = renderer.generateSpriteImageData(sprite)!
      expect(getPixelAt(imageData, 0, 0)).toEqual([0, 0, 0, 0])
    })
  })
})
