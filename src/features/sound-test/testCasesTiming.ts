/**
 * Test Case Data for Timing & Rhythm
 *
 * Tempo controls, note length codes, and rests.
 */

import type { SoundTestCase } from './soundTestTypes'

// ============================================
// Tempo
// ============================================
export const TEMPO_TESTS: SoundTestCase[] = [
  {
    id: 'tempo-t1',
    category: 'Tempo',
    name: 'Tempo 1 (Fastest)',
    description: 'Very fast tempo',
    musicString: 'T1CDEFGAB',
    expectedBehavior: 'Notes play very quickly',
  },
  {
    id: 'tempo-t4',
    category: 'Tempo',
    name: 'Tempo 4 (Default)',
    description: 'Default medium tempo',
    musicString: 'T4CDEFGAB',
    expectedBehavior: 'Notes at moderate speed',
  },
  {
    id: 'tempo-t8',
    category: 'Tempo',
    name: 'Tempo 8 (Slowest)',
    description: 'Very slow tempo',
    musicString: 'T8CDEFGAB',
    expectedBehavior: 'Notes play slowly with long durations',
  },
  {
    id: 'tempo-change',
    category: 'Tempo',
    name: 'Tempo Change Mid-Play',
    description: 'Change tempo during playback',
    musicString: 'T1CD T8EFGAB',
    expectedBehavior: 'First two notes fast, then slower for the rest',
  },
]

// ============================================
// Length Codes
// ============================================
export const LENGTH_CODES_TESTS: SoundTestCase[] = [
  {
    id: 'length-0',
    category: 'Length Codes',
    name: 'Length 0 (32nd note)',
    description: 'Very short note',
    musicString: 'C0',
    expectedBehavior: 'Extremely short note (32nd note)',
  },
  {
    id: 'length-1',
    category: 'Length Codes',
    name: 'Length 1 (16th note)',
    description: 'Short note',
    musicString: 'C1',
    expectedBehavior: 'Short note (16th note)',
  },
  {
    id: 'length-3',
    category: 'Length Codes',
    name: 'Length 3 (8th note)',
    description: 'Eighth note',
    musicString: 'C3',
    expectedBehavior: 'Medium-short note (8th note)',
  },
  {
    id: 'length-5',
    category: 'Length Codes',
    name: 'Length 5 (Quarter note)',
    description: 'Quarter note - default length',
    musicString: 'C5',
    expectedBehavior: 'Standard quarter note (this is the default)',
  },
  {
    id: 'length-7',
    category: 'Length Codes',
    name: 'Length 7 (Half note)',
    description: 'Half note',
    musicString: 'C7',
    expectedBehavior: 'Long note (half note)',
  },
  {
    id: 'length-9',
    category: 'Length Codes',
    name: 'Length 9 (Whole note)',
    description: 'Whole note - longest',
    musicString: 'C9',
    expectedBehavior: 'Very long note (whole note)',
  },
  {
    id: 'length-mixed',
    category: 'Length Codes',
    name: 'Mixed Lengths',
    description: 'Different note lengths in sequence',
    musicString: 'C1C3C5C7C9',
    expectedBehavior: 'Notes get progressively longer: short -> medium -> long',
  },
]

// ============================================
// Rests
// ============================================
export const RESTS_TESTS: SoundTestCase[] = [
  {
    id: 'rest-basic',
    category: 'Rests',
    name: 'Basic Rest',
    description: 'Rest between notes (same length as notes)',
    musicString: 'CRC',
    expectedBehavior:
      'Two quarter-note C notes with quarter-note silence between (R uses previous length)',
  },
  {
    id: 'rest-length-0',
    category: 'Rests',
    name: 'Short Rest (R0)',
    description: 'Very short rest',
    musicString: 'C5R0C5',
    expectedBehavior:
      'Two quarter-note C notes with very brief 32nd-note silence (explicit C5 restores length)',
  },
  {
    id: 'rest-length-9',
    category: 'Rests',
    name: 'Long Rest (R9)',
    description: 'Long rest',
    musicString: 'C5R9C5',
    expectedBehavior:
      'Two quarter-note C notes with whole-note silence (explicit C5 restores length)',
  },
  {
    id: 'rest-length-carries',
    category: 'Rests',
    name: 'Rest Length Carries Over',
    description: 'Rest length affects subsequent notes (F-BASIC spec)',
    musicString: 'C5R0C',
    expectedBehavior:
      'First C is quarter note, R0 is 32nd rest, second C is also 32nd (length carries)',
  },
  {
    id: 'rest-melody',
    category: 'Rests',
    name: 'Melody with Rests',
    description: 'Simple melody with rests',
    musicString: 'C5R5D5R5E5R5',
    expectedBehavior: 'C, silence, D, silence, E, silence - all quarter notes separated by rests',
  },
]
