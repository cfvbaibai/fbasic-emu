/**
 * Lesson 16: Building a Game (Part 1) — Combining sprites and movement.
 *
 * Covers combining sprites, movement, position tracking,
 * and simple collision detection for a basic game.
 */

import type { Lesson } from '../types'

export const lesson16BuildingAGame1: Lesson = {
  title: 'Building a Game (Part 1)',

  content: [
    '# Lesson 16: Building a Game (Part 1)',

    'Now let\'s combine everything you have learned',
    'about sprites, movement, and position tracking',
    'to build a simple game.',

    '## Game Design',

    'We will create a game where:',
    '- A player sprite moves across the screen',
    '- An enemy sprite moves automatically',
    '- The game checks for collision between them',
    '- A message is shown when they collide',

    '## Step 1: Set Up Sprites',

    'First, enable sprites and define them:',
    '```basic',
    '10 SPRITE ON',
    '20 DEF SPRITE 0,(1,1,0,0,0)=CHR$(225)',
    '30 DEF SPRITE 1,(2,1,0,0,0)=CHR$(226)',
    '40 SPRITE 0,10,100',
    '50 SPRITE 1,200,100',
    '```',

    'Sprite 0 is the player, sprite 1 is the enemy.',

    '## Step 2: Define Movement',

    'The enemy moves toward the player:',
    '```basic',
    '60 DEF MOVE(1)=SPRITE(1,1,4,200,0,2)',
    '70 MOVE 1',
    '```',

    'Direction `1` means the enemy moves left.',

    '## The GOTO Statement',

    'The `GOTO` command jumps directly to',
    'a specific line number in your program.',
    'It is often used with `IF...THEN` to jump',
    'to a different part of the program',
    'when a condition is met.',
    '```basic',
    'IF condition THEN GOTO line_number',
    '```',
    'In Lesson 4, you saw `THEN 50` to jump to line 50.',
    '`THEN GOTO 150` does the same thing —',
    'the `GOTO` keyword just makes the jump explicit.',

    '## Step 3: Game Loop',

    'The game loop checks positions and',
    'looks for collision:',
    '```basic',
    '80 FOR T=1 TO 100',
    '90 PX=XPOS(0):PY=YPOS(0)',
    '100 EX=XPOS(1):EY=YPOS(1)',
    '110 IF ABS(PX-EX)<20 AND ABS(PY-EY)<20 THEN GOTO 150',
    '120 SPRITE 0,10+T*2,100',
    '130 PAUSE 5',
    '140 NEXT',
    '```',

    '## Step 4: Collision Detection',

    'When sprites are close together,',
    'a collision is detected:',
    '```basic',
    '150 CUT 1',
    '160 ERA 0',
    '170 ERA 1',
    '180 CLS',
    '190 PRINT "GAME OVER!"',
    '200 PRINT "COLLISION!"',
    '210 LOCATE 0,22',
    '```',

    '## Complete Program',

    'Here is the full game:',
    '```basic',
    '10 SPRITE ON',
    '20 DEF SPRITE 0,(1,1,0,0,0)=CHR$(225)',
    '30 DEF SPRITE 1,(2,1,0,0,0)=CHR$(226)',
    '40 SPRITE 0,10,100',
    '50 SPRITE 1,200,100',
    '60 DEF MOVE(1)=SPRITE(1,1,4,180,0,2)',
    '70 MOVE 1',
    '80 FOR T=1 TO 100',
    '90 PX=XPOS(0):PY=YPOS(0)',
    '100 EX=XPOS(1):EY=YPOS(1)',
    '110 IF ABS(PX-EX)<20 AND ABS(PY-EY)<20 THEN GOTO 150',
    '120 SPRITE 0,10+T*2,100',
    '130 PAUSE 5',
    '140 NEXT',
    '150 CUT 1',
    '160 ERA 0',
    '170 ERA 1',
    '180 CLS',
    '190 PRINT "GAME OVER!"',
    '200 PRINT "COLLISION!"',
    '210 LOCATE 0,22',
    '```',

    '## Key Concepts',

    '- **Sprite setup**: Define sprites before use',
    '- **Movement**: Use `DEF MOVE` and `MOVE`',
    '- **Position tracking**: `XPOS` and `YPOS`',
    '- **Collision**: Check distance between sprites',
    '- **Game over**: Clean up with `ERA` and `CUT`',

    '## Try It',

    'Try modifying the game:',
    '```basic',
    '10 SPRITE ON',
    '20 DEF SPRITE 0,(1,1,0,0,0)=CHR$(225)',
    '30 DEF SPRITE 1,(3,1,0,0,0)=CHR$(226)',
    '40 DEF SPRITE 2,(2,1,0,0,0)=CHR$(227)',
    '50 SPRITE 0,10,80',
    '60 SPRITE 1,200,60',
    '70 SPRITE 2,200,120',
    '80 DEF MOVE(1)=SPRITE(1,1,3,180,0,3)',
    '90 DEF MOVE(2)=SPRITE(2,1,5,180,0,2)',
    '100 MOVE 1',
    '110 MOVE 2',
    '120 FOR T=1 TO 100',
    '130 SPRITE 0,10+T*2,80',
    '140 PAUSE 5',
    '150 NEXT',
    '160 CUT 1',
    '170 CUT 2',
    '180 LOCATE 0,22',
    '```',
  ].join('\n\n'),
}
