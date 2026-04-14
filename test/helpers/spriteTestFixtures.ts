/**
 * Shared test fixtures for sprite-related tests.
 *
 * Provides factory helpers for creating sprite tiles, definitions, and states
 * used by both CanvasSpriteRenderer and MainThreadDeviceAdapter tests.
 */

import type { DefSpriteDefinition, SpriteState } from '@/core/sprite/types'
import type { Tile } from '@/shared/data/types'

/** Creates a minimal 8x8 tile with the given color index. */
export function createSolidTile(colorIndex: number): Tile {
  return Array.from({ length: 8 }, () => Array.from({ length: 8 }, () => colorIndex))
}

/** Creates a minimal DefSpriteDefinition for testing. */
export function createSpriteDefinition(
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
export function createSpriteState(
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
