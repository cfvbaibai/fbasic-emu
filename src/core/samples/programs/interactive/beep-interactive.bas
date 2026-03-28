10 REM Interactive BEEP demo: press button A to trigger a sound,
15 REM press START to exit. Demonstrates STRIG() button polling.
20 CLS
30 PRINT "Press A to BEEP"
40 PRINT "Press START to exit"
50 T=STRIG(0)
60 IF (T AND 8)=8 THEN BEEP:PAUSE 50
70 IF (T AND 1)=1 THEN 100
80 GOTO 50
100 PRINT "Goodbye!"
110 END
