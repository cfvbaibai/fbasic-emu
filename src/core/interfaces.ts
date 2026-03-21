/**
 * Core interfaces for the Family Basic Interpreter
 */

import type { ERROR_TYPES, VARIABLE_TYPES } from './constants'
import type { CompiledAudio } from './sound/types'
import type { SpriteState } from './sprite/types'
import type { ExecutionContext } from './state/ExecutionContext'
import type { BasicArrayValue } from './types/BasicTypes'

/**
 * Represents a BASIC variable with its value and type
 */
export interface BasicVariable {
  value: number | string
  type: (typeof VARIABLE_TYPES)[keyof typeof VARIABLE_TYPES]
}

/**
 * Represents a BASIC error with line number, message, and type
 */
export interface BasicError {
  line: number
  message: string
  type: (typeof ERROR_TYPES)[keyof typeof ERROR_TYPES]
  /** Machine-readable error code for behavior-specific handling (e.g. worker fallback). */
  code?: 'UNSUPPORTED_FEATURE'
  /** Stack trace for runtime errors (worker or interpreter catch). */
  stack?: string
  /** Source line text at the failing statement. */
  sourceLine?: string
}

/**
 * Represents a parsed BASIC statement
 */
export interface BasicStatement {
  lineNumber: number
  command: string
  args: string[]
}

/**
 * Represents the state of a FOR loop
 */
export interface LoopState {
  variable: string
  start: number
  end: number
  step: number
  forLine: number
  bodyStartLine: number
  nextLine: number
}

/**
 * Basic Device Adapter interface for Family BASIC interpreter
 *
 * Handles all input/output/debugging/audio features needed for Family BASIC
 */
export interface BasicDeviceAdapter {
  // === JOYSTICK INPUT ===
  getJoystickCount(): number
  getStickState(joystickId: number): number
  setStickState(joystickId: number, state: number): void
  pushStrigState(joystickId: number, state: number): void
  consumeStrigState(joystickId: number): number

  // === KEYBOARD INPUT (INKEY$) ===
  /**
   * Get current keyboard state for INKEY$ function.
   * Returns the currently pressed key character, or empty string if no key pressed.
   * This is a polling (non-consuming) read - the key remains "pressed" until released.
   */
  getInkeyState(): string
  /**
   * Set keyboard state (main thread only).
   * Used to update the current key state when keyboard events occur.
   */
  setInkeyState?(keyChar: string): void
  /**
   * Clear keyboard state (main thread only).
   * Called when key is released.
   */
  clearInkeyState?(): void
  /**
   * Set shared keyboard buffer (worker only).
   * Called when receiving SET_SHARED_KEYBOARD_BUFFER message.
   */
  setSharedKeyboardBuffer?(buffer: SharedArrayBuffer): void
  /**
   * Wait for a key press (blocking mode for INKEY$(0)).
   * Blocks execution until a key is pressed, then returns the character.
   * @returns Promise resolving to the pressed character string
   */
  waitForInkey?(): Promise<string>
  /**
   * Wait for a key press synchronously (blocking mode for INKEY$(0)).
   * Uses Atomics.wait() to block the worker until a key is pressed.
   * @returns The pressed character string, or empty string if timeout/stop
   */
  waitForInkeyBlocking?(): string

  // === SPRITE POSITION QUERY ===
  getSpritePosition(actionNumber: number): { x: number; y: number } | null
  /** Store position for sprite (called when POSITION runs); used so MOVE uses it when no prior START_MOVEMENT. */
  setSpritePosition?(actionNumber: number, x: number, y: number): void
  /** Clear stored position for sprite (e.g. after START_MOVEMENT so next MOVE uses buffer/default). */
  clearSpritePosition?(actionNumber: number): void

  // === SPRITE STATE NOTIFICATION ===
  /**
   * Send sprite states to main thread for rendering.
   * Called by executors when sprite states change (DEF SPRITE, SPRITE, SPRITE ON/OFF).
   * @param spriteStates - Array of all sprite states
   * @param spriteEnabled - Whether sprite display is enabled
   */
  sendSpriteStates?(spriteStates: SpriteState[], spriteEnabled: boolean): void

  // === TEXT OUTPUT ===
  printOutput(output: string): void
  debugOutput(output: string): void
  errorOutput(output: string): void
  clearScreen(): void
  setCursorPosition(x: number, y: number): void
  getCursorPosition(): { x: number; y: number }
  getScreenCell(x: number, y: number, colorSwitch?: number): string | number
  setColorPattern(x: number, y: number, pattern: number): void
  setColorPalette(bgPalette: number, spritePalette: number): void
  setPaletteCombination?(
    target: 'B' | 'S',
    combination: number,
    c1: number,
    c2: number,
    c3: number,
    c4: number
  ): void
  setBackdropColor(colorCode: number): void
  setCharacterGeneratorMode(mode: number): void
  getCharacterGeneratorMode(): number

  // === KEYBOARD INPUT (INPUT / LINPUT) ===
  /**
   * Request user input from the IDE. Blocks until main thread sends INPUT_VALUE or execution is stopped.
   * @param prompt - Prompt string to show (e.g. "A=" or "?").
   * @param options - variableCount for INPUT (number of variables), or isLinput: true for LINPUT (single string).
   * @returns Promise resolving to entered values (one per variable for INPUT, single-element for LINPUT).
   *   Rejects if cancelled (e.g. user Stop).
   */
  requestInput?(
    prompt: string,
    options?: { variableCount?: number; isLinput?: boolean }
  ): Promise<string[]>

