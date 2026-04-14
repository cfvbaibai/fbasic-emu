/**
 * Tests for CanvasScreenRenderer
 *
 * Verifies canvas-based screen rendering for the export runtime.
 * Uses a mock canvas (plain object with spy methods) since tests
 * run in Node environment without a real DOM.
 */

import { describe, expect, it, type MockedFunction, vi } from 'vitest'

import { SCREEN_DIMENSIONS } from '@/core/constants'
import type { CanvasSurface } from '@/core/devices/CanvasScreenRenderer'
import { CanvasScreenRenderer } from '@/core/devices/CanvasScreenRenderer'
import type { ScreenCell } from '@/core/types/execution-types'

// ============================================================================
// Mock Canvas Types & Factory
// ============================================================================

/** Mock context methods used by the renderer. */
type MockCtx = {
  fillRect: MockedFunction<(...args: unknown[]) => void>
  fillText: MockedFunction<(...args: unknown[]) => void>
  measureText: MockedFunction<(...args: unknown[]) => { width: number }>
  fillStyle: string
  font: string
  textBaseline: string
}

/** Creates a mock canvas and context for testing. */
function createMockContext(): { ctx: MockCtx; canvas: CanvasSurface } {
  const ctx: MockCtx = {
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
// Helpers
// ============================================================================

/** Creates a 28x24 screen buffer filled with spaces. */
function createEmptyBuffer(): ScreenCell[][] {
  const buffer: ScreenCell[][] = []
  for (let y = 0; y < SCREEN_DIMENSIONS.BACKGROUND.LINES; y++) {
    const row: ScreenCell[] = []
    for (let x = 0; x < SCREEN_DIMENSIONS.BACKGROUND.COLUMNS; x++) {
      row.push({ character: ' ', colorPattern: 0, x, y })
    }
    buffer.push(row)
  }
  return buffer
}

/** Sets a character at a specific position in the buffer. */
function setChar(
  buffer: ScreenCell[][],
  x: number,
  y: number,
  char: string,
  colorPattern = 0,
): void {
  if (buffer[y]?.[x]) {
    buffer[y][x].character = char
    buffer[y][x].colorPattern = colorPattern
  }
}

// ============================================================================
// Tests
// ============================================================================

describe('CanvasScreenRenderer', () => {
  describe('constructor', () => {
    it('stores a reference to the canvas element', () => {
      const { canvas } = createMockContext()
      const renderer = new CanvasScreenRenderer(canvas)
      expect(renderer.getCanvas()).toEqual(canvas)
    })
  })

  describe('clear', () => {
    it('fills the entire canvas with black', () => {
      const { ctx, canvas } = createMockContext()
      const renderer = new CanvasScreenRenderer(canvas)

      renderer.clear()

      expect(ctx.fillStyle).toEqual('#000000')
      expect(ctx.fillRect).toHaveBeenCalledWith(
        0,
        0,
        SCREEN_DIMENSIONS.SPRITE.WIDTH,
        SCREEN_DIMENSIONS.SPRITE.HEIGHT,
      )
    })
  })

  describe('render', () => {
    it('sets the font to an 8px monospace font', () => {
      const { ctx, canvas } = createMockContext()
      const renderer = new CanvasScreenRenderer(canvas)
      const buffer = createEmptyBuffer()

      renderer.render(buffer)

      expect(ctx.font).toEqual('8px monospace')
    })

    it('draws each character in the screen buffer using fillText', () => {
      const { ctx, canvas } = createMockContext()
      const renderer = new CanvasScreenRenderer(canvas)
      const buffer = createEmptyBuffer()
      setChar(buffer, 0, 0, 'H')
      setChar(buffer, 1, 0, 'I')

      renderer.render(buffer)

      // Each character is 8px wide; textBaseline is 'top' so y = row * 8
      expect(ctx.fillText).toHaveBeenCalledWith('H', 0, 0)
      expect(ctx.fillText).toHaveBeenCalledWith('I', 8, 0)
    })

    it('positions characters at correct pixel coordinates based on grid position', () => {
      const { ctx, canvas } = createMockContext()
      const renderer = new CanvasScreenRenderer(canvas)
      const buffer = createEmptyBuffer()
      setChar(buffer, 5, 3, 'X')

      renderer.render(buffer)

      // Column 5 * 8px = 40px x, Row 3 * 8px = 24px y (textBaseline 'top')
      expect(ctx.fillText).toHaveBeenCalledWith('X', 40, 24)
    })

    it('draws a backdrop rectangle for non-space characters', () => {
      const { ctx, canvas } = createMockContext()
      const renderer = new CanvasScreenRenderer(canvas)
      const buffer = createEmptyBuffer()
      setChar(buffer, 2, 1, 'A')

      renderer.render(buffer)

      // Backdrop rectangle at position (2*8, 1*8) with size 8x8
      expect(ctx.fillRect).toHaveBeenCalledWith(16, 8, 8, 8)
    })

    it('uses white color for the character text by default', () => {
      const { ctx, canvas } = createMockContext()
      const renderer = new CanvasScreenRenderer(canvas)
      const buffer = createEmptyBuffer()
      setChar(buffer, 0, 0, 'T')

      renderer.render(buffer)

      // fillText for 'T' is called at (0, 0) with textBaseline 'top'
      expect(ctx.fillText).toHaveBeenCalledWith('T', 0, 0)
    })

    it('renders all 28x24 cells including empty ones', () => {
      const { ctx, canvas } = createMockContext()
      const renderer = new CanvasScreenRenderer(canvas)
      const buffer = createEmptyBuffer()

      renderer.render(buffer)

      // 28 columns * 24 rows = 672 fillText calls (even for spaces)
      const textCalls = ctx.fillText.mock.calls.filter(
        (call: unknown[]) => typeof call[0] === 'string',
      )
      expect(textCalls).toHaveLength(672)
    })

    it('clears the canvas before rendering', () => {
      const { ctx, canvas } = createMockContext()
      const renderer = new CanvasScreenRenderer(canvas)
      const buffer = createEmptyBuffer()

      renderer.render(buffer)

      // The first fillRect should be the full-canvas clear (black fill)
      expect(ctx.fillRect).toHaveBeenNthCalledWith(
        1,
        0,
        0,
        SCREEN_DIMENSIONS.SPRITE.WIDTH,
        SCREEN_DIMENSIONS.SPRITE.HEIGHT,
      )
    })
  })

  describe('getCanvas', () => {
    it('returns the canvas element passed to the constructor', () => {
      const { canvas } = createMockContext()
      const renderer = new CanvasScreenRenderer(canvas)
      expect(renderer.getCanvas()).toEqual(canvas)
    })
  })
})
