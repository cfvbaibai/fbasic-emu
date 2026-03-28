/**
 * Test Device Adapter Helpers
 *
 * Standalone functions that operate on TestDeviceAdapter state.
 * Extracted from TestDeviceAdapter.ts for modularity and testability.
 *
 * Handles: Output aggregation, output querying, and state reset.
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
// Default Palette Data
// ============================================================================

/** Default background palettes used by TestDeviceAdapter. */
export const DEFAULT_BACKGROUND_PALETTES: ColorTuple[][] = [
  [
    [0x00, 0x2c, 0x15, 0x07],
    [0x00, 0x27, 0x21, 0x12],
    [0x00, 0x29, 0x36, 0x17],
    [0x00, 0x30, 0x26, 0x07],
  ],
  [
    [0x00, 0x30, 0x21, 0x02],
    [0x00, 0x30, 0x27, 0x18],
    [0x00, 0x30, 0x27, 0x16],
    [0x00, 0x29, 0x36, 0x17],
  ],
]

/** Default sprite palettes used by TestDeviceAdapter. */
export const DEFAULT_SPRITE_PALETTES: ColorTuple[][] = [
  [
    [0x00, 0x36, 0x16, 0x02],
    [0x00, 0x27, 0x30, 0x19],
    [0x00, 0x35, 0x25, 0x17],
    [0x00, 0x30, 0x27, 0x16],
  ],
  [
    [0x00, 0x30, 0x16, 0x01],
    [0x00, 0x10, 0x00, 0x01],
    [0x00, 0x30, 0x29, 0x09],
    [0x00, 0x30, 0x16, 0x07],
  ],
  [
    [0x00, 0x30, 0x26, 0x12],
    [0x00, 0x30, 0x15, 0x12],
    [0x00, 0x30, 0x12, 0x16],
    [0x00, 0x30, 0x26, 0x19],
  ],
]
