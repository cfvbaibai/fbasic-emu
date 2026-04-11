/**
 * Screen State Manager
 *
 * Manages screen buffer, cursor position, and screen-related operations.
 * Palette state is delegated to ScreenPaletteState.
 */

import type { ScreenCell } from '@/core/types/execution-types'
import type { ScreenUpdateMessage } from '@/core/types/worker-messages'
import { logDevice } from '@/shared/logger'

import type { PaletteCombinationSnapshot } from './ScreenPaletteState'
import { ScreenPaletteState } from './ScreenPaletteState'
import {
  createBackdropUpdateMessage,
  createCgenUpdateMessage,
  createClearUpdateMessage,
  createColorUpdateMessage,
  createCursorUpdateMessage,
  createFullUpdateMessage,
  createPaletteUpdateMessage,
} from './ScreenUpdateMessageFactory'

export type { PaletteCombinationEntry, PaletteCombinationSnapshot } from './ScreenPaletteState'

export class ScreenStateManager {
  private screenBuffer: ScreenCell[][] = []
  private cursorX = 0
  private cursorY = 0
  private currentExecutionId: string | null = null
  private readonly paletteState = new ScreenPaletteState()

  constructor() {
    this.initializeScreen()
  }

  /**
   * Reset all screen state to defaults for a new execution.
   * Called when a new RUN starts to clear BG data, palettes, and other
   * state that would otherwise persist from a previous run.
   */
  resetState(): void {
    this.initializeScreen()
  }

  /**
   * Initialize the screen buffer and reset all screen state to defaults.
   */
  initializeScreen(): void {
    // Initialize empty 28×24 grid
    this.screenBuffer = []
    for (let y = 0; y < 24; y++) {
      const row: ScreenCell[] = []
      for (let x = 0; x < 28; x++) {
        row.push({ character: ' ', colorPattern: 0, x, y })
      }
      this.screenBuffer.push(row)
    }
    this.cursorX = 0
    this.cursorY = 0
    // Reset BG/screen state to defaults so stale data does not persist
    this.paletteState.resetState()
  }

  /**
   * Get the current screen buffer
   */
  getScreenBuffer(): ScreenCell[][] {
    return this.screenBuffer
  }

  /**
   * Get cursor position
   */
  getCursorPosition(): { x: number; y: number } {
    return { x: this.cursorX, y: this.cursorY }
  }

  /**
   * Get screen cell at position (x, y)
   * Returns character or color pattern based on colorSwitch
   * @param x - Column (0-27)
   * @param y - Row (0-23)
   * @param colorSwitch - 0 for character (default), 1 for color pattern
   * @returns Character string or color pattern number (0-3)
   */
  getScreenCell(x: number, y: number, colorSwitch = 0): string | number {
    // Clamp coordinates to valid range
    x = Math.max(0, Math.min(27, x))
    y = Math.max(0, Math.min(23, y))

    const cell = this.screenBuffer[y]?.[x]
    if (!cell) {
      return colorSwitch === 1 ? 0 : ' '
    }

    if (colorSwitch === 1) {
      return cell.colorPattern
    }
    return cell.character
  }

  /**
   * Set cursor position
   */
  setCursorPosition(x: number, y: number): void {
    // Validate ranges
    if (x < 0 || x > 27 || y < 0 || y > 23) {
      logDevice.warn(`Invalid cursor position: (${x}, ${y}), clamping to valid range`)
      x = Math.max(0, Math.min(27, x))
      y = Math.max(0, Math.min(23, y))
    }

    this.cursorX = x
    this.cursorY = y
  }

  /**
   * Scroll screen up by one line: drop top row, shift content up, add empty row at bottom.
   */
  private scrollUp(): void {
    this.screenBuffer.shift()
    const newRow: ScreenCell[] = []
    for (let x = 0; x < 28; x++) {
      newRow.push({ character: ' ', colorPattern: 0, x, y: 23 })
    }
    this.screenBuffer.push(newRow)
    // Cursor stays on last line (y=23) so new content appears at bottom
    this.cursorY = 23
  }

  /**
   * Write a character to the screen at the current cursor position
   */
  writeCharacter(char: string): void {
    // Handle newline
    if (char === '\n') {
      this.cursorX = 0
      this.cursorY++
      if (this.cursorY >= 24) {
        this.scrollUp()
      }
      return
    }

    // Write character at cursor position
    if (this.cursorY < 24 && this.cursorX < 28) {
      this.screenBuffer[this.cursorY] ??= []
      const row = this.screenBuffer[this.cursorY]!
      let cell = row[this.cursorX]
      if (!cell) {
        cell = {
          character: ' ',
          colorPattern: 0,
          x: this.cursorX,
          y: this.cursorY,
        }
        row[this.cursorX] = cell
      }
      cell.character = char

      // Advance cursor
      this.cursorX++
      if (this.cursorX >= 28) {
        this.cursorX = 0
        this.cursorY++
        if (this.cursorY >= 24) {
          this.scrollUp()
        }
      }
    }
  }

