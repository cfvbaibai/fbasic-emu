/**
 * Buffer Screen Operations
 *
 * Standalone functions for reading/writing screen data in the shared display buffer.
 * Extracted from SharedDisplayBufferAccessor for modularity.
 *
 * These functions operate on typed array views created from the shared buffer.
 */

import type { ScreenCell } from '@/core/interfaces'
import { logCore } from '@/shared/logger'
import { getCharacterByCode, getCodeByChar } from '@/shared/utils/backgroundLookup'

import { COLS, ROWS } from './sharedDisplayBuffer'

/**
 * Calculate cell index for given x,y coordinates.
 */
export function cellIndex(x: number, y: number): number {
  return y * COLS + x
}

// ============================================================================
// Individual Screen Cell Operations
// ============================================================================

/**
 * Read screen character code at position.
 * @param charView - Character view array
 * @param x - Column (0-27)
 * @param y - Row (0-23)
 * @returns F-BASIC character code (0-255)
 */
export function readScreenChar(charView: Uint8Array, x: number, y: number): number {
  if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return 0x20
  return charView[cellIndex(x, y)] ?? 0x20
}

/**
 * Write screen character code at position.
 * @param charView - Character view array
 * @param x - Column (0-27)
 * @param y - Row (0-23)
 * @param charCode - F-BASIC character code (0-255)
 */
export function writeScreenChar(charView: Uint8Array, x: number, y: number, charCode: number): void {
  if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return
  charView[cellIndex(x, y)] = Math.max(0, Math.min(255, charCode))
}

/**
 * Read screen color pattern at position.
 * @param patternView - Pattern view array
 * @param x - Column (0-27)
 * @param y - Row (0-23)
 * @returns Color pattern (0-3)
 */
export function readScreenPattern(patternView: Uint8Array, x: number, y: number): number {
  if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return 0
  return (patternView[cellIndex(x, y)] ?? 0) & 3
}

/**
 * Write screen color pattern at position.
 * @param patternView - Pattern view array
 * @param x - Column (0-27)
 * @param y - Row (0-23)
 * @param pattern - Color pattern (0-3)
 */
export function writeScreenPattern(patternView: Uint8Array, x: number, y: number, pattern: number): void {
  if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return
  patternView[cellIndex(x, y)] = pattern & 3
}

// ============================================================================
// Cursor Operations
// ============================================================================

/**
 * Read cursor position.
 */
export function readCursor(cursorView: Uint8Array): { x: number; y: number } {
  return {
    x: cursorView[0] ?? 0,
    y: cursorView[1] ?? 0,
  }
}

/**
 * Write cursor position.
 */
export function writeCursor(cursorView: Uint8Array, x: number, y: number): void {
  cursorView[0] = Math.max(0, Math.min(COLS - 1, x))
  cursorView[1] = Math.max(0, Math.min(ROWS - 1, y))
}

// ============================================================================
// Sequence Operations
// ============================================================================

/**
 * Read sequence number (change detection counter).
 */
export function readSequence(sequenceView: Int32Array): number {
  return sequenceView[0] ?? 0
}

/**
 * Increment sequence number to signal change.
 */
export function incrementSequence(sequenceView: Int32Array): void {
  sequenceView[0] = (sequenceView[0] ?? 0) + 1
}

// ============================================================================
// Bulk Screen State Operations
// ============================================================================

/**
 * Write screen state from ScreenCell[][] buffer into shared views.
 * Writes characters, patterns, cursor, and scalar values.
 * Does not increment sequence (caller should call incrementSequence after).
 */
export function writeScreenState(
  charView: Uint8Array,
  patternView: Uint8Array,
  cursorView: Uint8Array,
  scalarsView: Uint8Array,
  screenBuffer: ScreenCell[][],
  cursorX: number,
  cursorY: number,
  bgPalette: number,
  spritePalette: number,
  backdropColor: number,
  cgenMode: number
): void {
  if (screenBuffer == null) {
    logCore.warn('[SharedDisplayBufferAccessor] writeScreenState: screenBuffer is required, skipping')
    return
  }

  for (let y = 0; y < ROWS; y++) {
    const row = screenBuffer[y]
    for (let x = 0; x < COLS; x++) {
      const cell = row?.[x]
      const idx = cellIndex(x, y)
      const ch = cell?.character ?? ' '
      // Store F-BASIC code (0-255); use mapping so e.g. '「' -> 91, not Unicode 12300
      const code = getCodeByChar(ch) ?? (ch.length === 1 ? ch.charCodeAt(0) : 0x20)
      charView[idx] = Math.max(0, Math.min(255, code))
      patternView[idx] = (cell?.colorPattern ?? 0) & 3
    }
  }

  cursorView[0] = Math.max(0, Math.min(COLS - 1, cursorX))
  cursorView[1] = Math.max(0, Math.min(ROWS - 1, cursorY))
  scalarsView[0] = bgPalette & 1
  scalarsView[1] = spritePalette & 3
  scalarsView[2] = Math.max(0, Math.min(60, backdropColor))
  scalarsView[3] = cgenMode & 3
}

/**
 * Read complete screen state from shared views.
 * Returns ScreenCell[][] buffer plus cursor and scalar values.
 */
export function readScreenState(
  charView: Uint8Array,
  patternView: Uint8Array,
  cursorView: Uint8Array,
  scalarsView: Uint8Array
): {
  buffer: ScreenCell[][]
  cursorX: number
  cursorY: number
  bgPalette: number
  spritePalette: number
  backdropColor: number
  cgenMode: number
} {
  const buffer: ScreenCell[][] = []

  for (let y = 0; y < ROWS; y++) {
    const row: ScreenCell[] = []
    for (let x = 0; x < COLS; x++) {
      const idx = cellIndex(x, y)
      row.push({
        character: getCharacterByCode(charView[idx] ?? 0x20) ?? String.fromCharCode(charView[idx] ?? 0x20),
        colorPattern: (patternView[idx] ?? 0) & 3,
        x,
        y,
      })
    }
    buffer.push(row)
  }

  return {
    buffer,
    cursorX: cursorView[0] ?? 0,
    cursorY: cursorView[1] ?? 0,
    bgPalette: scalarsView[0] ?? 1,
    spritePalette: scalarsView[1] ?? 1,
    backdropColor: scalarsView[2] ?? 0,
    cgenMode: scalarsView[3] ?? 2,
  }
}

// ============================================================================
// Screen Buffer Read (for rendering)
// ============================================================================

/**
 * Read entire screen as ScreenCell[][].
 * Useful for rendering or state inspection.
 */
export function readScreenBuffer(charView: Uint8Array, patternView: Uint8Array): ScreenCell[][] {
  const buffer: ScreenCell[][] = []
  for (let y = 0; y < ROWS; y++) {
    const row: ScreenCell[] = []
    for (let x = 0; x < COLS; x++) {
      const idx = cellIndex(x, y)
      const charCode = charView[idx] ?? 0x20
      row.push({
        character: getCharacterByCode(charCode) ?? String.fromCharCode(charCode),
        colorPattern: (patternView[idx] ?? 0) & 3,
        x,
        y,
      })
    }
    buffer.push(row)
  }
  return buffer
}
