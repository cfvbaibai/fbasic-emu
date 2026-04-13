/**
 * Lesson 8: LOCATE — Cursor positioning and screen functions.
 *
 * Covers the LOCATE statement for moving the cursor,
 * screen coordinates, POS and CSRLIN functions,
 * and combining LOCATE with loops for patterns.
 */

import type { Lesson } from '../types'

export const lesson8Locate: Lesson = {
  title: 'LOCATE',

  content: [
    '# Lesson 8: LOCATE',

    'The `LOCATE` command moves the cursor to a',
    'specific position on the screen.',
    'This lets you place text exactly where you want it.',

    '## Basic Syntax',

    '```basic',
    'LOCATE X, Y',
    '```',

    '- `X` — Horizontal column (0 to 27)',
    '- `Y` — Vertical line (0 to 23)',

    '## Screen Coordinates',

    'The screen has 28 columns and 24 lines:',
    '- Top-left corner: `(0, 0)`',
    '- Top-right corner: `(27, 0)`',
    '- Bottom-left corner: `(0, 23)`',
    '- Bottom-right corner: `(27, 23)`',

    '## Basic Example',

    'Place text at a specific position:',

    '```basic',
    '10 CLS',
    '20 LOCATE 10, 10',
    '30 PRINT "HELLO"',
    '```',

    'The text "HELLO" appears at column 10, line 10.',

    '## Drawing with LOCATE and Loops',

    'Combine `LOCATE` with `FOR...NEXT` to draw',
    'patterns on the screen:',

    '```basic',
    '10 CLS',
    '20 FOR I=0 TO 20',
    '30 LOCATE I, I',
    '40 PRINT "*";',
    '50 NEXT',
    '60 LOCATE 0, 22',
    '```',

    '## POS and CSRLIN Functions',

    'You can check the current cursor position:',
    '- `POS(0)` — Returns the horizontal column (0-27)',
    '- `CSRLIN` — Returns the vertical line (0-23)',

    '```basic',
    '10 CLS',
    '20 LOCATE 5, 10',
    '30 PRINT "POSITION: ";POS(0);", ";CSRLIN',
    '```',

    '## Creating a Title Screen',

    'Use `LOCATE` to center text on the screen:',

    '```basic',
    '10 CLS',
    '20 LOCATE 8, 5',
    '30 PRINT "MY GAME"',
    '40 LOCATE 6, 8',
    '50 PRINT "PRESS ANY KEY"',
    '60 LOCATE 0, 20',
    '```',

    '## Try It',

    'Try making your own screen layout:',

    '```basic',
    '10 CLS',
    '20 LOCATE 0, 0',
    '30 PRINT "SCORE: 100"',
    '40 LOCATE 20, 0',
    '50 PRINT "LIVES: 3"',
    '60 LOCATE 10, 12',
    '70 PRINT "GAME OVER"',
    '```',
  ].join('\n\n'),
}
