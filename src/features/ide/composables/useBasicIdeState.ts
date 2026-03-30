/**
 * Centralized reactive state for the BASIC IDE.
 * Single source of refs used by screen integration, worker, execution, and editor.
 */

import { type Ref, ref, shallowRef } from 'vue'

import type { SpriteState } from '@/core/sprite/types'
import type { ScreenCell } from '@/core/types/execution-types'
import type { BasicVariable } from '@/core/types/state-types'
import type { RequestInputMessage } from '@/core/types/worker-messages'

import type { PendingSpriteAction } from './useBasicIdeMessageHandlers'
import { initializeScreenBuffer } from './useBasicIdeScreenUtils'

/** Input mode for controlling keyboard vs joystick input */
export type InputMode = 'joystick' | 'keyboard'

const DEFAULT_CODE = `10 PRINT "Hello World!"
20 PRINT "Family Basic IDE Demo"
30 PRINT "Program completed!"
40 FOR I=1 TO 3: PRINT "I="; I: NEXT
50 END`

type ErrorEntry = { line: number; message: string; type: string; stack?: string; sourceLine?: string }

/** All IDE state refs; used by other composables. */
export interface BasicIdeState {
  code: Ref<string>
  currentSampleType: Ref<string | null>
  highlightedCode: Ref<string>
  isRunning: Ref<boolean>
  output: Ref<string[]>
  errors: Ref<ErrorEntry[]>
  variables: Ref<Record<string, BasicVariable>>
  debugOutput: Ref<string>
  debugMode: Ref<boolean>
  screenBuffer: Ref<ScreenCell[][]>
  cursorX: Ref<number>
  cursorY: Ref<number>
  bgPalette: Ref<number>
  backdropColor: Ref<number>
  spritePalette: Ref<number>
  cgenMode: Ref<number>
  spriteStates: Ref<SpriteState[]>
  spriteEnabled: Ref<boolean>
  /** Current sprite positions read from shared buffer (for inspector MOVE tab). */
  movementPositionsFromBuffer: Ref<Map<number, { x: number; y: number }>>
  frontSpriteNodes: Ref<Map<number, unknown>>
  backSpriteNodes: Ref<Map<number, unknown>>
  spriteActionQueues: Ref<Map<number, PendingSpriteAction[]>>
  pendingInputRequest: Ref<RequestInputMessage['data'] | null>
  /** Input mode: 'joystick' uses keyboard for joystick controls, 'keyboard' uses keyboard for INKEY$ */
  inputMode: Ref<InputMode>
}

/**
 * Create and return all IDE state refs.
 */
export function useBasicIdeState(): BasicIdeState {
  return {
    code: ref(DEFAULT_CODE),
    currentSampleType: ref<string | null>(null),
    highlightedCode: ref(''),

    isRunning: shallowRef(false),
    output: ref<string[]>([]),
    errors: ref<
      Array<{ line: number; message: string; type: string; stack?: string; sourceLine?: string }>
    >([]),
    variables: ref<Record<string, BasicVariable>>({}),
    debugOutput: ref<string>(''),
    debugMode: shallowRef(false),

    screenBuffer: ref(initializeScreenBuffer()),
    cursorX: shallowRef(0),
    cursorY: shallowRef(0),
    bgPalette: shallowRef(1),
    backdropColor: shallowRef(0),
    spritePalette: shallowRef(1),
    cgenMode: shallowRef(2),

    spriteStates: ref<SpriteState[]>([]),
    spriteEnabled: shallowRef(false),
    // movementStates removed - read from shared buffer instead
    movementPositionsFromBuffer: ref<Map<number, { x: number; y: number }>>(new Map()),
    frontSpriteNodes: ref<Map<number, unknown>>(new Map()),
    backSpriteNodes: ref<Map<number, unknown>>(new Map()),
    spriteActionQueues: ref<Map<number, PendingSpriteAction[]>>(new Map()),

    pendingInputRequest: ref<RequestInputMessage['data'] | null>(null),

    // Input mode: 'joystick' (default) or 'keyboard' (for INKEY$)
    inputMode: ref<InputMode>('joystick'),
  }
}
