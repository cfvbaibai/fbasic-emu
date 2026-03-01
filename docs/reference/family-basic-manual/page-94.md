# BASIC

## Sample program 1

### ** EXERCISE 1 ** - KNIGHT

**Program Listing:**

```basic
10 VIEW:CGEN 3:CGSET 1,1
20 DEF SPRITE 0,(0,0,0,0,0)=CHR$(&HC7)
30 PALETS 0,13,&H16,&H27,2
40 DEF SPRITE 2,(0,0,0,0,0)=CHR$(&HD7)
50 DEF SPRITE 1,(0,0,0,0,0)=CHR$(&HC7)
60 PALETS 1,13,&H16,&H17,4
70 DEF SPRITE 3,(1,0,0,0,0)=CHR$(&HD7)
80 SPRITE ON
90 DIM HX(1),HY(1)
100 DIM X(7),Y(7),B(7,7)
110 X(0)=-1:Y(0)=-2
120 X(1)=-2:Y(1)=-1
130 X(2)=-2:Y(2)=1
140 X(3)=-1:Y(3)=2
150 X(4)=1:Y(4)=2
160 X(5)=2:Y(5)=1
170 X(6)=2:Y(6)=-1
180 X(7)=1:Y(7)=-2
190 C=0:GOSUB 250
200 C=1:GOSUB 250
210 C=1+(C=1)
220 GOSUB 390
230 IF F=-1 THEN 560
240 GOTO 210
250 X=0:Y=0:F=0
260 GOSUB 440
270 IF F=1 THEN PLAY "T1O3C2":F=0:GOTO 260
280 IF T=8 THEN RETURN
290 IF S=4 THEN Y=Y+1:IF Y>7 THEN Y=7
300 IF S=8 THEN Y=Y-1:IF Y<0 THEN Y=0
310 X=X+(S=1)-(S=2)
320 X=-X*(X>0)+(X>7)
330 GOTO 260
340 GOSUB 440:F=0
350 IF T=8 THEN RETURN
360 IF S=0 THEN S=4
370 IF S=8 THEN N=N-1:IF N<0 THEN N=7
380 IF S=4 THEN N=N+1:IF N>7 THEN N=0
390 X=HX(C)+X(N):Y=HY(C)+Y(N)
400 F=F+1:IF F>8 THEN F=-1:RETURN
410 IF X<0 OR X>7 OR Y<0 OR Y>7 THEN 360
420 IF B(X,Y)=1 THEN 360
430 GOTO 340
440 SPRITE C,136-16*X,16*Y+47
450 T=STRIG(C):S=STICK(C)
460 IF (S+T)=0 THEN 450
470 IF T<>8 THEN 540
480 IF B(X,Y)=1 THEN F=1:RETURN
490 B(X,Y)=1
500 HX(C)=X:HY(C)=Y
510 SPRITE C+2,136-HX(C)*16,16*HY(C)+47
520 LOCATE 15+2*HX(C),3+2*HY(C)
530 PRINT "*":PLAY "T1O3CDEG"
540 SPRITE C
550 RETURN
560 REM * END ROUTINE
570 LOCATE 3,20:PLAY "T1O3CDET2O4EGAC"
580 IF C=1 THEN PRINT "BLUE ";
590 IF C=0 THEN PRINT "RED ";
600 PRINT "WIN !!":END
```

**Note:** This is a 2-player knight movement game where players take turns placing pieces using valid knight moves (L-shaped). The player who cannot make a valid move loses.

### KNIGHT

**Description:**

Use the knight's move to move around while placing your pieces on the chessboard. Take time to anticipate the other side's next move. The one who cannot move any more loses.

**How to play:**

2 players face off each other. Use the up and down directions of the button of the controller to know where you can move to next. When you have decided, use the A button to set it. Both of you repeat this.

**Chessboard:**

The game uses an 8×8 chessboard:
- Columns: 8 to 1 (from left to right)
- Rows: A to H (from top to bottom)
- Knight moves are shown with asterisks (*) indicating possible positions
- Current position is marked with a circular icon

### Warning: When changing or modifying the program

- **When creating, changing or modifying a BASIC program, always erase the BG GRAPHIC (background) screen beforehand. Not doing this might result in an error.**

- **Press the CLR HOME key while holding down the SHIFT key to erase the BG GRAPHIC screen.**

- **The cursor will return to its home position.**

- **Call the program with LIST and execute the changes and modifications.**

## Background Screen Data

**Grid Structure:**

The background screen data grid represents 28 horizontal cells (columns 0-27) and 21 vertical cells (rows 0-20).

**Character Codes:**

