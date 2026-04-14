/**
 * Lesson 11: Sprite Position — Reading and controlling sprite position.
 *
 * Covers XPOS and YPOS functions for reading sprite position,
 * ERA for erasing sprites, and interactive sprite control.
 */

import type { Lesson } from '../types'

export const lesson11SpritePosition: Lesson = {
  title: 'Sprite Position',

  content: [
    '# Lesson 11: Sprite Position',

    'You can read a sprite\'s current position',
    'and use that information in your programs.',
    'This is essential for collision detection',
    'and interactive sprite control.',

    '## Reading Sprite Position',

    'Use `XPOS` and `YPOS` to get the current',
    'position of a sprite:',
    '```basic',
    'X = XPOS(n)',
    'Y = YPOS(n)',
    '```',

    '- `XPOS(n)` — Returns the X coordinate of sprite `n`',
    '- `YPOS(n)` — Returns the Y coordinate of sprite `n`',

    '## Basic Example',

    'This program reads and displays a sprite\'s',
    'position:',
    '```basic',
    '10 SPRITE ON',
    '20 DEF SPRITE 0,(1,1,0,0,0)=CHR$(225)',
    '30 SPRITE 0,100,80',
    '40 PRINT "X=";XPOS(0)',
    '50 PRINT "Y=";YPOS(0)',
    '```',

    '## Tracking a Moving Sprite',

    'You can track a sprite\'s position as it moves:',
    '```basic',
    '10 SPRITE ON',
    '20 DEF SPRITE 0,(1,1,0,0,0)=CHR$(225)',
    '30 SPRITE 0,10,100',
    '40 DEF MOVE(0)=SPRITE(0,0,4,200,0,1)',
    '50 MOVE 0',
    '60 FOR I=1 TO 20',
    '70 PRINT "X=";XPOS(0);" Y=";YPOS(0)',
    '80 PAUSE 10',
    '90 NEXT',
    '100 CUT 0',
    '110 LOCATE 0,22',
    '```',

    '## Erasing a Sprite',

    'Use `ERA` to remove a sprite from the screen:',
    '```basic',
    'ERA n',
    '```',

    'The sprite disappears but its definition',
    'is still saved. You can display it again',
    'with `SPRITE`.',

    '## Basic Erase Example',
    '```basic',
    '10 SPRITE ON',
    '20 DEF SPRITE 0,(1,1,0,0,0)=CHR$(225)',
    '30 SPRITE 0,100,100',
    '40 PAUSE 60',
    '50 ERA 0',
    '60 PRINT "SPRITE ERASED"',
    '```',

    '## Redisplaying After Erase',

    'After erasing, you can show the sprite',
    'at a new position:',
    '```basic',
    '10 SPRITE ON',
    '20 DEF SPRITE 0,(1,1,0,0,0)=CHR$(225)',
    '30 FOR I=0 TO 5',
    '40 SPRITE 0,I*40,100',
    '50 PAUSE 30',
    '60 ERA 0',
    '70 NEXT',
    '80 LOCATE 0,22',
    '```',

    '## Using Position in Conditions',

    'Check position to trigger actions:',
    '```basic',
    '10 SPRITE ON',
    '20 DEF SPRITE 0,(1,1,0,0,0)=CHR$(225)',
    '30 SPRITE 0,10,100',
    '40 DEF MOVE(0)=SPRITE(0,0,4,200,0,1)',
    '50 MOVE 0',
    '60 FOR I=1 TO 50',
    '70 IF XPOS(0)>150 THEN PRINT "NEAR EDGE!"',
    '80 PAUSE 5',
    '90 NEXT',
    '100 CUT 0',
    '110 LOCATE 0,22',
    '```',

    '## Try It',

    'Try creating a position-tracking program:',
    '```basic',
    '10 SPRITE ON',
    '20 DEF SPRITE 0,(1,1,0,0,0)=CHR$(225)',
    '30 SPRITE 0,10,50',
    '40 DEF MOVE(0)=SPRITE(0,0,4,220,0,1)',
    '50 MOVE 0',
    '60 FOR I=1 TO 30',
    '70 PRINT XPOS(0);YPOS(0)',
    '80 PAUSE 5',
    '90 NEXT',
    '100 CUT 0',
    '110 LOCATE 0,22',
    '```',
  ].join('\n\n'),
}
