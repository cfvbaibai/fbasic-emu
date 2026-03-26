10 REM * GOSUB/RETURN Demo *
20 REM Subroutines let you reuse code with GOSUB
30 CLS
40 PRINT "=== SQUARE CALCULATOR ==="
50 PRINT ""
60 REM Call subroutine for each number
70 FOR N = 1 TO 5
80 GOSUB 200
90 PRINT N; " squared = "; R
100 NEXT
110 PRINT ""
120 REM === Divider Subroutine ===
130 PRINT "=== DIVIDERS ==="
140 PRINT "Dividers of 12:"
150 LET N = 12
160 FOR D = 1 TO 12
170 GOSUB 300
180 NEXT
190 END
200 REM * Square subroutine *
210 REM Input: N, Output: R
220 LET R = N * N
230 RETURN
300 REM * Check if D divides N *
310 REM Input: N, D
320 IF N - (N / D) * D = 0 THEN PRINT D; " ";
330 RETURN
