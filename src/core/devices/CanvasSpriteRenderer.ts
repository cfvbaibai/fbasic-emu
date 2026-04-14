/**
 * CanvasSpriteRenderer
 *
 * Renders F-BASIC sprites to an HTML5 canvas element for the export runtime.
 * Uses pixel-level ImageData manipulation to draw sprite tiles with their
 * color combination palette onto the canvas.
 *
 * Each sprite is defined by DEF SPRITE and displayed via SPRITE commands.
 * Sprites use 4-color palettes (color combinations) where each pixel in a
 * tile is an index (0-3) into the palette. Index 0 is transparent.
 *
 * Supports both 8x8 (1 tile) and 16x16 (4 tiles in 2x2 arrangement) sprites.
 */

import type { SpriteState } from '@/core/sprite/types'
import { COLORS, ORIGINAL_SPRITE_PALETTES } from '@/shared/data/palette'

import type { CanvasSurface } from './CanvasScreenRenderer'

/** Number of color indices in a sprite palette (0=transparent, 1-3=colors). */
const PALETTE_SIZE = 4

/** Default sprite palette index (CGSET default). */
const DEFAULT_SPRITE_PALETTE_INDEX = 1
/** Default sprite palette colors (NES-like: black, white, red, cyan). */
const DEFAULT_SPRITE_COLORS: ReadonlyArray<string> = [
  '#000000', // index 0: black (used for transparent via alpha=0)
  '#FFFFFF', // index 1: white
  '#FF0000', // index 2: red
  '#00FFFF', // index 3: cyan
]

/**
 * Resolve a color combination from the sprite palette data.
 *
 * Looks up the palette at `paletteIndex`, then the combination at
 * `combinationIndex` within that palette, and maps each NES color
 * code through the COLORS table to a hex string.
 *
 * @param paletteIndex - Sprite palette index (0-2, set by CGSET)
 * @param combinationIndex - Color combination index (0-3, from DEF SPRITE)
 * @returns Array of 4 hex color strings, or DEFAULT_SPRITE_COLORS as fallback
 */
function resolveSpritePalette(
  paletteIndex: number,
  combinationIndex: number,
): ReadonlyArray<string> {
  const palette = ORIGINAL_SPRITE_PALETTES[paletteIndex]
  if (!palette) return DEFAULT_SPRITE_COLORS

  const combination = palette[combinationIndex]
  if (!combination) return DEFAULT_SPRITE_COLORS

  return combination.map(code => COLORS[code] ?? COLORS[0] ?? '#000000')
}
/** Width of a single tile in pixels. */
const TILE_WIDTH = 8

/** Height of a single tile in pixels. */
const TILE_HEIGHT = 8

/**
 * Minimal canvas context interface for sprite rendering.
 * Only the methods actually called by the sprite renderer are required.
 * Uses (...args: unknown[]) so vitest mocks satisfy the interface.
 */
interface SpriteRenderContext {
  putImageData(...args: unknown[]): void
}

/**
 * Minimal ImageData-like interface for sprite pixel data.
 * Matches the structure of canvas ImageData but can be created
 * without a real canvas context (for testing and export runtime).
 */
export interface SpriteImageData {
  width: number
  height: number
  data: Uint8ClampedArray
}

/**
 * Renders F-BASIC sprites to an HTML5 canvas.
 *
 * Takes a canvas element and draws sprites using putImageData
 * for pixel-accurate rendering. Coordinates with the screen
 * renderer (CanvasScreenRenderer) which draws the text layer.
 *
 * Sprites are drawn using the DEF SPRITE tile data (number[][]
 * arrays of color indices) mapped through a 4-color palette.
 */
export class CanvasSpriteRenderer {
  private readonly canvas: CanvasSurface
  private spriteEnabled = false
  private spritePaletteIndex = DEFAULT_SPRITE_PALETTE_INDEX

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
   * Get the 2D context for sprite rendering operations.
   */
  private getContext(): SpriteRenderContext | null {
    return this.canvas.getContext('2d') as SpriteRenderContext | null
  }

  /**
   * Enable or disable sprite display.
   * When disabled, renderSprites is a no-op.
   */
  setSpriteEnabled(enabled: boolean): void {
    this.spriteEnabled = enabled
  }

  /**
   * Check if sprite display is enabled.
   */
  isSpriteEnabled(): boolean {
    return this.spriteEnabled
  }

  /**
   * Set the active sprite palette index (0-2).
   * Set by CGSET to select which sprite palette group to use.
   */
  setSpritePalette(index: number): void {
    this.spritePaletteIndex = Math.max(0, Math.min(2, index))
  }

  /**
   * Get the current sprite palette index.
   */
  getSpritePaletteIndex(): number {
    return this.spritePaletteIndex
  }

