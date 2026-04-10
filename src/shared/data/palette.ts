// NES/Famicom 61-color palette (0x00 to 0x3C, indices 0-60)
// Based on PAL PPU (2C07) color table, modified for F-BASIC
// https://www.nesdev.org/wiki/PPU_palettes
// Note: 0x00 is black in F-BASIC (not NES grey) for backdrop/transparent color
export const COLORS = [
  '#000000', // 0x00 (0) - Black (F-BASIC default backdrop)
  '#002263', // 0x01 (1)
  '#0D107D', // 0x02 (2)
  '#2B027D', // 0x03 (3)
  '#440063', // 0x04 (4)
  '#530036', // 0x05 (5)
  '#530502', // 0x06 (6)
  '#441500', // 0x07 (7)
  '#2B2700', // 0x08 (8)
  '#0D3600', // 0x09 (9)
  '#003E00', // 0x0A (10)
  '#003D02', // 0x0B (11)
  '#003336', // 0x0C (12)
  '#000000', // 0x0D (13)
  '#000000', // 0x0E (14)
  '#000000', // 0x0F (15)
  '#ABABAB', // 0x10 (16)
  '#1251A8', // 0x11 (17)
  '#3438CB', // 0x12 (18)
  '#5C24CB', // 0x13 (19)
  '#7E19A8', // 0x14 (20)
  '#921B6B', // 0x15 (21)
  '#922924', // 0x16 (22)
  '#7E3F00', // 0x17 (23)
  '#5C5700', // 0x18 (24)
  '#346B00', // 0x19 (25)
  '#127600', // 0x1A (26)
  '#007424', // 0x1B (27)
  '#00676B', // 0x1C (28)
  '#000000', // 0x1D (29)
  '#000000', // 0x1E (30)
  '#000000', // 0x1F (31)
  '#FFFFFF', // 0x20 (32)
  '#62A1FA', // 0x21 (33)
  '#8589FF', // 0x22 (34)
  '#AC75FF', // 0x23 (35)
  '#CF6AFA', // 0x24 (36)
  '#E36CBC', // 0x25 (37)
  '#E37975', // 0x26 (38)
  '#CF9037', // 0x27 (39)
  '#ACA814', // 0x28 (40)
  '#85BC14', // 0x29 (41)
  '#62C737', // 0x2A (42)
  '#4EC575', // 0x2B (43)
  '#4EB7BC', // 0x2C (44)
  '#4E4E4E', // 0x2D (45)
  '#000000', // 0x2E (46)
  '#000000', // 0x2F (47)
  '#FFFFFF', // 0x30 (48)
  '#C4DDFF', // 0x31 (49)
  '#D1D3FF', // 0x32 (50)
  '#E1CBFF', // 0x33 (51)
  '#EFC7FF', // 0x34 (52)
  '#F6C8E7', // 0x35 (53)
  '#F6CDCB', // 0x36 (54)
  '#EFD6B3', // 0x37 (55)
  '#E1DFA6', // 0x38 (56)
  '#D1E7A6', // 0x39 (57)
  '#C4EBB3', // 0x3A (58)
  '#BCEBCB', // 0x3B (59)
  '#BCE5E7', // 0x3C (60)
  '#B8B8B8', // 0x3D (61)
  '#000000', // 0x3E (62)
  '#000000', // 0x3F (63)
]

type Palette = [ColorCombination, ColorCombination, ColorCombination, ColorCombination]

export type ColorCombination = [number, number, number, number]
export type PaletteTarget = 'B' | 'S'

// ---------------------------------------------------------------------------
// Single source of truth for palette data.
// All palette arrays (immutable originals and mutable runtime) are derived
// from these raw definitions, eliminating the risk of the originals drifting
// from the runtime defaults when palette values are updated.
// ---------------------------------------------------------------------------

/** Raw sprite palette definitions — single source of truth. */
const RAW_SPRITE_PALETTES = [
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
] as const

