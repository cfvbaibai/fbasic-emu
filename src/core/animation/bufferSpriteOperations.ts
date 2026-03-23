/**
 * Buffer Sprite Operations
 *
 * Standalone functions for reading/writing sprite data in the shared display buffer.
 * Extracted from SharedDisplayBufferAccessor for modularity.
 *
 * These functions operate on the sprite Float64Array view.
 * Each sprite has 12 float fields (FLOATS_PER_SPRITE) at offsets from slotBase().
 */

import { MAX_SPRITES, slotBase } from './sharedDisplayBuffer'

// ============================================================================
// Sprite Write Operations
// ============================================================================

/**
 * Write one sprite's full animation state to the sprite view.
 */
export function writeSpriteStateToView(
  view: Float64Array,
  actionNumber: number,
  x: number,
  y: number,
  isActive: boolean,
  isVisible: boolean,
  frameIndex: number = 0,
  remainingDistance: number = 0,
  totalDistance: number = 0,
  direction: number = 0,
  speed: number = 0,
  priority: number = 0,
  characterType: number = 0,
  colorCombination: number = 0
): void {
  const base = slotBase(actionNumber)
  view[base] = x
  view[base + 1] = y
  view[base + 2] = isActive ? 1 : 0
  view[base + 3] = isVisible ? 1 : 0
  view[base + 4] = frameIndex
  view[base + 5] = remainingDistance
  view[base + 6] = totalDistance
  view[base + 7] = direction
  view[base + 8] = speed
  view[base + 9] = priority
  view[base + 10] = characterType
  view[base + 11] = colorCombination
}

/**
 * Clear all sprite data in the view.
 * Sets all sprites to inactive, invisible, with characterType = -1 (uninitialized).
 */
export function clearAllSprites(spriteView: Float64Array): void {
  for (let i = 0; i < 8; i++) {
    writeSpriteStateToView(spriteView, i, 0, 0, false, false, 0, 0, 0, 0, 0, 0, -1, 0)
  }
}

// ============================================================================
// Sprite Read Operations - Position
// ============================================================================

/**
 * Read one sprite's position from the sprite view. Returns null if slot not used.
 */
export function readSpritePositionFromView(view: Float64Array, actionNumber: number): { x: number; y: number } | null {
  if (actionNumber < 0 || actionNumber >= MAX_SPRITES) return null
  const base = slotBase(actionNumber)
  return { x: view[base] ?? 0, y: view[base + 1] ?? 0 }
}

// ============================================================================
// Sprite Read Operations - State Flags
// ============================================================================

/**
 * Read isActive for one sprite (1 = active, 0 = inactive).
 */
export function readSpriteIsActiveFromView(view: Float64Array, actionNumber: number): boolean {
  if (actionNumber < 0 || actionNumber >= MAX_SPRITES) return false
  const base = slotBase(actionNumber)
  return view[base + 2] !== 0
}

/**
 * Read isVisible for one sprite (1 = visible, 0 = invisible).
 */
export function readSpriteIsVisibleFromView(view: Float64Array, actionNumber: number): boolean {
  if (actionNumber < 0 || actionNumber >= MAX_SPRITES) return false
  const base = slotBase(actionNumber)
  return view[base + 3] !== 0
}

// ============================================================================
// Sprite Read Operations - Animation State
// ============================================================================

/**
 * Read frameIndex for one sprite (which animation frame to show).
 */
export function readSpriteFrameIndexFromView(view: Float64Array, actionNumber: number): number {
  if (actionNumber < 0 || actionNumber >= MAX_SPRITES) return 0
  const base = slotBase(actionNumber)
  return view[base + 4] ?? 0
}

/**
 * Read remainingDistance for one sprite (dots remaining in movement).
 */
export function readSpriteRemainingDistanceFromView(view: Float64Array, actionNumber: number): number {
  if (actionNumber < 0 || actionNumber >= MAX_SPRITES) return 0
  const base = slotBase(actionNumber)
  return view[base + 5] ?? 0
}

