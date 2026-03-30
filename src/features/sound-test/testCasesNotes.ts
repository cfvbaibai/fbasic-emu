/**
 * Test Case Data for Pitch & Notes
 *
 * Basic notes, octave controls, and sharp notes.
 */

import type { SoundTestCase } from './soundTestTypes'

// ============================================
// Basic Notes
// ============================================
export const BASIC_NOTES_TESTS: SoundTestCase[] = [
  {
    id: 'note-c',
    category: 'Basic Notes',
    name: 'Note C',
    description: 'Single C note - should hear one clear tone',
    musicString: 'C',
    expectedBehavior: 'One clear tone at default octave (O3) and length (quarter note)',
  },
  {
    id: 'note-d',
    category: 'Basic Notes',
    name: 'Note D',
    description: 'Single D note',
    musicString: 'D',
    expectedBehavior: 'One clear tone, higher than C',
  },
  {
    id: 'note-e',
    category: 'Basic Notes',
    name: 'Note E',
    description: 'Single E note',
    musicString: 'E',
    expectedBehavior: 'One clear tone, higher than D',
  },
  {
    id: 'note-f',
    category: 'Basic Notes',
    name: 'Note F',
    description: 'Single F note',
    musicString: 'F',
    expectedBehavior: 'One clear tone',
  },
  {
    id: 'note-g',
    category: 'Basic Notes',
    name: 'Note G',
    description: 'Single G note',
    musicString: 'G',
    expectedBehavior: 'One clear tone',
  },
  {
    id: 'note-a',
    category: 'Basic Notes',
    name: 'Note A',
    description: 'Single A note',
    musicString: 'A',
    expectedBehavior: 'One clear tone',
  },
  {
    id: 'note-b',
    category: 'Basic Notes',
    name: 'Note B',
    description: 'Single B note',
    musicString: 'B',
    expectedBehavior: 'One clear tone, highest natural note in octave',
  },
  {
    id: 'scale-c-major',
    category: 'Basic Notes',
    name: 'C Major Scale',
    description: 'Complete C major scale ascending',
    musicString: 'CDEFGAB',
    expectedBehavior: 'Seven ascending notes forming a major scale (do-re-mi-fa-sol-la-ti)',
  },
]

// ============================================
// Octaves
// ============================================
export const OCTAVES_TESTS: SoundTestCase[] = [
  {
    id: 'octave-o0',
    category: 'Octaves',
    name: 'Octave 0 (Lowest)',
    description: 'C note at octave 0 - very low pitch',
    musicString: 'O0C',
    expectedBehavior: 'Very low bass tone',
  },
  {
    id: 'octave-o1',
    category: 'Octaves',
    name: 'Octave 1',
    description: 'C note at octave 1',
    musicString: 'O1C',
    expectedBehavior: 'Low bass tone, one octave higher than O0',
  },
  {
    id: 'octave-o2',
    category: 'Octaves',
    name: 'Octave 2',
    description: 'C note at octave 2 - middle C range',
    musicString: 'O2C',
    expectedBehavior: 'Middle range tone',
  },
  {
    id: 'octave-o3',
    category: 'Octaves',
    name: 'Octave 3 (Default)',
    description: 'C note at octave 3 - default octave',
    musicString: 'O3C',
    expectedBehavior: 'Treble range tone (this is the default)',
  },
  {
    id: 'octave-o4',
    category: 'Octaves',
    name: 'Octave 4',
    description: 'C note at octave 4',
    musicString: 'O4C',
    expectedBehavior: 'High pitch, one octave above default',
  },
  {
    id: 'octave-o5',
    category: 'Octaves',
    name: 'Octave 5 (Highest)',
    description: 'C note at octave 5 - highest octave',
    musicString: 'O5C',
    expectedBehavior: 'Very high pitch, may sound thin',
  },
  {
    id: 'octave-ascending',
    category: 'Octaves',
    name: 'Octave Ascending',
    description: 'Same note across all octaves ascending',
    musicString: 'O0CO1CO2CO3CO4CO5C',
    expectedBehavior: 'Six C notes, each one octave higher than the previous',
  },
]

// ============================================
// Sharp Notes
// ============================================
export const SHARP_NOTES_TESTS: SoundTestCase[] = [
  {
    id: 'sharp-c',
    category: 'Sharp Notes',
    name: 'Sharp C (#C)',
    description: 'C sharp note',
    musicString: '#C',
    expectedBehavior: 'C#, slightly higher than natural C',
  },
  {
    id: 'sharp-d',
    category: 'Sharp Notes',
    name: 'Sharp D (#D)',
    description: 'D sharp note',
    musicString: '#D',
    expectedBehavior: 'D#, slightly higher than natural D',
  },
  {
    id: 'sharp-f',
    category: 'Sharp Notes',
    name: 'Sharp F (#F)',
    description: 'F sharp note',
    musicString: '#F',
    expectedBehavior: 'F#, slightly higher than natural F',
  },
  {
    id: 'sharp-g',
    category: 'Sharp Notes',
    name: 'Sharp G (#G)',
    description: 'G sharp note',
    musicString: '#G',
    expectedBehavior: 'G#, slightly higher than natural G',
  },
  {
    id: 'sharp-a',
    category: 'Sharp Notes',
    name: 'Sharp A (#A)',
    description: 'A sharp note',
    musicString: '#A',
    expectedBehavior: 'A#, slightly higher than natural A',
  },
  {
    id: 'sharp-compare',
    category: 'Sharp Notes',
    name: 'Natural vs Sharp',
    description: 'Compare natural and sharp notes',
    musicString: 'C#CD#DE#F',
    expectedBehavior:
      'Each pair: natural note, then its sharp (except F which goes to F natural)',
  },
]
