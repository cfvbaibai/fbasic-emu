/**
 * Test Screen Capture
 *
 * Records screen output and display state for test assertions.
 * Owns all text output capture, color/palette tracking, cursor state,
 * CGEN mode, and backdrop color for the TestDeviceAdapter.
 *
 * This module has a single responsibility: capturing and querying
 * the visual output state of the device. It can be used independently
 * of TestDeviceAdapter for any test that needs to verify screen behavior.
 */

import {
  aggregateAllOutputs,
  applyPaletteCombination,
  DEFAULT_BACKGROUND_PALETTES,
  DEFAULT_SPRITE_PALETTES,
} from './TestDeviceAdapterHelpers'

// ============================================================================
// Types
// ============================================================================

/** Color tuple used for palette data. */
type ColorTuple = [number, number, number, number]

/** Record of a single palette combination call. */
export interface PaletteCombinationRecord {
  target: 'B' | 'S'
  paletteIndex: number
  combination: number
  colors: ColorTuple
}

/** Record of a color palette call. */
export interface ColorPaletteRecord {
  bgPalette: number
  spritePalette: number
}

/** Record of a color pattern call. */
export interface ColorPatternRecord {
  x: number
  y: number
  pattern: number
}

// ============================================================================
// TestScreenCapture
// ============================================================================

/**
 * Captures and queries screen output and display state for test assertions.
 *
 * Provides recorded arrays for all text output types (print, debug, error),
 * tracks color/palette changes, cursor position, CGEN mode, and backdrop color.
 * Includes query methods for test assertions.
 */
export class TestScreenCapture {
  // === OUTPUT CAPTURE ===
  public printOutputs: string[] = []
  public debugOutputs: string[] = []
  public errorOutputs: string[] = []
  public clearScreenCalls = 0
  public cursorPosition: { x: number; y: number } = { x: 0, y: 0 }

  // === COLOR / PALETTE STATE ===
  public colorPatternCalls: ColorPatternRecord[] = []
  public colorPaletteCalls: ColorPaletteRecord[] = []
  public paletteCombinationCalls: PaletteCombinationRecord[] = []
  public currentColorPalette: ColorPaletteRecord = { bgPalette: 1, spritePalette: 1 }
  public runtimeBackgroundPalettes = DEFAULT_BACKGROUND_PALETTES.map(
    p => p.map(c => [...c] as ColorTuple)
  )
  public runtimeSpritePalettes = DEFAULT_SPRITE_PALETTES.map(
    p => p.map(c => [...c] as ColorTuple)
  )

  // === BACKDROP & CGEN ===
  public backdropColorCalls: number[] = []
  public currentBackdropColor: number = 0 // Default backdrop color (0 = black)
  public cgenModeCalls: number[] = []
  public currentCgenMode: number = 2 // Default is 2 (B on BG, A on sprite)

  // === OUTPUT CAPTURE METHODS ===

  recordPrintOutput(output: string): void {
    this.printOutputs.push(output)
  }

  recordDebugOutput(output: string): void {
    this.debugOutputs.push(output)
  }

  recordErrorOutput(output: string): void {
    this.errorOutputs.push(output)
  }

  recordClearScreen(): void {
    this.clearScreenCalls++
    this.printOutputs = []
    this.debugOutputs = []
    this.errorOutputs = []
  }

  recordCursorPosition(x: number, y: number): void {
    this.cursorPosition = { x, y }
  }

  recordColorPattern(x: number, y: number, pattern: number): void {
    this.colorPatternCalls.push({ x, y, pattern })
  }

  recordColorPalette(bgPalette: number, spritePalette: number): void {
    this.colorPaletteCalls.push({ bgPalette, spritePalette })
    this.currentColorPalette = { bgPalette, spritePalette }
  }

  recordPaletteCombination(
    target: 'B' | 'S',
    combination: number,
    c1: number,
    c2: number,
    c3: number,
    c4: number
  ): void {
    const colors: ColorTuple = [c1, c2, c3, c4]
    const result = applyPaletteCombination(
      target,
      combination,
      colors,
      this.currentColorPalette.bgPalette,
      this.currentColorPalette.spritePalette,
      this.runtimeBackgroundPalettes,
      this.runtimeSpritePalettes
    )
    this.paletteCombinationCalls.push(result)
  }

  recordBackdropColor(colorCode: number): void {
    this.backdropColorCalls.push(colorCode)
    this.currentBackdropColor = colorCode
  }

  recordCgenMode(mode: number): void {
    this.cgenModeCalls.push(mode)
    this.currentCgenMode = mode
  }

  // === QUERY METHODS ===

  /**
   * Get all captured outputs as a single string.
   * Delegates to aggregateAllOutputs helper.
   */
  getAllOutputs(): string {
    return aggregateAllOutputs(this.printOutputs, this.debugOutputs, this.errorOutputs)
  }

  /**
   * Check if specific output was captured
   */
  hasOutput(output: string, type: 'print' | 'debug' | 'error' = 'print'): boolean {
    switch (type) {
      case 'print':
        return this.printOutputs.includes(output)
      case 'debug':
        return this.debugOutputs.includes(output)
      case 'error':
        return this.errorOutputs.includes(output)
      default:
        return false
    }
  }

  /**
   * Get the number of times clearScreen was called
   */
  getClearScreenCallCount(): number {
    return this.clearScreenCalls
  }

  /**
   * Clear all captured outputs (reset only outputs, not clearScreenCalls)
   */
  clearOutputs(): void {
    this.printOutputs = []
    this.debugOutputs = []
    this.errorOutputs = []
    this.clearScreenCalls = 0
  }
}
