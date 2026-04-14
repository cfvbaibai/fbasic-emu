/**
 * Lesson 13: Sprite Colors — Customizing sprite colors with PALETS.
 *
 * Covers PALETS for setting sprite palette colors,
 * combining sprites with colored backgrounds,
 * and color coordination techniques.
 */

import type { Lesson } from '../types'

export const lesson13SpriteColors: Lesson = {
  title: 'Sprite Colors',

  content: [
    '# Lesson 13: Sprite Colors',

    'You can customize the colors used by sprites',
    'with the `PALETS` command.',
    'This lets you create colorful game graphics',
    'that stand out from the background.',

    '## PALETS — Sprite Palette Colors',

    'Use `PALETS` to set the four colors',
    'available to sprites:',
    '```basic',
    'PALETS n, c1, c2, c3, c4',
    '```',

    '- `n` — Palette set number (0 to 7)',
    '- `c1, c2, c3, c4` — Color values',

    'Each sprite references one of these four',
    'colors using the `c` parameter in `DEF SPRITE`.',
    'A value of `c=0` uses color `c1`,',
    'and so on up to `c=3` for color `c4`.',

    '## Basic Example',
    '```basic',
    '10 SPRITE ON',
    '20 PALETS 0, 6, 5, 4, 3',
    '30 DEF SPRITE 0,(0,1,0,0,0)=CHR$(225)',
    '40 DEF SPRITE 1,(1,1,0,0,0)=CHR$(225)',
    '50 DEF SPRITE 2,(2,1,0,0,0)=CHR$(225)',
    '60 DEF SPRITE 3,(3,1,0,0,0)=CHR$(225)',
    '70 SPRITE 0,20,80',
    '80 SPRITE 1,70,80',
    '90 SPRITE 2,120,80',
    '100 SPRITE 3,170,80',
    '110 LOCATE 0,22',
    '```',

    'All four sprites use the same graphic',
    'but each has a different color.',

    '## Switching Palette Sets',

    'You can change sprite colors during your',
    'program by calling `PALETS` again:',
    '```basic',
    '10 SPRITE ON',
    '20 PALETS 0, 6, 5, 4, 3',
    '30 DEF SPRITE 0,(0,1,0,0,0)=CHR$(225)',
    '40 SPRITE 0,100,100',
    '50 PAUSE 60',
    '60 PALETS 0, 15, 14, 13, 12',
    '70 PAUSE 60',
    '80 LOCATE 0,22',
    '```',

    'The sprite changes color in place.',

    '## Combining with Background Colors',

    'Use `PALETS` for sprites and `PALETB`',
    'for the background together:',
    '```basic',
    '10 SPRITE ON',
    '20 PALETS 0, 6, 5, 4, 3',
    '30 PALETB 0, 1, 2, 8, 9',
    '40 CGSET 0, 0',
    '50 DEF SPRITE 0,(1,1,0,0,0)=CHR$(225)',
    '60 FOR I=0 TO 150',
    '70 PRINT CHR$(225);',
    '80 NEXT',
    '90 VIEW',
    '100 SPRITE 0,100,100',
    '110 LOCATE 0,22',
    '```',

    'The sprite appears on top of the',
    'colored background.',

    '## Color Coordination Tips',

    '- Use `PALETS` for sprite colors',
    '- Use `PALETB` for background colors',
    '- Choose contrasting colors so sprites',
    '  are easy to see against the background',
    '- Use `CGSET` to activate the palette',

    '## Try It',

    'Try creating a colorful sprite display:',
    '```basic',
    '10 SPRITE ON',
    '20 PALETS 0, 6, 10, 14, 15',
    '30 PALETB 0, 1, 2, 8, 9',
    '40 CGSET 0, 0',
    '50 DEF SPRITE 0,(0,1,0,0,0)=CHR$(225)',
    '60 DEF SPRITE 1,(1,1,0,0,0)=CHR$(226)',
    '70 DEF SPRITE 2,(2,1,0,0,0)=CHR$(227)',
    '80 DEF SPRITE 3,(3,1,0,0,0)=CHR$(228)',
    '90 SPRITE 0,30,60',
    '100 SPRITE 1,90,60',
    '110 SPRITE 2,150,60',
    '120 SPRITE 3,210,60',
    '130 LOCATE 0,22',
    '```',
  ].join('\n\n'),
}
