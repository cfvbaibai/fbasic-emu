/**
 * Canvas2D background renderer - Much faster than Konva for static text grid
 * Renders 28×24 character grid using direct Canvas2D drawImage() calls
 * 10-50x faster than Konva for this use case
 */

import type { ScreenCell } from '@/core/types/execution-types'
import { BACKGROUND_PALETTES, COLORS } from '@/shared/data/palette'
import { getBackgroundItemByChar, getCharacterByCode } from '@/shared/utils/backgroundLookup'

const CELL_SIZE = 8 // 8×8 pixels per character cell
const COLS = 28 // Background screen: 28 columns
const ROWS = 24 // Background screen: 24 rows
const BG_OFFSET_X = 2 * CELL_SIZE // 16 pixels (2 columns offset)
const BG_OFFSET_Y = 3 * CELL_SIZE // 24 pixels (3 rows offset)

/**
 * Cache for background tile canvases (HTMLCanvasElement)
 * Key: `${character}-${colorPattern}-${paletteCode}`
 */
const backgroundTileImageCache = new Map<string, HTMLCanvasElement>()

/**
 * Create background tile canvas from character and color pattern
 * Returns HTMLCanvasElement for direct drawImage() calls
 */
function createBackgroundTileImage(
  character: string,
  colorPattern: number,
  paletteCode: number
): HTMLCanvasElement {
  const cacheKey = `${character}-${colorPattern}-${paletteCode}`

  if (backgroundTileImageCache.has(cacheKey)) {
    return backgroundTileImageCache.get(cacheKey)!
  }

  // Lookup background item
  const bgItem = getBackgroundItemByChar(character)

  // Get color combination from palette
  const palette = BACKGROUND_PALETTES[paletteCode] ?? BACKGROUND_PALETTES[1]
  const colorCombination = palette[colorPattern] ?? palette[0]

  // Create canvas to render tile
  const canvas = document.createElement('canvas')
  canvas.width = CELL_SIZE
  canvas.height = CELL_SIZE
  const ctx = canvas.getContext('2d', { alpha: true })
  if (!ctx) throw new Error('Failed to get canvas context')

  // Use ImageData for faster pixel rendering
  const imageData = ctx.createImageData(CELL_SIZE, CELL_SIZE)
  const data = imageData.data

  if (!bgItem) {
    // Space or unknown character - fill with background color
    const bgColorIndex = colorCombination[0] ?? 0
    const bgColor = COLORS[bgColorIndex] ?? COLORS[0] ?? '#000000'

    // Parse hex color to RGB
    const r = parseInt(bgColor.slice(1, 3), 16)
    const g = parseInt(bgColor.slice(3, 5), 16)
    const b = parseInt(bgColor.slice(5, 7), 16)

    // Fill all pixels with background color
    for (let i = 0; i < data.length; i += 4) {
      data[i] = r // R
      data[i + 1] = g // G
      data[i + 2] = b // B
      data[i + 3] = 255 // A (opaque)
    }
  } else {
    // Render tile pixels using ImageData
    const tile = bgItem.tile

    for (let row = 0; row < CELL_SIZE; row++) {
      const tileRow = tile[row]
      if (!tileRow) continue

      for (let col = 0; col < CELL_SIZE; col++) {
        const pixelValue = tileRow[col] ?? 0

        // Map tile value (0-3) to color combination index
        const colorIndex = colorCombination[pixelValue] ?? colorCombination[0] ?? 0
        const color = COLORS[colorIndex] ?? COLORS[0] ?? '#000000'

        // Parse hex color to RGB
        const r = parseInt(color.slice(1, 3), 16)
        const g = parseInt(color.slice(3, 5), 16)
        const b = parseInt(color.slice(5, 7), 16)

        // Set pixel in ImageData
        const pixelIndex = (row * CELL_SIZE + col) * 4
        data[pixelIndex] = r // R
        data[pixelIndex + 1] = g // G
        data[pixelIndex + 2] = b // B
        data[pixelIndex + 3] = 255 // A (opaque)
      }
    }
  }

  // Put ImageData to canvas
  ctx.putImageData(imageData, 0, 0)

  // Cache the canvas
  backgroundTileImageCache.set(cacheKey, canvas)

  return canvas
}

/**
 * Render entire background grid to canvas (full redraw)
 * Uses direct Canvas2D drawImage() - much faster than Konva
 */
export function renderBackgroundToCanvas(
  canvas: HTMLCanvasElement,
  buffer: ScreenCell[][],
  paletteCode: number
): void {
  const ctx = canvas.getContext('2d', { alpha: false })
  if (!ctx) return

  // Clear canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  // Render all cells
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const cell = buffer[y]?.[x]
      const character = cell?.character ?? ' '
      const colorPattern = cell?.colorPattern ?? 0

      // Get cached tile
      const tileCanvas = createBackgroundTileImage(character, colorPattern, paletteCode)

      // Direct blit - very fast!
      ctx.drawImage(tileCanvas, BG_OFFSET_X + x * CELL_SIZE, BG_OFFSET_Y + y * CELL_SIZE)
    }
  }
}

/**
 * Render only changed cells to canvas (dirty rendering)
 * Only redraws cells where character or colorPattern changed
 */
export function renderBackgroundToCanvasDirty(
  canvas: HTMLCanvasElement,
  buffer: ScreenCell[][],
  lastBuffer: ScreenCell[][] | null,
  paletteCode: number
): void {
  if (!lastBuffer) {
    renderBackgroundToCanvas(canvas, buffer, paletteCode)
    return
  }

  const ctx = canvas.getContext('2d', { alpha: false })
  if (!ctx) return

  // Only redraw changed cells
  let _changedCount = 0
  for (let y = 0; y < ROWS; y++) {
    for (let x = 0; x < COLS; x++) {
      const cell = buffer[y]?.[x]
      const lastCell = lastBuffer[y]?.[x]

      const char = cell?.character ?? ' '
      const pattern = cell?.colorPattern ?? 0
      const lastChar = lastCell?.character ?? ' '
      const lastPattern = lastCell?.colorPattern ?? 0

      if (char !== lastChar || pattern !== lastPattern) {
        const tileCanvas = createBackgroundTileImage(char, pattern, paletteCode)

        // Direct blit of changed cell
        ctx.drawImage(tileCanvas, BG_OFFSET_X + x * CELL_SIZE, BG_OFFSET_Y + y * CELL_SIZE)
        _changedCount++
      }
    }
  }

  // If more than half the cells changed, consider full redraw next time
  // (but this function already handled it efficiently)
}

/**
 * Pre-initialize tile cache (same as Konva version)
 */
export async function preInitializeBackgroundTiles(): Promise<void> {
  if (backgroundTileImageCache.size > 500) {
    return Promise.resolve()
  }

  const paletteCodes = [0, 1]
  const colorPatterns = [0, 1, 2, 3]

  for (let code = 0; code <= 255; code++) {
    const char = getCharacterByCode(code) ?? String.fromCharCode(code)

    for (const paletteCode of paletteCodes) {
      for (const colorPattern of colorPatterns) {
        const cacheKey = `${char}-${colorPattern}-${paletteCode}`
        if (!backgroundTileImageCache.has(cacheKey)) {
          createBackgroundTileImage(char, colorPattern, paletteCode)
        }
      }
    }

    // Yield to event loop every 10 characters
    if (code > 0 && code % 10 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0))
    }
  }
}

/**
 * Clear tile cache
 */
export function clearBackgroundTileCache(): void {
  backgroundTileImageCache.clear()
}
