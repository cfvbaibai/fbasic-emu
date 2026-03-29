/**
 * Shared display state buffer for main thread ↔ worker sync.
 *
 * @see {@link docs/reference/shared-display-buffer.md} for full buffer layout documentation
 *
 * Layout: sprites (0–767) + cell chars (768–1439) + cell patterns (1440–2111) +
 * cursor (2112–2113) + sequence (2116–2119) + scalars (2120–2123) +
 * animation sync (2128–2199).
 * Reuses first 768 bytes for sprite state (Float64Array × 96); screen/sequence/scalars follow.
 * Animation sync section (9 floats) at end for Executor Worker ↔ Animation Worker direct sync.
 *
 * This module contains ONLY raw structure code (buffer layout constants, byte offsets, types, enums)
 * and factory functions. All operation logic is in SharedDisplayBufferAccessor.
 */

// ============================================================================
// SPRITE SECTION CONSTANTS
// ============================================================================

import { SCREEN_DIMENSIONS } from '@/core/constants'

export const MAX_SPRITES = SCREEN_DIMENSIONS.SPRITE_COUNT
// 12 floats per sprite: x, y, isActive, isVisible, frameIndex, remainingDistance, totalDistance,
// direction, speed, priority, characterType, colorCombination
export const FLOATS_PER_SPRITE = 12
export const SPRITE_DATA_FLOATS = MAX_SPRITES * FLOATS_PER_SPRITE // 96

// ============================================================================
// SYNC SECTION CONSTANTS (within animation section)
// ============================================================================

const SYNC_SECTION_FLOATS = 9 // command type, action number, params (6), ack
export const ANIMATION_SECTION_FLOATS = SPRITE_DATA_FLOATS + SYNC_SECTION_FLOATS // 105

// Sync section offsets (in Float64Array indices, relative to animation section)
export const SYNC_COMMAND_TYPE_OFFSET = SPRITE_DATA_FLOATS // 96
export const SYNC_ACTION_NUMBER_OFFSET = 97
export const SYNC_PARAM1_OFFSET = 98
export const SYNC_PARAM2_OFFSET = 99
export const SYNC_PARAM3_OFFSET = 100
export const SYNC_PARAM4_OFFSET = 101
export const SYNC_PARAM5_OFFSET = 102
export const SYNC_PARAM6_OFFSET = 103
export const SYNC_ACK_OFFSET = 104

// Sync command types
export enum SyncCommandType {
  NONE = 0,
  START_MOVEMENT = 1,
  STOP_MOVEMENT = 2,
  ERASE_MOVEMENT = 3,
  SET_POSITION = 4,
  CLEAR_ALL_MOVEMENTS = 5,
}

// Acknowledgment values
export const ACK_PENDING = 0
export const ACK_RECEIVED = 1

// Animation constants
export const DEFAULT_SPRITE_FRAME_RATE = 8 // Default frame rate for sprite animations

// Screen grid
export const COLS = 28
export const ROWS = 24
export const CELLS = COLS * ROWS // 672

// Byte offsets (plan: §1)
// Sprite data: 8 sprites × 12 floats × 8 bytes = 768 bytes
// (x, y, isActive, isVisible, frameIndex, remainingDistance, totalDistance,
//  direction, speed, priority, characterType, colorCombination)
const SPRITES_BYTES = MAX_SPRITES * 12 * 8 // 768
export const OFFSET_SPRITES = 0
export const OFFSET_CHARS = SPRITES_BYTES // 768
export const OFFSET_PATTERNS = OFFSET_CHARS + CELLS // 1440
export const OFFSET_CURSOR = OFFSET_PATTERNS + CELLS // 2112
// Sequence at 2116 for Int32 alignment (cursor ends at 2114)
export const OFFSET_SEQUENCE = 2116
export const OFFSET_SCALARS = OFFSET_SEQUENCE + 4 // 2120

// Animation sync section (same layout as standalone animation buffer)
// 9 floats: command type, action number, params (6), ack
// Must be aligned to 8 bytes for Float64Array (2124 + 4 = 2128)
const SYNC_SECTION_BYTES = SYNC_SECTION_FLOATS * 8 // 72
// Add padding to align to 8 bytes (2120 + 4 + 4 = 2128, which is divisible by 8)
const SYNC_PADDING = 4
export const OFFSET_ANIMATION_SYNC = OFFSET_SCALARS + 4 + SYNC_PADDING // 2128

