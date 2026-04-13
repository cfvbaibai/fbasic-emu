/**
 * Lesson 12: Background Graphics — Setting background colors and palettes.
 *
 * Covers CGSET for color palette mode, PALETB for background colors,
 * VIEW for copying BG graphics to the background screen.
 */

import type { Lesson } from '../types'

export const lesson12BackgroundGraphics: Lesson = {
  title: 'Background Graphics',

  content: [
    '# Lesson 12: Background Graphics',

    'Background graphics let you set colors',
    'for the entire screen background.',
    'You can choose different color palettes',
    'to change the look of your programs.',

    '## CGSET — Setting the Color Palette',

    'Use `CGSET` to select which color palette',
    'to use for the screen:',
    '```basic',
    'CGSET n, m',
    '```',

    '- `n` — Palette set number (0 to 2)',
    '- `m` — Palette mode number (0 to 1)',

    'Each combination of `n` and `m` gives you',
    'a different set of background colors.',

    '## Basic Example',
    '```basic',
    '10 CLS',
    '20 CGSET 0, 0',
    '30 PRINT "PALETTE 0,0"',
    '40 PAUSE 60',
    '50 CGSET 1, 0',
    '60 PRINT "PALETTE 1,0"',
    '70 PAUSE 60',
    '80 CGSET 2, 0',
    '90 PRINT "PALETTE 2,0"',
    '```',

    '## PALETB — Background Palette Colors',

    'Use `PALETB` to set the four background',
    'colors for a palette set:',
    '```basic',
    'PALETB n, c1, c2, c3, c4',
    '```',

    '- `n` — Palette set number (0 to 7)',
    '- `c1, c2, c3, c4` — Color values',

    '## Using PALETB',
    '```basic',
    '10 CLS',
    '20 PALETB 0, 4, 3, 2, 1',
    '30 CGSET 0, 0',
    '40 FOR I=0 TO 100',
    '50 PRINT "*";',
    '60 NEXT',
    '70 LOCATE 0,22',
    '```',

    '## VIEW — Copy BG to Background',

    'The `VIEW` command copies graphics drawn',
    'on the BG GRAPHIC screen to the background:',
    '```basic',
    'VIEW',
    '```',

    'This is useful when you have drawn',
    'background graphics and want to display them.',
    'Use `VIEW` after drawing your background.',

    '## Combining CGSET with VIEW',
    '```basic',
    '10 CLS',
    '20 PALETB 0, 4, 3, 2, 1',
    '30 CGSET 0, 0',
    '40 FOR I=0 TO 200',
    '50 PRINT CHR$(225);',
    '60 NEXT',
    '70 VIEW',
    '80 PRINT "BACKGROUND READY"',
    '90 LOCATE 0,22',
    '```',

    '## Multiple Palettes',

    'You can switch palettes during your program',
    'to create color-changing effects:',
    '```basic',
    '10 CLS',
    '20 PALETB 0, 4, 3, 2, 1',
    '30 PALETB 1, 8, 7, 6, 5',
    '40 FOR I=0 TO 100',
    '50 PRINT "#";',
    '60 NEXT',
    '70 FOR P=0 TO 1',
    '80 CGSET P, 0',
    '90 PAUSE 40',
    '100 NEXT',
    '110 LOCATE 0,22',
    '```',

    '## Try It',

    'Try creating a colored background:',
    '```basic',
    '10 CLS',
    '20 PALETB 0, 6, 5, 4, 3',
    '30 CGSET 0, 0',
    '40 FOR I=0 TO 150',
    '50 PRINT CHR$(225);',
    '60 NEXT',
    '70 VIEW',
    '80 LOCATE 10, 12',
    '90 PRINT "DONE!"',
    '```',
  ].join('\n\n'),
}
