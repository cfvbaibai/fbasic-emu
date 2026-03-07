10 CLS
20 PRINT "Twinkle Twinkle Little Star"
30 PRINT "==========================="
40 PLAY "T2"
50 V=1
60 REM === VERSE LOOP ===
70 REM Twinkle twinkle little star
80 PLAY "C5CGGAAG7"
90 REM How I wonder what you are
100 PLAY "F5FEEDDC7"
110 REM Up above the world so high
120 PLAY "G5GFFEED7"
130 REM Like a diamond in the sky
140 PLAY "G5GFFEED7"
150 REM Twinkle twinkle little star
160 PLAY "C5CGGAAG7"
170 REM How I wonder what you are
180 PLAY "F5FEEDDC9"
190 V=V+1
200 IF V<=2 THEN PRINT "":PRINT "Verse ";V:GOTO 60
210 PRINT ""
220 PRINT "Song complete!"
230 END
