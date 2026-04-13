/**
 * Note Frequency Calculation
 *
 * Shared utility for converting note names to frequencies.
 * Uses equal temperament tuning with A4 = 440Hz.
 *
 * Formula: f = 440 * 2^((midiNote - 69) / 12)
 * where midiNote = (fbOctave + 2) * 12 + semitone + 12
 *
 * F-BASIC octave convention: F-BASIC octave 2 = standard MIDI octave 4.
 * - F-BASIC octaves: 0-5
 * - Standard musical octaves: 2-7 (F-BASIC octave + 2)
 */

/**
 * Note names to semitone offset mapping (C = 0).
 * Used by both the Music DSL parser and the composer playback.
 */
export const NOTE_SEMITONES: Readonly<Record<string, number>> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
} as const

/**
 * Calculate frequency in Hz for a note given its letter, F-BASIC octave, and sharp flag.
 *
 * This is the core frequency function used by MusicDSLParser, which already
 * operates in F-BASIC octave space (0-5).
 *
 * @param noteLetter - Single letter note name (C, D, E, F, G, A, B)
 * @param fbOctave - F-BASIC octave (0-5), where octave 2 = standard octave 4
 * @param sharp - Whether the note is sharpened
 * @returns Frequency in Hz
 * @throws Error if noteLetter is not a valid note name
 */
export function calculateNoteFrequency(
  noteLetter: string,
  fbOctave: number,
  sharp: boolean
): number {
  const baseSemitone = NOTE_SEMITONES[noteLetter]
  if (baseSemitone === undefined) {
    throw new Error(`Invalid note name: ${noteLetter}`)
  }

  const semitone = baseSemitone + (sharp ? 1 : 0)
  const midiNote = (fbOctave + 2) * 12 + semitone + 12
  const frequency = 440 * Math.pow(2, (midiNote - 69) / 12)

  return frequency
}
