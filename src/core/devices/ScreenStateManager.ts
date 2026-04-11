/**
 * Screen State Manager
 *
 * Manages screen buffer, cursor position, and screen-related operations.
 */

import { PALETTE_DEFAULTS, resetPaletteState } from '@/core/constants'
import type { ScreenCell } from '@/core/types/execution-types'
import type { ScreenUpdateMessage } from '@/core/types/worker-messages'
import { ORIGINAL_BACKGROUND_PALETTES, ORIGINAL_SPRITE_PALETTES } from '@/shared/data/palette'
import { logDevice } from '@/shared/logger'

import {
  createBackdropUpdateMessage,
  createCgenUpdateMessage,
  createClearUpdateMessage,
  createColorUpdateMessage,
  createCursorUpdateMessage,
  createFullUpdateMessage,
  createPaletteUpdateMessage,
} from './ScreenUpdateMessageFactory'

type PaletteCombinationEntry = {
  paletteIndex: number
  combination: number
  colors: [number, number, number, number]
}

export type PaletteCombinationSnapshot = {
  background: PaletteCombinationEntry[]
  sprite: PaletteCombinationEntry[]
}

export class ScreenStateManager {
  private screenBuffer: ScreenCell[][] = []
  private cursorX = 0
  private cursorY = 0
  private bgPalette: number = PALETTE_DEFAULTS.BG_PALETTE
  private spritePalette: number = PALETTE_DEFAULTS.SPRITE_PALETTE
  private readonly backgroundPalettes = ORIGINAL_BACKGROUND_PALETTES.map(palette =>
    palette.map(combination => [...combination] as [number, number, number, number])
  ) as [[number, number, number, number][], [number, number, number, number][]]
  private readonly spritePalettes = ORIGINAL_SPRITE_PALETTES.map(palette =>
    palette.map(combination => [...combination] as [number, number, number, number])
  ) as [
    [number, number, number, number][],
    [number, number, number, number][],
    [number, number, number, number][],
  ]
  private backdropColor: number = PALETTE_DEFAULTS.BACKDROP_COLOR
  private cgenMode: number = PALETTE_DEFAULTS.CGEN_MODE
  private currentExecutionId: string | null = null

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
    resetPaletteState((d) => {
      this.bgPalette = d.BG_PALETTE
      this.spritePalette = d.SPRITE_PALETTE
      this.backdropColor = d.BACKDROP_COLOR
      this.cgenMode = d.CGEN_MODE
    })
    // Reset palette combinations to original data
    this.resetPalettes()
  }

  /**
   * Reset palette combination arrays to original palette data.
   * Uses ORIGINAL_* constants (immutable) rather than the mutable
   * BACKGROUND_PALETTES/SPRITE_PALETTES which may have been corrupted
   * by setRuntimePaletteCombination() on the main thread.
   */
  private resetPalettes(): void {
    for (let i = 0; i < this.backgroundPalettes.length; i++) {
      const source = ORIGINAL_BACKGROUND_PALETTES[i]!
      const target = this.backgroundPalettes[i]!
      for (let j = 0; j < source.length; j++) {
        target[j] = [...source[j]!] as [number, number, number, number]
      }
    }
    for (let i = 0; i < this.spritePalettes.length; i++) {
      const source = ORIGINAL_SPRITE_PALETTES[i]!
      const target = this.spritePalettes[i]!
      for (let j = 0; j < source.length; j++) {
        target[j] = [...source[j]!] as [number, number, number, number]
      }
    }
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

  /**
   * Set color palette
   */
  setColorPalette(bgPalette: number, spritePalette: number): void {
    // Validate ranges
    if (bgPalette < 0 || bgPalette > 1) {
      logDevice.warn(`Invalid background palette: ${bgPalette}, clamping to valid range (0-1)`)
      bgPalette = Math.max(0, Math.min(1, bgPalette))
    }

    if (spritePalette < 0 || spritePalette > 2) {
      logDevice.warn(`Invalid sprite palette: ${spritePalette}, clamping to valid range (0-2)`)
      spritePalette = Math.max(0, Math.min(2, spritePalette))
    }

    this.bgPalette = bgPalette
    this.spritePalette = spritePalette
  }

  /**
   * Set backdrop color
   */
  setBackdropColor(colorCode: number): void {
    // Validate range (0-60)
    if (colorCode < 0 || colorCode > 60) {
      logDevice.warn(`Invalid backdrop color code: ${colorCode}, clamping to valid range (0-60)`)
      colorCode = Math.max(0, Math.min(60, colorCode))
    }

    this.backdropColor = colorCode
  }

  /**
   * Set character generator mode
   */
  setCharacterGeneratorMode(mode: number): void {
    // Validate range
    if (mode < 0 || mode > 3) {
      logDevice.warn(`Invalid CGEN mode: ${mode}, clamping to valid range (0-3)`)
      mode = Math.max(0, Math.min(3, mode))
    }

    this.cgenMode = mode
  }

  /**
   * Get palette values
   */
  getPalette(): { bgPalette: number; spritePalette: number } {
    return { bgPalette: this.bgPalette, spritePalette: this.spritePalette }
  }

  /**
   * Collect palette combination entries for a single palette group.
   * Iterates all palettes and their combinations, producing a flat list
   * of entries with palette index, combination index, and color values.
   */
  private collectPaletteEntries(
    palettes: readonly (readonly [number, number, number, number])[][],
  ): PaletteCombinationEntry[] {
    const entries: PaletteCombinationEntry[] = []
    for (let i = 0; i < palettes.length; i++) {
      const palette = palettes[i]!
      for (let j = 0; j < palette.length; j++) {
        const colors = [...palette[j]!] as [number, number, number, number]
        entries.push({ paletteIndex: i, combination: j, colors })
      }
    }
    return entries
  }

  /**
   * Get all background and sprite palette combination data.
   * Used by DeviceScreenManager to send palette-combination reset messages
   * to the main thread when a new execution starts.
   */
  getAllPaletteCombinations(): PaletteCombinationSnapshot {
    return {
      background: this.collectPaletteEntries(this.backgroundPalettes),
      sprite: this.collectPaletteEntries(this.spritePalettes),
    }
  }

  /**
   * Set a PALET color combination for the currently selected CGSET palette.
   */
  setPaletteCombination(
    target: 'B' | 'S',
    combination: number,
    colors: [number, number, number, number]
  ): { paletteIndex: number; colors: [number, number, number, number] } {
    const clampedCombination = Math.max(0, Math.min(3, combination))
    const clampedColors: [number, number, number, number] = [
      Math.max(0, Math.min(60, colors[0] ?? 0)),
      Math.max(0, Math.min(60, colors[1] ?? 0)),
      Math.max(0, Math.min(60, colors[2] ?? 0)),
      Math.max(0, Math.min(60, colors[3] ?? 0)),
    ]

    if (target === 'B') {
      const paletteIndex = Math.max(0, Math.min(1, this.bgPalette))
      const palette = this.backgroundPalettes[paletteIndex]
      if (palette) {
        palette[clampedCombination] = clampedColors
      }
      return { paletteIndex, colors: clampedColors }
    }

    const paletteIndex = Math.max(0, Math.min(2, this.spritePalette))
    const palette = this.spritePalettes[paletteIndex]
    if (palette) {
      palette[clampedCombination] = clampedColors
    }
    return { paletteIndex, colors: clampedColors }
  }

  /**
   * Get backdrop color
   */
  getBackdropColor(): number {
    return this.backdropColor
  }

  /**
   * Get CGEN mode
   */
  getCgenMode(): number {
    return this.cgenMode
  }

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
    return createPaletteUpdateMessage(
      this.currentExecutionId ?? 'unknown',
      this.bgPalette,
      this.spritePalette,
    )
  }

  /** Create a backdrop color update message */
  createBackdropUpdateMessage(): ScreenUpdateMessage {
    return createBackdropUpdateMessage(this.currentExecutionId ?? 'unknown', this.backdropColor)
  }

  /** Create a CGEN mode update message */
  createCgenUpdateMessage(): ScreenUpdateMessage {
    return createCgenUpdateMessage(this.currentExecutionId ?? 'unknown', this.cgenMode)
  }
}
