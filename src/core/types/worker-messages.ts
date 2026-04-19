/**
 * Service Worker message types for BASIC interpreter
 *
 * Defines all message contracts for communication between the main thread
 * and the Web Worker (interpreter).
 */

import type { SpriteState } from '@/core/sprite/types'
import type { InterpreterConfig } from '@/core/types/execution-types'
import type { ExecutionResult } from '@/core/types/execution-types'
import type { ScreenCell } from '@/core/types/execution-types'

// Base message interface for all service worker communication
export interface ServiceWorkerMessage {
  type: ServiceWorkerMessageType
  id: string
  timestamp: number
}

// Message types enum for better type safety
export type ServiceWorkerMessageType =
  | 'EXECUTE'
  | 'PING'
  | 'RESULT'
  | 'ERROR'
  | 'PROGRESS'
  | 'OUTPUT'
  | 'SCREEN_UPDATE'
  | 'SCREEN_CHANGED'
  | 'SPRITE_STATES'
  | 'STOP'
  | 'INIT'
  | 'READY'
  | 'STRIG_EVENT'
  | 'STICK_EVENT'
  | 'SET_SHARED_ANIMATION_BUFFER'
  | 'SET_SHARED_JOYSTICK_BUFFER'
  | 'SET_SHARED_KEYBOARD_BUFFER'
  | 'SET_BG_DATA'
  | 'REQUEST_INPUT'
  | 'INPUT_VALUE'
  | 'PLAY_SOUND'
  | 'PLAY_SOUND_COMPLETE'
  | 'CLEAR_DISPLAY'
  | 'REPL_EXECUTE'
  | 'REPL_RUN'
  | 'REPL_CLEAR'

// Execute message - sent from UI to service worker
export interface ExecuteMessage extends ServiceWorkerMessage {
  type: 'EXECUTE'
  data: {
    code: string
    config: InterpreterConfig
    options?: {
      timeout?: number
      enableProgress?: boolean
    }
  }
}

// Ping message - sent from UI to worker for health check (no BASIC execution, no user-visible output)
export interface PingMessage extends ServiceWorkerMessage {
  type: 'PING'
  data: Record<string, never>
}

// Result message - sent from service worker to UI
export interface ResultMessage extends ServiceWorkerMessage {
  type: 'RESULT'
  data: ExecutionResult & {
    executionId: string
    workerId?: string
  }
}

// Progress message - sent from service worker to UI during execution
export interface ProgressMessage extends ServiceWorkerMessage {
  type: 'PROGRESS'
  data: {
    executionId: string
    iterationCount: number
    currentStatement?: string
    progress: {
      completed: number
      total: number
      percentage: number
    }
    estimatedTimeRemaining?: number
  }
}

// Output message - sent from service worker to UI for real-time output
export interface OutputMessage extends ServiceWorkerMessage {
  type: 'OUTPUT'
  data: {
    executionId: string
    output: string
    outputType: 'print' | 'debug' | 'error'
    timestamp: number
  }
}

// Screen update message - sent from service worker to UI for screen updates
export interface ScreenUpdateMessage extends ServiceWorkerMessage {
  type: 'SCREEN_UPDATE'
  data: {
    executionId: string
    updateType:
      | 'character'
      | 'cursor'
      | 'clear'
      | 'full'
      | 'color'
      | 'palette'
      | 'cgen'
      | 'backdrop'
      | 'palette-combination'
    x?: number
    y?: number
    character?: string
    cursorX?: number
    cursorY?: number
    screenBuffer?: ScreenCell[][]
    colorUpdates?: Array<{ x: number; y: number; pattern: number }>
    bgPalette?: number
    spritePalette?: number
    paletteTarget?: 'B' | 'S'
    paletteIndex?: number
    paletteCombination?: number
    paletteColors?: [number, number, number, number]
    backdropColor?: number
    cgenMode?: number
    timestamp: number
  }
}

// Screen changed message - sent from worker to UI when shared screen buffer was updated (no payload)
export interface ScreenChangedMessage extends ServiceWorkerMessage {
  type: 'SCREEN_CHANGED'
  data?: {
    id?: string
    timestamp?: number
  }
}

// Sprite states message - sent from worker to UI when sprite states change (DEF SPRITE, SPRITE, SPRITE ON/OFF)
export interface SpriteStatesMessage extends ServiceWorkerMessage {
  type: 'SPRITE_STATES'
  data: {
    spriteStates: SpriteState[]
    spriteEnabled: boolean
  }
}

// Stop message - sent from UI to service worker
export interface StopMessage extends ServiceWorkerMessage {
  type: 'STOP'
  data: {
    executionId: string
    reason?: 'user_request' | 'timeout' | 'error'
  }
}

// Clear display message - sent from UI to worker when Clear button is clicked
export interface ClearDisplayMessage extends ServiceWorkerMessage {
  type: 'CLEAR_DISPLAY'
  data: Record<string, never>
}

// STRIG event message - sent from main thread to service worker
export interface StrigEventMessage extends ServiceWorkerMessage {
  type: 'STRIG_EVENT'
  data: {
    joystickId: number
    state: number
    timestamp: number
  }
}

// STICK event message - sent from main thread to service worker
export interface StickEventMessage extends ServiceWorkerMessage {
  type: 'STICK_EVENT'
  data: {
    joystickId: number
    state: number
    timestamp: number
  }
}

