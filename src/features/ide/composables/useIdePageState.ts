/**
 * useIdePageState composable
 *
 * Aggregates all IDE state from useBasicIdeEnhanced, with E2E Lite fallbacks.
 * When running in E2E Lite mode (URL param ?e2e=lite), provides stub refs
 * so the IDE page can render without a full parser/worker stack.
 * Also provides screen context and exposes the DEV API.
 */

import { type Ref, ref, type ShallowRef, shallowRef } from 'vue'

import type { SharedDisplayViews } from '@/core/animation/sharedDisplayBuffer'
import type { DecodedScreenState, SharedDisplayBufferAccessor } from '@/core/animation/sharedDisplayBufferAccessor'
import { PALETTE_DEFAULTS } from '@/core/constants'
import type { KeyboardBufferView } from '@/core/devices'
import {
  createSharedKeyboardBuffer,
  createViewsFromKeyboardBuffer,
} from '@/core/devices'
import type { SpriteState } from '@/core/sprite/types'
import type { HighlighterInfo, ParserInfo, ScreenCell } from '@/core/types/execution-types'
import type { BasicVariable } from '@/core/types/state-types'
import type { RequestInputMessage } from '@/core/types/worker-messages'

import { useBasicIde as useBasicIdeEnhanced } from './useBasicIdeEnhanced'
import type { InputMode } from './useBasicIdeState'
import { useDevApi } from './useDevApi'
import { provideScreenContext } from './useScreenContext'
import { useShareRoute } from './useShareRoute'

export interface IdePageState {
  // Code & execution
  code: Ref<string>
  isRunning: Ref<boolean>
  output: Ref<string[]>
  errors: Ref<Array<{ line: number; message: string; type: string; stack?: string; sourceLine?: string }>>
  variables: Ref<Record<string, BasicVariable>>
  debugOutput: Ref<string>
  debugMode: Ref<boolean>

  // Screen state
  screenBuffer: Ref<ScreenCell[][]>
  cursorX: Ref<number>
  cursorY: Ref<number>
  bgPalette: Ref<number>
  backdropColor: Ref<number>
  spritePalette: Ref<number>
  cgenMode: Ref<number>
  spriteStates: Ref<SpriteState[]>
  spriteEnabled: Ref<boolean>
  movementPositionsFromBuffer: Ref<Map<number, { x: number; y: number }>>
  frontSpriteNodes: Ref<Map<number, unknown>>
  backSpriteNodes: Ref<Map<number, unknown>>
  inputMode: Ref<InputMode>

  // Methods
  runCode: () => Promise<void>
  stopCode: () => void
  clearOutput: () => void
  loadSampleCode: (sampleType: string, displayName: string) => boolean
  getParserCapabilities: () => ParserInfo
  getHighlighterCapabilities: () => HighlighterInfo
  toggleDebugMode: () => void
  sendStrigEvent: (joystickId: number, state: number) => void
  setDecodedScreenState: (decoded: DecodedScreenState) => void
  pendingInputRequest: Ref<RequestInputMessage['data'] | null>
  respondToInputRequest: (requestId: string, values: string[], cancelled: boolean) => void

  // Shared buffers
  sharedDisplayBufferAccessor: SharedDisplayBufferAccessor
  sharedAnimationBuffer: SharedArrayBuffer
  sharedDisplayViews: SharedDisplayViews
  sharedJoystickBuffer: SharedArrayBuffer
  sharedKeyboardBufferView: KeyboardBufferView
  registerCallbacks: {
    registerScheduleRender: (fn: () => void) => void
    registerInvalidateBackgroundBuffer: (fn: () => void) => void
  }

  // E2E mode flag
  isE2ELite: boolean

  // Parser info (for editor display)
  parserInfo: ShallowRef<ParserInfo | null>
  highlighterInfo: ShallowRef<HighlighterInfo | null>

  // Share route
  shareError: Ref<string>
  handleShareRoute: () => Promise<void>
}

