10 REM * BGPLAY Demo - Background Music & Sound Effects *
20 REM BGPLAY starts music in the background and returns
30 REM immediately (fire-and-forget). Your program keeps
40 REM running while the music plays!
50 REM In contrast, PLAY blocks until the music finishes.
60 REM
70 CLS
80 PRINT "=== BGPLAY Demo ==="
90 PRINT "Background music + game loop"
100 PRINT ""
110 REM
120 REM --- Part 1: PLAY vs BGPLAY comparison ---
130 REM
140 PRINT "1) PLAY (blocks):"
150 PRINT "  Playing... (wait for it)";
160 PLAY "T120O3C5E5G5O4C5"
170 PRINT " Done!"
180 PRINT ""
190 PRINT "2) BGPLAY (fire-and-forget):"
200 PRINT "  Music started!";
210 BGPLAY "T120O3C5E5G5O4C5"
220 PRINT " But I can print right away!"
230 PAUSE 30
240 REM Wait for background music to finish before continuing
250 PRINT ""
260 REM
270 REM --- Part 2: Background music during a game loop ---
280 REM
290 CLS
300 PRINT "=== Game Loop + BGPLAY ==="
310 PRINT "Sprite moves while music plays"
320 PRINT "Press A = sound effect"
330 PRINT "Press START = exit"
340 PRINT ""
350 REM
360 REM Start background music (simple melody)
370 BGPLAY "T100O2C10E10G10O3C10O2B10G10E10C10"
380 REM
390 REM Game loop - sprite bounces left and right
400 X=5
410 D=1
420 REM Check for START button (bit 0)
430 T=STRIG(0)
440 IF (T AND 1)=1 THEN 560
450 REM Check for A button (bit 3) - sound effect
460 IF (T AND 8)=8 THEN GOSUB 600
470 REM Move sprite position marker
480 LOCATE X,6:PRINT "*";
490 LOCATE X-D,6:PRINT " ";
500 X=X+D
510 IF X>=18 THEN D=-1
520 IF X<=1 THEN D=1
530 PAUSE 5
540 GOTO 420
550 REM
560 LOCATE 0,8:PRINT "Goodbye!"
570 END
580 REM
590 REM --- Subroutine: Sound Effect (PLAY blocks briefly) ---
600 REM PLAY is used for short sound effects because
610 REM we WANT the brief pause for dramatic effect
620 PLAY "T255O5C1C1C1"
630 LOCATE 0,7:PRINT "SFX!  ";
640 RETURN
