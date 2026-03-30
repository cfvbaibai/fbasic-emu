/**
 * Device BG Graphic Helpers
 *
 * Standalone functions for BG GRAPHIC operations in WebWorkerDeviceAdapter.
 * Extracted from WebWorkerDeviceAdapter.ts for modularity.
 *
 * Handles: VIEW command (copy BG GRAPHIC data to background screen).
 */

import type { ScreenCell } from '@/core/types/execution-types'
import type { BgGridData } from '@/features/bg-editor/types'

/**
 * Copy BG GRAPHIC data to a screen buffer.
 *
 * BG GRAPHIC (28x21) and Background Screen (28x24) share the same origin
 * on the sprite screen. Per the sprite coordinate formula y = (Y x 8) + 24,
 * BG GRAPHIC Y=0 appears at sprite y=24. The canvas renderer already applies
 * this +24 pixel offset (BG_OFFSET_Y), so BG rows map directly to screen buffer
 * rows without additional offset.
 *
 * Per F-BASIC Manual page 36.
 */
export function copyBgGraphicToScreenBuffer(bgGridData: BgGridData, screenBuffer: ScreenCell[][]): void {
  for (let gridRow = 0; gridRow < bgGridData.length; gridRow++) {
    const bgRow = bgGridData[gridRow]
    if (!bgRow) continue
    const screenRow = gridRow
    if (screenRow >= 24) break
    for (let col = 0; col < bgRow.length && col < 28; col++) {
      const bgCell = bgRow[col]
      if (!bgCell) continue
      const screenCell = screenBuffer[screenRow]?.[col]
      if (screenCell) {
        screenCell.character = String.fromCharCode(bgCell.charCode)
        screenCell.colorPattern = bgCell.colorPattern
      }
    }
  }
}
