/**
 * Sprite Lookup Utilities
 * Lookup sprites from Character Table A (CHARACTER_SPRITES) or Table B (BG items)
 * Used for DEF SPRITE character set conversion
 *
 * CGEN mode determines which table to use:
 * - CGEN 0, 2: Table A for sprites
 * - CGEN 1, 3: Table B for sprites
 */

import { KANA_BG_ITEMS, LETTER_BG_ITEMS, NUMBER_BG_ITEMS, PICTURE_BG_ITEMS, SYMBOL_BG_ITEMS } from '@/shared/data/bg'
import { CHARACTER_SPRITES } from '@/shared/data/sprites'
import type { BackgroundItem, SpriteDefinition, Tile } from '@/shared/data/types'
import { isEightTileSprite, isFourTileSprite, isOneTileSprite, isSixTileSprite } from '@/shared/data/types'

// Combine all BG items into a single array for Table B lookup
const ALL_BG_ITEMS: BackgroundItem[] = [
  ...KANA_BG_ITEMS,
  ...LETTER_BG_ITEMS,
  ...NUMBER_BG_ITEMS,
  ...PICTURE_BG_ITEMS,
  ...SYMBOL_BG_ITEMS,
]

// Create a Map for O(1) lookup by character code
const bgItemByCode = new Map<number, BackgroundItem>()
for (const item of ALL_BG_ITEMS) {
  bgItemByCode.set(item.code, item)
}

/**
 * Find background tile by character code from Table B
 * Used when CGEN mode is 1 or 3 (B on sprite)
 *
 * @param code - Character code (0-255)
 * @returns Tile data or null if not found
 */
export function getBgTileByCode(code: number): Tile | null {
  const item = bgItemByCode.get(code)
  return item?.tile ?? null
}

/**
 * Find background tiles for a sequence of character codes from Table B
 *
 * @param codes - Array of character codes
 * @returns Array of tiles in order
 */
export function getBgTilesByCodes(codes: number[]): Tile[] {
  const tiles: Tile[] = []
  for (let i = 0; i < codes.length; i++) {
    const code = codes[i]
    if (code === undefined) {
      throw new Error(`Undefined character code at index ${i}`)
    }
    const tile = getBgTileByCode(code)
    if (!tile) {
      throw new Error(`No background tile found for character code ${code} in Table B`)
    }
    tiles.push(tile)
  }
  return tiles
}

/**
 * Find sprite tile by character code from Table A
 * Searches through CHARACTER_SPRITES to find a sprite containing the given character code
 *
 * @param code - Character code (0-255)
 * @param tileIndex - For multi-tile sprites, which tile index (0-3 for 16×16, 0-5 for 6-tile, 0-7 for 8-tile)
 * @returns Tile data or null if not found
 */
export function getSpriteTileByCode(code: number, tileIndex: number = 0): Tile | null {
  for (const sprite of CHARACTER_SPRITES) {
    if (isOneTileSprite(sprite)) {
      // Single tile sprite: charCodes is a number
      if (sprite.charCodes === code && tileIndex === 0) {
        return sprite.tiles
      }
    } else if (isFourTileSprite(sprite)) {
      // 16×16 sprite: charCodes is [number, number, number, number]
      const index = sprite.charCodes.indexOf(code)
      if (index >= 0 && index === tileIndex) {
        return sprite.tiles[index] ?? null
      }
    } else if (isSixTileSprite(sprite)) {
      // 6-tile sprite: charCodes is [number, number, number, number, number, number]
      const index = sprite.charCodes.indexOf(code)
      if (index >= 0 && index === tileIndex) {
        return sprite.tiles[index] ?? null
      }
    } else if (isEightTileSprite(sprite)) {
      // 8-tile sprite: charCodes is [number, number, number, number, number, number, number, number]
      const index = sprite.charCodes.indexOf(code)
      if (index >= 0 && index === tileIndex) {
        return sprite.tiles[index] ?? null
      }
    }
  }

  return null
}

/**
 * Get sprite definition by character code
 * Returns the first sprite that contains the given character code
 *
 * @param code - Character code (0-255)
 * @returns Sprite definition or null if not found
 */
export function getSpriteByCode(code: number): SpriteDefinition | null {
  for (const sprite of CHARACTER_SPRITES) {
    if (isOneTileSprite(sprite)) {
      if (sprite.charCodes === code) {
        return sprite
      }
    } else {
      // Multi-tile sprite: charCodes is an array
      const charCodes = sprite.charCodes as number[]
      if (charCodes.includes(code)) {
        return sprite
      }
    }
  }

  return null
}

/**
 * Find tiles for a sequence of character codes
 * For 8×8 sprites: finds single tile for code
 * For 16×16 sprites: finds 4 tiles from the same sprite matching codes [c0, c1, c2, c3]
 *
 * @param codes - Array of character codes
 * @returns Array of tiles in order
 */
export function getSpriteTilesByCodes(codes: number[]): Tile[] {
  // For single code (8×8 sprite)
  if (codes.length === 1) {
    const code = codes[0]
    if (code === undefined) {
      throw new Error('Undefined character code at index 0')
    }
    const tile = getSpriteTileByCode(code, 0)
    if (!tile) {
      throw new Error(`No sprite tile found for character code ${code} in Table A`)
    }
    return [tile]
  }

  // For multiple codes (16×16 sprite): try to find a sprite that matches all codes
  // First, try to find a sprite whose charCodes array exactly matches
  for (const sprite of CHARACTER_SPRITES) {
    if (isFourTileSprite(sprite)) {
      // Check if all 4 codes match in order
      const code0 = codes[0]
      const code1 = codes[1]
      const code2 = codes[2]
      const code3 = codes[3]
      if (
        code0 !== undefined &&
        code1 !== undefined &&
        code2 !== undefined &&
        code3 !== undefined &&
        sprite.charCodes[0] === code0 &&
        sprite.charCodes[1] === code1 &&
        sprite.charCodes[2] === code2 &&
        sprite.charCodes[3] === code3
      ) {
        return [...sprite.tiles]
      }
    } else if (isSixTileSprite(sprite) && codes.length === 6) {
      // Check if all 6 codes match
      if (
        sprite.charCodes.every((code, i) => {
          const codeValue = codes[i]
          return codeValue !== undefined && code === codeValue
        })
      ) {
        return [...sprite.tiles]
      }
    } else if (isEightTileSprite(sprite) && codes.length === 8) {
      // Check if all 8 codes match
      if (
        sprite.charCodes.every((code, i) => {
          const codeValue = codes[i]
          return codeValue !== undefined && code === codeValue
        })
      ) {
        return [...sprite.tiles]
      }
    }
  }

  // Fallback: if no exact match, try to find tiles individually
  // This handles cases where codes might be from different sprites
  const tiles: Tile[] = []
  for (let i = 0; i < codes.length; i++) {
    const code = codes[i]
    if (code === undefined) {
      throw new Error(`Undefined character code at index ${i}`)
    }
    const tile = getSpriteTileByCode(code, i)
    if (!tile) {
      throw new Error(`No sprite tile found for character code ${code} at index ${i} in Table A`)
    }
    tiles.push(tile)
  }

  return tiles
}
