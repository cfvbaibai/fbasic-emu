/**
 * Tests for CanvasSpriteRenderer
 *
 * Verifies canvas-based sprite rendering for the export runtime.
 * Uses a mock canvas (plain object with spy methods) since tests
 * run in Node environment without a real DOM.
 */

import { describe, expect, it, type MockedFunction, vi } from 'vitest'

import { SCREEN_DIMENSIONS } from '@/core/constants'
import type { CanvasSurface } from '@/core/devices/CanvasScreenRenderer'
import { CanvasSpriteRenderer } from '@/core/devices/CanvasSpriteRenderer'
import type { Tile } from '@/shared/data/types'

import {
  createSolidTile,
  createSpriteDefinition,
  createSpriteState,
} from '../helpers/spriteTestFixtures'
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

/** Creates a tile with a specific pattern (checkerboard of 0 and 1). */
function createCheckerTile(): Tile {
  return Array.from({ length: 8 }, (_, y) =>
    Array.from({ length: 8 }, (_, x) => (x + y) % 2),
  )
}

// ============================================================================
// Tests
// ============================================================================

describe('CanvasSpriteRenderer', () => {
  describe('constructor', () => {
    it('stores a reference to the canvas', () => {
      const { canvas } = createMockContext()
      const renderer = new CanvasSpriteRenderer(canvas)
      expect(renderer.getCanvas()).toEqual(canvas)
    })
  })

  describe('renderSprites', () => {
    it('does not draw anything when no sprites are visible', () => {
      const { ctx, canvas } = createMockContext()
      const renderer = new CanvasSpriteRenderer(canvas)

      renderer.renderSprites([])

      expect(ctx.putImageData).not.toHaveBeenCalled()
    })

    it('renders a single visible 8x8 sprite at its position', () => {
      const { ctx, canvas } = createMockContext()
      const renderer = new CanvasSpriteRenderer(canvas)
      renderer.setSpriteEnabled(true)

      const sprite = createSpriteState({
        spriteNumber: 0,
        x: 10,
        y: 20,
        visible: true,
        definition: createSpriteDefinition({
          spriteNumber: 0,
          size: 0,
          colorCombination: 0,
          tiles: [createSolidTile(1)],
        }),
      })

      renderer.renderSprites([sprite])

      expect(ctx.putImageData).toHaveBeenCalled()
      // putImageData should be called at the sprite's position (10, 20)
      const callArgs = ctx.putImageData.mock.calls[0]!
      expect(callArgs[1]).toEqual(10) // dx
      expect(callArgs[2]).toEqual(20) // dy
    })

    it('renders a 16x16 sprite using 4 tiles in 2x2 arrangement', () => {
      const { ctx, canvas } = createMockContext()
      const renderer = new CanvasSpriteRenderer(canvas)
      renderer.setSpriteEnabled(true)

      const tile1 = createSolidTile(1)
      const tile2 = createSolidTile(2)
      const tile3 = createSolidTile(3)
      const tile4 = createCheckerTile()

      const sprite = createSpriteState({
        spriteNumber: 0,
        x: 5,
        y: 10,
        visible: true,
        definition: createSpriteDefinition({
          spriteNumber: 0,
          size: 1,
          tiles: [tile1, tile2, tile3, tile4],
        }),
      })

      renderer.renderSprites([sprite])

      expect(ctx.putImageData).toHaveBeenCalled()
      // For a 16x16 sprite, putImageData should be called once at (5, 10)
      const callArgs = ctx.putImageData.mock.calls[0]!
      expect(callArgs[1]).toEqual(5) // dx
      expect(callArgs[2]).toEqual(10) // dy
    })

    it('does not render sprites that are not visible', () => {
      const { ctx, canvas } = createMockContext()
      const renderer = new CanvasSpriteRenderer(canvas)

      const sprite = createSpriteState({
        visible: false,
      })

      renderer.renderSprites([sprite])

      expect(ctx.putImageData).not.toHaveBeenCalled()
    })

    it('does not render sprites without a definition', () => {
      const { ctx, canvas } = createMockContext()
      const renderer = new CanvasSpriteRenderer(canvas)

      const sprite = createSpriteState({
        definition: null,
      })

      renderer.renderSprites([sprite])

      expect(ctx.putImageData).not.toHaveBeenCalled()
    })

    it('renders multiple visible sprites', () => {
      const { ctx, canvas } = createMockContext()
      const renderer = new CanvasSpriteRenderer(canvas)
      renderer.setSpriteEnabled(true)

      const sprite0 = createSpriteState({
        spriteNumber: 0,
        x: 10,
        y: 20,
      })
      const sprite1 = createSpriteState({
        spriteNumber: 1,
        x: 50,
        y: 60,
        definition: createSpriteDefinition({ spriteNumber: 1, tiles: [createCheckerTile()] }),
      })

      renderer.renderSprites([sprite0, sprite1])

      expect(ctx.putImageData).toHaveBeenCalledTimes(2)
    })

    it('skips sprites with no definition among visible sprites', () => {
      const { ctx, canvas } = createMockContext()
      const renderer = new CanvasSpriteRenderer(canvas)
      renderer.setSpriteEnabled(true)

      const sprite0 = createSpriteState({ visible: true, definition: null })
      const sprite1 = createSpriteState({ spriteNumber: 1, visible: true })

      renderer.renderSprites([sprite0, sprite1])

      expect(ctx.putImageData).toHaveBeenCalledTimes(1)
    })
  })

  describe('sprite enable/disable', () => {
    it('does not render when sprite display is disabled', () => {
      const { ctx, canvas } = createMockContext()
      const renderer = new CanvasSpriteRenderer(canvas)

      renderer.setSpriteEnabled(false)

      const sprite = createSpriteState()
      renderer.renderSprites([sprite])

      expect(ctx.putImageData).not.toHaveBeenCalled()
    })

    it('renders when sprite display is enabled', () => {
      const { ctx, canvas } = createMockContext()
      const renderer = new CanvasSpriteRenderer(canvas)

      renderer.setSpriteEnabled(true)

      const sprite = createSpriteState()
      renderer.renderSprites([sprite])

      expect(ctx.putImageData).toHaveBeenCalledTimes(1)
    })

    it('isSpriteEnabled returns current state', () => {
      const { canvas } = createMockContext()
      const renderer = new CanvasSpriteRenderer(canvas)

      expect(renderer.isSpriteEnabled()).toEqual(false)

      renderer.setSpriteEnabled(true)
      expect(renderer.isSpriteEnabled()).toEqual(true)

      renderer.setSpriteEnabled(false)
      expect(renderer.isSpriteEnabled()).toEqual(false)
    })
  })

  describe('pixel data generation', () => {
    it('generates correct pixel data for 8x8 sprite with solid color', () => {
      const { canvas } = createMockContext()
      const renderer = new CanvasSpriteRenderer(canvas)

      const sprite = createSpriteState({
        definition: createSpriteDefinition({
          tiles: [createSolidTile(2)],
        }),
      })

      const imageData = renderer.generateSpriteImageData(sprite)

      // Should produce an ImageData-like object with width 8, height 8
      expect(imageData).not.toBeNull()
      expect(imageData!.width).toEqual(8)
      expect(imageData!.height).toEqual(8)
      expect(imageData!.data.length).toEqual(8 * 8 * 4) // 256 RGBA values
    })

    it('generates correct pixel data for 16x16 sprite', () => {
      const { canvas } = createMockContext()
      const renderer = new CanvasSpriteRenderer(canvas)

      const sprite = createSpriteState({
        definition: createSpriteDefinition({
          size: 1,
          tiles: [
            createSolidTile(0), createSolidTile(1),
            createSolidTile(2), createSolidTile(3),
          ],
        }),
      })

      const imageData = renderer.generateSpriteImageData(sprite)

      expect(imageData).not.toBeNull()
      expect(imageData!.width).toEqual(16)
      expect(imageData!.height).toEqual(16)
      expect(imageData!.data.length).toEqual(16 * 16 * 4) // 1024 RGBA values
    })

    it('returns null for sprite without definition', () => {
      const { canvas } = createMockContext()
      const renderer = new CanvasSpriteRenderer(canvas)

      const sprite = createSpriteState({ definition: null })
      expect(renderer.generateSpriteImageData(sprite)).toBeNull()
    })

    it('returns null for invisible sprite', () => {
      const { canvas } = createMockContext()
      const renderer = new CanvasSpriteRenderer(canvas)

      const sprite = createSpriteState({ visible: false })
      expect(renderer.generateSpriteImageData(sprite)).toBeNull()
    })
  })

  describe('resetState', () => {
    it('clears all internal state and disables sprites', () => {
      const { canvas } = createMockContext()
      const renderer = new CanvasSpriteRenderer(canvas)

      renderer.setSpriteEnabled(true)
      renderer.resetState()

      expect(renderer.isSpriteEnabled()).toEqual(false)
    }
    )
  })
})
