10 PRINT "Joystick Test"
15 L1 = 0
20 S = STICK(0)
30 T = STRIG(0)
40 IF T=1 THEN 100
45 REM === Adaptive PAUSE: responsive when idle, controlled when active ===
50 IF S <> L1 THEN L1 = S: GOTO 80
55 REM No input change - short pause for quick response
60 PAUSE 1
65 GOTO 20
70 REM Input changed - longer pause when processing
80 IF S>0 THEN PRINT S
90 PAUSE 5
95 GOTO 20
100 END
