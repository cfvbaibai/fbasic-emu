/**
 * Lesson 5: FOR/NEXT — Loops for repeating actions.
 *
 * Covers the FOR...TO...NEXT loop, optional STEP,
 * counting up and down, and basic nested loops.
 */

import type { Lesson } from '../types'

export const lesson5ForNext: Lesson = {
  title: 'FOR / NEXT',

  content: [
    '# Lesson 5: FOR / NEXT',

    'The `FOR...NEXT` loop repeats a block of code a set',
    'number of times. It is one of the most powerful tools',
    'in BASIC programming.',

    '## Basic Loop',

    'A loop needs a **variable**, a **start value**, and an **end value**:',

    '```basic',
    '10 FOR I=1 TO 5',
    '20 PRINT I',
    '30 NEXT',
    '```',

    'This prints the numbers 1 through 5.',
    'The loop variable `I` starts at 1 and increases by 1',
    'each time `NEXT` is reached, stopping after 5.',

    '## Using STEP',

    'You can change how much the variable increases',
    'with the `STEP` keyword:',

    '```basic',
    '10 FOR I=0 TO 10 STEP 2',
    '20 PRINT I;',
    '30 NEXT',
    '```',

    'Use a negative step to count down:',

    '```basic',
    '10 FOR I=5 TO 1 STEP -1',
    '20 PRINT I;',
    '30 NEXT',
    '```',

    '## Loops with PRINT',

    'Loops are great for drawing patterns with text:',

    '```basic',
    '10 FOR I=1 TO 10',
    '20 PRINT "*";',
    '30 NEXT',
    '40 PRINT',
    '```',

    '## Try It',

    'Try combining loops with what you have learned so far:',

    '```basic',
    '10 FOR I=1 TO 3',
    '20 PRINT "HELLO #";I',
    '30 NEXT',
    '```',
  ].join('\n\n'),
}
