/**
 * Web Worker Entry Point for BASIC Interpreter
 *
 * This is the main entry point for the web worker that will be bundled
 * with the interpreter code.
 */

import { SharedDisplayBufferAccessor } from '@/core/animation/sharedDisplayBufferAccessor'
import { BasicInterpreter } from '@/core/BasicInterpreter'
import { WebWorkerDeviceAdapter } from '@/core/devices/WebWorkerDeviceAdapter'
import type {
  AnyServiceWorkerMessage,
  ClearDisplayMessage,
  ErrorMessage,
  ExecuteMessage,
  InputValueMessage,
  OutputMessage,
  PlaySoundCompleteMessage,
  ResultMessage,
  SetBgDataMessage,
  SetSharedAnimationBufferMessage,
  SetSharedJoystickBufferMessage,
  SetSharedKeyboardBufferMessage,
  StopMessage,
  StrigEventMessage,
} from '@/core/interfaces'
import type { BgGridData } from '@/features/bg-editor/types'
import { logWorker } from '@/shared/logger'

// Web Worker Interpreter Implementation
class WebWorkerInterpreter {
  private interpreter: BasicInterpreter | null = null
  private isRunning: boolean = false
  private currentExecutionId: string | null = null
  private webWorkerDeviceAdapter: WebWorkerDeviceAdapter | null = null
  private sharedAnimationBuffer: SharedArrayBuffer | null = null

  constructor() {
    this.interpreter = null
    this.isRunning = false
    this.currentExecutionId = null
    this.webWorkerDeviceAdapter = new WebWorkerDeviceAdapter()

    this.setupMessageListener()
  }

  setupMessageListener() {
    if (typeof self === 'undefined') return

    self.addEventListener('message', event => {
      // Commented out to reduce log flooding
      // logWorker.debug('Web worker received message from main thread:', {
      //   type: event.data.type,
      //   id: event.data.id,
      //   timestamp: event.data.timestamp,
      //   dataSize: JSON.stringify(event.data).length,
      // })
      void this.handleMessage(event.data)
    })
  }

