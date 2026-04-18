/**
 * Unit tests for calculateNoteFrequency() and NOTE_SEMITONES
 *
 * Directly tests the note-to-frequency conversion from noteFrequency.ts.
 * Covers known reference frequencies, all natural notes, sharp variants,
 * octave boundaries, and error handling for invalid note names.
 */

import { describe, expect, test } from 'vitest'

import { calculateNoteFrequency, NOTE_SEMITONES } from '@/core/sound/noteFrequency'

// ============================================================================
// NOTE_SEMITONES constant
// ============================================================================

describe('NOTE_SEMITONES', () => {
  test('maps C to 0', () => {
    expect(NOTE_SEMITONES['C']).toEqual(0)
  })

  test('maps D to 2', () => {
    expect(NOTE_SEMITONES['D']).toEqual(2)
  })

  test('maps E to 4', () => {
    expect(NOTE_SEMITONES['E']).toEqual(4)
  })

  test('maps F to 5', () => {
    expect(NOTE_SEMITONES['F']).toEqual(5)
  })

  test('maps G to 7', () => {
    expect(NOTE_SEMITONES['G']).toEqual(7)
  })

  test('maps A to 9', () => {
    expect(NOTE_SEMITONES['A']).toEqual(9)
  })

  test('maps B to 11', () => {
    expect(NOTE_SEMITONES['B']).toEqual(11)
  })

  test('has exactly 7 entries', () => {
    expect(Object.keys(NOTE_SEMITONES).length).toEqual(7)
  })

  test('contains all natural note names', () => {
    const notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
    for (const note of notes) {
      expect(NOTE_SEMITONES[note]).toBeDefined()
    }
  })
})

// ============================================================================
// Known reference frequencies (A4 = 440 Hz tuning)
// ============================================================================

describe('calculateNoteFrequency - reference frequencies', () => {
  test('A4 (F-BASIC octave 2, no sharp) = 440 Hz', () => {
    // F-BASIC octave 2 = standard octave 4, A is semitone 9
    // midiNote = (2+2)*12 + 9 + 12 = 69
    // 440 * 2^((69-69)/12) = 440
    const result = calculateNoteFrequency('A', 2, false)
    expect(result).toBeCloseTo(440, 2)
  })

  test('C4 (F-BASIC octave 2) = 261.63 Hz', () => {
    // midiNote = (2+2)*12 + 0 + 12 = 60
    // 440 * 2^((60-69)/12) = 261.63
    const result = calculateNoteFrequency('C', 2, false)
    expect(result).toBeCloseTo(261.63, 2)
  })

  test('A5 (F-BASIC octave 3) = 880 Hz', () => {
    // midiNote = (3+2)*12 + 9 + 12 = 81
    // 440 * 2^((81-69)/12) = 880
    const result = calculateNoteFrequency('A', 3, false)
    expect(result).toBeCloseTo(880, 2)
  })

  test('C5 (F-BASIC octave 3) = 523.25 Hz', () => {
    // midiNote = (3+2)*12 + 0 + 12 = 72
    // 440 * 2^((72-69)/12) = 523.25
    const result = calculateNoteFrequency('C', 3, false)
    expect(result).toBeCloseTo(523.25, 2)
  })
})

// ============================================================================
// All 7 natural notes in F-BASIC octave 2 (standard octave 4)
// ============================================================================

describe('calculateNoteFrequency - all natural notes in octave 2', () => {
  test('C = 261.63 Hz', () => {
    expect(calculateNoteFrequency('C', 2, false)).toBeCloseTo(261.63, 2)
  })

  test('D = 293.66 Hz', () => {
    expect(calculateNoteFrequency('D', 2, false)).toBeCloseTo(293.66, 2)
  })

  test('E = 329.63 Hz', () => {
    expect(calculateNoteFrequency('E', 2, false)).toBeCloseTo(329.63, 2)
  })

  test('F = 349.23 Hz', () => {
    expect(calculateNoteFrequency('F', 2, false)).toBeCloseTo(349.23, 2)
  })

  test('G = 392.00 Hz', () => {
    expect(calculateNoteFrequency('G', 2, false)).toBeCloseTo(392.0, 2)
  })

  test('A = 440.00 Hz', () => {
    expect(calculateNoteFrequency('A', 2, false)).toBeCloseTo(440.0, 2)
  })

  test('B = 493.88 Hz', () => {
    expect(calculateNoteFrequency('B', 2, false)).toBeCloseTo(493.88, 2)
  })
})

