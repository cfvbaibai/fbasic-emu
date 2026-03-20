/**
 * Web Worker Device Adapter
 *
 * A comprehensive device adapter that handles both device operations and web worker management.
 * Delegates to specialized modules for web worker management, screen state, and message handling.
 */

/* eslint-disable max-lines */

import type { SharedDisplayBufferAccessor } from '@/core/animation/sharedDisplayBufferAccessor'
import { TIMING } from '@/core/constants'
import type {
  AnyServiceWorkerMessage,
  BasicDeviceAdapter,
  ExecutionResult,
  InputValueMessage,
  InterpreterConfig,
  OutputMessage,
} from '@/core/interfaces'
import type { CompiledAudio } from '@/core/sound/types'
import type { SpriteState } from '@/core/sprite/types'
import type { BgGridData } from '@/features/bg-editor/types'
import { logWorker } from '@/shared/logger'

import { MessageHandler } from './MessageHandler'
import { ScreenStateManager } from './ScreenStateManager'
import {
  createViewsFromJoystickBuffer,
  getStickState as getRawStickState,
  type JoystickBufferView,
} from './sharedJoystickBuffer'
import {
  consumeKeyAvailable,
  createViewsFromKeyboardBuffer,
  getInkeyState as getInkeyFromBuffer,
  type KeyboardBufferView,
  waitForInkeyBlocking as waitForInkeyBlockingFromBuffer,
} from './sharedKeyboardBuffer'
import { type WebWorkerExecutionOptions, WebWorkerManager } from './WebWorkerManager'

export type { WebWorkerExecutionOptions }

export class WebWorkerDeviceAdapter implements BasicDeviceAdapter {
  // === DEVICE STATE ===
  private strigClickBuffer: Map<number, number[]> = new Map()
  /** Shared display buffer accessor for buffer operations. */
  private sharedDisplayAccessor: SharedDisplayBufferAccessor | null = null
  /** Shared joystick buffer view. Set when receiving SET_SHARED_JOYSTICK_BUFFER. */
  private sharedJoystickView: JoystickBufferView | null = null
  /** Shared keyboard buffer view for INKEY$. Set when receiving SET_SHARED_KEYBOARD_BUFFER. */
  private sharedKeyboardView: KeyboardBufferView | null = null
  /** Last POSITION per sprite; getSpritePosition returns it so MOVE uses it (not buffer 0,0). */
  private lastPositionBySprite: Map<number, { x: number; y: number }> = new Map()
  private isEnabled = true
  /** BG GRAPHIC data for VIEW command. Set via SET_BG_DATA message from main thread. */
  private bgGridData: BgGridData | null = null
  // === STICK REPEAT CONTROL (typematic-style) ===
  /** Last non-zero STICK value returned for each joystick (for repeat control). */
  private lastStickValue: Map<number, number> = new Map()
  /** Timestamp when last non-zero STICK value was returned (for repeat interval). */
  private lastStickReadTime: Map<number, number> = new Map()
  // === MANAGERS ===
  private webWorkerManager: WebWorkerManager
  private screenStateManager: ScreenStateManager
  private messageHandler: MessageHandler
  // === INPUT REQUEST (worker only: INPUT/LINPUT) ===
  private pendingInputRequests: Map<
    string,
    { resolve: (values: string[]) => void; reject: (err: Error) => void }
  > = new Map()
  // === SCREEN UPDATE BATCHING (FPS-based: aligns updates with target frame rate) ===
  private pendingScreenUpdate: boolean = false
  private screenUpdateTimeout: number | null = null
  private lastScreenUpdateTime: number = 0
  private readonly TARGET_FPS = 60
  private readonly FRAME_INTERVAL_MS = 1000 / 60
  private readonly MAX_BATCH_DELAY_MS = 33
  constructor() {
    logWorker.debug('WebWorkerDeviceAdapter created')
    this.webWorkerManager = new WebWorkerManager()
    this.screenStateManager = new ScreenStateManager()
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
    this.resetStickTypematicState()
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
      data: {
        joystickId,
        state,
        timestamp: Date.now(),
      },
    }

