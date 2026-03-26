10 REM * PLAY Command Demo *
20 REM T=tempo, numbers=note length, O=octave
30 CLS
40 PRINT "=== PLAY Demo ==="
50 PRINT ""
60 REM Quarter-note scale (default speed)
70 PRINT "Quarter notes:"
80 PLAY "T120O2C5D5E5F5G5A5B5O3C5"
90 PAUSE 30
100 REM Eighth-note scale (faster)
110 PRINT "Eighth notes:"
120 PLAY "T120L8O2CDEFGABO3C"
130 PAUSE 30
140 REM Half notes (slow)
150 PRINT "Half notes:"
160 PLAY "T120O2C10D10E10F10"
170 PAUSE 30
180 REM Chord (3 channels)
190 PRINT "Chord:"
200 PLAY "T120O3C10:O3E10:O3G10"
210 PRINT ""
220 PRINT "Done!"
230 END
