/* eslint-disable max-len */
 
/**
 * Simple programmatic BG grid creators
 *
 * Grid creators that build BG data programmatically using setCell() calls.
 * These are for IDE demo samples (not from the F-BASIC reference manual).
 */

import { BG_GRID, DEFAULT_BG_CHAR_CODE } from '@/features/bg-editor/constants'
import type { BgCell, BgGridData } from '@/features/bg-editor/types'

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

/**
 * Demo BG with a simple border and centered text area
 * Shows the grid boundaries clearly
 */
export function createDemoBorderGrid(): BgGridData {
  const grid = createEmptyGrid()

  // Draw border using block characters (176-183 are BG items)
  // Top and bottom borders
  for (let x = 0; x < BG_GRID.COLS; x++) {
    setCell(grid, x, 0, 176, 1) // Top border
    setCell(grid, x, BG_GRID.ROWS - 1, 176, 1) // Bottom border
  }

  // Left and right borders
  for (let y = 0; y < BG_GRID.ROWS; y++) {
    setCell(grid, 0, y, 177, 1) // Left border
    setCell(grid, BG_GRID.COLS - 1, y, 177, 1) // Right border
  }

  // Corner pieces
  setCell(grid, 0, 0, 178, 2)
  setCell(grid, BG_GRID.COLS - 1, 0, 178, 2)
  setCell(grid, 0, BG_GRID.ROWS - 1, 178, 2)
  setCell(grid, BG_GRID.COLS - 1, BG_GRID.ROWS - 1, 178, 2)

  // Center decoration - simple pattern
  const centerX = Math.floor(BG_GRID.COLS / 2)
  const centerY = Math.floor(BG_GRID.ROWS / 2)

  // Draw a diamond shape in center
  setCell(grid, centerX, centerY - 2, 42, 2) // *
  setCell(grid, centerX - 1, centerY - 1, 42, 2)
  setCell(grid, centerX, centerY - 1, 42, 2)
  setCell(grid, centerX + 1, centerY - 1, 42, 2)
  setCell(grid, centerX - 2, centerY, 42, 2)
  setCell(grid, centerX - 1, centerY, 65, 3) // A
  setCell(grid, centerX, centerY, 42, 2)
  setCell(grid, centerX + 1, centerY, 42, 2)
  setCell(grid, centerX + 2, centerY, 42, 2)
  setCell(grid, centerX - 1, centerY + 1, 42, 2)
  setCell(grid, centerX, centerY + 1, 42, 2)
  setCell(grid, centerX + 1, centerY + 1, 42, 2)
  setCell(grid, centerX, centerY + 2, 42, 2)

  return grid
}

/**
 * Platform game level background
 * Has ground, platforms, and decorative elements
 */
export function createPlatformLevelGrid(): BgGridData {
  const grid = createEmptyGrid()

  // Ground (bottom 2 rows) - solid blocks
  for (let x = 0; x < BG_GRID.COLS; x++) {
    setCell(grid, x, BG_GRID.ROWS - 1, 219, 1) // Solid block
    setCell(grid, x, BG_GRID.ROWS - 2, 220, 1) // Half block
  }

  // Platforms at different heights
  // Platform 1: left side, mid height
  for (let x = 2; x < 8; x++) {
    setCell(grid, x, 14, 223, 2) // Top half block
    setCell(grid, x, 15, 219, 2) // Solid block
  }

  // Platform 2: center, higher
  for (let x = 10; x < 18; x++) {
    setCell(grid, x, 10, 223, 2)
    setCell(grid, x, 11, 219, 2)
  }

  // Platform 3: right side, mid height
  for (let x = 20; x < 26; x++) {
    setCell(grid, x, 14, 223, 2)
    setCell(grid, x, 15, 219, 2)
  }

  // Floating blocks (coin-like)
  setCell(grid, 5, 8, 36, 3) // $ - coin
  setCell(grid, 14, 6, 36, 3)
  setCell(grid, 22, 8, 36, 3)

  // Clouds (using * and @ characters)
  setCell(grid, 4, 3, 42, 0) // *
  setCell(grid, 5, 3, 42, 0)
  setCell(grid, 6, 3, 42, 0)
  setCell(grid, 5, 2, 42, 0)

  setCell(grid, 18, 4, 42, 0)
  setCell(grid, 19, 4, 42, 0)
  setCell(grid, 20, 4, 42, 0)
  setCell(grid, 19, 3, 42, 0)

  // Pipes (using | and _)
  setCell(grid, 24, 17, 186, 1) // Vertical line
  setCell(grid, 24, 18, 186, 1)
  setCell(grid, 24, 19, 186, 1)
  setCell(grid, 23, 17, 205, 1) // Horizontal line (top)
  setCell(grid, 25, 17, 205, 1)

  return grid
}

