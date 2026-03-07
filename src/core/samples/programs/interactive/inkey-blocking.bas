10 CLS
20 PRINT "=== INKEY$(0) BLOCKING TEST ==="
30 PRINT "This mode waits for input"
40 PRINT ""
50 PRINT "Enter character: ";
60 K$ = INKEY$(0)
70 PRINT K$; " (code "; ASC(K$); ")"
80 PRINT "Press Q to quit, any other to continue"
90 IF K$ = "Q" THEN 110
100 GOTO 50
110 PRINT "Done!"
120 END
