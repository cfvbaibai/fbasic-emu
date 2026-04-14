/**
 * Lesson 10: Sprite Movement — Animating sprites.
 *
 * Covers DEF MOVE for defining movement patterns,
 * MOVE to start animation, and CUT to stop it.
 */

import type { Lesson } from '../types'

export const lesson10SpriteMovement: Lesson = {
  title: 'Sprite Movement',

  content: [
    '# Lesson 10: Sprite Movement',

    'You can make sprites move automatically',
    'by defining movement patterns.',
    'This is useful for enemies, bullets,',
    'and other animated objects in games.',

    '## Defining Movement',

    'Use `DEF MOVE` to set how a sprite moves:',
    '```basic',
    'DEF MOVE(n)=SPRITE(charType,dir,speed,dist,prio,color)',
    '```',

    '- `n` — Action number (0 to 7)',
    '- `charType` — Character type (0 to 15)',
    '- `dir` — Direction (0=right, 1=left, 2=up, 3=down)',
    '- `speed` — Movement speed (0 to 255)',
    '- `dist` — Distance in dots (total = 2 x dist)',
    '- `prio` — Priority (0=front, 1=behind background)',
    '- `color` — Color combination (0 to 3)',

    '## Starting and Stopping Movement',

    'Use `MOVE` to start the movement,',
    'and `CUT` to stop it:',
    '```basic',
    'MOVE actionNumber',
    'CUT actionNumber',
    '```',

    '- `actionNumber` — Action number to start/stop (0 to 7)',

    '## Basic Example: Moving Sprite',

    'This program moves a sprite to the right:',
    '```basic',
    '10 SPRITE ON',
    '20 DEF SPRITE 0,(1,1,0,0,0)=CHR$(225)',
    '30 SPRITE 0,10,100',
    '40 DEF MOVE(0)=SPRITE(0,0,4,100,0,1)',
    '50 MOVE 0',
    '60 LOCATE 0,22',
    '```',

    'The sprite moves right at speed 4',
    'for a distance of 100 pixels.',

    '## Direction Values',

    'The `dir` parameter controls direction:',
    '- `0` — Move right',
    '- `1` — Move left',
    '- `2` — Move up',
    '- `3` — Move down',
    '- `4-8` — Diagonal and other directions',

    '## Speed Control',

    'The `speed` value controls how fast',
    'the sprite moves (1 is slowest, 16 is fastest):',
    '```basic',
    '10 SPRITE ON',
    '20 DEF SPRITE 0,(1,1,0,0,0)=CHR$(225)',
    '30 DEF SPRITE 1,(2,1,0,0,0)=CHR$(226)',
    '40 SPRITE 0,10,50',
    '50 SPRITE 1,10,100',
    '60 DEF MOVE(0)=SPRITE(0,0,2,100,0,1)',
    '70 DEF MOVE(1)=SPRITE(1,0,8,100,0,2)',
    '80 MOVE 0',
    '90 MOVE 1',
    '100 LOCATE 0,22',
    '```',

    '## Stopping Movement',

    'Use `CUT` to stop a moving sprite:',
    '```basic',
    '10 SPRITE ON',
    '20 DEF SPRITE 0,(1,1,0,0,0)=CHR$(225)',
    '30 SPRITE 0,10,100',
    '40 DEF MOVE(0)=SPRITE(0,0,4,200,0,1)',
    '50 MOVE 0',
    '60 PAUSE 50',
    '70 CUT 0',
    '80 LOCATE 0,22',
    '```',

    'After `CUT`, the sprite stops in place.',

    '## Try It',

    'Try making multiple sprites move in',
    'different directions:',
    '```basic',
    '10 SPRITE ON',
    '20 DEF SPRITE 0,(1,1,0,0,0)=CHR$(225)',
    '30 DEF SPRITE 1,(2,1,0,0,0)=CHR$(226)',
    '40 SPRITE 0,100,50',
    '50 SPRITE 1,100,150',
    '60 DEF MOVE(0)=SPRITE(0,2,4,80,0,1)',
    '70 DEF MOVE(1)=SPRITE(1,3,4,80,0,2)',
    '80 MOVE 0',
    '90 MOVE 1',
    '100 LOCATE 0,22',
    '```',
  ].join('\n\n'),
}