The grid contains various alphanumeric codes:
- **K codes:** K72, K52, K22, K42, K02, K32, K12, K62 (forming the chessboard pattern)
- **L codes:** L02, L22, L12 (forming chessboard borders)
- **J codes:** J60, J30, J70, J20, J00, J10 (forming text borders)
- **Text:** "KNIGHT" appears in row 2, columns 18-26

**Background Screen Data Grid:**

|   | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10| 11| 12| 13| 14| 15| 16| 17| 18| 19| 20| 21| 22| 23| 24| 25| 26| 27|
|---|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|
| 0 |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |
| 1 |   |8  |   |7  |   |6  |   |5  |   |4  |   |3  |   |2  |   |1  |   |   |   |I60|J30|J30|J30|J30|J30|J30|I70|   |
| 2 |K72|K52|K22|K52|K22|K52|K22|K52|K22|K52|K22|K52|K22|K52|K22|K52|L02|   |   |J20|K  |N  |I  |G  |H  |T  |J20|   |
| 3 |K62|   |K62|   |K62|   |K62|   |K62|   |K62|   |K62|   |K62|   |K62| A |   |J00|J30|J30|J30|J30|J30|J30|J10|   |
| 4 |K42|K52|K02|K52|K02|K52|K02|K52|K02|K52|K02|K52|K02|K52|K02|K52|K32|   |   |   |   |   |   |   |   |   |   |   |
| 5 |K62|   |K62|   |K62|   |K62|   |K62|   |K62|   |K62|   |K62|   |K62| B |   |   |   |   |   |   |   |   |   |   |
| 6 |K42|K52|K02|K52|K02|K52|K02|K52|K02|K52|K02|K52|K02|K52|K02|K52|K32|   |   |   |   |   |   |   |   |   |   |   |
| 7 |K62|   |K62|   |K62|   |K62|   |K62|   |K62|   |K62|   |K62|   |K62| C |   |   |   |   |   |   |   |   |   |   |
| 8 |K42|K52|K02|K52|K02|K52|K02|K52|K02|K52|K02|K52|K02|K52|K02|K52|K32|   |   |   |   |   |   |   |   |   |   |   |
| 9 |K62|   |K62|   |K62|   |K62|   |K62|   |K62|   |K62|   |K62|   |K62| D |   |   |   |   |   |   |   |   |   |   |
| 10|K42|K52|K02|K52|K02|K52|K02|K52|K02|K52|K02|K52|K02|K52|K02|K52|K32|   |   |   |   |   |   |   |   |   |   |   |
| 11|K62|   |K62|   |K62|   |K62|   |K62|   |K62|   |K62|   |K62|   |K62| E |   |   |   |   |   |   |   |   |   |   |
| 12|K42|K52|K02|K52|K02|K52|K02|K52|K02|K52|K02|K52|K02|K52|K02|K52|K32|   |   |   |   |   |   |   |   |   |   |   |
| 13|K62|   |K62|   |K62|   |K62|   |K62|   |K62|   |K62|   |K62|   |K62| F |   |   |   |   |   |   |   |   |   |   |
| 14|K42|K52|K02|K52|K02|K52|K02|K52|K02|K52|K02|K52|K02|K52|K02|K52|K32|   |   |   |   |   |   |   |   |   |   |   |
| 15|K62|   |K62|   |K62|   |K62|   |K62|   |K62|   |K62|   |K62|   |K62| G |   |   |   |   |   |   |   |   |   |   |
| 16|K42|K52|K02|K52|K02|K52|K02|K52|K02|K52|K02|K52|K02|K52|K02|K52|K32|   |   |   |   |   |   |   |   |   |   |   |
| 17|K62|   |K62|   |K62|   |K62|   |K62|   |K62|   |K62|   |K62|   |K62| H |   |   |   |   |   |   |   |   |   |   |
| 18|L12|K52|K12|K52|K12|K52|K12|K52|K12|K52|K12|K52|K12|K52|K12|K52|L22|   |   |   |   |   |   |   |   |   |   |   |
| 19|   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |
| 20|   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |

**Chessboard Pattern:**

- Row 1: Top border with K72, K52, K22 pattern
- Rows 2, 3, 5, 7, 9, 11, 13, 15, 17: Chessboard squares with K62 in alternating columns, labeled A-H in column 17
- Rows 4, 6, 8, 10, 12, 14, 16: Chessboard squares with K42, K52, K02 pattern
- Row 18: Bottom border with L12, K52, K12 pattern
- Right section (columns 18-27, rows 1-3): "KNIGHT" title with J codes as borders

**Data Entry:**

Enter the character codes in BG GRAPHIC mode to create the background screen for the KNIGHT game. The grid shows an 8×8 chessboard pattern with row labels A-H and the "KNIGHT" title in the top-right corner.

---

*Page 94*

