/**
 * Buffer Scalar Operations
 *
 * Standalone functions for reading/writing scalar values in the shared display buffer.
 * Extracted from SharedDisplayBufferAccessor for modularity.
 *
 * Scalars occupy 4 bytes in the buffer and control display properties:
 * - bgPalette (index 0): background palette selection (0-1)
 * - spritePalette (index 1): sprite palette selection (0-3)
 * - backdropColor (index 2): backdrop color (0-60)
 * - cgenMode (index 3): character generation mode (0-3)
 */

// ============================================================================
// Individual Scalar Read/Write Operations
// ============================================================================

/**
 * Read background palette (0-1).
 */
export function readBgPalette(scalarsView: Uint8Array): number {
  return scalarsView[0] ?? 1
}

/**
 * Write background palette. Masks to 0-1.
 */
export function writeBgPalette(scalarsView: Uint8Array, value: number): void {
  scalarsView[0] = value & 1
}

/**
 * Read sprite palette (0-3).
 */
export function readSpritePalette(scalarsView: Uint8Array): number {
  return scalarsView[1] ?? 1
}

/**
 * Write sprite palette. Masks to 0-3.
 */
export function writeSpritePalette(scalarsView: Uint8Array, value: number): void {
  scalarsView[1] = value & 3
}

/**
 * Read backdrop color (0-60).
 */
export function readBackdropColor(scalarsView: Uint8Array): number {
  return scalarsView[2] ?? 0
}

/**
 * Write backdrop color. Clamps to 0-60.
 */
export function writeBackdropColor(scalarsView: Uint8Array, value: number): void {
  scalarsView[2] = Math.max(0, Math.min(60, value))
}

/**
 * Read character generation mode (0-3).
 */
export function readCgenMode(scalarsView: Uint8Array): number {
  return scalarsView[3] ?? 2
}

/**
 * Write character generation mode. Masks to 0-3.
 */
export function writeCgenMode(scalarsView: Uint8Array, value: number): void {
  scalarsView[3] = value & 3
}

// ============================================================================
// Bulk Scalar Operations
// ============================================================================

/**
 * Read all scalar values at once.
 */
export function readAllScalars(scalarsView: Uint8Array): {
  bgPalette: number
  spritePalette: number
  backdropColor: number
  cgenMode: number
} {
  return {
    bgPalette: readBgPalette(scalarsView),
    spritePalette: readSpritePalette(scalarsView),
    backdropColor: readBackdropColor(scalarsView),
    cgenMode: readCgenMode(scalarsView),
  }
}

/**
 * Write all scalar values at once.
 */
export function writeAllScalars(
  scalarsView: Uint8Array,
  bgPalette: number,
  spritePalette: number,
  backdropColor: number,
  cgenMode: number
): void {
  writeBgPalette(scalarsView, bgPalette)
  writeSpritePalette(scalarsView, spritePalette)
  writeBackdropColor(scalarsView, backdropColor)
  writeCgenMode(scalarsView, cgenMode)
}
