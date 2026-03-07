/**
 * Sample codes for F-Basic IDE - loaded from external .bas files
 * @see programs/ directory for BASIC source files
 */

// ============================================================================
// Type Definitions
// ============================================================================

export interface SampleCode {
  name: string
  description: string
  code: string
  category: 'basics' | 'control' | 'data' | 'screen' | 'sprites' | 'interactive' | 'comprehensive' | 'music'
  /** Optional BG data key for samples that use VIEW command */
  bgKey?: string
}

// ============================================================================
// BASIC Code Imports (Vite raw imports)
// ============================================================================

// Basics
import basic from './programs/basics/basic.bas?raw'
import beep from './programs/basics/beep.bas?raw'
import hello from './programs/basics/hello.bas?raw'
import inputSample from './programs/basics/input.bas?raw'
import variables from './programs/basics/variables.bas?raw'
import card from './programs/comprehensive/card.bas?raw'
import knight from './programs/comprehensive/knight.bas?raw'
import route66 from './programs/comprehensive/route66.bas?raw'
import scrSample from './programs/comprehensive/scr-sample.bas?raw'
// Comprehensive (Full Demo Games)
import shooting from './programs/comprehensive/shooting.bas?raw'
import superMemory from './programs/comprehensive/super-memory.bas?raw'
import turtle from './programs/comprehensive/turtle.bas?raw'
import typeMaster from './programs/comprehensive/type-master.bas?raw'
import ufo from './programs/comprehensive/ufo.bas?raw'
import conditionals from './programs/control/conditionals.bas?raw'
import loops from './programs/control/loops.bas?raw'
// Control
import pause from './programs/control/pause.bas?raw'
import subroutines from './programs/control/subroutines.bas?raw'
import arrays from './programs/data/arrays.bas?raw'
// Data
import dataRead from './programs/data/data-read.bas?raw'
import beepInteractive from './programs/interactive/beep-interactive.bas?raw'
import inkeyBlockingTest from './programs/interactive/inkey-blocking.bas?raw'
import inkeyTest from './programs/interactive/inkey-test.bas?raw'
import joystick from './programs/interactive/joystick.bas?raw'
// Interactive
import spriteInteractive from './programs/interactive/sprite-interactive.bas?raw'
import musicArpeggio from './programs/music/arpeggio.bas?raw'
// Music
import musicBasic from './programs/music/basic.bas?raw'
import musicFurElise2Ch from './programs/music/fur-elise.bas?raw'
import musicHappyBirthday from './programs/music/happy-birthday.bas?raw'
import musicJingleBells from './programs/music/jingle-bells.bas?raw'
import musicLoopDemo from './programs/music/loop-demo.bas?raw'
import musicMaryHadALittleLamb from './programs/music/mary-lamb.bas?raw'
import musicOdeToJoy from './programs/music/ode-to-joy.bas?raw'
import musicPlayer from './programs/music/player.bas?raw'
import musicRocknRouge from './programs/music/rockn-rouge.bas?raw'
import musicScale from './programs/music/scale.bas?raw'
import musicThreeChannel from './programs/music/three-channel.bas?raw'
import musicTwinkle from './programs/music/twinkle.bas?raw'
import allChars from './programs/screen/all-chars.bas?raw'
import bgItems from './programs/screen/bg-items.bas?raw'
import bgPlatform from './programs/screen/bg-platform.bas?raw'
import bgTitle from './programs/screen/bg-title.bas?raw'
import bgView from './programs/screen/bg-view.bas?raw'
import cursorPosition from './programs/screen/cursor-position.bas?raw'
import performance from './programs/screen/performance.bas?raw'
import printableArea from './programs/screen/printable-area.bas?raw'
// Screen
import screen from './programs/screen/screen.bas?raw'
import screenRead from './programs/screen/screen-read.bas?raw'
import screenReadColor from './programs/screen/screen-read-color.bas?raw'
import spriteAnimation from './programs/sprites/sprite-animation.bas?raw'
// Sprites
import spriteBasic from './programs/sprites/sprite-basic.bas?raw'
import spriteControl from './programs/sprites/sprite-control.bas?raw'
import spriteTableB from './programs/sprites/sprite-table-b.bas?raw'