/**
 * Read totalDistance for one sprite (total distance in dots).
 */
export function readSpriteTotalDistanceFromView(view: Float64Array, actionNumber: number): number {
  if (actionNumber < 0 || actionNumber >= MAX_SPRITES) return 0
  const base = slotBase(actionNumber)
  return view[base + 6] ?? 0
}

/**
 * Read direction for one sprite (0-8 direction code).
 */
export function readSpriteDirectionFromView(view: Float64Array, actionNumber: number): number {
  if (actionNumber < 0 || actionNumber >= MAX_SPRITES) return 0
  const base = slotBase(actionNumber)
  return view[base + 7] ?? 0
}

/**
 * Read speed for one sprite (MOVE command speed parameter C).
 */
export function readSpriteSpeedFromView(view: Float64Array, actionNumber: number): number {
  if (actionNumber < 0 || actionNumber >= MAX_SPRITES) return 0
  const base = slotBase(actionNumber)
  return view[base + 8] ?? 0
}

// ============================================================================
// Sprite Read Operations - Visual Properties
// ============================================================================

/**
 * Read priority for one sprite (0=front, 1=back).
 */
export function readSpritePriorityFromView(view: Float64Array, actionNumber: number): number {
  if (actionNumber < 0 || actionNumber >= MAX_SPRITES) return 0
  const base = slotBase(actionNumber)
  return view[base + 9] ?? 0
}

/**
 * Read characterType for one sprite (DEF MOVE character type).
 */
export function readSpriteCharacterTypeFromView(view: Float64Array, actionNumber: number): number {
  if (actionNumber < 0 || actionNumber >= MAX_SPRITES) return 0
  const base = slotBase(actionNumber)
  return view[base + 10] ?? 0
}

/**
 * Read colorCombination for one sprite.
 */
export function readSpriteColorCombinationFromView(view: Float64Array, actionNumber: number): number {
  if (actionNumber < 0 || actionNumber >= MAX_SPRITES) return 0
  const base = slotBase(actionNumber)
  return view[base + 11] ?? 0
}

// ============================================================================
// Composite Sprite Read Operations
// ============================================================================

/**
 * Read all movement states from the sprite view.
 * Returns an array of MovementState objects for slots that have a valid DEF MOVE (characterType >= 0).
 */
export function readAllMovementStates(
  spriteView: Float64Array,
  readCharacterType: (actionNumber: number) => number,
  readTotalDistance: (actionNumber: number) => number,
  readDirection: (actionNumber: number) => number,
  readSpeed: (actionNumber: number) => number,
  readPriority: (actionNumber: number) => number,
  readColorCombination: (actionNumber: number) => number
): Array<{
  actionNumber: number
  definition: {
    actionNumber: number
    characterType: number
    direction: number
    speed: number
    distance: number
    priority: number
    colorCombination: number
  }
}> {
  const states: Array<{
    actionNumber: number
    definition: {
      actionNumber: number
      characterType: number
      direction: number
      speed: number
      distance: number
      priority: number
      colorCombination: number
    }
  }> = []

  for (let actionNumber = 0; actionNumber < 8; actionNumber++) {
    const characterType = readCharacterType(actionNumber)
    // characterType = -1 means uninitialized (no DEF MOVE)
    // characterType >= 0 means a valid DEF MOVE exists
    if (characterType >= 0) {
      const totalDistance = readTotalDistance(actionNumber)
      states.push({
        actionNumber,
        definition: {
          actionNumber,
          characterType,
          direction: readDirection(actionNumber),
          speed: readSpeed(actionNumber),
          distance: Math.round(totalDistance / 2), // distance = totalDistance / 2
          priority: readPriority(actionNumber),
          colorCombination: readColorCombination(actionNumber),
        },
      })
    }
  }

  return states
}
