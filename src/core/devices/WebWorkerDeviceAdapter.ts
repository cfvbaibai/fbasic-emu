/**
 * Web Worker Device Adapter
 *
 * A comprehensive device adapter that handles both device operations and web worker management.
 * Delegates screen operations to DeviceScreenManager and other concerns to specialized modules.
 */

import type { SharedDisplayBufferAccessor } from '@/core/animation/sharedDisplayBufferAccessor'
import type { CompiledAudio } from '@/core/sound/types'
import type { SpriteState } from '@/core/sprite/types'
import type { BasicDeviceAdapter } from '@/core/types/device-types'
import type { ExecutionResult, InterpreterConfig } from '@/core/types/execution-types'
import type { AnyServiceWorkerMessage, InputValueMessage, PlaySoundCompleteMessage } from '@/core/types/worker-messages'
import type { BgGridData } from '@/features/bg-editor/types'
import { logWorker } from '@/shared/logger'

import {
  consumeStrigEvent,
  createStickTypematicState,
  getInkeyState,
  getStickStateWithTypematic,
  pushStrigEvent,
  resetStickTypematicState,
  type StickTypematicState,
  waitForInkeyBlocking,
} from './DeviceInputHelpers'
import {
  createInputRequest,
  handleInputValueMessage as handleInputValue,
  rejectAllInputRequests as rejectAllInput,
} from './DeviceInputRequestHelpers'
import { postBeep, postPlaySound, postPlaySoundBackground } from './DeviceOutputHelpers'
import {
  createPlayCompleteRequest,
  handlePlaySoundCompleteMessage as handlePlayComplete,
  rejectAllPlayCompleteRequests as rejectAllPlayComplete,
} from './DevicePlayCompleteHelpers'
import { DeviceScreenManager } from './DeviceScreenManager'
import {
  getSpritePosition as getSpritePositionFromHelper,
  postSpriteStates,
  type SpritePositionCache,
} from './DeviceSpritePositionHelpers'
import { MessageHandler } from './MessageHandler'
import {
  createViewsFromJoystickBuffer,
  type JoystickBufferView,
} from './sharedJoystickBuffer'
import {
  createViewsFromKeyboardBuffer,
  type KeyboardBufferView,
} from './sharedKeyboardBuffer'
import { type WebWorkerExecutionOptions, WebWorkerManager } from './WebWorkerManager'

export type { WebWorkerExecutionOptions }

export class WebWorkerDeviceAdapter implements BasicDeviceAdapter {
  // === DEVICE STATE ===
  private strigClickBuffer: Map<number, number[]> = new Map()
  /** Shared joystick buffer view. Set when receiving SET_SHARED_JOYSTICK_BUFFER. */
  private sharedJoystickView: JoystickBufferView | null = null
  /** Shared keyboard buffer view for INKEY$. Set when receiving SET_SHARED_KEYBOARD_BUFFER. */
  private sharedKeyboardView: KeyboardBufferView | null = null
  /** Last POSITION per sprite; getSpritePosition returns it so MOVE uses it (not buffer 0,0). */
  private lastPositionBySprite: SpritePositionCache = new Map()
  private isEnabled = true
  // === STICK REPEAT CONTROL (typematic-style) ===
  private stickTypematicState: StickTypematicState = createStickTypematicState()
  // === MANAGERS ===
  private webWorkerManager: WebWorkerManager
  private readonly screenManager: DeviceScreenManager
  private messageHandler: MessageHandler
  // === INPUT REQUEST (worker only: INPUT/LINPUT) ===
  private pendingInputRequests: Map<
    string,
    { resolve: (values: string[]) => void; reject: (err: Error) => void }
  > = new Map()
  // === PLAY COMPLETE (worker only: sync PLAY) ===
  private pendingPlayComplete: Map<string, { resolve: () => void; reject: (err: Error) => void }> = new Map()

  constructor() {
    this.webWorkerManager = new WebWorkerManager()
    this.screenManager = new DeviceScreenManager()
    this.messageHandler = new MessageHandler(this.webWorkerManager.getPendingMessages())
    this.setupMessageListener()
  }

  // === WEB WORKER MANAGEMENT METHODS ===

  /** Check if web workers are supported */
  static isSupported(): boolean {
    return WebWorkerManager.isSupported()
  }
  /** Check if we're currently running in a web worker context */
  static isInWebWorker(): boolean {
    return WebWorkerManager.isInWebWorker()
  }
  /** Initialize the web worker */
  async initialize(workerScript?: string): Promise<void> {
    await this.webWorkerManager.initialize(workerScript)
    this.setupMessageListener()
  }
  /** Execute BASIC code in the web worker */
  async executeInWorker(
    code: string,
    config: InterpreterConfig,
    options: WebWorkerExecutionOptions = {}
  ): Promise<ExecutionResult> {
    return this.webWorkerManager.executeInWorker(code, config, options, message => {
      this.handleWorkerMessage(message)
    })
  }

