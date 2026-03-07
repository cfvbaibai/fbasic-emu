10 CLS
20 PRINT "=== INKEY$ TEST ==="
30 PRINT "Press any key to see it"
40 PRINT "Press Q to quit"
50 PRINT ""
60 K$ = INKEY$
70 IF K$ = "" THEN 60
80 IF K$ = "Q" THEN 120
90 PRINT "You pressed: "; K$; " (code "; ASC(K$); ")"
100 PAUSE 10
110 GOTO 60
120 PRINT "Goodbye!"
130 END
