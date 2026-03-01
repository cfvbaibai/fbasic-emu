/**
 * Character Set Converter
 * Converts DEF SPRITE character sets to tile data
 *
 * Uses Table A (sprite table) or Table B (background table) based on CGEN mode:
 * - CGEN 0, 2: Table A for sprites
 * - CGEN 1, 3: Table B for sprites
 */

import type { Tile } from '@/shared/data/types'
import { getBgTilesByCodes, getSpriteTilesByCodes } from '@/shared/utils/spriteLookup'

/**
 * Convert character set to tiles
 * Character set can be:
 * - String: "@ABC" (use character lookup)
 * - Number array: [0, 1, 2, 3] (use code lookup)
 *
 * For 8×8 sprites: 1 character → 1 tile
 * For 16×16 sprites: 4 characters → 4 tiles (top-left, top-right, bottom-left, bottom-right)
 *
 * @param characterSet - Character codes or string
 * @param size - Sprite size (0=8×8, 1=16×16)
 * @param useTableB - If true, use Table B (background), otherwise Table A (sprite)
 * @returns Array of tiles
 */
export function convertCharacterSetToTiles(characterSet: number[] | string, size: 0 | 1, useTableB = false): Tile[] {
  const expectedCount = size === 1 ? 4 : 1

  // Convert to character codes
  let charCodes: number[]
  if (typeof characterSet === 'string') {
    // String: convert each character to its character code
    charCodes = Array.from(characterSet).map(char => char.charCodeAt(0))
  } else {
    charCodes = characterSet
  }

  // Validate count
  if (charCodes.length !== expectedCount) {
    throw new Error(
      `Invalid character set length: expected ${expectedCount} for ${size === 0 ? '8×8' : '16×16'} sprite, got ${charCodes.length}`
    )
  }

  // Look up tiles from the appropriate table
  const tableName = useTableB ? 'Table B' : 'Table A'
  try {
    if (useTableB) {
      return getBgTilesByCodes(charCodes)
    } else {
      return getSpriteTilesByCodes(charCodes)
    }
  } catch (error) {
    throw new Error(
      `DEF SPRITE: Failed to find sprite tiles in ${tableName}: ${error instanceof Error ? error.message : String(error)}`
    )
  }
}

/**
 * Convert character string to character codes
 * Useful for parsing string literals from BASIC
 *
 * @param str - String (with or without quotes)
 * @returns Array of character codes
 */
export function stringToCharCodes(str: string): number[] {
  // Remove quotes if present
  const cleanStr = str.startsWith('"') && str.endsWith('"') ? str.slice(1, -1) : str

  return Array.from(cleanStr).map(char => char.charCodeAt(0))
}
