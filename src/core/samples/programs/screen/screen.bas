10 REM * SCREEN DEMO *
20 REM Demonstrates screen control commands:
30 REM  - CLS clears the screen
40 REM  - LOCATE X, Y moves the cursor
50 REM    X = column (0-27), Y = row (0-23)
60 REM  - PRINT outputs text at cursor
70 REM  - CGSET selects color palette
80 REM  - PALETB sets background colors
90 CLS
100 PRINT "Screen Demo"
110 REM Move cursor to column 10, row 5
120 LOCATE 10, 5:PRINT "Row 5, Col 10"
130 LOCATE 10, 7:PRINT "Row 7, Col 10"
140 REM Draw a diagonal line with asterisks
150 FOR I=0 TO 9
160 LOCATE 5+I, 10+I:PRINT "*"
170 NEXT
180 REM Set color palette for background
190 CGSET 0
200 PALETB 0, 1, 0, 0, 0
210 LOCATE 0, 22:PRINT "Done!"
220 END
