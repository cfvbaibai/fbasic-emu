/**
 * Lesson 14: Playing Sound — Using the PLAY statement.
 *
 * Covers the PLAY statement for playing musical notes,
 * tempo and octave settings, and note duration control.
 */

import type { Lesson } from '../types'

export const lesson14PlayingSound: Lesson = {
  title: 'Playing Sound',

  content: [
    '# Lesson 14: Playing Sound',

    'The `PLAY` statement lets your program',
    'play musical notes and melodies.',
    'You can control the tempo, octave,',
    'and duration of each note.',

    '## Basic Syntax',

    '```basic',
    'PLAY "music string"',
    '```',

    'The music string contains special codes',
    'that tell the computer which notes to play.',

    '## Notes',

    'Use letter names for notes:',
    '- `C` — Do',
    '- `D` — Re',
    '- `E` — Mi',
    '- `F` — Fa',
    '- `G` — Sol',
    '- `A` — La',
    '- `B` — Si',

    'A number after a note sets its duration.',
    'A higher number means a shorter note:',
    '- `C1` — Whole note (longest)',
    '- `C2` — Half note',
    '- `C4` — Quarter note',
    '- `C8` — Eighth note (shorter)',

    '## Basic Example',
    '```basic',
    '10 PLAY "C4D4E4F4G4A4B4"',
    '```',

    'This plays a scale from C to B.',
    'Each note is a quarter note.',

    '## Setting the Octave',

    'Use `O` followed by a number (1 to 8)',
    'to set the octave. Higher octaves play',
    'higher-pitched notes:',
    '```basic',
    '10 PLAY "O3C4D4E4"',
    '20 PLAY "O4C4D4E4"',
    '30 PLAY "O5C4D4E4"',
    '```',

    '## Setting the Tempo',

    'Use `T` followed by a number (32 to 255)',
    'to set the tempo. Higher numbers mean',
    'a faster tempo:',
    '```basic',
    '10 PLAY "T5O4C4D4E4F4"',
    '```',

    '`T5` sets a slow tempo.',

    '## A Simple Melody',

    'Combine notes, octave, and tempo',
    'to play a melody:',
    '```basic',
    '10 PLAY "T5O4E4E4F4G4"',
    '20 PLAY "T5O4G4F4E4D4"',
    '30 PLAY "T5O4C4C4D4E4"',
    '40 PLAY "T5O4E8D8D8"',
    '```',

    '## Rests',

    'Use `R` followed by a duration for rests:',
    '```basic',
    '10 PLAY "C4R4D4R4E4"',
    '```',

    'This plays C, rests, plays D, rests,',
    'then plays E.',

    '## Important Note',

    '`PLAY` blocks your program until the music',
    'finishes. If you want music to play while',
    'your program continues, use `BGPLAY`',
    '(covered in the next lesson).',

    '## Try It',

    'Try creating your own melody:',
    '```basic',
    '10 PLAY "T6O3C4C4G4G4"',
    '20 PLAY "T6O3A4A4G8"',
    '30 PLAY "T6O3F4F4E4E4"',
    '40 PLAY "T6O3D4D4C8"',
    '```',
  ].join('\n\n'),
}
