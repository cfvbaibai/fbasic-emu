/**
 * Web Worker Device Adapter
 *
 * A comprehensive device adapter that handles both device operations and web worker management.
 * Delegates to specialized modules for input handling, output helpers, and message management.
 */

import type { SharedDisplayBufferAccessor } from '@/core/animation/sharedDisplayBufferAccessor'
import type {
  AnyServiceWorkerMessage,
  BasicDeviceAdapter,
  ExecutionResult,
  InputValueMessage,
  InterpreterConfig,
  PlaySoundCompleteMessage,
} from '@/core/interfaces'
import type { CompiledAudio } from '@/core/sound/types'
import type { SpriteState } from '@/core/sprite/types'
import type { BgGridData } from '@/features/bg-editor/types'
import { logWorker } from '@/shared/logger'

import { copyBgGraphicToScreenBuffer } from './DeviceBgGraphicHelpers'
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
import { postBeep, postOutputMessage, postPlaySound, postPlaySoundBackground } from './DeviceOutputHelpers'
import { createPlayCompleteRequest, handlePlaySoundCompleteMessage as handlePlayComplete, rejectAllPlayCompleteRequests as rejectAllPlayComplete } from './DevicePlayCompleteHelpers'
import {
  getSpritePosition as getSpritePositionFromHelper,
  postSpriteStates,
  type SpritePositionCache,
} from './DeviceSpritePositionHelpers'
import { MessageHandler } from './MessageHandler'
import { ScreenStateManager } from './ScreenStateManager'
import { ScreenUpdateBatcher } from './ScreenUpdateBatcher'
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
  private sharedDisplayAccessor: SharedDisplayBufferAccessor | null = null
  /** Shared joystick buffer view. Set when receiving SET_SHARED_JOYSTICK_BUFFER. */
  private sharedJoystickView: JoystickBufferView | null = null
  /** Shared keyboard buffer view for INKEY$. Set when receiving SET_SHARED_KEYBOARD_BUFFER. */
  private sharedKeyboardView: KeyboardBufferView | null = null
  /** Last POSITION per sprite; getSpritePosition returns it so MOVE uses it (not buffer 0,0). */
  private lastPositionBySprite: SpritePositionCache = new Map()
  private isEnabled = true
  /** BG GRAPHIC data for VIEW command. Set via SET_BG_DATA message from main thread. */
  private bgGridData: BgGridData | null = null
  // === STICK REPEAT CONTROL (typematic-style) ===
  private stickTypematicState: StickTypematicState = createStickTypematicState()
  // === MANAGERS ===
  private webWorkerManager: WebWorkerManager
  private screenStateManager: ScreenStateManager
  private messageHandler: MessageHandler
  // === INPUT REQUEST (worker only: INPUT/LINPUT) ===
  private pendingInputRequests: Map<
    string,
    { resolve: (values: string[]) => void; reject: (err: Error) => void }
  > = new Map()
  // === PLAY COMPLETE (worker only: sync PLAY) ===
  private pendingPlayComplete: Map<string, { resolve: () => void; reject: (err: Error) => void }> = new Map()
  // === SCREEN UPDATE BATCHING ===
  private readonly screenUpdateBatcher: ScreenUpdateBatcher

  constructor() {
    this.webWorkerManager = new WebWorkerManager()
    this.screenStateManager = new ScreenStateManager()
    this.messageHandler = new MessageHandler(this.webWorkerManager.getPendingMessages())
    this.screenUpdateBatcher = new ScreenUpdateBatcher(() => {
      this.syncScreenStateToShared()
      this.postScreenChanged()
    })
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

  // === SPRITE POSITION QUERY ===

  /** Set shared display buffer accessor. */
  setSharedDisplayBufferAccessor(accessor: SharedDisplayBufferAccessor): void {
    this.sharedDisplayAccessor = accessor
  }

  getSpritePosition(actionNumber: number): { x: number; y: number } | null {
    return getSpritePositionFromHelper(this.sharedDisplayAccessor, this.lastPositionBySprite, actionNumber)
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

  // === BG GRAPHIC METHODS (VIEW command) ===

  /** Set BG grid data for VIEW command. */
  setBgGridData(data: BgGridData): void {
    this.bgGridData = data
  }

  /** Copy BG GRAPHIC to Background Screen (per F-BASIC Manual page 36). */
  copyBgGraphicToBackground(): void {
    if (!this.bgGridData) return
    copyBgGraphicToScreenBuffer(this.bgGridData, this.screenStateManager.getScreenBuffer())
    this.syncScreenStateToShared()
    this.postScreenChanged()
  }

  // === SCREEN SYNC ===

  private syncScreenStateToShared(): void {
    const accessor = this.sharedDisplayAccessor
    if (!accessor) return
    const manager = this.screenStateManager
    if (!manager) return
    const buffer = manager.getScreenBuffer()
    if (buffer == null) {
      logWorker.warn('[WebWorkerDeviceAdapter] syncScreenStateToShared: getScreenBuffer() returned null/undefined, skipping')
      return
    }
    const { x: cursorX, y: cursorY } = manager.getCursorPosition()
    const { bgPalette, spritePalette } = manager.getPalette()
    accessor.writeScreenState(
      buffer, cursorX, cursorY, bgPalette, spritePalette,
      manager.getBackdropColor(), manager.getCgenMode()
    )
    accessor.incrementSequence()
  }

  private postScreenChanged(): void {
    self.postMessage({
      type: 'SCREEN_CHANGED',
      id: `screen-changed-${Date.now()}`,
      timestamp: Date.now(),
    })
  }

  /** Consume a STRIG event from the click buffer. */
  consumeStrigState(joystickId: number): number {
    return consumeStrigEvent(this.strigClickBuffer, joystickId)
  }

  // === TEXT OUTPUT METHODS ===

  printOutput(output: string): void {
    postOutputMessage(this.screenStateManager.getCurrentExecutionId() ?? 'unknown', output, 'print')
    for (const char of output) {
      this.screenStateManager.writeCharacter(char)
    }
    this.screenUpdateBatcher.schedule()
  }

  debugOutput(output: string): void {
    postOutputMessage(this.screenStateManager.getCurrentExecutionId() ?? 'unknown', output, 'debug')
  }

  errorOutput(output: string): void {
    postOutputMessage(this.screenStateManager.getCurrentExecutionId() ?? 'unknown', output, 'error')
  }

  clearScreen(): void {
    this.screenStateManager.initializeScreen()
    this.syncScreenStateToShared()
    this.postScreenChanged()
    this.cancelPendingScreenUpdate()
  }

  setCursorPosition(x: number, y: number): void {
    this.screenStateManager.setCursorPosition(x, y)
    this.syncScreenStateToShared()
    this.postScreenChanged()
  }

  getCursorPosition(): { x: number; y: number } {
    return this.screenStateManager.getCursorPosition()
  }

  getScreenCell(x: number, y: number, colorSwitch = 0): string | number {
    return this.screenStateManager.getScreenCell(x, y, colorSwitch)
  }

  setColorPattern(x: number, y: number, pattern: number): void {
    this.screenStateManager.setColorPattern(x, y, pattern)
    this.syncScreenStateToShared()
    this.postScreenChanged()
  }

  setColorPalette(bgPalette: number, spritePalette: number): void {
    this.screenStateManager.setColorPalette(bgPalette, spritePalette)
    this.syncScreenStateToShared()
    this.postScreenChanged()
  }

  setPaletteCombination(
    target: 'B' | 'S', combination: number,
    c1: number, c2: number, c3: number, c4: number
  ): void {
    const { paletteIndex, colors } = this.screenStateManager.setPaletteCombination(
      target, combination, [c1, c2, c3, c4]
    )
    self.postMessage({
      type: 'SCREEN_UPDATE',
      id: `screen-palette-combination-${Date.now()}`,
      timestamp: Date.now(),
      data: {
        executionId: this.screenStateManager.getCurrentExecutionId() ?? 'unknown',
        updateType: 'palette-combination',
        paletteTarget: target,
        paletteIndex,
        paletteCombination: combination,
        paletteColors: colors,
        timestamp: Date.now(),
      },
    })
  }

  setBackdropColor(colorCode: number): void {
    this.screenStateManager.setBackdropColor(colorCode)
    this.syncScreenStateToShared()
    this.postScreenChanged()
  }

  setCharacterGeneratorMode(mode: number): void {
    this.screenStateManager.setCharacterGeneratorMode(mode)
    this.syncScreenStateToShared()
    this.postScreenChanged()
  }

  getCharacterGeneratorMode(): number {
    return this.screenStateManager.getCgenMode()
  }

  // === INPUT REQUEST ===

  /** Request user input (INPUT/LINPUT). */
  requestInput(
    prompt: string,
    options?: { variableCount?: number; isLinput?: boolean }
  ): Promise<string[]> {
    return createInputRequest(
      this.pendingInputRequests,
      this.screenStateManager.getCurrentExecutionId() ?? 'unknown',
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

  /** Reject all pending input requests. */
  rejectAllInputRequests(reason: string = 'Execution stopped'): void {
    rejectAllInput(this.pendingInputRequests, reason)
    rejectAllPlayComplete(this.pendingPlayComplete, reason)
  }

  // === EXECUTION MANAGEMENT ===

  /** Reset sound state (delegated to SoundService). */
  resetSoundState(): void {}

  /** Set the current execution ID. */
  setCurrentExecutionId(executionId: string | null): void {
    this.screenStateManager.setCurrentExecutionId(executionId)
    resetStickTypematicState(this.stickTypematicState)
    if (executionId) {
      this.screenStateManager.initializeScreen()
      this.syncScreenStateToShared()
      this.postScreenChanged()
      this.cancelPendingScreenUpdate()
    } else {
      this.screenUpdateBatcher.flush()
    }
  }

  // === SOUND METHODS (delegated to DeviceOutputHelpers) ===

  /** Play compiled audio synchronously. Blocks until PLAY_SOUND_COMPLETE is received. */
  playSound(audio: CompiledAudio): Promise<void> {
    const playId = postPlaySound(this.screenStateManager.getCurrentExecutionId() ?? 'unknown', audio)
    return createPlayCompleteRequest(this.pendingPlayComplete, playId)
  }

  /** Play compiled audio in background (non-blocking). Used by BGPLAY statement. */
  playSoundBackground(audio: CompiledAudio): void {
    postPlaySoundBackground(this.screenStateManager.getCurrentExecutionId() ?? 'unknown', audio)
  }

  /** Play a beep sound. */
  beep(): void {
    postBeep(this.screenStateManager.getCurrentExecutionId() ?? 'unknown')
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
    this.screenUpdateBatcher.cancel()
  }
}
