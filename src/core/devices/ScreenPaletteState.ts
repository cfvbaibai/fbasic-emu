/**
 * Screen Palette State
 *
 * Manages palette combination arrays, palette selection indices,
 * backdrop color, and character generator mode for the screen.
 *
 * Extracted from ScreenStateManager to separate palette state
 * management from screen buffer/cursor operations.
 */

import { PALETTE_DEFAULTS, type PaletteStateValues, resetPaletteState } from '@/core/constants'
import { ORIGINAL_BACKGROUND_PALETTES, ORIGINAL_SPRITE_PALETTES } from '@/shared/data/palette'
import { logDevice } from '@/shared/logger'

export type PaletteCombinationEntry = {
  paletteIndex: number
  combination: number
  colors: [number, number, number, number]
}

export type PaletteCombinationSnapshot = {
  background: PaletteCombinationEntry[]
  sprite: PaletteCombinationEntry[]
}

export class ScreenPaletteState {
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

  /**
   * Reset palette state to defaults.
   * Called when a new RUN starts to clear stale palette data.
   */
  resetState(): void {
    resetPaletteState(this as PaletteStateValues)
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
   * Set color palette selection indices.
   */
  setColorPalette(bgPalette: number, spritePalette: number): void {
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
   * Set backdrop color.
   */
  setBackdropColor(colorCode: number): void {
    if (colorCode < 0 || colorCode > 60) {
      logDevice.warn(`Invalid backdrop color code: ${colorCode}, clamping to valid range (0-60)`)
      colorCode = Math.max(0, Math.min(60, colorCode))
    }

    this.backdropColor = colorCode
  }

  /**
   * Set character generator mode.
   */
  setCharacterGeneratorMode(mode: number): void {
    if (mode < 0 || mode > 3) {
      logDevice.warn(`Invalid CGEN mode: ${mode}, clamping to valid range (0-3)`)
      mode = Math.max(0, Math.min(3, mode))
    }

    this.cgenMode = mode
  }

  /**
   * Get palette selection indices.
   */
  getPalette(): { bgPalette: number; spritePalette: number } {
    return { bgPalette: this.bgPalette, spritePalette: this.spritePalette }
  }

  /**
   * Get backdrop color.
   */
  getBackdropColor(): number {
    return this.backdropColor
  }

  /**
   * Get CGEN mode.
   */
  getCgenMode(): number {
    return this.cgenMode
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
}
