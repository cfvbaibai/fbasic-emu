10 CLS
20 PRINT "Jingle Bells"
30 PRINT "============"
40 PLAY "T2"
50 REM === VERSE: Dashing through the snow ===
60 PLAY "E5E5E7E5E5E7"
70 REM In a one-horse open sleigh
80 PLAY "E5G5C5D6E8"
90 REM O'er the fields we go
100 PLAY "F5F5F5F5F5E5E5"
110 REM Laughing all the way
120 PLAY "E5E5D5D5E5D6G7"
130 REM Bells on bobtail ring
140 PLAY "F5F5F5F5F5E5E5"
150 REM Making spirits bright
160 PLAY "G5G5F5D5C6O4C8"
170 REM What fun it is to ride and sing
180 PLAY "O3E5E5E5E5E5E5E5G5C5D5E8"
190 REM A sleighing song tonight
200 PLAY "F5F5F5F5F5E5E5E5G5G5F5D5C8"
210 REM === CHORUS (first time) ===
220 GOSUB 400
230 REM === CHORUS (second time) ===
240 GOSUB 400
250 PRINT ""
260 PRINT "Merry Christmas!"
270 END
280 REM ========== CHORUS SUBROUTINE ==========
400 REM Jingle bells, jingle bells
410 PLAY "E5E5E7E5E5E7"
420 REM Jingle all the way
430 PLAY "E5G5C5D6E8"
440 REM Oh what fun it is to ride
450 PLAY "F5F5F5F5F5E5E5E5D5D5E5D6G7"
460 REM In a one-horse open sleigh
470 PLAY "F5F5F5F5F5E5E5G5G5F5D5C8"
480 RETURN
