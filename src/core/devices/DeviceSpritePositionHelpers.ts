/**
 * Sprite Position Helpers
 *
 * Manages sprite position queries and state notifications.
 * Extracted from WebWorkerDeviceAdapter to reduce file size.
 */

import type { SharedDisplayBufferAccessor } from '@/core/animation/sharedDisplayBufferAccessor'
import type { SpriteState } from '@/core/sprite/types'

/** Mutable sprite position cache: actionNumber → { x, y }. */
export type SpritePositionCache = Map<number, { x: number; y: number }>

/**
 * Read sprite position from shared display buffer, falling back to cached last-known position.
 *
 * Logic:
 * 1. If sharedDisplayAccessor reports a live position, prefer it (unless it's origin 0,0
 *    with no active/visible sprite — which likely means "no position set").
 * 2. Otherwise fall back to the last-known position from the cache.
 */
export function getSpritePosition(
  accessor: SharedDisplayBufferAccessor | null,
  cache: SpritePositionCache,
  actionNumber: number
): { x: number; y: number } | null {
  if (accessor) {
    const livePos = accessor.readSpritePosition(actionNumber)
    if (livePos !== null) {
      const isOrigin = livePos.x === 0 && livePos.y === 0
      const hasLiveSpriteState =
        accessor.readSpriteIsActive(actionNumber) ||
        accessor.readSpriteIsVisible(actionNumber)
      if (!isOrigin || hasLiveSpriteState) {
        cache.set(actionNumber, livePos)
        return livePos
      }
    }
  }
  return cache.get(actionNumber) ?? null
}

/**
 * Send sprite states to main thread for rendering via postMessage.
 */
export function postSpriteStates(
  spriteStates: SpriteState[],
  spriteEnabled: boolean
): void {
  self.postMessage({
    type: 'SPRITE_STATES',
    id: `sprite-states-${Date.now()}`,
    timestamp: Date.now(),
    data: { spriteStates, spriteEnabled },
  })
}