  async handleMessage(message: AnyServiceWorkerMessage) {
    // Commented out to reduce log flooding
    // logWorker.debug('Processing message:', {
    //   type: message.type,
    //   id: message.id,
    //   timestamp: message.timestamp,
    // })

    try {
      // -- Only handling request messages, not response messages
      // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
      switch (message.type) {
        case 'EXECUTE':
          logWorker.debug('Handling EXECUTE message')
          await this.handleExecute(message)
          break
        case 'PING':
          this.handlePing(message)
          break
        case 'STOP':
          logWorker.debug('Handling STOP message')
          this.handleStop(message)
          break
        case 'STRIG_EVENT':
          this.handleStrigEvent(message)
          break
        case 'SET_SHARED_ANIMATION_BUFFER':
          this.handleSetSharedAnimationBuffer(message)
          break
        case 'SET_SHARED_JOYSTICK_BUFFER':
          this.handleSetSharedJoystickBuffer(message)
          break
        case 'SET_SHARED_KEYBOARD_BUFFER':
          this.handleSetSharedKeyboardBuffer(message)
          break
        case 'SET_BG_DATA':
          this.handleSetBgData(message)
          break
        case 'INPUT_VALUE':
          this.handleInputValue(message)
          break
        case 'PLAY_SOUND_COMPLETE':
          this.handlePlaySoundComplete(message)
          break
        case 'CLEAR_DISPLAY':
          logWorker.debug('Handling CLEAR_DISPLAY message')
          this.handleClearDisplay(message)
          break

        default:
          // Other message types (RESULT, PROGRESS, OUTPUT, ERROR,
          // SCREEN_UPDATE, INIT, READY) are sent FROM the worker, not
          // handled BY the worker
          logWorker.warn('Unexpected message type:', message.type)
          break
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logWorker.error('Error processing message:', err.message)
      logWorker.error('Stack trace:', err.stack ?? '(no stack available)')
      // Capture location from interpreter when available (e.g. error escaped from handleExecute)
      const location = this.interpreter?.getExecutionLocation?.() ?? null
      this.sendError(message.id, err, location)
    }
  }

  async handleExecute(message: ExecuteMessage) {
    try {
      const { code, config } = message.data
      this.currentExecutionId = message.id

      // Set execution ID in device adapter so it can include it in OUTPUT messages
      if (this.webWorkerDeviceAdapter) {
        this.webWorkerDeviceAdapter.setCurrentExecutionId(message.id)
      }

      logWorker.debug('Starting execution:', {
        executionId: message.id,
        codeLength: code.length,
      })

      // Create a new interpreter for each execution to ensure correct configuration
      logWorker.debug('Creating interpreter with WebWorkerDeviceAdapter:', {
        hasOriginalDeviceAdapter: !!config.deviceAdapter,
        maxIterations: config.maxIterations,
        maxOutputLines: config.maxOutputLines,
      })
      logWorker.debug('[WebWorkerInterpreter] Creating BasicInterpreter with sharedAnimationBuffer:', {
        hasBuffer: !!this.sharedAnimationBuffer,
        byteLength: this.sharedAnimationBuffer?.byteLength,
      })
      this.interpreter = new BasicInterpreter({
        ...config,
        deviceAdapter: this.webWorkerDeviceAdapter!,
        sharedAnimationBuffer: this.sharedAnimationBuffer ?? undefined,
      })
      logWorker.debug('Interpreter created with WebWorkerDeviceAdapter')

      // Execute the BASIC code
      logWorker.debug('Executing BASIC code')
      this.isRunning = true
      const result = await this.interpreter.execute(code)
      this.isRunning = false

      logWorker.debug('Execution completed:', {
        success: result.success,
        outputLines: this.webWorkerDeviceAdapter?.printOutput.length ?? 0,
        executionTime: result.executionTime,
      })
      if (!result.success && result.errors?.length) {
        logWorker.error('Execution returned success: false', result.errors[0]?.message, result.errors)
      }

      // Flush final screen buffer so main thread receives full SCREEN_UPDATE before RESULT.
      // Otherwise RESULT can be processed first and only the first batched screen shows.
      if (this.webWorkerDeviceAdapter) {
        this.webWorkerDeviceAdapter.setCurrentExecutionId(null)
      }

      // Get sprite states from interpreter
      if (!this.interpreter) {
        throw new Error('Interpreter not initialized')
      }
      const spriteStates = this.interpreter.getSpriteStates()
      const spriteEnabled = this.interpreter.isSpriteEnabled()
      // movementStates no longer sent in RESULT - read from shared buffer instead

      // Create enhanced result with execution metadata
      const enhancedResult: ResultMessage['data'] = {
        ...result,
        executionId: message.id,
        workerId: 'web-worker-1',
        spriteStates,
        spriteEnabled,
      }

      this.sendResult(message.id, enhancedResult)
    } catch (error) {
      this.isRunning = false
      const err = error instanceof Error ? error : new Error(String(error))
      logWorker.error('Execution error:', err.message)
      logWorker.error('Stack trace:', err.stack ?? '(no stack available)')
      const location = this.interpreter?.getExecutionLocation() ?? null
      this.sendError(message.id, err, location)
    }
  }

  handlePing(message: { id: string }) {
    logWorker.debug('Handling PING message')
    this.sendResult(message.id, {
      executionId: message.id,
      success: true,
      errors: [],
      variables: new Map(),
      executionTime: 0,
    })
  }

  handleStop(_message: StopMessage) {
    logWorker.debug('Stopping execution:', {
      wasRunning: this.isRunning,
      currentExecutionId: this.currentExecutionId,
    })
    this.isRunning = false
    if (this.webWorkerDeviceAdapter) {
      this.webWorkerDeviceAdapter.rejectAllPendingRequests('Execution stopped')
    }
    if (this.interpreter) {
      logWorker.debug('Calling interpreter.stop()')
      this.interpreter.stop()
    }
  }

  handleInputValue(message: InputValueMessage) {
    if (this.webWorkerDeviceAdapter) {
      this.webWorkerDeviceAdapter.handleInputValueMessage(message)
    }
  }

  handlePlaySoundComplete(message: PlaySoundCompleteMessage) {
    if (this.webWorkerDeviceAdapter) {
      this.webWorkerDeviceAdapter.handlePlaySoundCompleteMessage(message)
    }
  }

  handleClearDisplay(_message: ClearDisplayMessage) {
    this.interpreter?.clearDisplay?.()
    this.webWorkerDeviceAdapter?.clearAllSpritePositions?.()
    // Reset sound state when CLEAR is pressed
    this.webWorkerDeviceAdapter?.resetSoundState?.()
  }

  handleStrigEvent(message: StrigEventMessage) {
    const { joystickId, state } = message.data

    // Update the WebWorkerDeviceAdapter directly
    if (this.webWorkerDeviceAdapter) {
      this.webWorkerDeviceAdapter.pushStrigState(joystickId, state)
    }
  }

  handleSetSharedAnimationBuffer(message: SetSharedAnimationBufferMessage) {
    const data = message.data
    if (!data?.buffer) {
      logWorker.warn('SET_SHARED_ANIMATION_BUFFER: message.data or buffer missing')
      return
    }
    const { buffer } = data
    this.sharedAnimationBuffer = buffer
    logWorker.debug('[WebWorkerInterpreter] SET_SHARED_ANIMATION_BUFFER received, buffer byteLength =', buffer.byteLength)
    const accessor = new SharedDisplayBufferAccessor(buffer)
    const animationManager = this.interpreter?.getAnimationManager()
    logWorker.debug('[WebWorkerInterpreter] Interpreter exists:', !!this.interpreter, 'AnimationManager exists:', !!animationManager)
    if (this.webWorkerDeviceAdapter) {
      this.webWorkerDeviceAdapter.setSharedDisplayBufferAccessor(accessor)
    }
    // Update AnimationManager's shared buffer for direct sync to AnimationWorker
    if (animationManager) {
      logWorker.debug('[WebWorkerInterpreter] Updating existing AnimationManager with shared buffer')
      animationManager.setSharedAnimationBuffer(buffer)
    } else {
      logWorker.debug('[WebWorkerInterpreter] AnimationManager not created yet, will use buffer when interpreter is created')
    }
  }

  handleSetSharedJoystickBuffer(message: SetSharedJoystickBufferMessage) {
    const data = message.data
    if (!data?.buffer) {
      logWorker.warn('SET_SHARED_JOYSTICK_BUFFER: message.data or buffer missing')
      return
    }
    const { buffer } = data
    logWorker.debug('[WebWorkerInterpreter] SET_SHARED_JOYSTICK_BUFFER received, buffer byteLength =', buffer.byteLength)
    if (this.webWorkerDeviceAdapter) {
      this.webWorkerDeviceAdapter.setSharedJoystickBuffer(buffer)
      logWorker.debug('[WebWorkerInterpreter] Shared joystick buffer set in WebWorkerDeviceAdapter')
    } else {
      logWorker.warn('[WebWorkerInterpreter] No WebWorkerDeviceAdapter available for SET_SHARED_JOYSTICK_BUFFER')
    }
  }

  handleSetSharedKeyboardBuffer(message: SetSharedKeyboardBufferMessage) {
    const data = message.data
    if (!data?.buffer) {
      logWorker.warn('SET_SHARED_KEYBOARD_BUFFER: message.data or buffer missing')
      return
    }
    const { buffer } = data
    logWorker.debug('[WebWorkerInterpreter] SET_SHARED_KEYBOARD_BUFFER received, buffer byteLength =', buffer.byteLength)
    if (this.webWorkerDeviceAdapter) {
      this.webWorkerDeviceAdapter.setSharedKeyboardBuffer(buffer)
      logWorker.debug('[WebWorkerInterpreter] Shared keyboard buffer set in WebWorkerDeviceAdapter')
    } else {
      logWorker.warn('[WebWorkerInterpreter] No WebWorkerDeviceAdapter available for SET_SHARED_KEYBOARD_BUFFER')
    }
  }

  handleSetBgData(message: SetBgDataMessage) {
    const data = message.data
    if (!data?.grid) {
      logWorker.warn('SET_BG_DATA: message.data or grid missing')
      return
    }
    logWorker.debug('[WebWorkerInterpreter] SET_BG_DATA received, grid size =', data.grid.length, 'x', data.grid[0]?.length ?? 0)
    if (this.webWorkerDeviceAdapter) {
      // Cast to BgGridData since the message type uses number for colorPattern
      // but the actual values are always 0-3 (ColorPattern)
      this.webWorkerDeviceAdapter.setBgGridData(data.grid as BgGridData)
      logWorker.debug('[WebWorkerInterpreter] BG grid data set in WebWorkerDeviceAdapter')
    } else {
      logWorker.warn('[WebWorkerInterpreter] No WebWorkerDeviceAdapter available for SET_BG_DATA')
    }
  }

  sendOutput(output: string, outputType: 'print' | 'debug' | 'error') {
    if (!this.currentExecutionId) return

    const message: OutputMessage = {
      type: 'OUTPUT',
      id: `output-${Date.now()}`,
      timestamp: Date.now(),
      data: {
        executionId: this.currentExecutionId,
        output,
        outputType,
        timestamp: Date.now(),
      },
    }
    logWorker.debug('Sending OUTPUT message:', {
      outputType,
      outputLength: output.length,
      executionId: this.currentExecutionId,
    })
    self.postMessage(message)
  }

  sendResult(messageId: string, result: ResultMessage['data']) {
    const message: ResultMessage = {
      type: 'RESULT',
      id: messageId,
      timestamp: Date.now(),
      data: result,
    }
    logWorker.debug('Sending RESULT message:', {
      messageId,
      success: result.success,
      executionTime: result.executionTime,
    })
    self.postMessage(message)
  }

  sendError(
    messageId: string,
    error: Error,
    location?: { lineNumber: number; statementIndex: number; sourceLine?: string } | null
  ): void {
    // Always send a string for stack so main thread can display it (worker stack may be undefined in some envs)
    const stackStr =
      (error && typeof (error).stack === 'string' && (error).stack) ||
      '(stack not available)'
    const message: ErrorMessage = {
      type: 'ERROR',
      id: messageId,
      timestamp: Date.now(),
      data: {
        executionId: messageId,
        message: error.message,
        stack: stackStr,
        lineNumber: location?.lineNumber,
        sourceLine: location?.sourceLine,
        errorType: 'execution',
        recoverable: true,
      },
    }
    logWorker.error('Sending ERROR message:', {
      messageId,
      errorMessage: error.message,
      lineNumber: location?.lineNumber,
      sourceLine: location?.sourceLine ? `${location.sourceLine.slice(0, 40)}...` : undefined,
      errorType: 'execution',
      recoverable: true,
    })
    logWorker.error('Stack trace:', stackStr)
    self.postMessage(message)
  }
}

// Initialize web worker interpreter
new WebWorkerInterpreter()
