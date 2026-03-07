10 CLS
20 PRINT "=== SPRITE TABLE B TEST ==="
30 PRINT "CGEN 3: B on BG, B on sprite"
40 PRINT "Using BG characters for sprites"
50 PRINT ""
60 ' Set CGEN mode 3: Table B for both BG and sprites
70 CGEN 3
80 ' Define sprites using Table B character codes
90 ' &HC7 (199) = flag, &HD7 (215) = apple
100 DEF SPRITE 0,(0,0,0,0,0)=CHR$(&HC7)
110 DEF SPRITE 1,(1,0,0,0,0)=CHR$(&HD7)
120 PALETS 0,13,&H16,&H27,2
130 PALETS 1,13,&H16,&H17,4
140 SPRITE ON
150 ' Display sprites at different positions
160 SPRITE 0,50,100
170 SPRITE 1,150,100
180 PRINT "Sprite 0: Flag at (50,100)"
190 PRINT "Sprite 1: Apple at (150,100)"
200 PRINT ""
210 PRINT "Use D-pad to move sprite 0"
220 PRINT "Press A to hide sprite 1"
230 PRINT "Press B to show sprite 1"
240 PRINT "Press START to end"
250 ' Main loop
260 X=50:Y=100
270 S=STICK(0):T=STRIG(0)
280 IF S=1 THEN X=X+4
290 IF S=2 THEN X=X-4
300 IF S=4 THEN Y=Y+4
310 IF S=8 THEN Y=Y-4
320 IF X<0 THEN X=0
330 IF X>240 THEN X=240
340 IF Y<0 THEN Y=0
350 IF Y>220 THEN Y=220
360 SPRITE 0,X,Y
370 IF T=8 THEN SPRITE 1
380 IF T=4 THEN SPRITE 1,150,100
390 IF T=1 THEN 450
400 PAUSE 2
410 GOTO 270
450 SPRITE OFF
460 PRINT "Goodbye!"
470 END
