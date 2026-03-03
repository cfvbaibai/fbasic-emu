/**
 * BG Compression Utilities
 *
 * Provides hybrid compression for BG grid data:
 * - Sparse format: for grids with <30% fill (stores only non-empty cells)
 * - RLE format: for grids with >=30% fill (run-length encoding)
 */

import type { CompactBg } from '@/core/interfaces'
import { logCore } from '@/shared/logger'

import { BG_GRID, DEFAULT_BG_CHAR_CODE } from '../constants'
import type { BgCell, BgGridData } from '../types'

/** Threshold for choosing sparse vs RLE format (30% fill) */
const SPARSE_THRESHOLD = 0.3

/** Character code for empty cells (space character) */
const EMPTY_CHAR_CODE = DEFAULT_BG_CHAR_CODE // 32

/** Color pattern for empty cells */
const EMPTY_COLOR_PATTERN = 0

/**
 * Check if a cell is empty (default/space character)
 */
function isEmptyCell(cell: BgCell): boolean {
  return cell.charCode === EMPTY_CHAR_CODE && cell.colorPattern === EMPTY_COLOR_PATTERN
}

/**
 * Create an empty 28x21 grid
 */
function createEmptyGrid(): BgGridData {
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

/**
 * Encode grid using sparse format
 * Format: "x,y,charCode,colorPattern;" for each non-empty cell
 *
 * Example: "0,0,65,1;5,10,66,2;" means:
 *   - cell (0,0) has charCode=65, color=1
 *   - cell (5,10) has charCode=66, color=2
 */
function encodeSparse(grid: BgGridData): string {
  const entries: string[] = []

  for (let y = 0; y < grid.length; y++) {
    const row = grid[y]
    if (!row) continue

    for (let x = 0; x < row.length; x++) {
      const cell = row[x]
      if (cell && !isEmptyCell(cell)) {
        entries.push(`${x},${y},${cell.charCode},${cell.colorPattern}`)
      }
    }
  }

  return entries.join(';')
}

/**
 * Decode sparse format back to grid
 */
function decodeSparse(data: string): BgGridData {
  const grid = createEmptyGrid()

  if (!data) return grid

  const entries = data.split(';').filter(Boolean)

  for (const entry of entries) {
    const parts = entry.split(',').map(Number)
    const [x = -1, y = -1, charCode = 0, colorPattern = 0] = parts

    if (
      x >= 0 &&
      x < BG_GRID.COLS &&
      y >= 0 &&
      y < BG_GRID.ROWS &&
      !isNaN(charCode) &&
      !isNaN(colorPattern)
    ) {
      const row = grid[y]
      if (row) {
        row[x] = { charCode, colorPattern: colorPattern as 0 | 1 | 2 | 3 }
      }
    }
  }

  return grid
}

/**
 * Encode grid using RLE (Run-Length Encoding) format
 * Format: each run is [count:2hex][charCode:2hex][color:1hex]
 *
 * Example: "0a4101054201" means:
 *   - 0a (10) cells of (charCode=0x41=65, color=1)
 *   - 05 (5) cells of (charCode=0x42=66, color=1)
 */
function encodeRle(grid: BgGridData): string {
  // Flatten grid to single array
  const cells: BgCell[] = []
  for (let y = 0; y < grid.length; y++) {
    const row = grid[y]
    if (row) {
      cells.push(...row)
    }
  }

  if (cells.length === 0) {
    return ''
  }

  const runs: string[] = []
  let i = 0

  while (i < cells.length) {
    const current = cells[i]
    if (!current) {
      i++
      continue
    }

    let count = 1

    // Count consecutive identical cells (max 255 per run)
    while (
      i + count < cells.length &&
      count < 255 &&
      cells[i + count]?.charCode === current.charCode &&
      cells[i + count]!.colorPattern === current.colorPattern
    ) {
      count++
    }

    // Encode: count (2 hex digits) + charCode (2 hex) + color (1 hex)
    runs.push(
      count.toString(16).padStart(2, '0') +
        current.charCode.toString(16).padStart(2, '0') +
        current.colorPattern.toString(16)
    )

    i += count
  }

  return runs.join('')
}

/**
 * Decode RLE format back to grid
 */
function decodeRle(data: string): BgGridData {
  const grid = createEmptyGrid()
  const cells: BgCell[] = []

  // Parse 5-character runs
  for (let i = 0; i + 5 <= data.length; i += 5) {
    const count = parseInt(data.slice(i, i + 2), 16)
    const charCode = parseInt(data.slice(i + 2, i + 4), 16)
    const colorPattern = parseInt(data.slice(i + 4, i + 5), 16)

    if (isNaN(count) || isNaN(charCode) || isNaN(colorPattern)) {
      continue
    }

    for (let j = 0; j < count; j++) {
      cells.push({ charCode, colorPattern: colorPattern as 0 | 1 | 2 | 3 })
    }
  }

  // Fill grid from flat array
  let cellIndex = 0
  for (let y = 0; y < BG_GRID.ROWS && cellIndex < cells.length; y++) {
    const row = grid[y]
    if (row) {
      for (let x = 0; x < BG_GRID.COLS && cellIndex < cells.length; x++) {
        row[x] = cells[cellIndex]!
        cellIndex++
      }
    }
  }

  return grid
}

/**
 * Compress BG grid data using the optimal format
 *
 * Automatically chooses:
 * - sparse1 format if <30% of cells are non-empty
 * - rle1 format if >=30% of cells are non-empty
 *
 * @param grid - BG grid data (28x21)
 * @returns Compressed BG data
 */
export function compressBg(grid: BgGridData): CompactBg {
  // Count non-empty cells
  let nonEmptyCount = 0

  for (let y = 0; y < grid.length; y++) {
    const row = grid[y]
    if (!row) continue

    for (let x = 0; x < row.length; x++) {
      const cell = row[x]
      if (cell && !isEmptyCell(cell)) {
        nonEmptyCount++
      }
    }
  }

  const totalCells = BG_GRID.COLS * BG_GRID.ROWS
  const fillRatio = nonEmptyCount / totalCells

  // Choose format based on fill ratio
  if (fillRatio < SPARSE_THRESHOLD) {
    return {
      format: 'sparse1',
      data: encodeSparse(grid),
      width: BG_GRID.COLS,
      height: BG_GRID.ROWS,
    }
  } else {
    return {
      format: 'rle1',
      data: encodeRle(grid),
      width: BG_GRID.COLS,
      height: BG_GRID.ROWS,
    }
  }
}

/**
 * Decompress BG data back to grid format
 *
 * @param compact - Compressed BG data
 * @returns BG grid data (28x21)
 */
export function decompressBg(compact: CompactBg): BgGridData {
  if (compact.format === 'sparse1') {
    return decodeSparse(compact.data)
  } else if (compact.format === 'rle1') {
    return decodeRle(compact.data)
  }

  // Unknown format - return empty grid
  logCore.warn(`Unknown BG compression format: ${(compact).format}`)
  return createEmptyGrid()
}
