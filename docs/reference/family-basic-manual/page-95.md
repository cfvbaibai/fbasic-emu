# BASIC

## Sample program 2

### ** EXERCISE 2 ** - SUPER MEMORY

**Program Listing:**

```basic
10 REM * SUPER MEMORY *
20 VIEW:CGEN 2
30 MAX=5
40 I=Z-Y:C=0
50 PP$="CFGE"
60 Z=CHR$(254):Z$=Z$+Z$+Z$+Z$+Z$
70 N$=""
80 DIM PL(MAX), PX(3), PY(3), C(3)
90 PX(0)=16:PY(0)=8:C(0)=2
100 PX(1)=16:PY(1)=12:C(1)=1
110 PX(2)=12:PY(2)=10:C(2)=3
120 PX(3)=20:PY(3)=10:C(3)=0
130 PL(Z)=RND(4)
140 FOR I=0 TO Z
150 X=PX(PL(I)):Y=PY(PL(I))
160 C=C(PL(I))
170 PALETB 8, 13, 13, 13, 13
180 GOSUB 440
190 PLAY "T2O4"+MID$(PP$, PL(I)+1, 1)+"3"
200 GOSUB 500
210 PALETB 8, 13, &H16, &H27, 2
220 PAUSE 10
230 NEXT
240 LOCATE 9, 10:PRINT "YOU"
250 A$=INKEY$:IF A$="" THEN 250
260 IF A$=CHR$(PL(I)+65) THEN 280
270 PLAY "T1O1CICIC1":GOTO 240
280 PLAY "T2O5C2R2F2R2E2"
290 PALETB 8, 13, &H16, &H27, 2
300 X=PX(PL(I)):Y=PY(PL(I))
310 C=C(PL(I))
320 GOSUB 440
330 PAUSE 10
340 PALETB 8, 13, 13, 13, 13
350 GOSUB 500
360 I=I+1:IF I<=Z THEN 250
370 Z=Z+1:IF Z>MAX THEN 410
380 LOCATE 9, 10:PRINT ""
390 PAUSE 50
400 GOTO 140
410 END
420 CLS:CGSET 1, 1:PRINT "GOOD!!"
430 REM * SUBROUTINES *
440 FOR J=0 TO 5
450 LOCATE X, Y+J
460 PRINT Z$
470 NEXT
480 RETURN
500 FOR J=0 TO 5
510 LOCATE X, Y+J
520 PRINT N$
530 NEXT
540 RETURN
550 END
```

**Note:** Line 20 allows setting the maximum amount of blinking. Increasing this number increases the amount of blinking.

### SUPER MEMORY

**Description:**

The computer tests memorization skills by having the player remember sequences of up, down, left, right, and color panel blinking.

**How to play:**

- It's a 1-player game.
- Players must remember four-directional color panel sequences that blink randomly.
- When "YOU" appears in the center, the player presses the cursor key in the same order as the blinking sequence.
- The up, down, left, right of the screen matches the controller directions:
  - ↑ Up
  - ↓ Down
  - ← Left
  - → Right
- If a mistake is made, the computer will "boo" and blink the same sequence again.
- The game progressively increases the sequence length up to the maximum set in line 20.

**Game Interface:**

The game features:
- Four L-shaped white outlines, one in each corner, pointing towards the center
- A rectangular box in the center with the word "YOU" inside
- A solid white square to the right of the "YOU" box
- "SUPER MEMORY" text displayed in the top right corner

### Warning: When changing or modifying the program

- **When creating, changing or modifying a BASIC program, always erase the BG GRAPHIC (background) screen beforehand. Not doing this might result in an error.**

- **Press the CLR HOME key while holding down the SHIFT key to erase the BG GRAPHIC screen. The cursor will return to its home position.**

- **Call the program with LIST and execute the changes and modifications.**

## Background Screen Data

**Grid Structure:**

The background screen data grid represents 28 horizontal cells (columns 0-27) and 21 vertical cells (rows 0-20).

**Character Codes:**

The grid contains various alphanumeric codes:
- **K codes:** K62, K52, K72, L22, L12, L02 (forming decorative patterns)
- **J codes:** J30, J20, J50, J00, J70 (forming borders and text backgrounds)
- **I codes:** I60, I70 (corner elements)
- **Text:** "SUPER MEMORY" appears in rows 1-3, columns 21-27

