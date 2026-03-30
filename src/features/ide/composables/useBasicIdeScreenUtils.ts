/**
 * Screen utilities for BASIC IDE
 */

import type { Ref } from 'vue'

import type { ScreenCell } from '@/core/types/execution-types'

/**
 * Initialize screen buffer as full grid for proper reactivity
 */
export function initializeScreenBuffer(): ScreenCell[][] {
  const grid: ScreenCell[][] = []
  for (let y = 0; y < 24; y++) {
    const row: ScreenCell[] = []
    for (let x = 0; x < 28; x++) {
      row.push({ character: ' ', colorPattern: 0, x, y })
    }
    grid.push(row)
  }
  return grid
}

/**
 * Clear screen buffer
 */
export function clearScreenBuffer(screenBuffer: Ref<ScreenCell[][]>, cursorX: Ref<number>, cursorY: Ref<number>): void {
  for (let y = 0; y < 24; y++) {
    const row = screenBuffer.value[y]
    if (row) {
      for (let x = 0; x < 28; x++) {
        const cell = row[x]
        if (cell) {
          cell.character = ' '
        }
      }
    }
  }
  cursorX.value = 0
  cursorY.value = 0
}
