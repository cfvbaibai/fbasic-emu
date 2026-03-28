10 REM * TITLE SCREEN DEMO *
20 REM Demonstrates creating a title screen
30 REM  using BG GRAPHIC + VIEW + LOCATE.
40 REM The BG editor created a decorative
50 REM  border with stars and hearts.
60 REM VIEW copies it to the background,
70 REM  then LOCATE positions text on top.
80 CLS
90 CGSET 1,1
100 VIEW
110 LOCATE 9,7:PRINT "MY AWESOME GAME"
120 LOCATE 11,9:PRINT "Version 1.0"
130 LOCATE 9,14:PRINT "Press START"
140 END