/** Raw background palette definitions — single source of truth. */
const RAW_BACKGROUND_PALETTES = [
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
] as const

// ---------------------------------------------------------------------------
// Deep-clone helper — produces mutable arrays from raw const data.
// Accepts deeply-readonly tuple/array types (from `as const` assertions)
// and returns fully mutable `number[][][]` for runtime mutation.
// ---------------------------------------------------------------------------

/** Deeply-readonly palette data: array of palettes, each an array of color combinations. */
export type ReadonlyPaletteData = ReadonlyArray<ReadonlyArray<ReadonlyArray<number>>>

function cloneAsMutable<T extends ReadonlyPaletteData>(
  raw: T
): number[][][] {
  return raw.map(palette =>
    palette.map(combination => [...combination])
  )
}

// ---------------------------------------------------------------------------
// Immutable originals — never mutated.
// Used as source-of-truth for resetRuntimePalettes() and
// ScreenStateManager.resetPalettes() so that resets always restore the correct
// default values even after setRuntimePaletteCombination() has mutated the
// runtime BACKGROUND_PALETTES / SPRITE_PALETTES arrays.
// ---------------------------------------------------------------------------

export const ORIGINAL_SPRITE_PALETTES = RAW_SPRITE_PALETTES
export const ORIGINAL_BACKGROUND_PALETTES = RAW_BACKGROUND_PALETTES

// ---------------------------------------------------------------------------
// Mutable runtime arrays — mutated in place by setRuntimePaletteCombination().
// ---------------------------------------------------------------------------

export const SPRITE_PALETTES: [Palette, Palette, Palette] =
  cloneAsMutable(RAW_SPRITE_PALETTES) as [Palette, Palette, Palette]

export const BACKGROUND_PALETTES: [Palette, Palette] =
  cloneAsMutable(RAW_BACKGROUND_PALETTES) as [Palette, Palette]

export function setRuntimePaletteCombination(
  target: PaletteTarget,
  paletteIndex: number,
  combination: number,
  colors: ColorCombination
): void {
  const clampedCombination = Math.max(0, Math.min(3, combination))
  const clampedColors: ColorCombination = [
    Math.max(0, Math.min(60, colors[0] ?? 0)),
    Math.max(0, Math.min(60, colors[1] ?? 0)),
    Math.max(0, Math.min(60, colors[2] ?? 0)),
    Math.max(0, Math.min(60, colors[3] ?? 0)),
  ]

  if (target === 'B') {
    const idx = Math.max(0, Math.min(1, paletteIndex))
    const palette = BACKGROUND_PALETTES[idx]
    if (palette) {
      palette[clampedCombination] = clampedColors
    }
    return
  }

  const idx = Math.max(0, Math.min(2, paletteIndex))
  const palette = SPRITE_PALETTES[idx]
  if (palette) {
    palette[clampedCombination] = clampedColors
  }
}

/**
 * Restore BACKGROUND_PALETTES and SPRITE_PALETTES to their original values.
 * Used by the main thread when a new program starts to clear stale palette
 * state from the previous run.
 */
export function resetRuntimePalettes(): void {
  for (let i = 0; i < ORIGINAL_BACKGROUND_PALETTES.length; i++) {
    const source = ORIGINAL_BACKGROUND_PALETTES[i]!
    const target = BACKGROUND_PALETTES[i]!
    for (let j = 0; j < source.length; j++) {
      const s = source[j]!
      target[j] = [s[0], s[1], s[2], s[3]]
    }
  }
  for (let i = 0; i < ORIGINAL_SPRITE_PALETTES.length; i++) {
    const source = ORIGINAL_SPRITE_PALETTES[i]!
    const target = SPRITE_PALETTES[i]!
    for (let j = 0; j < source.length; j++) {
      const s = source[j]!
      target[j] = [s[0], s[1], s[2], s[3]]
    }
  }
}