**Background Screen Data Grid:**

|   | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10| 11| 12| 13| 14| 15| 16| 17| 18| 19| 20| 21| 22| 23| 24| 25| 26| 27|
|---|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|--:|
| 0 |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |
| 1 |   |   |   |   |K62|K62|K62|   |   |   |   |   |   |   |K62|K62|K62|   |   |   |   |I60|J30|J30|J30|J30|J30|I70|
| 2 |   |   |   |   |K62|K62|K62|   |   |   |   |   |   |   |K62|K62|K62|   |   |   |   |J20| S | U | P | E | R |J50|
| 3 |   |   |   |   |K62|K62|K62|   |   |   |   |   |   |   |K62|K62|K62|   |   |   |   |J20| M | E | M | O | R | Y |
| 4 |   |K52|K52|K52|L22|K62|K62|   |   |   |   |   |   |   |K62|K62|L12|K52|K52|K52|   |J00|J30|J30|J30|J30|J30|J70|
| 5 |   |K52|K52|K52|K52|L22|K62|   |   |   |   |   |   |   |K62|L12|K52|K52|K52|K52|   |   |   |   |   |   |   |   |
| 6 |   |K52|K52|K52|K52|K52|L22|   |   |   |   |   |   |   |L12|K52|K52|K52|K52|K52|   |   |   |   |   |   |   |   |
| 7 |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |
| 8 |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |
| 9 |   |   |   |   |   |   |   |   |K72|K52|K52|K52|L02|   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |
| 10|   |   |   |   |   |   |   |   |K62|   |   |   |K62|   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |
| 11|   |   |   |   |   |   |   |   |L12|K52|K52|K52|L22|   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |
| 12|   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |
| 13|   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |
| 14|   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |   |
| 15|   |K52|K52|K52|K52|K52|L02|   |   |   |   |   |   |   |K72|K52|K52|K52|K52|K52|   |   |   |   |   |   |   |   |
| 16|   |K52|K52|K52|K52|L02|K62|   |   |   |   |   |   |   |K62|K72|K52|K52|K52|K52|   |   |   |   |   |   |   |   |
| 17|   |K52|K52|K52|L02|K62|K62|   |   |   |   |   |   |   |K62|K62|K72|K52|K52|K52|   |   |   |   |   |   |   |   |
| 18|   |   |   |   |K62|K62|K62|   |   |   |   |   |   |   |K62|K62|K62|   |   |   |   |   |   |   |   |   |   |   |
| 19|   |   |   |   |K62|K62|K62|   |   |   |   |   |   |   |K62|K62|K62|   |   |   |   |   |   |   |   |   |   |   |
| 20|   |   |   |   |K62|K62|K62|   |   |   |   |   |   |   |K62|K62|K62|   |   |   |   |   |   |   |   |   |   |   |

**Data Entry:**

Enter the character codes in BG GRAPHIC mode to create the background screen for the SUPER MEMORY game. The grid shows decorative patterns using K and L codes, with the "SUPER MEMORY" title in the top-right corner.

---

*Page 95*

### Manual Errata

The original F-BASIC manual contains several bugs in this sample program:

1. **PLAY Tempo/Octave Typos (Lines 190, 270, 280):**
   - `T204` should be `T2O4` (tempo 2, octave 4)
   - `T101` should be `T1O1` (tempo 1, octave 1)
   - `T205` should be `T2O5` (tempo 2, octave 5)

2. **Variable Initialization Bug (Line 13):**
   - Original: `I=Z-Y:C=0` - Uses undefined Y variable and wrong initialization
   - Correct: `Z=0:I=0:C=0` - Properly initialize Z, I, C to 0

3. **Variable Type Conflict (Line 16):**
   - Original: `Z=CHR$(254):Z$=Z$+Z$+Z$+Z$+Z$` - Z used as both numeric and string
   - Correct: `ZC$=CHR$(254):Z$=ZC$+ZC$+ZC$+ZC$+ZC$` - Use separate string variable

4. **Invalid PALETB Palette Number (Lines 170, 210, 290, 340):**
   - Original: `PALETB 8, ...` - Palette number 8 is out of range (valid: 0-3)
   - Correct: `PALETB 3, ...` - Use valid palette number 3

