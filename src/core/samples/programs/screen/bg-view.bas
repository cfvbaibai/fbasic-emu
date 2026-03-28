10 REM * BG VIEW DEMO *
20 REM Demonstrates the VIEW command:
30 REM  VIEW copies BG GRAPHIC data to the
40 REM  background screen so it appears
50 REM  behind text and sprites.
60 REM This sample uses a pre-made BG with
70 REM  a border and diamond decoration.
80 REM (Load BG data from the BG editor first)
90 CLS
100 CGSET 1,1
110 VIEW
120 LOCATE 8,8:PRINT "BG VIEW Demo"
130 LOCATE 6,10:PRINT "BG graphics are"
140 LOCATE 6,11:PRINT "shown via VIEW."
150 LOCATE 4,14:PRINT "Border drawn in BG"
160 LOCATE 4,15:PRINT "editor is visible!"
170 END
