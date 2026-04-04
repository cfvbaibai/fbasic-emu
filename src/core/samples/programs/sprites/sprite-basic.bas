10 REM * SPRITE BASIC *
20 REM Demonstrates basic sprite operations:
30 REM  - SPRITE ON enables the sprite screen
40 REM  - DEF SPRITE defines a sprite's appearance
45 REM  - SPRITE displays it at given coordinates
50 REM  - DEF MOVE defines automatic movement
55 REM  - MOVE starts, CUT stops, ERA erases
60 CLS
70 SPRITE ON
80 REM Define sprite 0 as an 8x8 character (CHR$(208))
90 DEF SPRITE 0, (0,0,0,0,0)=CHR$(208)
100 REM Place sprite at center of screen
110 SPRITE 0, 120, 100
120 PRINT "Sprite placed at (120,100)"
130 PRINT "Now moving right..."
140 PAUSE 150
150 REM Define movement: sprite 0, direction 2 (right),
160 REM speed 3, distance 120 dots, priority 0, color 0
170 DEF MOVE(0)=SPRITE(0,2,3,120,0,0)
180 MOVE 0
190 PAUSE 100
200 CUT 0
210 PRINT "Stopped at X="; XPOS(0)
220 PAUSE 100
230 ERA 0
240 PRINT "Sprite erased. Done!"
250 END
