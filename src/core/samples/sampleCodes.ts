/**
 * Sample codes for F-Basic IDE - organized by category for testing
 */

/* eslint-disable max-lines -- This is a data file containing sample code snippets */

export interface SampleCode {
  name: string
  description: string
  code: string
  category: 'basics' | 'control' | 'data' | 'screen' | 'sprites' | 'interactive' | 'comprehensive' | 'debug' | 'music'
  /** Optional BG data key for samples that use VIEW command */
  bgKey?: string
}

export const SAMPLE_CODES: Record<string, SampleCode> = {
  basic: {
    name: 'Basic F-Basic Program',
    description: 'Simple arithmetic with LET and PRINT',
    category: 'basics',
    code: `10 PRINT "Basic F-Basic Program"
20 LET A = 10
30 LET B = 20
40 LET C = A + B
50 PRINT "A + B = "; C
60 END`,
  },

  pause: {
    name: 'PAUSE Command Demo',
    description: 'Demonstrates PAUSE with countdown and timing delays',
    category: 'control',
    code: `10 PRINT "PAUSE Command Demo"
20 PRINT "Starting countdown..."
30 FOR I = 5 TO 1 STEP -1
40   PRINT "Countdown: "; I
50   PAUSE 3
60 NEXT
70 PRINT "Blast off!"
80 PAUSE 10
90 PRINT "Mission complete!"
100 END`,
  },

  hello: {
    name: 'Hello World',
    description: 'Simple PRINT demonstration',
    category: 'basics',
    code: `10 PRINT "Family BASIC v3"
20 PRINT "=============="
30 PRINT "Hello, World"
40 END`,
  },

  variables: {
    name: 'Variables & Math',
    description: 'LET, arithmetic, functions',
    category: 'basics',
    code: `10 LET A = 10
20 LET B = 25
30 PRINT "A="; A; " B="; B
40 PRINT "A+B="; A+B
50 PRINT "ABS(-5)="; ABS(-5)
60 PRINT "SGN(3)="; SGN(3)
70 LET S$ = "Hello"
80 PRINT "LEN="; LEN(S$)
90 END`,
  },

  input: {
    name: 'INPUT / LINPUT',
    description: 'User input commands',
    category: 'basics',
    code: `10 INPUT "Name"; N$
20 PRINT "Hello "; N$
30 INPUT "Num"; X
40 PRINT "Square="; X*X
50 END`,
  },

  loops: {
    name: 'FOR-NEXT',
    description: 'Looping statements',
    category: 'control',
    code: `10 FOR I = 1 TO 5
20 PRINT I
30 NEXT
40 PRINT "Done"
50 END`,
  },

  conditionals: {
    name: 'IF-THEN',
    description: 'Conditional logic',
    category: 'control',
    code: `10 FOR I = 1 TO 5
20 IF I=3 THEN PRINT "Three"
30 NEXT
40 END`,
  },

  subroutines: {
    name: 'GOSUB-RETURN',
    description: 'Subroutines',
    category: 'control',
    code: `10 GOSUB 100
20 GOSUB 200
30 END
100 PRINT "Sub 1"
110 RETURN
200 PRINT "Sub 2"
210 RETURN`,
  },

  dataRead: {
    name: 'DATA & READ',
    description: 'Data storage',
    category: 'data',
    code: `10 FOR I = 1 TO 3
20 READ N
30 PRINT N
40 NEXT
50 DATA 10, 20, 30
60 END`,
  },

  arrays: {
    name: 'DIM Arrays',
    description: 'Array usage',
    category: 'data',
    code: `10 DIM A(3)
20 FOR I = 1 TO 3
30 A(I) = I*10
40 NEXT
50 PRINT A(1); A(2); A(3)
60 END`,
  },

  screen: {
    name: 'Screen & Colors',
    description: 'LOCATE, CGSET, PALETB',
    category: 'screen',
    code: `10 CLS
20 PRINT "Screen Demo"
30 LOCATE 10, 5
40 PRINT "Hi"
50 CGSET 0
60 PALETB 0, 1, 0, 0, 0
70 END`,
  },

  spriteBasic: {
    name: 'Sprite Basics',
    description: 'DEF SPRITE, SPRITE commands (8x8 sprite)',
    category: 'sprites',
    code: `10 CLS
20 SPRITE ON
30 DEF SPRITE 0, (0,0,0,0,0)=CHR$(208)
40 SPRITE 0, 100, 100
50 END`,
  },

  spriteAnimation: {
    name: 'Sprite Animation',
    description: 'Multiple sprites with DEF MOVE - animation demo',
    category: 'sprites',
    code: `10 CLS
20 SPRITE ON
30 DEF MOVE(0)=SPRITE(0,2,15,60,0,0)
40 DEF MOVE(1)=SPRITE(1,4,15,60,0,0)
50 DEF MOVE(2)=SPRITE(2,6,15,60,0,0)
60 MOVE 0: MOVE 1: MOVE 2
70 PRINT "Three sprites moving..."
80 PAUSE 200
90 CUT 0: CUT 1: CUT 2
100 PRINT "Movement stopped!"
110 PAUSE 60
120 ERA 0: ERA 1: ERA 2
130 END`,
  },

  spriteControl: {
    name: 'Sprite Control',
    description: 'POSITION, XPOS, YPOS, CUT, ERA - single sprite control',
    category: 'sprites',
    code: `10 CLS
20 SPRITE ON
30 POSITION 0, 50, 100
40 DEF MOVE(0)=SPRITE(0,3,15,60,0,0)
50 MOVE 0
60 PRINT "Moving..."
70 PAUSE 100
80 CUT 0
90 PRINT "XPOS="; XPOS(0)
100 PRINT "YPOS="; YPOS(0)
110 PAUSE 100
120 ERA 0
130 END`,
  },

  spriteSimpleMove: {
    name: 'Simple MOVE Test (DEBUG)',
    description: 'Minimal DEF MOVE + POSITION + MOVE test - loop keeps program alive for animation',
    category: 'debug',
    code: `10 CLS
20 SPRITE ON
30 PRINT "Simple MOVE Test"
40 DEF MOVE(0)=SPRITE(0,3,15,60,0,0)
50 POSITION 0,128,120
60 MOVE 0
70 PRINT "Movement started"
80 PRINT "Watch sprite animate..."
90 ' Wait for movement to complete (MOVE(0) returns 0 when done)
100 FOR I = 1 TO 200
110 IF MOVE(0)=0 THEN PRINT "Done!": GOTO 140
120 PAUSE 1
130 NEXT
140 PRINT "Movement complete"
150 END`,
  },

  spriteInteractive: {
    name: 'Interactive Sprites (Adaptive Timing)',
    description: 'Control sprites with joystick - adaptive PAUSE for responsive input + controlled speed',
    category: 'interactive',
    code: `10 CLS
20 SPRITE ON
30 DEF SPRITE 0, (0,0,0,0,0)=CHR$(208)
40 SPRITE 0, 150, 100
50 PX = 150
60 PY = 100
70 L1 = 0
80 S = STICK(0)
90 T = STRIG(0)
100 IF T=1 THEN 190
110 REM === Adaptive PAUSE: responsive input when idle, controlled speed when moving ===
120 IF S <> L1 THEN L1 = S: GOTO 160
130 REM No input change - short pause for quick response to new button presses
140 PAUSE 1
145 GOTO 80
150 REM Input changed - process movement with longer pause to control speed
160 IF S=1 THEN PX = PX + 2
165 IF S=2 THEN PX = PX - 2
170 IF S=4 THEN PY = PY + 2
175 IF S=8 THEN PY = PY - 2
180 SPRITE 0, PX, PY
185 PAUSE 5
190 GOTO 80
200 ERA 0
210 END`,
  },

  joystick: {
    name: 'Joystick Test (Adaptive Timing)',
    description: 'STICK and STRIG functions - adaptive PAUSE for responsive input',
    category: 'interactive',
    code: `10 PRINT "Joystick Test"
15 L1 = 0
20 S = STICK(0)
30 T = STRIG(0)
40 IF T=1 THEN 100
45 REM === Adaptive PAUSE: responsive when idle, controlled when active ===
50 IF S <> L1 THEN L1 = S: GOTO 80
55 REM No input change - short pause for quick response
60 PAUSE 1
65 GOTO 20
70 REM Input changed - longer pause when processing
80 IF S>0 THEN PRINT S
90 PAUSE 5
95 GOTO 20
100 END`,
  },

  strigTest: {
    name: 'STRIG Button Test (DEBUG)',
    description: 'Dedicated STRIG button test - shows button presses with values',
    category: 'debug',
    code: `10 CLS
20 PRINT "=== STRIG BUTTON TEST ==="
30 PRINT "Press buttons: START(1) SELECT(2) B(4) A(8)"
40 PRINT "Watch value below change"
50 PRINT ""
60 PRINT "Last button: "
70 LOCATE 0,6
80 T = STRIG(0)
90 IF T = 0 THEN 110
100 PRINT "Button pressed: ";T
110 IF T = 1 THEN CLS:PRINT "START pressed!":PAUSE 60:GOTO 10
120 IF T = 2 THEN CLS:PRINT "SELECT pressed!":PAUSE 60:GOTO 10
130 IF T = 4 THEN CLS:PRINT "B button pressed!":PAUSE 60:GOTO 10
140 IF T = 8 THEN CLS:PRINT "A button pressed!":PAUSE 60:GOTO 10
150 PAUSE 2
160 GOTO 70
170 END`,
  },

  inkeyTest: {
    name: 'INKEY$ Test',
    description: 'Test keyboard input with INKEY$ - press keys to see characters (GitHub Issue #4)',
    category: 'interactive',
    code: `10 CLS
20 PRINT "=== INKEY$ TEST ==="
30 PRINT "Press any key to see it"
40 PRINT "Press Q to quit"
50 PRINT ""
60 K$ = INKEY$
70 IF K$ = "" THEN 60
80 IF K$ = "Q" THEN 120
90 PRINT "You pressed: "; K$; " (code "; ASC(K$); ")"
100 PAUSE 10
110 GOTO 60
120 PRINT "Goodbye!"
130 END`,
  },

  inkeyBlockingTest: {
    name: 'INKEY$(0) Blocking Test',
    description: 'Test INKEY$ with blocking mode - waits for key press (GitHub Issue #4)',
    category: 'interactive',
    code: `10 CLS
20 PRINT "=== INKEY$(0) BLOCKING TEST ==="
30 PRINT "This mode waits for input"
40 PRINT ""
50 PRINT "Enter character: ";
60 K$ = INKEY$(0)
70 PRINT K$; " (code "; ASC(K$); ")"
80 PRINT "Press Q to quit, any other to continue"
90 IF K$ = "Q" THEN 110
100 GOTO 50
110 PRINT "Done!"
120 END`,
  },

  spriteTableB: {
    name: 'Sprite Table B Test',
    description: 'Test sprites using Table B (BG characters) with CGEN 3 - demonstrates flag (&HC7) and apple (&HD7)',
    category: 'sprites',
    code: `10 CLS
20 PRINT "=== SPRITE TABLE B TEST ==="
30 PRINT "CGEN 3: B on BG, B on sprite"
40 PRINT "Using BG characters for sprites"
50 PRINT ""
60 ' Set CGEN mode 3: Table B for both BG and sprites
70 CGEN 3
80 ' Define sprites using Table B character codes
90 ' &HC7 (199) = flag, &HD7 (215) = apple
100 DEF SPRITE 0,(0,0,0,0,0)=CHR$(&HC7)
110 DEF SPRITE 1,(1,0,0,0,0)=CHR$(&HD7)
120 PALETS 0,13,&H16,&H27,2
130 PALETS 1,13,&H16,&H17,4
140 SPRITE ON
150 ' Display sprites at different positions
160 SPRITE 0,50,100
170 SPRITE 1,150,100
180 PRINT "Sprite 0: Flag at (50,100)"
190 PRINT "Sprite 1: Apple at (150,100)"
200 PRINT ""
210 PRINT "Use D-pad to move sprite 0"
220 PRINT "Press A to hide sprite 1"
230 PRINT "Press B to show sprite 1"
240 PRINT "Press START to end"
250 ' Main loop
260 X=50:Y=100
270 S=STICK(0):T=STRIG(0)
280 IF S=1 THEN X=X+4
290 IF S=2 THEN X=X-4
300 IF S=4 THEN Y=Y+4
310 IF S=8 THEN Y=Y-4
320 IF X<0 THEN X=0
330 IF X>240 THEN X=240
340 IF Y<0 THEN Y=0
350 IF Y>220 THEN Y=220
360 SPRITE 0,X,Y
370 IF T=8 THEN SPRITE 1
380 IF T=4 THEN SPRITE 1,150,100
390 IF T=1 THEN 450
400 PAUSE 2
410 GOTO 270
450 SPRITE OFF
460 PRINT "Goodbye!"
470 END`,
  },

  shooting: {
    name: 'Shooting Game',
    description: 'Full shooting game with levels, sprites, and scoring',
    category: 'comprehensive',
    code: `5 S=4:Z=0:CLS
7 LOCATE 10,12:IF S=0 THEN 1990
8 PRINT "LEVEL:";5-S: PAUSE 53:CLS
9 DIM P(7)
10 SPRITE ON:FOR X=0 TO 7:GOSUB 1000:NEXT
20 PLAY "T1CDEFAB1O5"
30 PRINT "SCORE:";K;"/";(5-S)*1000
100 E=14:F=12:C=14:D=12:LOCATE E,F:PRINT CHR$(&HDD);
110 A=STICK(0)
111 IF E<>C OR F<>D THEN LOCATE C,D:PRINT " ";:LOCATE E,F:PRINT CHR$(&HDD);:C=E:D=F
115 IF STRIG(0)=8 THEN 130
116 T=STRIG(0):IF T=15 THEN Z=1:LOCATE 20,0:PRINT "DEBUG"
117 IF A=8 AND T=9 THEN 1990
118 'MOVE AIM CONTINUOUSLY WHILE HOLDING BUTTONS
120 E=E+((A AND 1)=1)*(E<27)-((A AND 2)=2)*(E>0):F=F+((A AND 4)=4)*(F<23)-((A AND 8)=8)*(F>1):GOTO 180
125 'IF NOT SHOT, GOTO 200 FOR REST OF LOGIC
130 PLAY "B":LOCATE E,F:PRINT "*";:PAUSE 1:LOCATE E,F:PRINT " ";:LOCATE E,F:PRINT CHR$(&HDD);
135 'MOVE SPRITES AND CHECK HIT ONE BY ONE
140 FOR X=0 TO 7
150 IF C=(XPOS(X)+7)/8-2 AND D=(YPOS(X)+7)/8-3 THEN ERA X:GOSUB 1000:PLAY "ABFEAFEFCDGF":K=K+100+Z*400:LOCATE 7,0:PRINT K;"/";(5-S)*1000;
155 'IF SPRITE'S LAST MOVE IS DONE, GIVE ANOTHER MOVE
160 NEXT
180 FOR Y=0 TO 7
181 IF MOVE(Y)=0 THEN X=Y:GOSUB 1010
182 NEXT
190 IF K<(5-S)*1000 THEN PAUSE 3:GOTO 110
200 SPRITE OFF:CLS:LOCATE 10,12:PRINT "ALL RIGHT":PAUSE 54:S=S-1:CLS:GOTO 7
1000 SP=RND(10):P(X)=SP:DEF MOVE(X)=SPRITE(SP,RND(9),3*(S+1),255,0,0):POSITION X,RND(255),RND(255):MOVE X:RETURN
1010 SP=P(X):DEF MOVE(X)=SPRITE(SP,RND(9),3*(S+1),255,0,0):MOVE X:RETURN
1990 FOR X=0 TO 7:ERA X:NEXT:SPRITE OFF
2000 CLS:FOR X=2 TO 25:LOCATE X,2:PRINT CHR$(176);:LOCATE X,21:PRINT CHR$(176);:NEXT
2001 FOR Y=2 TO 21:LOCATE 2,Y:PRINT CHR$(177);:LOCATE 25,Y:PRINT CHR$(177);:NEXT
2002 LOCATE 4,4:PRINT CHR$(184);CHR$(185);CHR$(186);CHR$(187)
2003 LOCATE 20,4:PRINT CHR$(188);CHR$(189);CHR$(190);CHR$(191)
2010 LOCATE 7,7:PRINT "CONGRATULATIONS!"
2020 LOCATE 10,10:PRINT "CREATED BY"
2030 LOCATE 10,12:PRINT "TONY NIE"
2040 LOCATE 4,16:PRINT "GITHUB.COM/CFVBAIBAI"
2050 LOCATE 6,18:PRINT "/FBASIC-IDE"
2060 PLAY "O4C5E5G5O5C9"
2070 LOCATE 5,23:PRINT "THANKS FOR PLAYING"`,
  },

  eraMoveTest: {
    name: 'ERA → MOVE Test (DEBUG)',
    description: 'Minimal test for ERA followed immediately by MOVE - reproduces teleportation bug',
    category: 'debug',
    code: `10 CLS
20 SPRITE ON
30 PRINT "ERA/MOVE Test"
40 PRINT "Watch sprite 0"
50 PRINT "Press A button to ERA+MOVE"
60 '
100 ' Initialize sprite
110 DEF MOVE(0)=SPRITE(0,3,15,60,0,0)
120 POSITION 0,128,120
130 MOVE 0
140 '
150 ' Main loop
160 T=STRIG(0)
170 IF (T AND 8)=8 THEN 210
180 GOTO 160
190 '
200 ' ERA followed immediately by MOVE
210 ERA 0
220 DEF MOVE(0)=SPRITE(1,3,15,60,0,0)
230 POSITION 0,RND(256),RND(256)
240 MOVE 0
250 PRINT "Restarted!"
260 GOTO 160`,
  },

  eraMoveLoopTest: {
    name: 'ERA → MOVE Loop Test (DEBUG)',
    description: 'Auto-repeating ERA+MOVE loop - teleports should happen rapidly',
    category: 'debug',
    code: `10 CLS
20 SPRITE ON
30 PRINT "Auto ERA/MOVE Test"
40 PRINT "Sprite should keep moving"
50 PRINT "Press SELECT to stop"
60 '
100 ' Initialize sprite
110 DEF MOVE(0)=SPRITE(0,3,15,60,0,0)
120 POSITION 0,128,120
130 MOVE 0
140 '
150 ' Auto ERA+MOVE loop
160 IF MOVE(0)=0 THEN 210
170 T=STRIG(0)
180 IF (T AND 2)=2 THEN 260
190 GOTO 160
200 ' ERA followed immediately by MOVE (when movement completes)
210 ERA 0
220 DEF MOVE(0)=SPRITE(RND(8),3,15,60,0,0)
230 POSITION 0,RND(256),RND(256)
240 MOVE 0
245 GOTO 160
250 ' Stop
260 CUT 0
270 PRINT "Stopped. Press A to restart"
280 T=STRIG(0)
285 IF (T AND 8)=8 THEN 110
290 GOTO 280`,
  },

  multiSpriteEraMoveTest: {
    name: 'Multi-Sprite ERA → MOVE Test (DEBUG)',
    description: 'Multiple sprites with simultaneous ERA+MOVE - like shooting game hit scenario',
    category: 'debug',
    code: `10 CLS
20 SPRITE ON
30 PRINT "Multi-Sprite ERA/MOVE"
40 PRINT "Watch all 4 sprites"
50 PRINT "Press A to ERA+MOVE sprite 0"
60 '
100 ' Initialize 4 sprites
110 FOR I=0 TO 3
120 DEF MOVE(I)=SPRITE(I*2,3,15,60,0,0)
130 POSITION I,50+I*40,50+(I AND 1)*80
140 MOVE I
150 NEXT
160 '
170 ' Main loop
180 S=STRIG(0)
190 IF (S AND 8)=8 THEN 270
200 GOTO 180
210 '
250 ' ERA sprite 0 and immediately MOVE it
260 ' (simulates hitting enemy in shooting game)
270 ERA 0
280 DEF MOVE(0)=SPRITE(RND(8),3,15,60,0,0)
290 POSITION 0,RND(256),RND(256)
300 MOVE 0
310 '
320 ' Check other sprites for completion and restart
330 FOR I=1 TO 3
340 IF MOVE(I)=0 THEN 410
350 NEXT
360 GOTO 180
370 '
400 ' Sprite I completed - restart it
410 ERA I
420 DEF MOVE(I)=SPRITE(I*2,3,15,60,0,0)
430 POSITION I,RND(256),RND(256)
440 MOVE I
450 GOTO 360`,
  },

  screenCoalesce: {
    name: 'Performance Test',
    description: 'Screen update test',
    category: 'screen',
    code: `10 CLS
20 FOR I = 1 TO 50
30 PRINT "Line "; I
40 NEXT
50 PRINT "Done"
60 END`,
  },

  allChars: {
    name: 'All Characters',
    description: 'Print all CHR$(0) to CHR$(255)',
    category: 'screen',
    code: `10 FOR I = 0 TO 31
20 PRINT CHR$(I);
30 NEXT
40 PRINT ""
50 PRINT "Done"
60 END`,
  },

  bgItems: {
    name: 'BG Items Display',
    description: 'Display all BG character items - numbers, letters, symbols, kana, and picture tiles',
    category: 'screen',
    code: `10 CLS
20 FOR I=0 TO 31:PRINT CHR$(I);:NEXT:PRINT "":PRINT ""
30 FOR I=33 TO 47:PRINT CHR$(I);:NEXT:PRINT "":PRINT ""
40 FOR I=48 TO 57:PRINT CHR$(I);:NEXT:PRINT "":PRINT ""
50 FOR I=65 TO 90:PRINT CHR$(I);:NEXT:PRINT "":PRINT ""
60 FOR I=91 TO 95:PRINT CHR$(I);:NEXT:PRINT "":PRINT ""
70 FOR I=96 TO 175:PRINT CHR$(I);:NEXT:PRINT "":PRINT ""
80 FOR I=176 TO 183:PRINT CHR$(I);:NEXT:PRINT "":PRINT ""
90 FOR I=184 TO 255:PRINT CHR$(I);:NEXT:PRINT "":PRINT ""
100 END`,
  },

  bgView: {
    name: 'BG VIEW Test',
    description: 'Copy BG GRAPHIC to background screen - includes demo BG pattern',
    category: 'screen',
    bgKey: 'bgView',
    code: `10 CLS
20 VIEW
30 LOCATE 12,11:PRINT "BG content displayed"
40 END`,
  },

  bgViewTitle: {
    name: 'BG Title Screen',
    description: 'Display a decorative title screen using BG GRAPHIC',
    category: 'screen',
    bgKey: 'titleScreen',
    code: `10 CLS
20 VIEW
30 REM Add your title text here
40 LOCATE 10,8:PRINT "MY GAME"
50 LOCATE 8,12:PRINT "Press START"
60 END`,
  },

  bgViewPlatform: {
    name: 'BG Platform Level',
    description: 'Platform game level background with ground and platforms',
    category: 'screen',
    bgKey: 'platformGame',
    code: `10 CLS
20 VIEW
30 REM Player would move on this level
40 LOCATE 3,4:PRINT "LEVEL 1"
50 LOCATE 20,4:PRINT "x3"
60 END`,
  },

  cursorPosition: {
    name: 'Cursor Position (CSRLIN/POS)',
    description: 'CSRLIN and POS functions - get current cursor position',
    category: 'screen',
    code: `10 REM * CSRLIN and POS Demo *
20 CLS
30 FOR I=0 TO 15
40 LOCATE I, I
50 PRINT "POS=";POS(0);" LINE=";CSRLIN
60 PAUSE 20
70 NEXT
80 PRINT "Done!"
90 END`,
  },

  screenRead: {
    name: 'Screen Read (SCR$)',
    description: 'SCR$ function - read characters from screen',
    category: 'screen',
    code: `10 CLS
20 LOCATE 0,5
30 PRINT "FAMILY BASIC"
40 PRINT "============"
50 LOCATE 0,10
60 PRINT "Reading chars..."
70 FOR X=0 TO 11
80 A$=SCR$(X,5)
90 PRINT A$;
100 NEXT
110 PRINT ""
120 PRINT "Done!"
130 END`,
  },

  screenReadColor: {
    name: 'Screen Read with Color (SCR$)',
    description: 'SCR$ with color switch - read character and color from screen',
    category: 'screen',
    code: `10 CLS
20 LOCATE 0,5
30 PRINT "HELLO"
40 LOCATE 0,10
50 A$=SCR$(0,5)
60 C$=SCR$(0,5,1)
70 PRINT "CHAR: ";A$
80 PRINT "COLOR: ";ASC(C$)
90 END`,
  },

  beep: {
    name: 'BEEP Sound',
    description: 'BEEP statement - produce a beep sound',
    category: 'basics',
    code: `10 PRINT "BEEP Demo"
20 PRINT "Beeping..."
30 BEEP
40 PRINT "Done!"
50 END`,
  },

  beepInteractive: {
    name: 'BEEP Interactive',
    description: 'BEEP on button press - interactive sound demo',
    category: 'interactive',
    code: `10 CLS
20 PRINT "Press A to BEEP"
30 PRINT "Press START to exit"
40 T=STRIG(0)
50 IF (T AND 8)=8 THEN BEEP:PAUSE 10
60 IF (T AND 1)=1 THEN 100
70 GOTO 40
100 PRINT "Goodbye!"
110 END`,
  },

  // ============================================================================
  // Music Samples
  // ============================================================================

  musicBasic: {
    name: 'Basic Music Demo',
    description: 'Simple PLAY demonstration with single notes',
    category: 'music',
    code: `10 PRINT "Basic Music Demo"
20 PLAY "CDEFGAB"
30 PRINT "Done!"
40 END`,
  },

  musicTwinkle: {
    name: 'Twinkle Twinkle Little Star (Full)',
    description: 'Complete classic nursery rhyme with GOTO loop - demonstrates BASIC repetition',
    category: 'music',
    code: `10 CLS
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
230 END`,
  },

  musicOdeToJoy: {
    name: 'Ode to Joy (Full - Beethoven)',
    description: 'Complete melody with GOSUB for repeated phrases - demonstrates BASIC subroutines',
    category: 'music',
    code: `10 CLS
20 PRINT "Ode to Joy - Beethoven"
30 PRINT "Symphony No.9 - Full Theme"
40 PRINT "=========================="
50 PLAY "T1"
60 REM === MAIN THEME START ===
70 REM Phrase 1: Joyful, joyful...
80 PLAY "E5E5F5G5G5F5E5D5C5C5D5E5E6D3D7"
90 REM Phrase 2: We sing thy song...
100 PLAY "E5E5F5G5G5F5E5D5C5C5D5E5D6C3C7"
110 REM Phrase 3 - Bridge
120 PLAY "D5D5E5C5D5E3F3E5C5D5E3F3E5D5C5D5O2G5O3E5"
130 REM Phrase 4
140 PLAY "E5E5F5G5G5F5E5D5C5C5D5E5D6C3C7"
150 PRINT ""
160 PRINT "Fin!"
170 END`,
  },

  musicMaryHadALittleLamb: {
    name: 'Mary Had a Little Lamb',
    description: 'Traditional children\'s song from F-BASIC Manual (page 34) - 3-channel harmony',
    category: 'music',
    code: `10 CLS
20 LOCATE 6,12:PRINT "Mary Had a Little Lamb"
30 PLAY "M1Y2V7T3:M1Y1V5T3:M1T3"
40 PLAY "O2A6G3F5G:O2R3FCEDCEC:O1F7C"
50 PLAY "A5AA7:RFCFRCO1AO2C:FC"
60 PLAY "G5GG7:RECERCO1GO2C:O2CO1G"
70 PLAY "A5O3CC7:RF5AO3C3AG:FC"
80 PLAY "O2A6G3F5G:O2RFRERDRC:FC"
90 PLAY "AAA7:RFFFRCCC:FC"
100 PLAY "G5#AA6G3:RERGRERC:O2CO1G"
110 PLAY "F9:FCFAO3F7:F5CF7"
120 PRINT ""
130 PRINT "Song complete!"
140 END`,
  },

  musicHappyBirthday: {
    name: 'Happy Birthday (Full)',
    description: 'Complete traditional birthday song with all phrases - demonstrates dotted rhythms',
    category: 'music',
    code: `10 CLS
20 PRINT "Happy Birthday to You!"
30 PRINT "======================="
40 PLAY "T3"
50 REM Happy birthday to you
60 PLAY "O2G3GA5GO3CO2BR5"
70 REM Happy birthday to you
80 PLAY "O2G3GA5GO3DCR5"
90 REM Happy birthday dear [name]
100 PLAY "O2G3GO3G5ECO2BAR5"
110 REM Happy birthday to you
120 PLAY "O3F3FE5CDC1"
130 PRINT ""
140 PRINT "Make a wish!"
150 END`,
  },

  musicJingleBells: {
    name: 'Jingle Bells (Full)',
    description: 'Complete Christmas carol with GOSUB for chorus - demonstrates BASIC subroutines',
    category: 'music',
    code: `10 CLS
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
480 RETURN`,
  },

  musicScale: {
    name: 'C Major Scale',
    description: 'Ascending and descending C major scale - demonstrates octaves',
    category: 'music',
    code: `10 CLS
20 PRINT "C Major Scale"
30 PRINT "============="
40 PRINT "Ascending..."
50 PLAY "O2C5D5E5F5G5A5B5"
60 PLAY "O3C5"
70 PRINT "Descending..."
80 PLAY "O3C5"
90 PLAY "O2B5A5G5F5E5D5C5"
100 PRINT ""
110 PRINT "Complete!"
120 END`,
  },

  musicArpeggio: {
    name: 'C Major Arpeggio',
    description: 'C major arpeggio pattern - demonstrates chord arpeggios',
    category: 'music',
    code: `10 CLS
20 PRINT "C Major Arpeggio"
30 PRINT "================"
40 PLAY "T3"
50 PRINT "Ascending..."
60 PLAY "O2C5E5G5O3C5E5G5O4C5"
70 PRINT "Descending..."
80 PLAY "O4C5G5E5O3C5G5E5O2C5"
90 PRINT ""
100 PRINT "Complete!"
110 END`,
  },

  musicThreeChannel: {
    name: 'Three-Channel Harmony Demo',
    description: 'Demonstrates 3-channel simultaneous playback with PLAY',
    category: 'music',
    code: `10 CLS
20 PRINT "Three-Channel Harmony Demo"
30 PRINT "=========================="
40 PRINT "Playing C major chord..."
50 PLAY "T4"
60 PLAY "O3C9:O3E9:O3G9"
70 PRINT "Playing F major chord..."
80 PLAY "O3F9:O3A9:O4C9"
90 PRINT "Playing G major chord..."
100 PLAY "O3G9:O3B9:O4D9"
110 PRINT "Playing C major chord..."
120 PLAY "O3C9:O3E9:O3G9"
130 PRINT ""
140 PRINT "Complete!"
150 END`,
  },

  musicPlayer: {
    name: 'Music Player with Menu',
    description: 'Interactive music player demonstrating GOTO for menu loop and song selection',
    category: 'music',
    code: `10 CLS
20 PRINT "===================="
30 PRINT "   F-BASIC JUKEBOX"
40 PRINT "===================="
50 PRINT ""
60 PRINT "1. Twinkle Twinkle"
70 PRINT "2. Scale Demo"
80 PRINT "3. Chord Demo"
90 PRINT "4. Exit"
100 PRINT ""
110 INPUT "Select song (1-4)";S
120 IF S=1 THEN GOTO 200
130 IF S=2 THEN GOTO 300
140 IF S=3 THEN GOTO 400
150 IF S=4 THEN PRINT "Goodbye!":END
160 PRINT "Invalid choice!"
170 PAUSE 30
180 GOTO 10
190 REM ===== SONG 1: TWINKLE =====
200 CLS:PRINT "Playing: Twinkle Twinkle"
210 PLAY "T3"
220 PLAY "CCGGAAG7"
230 PLAY "FFEEDDC7"
240 PLAY "GGFFEED7"
250 PLAY "GGFFEED7"
260 PLAY "CCGGAAG7"
270 PLAY "FFEEDDC9"
280 PRINT "Done!"
290 PAUSE 60:GOTO 10
300 REM ===== SONG 2: SCALE =====
310 CLS:PRINT "Playing: C Major Scale"
320 PLAY "T3"
330 PLAY "O2C5D5E5F5G5A5B5O3C5"
340 PLAY "O3C5O2B5A5G5F5E5D5C5"
350 PRINT "Done!"
360 PAUSE 60:GOTO 10
400 REM ===== SONG 3: CHORDS =====
410 CLS:PRINT "Playing: Chord Progression"
420 PLAY "T4"
430 PLAY "O3C9:O3E9:O3G9"
440 PLAY "O3F9:O3A9:O4C9"
450 PLAY "O3G9:O3B9:O4D9"
460 PLAY "O3C9:O3E9:O3G9"
470 PRINT "Done!"
480 PAUSE 60:GOTO 10`,
  },

  musicLoopDemo: {
    name: 'Music Loop Demo',
    description: 'Demonstrates FOR-NEXT and GOTO for musical repetition patterns',
    category: 'music',
    code: `10 CLS
20 PRINT "Music Loop Demo"
30 PRINT "==============="
40 PLAY "T3"
50 REM === ASCENDING SCALE WITH FOR-NEXT ===
60 PRINT "Ascending scale 3x:"
70 FOR R=1 TO 3
80 PLAY "O2C5D5E5F5G5A5B5O3C5"
90 NEXT
100 REM === DESCENDING WITH GOTO ===
110 PRINT "Descending scale 3x:"
120 C=1
130 PLAY "O3C5O2B5A5G5F5E5D5C5"
140 C=C+1
150 IF C<=3 THEN GOTO 130
160 REM === REPEATING PATTERN ===
170 PRINT "Pattern repeat 4x:"
180 P=1
190 PLAY "C5E5G5E5"
200 P=P+1
210 IF P<=4 THEN GOTO 190
220 PRINT ""
230 PRINT "Complete!"`,
  },

  musicFurElise2Ch: {
    name: 'Fur Elise 2-Channel (Beethoven)',
    description: '2-channel piano version with right hand melody and left hand bass - matches real piano sheet',
    category: 'music',
    code: `10 CLS
20 PRINT "Fur Elise - Beethoven"
30 PRINT "2-Channel Piano Version"
40 PRINT "======================="
50 REM Initialize both channels
60 PLAY "M1Y2V15T5:M0Y0V15T5"
330 PLAY "O3E1#DE#DEO2BO3DC:R3R6"
340 PLAY "O2A3R1C1EA:O0A1O1EAR1R3"
340 PLAY "B3R1E#GB:O0E1O1E#GR1R3"
350 PLAY "O3C3R1O2E1O3E1#D:O0A1O1EAR1R3"
350 PLAY "E#DEO2BO3DC:R6"
360 PLAY "O2A3R1CEA:O0A1O1EAR1R3"
365 REM ------------------ 2 -------------------
370 PLAY "B3R1E1O3CO2B:O0E1O1E#GR1R3"
380 PLAY "A5O3E1#D:O0A1O1EAR1R3"
390 PLAY "E1#DE#DEO2BO3DC:R6"
400 PLAY "O2A3R1CEA:O0A1O1EAR1R3"
410 PLAY "B3R1E1#GB:O0E1O1E#G"
420 PLAY "O3C3R1O2E1O3E#D:O0A1O1EAR1R3"
430 PLAY "E#DEO2BO3DC:R6"
440 PLAY "O2A3R1CEA:O0A1O1EAR1R3"
445 REM ------------------ 3 -------------------
450 PLAY "B3R1E1O3CO2B:O0E1O1E#GR1R3"
460 PLAY "A3R1B1O3CD:O0A1O1EAR1R3"
470 PLAY "E4O2G1O3FE:C1GO2CR1R3"
480 PLAY "D4O2F1O3ED:O0G1O1GBR1R3"
490 PLAY "C4O2E1O3DC:O0A1O1EAR1R3"
500 PLAY "O2B3R1E1O3ER1:O0E1O1EO2ER1R1E1"
510 PLAY "R1E1O4ER1R1O3#D1:O3E1R1R1#D1ER1"
520 PLAY "E3R1#D1E#D:R1#DER1R3"
525 REM ------------------ 4 --------------------
530 PLAY "E#DEO2BO3DC:R6"
540 PLAY "O2A3R1CEA:O0A1O1EAR1R3"
550 PLAY "B3R1E#GB:O0E1O1E#GR1R3"
560 PLAY "O3C3R1O2E1O3E1#D:O0A1O1EAR1R3"
570 PLAY "E#DEO2BO3DC:R6"
580 PLAY "O2A3R1CEA:O0A1O1EAR1R3"
590 PLAY "B3R1E1O3CO2B:O0E1O1E#GR1R3"
600 PLAY "A3R1B1O3CD:O0A1O1EAR1R3"
605 REM ------------------ 5 --------------------
610 PLAY "E4O2G1O3FE:C1GO2CR1R3"
620 PLAY "D4O2F1O3ED:O0G1O1GBR1R3"
630 PLAY "C4O2E1O3DC:O0A1O1EAR1R3"
640 PLAY "O2B3R1E1O3ER1:O0E1O1EO2ER1R1E1"
650 PLAY "R1E1O4ER1R1O3#D1:O3E1R1R1#D1ER1"
660 PLAY "E3R1#D1E#D:R1#DER1R3"
670 PLAY "E#DEO2BO3DC:R6"
680 PLAY "O2A3R1CEA:O0A1O1EAR1R3"
685 REM ------------------ 6 --------------------
690 PLAY "B3R1E1#GB:O0E1O1E#GR1R3"
700 PLAY "O3C3R1O2E1O3E#D:O0A1O1EAR1R3"
710 PLAY "E#DEO2BO3DC:R6"
720 PLAY "O2A3R1CEA:O0A1O1EAR1R3"
730 PLAY "B3R1E1O3CO2B:O0E1O1E#GR1R3"
740 PLAY "O2A3R1O3C1CC:O0A1O1EAO2CCC"
750 PLAY "C5F2E0:O1F1AO2CO1AO2CO1A"
755 REM ------------------ 7 --------------------
760 PLAY "E3D#A2A0:F#AO2DO1#AO2DO1#A"
770 PLAY "A1GFEDC:O1F1O2EO1FO2EO1FO2E"
780 PLAY "O2#A3AA0GAB:O1FAO2CO1AO2CO1A"
790 PLAY "O3C5D1#D:O1FAO2CO1AO2CO1A"
800 PLAY "E4E1FO2A:O1EAO2CO1AO2CO1F"
810 PLAY "O3C5D2O3B0:O1G1O2EO1GO2FO1GO2F"
820 PLAY "O3C0GO2GO3GO2AO3GO2BO3GCGDG:O2C3R1F1ED"
825 REM ------------------ 8 --------------------
830 PLAY "O3E0GO4CO3BAGFEDGFD:O2C3O1FG"
840 PLAY "O3C0GO2GO3GO2AO3GO2BO3GCGDG:O2C3R1F1ED"
850 PLAY "O3E0GO4CO3BAGFEDGFD:O2C3O1FG"
860 PLAY "O3E0FE#DEO2BO3E#DEO2BO3E#D:O1G3R3R3"
870 PLAY "O3E4O2B1O3E#D:R6"
875 REM ------------------ 9 --------------------
880 PLAY "O3E4O2B1O3E#D:R6"
890 PLAY "O3E1#DE#DE#D:R6"
900 PLAY "O3E1#DEO2BO3DC:R6"
910 PLAY "O2A3R1CEA:O0A1O1EAR1R3"
920 PLAY "O2B3R1E1#GB:O0E1O1E#G"
930 PLAY "O3C3R1O2E1O3E#D:O0A1O1EAR1R3"
940 PLAY "O3E1#DEO2BO3DC:R6"
950 PLAY "O2A3R1C1EA:O0A1O1EAR1R3"
955 REM ------------------ 10 --------------------
960 PLAY "O2B3R1E1O3CO2B:O0E1O1E#GR1R3"
970 PLAY "O2A3R1B1O3CD:O0A1O1EAR1R3"
980 PLAY "O3E4O2G1O3FE:C1GO2CR1R3"
990 PLAY "O3D4O2F1O3ED:O0G1O1GBR1R3"
1000 PLAY "O3C4O2E1O3DC:O0A1O1EAR1R3"
1010 PLAY "O2B3R1E1O3ER1:O0E1O1EO2ER1R1E1"
1020 PLAY "R1O3E1O4E1R1R1#D1:O3E1R1R1#D1ER1"
1030 PLAY "O3E3R1#D1E#D:R1O3#D1ER1R3"
1035 REM ------------------ 11 --------------------
1040 PLAY "O3E1#DEO2BO3DC:R6"
1050 PLAY "O2A3R1C1EA:O0A1O1EAR1R3"
1060 PLAY "O2B3R1E#GB:O0E1O1E#GR1R3"
1070 PLAY "O3C3R1O2E1O3E#D:O0A1O1EAR1R3"
1080 PLAY "O3E1#DEO2BO3DC:R6"
1090 PLAY "O2A3R1C1EA:O0A1O1EAR1R3"
1100 PLAY "O2B3R1E1O3CO2B:O0E1O1E#GR1R3"
1110 PLAY "O2A3R3R3:O0A1AAAAA"
1115 REM ------------------ 12 --------------------
1120 PLAY "O3#C6:O0A1AAAAA"
1130 PLAY "O3D5E1F:O0A1AAAAA"
1140 PLAY "O3F5F3:O0A1AAAAA"
1150 PLAY "O3E6:O0A1AAAAA"
1160 PLAY "O3D5C1O2B:O0D1DDDDD"
1170 PLAY "O2A5A3:O0#D1#D#D#D#D#D"
1180 PLAY "O2A3O3CO2B:O0E1EEEEE"
1190 PLAY "O2A6:O0A1AAAAA"
1195 REM ------------------ 13 --------------------
1200 PLAY "O3#C6:O0A1AAAAA"
1210 PLAY "O3D5E1F:O0A1AAAAA"
1220 PLAY "O3F5F3:O0A1AAAAA"
1230 PLAY "O3F6:O0#A1#A#A#A#A#A"
1240 PLAY "O3#D5D1C:O0#A1#A#A#A#A#A"
1250 PLAY "O2#A5A3:O0#A1#A#A#A#A#A"
1260 PLAY "O2#G5#G3:O0B1BBBBB"
1270 PLAY "O2A5R3:O1C5R3"
1275 REM ------------------ 14 --------------------
1280 PLAY "O2B3R3R3:O1#G3R3R3"
1285 PLAY "T4:T4"
1290 PLAY "O1A1O2CEAO3CEDCO2B:O1C3R3A3"
1300 PLAY "O2A1O3CEAO4CEDCO3B:O1A3R3A3"
1300 PLAY "O3A1O4CEAO5CEDCO4B:O1A3R3A3"
1310 PLAY "O4#A1A#GG#FFE#DD:O1A3R3R3"
1320 PLAY "O4#C1CO3B#AA#GG#FF:R6"
1323 PLAY "T5:T5"
1325 REM ------------------ 15 --------------------
1330 PLAY "O3E1#DEO2BO3DC:R6"
1340 PLAY "O2A3R1CEA:O0A1O1EAR1R3"
1350 PLAY "O2B3R1E1#GB:O0E1O1E#G"
1360 PLAY "O3C3R1O2E1O3E#D:O0A1O1EAR1R3"
1370 PLAY "O3E1#DEO2BO3DC:R6"
1380 PLAY "O2A3R1C1EA:O0A1O1EAR1R3"
1390 PLAY "O2B3R1E1O3CO2B:O0E1O1E#GR1R3"
1440 PLAY "O2A3R1B1O3CD:O0A1O1EAR1R3"
1445 REM ------------------ 16 --------------------
1450 PLAY "O3E4O2G1O3FE:C1GO2CR1R3"
1460 PLAY "O3D4O2F1O3ED:O0G1O1GBR1R3"
1470 PLAY "O3C4O2E1O3DC:O0A1O1EAR1R3"
1480 PLAY "O2B3R1E1O3ER1:O0E1O1EO2ER1R1E1"
1490 PLAY "R1O3E1O4E1R1R1#D1:O3E1R1R1#D1ER1"
1500 PLAY "O3E3R1#D1E#D:R1O3#D1ER1R3"
1510 PLAY "O3E1#DEO2BO3DC:R6"
1520 PLAY "O2A3R1C1EA:O0A1O1EAR1R3"
1525 REM ------------------ 17 --------------------
1530 PLAY "O2B3R1E1#GB:O0E1O1E#GR1R3"
1540 PLAY "O3C3R1O2E1O3E#D:O0A1O1EAR1R3"
1550 PLAY "O3E1#DEO2BO3DC:R6"
1560 PLAY "O2A3R1C1EA:O0A1O1EAR1R3"
1565 PLAY "T6:T6"
1570 PLAY "O2B3R1E1O3CO2B:O0E1O1E#GR1R3"
1575 PLAY "T7:T7"
1580 PLAY "O2A3R3:O0A3R3"
1590 REM https://piastudy.com/Intermediate/211RWHBe0sT`,
  },

  musicRocknRouge: {
    name: "Rock'n Rouge (Seiko Matsuda)",
    description: 'Japanese pop song with 3-channel harmony - demonstrates complex PLAY with GOTO loops (from F-BASIC Manual p.37-38)',
    category: 'music',
    code: `10 PLAY "M1V10Y2T3:M1V7Y0T3:M1T3"
20 PLAY "O4G6C7:O3C3C5C3C5C3C:O2C7C"
30 PLAY "R7G1A3GFE1:RCC5CC:O1#A#A"
40 PLAY "F4ED3C7:C3C5C3C5C3C:AA"
50 PLAY "F4#DD3C5D:O2#G#B#B#G#BG#BF:#GG"
60 PLAY "O4G6C7:O2B3#BG#B#BG#B#B:O2CC"
70 PLAY "R7G1A3GFE1:F#B#BF#BF#BF:O1#A#A"
80 PLAY "F4ED3C7:#B#BA#B#BA#B#B:AA"
90 PLAY "F4#DD3:R3F1G#G#AO3CD:#G6#G3"
95 PLAY "#D5F3O3C:C5D3G:#G5#A"
97 N=0
100 PLAY "RDECG5C3C:O3:O1#B6#B3#B5G"
110 PLAY "RDEC:R7:#A6#A3"
115 PLAY "G6C3:F1ED#CC#CD#C:#A5F"
120 PLAY "RDECG5C3G:C7:A6A3A5F"
130 PLAY "RGFC:R7:#G6#G3"
135 PLAY "CDRC:F1GA#AO4CDEF:#G5#A3#B"
140 PLAY "RDECG5C3C:G7O3:O1#B6#B3#B5G"
150 PLAY "RDEC:R7:#A6#A3"
155 PLAY "G6C3:F1ED#CC#CD#C:#A5F"
160 PLAY "RDECG5C3G:C7O2:A6A3A5F"
170 PLAY "RGFCC5D:R7#D5F:#B3#B#A#G#G5#A"
180 PLAY "D6#D3:O2#A6#B3:#G5#G"
185 PLAY "#D5:O3C5C3D:#G#G3#G1#G"
190 PLAY "R5D3#D:#D5:#G5#G"
195 PLAY "D#DF#D:R5C3C:#G5#G3#G"
200 PLAY "D6#D3:O2#A6#B3:G5G"
205 PLAY "#D5:#B5G3A:GG3G1G"
210 PLAY "R5D3#DD#DF#D:#A8O2#A3#A:O1G5GGG"
220 PLAY "F6G3G7:O3D6#D3#D7:F5F3G#G5#G3G"
230 PLAY "F5G#DF:D5#DCD:F5F3G#G5F"
240 PLAY "G8:O3BO4CDCO3:GGG3EDO0B"
245 IF N=1 THEN 260
250 PLAY "R8R3C:B7G1ABO4CDEFG:O1G5GG3AB#B"
255 N=1:GOTO 100
260 PLAY "#G5GFD:O1R3DF#GB7:O0B5"
270 PLAY "F6#D3#D7:O2G5O3CD#D:O1#B#B#A#A"
280 PLAY "F5G#G#A:D#DFG:#G#G#A#A"
290 PLAY "#B8:O3C1DEFG#GABO4CDEF:#B#B#B"
295 PLAY "R5:G#GAB:#B"
300 PLAY "R7#B3B#BB:O4#B5#B:#BO4B"
305 M=0
310 PLAY "O3F5:R5O3FA#B:O1D6D5E3F#F"
320 PLAY "R:B0#BB#BB#BB#BB5:G6G3"
325 PLAY "#B3B#BB:R7:R3GAB"
330 PLAY "O3E5:R5GBO4D:#B6#B3RO1EGB"
340 PLAY "R:#C0D#CD#CD#CD#C5:A6A3"
345 PLAY "A3GAG:O3R:R3GE#CO1"
347 IF M=1 THEN 390
350 PLAY "C5C3FD5D3G:R3FARRDF:D6D3#A6#A3"
360 PLAY "E5AB#B:RCERRO2A#B:A6A3#F6#F3"
370 PLAY "#B7R3BAB:O3RCDFGGFG:G6G3G5"
380 PLAY "R:O2G1O3CDFDFGB:G6G3"
385 PLAY "#B3B#BB:GBO4DFDFGB:G"
387 M=1:GOTO 310
390 PLAY "F5F3GF5F3G:D5D3ED5D3E:D7O1#A5A"
400 PLAY "F5A#BB:D5FGF:G6G3G6G3"
410 PLAY "#B8:O4C3C5C3C5C3C:#B5#B#B#B"
420 PLAY ":RCC5CC:#A#A#A#A"
430 PLAY ":C3C5C3C5C3C:AAAA"
440 PLAY "R3#DFG#G5:RCC5C:#G#G#G"
445 PLAY "#A3#BC3C:#A3#B"
450 PLAY "O1R7C:R7C"`,
  },

  // ============================================================================
  // F-BASIC Reference Manual Sample Games (pages 94-101)
  // ============================================================================

  knight: {
    name: 'KNIGHT',
    description: 'Chess knight movement game - 2 players take turns placing pieces using knight moves (from F-BASIC Manual p.94)',
    category: 'comprehensive',
    bgKey: 'knight',
    code: `10 VIEW:CGEN 3:CGSET 1,1
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
600 PRINT "WIN !!":END`,
  },

  superMemory: {
    name: 'SUPER MEMORY',
    description: 'Memory matching game - remember and repeat color panel sequences (from F-BASIC Manual p.95)',
    category: 'comprehensive',
    bgKey: 'superMemory',
    code: `10 REM * SUPER MEMORY *
20 VIEW:CGEN 2
30 MAX=5:Z=0:I=0:C=0
40 PP$="CFGE"
50 ZC$=CHR$(254):Z$=ZC$+ZC$+ZC$+ZC$+ZC$
60 N$=""
70 DIM PL(MAX), PX(3), PY(3), C(3)
80 PX(0)=16:PY(0)=8:C(0)=2
90 PX(1)=16:PY(1)=12:C(1)=1
100 PX(2)=12:PY(2)=10:C(2)=3
110 PX(3)=20:PY(3)=10:C(3)=0
120 PL(Z)=RND(4)
130 FOR I=0 TO Z
140 X=PX(PL(I)):Y=PY(PL(I))
150 C=C(PL(I))
160 PALETB 3, 13, 13, 13, 13
170 GOSUB 430
180 PLAY "T2O4"+MID$(PP$, PL(I)+1, 1)+"3"
190 GOSUB 490
200 PALETB 3, 13, &H16, &H27, 2
210 PAUSE 10
220 NEXT
230 LOCATE 9, 10:PRINT "YOU"
240 A$=INKEY$:IF A$="" THEN 240
250 IF A$=CHR$(PL(I)+65) THEN 270
260 PLAY "T1O1CICIC1":GOTO 230
270 PLAY "T2O5C2R2F2R2E2"
280 PALETB 3, 13, &H16, &H27, 2
290 X=PX(PL(I)):Y=PY(PL(I))
300 C=C(PL(I))
310 GOSUB 430
320 PAUSE 10
330 PALETB 3, 13, 13, 13, 13
340 GOSUB 490
350 I=I+1:IF I<=Z THEN 240
360 Z=Z+1:IF Z>MAX THEN 400
370 LOCATE 9, 10:PRINT ""
380 PAUSE 50
390 GOTO 130
400 END
410 CLS:CGSET 1, 1:PRINT "GOOD!!"
420 REM * SUBROUTINES *
430 FOR J=0 TO 5
440 LOCATE X, Y+J
450 PRINT Z$
460 NEXT
470 RETURN
490 FOR J=0 TO 5
500 LOCATE X, Y+J
510 PRINT N$
520 NEXT
530 RETURN`,
  },

  ufo: {
    name: 'UFO',
    description: 'UFO shooting game - defend against fighter flies (from F-BASIC Manual p.96)',
    category: 'comprehensive',
    bgKey: 'ufo',
    code: `10 REM * UFO *
20 VIEW:CGEN 2
30 CGSET 1,1
40 U0$=CHR$(64)+CHR$(65)+CHR$(66)+CHR$(67)
50 U1$=CHR$(68)+CHR$(69)+CHR$(70)+CHR$(71)
60 B$=CHR$(72)+CHR$(73)+CHR$(74)+CHR$(75)
70 G0$=CHR$(76)+CHR$(77)+CHR$(78)+CHR$(79)
80 G1$=CHR$(80)+CHR$(81)+CHR$(82)+CHR$(83)
90 D0$=CHR$(84)+CHR$(85)+CHR$(86)+CHR$(87)
100 D1$=CHR$(88)+CHR$(89)+CHR$(90)+CHR$(91)
110 DEF SPRITE 0,(0,1,0,0,0)=U0$
120 DEF SPRITE 1,(0,1,0,0,0)=U1$
130 DEF SPRITE 2,(0,1,0,0,0)=B$
140 DEF SPRITE 3,(0,1,0,0,0)=G0$
150 DEF SPRITE 4,(0,1,0,0,0)=G1$
160 DEF SPRITE 5,(0,1,0,0,0)=D0$
170 DEF SPRITE 6,(0,1,0,0,0)=D1$
180 PALETS 0,1,48,25,18
190 PALETS 1,1,48,25,18
200 PALETS 2,1,48,25,18
210 SPRITE ON
220 LG=2:RG=25:TG=2:BG=18
230 GX=13:GY=18:BV=0:DV=0:R=0
240 PR=0
250 GOSUB 300
260 S=STICK(0)
270 IF S=1 THEN GX=GX+1
280 IF S=2 THEN GX=GX-1
290 IF GX<LG THEN GX=LG
300 IF GX>RG THEN GX=RG
310 SPRITE 2,GX*8+16,GY*8+24
320 IF STRIG(0)<>0 THEN 340
330 GOTO 260
340 BV=GY-2:DV=GX
350 SPRITE 3,DV*8+16,BV*8+24
360 IF BV<TG THEN 380
370 BV=BV-1:GOTO 350
380 SPRITE 3,0,0
390 R=RND(10)
400 IF R<3 THEN 420
410 GOTO 260
420 GOSUB 440
430 GOTO 260
440 REM * ENEMY *
450 EX=RND(24)+2
460 EY=TG
470 SPRITE 0,EX*8+16,EY*8+24
480 IF EY>=GY THEN 500
490 EY=EY+1:GOTO 470
500 IF EX=DV AND EY>=BV THEN 520
510 GOTO 480
520 SPRITE 0,0,0:SPRITE 3,0,0
530 PR=PR+10
540 LOCATE 0,0:PRINT "SCORE: ";PR
550 RETURN
560 END`,
  },

  route66: {
    name: 'ROUTE 66',
    description: 'Racing game - avoid other cars on the endless road (from F-BASIC Manual p.97)',
    category: 'comprehensive',
    bgKey: 'route66',
    code: `10 REM * ROUTE 66 *
20 VIEW
30 CGEN 2
40 CGSET 1,1
50 PALETB 0,1,48,25,18
60 PALETB 1,1,48,25,18
70 PALETB 2,1,48,25,18
80 SPRITE ON
90 X1=120:Y1=180
100 SC=0:CA=3:V=0
110 FOR I=0 TO 3
120 DEF SPRITE I,(I,1,0,0,0)=CHR$(I*4)+CHR$(I*4+1)+CHR$(I*4+2)+CHR$(I*4+3)
130 NEXT
140 DIM X(3),Y(3)
150 FOR I=0 TO 3
160 X(I)=RND(1)*200+28
170 Y(I)=RND(1)*100
180 NEXT
190 GOSUB 500
200 S=STICK(0)
210 IF S=1 THEN X1=X1-4
220 IF S=2 THEN X1=X1+4
230 IF STRIG(0)=0 THEN V=V+1
240 IF STRIG(1)=0 THEN V=V-1
250 IF V<0 THEN V=0
260 IF V>10 THEN V=10
270 FOR I=0 TO 3
280 Y(I)=Y(I)+V
290 IF Y(I)>240 THEN Y(I)=Y(I)-240:X(I)=RND(1)*200+28
300 IF ABS(X(I)-X1)<16 AND ABS(Y(I)-Y1)<16 THEN 360
310 NEXT
320 SC=SC+V
330 IF SC>9999 THEN SC=9999
340 GOSUB 500
350 GOTO 200
360 CA=CA-1
370 IF CA<0 THEN 390
380 GOTO 190
390 PRINT "GAME OVER!"
400 END
500 REM * DISPLAY *
510 CLS
520 LOCATE 0,0:PRINT "HIGH SCORE";SC
530 LOCATE 0,1:PRINT "LEVEL";V
540 LOCATE 0,2:PRINT "SCORE";SC
550 LOCATE 0,3:PRINT "CARS";CA
560 LOCATE 0,4:PRINT "LEFT";9999-SC;"M"
570 LOCATE 0,5:PRINT "SEC";100
580 SPRITE 0,X1,Y1
590 FOR I=0 TO 3
600 SPRITE I+1,X(I),Y(I)
610 NEXT
620 RETURN`,
  },

  typeMaster: {
    name: 'TYPE MASTER',
    description: 'Typing practice game - find and type the matching character (from F-BASIC Manual p.98) - REQUIRES INKEY$ (Issue #4)',
    category: 'comprehensive',
    bgKey: 'typeMaster',
    code: `10 CGEN 3:CGSET 1,1
20 VIEW
30 PLAY "T120"
40 PO=0:PP=0
50 DIM A$(10),B$(10)
60 FOR I=0 TO 9
70 A$(I)=CHR$(48+I)
80 NEXT
90 FOR I=0 TO 9
100 READ B$(I)
110 NEXT
120 DEF SPRITE 0,(0,1,0,0,0)=CHR$(0)+CHR$(1)+CHR$(2)+CHR$(3)
130 SPRITE ON
140 LOCATE 0,0:PRINT "TYPE"
150 FOR I=0 TO 9
160 LOCATE I*2+2,1:PRINT A$(I)
170 NEXT
180 LOCATE 10,3:PRINT "THIS..."
190 LOCATE 15,3:PRINT CHR$(0)
200 LOCATE 0,4:PRINT "     "
210 PAUSE 60
220 FOR I=0 TO 9
230 SWAP A$(I),A$(RND(1)*10)
240 NEXT
250 FOR I=0 TO 9
260 LOCATE I*2+2,1:PRINT A$(I)
270 NEXT
280 GOSUB 400
290 K$=INKEY$
300 IF K$="" THEN 290
310 IF ASC(K$)<48 OR ASC(K$)>57 THEN 290
320 FOR I=0 TO 9
330 IF A$(I)=K$ THEN 360
340 NEXT
350 GOTO 290
360 IF I=PP THEN 380
370 GOTO 290
380 PO=PO+1
390 IF PO>9 THEN 200
400 REM * SOUND *
410 FOR J=0 TO 5
420 GOSUB 400
430 NEXT
440 RETURN
450 DATA "0","1","2","3","4","5","6","7","8","9"
460 FOR J=0 TO 5:GOSUB 400: NEXT: RETURN`,
  },

  turtle: {
    name: 'TURTLE',
    description: 'Turtle racing game - simplified version (from F-BASIC Manual p.99)',
    category: 'comprehensive',
    bgKey: 'turtle',
    code: `10 CLS
20 CGEN 3
30 CGSET 1,1
40 PALETB 0,1,48,25,18
50 PALETB 1,1,48,25,18
60 PALETB 2,1,48,25,18
70 PLAY "04T1"
80 DIM AX(5),AY(5),Q(5),C(5)
90 INPUT "HOW MANY PLAYERS";PL
100 IF PL<1 THEN 90
110 IF PL>5 THEN 90
120 FOR I=1 TO 5
130 Q(I)=RND(5)+1
140 C(I)=Q(I)
150 NEXT
160 VIEW
170 LOCATE 0,0:PRINT "TURTLE 1 2 3 4 5"
180 FOR I=1 TO 5
190 LOCATE 0,I:PRINT I
200 NEXT
210 FOR I=1 TO 5
220 AX(I)=0
230 AY(I)=I*32+16
240 NEXT
250 DEF SPRITE 0,(0,1,0,0,0)=CHR$(184)+CHR$(185)+CHR$(186)+CHR$(187)
260 SPRITE ON
270 FOR K=1 TO 100
280 FOR I=1 TO 5
290 A=RND(8)
300 IF A<Q(I) THEN AX(I)=AX(I)+1
310 IF AX(I)>200 THEN 400
320 NEXT
330 FOR I=1 TO 5
340 SPRITE 0,AX(I),AY(I)
350 NEXT
360 IF K=50 THEN PLAY "T6CEDFEGC2T1"
370 IF K=50 THEN LOCATE 10,10:PRINT "CHANGE"
380 IF K=50 THEN GOSUB 500
390 NEXT
400 FOR I=1 TO 5
410 IF AX(I)>200 THEN W=I
420 NEXT
430 LOCATE 10,12:PRINT "WINNER:";W
440 SPRITE OFF
450 INPUT "PLAY AGAIN (Y/N)";A$
460 IF A$="Y" THEN PRINT "PRESS RUN TO RESTART"
470 IF A$="y" THEN PRINT "PRESS RUN TO RESTART"
480 END
500 REM * CHANGE SPEED *
510 FOR I=1 TO 5
520 Q(I)=RND(5)+1
530 NEXT
540 RETURN`,
  },

  card: {
    name: 'CARD',
    description: 'Card matching game - simplified version (from F-BASIC Manual p.100)',
    category: 'comprehensive',
    bgKey: 'card',
    code: `10 VIEW
20 CGEN 3
30 CGSET 1,1
40 SPRITE ON
50 CX=0
60 CY=0
70 P=0
80 ED=0
90 N$=CHR$(254)
100 N$=N$+N$+N$+N$
110 M0$=CHR$(243)+CHR$(247)
120 M1$=CHR$(245)+CHR$(248)
130 DIM D(5,5),PT(17),PR(1)
140 FOR I=0 TO 5
150 FOR J=0 TO 5
160 LOCATE I*4+1,J*3+1
170 PRINT M0$
180 LOCATE I*4+1,J*3+2
190 PRINT M1$
200 A=RND(18)
210 IF PT(A)=2 THEN 200
220 D(I,J)=A
230 PT(A)=PT(A)+1
240 NEXT
250 NEXT
260 PALETS 0,13,&H12,&H22,2
270 PALETS 1,13,&H14,&H24,4
280 PALETS 2,13,&H16,&H26,6
290 PALETS 3,13,2,25,&H36
300 DEF SPRITE 0,(3,1,0,0,0)=N$
310 DEF SPRITE 5,(3,1,0,0,0)=N$
320 LOCATE 25,9:PRINT "LEFT"
330 LOCATE 25,12:PRINT "RIGHT"
340 T0=-1
350 T1=-1
360 SPRITE 0,CX*32+24,CY*24+31
370 S=STICK(P)
380 T=STRIG(P)
390 IF S=1 THEN CX=CX+1
400 IF CX>5 THEN CX=0
410 IF S=2 THEN CX=CX-1
420 IF CX<0 THEN CX=5
430 IF S=4 THEN CY=CY+1
440 IF CY>5 THEN CY=0
450 IF S=8 THEN CY=CY-1
460 IF CY<0 THEN CY=5
470 IF S<>0 THEN SPRITE 0,CX*32+24,CY*24+31
480 IF T<8 THEN 370
490 SWAP D(CX,CY),T0
500 IF T0=-1 THEN 520
510 GOTO 540
520 SWAP D(CX,CY),T0
530 GOTO 370
540 SPRITE 0,0,0
550 PLAY "05T1C1C1"
560 PAUSE 10
570 LOCATE CX*4+1,CY*3+1:PRINT " "
580 LOCATE CX*4+1,CY*3+2:PRINT " "
590 TC=T0/6
600 IF TC=0 THEN DEF SPRITE 6,(0,1,1,0,0)=CHR$(48+T0)
610 IF TC=1 THEN DEF SPRITE 6,(1,1,1,0,0)=CHR$(48+T0-6)
620 IF TC=2 THEN DEF SPRITE 6,(2,1,1,0,0)=CHR$(48+T0-12)
630 IF TC=3 THEN DEF SPRITE 6,(3,1,1,0,0)=CHR$(48+T0-18)
640 SPRITE 6,CX*32+24,CY*24+31
650 IF T1=-1 THEN 680
660 IF T0<>T1 THEN 720
670 GOTO 700
680 T1=T0
690 X=CX:Y=CY:P=1-P:GOTO 370
700 PLAY "T204C1E1G1"
710 ED=ED+1
720 IF ED=18 THEN 800
730 PR(P)=PR(P)+10
740 LOCATE 23,10+P*3:PRINT PR(P)
750 T0=-1:T1=-1
760 SPRITE 6,0,0
770 SPRITE 7,0,0
780 GOTO 360
800 PRINT "GAME OVER!"
810 FOR J=0 TO 1
820 LOCATE 10,10+J:PRINT "PLAYER";J;"=";PR(J)
830 NEXT
840 PRINT "PRESS RUN TO PLAY AGAIN"
850 END`,
  },

  printableArea: {
    name: 'PRINTable & Sprite Area Demo',
    description: 'PRINT first then VIEW to show how BG GRAPHIC overwrites the Background Screen',
    category: 'screen',
    bgKey: 'layerBox',
    code: `10 REM * BG & PRINT OVERLAP DEMO *
20 REM Demonstrates that VIEW copies BG to Background Screen
30 REM which OVERWRITES any existing PRINT content
40 CLS
50 REM Step 1: Fill printable area with blocks FIRST
60 FOR Y=0 TO 23
70 FOR X=0 TO 27
80 LOCATE X,Y:PRINT CHR$(255);
90 NEXT
100 NEXT
105 LOCATE 12,10
110 REM Step 2: VIEW copies BG GRAPHIC over the blocks
120 REM Notice how BG box frame replaces the blocks it covers
130 VIEW
140 REM Define all 8 sprites at boundaries
150 SPRITE ON
160 FOR I=0 TO 7:DEF SPRITE I,(0,0,0,0,0)=CHR$(208):NEXT
170 REM 8 boundary positions (clockwise from top-left)
180 SPRITE 0,0,0:SPRITE 1,124,0:SPRITE 2,248,0
190 SPRITE 3,248,116:SPRITE 4,248,232
200 SPRITE 5,124,232:SPRITE 6,0,232:SPRITE 7,0,116
210 END`,
  },

  scrSample: {
    name: 'SCR$ Sample',
    description: 'Penguin chase demo - collect flags while avoiding the smiley (from F-BASIC Manual p.101)',
    category: 'comprehensive',
    bgKey: 'scrSample',
    code: `10 VIEW
20 PLAY "04C1D1A1G1E1B"
30 SPRITE ON
40 CGSET 1,0
50 PX=50:PY=56:MX=190:MY=150:DEF MOVE(0)=SPRITE(4,0,1,1,0,0):POSITION 0,PX,PY
60 DX=PX-MX:DY=PY-MY
70 IF ABS(DX)<8 AND ABS(DY)<8 THEN 360
80 S1=-1*(DX>0)-2*(DX<0):S2=-4*(DY>0)-8*(DY<0)
90 IF ABS(DX)<ABS(DY) THEN SWAP S1,S2
100 S=S1:GOSUB 270:GOSUB 290
110 IF D<>0 THEN 140
120 SWAP S1,S2:S=S1:GOSUB 270:GOSUB 290
130 IF D=0 THEN 160
140 DEF MOVE(1)=SPRITE(11,0,1,3,0,0):POSITION 1,MX,MY
150 MOVE 1:PLAY "01C1C1C1"
160 S0=STICK(0)
170 S=S0:GOSUB 280:GOSUB 290
180 IF D=0 THEN 250
190 DEF MOVE(0)=SPRITE(4,D,1,3,0,0)
200 POSITION 0,PX,PY
210 MOVE 0:PLAY "03B1D1"
220 XX=(PX+7)/8-2:YY=(PY+7)/8-3
230 IF SCR$(XX,YY)=CHR$(199) THEN LOCATE XX,YY:PRINT " ":CN=CN+1:LOCATE 10,23:PRINT "SCORE:";CN:PLAY "04C1A1G1"
240 IF MOVE(0)=-1 OR MOVE(1)=-1 THEN 240
250 PX=XPOS(0):PY=YPOS(0):MX=XPOS(1):MY=YPOS(1)
260 GOTO 60
270 X=MX-(S=1)*4+(S=2)*4:Y=MY-(S=4)*4+(S=8)*4:RETURN
280 X=PX-(S=1)*4+(S=2)*4:Y=PY-(S=4)*4+(S=8)*4:RETURN
290 C1=(X-1)/8-2:L1=(Y-1)/8-3
300 C2=X+16:C2=(C2-1)/8-2:L2=Y+16:L2=(L2-1)/8-3
310 D=-3*(S=1)*(SCR$(C2,L1)=" ")*(SCR$(C2,L2)=" ")
320 D=D-7*(S=2)*(SCR$(C1,L1)=" ")*(SCR$(C1,L2)=" ")
330 D=D-1*(S=8)*(SCR$(C1,L1)=" ")*(SCR$(C2,L1)=" ")
340 D=D-5*(S=4)*(SCR$(C1,L2)=" ")*(SCR$(C2,L2)=" ")
350 RETURN
360 PLAY "04G1C1G1":FOR Q=0 TO 3:CGSET 0,0:CGSET 1,1:CGSET 0,0:NEXT
370 PLAY "01C1G1A1C1D1":CLS:SPRITE OFF
380 LOCATE 5,10:PRINT "-END-"`,
  },
}

export function getSampleCode(key: string): SampleCode | undefined {
  return SAMPLE_CODES[key]
}

export function getAllSampleCodes(): SampleCode[] {
  return Object.values(SAMPLE_CODES)
}

export function getSampleCodeKeys(): string[] {
  return Object.keys(SAMPLE_CODES)
}