  /** Stop execution in the web worker */
  stopExecution(): void {
    this.webWorkerManager.stopExecution()
    resetStickTypematicState(this.stickTypematicState)
  }
  /** Send a STRIG event to the web worker */
  sendStrigEvent(joystickId: number, state: number): void {
    const worker = this.webWorkerManager.getWorker()
    if (!worker) {
      logWorker.debug('No worker available for STRIG event')
      return
    }
    const message = {
      type: 'STRIG_EVENT',
      id: `strig-${Date.now()}`,
      timestamp: Date.now(),
      data: { joystickId, state, timestamp: Date.now() },
    }
    logWorker.debug('Sending STRIG event to web worker:', { joystickId, state, messageId: message.id })
    worker.postMessage(message)
  }

  /** Send a message to the web worker */
  sendMessage(message: AnyServiceWorkerMessage): void {
    this.webWorkerManager.sendMessage(message)
  }
  /** Terminate the web worker */
  terminate(): void {
    this.webWorkerManager.terminate()
    this.messageHandler.rejectAllPending('Web worker terminated')
    resetStickTypematicState(this.stickTypematicState)
  }

  // === DEVICE ADAPTER METHODS ===
  /** Enable or disable the device adapter */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled
    if (!enabled) resetStickTypematicState(this.stickTypematicState)
  }

  // === JOYSTICK INPUT METHODS ===
  getJoystickCount(): number {
    return 2
  }

  /** Get stick state with typematic-style repeat control. */
  getStickState(_joystickId: number): number {
    if (!this.sharedJoystickView) {
      throw new Error(
        'Shared joystick buffer not set. Worker must receive SET_SHARED_JOYSTICK_BUFFER message before reading joystick state.'
      )
    }
    return getStickStateWithTypematic(this.sharedJoystickView, this.stickTypematicState)
  }

  /** Set stick state (deprecated). */
  setStickState(_joystickId: number, _state: number): void {
    throw new Error(
      'setStickState() is deprecated. Main thread writes directly to shared joystick buffer. This method is no longer supported.'
    )
  }

  /** Set shared joystick buffer (called from worker when receiving SET_SHARED_JOYSTICK_BUFFER). */
  setSharedJoystickBuffer(buffer: SharedArrayBuffer): void {
    this.sharedJoystickView = createViewsFromJoystickBuffer(buffer)
    resetStickTypematicState(this.stickTypematicState)
  }

  // === KEYBOARD INPUT (INKEY$) ===

  /** Get current keyboard state for INKEY$. */
  getInkeyState(): string {
    return getInkeyState(this.sharedKeyboardView)
  }

  /** Set shared keyboard buffer. */
  setSharedKeyboardBuffer(buffer: SharedArrayBuffer): void {
    this.sharedKeyboardView = createViewsFromKeyboardBuffer(buffer)
  }

  /** Wait for a key press (blocking mode for INKEY$(0)). */
  async waitForInkey(): Promise<string> {
    const POLL_INTERVAL_MS = 16
    while (this.isEnabled) {
      const keyChar = this.getInkeyState()
      if (keyChar) return keyChar
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS))
    }
    return ''
  }

  /** Wait for a key press synchronously using Atomics.wait. */
  waitForInkeyBlocking(): string {
    return waitForInkeyBlocking(this.sharedKeyboardView, () => this.isEnabled)
  }

  /** Push STRIG state for later consumption. */
  pushStrigState(joystickId: number, state: number): void {
    pushStrigEvent(this.strigClickBuffer, this.isEnabled, joystickId, state)
  }

  /** Consume a STRIG event from the click buffer. */
  consumeStrigState(joystickId: number): number {
    return consumeStrigEvent(this.strigClickBuffer, joystickId)
  }

  // === SPRITE POSITION QUERY ===

  /** Set shared display buffer accessor. */
  setSharedDisplayBufferAccessor(accessor: SharedDisplayBufferAccessor): void {
    this.screenManager.setSharedDisplayBufferAccessor(accessor)
  }

  getSpritePosition(actionNumber: number): { x: number; y: number } | null {
    const accessor = this.screenManager.getSharedDisplayAccessor()
    return getSpritePositionFromHelper(accessor, this.lastPositionBySprite, actionNumber)
  }

  setSpritePosition(actionNumber: number, x: number, y: number): void {
    this.lastPositionBySprite.set(actionNumber, { x, y })
  }

  clearSpritePosition(actionNumber: number): void {
    this.lastPositionBySprite.delete(actionNumber)
  }

  clearAllSpritePositions(): void {
    this.lastPositionBySprite.clear()
  }

  // === SPRITE STATE NOTIFICATION ===

  /** Send sprite states to main thread for rendering. */
  sendSpriteStates(spriteStates: SpriteState[], spriteEnabled: boolean): void {
    postSpriteStates(spriteStates, spriteEnabled)
  }

  // === SCREEN OPERATIONS (delegated to DeviceScreenManager) ===

  printOutput(output: string): void {
    this.screenManager.printOutput(output)
  }

  debugOutput(output: string): void {
    this.screenManager.debugOutput(output)
  }

  errorOutput(output: string): void {
    this.screenManager.errorOutput(output)
  }

  clearScreen(): void {
    this.screenManager.clearScreen()
  }

  setCursorPosition(x: number, y: number): void {
    this.screenManager.setCursorPosition(x, y)
  }

  getCursorPosition(): { x: number; y: number } {
    return this.screenManager.getCursorPosition()
  }

  getScreenCell(x: number, y: number, colorSwitch = 0): string | number {
    return this.screenManager.getScreenCell(x, y, colorSwitch)
  }

  setColorPattern(x: number, y: number, pattern: number): void {
    this.screenManager.setColorPattern(x, y, pattern)
  }

  setColorPalette(bgPalette: number, spritePalette: number): void {
    this.screenManager.setColorPalette(bgPalette, spritePalette)
  }

  setPaletteCombination(
    target: 'B' | 'S', combination: number,
    c1: number, c2: number, c3: number, c4: number
  ): void {
    this.screenManager.setPaletteCombination(target, combination, c1, c2, c3, c4)
  }

  setBackdropColor(colorCode: number): void {
    this.screenManager.setBackdropColor(colorCode)
  }

  setCharacterGeneratorMode(mode: number): void {
    this.screenManager.setCharacterGeneratorMode(mode)
  }

  getCharacterGeneratorMode(): number {
    return this.screenManager.getCharacterGeneratorMode()
  }

  // === BG GRAPHIC METHODS (VIEW command) ===

  /** Set BG grid data for VIEW command. */
  setBgGridData(data: BgGridData): void {
    this.screenManager.setBgGridData(data)
  }

  /** Copy BG GRAPHIC to Background Screen (per F-BASIC Manual page 36). */
  copyBgGraphicToBackground(): void {
    this.screenManager.copyBgGraphicToBackground()
  }

  // === INPUT REQUEST ===

  /** Request user input (INPUT/LINPUT). */
  requestInput(
    prompt: string,
    options?: { variableCount?: number; isLinput?: boolean }
  ): Promise<string[]> {
    return createInputRequest(
      this.pendingInputRequests,
      this.screenManager.getCurrentExecutionId() ?? 'unknown',
      prompt,
      options?.variableCount ?? 1,
      options?.isLinput ?? false
    )
  }

  /** Resolve or reject a pending input request. */
  handleInputValueMessage(message: InputValueMessage): void {
    handleInputValue(this.pendingInputRequests, message)
  }

  /** Resolve a pending play completion request. */
  handlePlaySoundCompleteMessage(message: PlaySoundCompleteMessage): void {
    handlePlayComplete(this.pendingPlayComplete, message)
  }

  /** Reject all pending input and play complete requests. */
  rejectAllPendingRequests(reason: string = 'Execution stopped'): void {
    rejectAllInput(this.pendingInputRequests, reason)
    rejectAllPlayComplete(this.pendingPlayComplete, reason)
  }

  // === EXECUTION MANAGEMENT ===

  /** Reset sound state (delegated to SoundService). */
  resetSoundState(): void {}

  /** Set the current execution ID. */
  setCurrentExecutionId(executionId: string | null): void {
    this.screenManager.setCurrentExecutionId(executionId)
    resetStickTypematicState(this.stickTypematicState)
  }

  // === SOUND METHODS (delegated to DeviceOutputHelpers) ===

  /** Play compiled audio synchronously. Blocks until PLAY_SOUND_COMPLETE is received. */
  playSound(audio: CompiledAudio): Promise<void> {
    const playId = postPlaySound(this.screenManager.getCurrentExecutionId() ?? 'unknown', audio)
    return createPlayCompleteRequest(this.pendingPlayComplete, playId)
  }

  /** Play compiled audio in background (non-blocking). Used by BGPLAY statement. */
  playSoundBackground(audio: CompiledAudio): void {
    postPlaySoundBackground(this.screenManager.getCurrentExecutionId() ?? 'unknown', audio)
  }

  /** Play a beep sound. */
  beep(): void {
    postBeep(this.screenManager.getCurrentExecutionId() ?? 'unknown')
  }

  // === PRIVATE METHODS ===

  private setupMessageListener(): void {
    if (typeof window === 'undefined') return
    const worker = this.webWorkerManager.getWorker()
    if (worker) {
      worker.onmessage = event => {
        logWorker.debug('Main thread received message from worker:', {
          type: event.data.type,
          id: event.data.id,
          timestamp: event.data.timestamp,
          dataSize: JSON.stringify(event.data).length,
        })
        const message = event.data as AnyServiceWorkerMessage
        this.handleWorkerMessage(message)
      }
    }
  }

  private handleWorkerMessage(message: AnyServiceWorkerMessage): void {
    this.messageHandler.handleWorkerMessage(message, outputMessage => {
      logWorker.debug('Handling OUTPUT message:', {
        outputType: outputMessage.data.outputType,
        outputLength: outputMessage.data.output.length,
      })
    })
  }

  /** Cancel any pending screen update. */
  cancelPendingScreenUpdate(): void {
    this.screenManager.cancelPendingScreenUpdate()
  }
}
