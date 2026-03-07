10 REM * BG & PRINT OVERLAP DEMO *
20 REM Demonstrates that VIEW copies BG to Background Screen
30 REM which OVERWRITES any existing PRINT content
40 CLS
50 REM Step 1: Fill printable area with blocks FIRST
60 FOR Y=0 TO 23
70 FOR X=0 TO 27
80 LOCATE X,Y:PRINT CHR$(255);
90 NEXT
100 NEXT
105 LOCATE 12,10
110 REM Step 2: VIEW copies BG GRAPHIC over the blocks
120 REM Notice how BG box frame replaces the blocks it covers
130 VIEW
140 REM Define all 8 sprites at boundaries
150 SPRITE ON
160 FOR I=0 TO 7:DEF SPRITE I,(0,0,0,0,0)=CHR$(208):NEXT
170 REM 8 boundary positions (clockwise from top-left)
180 SPRITE 0,0,0:SPRITE 1,124,0:SPRITE 2,248,0
190 SPRITE 3,248,116:SPRITE 4,248,232
200 SPRITE 5,124,232:SPRITE 6,0,232:SPRITE 7,0,116
210 END
