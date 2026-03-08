10 REM * SCR$() Function Demo *
20 REM Demonstrates reading characters and colors from screen
30 CLS
40 LOCATE 0,5
50 PRINT "FAMILY BASIC"
60 PRINT "============"
70 REM === Read characters ===
80 LOCATE 0,10
90 PRINT "Reading chars..."
100 FOR X=0 TO 11
110 A$=SCR$(X,5)
120 PRINT A$;
130 NEXT
140 PRINT ""
150 REM === Read character with color ===
160 LOCATE 0,14
170 PRINT "Reading color..."
180 A$=SCR$(0,5)
190 C$=SCR$(0,5,1)
200 PRINT "CHAR: ";A$
210 PRINT "COLOR: ";ASC(C$)
220 PRINT ""
230 PRINT "Done!"
240 END