    logWorker.debug('Sending STRIG event to web worker:', {
      joystickId,
      state,
      messageId: message.id,
    })

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
    this.resetStickTypematicState()
  }

  // === DEVICE ADAPTER METHODS ===
  /** Enable or disable the device adapter */
  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled
    if (!enabled) {
      this.resetStickTypematicState()
    }
    logWorker.debug('Device adapter enabled:', enabled)
  }

  // === JOYSTICK INPUT METHODS ===
  getJoystickCount(): number {
    return 2
  }
  /**
   * Get stick state from shared joystick buffer with typematic-style repeat control.
   *
   * This prevents programs from registering continuous direction input when the
   * joystick is held in one direction. Instead:
   * - New directions are returned immediately
   * - Release (returning 0) is immediate
   * - Same direction held is only returned after repeat interval elapses
   *
   * @param joystickId - Joystick ID (0 or 1)
   * @returns Stick state (0-15), or 0 if same direction and interval not elapsed
   */
  getStickState(joystickId: number): number {
    if (!this.sharedJoystickView) {
      throw new Error(
        'Shared joystick buffer not set. Worker must receive SET_SHARED_JOYSTICK_BUFFER message before reading joystick state.'
      )
    }

    // Read current raw state from shared buffer
    const currentDirection = getRawStickState(this.sharedJoystickView, joystickId)
    const now = performance.now()

    // If current is 0 (no direction/released): return immediately, reset tracking
    if (currentDirection === 0) {
      this.lastStickValue.delete(joystickId)
      this.lastStickReadTime.delete(joystickId)
      return 0
    }

    const lastValue = this.lastStickValue.get(joystickId) ?? 0
    const lastTime = this.lastStickReadTime.get(joystickId) ?? 0

    // If current != last: new direction, return immediately, update tracking
    if (currentDirection !== lastValue) {
      this.lastStickValue.set(joystickId, currentDirection)
      this.lastStickReadTime.set(joystickId, now)
      return currentDirection
    }

    // Same direction held: check if enough time has elapsed since last return
    const elapsed = now - lastTime
    if (elapsed >= TIMING.STICK_REPEAT_INTERVAL_MS) {
      // Enough time elapsed: return value, update timestamp
      this.lastStickReadTime.set(joystickId, now)
      return currentDirection
    }

    // Not enough time elapsed: suppress repeat (return 0)
    return 0
  }
  /** Set stick state (deprecated - main thread now writes directly to shared buffer) */
  setStickState(_joystickId: number, _state: number): void {
    throw new Error(
      'setStickState() is deprecated. Main thread writes directly to shared joystick buffer. This method is no longer supported.'
    )
  }

  /**
   * Set shared joystick buffer (called from worker when receiving SET_SHARED_JOYSTICK_BUFFER)
   */
  setSharedJoystickBuffer(buffer: SharedArrayBuffer): void {
    this.sharedJoystickView = createViewsFromJoystickBuffer(buffer)
    this.resetStickTypematicState()
    logWorker.debug('[WebWorkerDeviceAdapter] Shared joystick buffer set')
  }

  private resetStickTypematicState(): void {
    this.lastStickValue.clear()
    this.lastStickReadTime.clear()
  }

  // === KEYBOARD INPUT (INKEY$) ===

  /** Get current keyboard state for INKEY$ - returns pressed character or empty string */
  getInkeyState(): string {
    if (!this.sharedKeyboardView) return ''
    const { keyChar } = getInkeyFromBuffer(this.sharedKeyboardView)
    return keyChar
  }

  /** Set shared keyboard buffer (called from worker when receiving SET_SHARED_KEYBOARD_BUFFER) */
  setSharedKeyboardBuffer(buffer: SharedArrayBuffer): void {
    this.sharedKeyboardView = createViewsFromKeyboardBuffer(buffer)
    logWorker.debug('[WebWorkerDeviceAdapter] Shared keyboard buffer set')
  }

  /** Wait for a key press (blocking mode for INKEY$(0)) - polls until key is pressed */
  async waitForInkey(): Promise<string> {
    const POLL_INTERVAL_MS = 16 // ~60fps polling rate

    while (this.isEnabled) {
      const keyChar = this.getInkeyState()
      if (keyChar) {
        return keyChar
      }
      // Wait before next poll
      await new Promise(resolve => setTimeout(resolve, POLL_INTERVAL_MS))
    }
    // If disabled (e.g., STOP), return empty string
    return ''
  }

  /** Wait for a key press synchronously using Atomics.wait (blocking mode for INKEY$(0)) */
  waitForInkeyBlocking(): string {
    if (!this.sharedKeyboardView) return ''

    // First check if key already pressed
    const keyChar = this.getInkeyState()
    if (keyChar) {
      consumeKeyAvailable(this.sharedKeyboardView)
      return keyChar
    }

    // Block until key available or disabled
    const TIMEOUT_MS = 100 // Check isEnabled periodically
    while (this.isEnabled) {
      const available = waitForInkeyBlockingFromBuffer(this.sharedKeyboardView, TIMEOUT_MS)
      if (available) {
        const char = this.getInkeyState()
        consumeKeyAvailable(this.sharedKeyboardView)
        return char
      }
    }

    // Disabled (STOP pressed)
    return ''
  }

  pushStrigState(joystickId: number, state: number): void {
    if (!this.isEnabled) return

    if (state > 0) {
      if (!this.strigClickBuffer.has(joystickId)) {
        this.strigClickBuffer.set(joystickId, [])
      }
      const buffer = this.strigClickBuffer.get(joystickId)!
      buffer.push(state)
    }
  }

  // === SPRITE POSITION QUERY ===

  /**
   * Set shared display buffer accessor (called from worker when receiving SET_SHARED_ANIMATION_BUFFER).
   */
  setSharedDisplayBufferAccessor(accessor: SharedDisplayBufferAccessor): void {
    this.sharedDisplayAccessor = accessor
  }

  getSpritePosition(actionNumber: number): { x: number; y: number } | null {
    // Sync from shared buffer if available (main thread writes live animation positions)
    if (this.sharedDisplayAccessor) {
      const livePos = this.sharedDisplayAccessor.readSpritePosition(actionNumber)
      if (livePos !== null) {
        const isOrigin = livePos.x === 0 && livePos.y === 0
        const hasLiveSpriteState =
          this.sharedDisplayAccessor.readSpriteIsActive(actionNumber) ||
          this.sharedDisplayAccessor.readSpriteIsVisible(actionNumber)

        // Origin is a valid coordinate; only treat (0,0) as uninitialized when slot is inactive/invisible.
        if (!isOrigin || hasLiveSpriteState) {
          this.lastPositionBySprite.set(actionNumber, livePos)
          return livePos
        }
      }
    }
    return this.lastPositionBySprite.get(actionNumber) ?? null
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

  /**
   * Send sprite states to main thread for rendering.
   * Called by executors when sprite states change (DEF SPRITE, SPRITE, SPRITE ON/OFF).
   */
  sendSpriteStates(spriteStates: SpriteState[], spriteEnabled: boolean): void {
    self.postMessage({
      type: 'SPRITE_STATES',
      id: `sprite-states-${Date.now()}`,
      timestamp: Date.now(),
      data: {
        spriteStates,
        spriteEnabled,
      },
    })
  }

  // === BG GRAPHIC METHODS (VIEW command) ===

  /** Set BG grid data for VIEW command (called from WebWorkerInterpreter when receiving SET_BG_DATA) */
  setBgGridData(data: BgGridData): void {
    this.bgGridData = data
    logWorker.debug('[WebWorkerDeviceAdapter] BG grid data set, rows:', data.length)
  }

  /** Copy BG GRAPHIC to Background Screen (per F-BASIC Manual page 36).
   *
   * BG GRAPHIC (28×21) and Background Screen (28×24) share the same origin on the sprite screen.
   * Per the sprite coordinate formula y = (Y × 8) + 24, BG GRAPHIC Y=0 appears at sprite y=24.
   * The canvas renderer already applies this +24 pixel offset (BG_OFFSET_Y), so BG rows map
   * directly to screen buffer rows without additional offset.
   */
  copyBgGraphicToBackground(): void {
    if (!this.bgGridData) {
      logWorker.warn('[WebWorkerDeviceAdapter] VIEW: No BG grid data available')
      return
    }

    logWorker.debug('[WebWorkerDeviceAdapter] VIEW: Copying BG GRAPHIC to Background Screen')

    // Get the screen buffer from the state manager
    const screenBuffer = this.screenStateManager.getScreenBuffer()

    // Copy BG data to screen buffer
    // BG grid has 21 rows (Y: 0-20), which map directly to screen rows 0-20
    // The +24 pixel offset in the renderer positions both at sprite y=24
    // BG grid has 28 columns, same as screen width
    for (let gridRow = 0; gridRow < this.bgGridData.length; gridRow++) {
      const bgRow = this.bgGridData[gridRow]
      if (!bgRow) continue

      // Direct mapping: BG row N → screen row N
      const screenRow = gridRow
      if (screenRow >= 24) break // Don't exceed screen height

      for (let col = 0; col < bgRow.length && col < 28; col++) {
        const bgCell = bgRow[col]
        if (!bgCell) continue

        const screenCell = screenBuffer[screenRow]?.[col]
        if (screenCell) {
          // Convert character code to character
          // In F-BASIC, character codes 0-255 map to CHR$ values
          screenCell.character = String.fromCharCode(bgCell.charCode)
          screenCell.colorPattern = bgCell.colorPattern
        }
      }
    }

    // Sync to shared buffer and notify main thread
    this.syncScreenStateToShared()
    this.postScreenChanged()

    logWorker.debug('[WebWorkerDeviceAdapter] VIEW: BG GRAPHIC copied successfully')
  }

  /**
   * Write current screen state from ScreenStateManager to shared buffer and increment sequence.
   * Caller must then postMessage(SCREEN_CHANGED).
   */
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
      buffer,
      cursorX,
      cursorY,
      bgPalette,
      spritePalette,
      manager.getBackdropColor(),
      manager.getCgenMode()
    )
    accessor.incrementSequence()
  }

  private postScreenChanged(): void {
    // In web worker context, postMessage takes (message, transfer[]) not targetOrigin
    // The '*' parameter is only valid for window.postMessage() in main thread
    self.postMessage({
      type: 'SCREEN_CHANGED',
      id: `screen-changed-${Date.now()}`,
      timestamp: Date.now(),
    })
  }

  consumeStrigState(joystickId: number): number {
    const buffer = this.strigClickBuffer.get(joystickId)
    if (!buffer || buffer.length === 0) {
      return 0
    }

    const clickValue = buffer.shift()!
    logWorker.debug(
      `consumeStrigState: consumed STRIG event for joystick ${joystickId}, value=${clickValue}, remaining=${buffer.length}`
    )
    return clickValue
  }

  // === TEXT OUTPUT METHODS ===

  printOutput(output: string): void {
    logWorker.debug('Print output:', output)

    // Send to STDOUT (original textarea output)
    self.postMessage({
      type: 'OUTPUT',
      id: `output-${Date.now()}`,
      timestamp: Date.now(),
      data: {
        executionId: this.screenStateManager.getCurrentExecutionId() ?? 'unknown',
        output: output,
        outputType: 'print',
        timestamp: Date.now(),
      },
    })

    // Process all characters and update screen buffer
    for (const char of output) {
      this.screenStateManager.writeCharacter(char)
    }

    // Batch screen updates to reduce Vue reactivity overhead
    this.scheduleScreenUpdate()
  }

  debugOutput(output: string): void {
    logWorker.debug('Debug output:', output)
    // Send debug output to main thread
    self.postMessage({
      type: 'OUTPUT',
      id: `debug-${Date.now()}`,
      timestamp: Date.now(),
      data: {
        executionId: this.screenStateManager.getCurrentExecutionId() ?? 'unknown',
        output: output,
        outputType: 'debug',
        timestamp: Date.now(),
      },
    })
  }

  errorOutput(output: string): void {
    logWorker.error('Error output:', output)
    // Send error output to main thread
    self.postMessage({
      type: 'OUTPUT',
      id: `error-${Date.now()}`,
      timestamp: Date.now(),
      data: {
        executionId: this.screenStateManager.getCurrentExecutionId() ?? 'unknown',
        output: output,
        outputType: 'error',
        timestamp: Date.now(),
      },
    })
  }

  clearScreen(): void {
    logWorker.debug('Clear screen')
    this.screenStateManager.initializeScreen()
    this.syncScreenStateToShared()
    this.postScreenChanged()
    this.cancelPendingScreenUpdate()
  }

  setCursorPosition(x: number, y: number): void {
    logWorker.debug('Set cursor position:', { x, y })
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
    logWorker.debug('Set color pattern:', { x, y, pattern })
    this.screenStateManager.setColorPattern(x, y, pattern)
    this.syncScreenStateToShared()
    this.postScreenChanged()
  }

  setColorPalette(bgPalette: number, spritePalette: number): void {
    logWorker.debug('Set color palette:', {
      bgPalette,
      spritePalette,
    })
    this.screenStateManager.setColorPalette(bgPalette, spritePalette)
    this.syncScreenStateToShared()
    this.postScreenChanged()
  }

  setPaletteCombination(
    target: 'B' | 'S',
    combination: number,
    c1: number,
    c2: number,
    c3: number,
    c4: number
  ): void {
    const { paletteIndex, colors } = this.screenStateManager.setPaletteCombination(
      target,
      combination,
      [c1, c2, c3, c4]
    )
    const executionId = this.screenStateManager.getCurrentExecutionId() ?? 'unknown'

    self.postMessage({
      type: 'SCREEN_UPDATE',
      id: `screen-palette-combination-${Date.now()}`,
      timestamp: Date.now(),
      data: {
        executionId,
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
    logWorker.debug('Set backdrop color:', colorCode)
    this.screenStateManager.setBackdropColor(colorCode)
    this.syncScreenStateToShared()
    this.postScreenChanged()
  }

  setCharacterGeneratorMode(mode: number): void {
    logWorker.debug('Set character generator mode:', mode)
    this.screenStateManager.setCharacterGeneratorMode(mode)
    this.syncScreenStateToShared()
    this.postScreenChanged()
  }

  getCharacterGeneratorMode(): number {
    return this.screenStateManager.getCgenMode()
  }

  /**
   * Request user input (INPUT/LINPUT). Used in worker; posts REQUEST_INPUT to main and waits for INPUT_VALUE.
   */
  requestInput(
    prompt: string,
    options?: { variableCount?: number; isLinput?: boolean }
  ): Promise<string[]> {
    const variableCount = options?.variableCount ?? 1
    const isLinput = options?.isLinput ?? false
    const requestId = `input-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const executionId = this.screenStateManager.getCurrentExecutionId() ?? 'unknown'

    const promise = new Promise<string[]>((resolve, reject) => {
      this.pendingInputRequests.set(requestId, { resolve, reject })
    })

    self.postMessage({
      type: 'REQUEST_INPUT',
      id: requestId,
      timestamp: Date.now(),
      data: {
        requestId,
        executionId,
        prompt,
        variableCount,
        isLinput,
      },
    })

    return promise
  }

  /**
   * Resolve or reject a pending input request (called from WebWorkerInterpreter when INPUT_VALUE is received).
   */
  handleInputValueMessage(message: InputValueMessage): void {
    const { requestId, values, cancelled } = message.data
    const pending = this.pendingInputRequests.get(requestId)
    this.pendingInputRequests.delete(requestId)
    if (!pending) return
    if (cancelled) {
      pending.reject(new Error('Input cancelled'))
    } else {
      pending.resolve(values)
    }
  }

  /**
   * Reject all pending input requests (e.g. when STOP is received).
   */
  rejectAllInputRequests(reason: string = 'Execution stopped'): void {
    for (const [, pending] of this.pendingInputRequests) {
      pending.reject(new Error(reason))
    }
    this.pendingInputRequests.clear()
  }

  /**
   * Reset sound state to defaults.
   * Called when CLEAR button is pressed.
   * Note: Sound state is now managed by SoundService in the execution layer.
   */
  resetSoundState(): void {
    logWorker.debug('[WebWorkerDeviceAdapter] resetSoundState called (delegated to SoundService)')
  }

  /**
   * Set the current execution ID (called by WebWorkerInterpreter)
   */
  setCurrentExecutionId(executionId: string | null): void {
    this.screenStateManager.setCurrentExecutionId(executionId)
    this.resetStickTypematicState()
    if (executionId) {
      // Sound state reset is now handled by SoundService in ExecutionContext.reset()
      this.screenStateManager.initializeScreen()
      this.syncScreenStateToShared()
      this.postScreenChanged()
      this.cancelPendingScreenUpdate()
    } else {
      this.flushScreenUpdate()
    }
  }

  /**
   * Play compiled audio
   * Just transmits the audio to main thread - no state management here
   */
  playSound(audio: CompiledAudio): void {
    logWorker.debug('Playing sound, channels:', audio.channels.length)

    // Flatten all channels into a single event array for transmission
    const events = audio.channels.flatMap((channelEvents) => channelEvents)

    // Convert events to serializable format
    const serializedEvents = events.map((event) => ({
      frequency: 'frequency' in event ? event.frequency : undefined,
      duration: event.duration,
      channel: event.channel,
      duty: 'duty' in event ? event.duty : 0,
      envelope: 'envelope' in event ? event.envelope : 0,
      volumeOrLength: 'volumeOrLength' in event ? event.volumeOrLength : 0,
    }))

    // Post PLAY_SOUND message to main thread
    self.postMessage({
      type: 'PLAY_SOUND',
      id: `play-sound-${Date.now()}`,
      timestamp: Date.now(),
      data: {
        executionId: this.screenStateManager.getCurrentExecutionId() ?? 'unknown',
        events: serializedEvents,
      },
    })
  }

  /**
   * Play a beep sound (BEEP statement)
   * Per F-BASIC Manual page 80: "Outputs a 'beep' type of sound"
   * Uses a simple note on channel 0
   */
  beep(): void {
    logWorker.debug('Playing beep')

    // Use a beep: higher frequency for better audibility, longer duration
    // Channel 0, duty 2 (50%), envelope 0 (no envelope), volume 15
    const beepEvents = [
      {
        frequency: 1200, // ~5 seconds at 60fps
        duration: 300,
        channel: 0,
        duty: 2,
        envelope: 0,
        volumeOrLength: 15,
      },
    ]

    self.postMessage({
      type: 'PLAY_SOUND',
      id: `beep-${Date.now()}`,
      timestamp: Date.now(),
      data: {
        executionId: this.screenStateManager.getCurrentExecutionId() ?? 'unknown',
        musicString: 'BEEP',
        events: beepEvents,
      },
    })
  }

  // === PRIVATE METHODS ===

  /**
   * Set up message listener for web worker responses
   */
  private setupMessageListener(): void {
    if (typeof window === 'undefined') return // Not in main thread

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

  /** Handle messages from the web worker */
  private handleWorkerMessage(message: AnyServiceWorkerMessage): void {
    this.messageHandler.handleWorkerMessage(message, outputMessage => {
      this.handleOutputMessage(outputMessage)
    })
  }

  /** Handle OUTPUT messages from the web worker */
  private handleOutputMessage(message: OutputMessage): void {
    logWorker.debug('Handling OUTPUT message:', {
      outputType: message.data.outputType,
      outputLength: message.data.output.length,
    })
    // Output is now handled by the device adapter in the web worker
  }

  /**
   * Schedule a batched screen update with FPS-based timing
   * This batches multiple screen updates together to align with target frame rate
   * and reduce message volume and Vue reactivity overhead on the receiving side
   * 
   * Strategy:
   * - Calculate time since last update
   * - If enough time has passed (>= frame interval), send immediately
   * - Otherwise, schedule for the next frame boundary
   * - This ensures updates are sent at consistent FPS intervals
   */
  private scheduleScreenUpdate(): void {
    // Mark that we have a pending update
    this.pendingScreenUpdate = true

    // If there's already a scheduled update, don't schedule another one
    // The existing scheduled update will pick up this pending change
    if (this.screenUpdateTimeout !== null) {
      return
    }

    const now = performance.now()
    const timeSinceLastUpdate = now - this.lastScreenUpdateTime

    // If enough time has passed since last update, send immediately
    if (timeSinceLastUpdate >= this.FRAME_INTERVAL_MS) {
      this.flushScreenUpdate()
      return
    }

    // Calculate delay to next frame boundary (capped to prevent excessive lag)
    const delayUntilNextFrame = this.FRAME_INTERVAL_MS - timeSinceLastUpdate
    const delay = Math.min(delayUntilNextFrame, this.MAX_BATCH_DELAY_MS)
    // Schedule the update to be sent at the next frame boundary
    this.screenUpdateTimeout = self.setTimeout(() => {
      this.flushScreenUpdate()
    }, delay)
  }

  /** Cancel any pending screen update (used by flush paths and tests to avoid timeouts after teardown) */
  cancelPendingScreenUpdate(): void {
    if (this.screenUpdateTimeout !== null) {
      self.clearTimeout(this.screenUpdateTimeout)
      this.screenUpdateTimeout = null
    }
    this.pendingScreenUpdate = false
  }
  /** Flush pending screen update: write to shared buffer and send SCREEN_CHANGED */
  private flushScreenUpdate(): void {
    this.screenUpdateTimeout = null
    if (!this.pendingScreenUpdate) return
    this.pendingScreenUpdate = false
    this.lastScreenUpdateTime = performance.now()
    this.syncScreenStateToShared()
    this.postScreenChanged()
  }
}