/**
 * Create aggregated IDE page state with E2E Lite fallbacks.
 *
 * @param bottomAreaRef - Template ref to IdeBottomArea for inspector MOVE tab callback
 */
export function useIdePageState(
  bottomAreaRef: ShallowRef<{ updateMoveSlotsData: () => void } | null>
): IdePageState {
  const isE2ELite =
    typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('e2e') === 'lite'

  const basicIde = isE2ELite ? null : useBasicIdeEnhanced()

  // Share route handling
  const code = basicIde?.code ?? ref('')
  const { shareError, handleShareRoute } = useShareRoute({ code })

  const isRunning = basicIde?.isRunning ?? ref(false)
  const output = basicIde?.output ?? ref<string[]>([])
  const errors =
    basicIde?.errors ??
    ref<Array<{ line: number; message: string; type: string; stack?: string; sourceLine?: string }>>([])
  const variables = basicIde?.variables ?? ref<Record<string, BasicVariable>>({})
  const debugOutput = basicIde?.debugOutput ?? ref('')
  const debugMode = basicIde?.debugMode ?? ref(false)
  const screenBuffer = basicIde?.screenBuffer ?? ref<ScreenCell[][]>([])
  const cursorX = basicIde?.cursorX ?? ref(0)
  const cursorY = basicIde?.cursorY ?? ref(0)
  const bgPalette = basicIde?.bgPalette ?? ref(PALETTE_DEFAULTS.BG_PALETTE)
  const backdropColor = basicIde?.backdropColor ?? ref(PALETTE_DEFAULTS.BACKDROP_COLOR)
  const spritePalette = basicIde?.spritePalette ?? ref(PALETTE_DEFAULTS.SPRITE_PALETTE)
  const cgenMode = basicIde?.cgenMode ?? ref(PALETTE_DEFAULTS.CGEN_MODE)
  const spriteStates = basicIde?.spriteStates ?? ref<SpriteState[]>([])
  const spriteEnabled = basicIde?.spriteEnabled ?? ref(true)
  const movementPositionsFromBuffer =
    basicIde?.movementPositionsFromBuffer ?? ref<Map<number, { x: number; y: number }>>(new Map())
  const frontSpriteNodes = basicIde?.frontSpriteNodes ?? ref<Map<number, unknown>>(new Map())
  const backSpriteNodes = basicIde?.backSpriteNodes ?? ref<Map<number, unknown>>(new Map())
  const inputMode = basicIde?.inputMode ?? ref<InputMode>('joystick')

  const runCode =
    basicIde?.runCode ??
    (async () => {
      isRunning.value = true
    })
  const stopCode =
    basicIde?.stopCode ??
    (() => {
      isRunning.value = false
    })
  const clearOutput =
    basicIde?.clearOutput ??
    (() => {
      output.value = []
      errors.value = []
      variables.value = {}
      debugOutput.value = ''
    })
  const loadSampleCode = basicIde?.loadSampleCode ?? (() => false)
  const getParserCapabilities =
    basicIde?.getParserCapabilities ??
    (() => ({
      name: 'E2E Lite Parser',
      version: '0.0.0',
      capabilities: [],
      features: [],
      supportedStatements: [],
      supportedFunctions: [],
      supportedOperators: [],
    }))
  const getHighlighterCapabilities =
    basicIde?.getHighlighterCapabilities ??
    (() => ({
      name: 'E2E Lite Highlighter',
      version: '0.0.0',
      features: [],
    }))
  const toggleDebugMode =
    basicIde?.toggleDebugMode ??
    (() => {
      debugMode.value = !debugMode.value
    })
  const sendStrigEvent = basicIde?.sendStrigEvent ?? ((_joystickId: number, _state: number) => {})
  const sharedDisplayBufferAccessor =
    basicIde?.sharedDisplayBufferAccessor ?? ({} as SharedDisplayBufferAccessor)
  const sharedAnimationBuffer = basicIde?.sharedAnimationBuffer ?? ({} as SharedArrayBuffer)
  const sharedDisplayViews: SharedDisplayViews = basicIde?.sharedDisplayViews ?? {
    buffer: {} as SharedArrayBuffer,
    spriteView: {} as Float64Array,
    charView: {} as Uint8Array,
    patternView: {} as Uint8Array,
    cursorView: {} as Uint8Array,
    sequenceView: {} as Int32Array,
    scalarsView: {} as Uint8Array,
    animationSyncView: {} as Float64Array,
  }
  const sharedJoystickBuffer = basicIde?.sharedJoystickBuffer ?? ({} as SharedArrayBuffer)
  const sharedKeyboardBufferView: KeyboardBufferView =
    basicIde?.sharedKeyboardBufferView ?? createViewsFromKeyboardBuffer(createSharedKeyboardBuffer())
  const setDecodedScreenState = basicIde?.setDecodedScreenState ?? ((_decoded: DecodedScreenState) => {})
  const registerCallbacks = basicIde?.registerCallbacks ?? {
    registerScheduleRender: () => {},
    registerInvalidateBackgroundBuffer: () => {},
  }
  const pendingInputRequest = basicIde?.pendingInputRequest ?? ref<RequestInputMessage['data'] | null>(null)
  const respondToInputRequest =
    basicIde?.respondToInputRequest ?? ((_requestId: string, _values: string[], _cancelled: boolean) => {})

  // Expose DEV-only global API for headless test code injection
  useDevApi({
    code,
    runCode,
    stopCode,
    pendingInputRequest,
    respondToInputRequest,
    screenBuffer,
  })

  // Provide screen context so ScreenTab/Screen can inject instead of prop drilling
  const hasAllBuffers = sharedDisplayViews && sharedDisplayBufferAccessor
    && sharedAnimationBuffer && sharedJoystickBuffer
  if (!isE2ELite && hasAllBuffers) {
    provideScreenContext({
      screenBuffer,
      cursorX,
      cursorY,
      bgPalette,
      backdropColor,
      spritePalette,
      cgenMode,
      spriteStates,
      spriteEnabled,
      movementPositionsFromBuffer,
      externalFrontSpriteNodes: frontSpriteNodes,
      externalBackSpriteNodes: backSpriteNodes,
      sharedDisplayViews: ref(sharedDisplayViews),
      sharedDisplayBufferAccessor,
      sharedAnimationBuffer: ref(sharedAnimationBuffer),
      sharedJoystickBuffer: ref(sharedJoystickBuffer),
      setDecodedScreenState,
      registerCallbacks,
      // Callback for animation loop to update inspector MOVE tab data
      updateInspectorMoveSlots: () => bottomAreaRef.value?.updateMoveSlotsData(),
    })
  }

  // Parser capabilities for display
  const parserInfo = shallowRef<ParserInfo | null>(null)
  const highlighterInfo = shallowRef<HighlighterInfo | null>(null)

  return {
    code,
    isRunning,
    output,
    errors,
    variables,
    debugOutput,
    debugMode,
    screenBuffer,
    cursorX,
    cursorY,
    bgPalette,
    backdropColor,
    spritePalette,
    cgenMode,
    spriteStates,
    spriteEnabled,
    movementPositionsFromBuffer,
    frontSpriteNodes,
    backSpriteNodes,
    inputMode,
    runCode,
    stopCode,
    clearOutput,
    loadSampleCode,
    getParserCapabilities,
    getHighlighterCapabilities,
    toggleDebugMode,
    sendStrigEvent,
    setDecodedScreenState,
    pendingInputRequest,
    respondToInputRequest,
    sharedDisplayBufferAccessor,
    sharedAnimationBuffer,
    sharedDisplayViews,
    sharedJoystickBuffer,
    sharedKeyboardBufferView,
    registerCallbacks,
    isE2ELite,
    parserInfo,
    highlighterInfo,
    shareError,
    handleShareRoute,
  }
}
