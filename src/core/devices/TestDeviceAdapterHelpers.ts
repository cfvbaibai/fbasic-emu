/**
 * Test Device Adapter Helpers
 *
 * Standalone functions that operate on TestDeviceAdapter state.
 * Extracted from TestDeviceAdapter.ts for modularity and testability.
 *
 * Handles: Output aggregation, output querying, palette combination,
 * and default palette data.
 */

// ============================================================================
// Output Aggregation
// ============================================================================

/**
 * Aggregate all captured outputs into a single string.
 *
 * - Print outputs are included as-is
 * - Debug outputs are prefixed with "DEBUG: "
 * - Error outputs are prefixed with "RUNTIME: "
 * - Outputs ending with newline are kept as-is
 * - Outputs not ending with newline are concatenated directly
 */
export function aggregateAllOutputs(
  printOutputs: string[],
  debugOutputs: string[],
  errorOutputs: string[]
): string {
  const allOutputs = [
    ...printOutputs,
    ...debugOutputs.map(o => `DEBUG: ${o}`),
    ...errorOutputs.map(o => `RUNTIME: ${o}`),
  ]

  if (allOutputs.length === 0) return ''

  let result = ''
  for (const output of allOutputs) {
    result += output
  }
  return result
}

// ============================================================================
// Output Querying
// ============================================================================

/**
 * Check if a specific output was captured in the given output array.
 */
export function hasOutputInArray(outputs: string[], target: string): boolean {
  return outputs.includes(target)
}

// ============================================================================
// Palette Combination
// ============================================================================

/** Color tuple used for palette combinations. */
type ColorTuple = [number, number, number, number]

/**
 * Apply a palette combination to the runtime palettes.
 *
 * For background ('B'): updates runtimeBackgroundPalettes at the given index.
 * For sprite ('S'): updates runtimeSpritePalettes at the given index.
 *
 * @returns The recorded palette combination call data
 */
export function applyPaletteCombination(
  target: 'B' | 'S',
  combination: number,
  colors: ColorTuple,
  currentBgPaletteIndex: number,
  currentSpritePaletteIndex: number,
  backgroundPalettes: ColorTuple[][],
  spritePalettes: ColorTuple[][]
): { target: 'B' | 'S'; paletteIndex: number; combination: number; colors: ColorTuple } {
  if (target === 'B') {
    const paletteIndex = Math.max(0, Math.min(1, currentBgPaletteIndex))
    backgroundPalettes[paletteIndex]![combination] = colors
    return { target, paletteIndex, combination, colors }
  }

  const paletteIndex = Math.max(0, Math.min(2, currentSpritePaletteIndex))
  spritePalettes[paletteIndex]![combination] = colors
  return { target, paletteIndex, combination, colors }
}

// ============================================================================
// Default Palette Data — re-exported from the single source of truth.
// The raw palette values are defined once in palette.ts (RAW_* constants)
// and exposed as immutable ORIGINAL_* arrays. Re-exporting them here avoids
// a third copy of the same data.
// ============================================================================

export {
  ORIGINAL_BACKGROUND_PALETTES as DEFAULT_BACKGROUND_PALETTES,
  ORIGINAL_SPRITE_PALETTES as DEFAULT_SPRITE_PALETTES,
} from '@/shared/data/palette'