export const SHARED_DISPLAY_BUFFER_BYTES = OFFSET_ANIMATION_SYNC + SYNC_SECTION_BYTES // 2200

/**
 * Typed views over the shared display buffer (sprites + screen + cursor + sequence + scalars).
 */
export interface SharedDisplayViews {
  /** Raw SharedArrayBuffer (2200 bytes). */
  buffer: SharedArrayBuffer
  /** Sprite animation state (0-767 bytes; Float64 × 96). */
  spriteView: Float64Array
  /** Screen character codes (28×24 cells). */
  charView: Uint8Array
  /** Screen color patterns (28×24 cells). */
  patternView: Uint8Array
  /** Cursor X, Y (2 bytes). */
  cursorView: Uint8Array
  /** Sequence number for change detection (Int32). */
  sequenceView: Int32Array
  /** Scalars: bgPalette, spritePalette, backdropColor, cgenMode (4 bytes). */
  scalarsView: Uint8Array
  /** Animation sync section (Float64Array × 9) for Executor Worker ↔ Animation Worker direct sync. */
  animationSyncView: Float64Array
}

/** F-BASIC character code for space (empty cell). Code 0 is a picture tile, so buffer must not start as zeros. */
const CHAR_CODE_SPACE = 0x20

/**
 * Create SharedArrayBuffer and typed views for full display state (sprites + screen + cursor + sequence + scalars).
 * Call only when crossOriginIsolated (required for SharedArrayBuffer).
 * Initializes screen region to spaces so the screen shows empty on first load (not code-0 BGITEM).
 */
export function createSharedDisplayBuffer(): SharedDisplayViews {
  if (typeof SharedArrayBuffer === 'undefined') {
    throw new Error('SharedArrayBuffer is not available (require cross-origin isolation)')
  }
  const buffer = new SharedArrayBuffer(SHARED_DISPLAY_BUFFER_BYTES)
  const charView = new Uint8Array(buffer, OFFSET_CHARS, CELLS)
  const patternView = new Uint8Array(buffer, OFFSET_PATTERNS, CELLS)
  // SharedArrayBuffer is zero-initialized;
  // code 0 is a picture BGITEM. Fill screen with space so initial screen is empty.
  charView.fill(CHAR_CODE_SPACE)
  patternView.fill(0)
  return {
    buffer,
    spriteView: new Float64Array(buffer, OFFSET_SPRITES, MAX_SPRITES * 12),
    charView,
    patternView,
    cursorView: new Uint8Array(buffer, OFFSET_CURSOR, 2),
    sequenceView: new Int32Array(buffer, OFFSET_SEQUENCE, 1),
    scalarsView: new Uint8Array(buffer, OFFSET_SCALARS, 4),
    animationSyncView: new Float64Array(buffer, OFFSET_ANIMATION_SYNC, SYNC_SECTION_FLOATS),
  }
}

/**
 * Create views from an existing buffer (e.g. in worker after receiving SET_SHARED_ANIMATION_BUFFER).
 */
export function createViewsFromDisplayBuffer(buffer: SharedArrayBuffer): SharedDisplayViews {
  return {
    buffer,
    spriteView: new Float64Array(buffer, OFFSET_SPRITES, MAX_SPRITES * 12),
    charView: new Uint8Array(buffer, OFFSET_CHARS, CELLS),
    patternView: new Uint8Array(buffer, OFFSET_PATTERNS, CELLS),
    cursorView: new Uint8Array(buffer, OFFSET_CURSOR, 2),
    sequenceView: new Int32Array(buffer, OFFSET_SEQUENCE, 1),
    scalarsView: new Uint8Array(buffer, OFFSET_SCALARS, 4),
    animationSyncView: new Float64Array(buffer, OFFSET_ANIMATION_SYNC, SYNC_SECTION_FLOATS),
  }
}

/**
 * Slot base index for actionNumber i:
 * [base]=x, [base+1]=y, [base+2]=isActive, [base+3]=isVisible, [base+4]=frameIndex,
 * [base+5]=remainingDistance, [base+6]=totalDistance, [base+7]=direction, [base+8]=speed,
 * [base+9]=priority, [base+10]=characterType, [base+11]=colorCombination
 */
export function slotBase(actionNumber: number): number {
  if (actionNumber < 0 || actionNumber >= MAX_SPRITES) {
    throw new RangeError(`actionNumber must be 0-${MAX_SPRITES - 1}, got ${actionNumber}`)
  }
  return actionNumber * FLOATS_PER_SPRITE
}
