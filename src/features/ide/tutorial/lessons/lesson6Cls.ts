/**
 * Lesson 6: CLS — Clearing the screen.
 *
 * Covers the CLS command for clearing the background screen,
 * its use in programs, and combining it with other commands.
 */

import type { Lesson } from '../types'

export const lesson6Cls: Lesson = {
  title: 'CLS',

  content: [
    '# Lesson 6: CLS',

    'The `CLS` command clears the background screen.',
    'It removes all text and graphics that were displayed.',
    'This is useful when you want a fresh screen',

    '## Basic Usage',

    'Use `CLS` on its own to clear the screen:',

    '```basic',
    '10 CLS',
    '```',

    'After clearing, the cursor moves to the top-left',
    'corner of the screen.',

    '## Clearing Before Output',

    'It is common to use `CLS` at the beginning of a',
    'program so the screen starts clean:',

    '```basic',
    '10 CLS',
    '20 PRINT "WELCOME TO MY PROGRAM"',
    '30 PRINT "===================="',
    '40 PRINT',
    '50 PRINT "HELLO!"',
    '```',

    '## Clearing Between Sections',

    'You can use `CLS` to separate different parts',
    'of your program. Combined with `PAUSE`, you can',
    'show one screen, wait, then show another:',

    '```basic',
    '10 CLS',
    '20 PRINT "PAGE 1"',
    '30 PAUSE 100',
    '40 CLS',
    '50 PRINT "PAGE 2"',
    '```',

    '## Combining CLS with Other Commands',

    'You can put `CLS` on the same line as other commands',
    'using the colon `:` separator:',

    '```basic',
    '10 CLS:PRINT "FRESH START"',
    '20 FOR I=1 TO 5',
    '30 PRINT I;" ";',
    '40 NEXT',
    '```',

    '## Important Note',

    '`CLS` clears the **background screen**.',
    'If you have used `VIEW` to copy BG GRAPHIC',
    'to the background screen, `CLS` will remove it.',
    'Use `VIEW` again to restore the graphics.',

    '## Try It',

    'Try this program to see `CLS` in action:',

    '```basic',
    '10 CLS',
    '20 FOR I=1 TO 10',
    '30 PRINT "*";',
    '40 NEXT',
    '50 PRINT',
    '60 PAUSE 100',
    '70 CLS',
    '80 PRINT "SCREEN CLEARED!"',
    '```',
  ].join('\n\n'),
}
