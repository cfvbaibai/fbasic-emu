/**
 * Lesson 1: PRINT — Output text and values to screen.
 *
 * Covers the PRINT statement, its `?` abbreviation,
 * and the `;` and `,` separators for controlling output format.
 */

import type { Lesson } from '../types'

export const lesson1Print: Lesson = {
  title: 'PRINT',

  content: [
    '# Lesson 1: PRINT',

    'The `PRINT` command displays text and values on the screen.',
    'It is one of the most useful commands in BASIC.',
    'You can also write `?` as a shorthand for `PRINT`.',

    '## Printing Text',

    'To display a message, put it inside double quotes:',

    '```basic',
    '10 PRINT "HELLO WORLD"',
    '```',

    'You can use `?` as an abbreviation:',

    '```basic',
    '10 ? "HELLO WORLD"',
    '```',

    '## Printing Numbers',

    '`PRINT` can also display numbers and the results of calculations:',

    '```basic',
    '10 PRINT 100',
    '20 PRINT 3+5',
    '```',

    '## Combining Text and Numbers',

    'Use `;` to join multiple items on the same line.',
    'A space is automatically added before positive numbers:',

    '```basic',
    '10 A=42',
    '20 PRINT "ANSWER=";A',
    '```',

    '## Controlling Newlines',

    'Normally `PRINT` adds a newline at the end.',
    'Add `;` at the end to continue on the same line:',

    '```basic',
    '10 PRINT "A";',
    '20 PRINT "B";',
    '30 PRINT "C"',
    '```',

    '## Try It',

    'Try these examples to see what `PRINT` can do:',

    '```basic',
    '10 PRINT "HELLO!"',
    '20 PRINT 7*8',
    '30 PRINT "SCORE:";100',
    '```',
  ].join('\n\n'),
}
