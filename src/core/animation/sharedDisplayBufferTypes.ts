/**
 * Shared Display Buffer Types
 *
 * Type definitions for the shared display buffer accessor.
 * Extracted from sharedDisplayBufferAccessor.ts for modularity.
 */

import type { ScreenCell } from '@/core/interfaces'

// Re-export SyncCommandType for convenience
export { SyncCommandType } from './sharedDisplayBuffer'

/**
 * Decoded screen state read from shared buffer.
 * Used to transfer state from buffer to IDE refs.
 */
export interface DecodedScreenState {
  buffer: ScreenCell[][]
  cursorX: number
  cursorY: number
  bgPalette: number
  spritePalette: number
  backdropColor: number
  cgenMode: number
}

/**
 * Parameters for sync commands (varies by command type)
 */
export interface SyncCommandParams {
  startX?: number
  startY?: number
  direction?: number
  speed?: number
  distance?: number
  priority?: number
}

/**
 * Sync command read from buffer
 */
export interface SyncCommand {
  commandType: SyncCommandType
  actionNumber: number
  params: {
    startX: number
    startY: number
    direction: number
    speed: number
    distance: number
    priority: number
  }
}
