/**
 * Lesson 9: Sprites — Introduction to sprites.
 *
 * Covers SPRITE ON/OFF for enabling sprite display,
 * DEF SPRITE for defining sprite appearance,
 * and SPRITE for displaying sprites on screen.
 */

import type { Lesson } from '../types'

export const lesson9Sprites: Lesson = {
  title: 'Sprites',

  content: [
    '# Lesson 9: Sprites',

    'Sprites are small graphics that you can move around',
    'the screen independently of text.',
    'They are used for characters, enemies, items,',
    'and other moving objects in games.',

    '## Enabling Sprites',

    'Before using sprites, you must turn them on:',
    '```basic',
    'SPRITE ON',
    '```',

    'When you are done with sprites, turn them off:',
    '```basic',
    'SPRITE OFF',
    '```',

    '## Defining a Sprite',

    'Use `DEF SPRITE` to create a sprite.',
    'You specify the sprite number, its color',
    'combination, size, priority, and flip mode:',
    '```basic',
    'DEF SPRITE n,(c,s,p,mx,my)=CHR$(code)',
    '```',

    '- `n` — Sprite number (0 to 7)',
    '- `c` — Color combination (0 to 3)',
    '- `s` — Size (0 = 8x8, 1 = 16x16)',
    '- `p` — Priority (0 = front, 1 = behind background)',
    '- `mx` — Horizontal flip (0 = normal, 1 = inverted)',
    '- `my` — Vertical flip (0 = normal, 1 = inverted)',
    '- `code` — Character code for the sprite graphic',

    '## Displaying a Sprite',

    'After defining a sprite, use `SPRITE` to',
    'place it on the screen:',
    '```basic',
    'SPRITE n, X, Y',
    '```',

    '- `n` — Sprite number',
    '- `X` — Horizontal position (0 to 255)',
    '- `Y` — Vertical position (0 to 239)',

    '## Basic Example',

    'This program defines and displays a sprite:',
    '```basic',
    '10 SPRITE ON',
    '20 DEF SPRITE 0,(1,1,0,0,0)=CHR$(225)',
    '30 SPRITE 0,100,100',
    '40 LOCATE 0,22',
    '```',

    'The sprite appears at position (100, 100).',

    '## Multiple Sprites',

    'You can define and display up to 8 sprites:',
    '```basic',
    '10 SPRITE ON',
    '20 DEF SPRITE 0,(1,1,0,0,0)=CHR$(225)',
    '30 DEF SPRITE 1,(2,1,0,0,0)=CHR$(226)',
    '40 DEF SPRITE 2,(3,1,0,0,0)=CHR$(227)',
    '50 SPRITE 0,50,100',
    '60 SPRITE 1,100,100',
    '70 SPRITE 2,150,100',
    '80 LOCATE 0,22',
    '```',

    '## Sprite Size',

    'Sprites can be 8x8 or 16x16 pixels.',
    'Use the `s` parameter in `DEF SPRITE` to set',
    'the size:',
    '- `(...,0,...)` — Small sprite (8x8 pixels)',
    '- `(...,1,...)` — Large sprite (16x16 pixels)',

    '## Try It',

    'Try creating your own sprite display:',
    '```basic',
    '10 SPRITE ON',
    '20 DEF SPRITE 0,(0,1,0,0,0)=CHR$(225)',
    '30 DEF SPRITE 1,(1,1,0,0,0)=CHR$(226)',
    '40 FOR I=0 TO 10',
    '50 SPRITE 0,I*20,100',
    '60 SPRITE 1,I*20,120',
    '70 NEXT',
    '80 LOCATE 0,22',
    '```',
  ].join('\n\n'),
}