/**
 * Title screen background
 * Decorative border with space for title text
 */
export function createTitleScreenGrid(): BgGridData {
  const grid = createEmptyGrid()

  // Double-line border using box drawing characters
  // Top border
  for (let x = 1; x < BG_GRID.COLS - 1; x++) {
    setCell(grid, x, 1, 205, 2)
    setCell(grid, x, 2, 196, 1)
  }

  // Bottom border
  for (let x = 1; x < BG_GRID.COLS - 1; x++) {
    setCell(grid, x, BG_GRID.ROWS - 2, 205, 2)
    setCell(grid, x, BG_GRID.ROWS - 3, 196, 1)
  }

  // Side borders
  for (let y = 2; y < BG_GRID.ROWS - 2; y++) {
    setCell(grid, 1, y, 186, 2)
    setCell(grid, 2, y, 179, 1)
    setCell(grid, BG_GRID.COLS - 2, y, 186, 2)
    setCell(grid, BG_GRID.COLS - 3, y, 179, 1)
  }

  // Corner pieces
  setCell(grid, 1, 1, 201, 2) // Top-left
  setCell(grid, BG_GRID.COLS - 2, 1, 187, 2) // Top-right
  setCell(grid, 1, BG_GRID.ROWS - 2, 200, 2) // Bottom-left
  setCell(grid, BG_GRID.COLS - 2, BG_GRID.ROWS - 2, 188, 2) // Bottom-right

  // Stars scattered around
  const starPositions: Array<[number, number]> = [
    [4, 4], [8, 5], [20, 4], [24, 6],
    [5, 16], [22, 17], [10, 18], [18, 16],
  ]
  for (const [x, y] of starPositions) {
    setCell(grid, x, y, 42, 3) // *
  }

  // Decorative hearts
  const heartPositions: Array<[number, number]> = [
    [6, 8], [22, 8], [6, 14], [22, 14],
  ]
  for (const [x, y] of heartPositions) {
    setCell(grid, x, y, 3, 1) // Heart character
  }

  return grid
}

/**
 * Simple test pattern for VIEW command testing
 * Numbers and letters to verify correct rendering
 */
export function createTestPatternGrid(): BgGridData {
  const grid = createEmptyGrid()

  // Row of numbers at top
  for (let i = 0; i < 10; i++) {
    setCell(grid, i + 9, 2, 48 + i, 2) // 0-9
  }

  // Row of letters
  for (let i = 0; i < 10; i++) {
    setCell(grid, i + 9, 4, 65 + i, 3) // A-J
  }

  // Color test - same character with different colors
  for (let i = 0; i < 4; i++) {
    setCell(grid, i + 12, 6, 35, i as 0 | 1 | 2 | 3) // # with 4 colors
  }

  // Simple smiley face
  setCell(grid, 13, 10, 219, 2) // Left eye
  setCell(grid, 15, 10, 219, 2) // Right eye
  setCell(grid, 12, 12, 95, 2) // _
  setCell(grid, 13, 12, 95, 2)
  setCell(grid, 14, 12, 95, 2)
  setCell(grid, 15, 12, 95, 2)
  setCell(grid, 16, 12, 95, 2)

  // Border
  for (let x = 0; x < BG_GRID.COLS; x++) {
    setCell(grid, x, 0, 45, 1) // -
    setCell(grid, x, BG_GRID.ROWS - 1, 45, 1)
  }

  return grid
}

/**
 * Layer visualization box frame - simple border to show BG GRAPHIC boundaries
 * Used with printableArea sample to visualize all 3 screen layers
 */
export function createLayerBoxGrid(): BgGridData {
  const grid = createEmptyGrid()

  // Draw a simple box frame using CHR$(254) - different from CHR$(255) used in printable area
  // Top and bottom borders
  for (let x = 0; x < BG_GRID.COLS; x++) {
    setCell(grid, x, 0, 254, 1) // Top border
    setCell(grid, x, BG_GRID.ROWS - 1, 254, 1) // Bottom border
  }

  // Left and right borders
  for (let y = 0; y < BG_GRID.ROWS; y++) {
    setCell(grid, 0, y, 254, 1) // Left border
    setCell(grid, BG_GRID.COLS - 1, y, 254, 1) // Right border
  }

  return grid
}