  // === SOUND OUTPUT ===
  /**
   * Play compiled audio
   * @param audio - Compiled audio with calculated frequencies and durations
   */
  playSound?(audio: CompiledAudio): void

  /**
   * Play a beep sound (BEEP statement)
   * Produces a short beep tone using Web Audio API
   */
  beep?(): void

  // === BG GRAPHIC (VIEW command) ===
  /**
   * Copy BG GRAPHIC data to the background screen.
   * Called by VIEW command to display the BG Editor content on screen.
   * Per F-BASIC Manual page 36: "Upon executing the VIEW command,
   * the BG GRAPHIC Screen will be copied to the Background Screen."
   */
  copyBgGraphicToBackground?(): void
}

/**
 * Configuration for the BASIC interpreter
 */
export interface InterpreterConfig {
  maxIterations: number
  maxOutputLines: number
  enableDebugMode: boolean
  strictMode: boolean
  deviceAdapter?: BasicDeviceAdapter
  /** Shared animation state buffer (positions + isActive). Used by worker for XPOS/YPOS and MOVE(n). */
  sharedAnimationBuffer?: SharedArrayBuffer
  /** Shared display state buffer (screen + sprites + cursor + scalars). Used for integration testing. */
  sharedDisplayBuffer?: SharedArrayBuffer
  /** Suppress "OK" prompt when program ends successfully (default: false for F-BASIC compatibility) */
  suppressOkPrompt?: boolean
}

/**
 * Result of code execution
 */
export interface ExecutionResult {
  success: boolean
  errors: BasicError[]
  variables: Map<string, BasicVariable>
  arrays?: Map<string, BasicArrayValue> // Arrays declared/used during execution
  executionTime: number
  spriteStates?: SpriteState[] // Sprite states from DEF SPRITE and SPRITE commands
  spriteEnabled?: boolean // Whether sprite display is enabled (SPRITE ON/OFF)
  // movementStates removed - read from shared buffer instead
}

/**
 * Interface for command handlers
 */
export interface CommandHandler {
  execute(_statement: BasicStatement, _context: ExecutionContext): Promise<void>
  validate(_statement: BasicStatement): BasicError[]
}

/**
 * Interface for expression evaluators
 */
export interface ExpressionEvaluator {
  evaluate(_expression: string, _context: ExecutionContext): number | string
  validate(_expression: string): BasicError[]
}

/**
 * Interface for code parsers
 */
export interface CodeParser {
  parse(_code: string): BasicStatement[]
  validate(_statements: BasicStatement[]): BasicError[]
}

/**
 * Interface for syntax highlighters
 */
export interface SyntaxHighlighter {
  highlight(_code: string): string
  getKeywords(): Array<{ word: string; type: string; color: string }>
}

/**
 * Interface for parser information
 */
export interface ParserInfo {
  name: string
  version: string
  capabilities: string[]
  features: string[]
  /**
   * Interpreter-facing statement surface exposed to IDE capabilities.
   * Keep aligned with routed/executable command support.
   */
  supportedStatements: string[]
  /**
   * Function call surface exposed to IDE capabilities.
   * Keep aligned with FunctionEvaluator support.
   */
  supportedFunctions: string[]
  supportedOperators: string[]
}

/**
 * Interface for syntax highlighter information
 */
export interface HighlighterInfo {
  name: string
  version: string
  features: string[]
}

/**
 * Interface for error reporters
 */
export interface ErrorReporter {
  report(_error: BasicError): void
  getErrors(): BasicError[]
  clearErrors(): void
}

/**
 * Interface for output managers
 */
export interface OutputManager {
  write(_text: string): void
  writeln(_text?: string): void
  getOutput(): string
  clear(): void
}

/**
 * Service Worker message types for BASIC interpreter
 */

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
  | 'CLEAR_DISPLAY'

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

// Screen cell interface for screen buffer
export interface ScreenCell {
  character: string
  colorPattern: number
  x: number
  y: number
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

// ============================================================================
// Program Management Types
// ============================================================================

/**
 * Compressed BG grid data format
 * Uses hybrid compression: sparse for <30% fill, RLE for >=30%
 */
export interface CompactBg {
  /** Compression format version */
  format: 'sparse1' | 'rle1'
  /** Compressed data string */
  data: string
  /** Grid width (always 28) */
  width: 28
  /** Grid height (always 21) */
  height: 21
}

/**
 * Program data structure for save/load
 * Contains BASIC source code and associated BG graphic
 */
export interface ProgramData {
  /** Schema version for future migrations */
  version: 1
  /** Unique program identifier (UUID) */
  id: string
  /** User-visible program name */
  name: string
  /** BASIC source code */
  code: string
  /** Compressed BG graphic data */
  bg: CompactBg
  /** Creation timestamp (ms since epoch) */
  createdAt: number
  /** Last update timestamp (ms since epoch) */
  updatedAt: number
}

/**
 * Export file format for saving programs to disk
 */
export interface ProgramExportFile {
  /** File format identifier */
  format: 'family-basic-program'
  /** File format version */
  version: 1
  /** Program data */
  program: ProgramData
}
