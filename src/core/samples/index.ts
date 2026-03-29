/**
 * Sample codes for F-Basic IDE - loaded from external .bas files
 * @see programs/ directory for BASIC source files
 */

// ============================================================================
// Type Definitions
// ============================================================================

export type SampleCategory = 'basics' | 'control' | 'data' | 'screen' | 'sprites' | 'interactive' | 'comprehensive' | 'music'

export interface SampleCode {
  /** Sample key used for i18n lookup (ide.samples.items.{key}.name/description) */
  key: string
  code: string
  category: SampleCategory
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
import musicBgplayDemo from './programs/music/bgplay-demo.bas?raw'
import musicHappyBirthday from './programs/music/happy-birthday.bas?raw'
import musicJingleBells from './programs/music/jingle-bells.bas?raw'
import musicLoopDemo from './programs/music/loop-demo.bas?raw'
import musicMaryHadALittleLamb from './programs/music/mary-lamb.bas?raw'
import musicOdeToJoy from './programs/music/ode-to-joy.bas?raw'
// Music
import musicPlayDemo from './programs/music/play-demo.bas?raw'
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
import printableArea from './programs/screen/printable-area.bas?raw'
// Screen
import screen from './programs/screen/screen.bas?raw'
import screenFill from './programs/screen/screen-fill.bas?raw'
import screenRead from './programs/screen/screen-read.bas?raw'
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
    key: 'basic',
    category: 'basics',
    code: basic,
  },
  hello: {
    key: 'hello',
    category: 'basics',
    code: hello,
  },
  variables: {
    key: 'variables',
    category: 'basics',
    code: variables,
  },
  input: {
    key: 'input',
    category: 'basics',
    code: inputSample,
  },
  beep: {
    key: 'beep',
    category: 'basics',
    code: beep,
  },

  // === CONTROL ===
  pause: {
    key: 'pause',
    category: 'control',
    code: pause,
  },
  loops: {
    key: 'loops',
    category: 'control',
    code: loops,
  },
  conditionals: {
    key: 'conditionals',
    category: 'control',
    code: conditionals,
  },
  subroutines: {
    key: 'subroutines',
    category: 'control',
    code: subroutines,
  },

  // === DATA ===
  dataRead: {
    key: 'dataRead',
    category: 'data',
    code: dataRead,
  },
  arrays: {
    key: 'arrays',
    category: 'data',
    code: arrays,
  },

  // === SCREEN ===
  screen: {
    key: 'screen',
    category: 'screen',
    code: screen,
  },
  screenFill: {
    key: 'screenFill',
    category: 'screen',
    code: screenFill,
  },
  allChars: {
    key: 'allChars',
    category: 'screen',
    code: allChars,
  },
  bgItems: {
    key: 'bgItems',
    category: 'screen',
    code: bgItems,
  },
  bgView: {
    key: 'bgView',
    category: 'screen',
    bgKey: 'bgView',
    code: bgView,
  },
  bgViewTitle: {
    key: 'bgViewTitle',
    category: 'screen',
    bgKey: 'titleScreen',
    code: bgTitle,
  },
  bgViewPlatform: {
    key: 'bgViewPlatform',
    category: 'screen',
    bgKey: 'platformGame',
    code: bgPlatform,
  },
  cursorPosition: {
    key: 'cursorPosition',
    category: 'screen',
    code: cursorPosition,
  },
  screenRead: {
    key: 'screenRead',
    category: 'screen',
    code: screenRead,
  },
  printableArea: {
    key: 'printableArea',
    category: 'screen',
    bgKey: 'layerBox',
    code: printableArea,
  },

  // === SPRITES ===
  spriteBasic: {
    key: 'spriteBasic',
    category: 'sprites',
    code: spriteBasic,
  },
  spriteAnimation: {
    key: 'spriteAnimation',
    category: 'sprites',
    code: spriteAnimation,
  },
  spriteControl: {
    key: 'spriteControl',
    category: 'sprites',
    code: spriteControl,
  },
  spriteTableB: {
    key: 'spriteTableB',
    category: 'sprites',
    code: spriteTableB,
  },

  // === INTERACTIVE ===
  spriteInteractive: {
    key: 'spriteInteractive',
    category: 'interactive',
    code: spriteInteractive,
  },
  joystick: {
    key: 'joystick',
    category: 'interactive',
    code: joystick,
  },
  inkeyTest: {
    key: 'inkeyTest',
    category: 'interactive',
    code: inkeyTest,
  },
  inkeyBlockingTest: {
    key: 'inkeyBlockingTest',
    category: 'interactive',
    code: inkeyBlockingTest,
  },
  beepInteractive: {
    key: 'beepInteractive',
    category: 'interactive',
    code: beepInteractive,
  },

  // === COMPREHENSIVE (Full Demo Games) ===
  shooting: {
    key: 'shooting',
    category: 'comprehensive',
    code: shooting,
  },
  knight: {
    key: 'knight',
    category: 'comprehensive',
    bgKey: 'knight',
    code: knight,
  },
  superMemory: {
    key: 'superMemory',
    category: 'comprehensive',
    bgKey: 'superMemory',
    code: superMemory,
  },
  ufo: {
    key: 'ufo',
    category: 'comprehensive',
    bgKey: 'ufo',
    code: ufo,
  },
  route66: {
    key: 'route66',
    category: 'comprehensive',
    bgKey: 'route66',
    code: route66,
  },
  typeMaster: {
    key: 'typeMaster',
    category: 'comprehensive',
    bgKey: 'typeMaster',
    code: typeMaster,
  },
  turtle: {
    key: 'turtle',
    category: 'comprehensive',
    bgKey: 'turtle',
    code: turtle,
  },
  card: {
    key: 'card',
    category: 'comprehensive',
    bgKey: 'card',
    code: card,
  },
  scrSample: {
    key: 'scrSample',
    category: 'comprehensive',
    bgKey: 'scrSample',
    code: scrSample,
  },

  // === MUSIC ===
  musicPlayDemo: {
    key: 'musicPlayDemo',
    category: 'music',
    code: musicPlayDemo,
  },
  musicTwinkle: {
    key: 'musicTwinkle',
    category: 'music',
    code: musicTwinkle,
  },
  musicOdeToJoy: {
    key: 'musicOdeToJoy',
    category: 'music',
    code: musicOdeToJoy,
  },
  musicMaryHadALittleLamb: {
    key: 'musicMaryHadALittleLamb',
    category: 'music',
    code: musicMaryHadALittleLamb,
  },
  musicHappyBirthday: {
    key: 'musicHappyBirthday',
    category: 'music',
    code: musicHappyBirthday,
  },
  musicJingleBells: {
    key: 'musicJingleBells',
    category: 'music',
    code: musicJingleBells,
  },
  musicScale: {
    key: 'musicScale',
    category: 'music',
    code: musicScale,
  },
  musicArpeggio: {
    key: 'musicArpeggio',
    category: 'music',
    code: musicArpeggio,
  },
  musicThreeChannel: {
    key: 'musicThreeChannel',
    category: 'music',
    code: musicThreeChannel,
  },
  musicPlayer: {
    key: 'musicPlayer',
    category: 'music',
    code: musicPlayer,
  },
  musicLoopDemo: {
    key: 'musicLoopDemo',
    category: 'music',
    code: musicLoopDemo,
  },
  musicRocknRouge: {
    key: 'musicRocknRouge',
    category: 'music',
    code: musicRocknRouge,
  },
  musicBgplayDemo: {
    key: 'musicBgplayDemo',
    category: 'music',
    code: musicBgplayDemo,
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
