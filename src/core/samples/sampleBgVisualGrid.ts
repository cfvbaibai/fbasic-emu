/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/naming-convention */
/**
 * Visual Grid Infrastructure for Sample BG Data
 *
 * Provides shared utilities and constants for building BG grids from
 * visual string representations (used by both IDE demo and manual sample grids).
 */

import { BG_GRID, DEFAULT_BG_CHAR_CODE } from '@/features/bg-editor/constants'
import type { BgCell, BgGridData } from '@/features/bg-editor/types'

// ============================================================================
// Grid Construction Utilities
// ============================================================================

/** Create an empty 28x21 grid */
export function createEmptyGrid(): BgGridData {
  const grid: BgGridData = []
  for (let y = 0; y < BG_GRID.ROWS; y++) {
    const row: BgCell[] = []
    for (let x = 0; x < BG_GRID.COLS; x++) {
      row.push({ charCode: DEFAULT_BG_CHAR_CODE, colorPattern: 0 })
    }
    grid.push(row)
  }
  return grid
}

/** Helper to set a cell in the grid */
export function setCell(grid: BgGridData, x: number, y: number, charCode: number, colorPattern: 0 | 1 | 2 | 3 = 0): void {
  if (x >= 0 && x < BG_GRID.COLS && y >= 0 && y < BG_GRID.ROWS) {
    const row = grid[y]
    if (row) {
      row[x] = { charCode, colorPattern }
    }
  }
}

// ============================================================================
// F-BASIC Reference Manual Visual Grid Constants
// ============================================================================

/** Empty cell marker for visual grids (3 underscores for visual alignment) */
export const ___ = '___'

/** Letter to base CHR$ value mapping (from manual page 113) */
export const LETTER_BASE: Record<string, number> = {
  A: 0, B: 8, C: 16, D: 24,
  E: 184, F: 192, G: 200, H: 208,
  I: 216, J: 224, K: 232, L: 240, M: 248,
}

// BG code constants for visual grids (from manual page 113)
// Format: {letter}{digit}{color} where color is 0-3
// K codes (232-239)
export const K72 = 'K72', K62 = 'K62', K52 = 'K52', K42 = 'K42'
export const K32 = 'K32', K22 = 'K22', K12 = 'K12', K02 = 'K02'
export const K50 = 'K50'
// L codes (240-247)
export const L02 = 'L02', L12 = 'L12', L22 = 'L22'
export const L40 = 'L40'
// J codes (224-231)
export const J00 = 'J00', J10 = 'J10', J20 = 'J20', J30 = 'J30'
export const J02 = 'J02', J12 = 'J12', J22 = 'J22', J32 = 'J32'
export const J50 = 'J50', J33 = 'J33', J03 = 'J03', J13 = 'J13', J23 = 'J23', J70 = 'J70'
// I codes (216-223)
export const I60 = 'I60', I70 = 'I70', I62 = 'I62', I72 = 'I72'
export const I63 = 'I63', I73 = 'I73'
// G codes (200-207)
export const G00 = 'G00', G10 = 'G10', G20 = 'G20', G30 = 'G30', G40 = 'G40'
export const G42 = 'G42', G52 = 'G52', G62 = 'G62'
// D codes (24-31)
export const D41 = 'D41', D50 = 'D50', D52 = 'D52'
// F codes (192-199)
export const F32 = 'F32', F41 = 'F41', F61 = 'F61', F72 = 'F72'
// M codes (248-255)
export const M11 = 'M11', M31 = 'M31', M70 = 'M70', M71 = 'M71', M72 = 'M72'

// ============================================================================
// ASCII Character Constants for Visual Grids (3-char padded for alignment)
// ============================================================================
export const _1_ = '1  ', _2_ = '2  ', _3_ = '3  ', _4_ = '4  ', _5_ = '5  '
export const _6_ = '6  ', _7_ = '7  ', _8_ = '8  '
export const _A_ = 'A  ', _B_ = 'B  ', _C_ = 'C  ', _D_ = 'D  ', _E_ = 'E  '
export const _F_ = 'F  ', _G_ = 'G  ', _H_ = 'H  ', _I_ = 'I  ', _J_ = 'J  '
export const _K_ = 'K  ', _L_ = 'L  ', _M_ = 'M  ', _N_ = 'N  ', _O_ = 'O  '
export const _P_ = 'P  ', _R_ = 'R  ', _S_ = 'S  ', _T_ = 'T  ', _U_ = 'U  '
export const _Y_ = 'Y  '

// ============================================================================
// Visual Grid Parsing
// ============================================================================

/**
 * Convert a 3-char BG code from manual (e.g., "K72", "L02") to [charCode, colorPattern]
 */
function parseBgCode(code: string): [number, 0 | 1 | 2 | 3] {
  if (code.length !== 3) {
    throw new Error(`Invalid BG code: ${code}`)
  }

  const letter = code[0]!
  const digit = parseInt(code[1]!, 10)
  const colorChar = code[2]!
  const colorPattern = parseInt(colorChar, 10) as 0 | 1 | 2 | 3

  const base = LETTER_BASE[letter]
  if (base === undefined) {
    throw new Error(`Unknown letter in BG code: ${code}`)
  }

  const charCode = base + digit
  return [charCode, colorPattern]
}

/**
 * Create a cell from ASCII character
 */
function asciiCell(char: string, color: 0 | 1 | 2 | 3 = 0): [number, 0 | 1 | 2 | 3] {
  return [char.charCodeAt(0), color]
}

/**
 * Convert a visual 2D string grid to BgGridData
 *
 * Cell format:
 * - "___" (3 underscores) = empty cell
 * - "K72" = BG code (letter + digit + color pattern)
 * - "A  " = ASCII character (letter + 2 spaces)
 *
 * @param visualGrid - 2D array of 3-char cell strings
 * @returns BgGridData ready for use
 */
export function visualGridToBgGridData(visualGrid: string[][]): BgGridData {
  const result = createEmptyGrid()

  for (let y = 0; y < visualGrid.length && y < BG_GRID.ROWS; y++) {
    const row = visualGrid[y]
    if (!row) continue

    for (let x = 0; x < row.length && x < BG_GRID.COLS; x++) {
      const cell = row[x]
      if (!cell || cell === ___) continue

      const trimmed = cell.trim()
      if (trimmed.length === 0) continue

      // Check if it's a 3-char BG code (letter + digit + color) or ASCII text
      if (/^[A-M][0-7][0-3]$/.test(trimmed)) {
        // BG code like K72, L02, etc.
        const [charCode, colorPattern] = parseBgCode(trimmed)
        setCell(result, x, y, charCode, colorPattern)
      } else {
        // ASCII text - use first character
        const [charCode, colorPattern] = asciiCell(trimmed[0]!, 0)
        setCell(result, x, y, charCode, colorPattern)
      }
    }
  }

  return result
}
