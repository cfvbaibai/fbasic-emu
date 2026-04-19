/**
 * Web Worker Entry Point for BASIC Interpreter
 *
 * This is the main entry point for the web worker that will be bundled
 * with the interpreter code. It handles incoming messages from the main
 * thread, dispatches them to the appropriate handlers, and manages the
 * interpreter lifecycle for both one-shot execution and REPL sessions.
 */

import { BasicInterpreter } from '@/core/BasicInterpreter'
import { WebWorkerDeviceAdapter } from '@/core/devices/WebWorkerDeviceAdapter'
import type { AnyServiceWorkerMessage, ClearDisplayMessage, ExecuteMessage, InputValueMessage, PlaySoundCompleteMessage, ReplClearMessage, ReplExecuteMessage, ReplRunMessage, ResultMessage, StopMessage, StrigEventMessage } from '@/core/types/worker-messages'
import { logWorker } from '@/shared/logger'

import { sendError, sendResult } from './workerMessageSenders'
import { handleSetBgData, handleSetSharedAnimationBuffer, handleSetSharedJoystickBuffer, handleSetSharedKeyboardBuffer } from './workerSharedBufferHandlers'

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
      void this.handleMessage(event.data)
    })
  }

  async handleMessage(message: AnyServiceWorkerMessage) {
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
          this.sharedAnimationBuffer = handleSetSharedAnimationBuffer(
            message, this.interpreter, this.webWorkerDeviceAdapter, this.sharedAnimationBuffer
          )
          break
        case 'SET_SHARED_JOYSTICK_BUFFER':
          handleSetSharedJoystickBuffer(message, this.webWorkerDeviceAdapter)
          break
        case 'SET_SHARED_KEYBOARD_BUFFER':
          handleSetSharedKeyboardBuffer(message, this.webWorkerDeviceAdapter)
          break
        case 'SET_BG_DATA':
          handleSetBgData(message, this.webWorkerDeviceAdapter)
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
        case 'REPL_EXECUTE':
          logWorker.debug('Handling REPL_EXECUTE message')
          await this.handleReplExecute(message)
          break
        case 'REPL_RUN':
          logWorker.debug('Handling REPL_RUN message')
          await this.handleReplRun(message)
          break
        case 'REPL_CLEAR':
          logWorker.debug('Handling REPL_CLEAR message')
          this.handleReplClear(message)
          break

        default:
          // Other message types (RESULT, PROGRESS, OUTPUT, ERROR,
          // SCREEN_UPDATE, INIT, READY) are sent FROM the worker, not
          // handled BY the worker.
          logWorker.warn('Unexpected message type:', message.type)
          break
      }
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error))
      logWorker.error('Error processing message:', err.message)
      logWorker.error('Stack trace:', err.stack ?? '(no stack available)')
      // Capture location from interpreter when available (e.g. error escaped from handleExecute)
      const location = this.interpreter?.getExecutionLocation?.() ?? null
      sendError(message.id, err, location)
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

      // Create enhanced result with execution metadata
      const enhancedResult: ResultMessage['data'] = {
        ...result,
        executionId: message.id,
        workerId: 'web-worker-1',
        spriteStates,
        spriteEnabled,
      }

      sendResult(message.id, enhancedResult)
    } catch (error) {
      this.isRunning = false
      const err = error instanceof Error ? error : new Error(String(error))
      logWorker.error('Execution error:', err.message)
      logWorker.error('Stack trace:', err.stack ?? '(no stack available)')
      const location = this.interpreter?.getExecutionLocation() ?? null
      sendError(message.id, err, location)
    }
  }

  handlePing(message: { id: string }) {
    logWorker.debug('Handling PING message')
    sendResult(message.id, {
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
    // Reject pending play complete promises so PLAY executor doesn't hang
    this.webWorkerDeviceAdapter?.rejectAllPendingRequests?.('CLEAR pressed during PLAY')
  }

  async handleReplExecute(message: ReplExecuteMessage) {
    try {
      const { statement } = message.data
      this.currentExecutionId = message.id

      if (this.webWorkerDeviceAdapter) {
        this.webWorkerDeviceAdapter.setCurrentExecutionId(message.id)
      }

      // Create interpreter if needed (fresh REPL session)
      this.interpreter ??= new BasicInterpreter({
        maxIterations: Infinity,
        maxOutputLines: Infinity,
        enableDebugMode: false,
        strictMode: false,
        deviceAdapter: this.webWorkerDeviceAdapter!,
        sharedAnimationBuffer: this.sharedAnimationBuffer ?? undefined,
      })

      // Execute the single statement
      this.isRunning = true
      const result = await this.interpreter.executeSingleStatement(statement)
      this.isRunning = false

      if (this.webWorkerDeviceAdapter) {
        this.webWorkerDeviceAdapter.setCurrentExecutionId(null)
      }

      sendResult(message.id, {
        ...result,
        executionId: message.id,
        workerId: 'web-worker-1',
      })
    } catch (error) {
      this.isRunning = false
      const err = error instanceof Error ? error : new Error(String(error))
      logWorker.error('REPL_EXECUTE error:', err.message)
      const location = this.interpreter?.getExecutionLocation() ?? null
      sendError(message.id, err, location)
    }
  }

  async handleReplRun(message: ReplRunMessage) {
    try {
      this.currentExecutionId = message.id

      if (this.webWorkerDeviceAdapter) {
        this.webWorkerDeviceAdapter.setCurrentExecutionId(message.id)
      }

      // Re-execute the stored program (creates fresh state like RUN command)
      if (!this.interpreter) {
        throw new Error('No program has been executed yet')
      }

      this.isRunning = true
      const result = await this.interpreter.runStoredProgram()
      this.isRunning = false

      if (this.webWorkerDeviceAdapter) {
        this.webWorkerDeviceAdapter.setCurrentExecutionId(null)
      }

      const spriteStates = this.interpreter.getSpriteStates()
      const spriteEnabled = this.interpreter.isSpriteEnabled()

      sendResult(message.id, {
        ...result,
        executionId: message.id,
        workerId: 'web-worker-1',
        spriteStates,
        spriteEnabled,
      })
    } catch (error) {
      this.isRunning = false
      const err = error instanceof Error ? error : new Error(String(error))
      logWorker.error('REPL_RUN error:', err.message)
      sendError(message.id, err, null)
    }
  }

  handleReplClear(_message: ReplClearMessage) {
    // Clear screen without terminating the interpreter (REPL CLS)
    this.interpreter?.getContext()?.clearScreen()
  }

  handleStrigEvent(message: StrigEventMessage) {
    const { joystickId, state } = message.data

    // Update the WebWorkerDeviceAdapter directly
    if (this.webWorkerDeviceAdapter) {
      this.webWorkerDeviceAdapter.pushStrigState(joystickId, state)
    }
  }
}

// Initialize web worker interpreter
new WebWorkerInterpreter()
