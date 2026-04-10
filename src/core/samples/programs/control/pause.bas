10 REM * PAUSE Command Demo *
20 REM PAUSE halts execution for n ticks (~12ms each)
30 CLS
40 REM === 1-Second Countdown ===
50 PRINT "=== COUNTDOWN ==="
60 FOR I = 5 TO 1 STEP -1
70 PRINT "Countdown: "; I
80 PAUSE 80
90 NEXT
100 PRINT "Blast off!"
110 PAUSE 50
120 PRINT ""
130 REM === Short Pause Demo ===
140 PRINT "=== SHORT PAUSE ==="
150 PRINT "Quick dots..."
160 FOR I = 1 TO 5
170 PRINT ".";
180 PAUSE 30
190 NEXT
200 PRINT ""
210 PAUSE 50
220 REM === Long Pause Demo ===
290 PRINT "=== LONG PAUSE ==="
300 PRINT "Waiting 3 seconds..."
310 PAUSE 250
320 PRINT "Done!"
330 END
