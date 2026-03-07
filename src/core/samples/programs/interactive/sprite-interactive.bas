10 CLS
20 SPRITE ON
30 DEF SPRITE 0, (0,0,0,0,0)=CHR$(208)
40 SPRITE 0, 150, 100
50 PX = 150
60 PY = 100
70 L1 = 0
80 S = STICK(0)
90 T = STRIG(0)
100 IF T=1 THEN 190
110 REM === Adaptive PAUSE: responsive input when idle, controlled speed when moving ===
120 IF S <> L1 THEN L1 = S: GOTO 160
130 REM No input change - short pause for quick response to new button presses
140 PAUSE 1
145 GOTO 80
150 REM Input changed - process movement with longer pause to control speed
160 IF S=1 THEN PX = PX + 2
165 IF S=2 THEN PX = PX - 2
170 IF S=4 THEN PY = PY + 2
175 IF S=8 THEN PY = PY - 2
180 SPRITE 0, PX, PY
185 PAUSE 5
190 GOTO 80
200 ERA 0
210 END
