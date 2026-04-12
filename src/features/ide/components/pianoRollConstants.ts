/**
 * Constants and types for the PianoRoll grid component.
 *
 * These are extracted from PianoRoll.vue for clarity and testability,
 * and so future steps (state management, playback, code generation)
 * can import them without pulling in the component.
 */

// ---------------------------------------------------------------------------
// Note names (ascending order: C3 -> B5)
// ---------------------------------------------------------------------------

const NOTE_NAMES_ASCENDING = [
  'C3', 'C#3', 'D3', 'D#3', 'E3', 'F3', 'F#3', 'G3', 'G#3', 'A3', 'A#3', 'B3',
  'C4', 'C#4', 'D4', 'D#4', 'E4', 'F4', 'F#4', 'G4', 'G#4', 'A4', 'A#4', 'B4',
  'C5', 'C#5', 'D5', 'D#5', 'E5', 'F5', 'F#5', 'G5', 'G#5', 'A5', 'A#5', 'B5',
] as const

/**
 * Note names displayed top-to-bottom on the piano roll grid.
 * Index 0 = B5 (highest), last index = C3 (lowest).
 */
export const NOTE_NAMES: readonly string[] = [...NOTE_NAMES_ASCENDING].reverse()

/** Number of notes in the grid (3 octaves x 12 semitones). */
export const NOTE_COUNT = NOTE_NAMES.length

/** Default number of time steps per row. */
export const DEFAULT_STEPS = 16

/** All valid step counts. */
export const VALID_STEPS = [16, 32] as const

/** Interval at which a beat marker column appears. */
export const BEAT_INTERVAL = 4

// ---------------------------------------------------------------------------
// Note cell key
// ---------------------------------------------------------------------------

/**
 * Key format for identifying a note cell in the grid.
 * Used as the identifier in the `modelValue` Set.
 *
 * Format: "{noteIndex}-{stepIndex}"
 * - noteIndex: 0-based index into NOTE_NAMES (0 = B5, 35 = C3)
 * - stepIndex: 0-based time step column
 */
export type NoteCellKey = `${number}-${number}`

/**
 * Creates a cell key from note and step indices.
 */
export function createNoteCellKey(
  noteIndex: number,
  stepIndex: number
): NoteCellKey {
  return `${noteIndex}-${stepIndex}`
}

/**
 * Parses a cell key into its note and step indices.
 */
export function parseNoteCellKey(key: NoteCellKey): {
  noteIndex: number
  stepIndex: number
} {
  const dashIndex = key.indexOf('-')
  const noteIndex = Number.parseInt(key.slice(0, dashIndex), 10)
  const stepIndex = Number.parseInt(key.slice(dashIndex + 1), 10)
  return { noteIndex, stepIndex }
}

/**
 * Checks whether a note name represents a sharp (black key).
 */
export function isSharpNote(noteName: string): boolean {
  return noteName.includes('#')
}