// ============================================================================
// Sample Code Definitions
// ============================================================================

export const SAMPLE_CODES: Record<string, SampleCode> = {
  // === BASICS ===
  basic: {
    name: 'Basic F-Basic Program',
    description: 'Simple arithmetic with LET and PRINT',
    category: 'basics',
    code: basic,
  },
  hello: {
    name: 'Hello World',
    description: 'Simple PRINT demonstration',
    category: 'basics',
    code: hello,
  },
  variables: {
    name: 'Variables & Math',
    description: 'LET, arithmetic, functions',
    category: 'basics',
    code: variables,
  },
  input: {
    name: 'INPUT / LINPUT',
    description: 'User input commands',
    category: 'basics',
    code: inputSample,
  },
  beep: {
    name: 'BEEP Sound',
    description: 'BEEP statement - produce a beep sound',
    category: 'basics',
    code: beep,
  },

  // === CONTROL ===
  pause: {
    name: 'PAUSE Command Demo',
    description: 'Demonstrates PAUSE with countdown and timing delays',
    category: 'control',
    code: pause,
  },
  loops: {
    name: 'FOR-NEXT',
    description: 'Looping statements',
    category: 'control',
    code: loops,
  },
  conditionals: {
    name: 'IF-THEN',
    description: 'Conditional logic',
    category: 'control',
    code: conditionals,
  },
  subroutines: {
    name: 'GOSUB-RETURN',
    description: 'Subroutines',
    category: 'control',
    code: subroutines,
  },

  // === DATA ===
  dataRead: {
    name: 'DATA & READ',
    description: 'Data storage',
    category: 'data',
    code: dataRead,
  },
  arrays: {
    name: 'DIM Arrays',
    description: 'Array usage',
    category: 'data',
    code: arrays,
  },

  // === SCREEN ===
  screen: {
    name: 'Screen & Colors',
    description: 'LOCATE, CGSET, PALETB',
    category: 'screen',
    code: screen,
  },
  screenCoalesce: {
    name: 'Performance Test',
    description: 'Screen update test',
    category: 'screen',
    code: performance,
  },
  allChars: {
    name: 'All Characters',
    description: 'Print all CHR$(0) to CHR$(255)',
    category: 'screen',
    code: allChars,
  },
  bgItems: {
    name: 'BG Items Display',
    description: 'Display all BG character items - numbers, letters, symbols, kana, and picture tiles',
    category: 'screen',
    code: bgItems,
  },
  bgView: {
    name: 'BG VIEW Test',
    description: 'Copy BG GRAPHIC to background screen - includes demo BG pattern',
    category: 'screen',
    bgKey: 'bgView',
    code: bgView,
  },
  bgViewTitle: {
    name: 'BG Title Screen',
    description: 'Display a decorative title screen using BG GRAPHIC',
    category: 'screen',
    bgKey: 'titleScreen',
    code: bgTitle,
  },
  bgViewPlatform: {
    name: 'BG Platform Level',
    description: 'Platform game level background with ground and platforms',
    category: 'screen',
    bgKey: 'platformGame',
    code: bgPlatform,
  },
  cursorPosition: {
    name: 'Cursor Position (CSRLIN/POS)',
    description: 'CSRLIN and POS functions - get current cursor position',
    category: 'screen',
    code: cursorPosition,
  },
  screenRead: {
    name: 'Screen Read (SCR$)',
    description: 'SCR$ function - read characters from screen',
    category: 'screen',
    code: screenRead,
  },
  screenReadColor: {
    name: 'Screen Read with Color (SCR$)',
    description: 'SCR$ with color switch - read character and color from screen',
    category: 'screen',
    code: screenReadColor,
  },
  printableArea: {
    name: 'PRINTable & Sprite Area Demo',
    description: 'PRINT first then VIEW to show how BG GRAPHIC overwrites the Background Screen',
    category: 'screen',
    bgKey: 'layerBox',
    code: printableArea,
  },

  // === SPRITES ===
  spriteBasic: {
    name: 'Sprite Basics',
    description: 'DEF SPRITE, SPRITE commands (8x8 sprite)',
    category: 'sprites',
    code: spriteBasic,
  },
  spriteAnimation: {
    name: 'Sprite Animation',
    description: 'Multiple sprites with DEF MOVE - animation demo',
    category: 'sprites',
    code: spriteAnimation,
  },
  spriteControl: {
    name: 'Sprite Control',
    description: 'POSITION, XPOS, YPOS, CUT, ERA - single sprite control',
    category: 'sprites',
    code: spriteControl,
  },
  spriteTableB: {
    name: 'Sprite Table B Test',
    description: 'Test sprites using Table B (BG characters) with CGEN 3 - demonstrates flag (&HC7) and apple (&HD7)',
    category: 'sprites',
    code: spriteTableB,
  },

  // === INTERACTIVE ===
  spriteInteractive: {
    name: 'Interactive Sprites (Adaptive Timing)',
    description: 'Control sprites with joystick - adaptive PAUSE for responsive input + controlled speed',
    category: 'interactive',
    code: spriteInteractive,
  },
  joystick: {
    name: 'Joystick Test (Adaptive Timing)',
    description: 'STICK and STRIG functions - adaptive PAUSE for responsive input',
    category: 'interactive',
    code: joystick,
  },
  inkeyTest: {
    name: 'INKEY$ Test',
    description: 'Test keyboard input with INKEY$ - press keys to see characters',
    category: 'interactive',
    code: inkeyTest,
  },
  inkeyBlockingTest: {
    name: 'INKEY$(0) Blocking Test',
    description: 'Test INKEY$ with blocking mode - waits for key press',
    category: 'interactive',
    code: inkeyBlockingTest,
  },
  beepInteractive: {
    name: 'BEEP Interactive',
    description: 'BEEP on button press - interactive sound demo',
    category: 'interactive',
    code: beepInteractive,
  },

  // === COMPREHENSIVE (Full Demo Games) ===
  shooting: {
    name: 'Shooting Game',
    description: 'Full shooting game with levels, sprites, and scoring',
    category: 'comprehensive',
    code: shooting,
  },
  knight: {
    name: 'KNIGHT',
    description: 'Chess knight movement game - 2 players take turns placing pieces using knight moves (from F-BASIC Manual p.94)',
    category: 'comprehensive',
    bgKey: 'knight',
    code: knight,
  },
  superMemory: {
    name: 'SUPER MEMORY',
    description: 'Memory matching game - remember and repeat color panel sequences (from F-BASIC Manual p.95)',
    category: 'comprehensive',
    bgKey: 'superMemory',
    code: superMemory,
  },
  ufo: {
    name: 'UFO',
    description: 'UFO shooting game - defend against fighter flies (from F-BASIC Manual p.96)',
    category: 'comprehensive',
    bgKey: 'ufo',
    code: ufo,
  },
  route66: {
    name: 'ROUTE 66',
    description: 'Racing game - avoid other cars on the endless road (from F-BASIC Manual p.97)',
    category: 'comprehensive',
    bgKey: 'route66',
    code: route66,
  },
  typeMaster: {
    name: 'TYPE MASTER',
    description: 'Typing practice game - find and type the matching character (from F-BASIC Manual p.98)',
    category: 'comprehensive',
    bgKey: 'typeMaster',
    code: typeMaster,
  },
  turtle: {
    name: 'TURTLE',
    description: 'Turtle racing game - simplified version (from F-BASIC Manual p.99)',
    category: 'comprehensive',
    bgKey: 'turtle',
    code: turtle,
  },
  card: {
    name: 'CARD',
    description: 'Card matching game - simplified version (from F-BASIC Manual p.100)',
    category: 'comprehensive',
    bgKey: 'card',
    code: card,
  },
  scrSample: {
    name: 'SCR$ Sample',
    description: 'Penguin chase demo - collect flags while avoiding the smiley (from F-BASIC Manual p.101)',
    category: 'comprehensive',
    bgKey: 'scrSample',
    code: scrSample,
  },

  // === MUSIC ===
  musicBasic: {
    name: 'Basic Music Demo',
    description: 'Simple PLAY demonstration with single notes',
    category: 'music',
    code: musicBasic,
  },
  musicTwinkle: {
    name: 'Twinkle Twinkle Little Star (Full)',
    description: 'Complete classic nursery rhyme with GOTO loop - demonstrates BASIC repetition',
    category: 'music',
    code: musicTwinkle,
  },
  musicOdeToJoy: {
    name: 'Ode to Joy (Full - Beethoven)',
    description: 'Complete melody with GOSUB for repeated phrases - demonstrates BASIC subroutines',
    category: 'music',
    code: musicOdeToJoy,
  },
  musicMaryHadALittleLamb: {
    name: 'Mary Had a Little Lamb',
    description: "Traditional children's song from F-BASIC Manual (page 34) - 3-channel harmony",
    category: 'music',
    code: musicMaryHadALittleLamb,
  },
  musicHappyBirthday: {
    name: 'Happy Birthday (Full)',
    description: 'Complete traditional birthday song with all phrases - demonstrates dotted rhythms',
    category: 'music',
    code: musicHappyBirthday,
  },
  musicJingleBells: {
    name: 'Jingle Bells (Full)',
    description: 'Complete Christmas carol with GOSUB for chorus - demonstrates BASIC subroutines',
    category: 'music',
    code: musicJingleBells,
  },
  musicScale: {
    name: 'C Major Scale',
    description: 'Ascending and descending C major scale - demonstrates octaves',
    category: 'music',
    code: musicScale,
  },
  musicArpeggio: {
    name: 'C Major Arpeggio',
    description: 'C major arpeggio pattern - demonstrates chord arpeggios',
    category: 'music',
    code: musicArpeggio,
  },
  musicThreeChannel: {
    name: 'Three-Channel Harmony Demo',
    description: 'Demonstrates 3-channel simultaneous playback with PLAY',
    category: 'music',
    code: musicThreeChannel,
  },
  musicPlayer: {
    name: 'Music Player with Menu',
    description: 'Interactive music player demonstrating GOTO for menu loop and song selection',
    category: 'music',
    code: musicPlayer,
  },
  musicLoopDemo: {
    name: 'Music Loop Demo',
    description: 'Demonstrates FOR-NEXT and GOTO for musical repetition patterns',
    category: 'music',
    code: musicLoopDemo,
  },
  musicFurElise2Ch: {
    name: 'Fur Elise 2-Channel (Beethoven)',
    description: '2-channel piano version with right hand melody and left hand bass - matches real piano sheet',
    category: 'music',
    code: musicFurElise2Ch,
  },
  musicRocknRouge: {
    name: "Rock'n Rouge (Seiko Matsuda)",
    description: 'Japanese pop song with 3-channel harmony - demonstrates complex PLAY with GOTO loops (from F-BASIC Manual p.37-38)',
    category: 'music',
    code: musicRocknRouge,
  },
}

// ============================================================================
// Helper Functions
// ============================================================================

export function getSampleCode(key: string): SampleCode | undefined {
  return SAMPLE_CODES[key]
}

export function getAllSampleCodes(): SampleCode[] {
  return Object.values(SAMPLE_CODES)
}

export function getSampleCodeKeys(): string[] {
  return Object.keys(SAMPLE_CODES)
}