// ============================================================================
// Sharp variants
// ============================================================================

describe('calculateNoteFrequency - sharp notes', () => {
  test('C#4 (F-BASIC octave 2) = 277.18 Hz', () => {
    // midiNote = (2+2)*12 + 0 + 1 + 12 = 61
    expect(calculateNoteFrequency('C', 2, true)).toBeCloseTo(277.18, 2)
  })

  test('D#4 (F-BASIC octave 2) = 311.13 Hz', () => {
    expect(calculateNoteFrequency('D', 2, true)).toBeCloseTo(311.13, 2)
  })

  test('F#4 (F-BASIC octave 2) = 369.99 Hz', () => {
    expect(calculateNoteFrequency('F', 2, true)).toBeCloseTo(369.99, 2)
  })

  test('G#4 (F-BASIC octave 2) = 415.30 Hz', () => {
    expect(calculateNoteFrequency('G', 2, true)).toBeCloseTo(415.3, 2)
  })

  test('A#4 (F-BASIC octave 2) = 466.16 Hz', () => {
    expect(calculateNoteFrequency('A', 2, true)).toBeCloseTo(466.16, 2)
  })

  test('sharp is exactly one semitone above natural', () => {
    const naturalC = calculateNoteFrequency('C', 2, false)
    const sharpC = calculateNoteFrequency('C', 2, true)
    const ratio = sharpC / naturalC
    // One semitone = 2^(1/12) ≈ 1.05946
    expect(ratio).toBeCloseTo(Math.pow(2, 1 / 12), 4)
  })
})

// ============================================================================
// Octave boundaries
// ============================================================================

describe('calculateNoteFrequency - octave boundaries', () => {
  test('F-BASIC octave 0 (standard octave 2) - low C = 65.41 Hz', () => {
    // midiNote = (0+2)*12 + 0 + 12 = 36
    expect(calculateNoteFrequency('C', 0, false)).toBeCloseTo(65.41, 2)
  })

  test('F-BASIC octave 0 - A = 110 Hz', () => {
    // midiNote = (0+2)*12 + 9 + 12 = 45
    expect(calculateNoteFrequency('A', 0, false)).toBeCloseTo(110.0, 2)
  })

  test('F-BASIC octave 5 (standard octave 7) - C = 2093.00 Hz', () => {
    // midiNote = (5+2)*12 + 0 + 12 = 96
    expect(calculateNoteFrequency('C', 5, false)).toBeCloseTo(2093.0, 0)
  })

  test('F-BASIC octave 5 - A = 3520.00 Hz', () => {
    // midiNote = (5+2)*12 + 9 + 12 = 105
    // 440 * 2^((105-69)/12) = 440 * 2^3 = 3520
    expect(calculateNoteFrequency('A', 5, false)).toBeCloseTo(3520.0, 0)
  })

  test('octave doubles frequency for same note', () => {
    const cOctave2 = calculateNoteFrequency('C', 2, false)
    const cOctave3 = calculateNoteFrequency('C', 3, false)
    expect(cOctave3 / cOctave2).toBeCloseTo(2, 4)
  })
})

// ============================================================================
// Error handling
// ============================================================================

describe('calculateNoteFrequency - invalid note name', () => {
  test('throws for note H', () => {
    expect(() => calculateNoteFrequency('H', 2, false)).toThrow('Invalid note name: H')
  })

  test('throws for note Z', () => {
    expect(() => calculateNoteFrequency('Z', 2, false)).toThrow('Invalid note name: Z')
  })

  test('throws for empty string note', () => {
    expect(() => calculateNoteFrequency('', 2, false)).toThrow('Invalid note name: ')
  })

  test('throws for lowercase c', () => {
    expect(() => calculateNoteFrequency('c', 2, false)).toThrow('Invalid note name: c')
  })

  test('throws for number as note', () => {
    expect(() => calculateNoteFrequency('3', 2, false)).toThrow('Invalid note name: 3')
  })
})