// Error message - sent from service worker to UI
export interface ErrorMessage extends ServiceWorkerMessage {
  type: 'ERROR'
  data: {
    executionId: string
    message: string
    stack?: string
    /** BASIC line number where the error occurred (1-based). */
    lineNumber?: number
    /** Source line text at the failing statement (for display). */
    sourceLine?: string
    errorType: 'execution' | 'timeout' | 'initialization' | 'communication'
    recoverable: boolean
  }
}

// Init message - sent from service worker to UI on startup
export interface InitMessage extends ServiceWorkerMessage {
  type: 'INIT'
  data: {
    workerId: string
    capabilities: string[]
    version: string
  }
}

// Ready message - sent from service worker to UI when ready
export interface ReadyMessage extends ServiceWorkerMessage {
  type: 'READY'
  data: {
    workerId: string
    status: 'ready' | 'busy' | 'error'
  }
}

// Set shared animation buffer - sent from main thread to worker once after worker is created
export interface SetSharedAnimationBufferMessage extends ServiceWorkerMessage {
  type: 'SET_SHARED_ANIMATION_BUFFER'
  data: {
    buffer: SharedArrayBuffer
  }
}

// Set shared joystick buffer - sent from main thread to worker once after worker is created
export interface SetSharedJoystickBufferMessage extends ServiceWorkerMessage {
  type: 'SET_SHARED_JOYSTICK_BUFFER'
  data: {
    buffer: SharedArrayBuffer
  }
}

// Set shared keyboard buffer - sent from main thread to worker for INKEY$ function
export interface SetSharedKeyboardBufferMessage extends ServiceWorkerMessage {
  type: 'SET_SHARED_KEYBOARD_BUFFER'
  data: {
    buffer: SharedArrayBuffer
  }
}

// Set BG data - sent from main thread to worker before execution (for VIEW command)
export interface SetBgDataMessage extends ServiceWorkerMessage {
  type: 'SET_BG_DATA'
  data: {
    /** BG grid data (28x21 grid of cells with charCode and colorPattern) */
    grid: Array<Array<{ charCode: number; colorPattern: number }>>
  }
}

// Request input - sent from worker to main when INPUT/LINPUT executes
export interface RequestInputMessage extends ServiceWorkerMessage {
  type: 'REQUEST_INPUT'
  data: {
    requestId: string
    executionId: string
    prompt: string
    variableCount: number
    isLinput: boolean
  }
}

// Input value - sent from main to worker to resolve a REQUEST_INPUT
export interface InputValueMessage extends ServiceWorkerMessage {
  type: 'INPUT_VALUE'
  data: {
    requestId: string
    values: string[]
    cancelled: boolean
  }
}

// Play sound - sent from worker to main to play PLAY command sound
export interface PlaySoundMessage extends ServiceWorkerMessage {
  type: 'PLAY_SOUND'
  data: {
    executionId: string
    musicString: string
    playId: string
    events: Array<{
      frequency?: number
      duration: number
      channel: number
      duty: number
      envelope: number
      volumeOrLength: number
    }>
  }
}

// Play sound complete - sent from main to worker when PLAY audio finishes
export interface PlaySoundCompleteMessage extends ServiceWorkerMessage {
  type: 'PLAY_SOUND_COMPLETE'
  data: {
    executionId: string
    playId: string
  }
}

// REPL execute - sent from UI to worker to execute a single statement
export interface ReplExecuteMessage extends ServiceWorkerMessage {
  type: 'REPL_EXECUTE'
  data: {
    statement: string
  }
}

// REPL run - sent from UI to worker to re-execute the stored program
export interface ReplRunMessage extends ServiceWorkerMessage {
  type: 'REPL_RUN'
  data: Record<string, never>
}

// REPL clear - sent from UI to worker to clear screen without terminating interpreter
export interface ReplClearMessage extends ServiceWorkerMessage {
  type: 'REPL_CLEAR'
  data: Record<string, never>
}

// Union type for all possible messages
export type AnyServiceWorkerMessage =
  | ClearDisplayMessage
  | ExecuteMessage
  | PingMessage
  | ResultMessage
  | ProgressMessage
  | OutputMessage
  | ScreenUpdateMessage
  | ScreenChangedMessage
  | SpriteStatesMessage
  | StopMessage
  | StrigEventMessage
  | StickEventMessage
  | ErrorMessage
  | InitMessage
  | ReadyMessage
  | SetSharedAnimationBufferMessage
  | SetSharedJoystickBufferMessage
  | SetSharedKeyboardBufferMessage
  | SetBgDataMessage
  | RequestInputMessage
  | InputValueMessage
  | PlaySoundMessage
  | PlaySoundCompleteMessage
  | ReplExecuteMessage
  | ReplRunMessage
  | ReplClearMessage

// Message handler interface for type-safe message handling
export interface ServiceWorkerMessageHandler {
  handleExecute(message: ExecuteMessage): Promise<void>
  handleResult(message: ResultMessage): void
  handleProgress(message: ProgressMessage): void
  handleOutput(message: OutputMessage): void
  handleStop(message: StopMessage): void
  handleError(message: ErrorMessage): void
  handleInit(message: InitMessage): void
  handleReady(message: ReadyMessage): void
}