  /**
   * Set color pattern for a 2×2 area containing the specified position
   */
  setColorPattern(x: number, y: number, pattern: number): Array<{ x: number; y: number; pattern: number }> {
    // Validate ranges
    if (x < 0 || x > 27 || y < 0 || y > 23) {
      logDevice.warn(`Invalid color position: (${x}, ${y}), clamping to valid range`)
      x = Math.max(0, Math.min(27, x))
      y = Math.max(0, Math.min(23, y))
    }

    if (pattern < 0 || pattern > 3) {
      logDevice.warn(`Invalid color pattern: ${pattern}, clamping to valid range (0-3)`)
      pattern = Math.max(0, Math.min(3, pattern))
    }

    // Calculate the 2×2 area containing position (x, y)
    const areaX = Math.floor(x / 2) * 2 // Round down to even number (0, 2, 4, ...)
    const areaY = y // The y coordinate itself is the bottom row of the area

    // Update color pattern for all 4 cells in the 2×2 area
    const cellsToUpdate: Array<{ x: number; y: number; pattern: number }> = []

    // Top-left: (areaX, areaY - 1) or (areaX, 0) if areaY is 0
    const topY = areaY > 0 ? areaY - 1 : 0
    if (areaX < 28 && topY < 24) {
      const cell = this.screenBuffer[topY]?.[areaX]
      if (cell) {
        cell.colorPattern = pattern
        cellsToUpdate.push({ x: areaX, y: topY, pattern })
      }
    }

    // Top-right: (areaX + 1, areaY - 1) or (areaX + 1, 0) if areaY is 0
    if (areaX + 1 < 28 && topY < 24) {
      const row = this.screenBuffer[topY]
      const cell = row?.[areaX + 1]
      if (cell) {
        cell.colorPattern = pattern
        cellsToUpdate.push({ x: areaX + 1, y: topY, pattern })
      }
    }

    // Bottom-left: (areaX, areaY)
    if (areaX < 28 && areaY < 24) {
      const row = this.screenBuffer[areaY]
      const cell = row?.[areaX]
      if (cell) {
        cell.colorPattern = pattern
        cellsToUpdate.push({ x: areaX, y: areaY, pattern })
      }
    }

    // Bottom-right: (areaX + 1, areaY)
    if (areaX + 1 < 28 && areaY < 24) {
      const row = this.screenBuffer[areaY]
      const cell = row?.[areaX + 1]
      if (cell) {
        cell.colorPattern = pattern
        cellsToUpdate.push({ x: areaX + 1, y: areaY, pattern })
      }
    }

    return cellsToUpdate
  }

  // === Palette delegation methods ===

  /**
   * Set color palette
   */
  setColorPalette(bgPalette: number, spritePalette: number): void {
    this.paletteState.setColorPalette(bgPalette, spritePalette)
  }

  /**
   * Set backdrop color
   */
  setBackdropColor(colorCode: number): void {
    this.paletteState.setBackdropColor(colorCode)
  }

  /**
   * Set character generator mode
   */
  setCharacterGeneratorMode(mode: number): void {
    this.paletteState.setCharacterGeneratorMode(mode)
  }

  /**
   * Get palette values
   */
  getPalette(): { bgPalette: number; spritePalette: number } {
    return this.paletteState.getPalette()
  }

  /**
   * Get all background and sprite palette combination data.
   * Used by DeviceScreenManager to send palette-combination reset messages
   * to the main thread when a new execution starts.
   */
  getAllPaletteCombinations(): PaletteCombinationSnapshot {
    return this.paletteState.getAllPaletteCombinations()
  }

  /**
   * Set a PALET color combination for the currently selected CGSET palette.
   */
  setPaletteCombination(
    target: 'B' | 'S',
    combination: number,
    colors: [number, number, number, number]
  ): { paletteIndex: number; colors: [number, number, number, number] } {
    return this.paletteState.setPaletteCombination(target, combination, colors)
  }

  /**
   * Get backdrop color
   */
  getBackdropColor(): number {
    return this.paletteState.getBackdropColor()
  }

  /**
   * Get CGEN mode
   */
  getCgenMode(): number {
    return this.paletteState.getCgenMode()
  }

  // === Execution ID ===

  /**
   * Set current execution ID
   */
  setCurrentExecutionId(executionId: string | null): void {
    this.currentExecutionId = executionId
  }

  /**
   * Get current execution ID
   */
  getCurrentExecutionId(): string | null {
    return this.currentExecutionId
  }

  // === Update message creation ===

  /**
   * Create a full screen update message.
   * Defensive: if called without correct `this` (e.g. unbound), return a safe message.
   */
  createFullScreenUpdateMessage(): ScreenUpdateMessage {
    const self = this as ScreenStateManager | undefined
    return createFullUpdateMessage(
      self?.currentExecutionId ?? 'unknown',
      self?.screenBuffer ?? [],
      self?.cursorX ?? 0,
      self?.cursorY ?? 0,
    )
  }

  /** Create a cursor update message */
  createCursorUpdateMessage(): ScreenUpdateMessage {
    return createCursorUpdateMessage(
      this.currentExecutionId ?? 'unknown',
      this.cursorX,
      this.cursorY,
    )
  }

  /** Create a clear screen update message */
  createClearScreenUpdateMessage(): ScreenUpdateMessage {
    return createClearUpdateMessage(this.currentExecutionId ?? 'unknown')
  }

  /** Create a color pattern update message */
  createColorUpdateMessage(cellsToUpdate: Array<{ x: number; y: number; pattern: number }>): ScreenUpdateMessage {
    return createColorUpdateMessage(this.currentExecutionId ?? 'unknown', cellsToUpdate)
  }

  /** Create a palette update message */
  createPaletteUpdateMessage(): ScreenUpdateMessage {
    const { bgPalette, spritePalette } = this.paletteState.getPalette()
    return createPaletteUpdateMessage(
      this.currentExecutionId ?? 'unknown',
      bgPalette,
      spritePalette,
    )
  }

  /** Create a backdrop color update message */
  createBackdropUpdateMessage(): ScreenUpdateMessage {
    return createBackdropUpdateMessage(this.currentExecutionId ?? 'unknown', this.paletteState.getBackdropColor())
  }

  /** Create a CGEN mode update message */
  createCgenUpdateMessage(): ScreenUpdateMessage {
    return createCgenUpdateMessage(this.currentExecutionId ?? 'unknown', this.paletteState.getCgenMode())
  }
}
