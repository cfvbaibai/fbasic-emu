/**
 * CanvasScreenRenderer
 *
 * Renders the F-BASIC screen buffer to an HTML5 canvas element.
 * Used by the export runtime to display program output in standalone HTML.
 *
 * Each character cell is rendered as a colored backdrop rectangle
 * with the character drawn on top. The canvas uses 256x240 pixels
 * (F-BASIC sprite screen dimensions), and each text character occupies
 * an 8x8 pixel cell.
 */

import { SCREEN_DIMENSIONS } from '@/core/constants'
import type { ScreenCell } from '@/core/types/execution-types'

/** Default backdrop color for the canvas (black). */
const DEFAULT_BACKDROP_COLOR = '#000000'

/** Default text color for characters. */
const DEFAULT_TEXT_COLOR = '#FFFFFF'

/** Character cell dimensions in pixels. */
const CHAR_WIDTH = 8
const CHAR_HEIGHT = 8

/**
 * Minimal canvas context interface used by CanvasScreenRenderer.
 * Only the methods actually called by the renderer are required.
 * Uses (...args: unknown[]) for method signatures so that vitest
 * mocks satisfy the interface without type assertions.
 */
export interface CanvasRenderContext {
  fillStyle: string
  font: string
  textBaseline: string
  fillRect(...args: unknown[]): void
  fillText(...args: unknown[]): void
}

/**
 * Minimal canvas interface required by CanvasScreenRenderer.
 *
 * HTMLCanvasElement satisfies this interface. Tests can provide
 * a mock object implementing CanvasRenderContext without
 * needing the full CanvasRenderingContext2D surface.
 */
export interface CanvasSurface {
  readonly width: number
  readonly height: number
  getContext(contextId: '2d'): CanvasRenderContext | null
}

/**
 * Renders the F-BASIC screen buffer to an HTML5 canvas.
 *
 * Takes a canvas element and draws the full 28x24 text screen,
 * using 8x8 pixel cells for each character position.
 */
export class CanvasScreenRenderer {
  private readonly canvas: CanvasSurface

  constructor(canvas: CanvasSurface) {
    this.canvas = canvas
  }

  /**
   * Get the canvas surface.
   */
  getCanvas(): CanvasSurface {
    return this.canvas
  }

  /**
   * Clear the entire canvas to the default backdrop color (black).
   */
  clear(): void {
    const ctx = this.getContext()
    ctx.fillStyle = DEFAULT_BACKDROP_COLOR
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
  }

  /**
   * Render the full screen buffer to the canvas.
   *
   * First clears the canvas, then iterates over all 28x24 cells,
   * drawing a backdrop rectangle and the character text for each cell.
   *
   * @param screenBuffer - The 28x24 screen buffer from ScreenStateManager
   */
  render(screenBuffer: ScreenCell[][]): void {
    this.clear()

    const ctx = this.getContext()
    ctx.font = `${CHAR_HEIGHT}px monospace`
    ctx.textBaseline = 'top'

    const columns = SCREEN_DIMENSIONS.BACKGROUND.COLUMNS
    const lines = SCREEN_DIMENSIONS.BACKGROUND.LINES

    for (let y = 0; y < lines; y++) {
      const row = screenBuffer[y]
      if (!row) continue

      for (let x = 0; x < columns; x++) {
        const cell = row[x]
        if (!cell) continue

        const pixelX = x * CHAR_WIDTH
        const pixelY = y * CHAR_HEIGHT

        // Draw backdrop rectangle for each cell
        ctx.fillStyle = DEFAULT_BACKDROP_COLOR
        ctx.fillRect(pixelX, pixelY, CHAR_WIDTH, CHAR_HEIGHT)

        // Draw the character text
        ctx.fillStyle = DEFAULT_TEXT_COLOR
        ctx.fillText(cell.character, pixelX, pixelY)
      }
    }
  }

  /**
   * Get the 2D rendering context from the canvas.
   */
  private getContext(): CanvasRenderContext {
    const ctx = this.canvas.getContext('2d')
    if (!ctx) {
      throw new Error('CanvasScreenRenderer: could not get 2D context from canvas')
    }
    return ctx
  }
}
