/**
 * Lesson 7: COLOR — Setting text and background colors.
 *
 * Covers the COLOR statement for specifying color patterns
 * per screen area, color pattern numbers, and combining
 * COLOR with CGSET for full color control.
 */

import type { Lesson } from '../types'

export const lesson7Color: Lesson = {
  title: 'COLOR',

  content: [
    '# Lesson 7: COLOR',

    'The `COLOR` command sets the color pattern for',
    'characters on the background screen.',
    'It lets you add color to your programs.',

    '## Basic Syntax',

    '`COLOR` takes three arguments:',

    '```basic',
    'COLOR X, Y, n',
    '```',

    '- `X` — Horizontal column (0 to 27)',
    '- `Y` — Vertical line (0 to 23)',
    '- `n` — Color pattern number (0 to 3)',

    '## How It Works',

    'The screen is divided into small areas.',
    'Each area covers a 2-column by 2-line block.',
    '`COLOR` sets the color pattern for the area',
    'that contains the position (X, Y).',

    'The color pattern number `n` (0 to 3) selects',
    'one of four color combinations from the current',
    'palette. Use `CGSET` to choose which palette',
    'to use.',

    '## Example: Coloring Text Areas',

    'This program fills the screen with characters',
    'and applies different colors to different areas:',

    '```basic',
    '10 CLS',
    '20 FOR I=0 TO 200',
    '30 PRINT CHR$(225);',
    '40 NEXT',
    '50 COLOR 0, 0, 1',
    '60 COLOR 10, 0, 2',
    '70 COLOR 20, 0, 3',
    '80 LOCATE 0, 20',
    '```',

    '## Using Loops with COLOR',

    'You can use `FOR...NEXT` to apply colors',
    'to multiple areas:',

    '```basic',
    '10 CLS',
    '20 FOR I=0 TO 100',
    '30 PRINT "*";',
    '40 NEXT',
    '50 FOR C=0 TO 3',
    '60 COLOR C*4, 2, C',
    '70 NEXT',
    '80 LOCATE 0, 20',
    '```',

    '## Color Pattern Numbers',

    'The color pattern number `n` selects from',
    'the current palette:',
    '- `0` — Color combination 0',
    '- `1` — Color combination 1',
    '- `2` — Color combination 2',
    '- `3` — Color combination 3',

    'See the color chart for the actual colors',
    'in each palette.',

    '## Try It',

    'Try this program to see colors in action:',

    '```basic',
    '10 CLS',
    '20 FOR I=0 TO 50',
    '30 PRINT "##";',
    '40 NEXT',
    '50 COLOR 0, 0, 3',
    '60 COLOR 8, 0, 2',
    '70 COLOR 16, 0, 1',
    '80 LOCATE 0, 22',
    '```',
  ].join('\n\n'),
}