  /**
   * Render all visible sprites to the canvas.
   *
   * Iterates through the sprite states, filters for visible sprites
   * with definitions, and draws each one using putImageData.
   *
   * @param spriteStates - Array of all sprite states from SpriteStateManager
   */
  renderSprites(spriteStates: SpriteState[]): void {
    if (!this.spriteEnabled) return

    const ctx = this.getContext()
    if (!ctx) return

    for (const sprite of spriteStates) {
      if (!sprite.visible || !sprite.definition) continue

      const imageData = this.generateSpriteImageData(sprite)
      if (!imageData) continue

      ctx.putImageData(imageData, sprite.x, sprite.y)
    }
  }

  /**
   * Generate ImageData for a single sprite.
   *
   * Creates pixel data from the sprite's tile definitions and
   * color combination. Color index 0 is treated as transparent
   * (RGBA 0,0,0,0).
   *
   * @param sprite - The sprite state containing position and definition
   * @returns SpriteImageData with width, height, and RGBA pixel data, or null if not renderable
   */
  generateSpriteImageData(sprite: SpriteState): SpriteImageData | null {
    if (!sprite.visible || !sprite.definition) return null

    const { size, tiles, colorCombination } = sprite.definition
    const pixelWidth = size === 1 ? TILE_WIDTH * 2 : TILE_WIDTH
    const pixelHeight = size === 1 ? TILE_HEIGHT * 2 : TILE_HEIGHT

    const palette = resolveSpritePalette(this.spritePaletteIndex, colorCombination)
    const data = new Uint8ClampedArray(pixelWidth * pixelHeight * 4)

    if (size === 1 && tiles.length >= 4) {
      // 16x16 sprite: 4 tiles in 2x2 arrangement
      this.blitTile(data, tiles[0]!, 0, 0, pixelWidth, palette)
      this.blitTile(data, tiles[1]!, TILE_WIDTH, 0, pixelWidth, palette)
      this.blitTile(data, tiles[2]!, 0, TILE_HEIGHT, pixelWidth, palette)
      this.blitTile(data, tiles[3]!, TILE_WIDTH, TILE_HEIGHT, pixelWidth, palette)
    } else if (tiles.length >= 1) {
      // 8x8 sprite: 1 tile
      this.blitTile(data, tiles[0]!, 0, 0, pixelWidth, palette)
    }

    return { width: pixelWidth, height: pixelHeight, data }
  }

  /**
   * Reset all renderer state.
   * Disables sprites and clears any cached data.
   */
  resetState(): void {
    this.spriteEnabled = false
    this.spritePaletteIndex = DEFAULT_SPRITE_PALETTE_INDEX
  }

  /**
   * Blit a single tile's pixel data into the output buffer.
   *
   * Each pixel in the tile is a color index (0-3). Index 0 is
   * transparent (alpha = 0). Indices 1-3 are mapped to the
   * provided palette colors.
   *
   * @param output - The output RGBA pixel buffer
   * @param tile - 8x8 tile with color indices (0-3)
   * @param offsetX - X offset in pixels within the output buffer
   * @param offsetY - Y offset in pixels within the output buffer
   * @param stride - Total width of the output image in pixels
   * @param palette - Array of 4 hex color strings for indices 0-3
   */
  private blitTile(
    output: Uint8ClampedArray,
    tile: number[][],
    offsetX: number,
    offsetY: number,
    stride: number,
    palette: ReadonlyArray<string>,
  ): void {
    for (let ty = 0; ty < TILE_HEIGHT; ty++) {
      for (let tx = 0; tx < TILE_WIDTH; tx++) {
        const colorIndex = tile[ty]?.[tx] ?? 0
        const px = offsetX + tx
        const py = offsetY + ty
        const pixelOffset = (py * stride + px) * 4

        if (colorIndex === 0 || colorIndex >= PALETTE_SIZE) {
          // Transparent pixel
          output[pixelOffset] = 0
          output[pixelOffset + 1] = 0
          output[pixelOffset + 2] = 0
          output[pixelOffset + 3] = 0
        } else {
          // Map color index to RGBA via hex color string
          const color = palette[colorIndex]!
          const rgb = hexToRgb(color)
          output[pixelOffset] = rgb.r
          output[pixelOffset + 1] = rgb.g
          output[pixelOffset + 2] = rgb.b
          output[pixelOffset + 3] = 255
        }
      }
    }
  }
}

/**
 * Convert a hex color string (#RRGGBB) to RGB components.
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const cleanHex = hex.replace('#', '')
  const r = parseInt(cleanHex.substring(0, 2), 16)
  const g = parseInt(cleanHex.substring(2, 4), 16)
  const b = parseInt(cleanHex.substring(4, 6), 16)
  return { r, g, b }
}
