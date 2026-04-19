/**
 * Web Worker Manager
 *
 * Handles web worker lifecycle, initialization, and communication.
 * Uses Vite's native worker bundling with ?worker suffix pattern.
 */

import { DEFAULTS } from '@/core/constants'
import type { ExecutionResult, InterpreterConfig } from '@/core/types/execution-types'
import type { AnyServiceWorkerMessage, ExecuteMessage, ReplClearMessage, ReplExecuteMessage, ReplRunMessage, SetBgDataMessage, StopMessage } from '@/core/types/worker-messages'
import { logWorker } from '@/shared/logger'

export interface WebWorkerExecutionOptions {
  onProgress?: (iterationCount: number, currentStatement?: string) => void
  onError?: (error: Error) => void
  timeout?: number
}

interface PendingMessageEntry {
  resolve: (result: ExecutionResult) => void
  reject: (error: Error) => void
  timeout: NodeJS.Timeout
}

export class WebWorkerManager {
  private worker: Worker | null = null
  private messageId = 0
  private _replReady = false
  private pendingMessages = new Map<string, PendingMessageEntry>()

  /**
   * Check if web workers are supported
   */
  static isSupported(): boolean {
    const supported = typeof Worker !== 'undefined'
    logWorker.debug('isSupported check:', {
      hasWorker: typeof Worker !== 'undefined',
      supported,
    })
    return supported
  }

  /**
   * Check if we're currently running in a web worker context
   */
  static isInWebWorker(): boolean {
    const inWebWorker = typeof window === 'undefined' && typeof self !== 'undefined'
    logWorker.debug('isInWebWorker check:', {
      hasWindow: typeof window !== 'undefined',
      hasSelf: typeof self !== 'undefined',
      inWebWorker,
    })
    return inWebWorker
  }

  /**
   * Initialize the web worker
   * @param _workerScript - Ignored (kept for API compatibility). Uses Vite-bundled worker.
   */
  async initialize(_workerScript?: string): Promise<void> {
    logWorker.debug('WebWorkerManager.initialize called')
    if (!WebWorkerManager.isSupported()) {
      logWorker.error('Web workers are not supported in this environment')
      throw new Error('Web workers are not supported in this environment')
    }

    if (this.worker) {
      logWorker.debug('Worker already initialized')
      return // Already initialized
    }

    // Vite bundles the worker automatically with ?worker suffix pattern
    // workerScript parameter is ignored (kept for API compatibility)
    logWorker.debug('Creating worker using Vite ?worker pattern')

    try {
      this.worker = new Worker(
        new URL('../workers/WebWorkerInterpreter.ts?worker', import.meta.url),
        { type: 'module' }
      )
      logWorker.debug('Worker created successfully')
    } catch (error) {
      logWorker.error('Failed to create worker:', error)
      throw error
    }

    // Handle worker errors
    this.worker.onerror = error => {
      logWorker.error('Web worker error:', error)
      this._replReady = false
      this.rejectAllPending(`Web worker error: ${error.message}`)
    }

    // Handle worker termination
    this.worker.onmessageerror = error => {
      logWorker.error('Web worker message error:', error)
      this.rejectAllPending('Web worker message error')
    }

    logWorker.debug('Worker initialization completed successfully')
  }

  /**
   * Execute BASIC code in the web worker
   */
  async executeInWorker(
    code: string,
    config: InterpreterConfig,
    options: WebWorkerExecutionOptions = {},
    onMessage?: (message: AnyServiceWorkerMessage) => void
  ): Promise<ExecutionResult> {
    logWorker.debug(`executeInWorker called with code: ${code.substring(0, 50)}...`)
    if (!this.worker) {
      logWorker.debug('Worker not initialized, initializing...')
      await this.initialize()
    }

    if (!this.worker) {
      throw new Error('Failed to initialize web worker')
    }

    const messageId = (++this.messageId).toString()
    const timeout = options.timeout ?? DEFAULTS.WEB_WORKER.MESSAGE_TIMEOUT
    logWorker.debug('Sending message with ID:', messageId, 'timeout:', timeout)

    return new Promise<ExecutionResult>((resolve, reject) => {
      // Set up timeout
      const timeoutHandle = setTimeout(() => {
        logWorker.warn('Web worker timeout after', timeout, 'ms for message ID:', messageId)
        this.pendingMessages.delete(messageId)
        reject(new Error(`Web worker execution timeout after ${timeout}ms`))
      }, timeout)

      // Store pending message with REPL-ready tracking
      this.pendingMessages.set(messageId, {
        resolve: (result) => {
          this._replReady = true
          resolve(result)
        },
        reject: (error) => {
          // Execution errors from the worker preserve interpreter state,
          // so REPL remains ready. Infrastructure failures (timeout, terminated)
          // do not set REPL ready — those are handled by onerror/terminate.
          const isInfrastructureError =
            error.message.includes('timeout') ||
            error.message.includes('terminated') ||
            error.message.includes('not supported') ||
            error.message.includes('not supported in this environment')
          if (!isInfrastructureError) {
            this._replReady = true
          }
          reject(error)
        },
        timeout: timeoutHandle,
      })

      // Send execution message
      const message: ExecuteMessage = {
        type: 'EXECUTE',
        id: messageId,
        timestamp: Date.now(),
        data: {
          code,
          config,
          options: {
            timeout,
            enableProgress: options.onProgress !== undefined,
          },
        },
      }

      // Set up message listener if provided (must be done before sending message)
      if (onMessage && this.worker) {
        this.worker.onmessage = event => {
          const message = event.data as AnyServiceWorkerMessage
          onMessage(message)
        }
      }

      logWorker.debug('Posting message to worker:', {
        type: message.type,
        id: message.id,
        timestamp: message.timestamp,
        dataSize: JSON.stringify(message.data).length,
        hasDeviceAdapter: !!config.deviceAdapter,
      })
      if (this.worker) {
        this.worker.postMessage(message)
      }
      logWorker.debug('Message posted to worker successfully')
    })
  }

  /**
   * Stop execution in the web worker
   */
  stopExecution(): void {
    if (!this.worker) return

    const message: StopMessage = {
      type: 'STOP',
      id: 'stop',
      timestamp: Date.now(),
      data: {
        executionId: 'current',
        reason: 'user_request',
      },
    }

    logWorker.debug('Posting STOP message to worker:', {
      type: message.type,
      id: message.id,
      timestamp: message.timestamp,
      reason: message.data.reason,
    })
    this.worker.postMessage(message)
    logWorker.debug('STOP message posted to worker successfully')
  }

  /**
   * Send a message to the web worker
   */
  sendMessage(message: AnyServiceWorkerMessage): void {
    if (this.worker) {
      this.worker.postMessage(message)
    }
  }

  /**
   * Send BG grid data to the web worker (for VIEW command)
   */
  sendBgData(grid: Array<Array<{ charCode: number; colorPattern: number }>>): void {
    if (!this.worker) {
      logWorker.warn('[WebWorkerManager] Cannot send BG data: worker not initialized')
      return
    }

    const message: SetBgDataMessage = {
      type: 'SET_BG_DATA',
      id: `bg-data-${Date.now()}`,
      timestamp: Date.now(),
      data: { grid },
    }

    logWorker.debug('[WebWorkerManager] Sending SET_BG_DATA message, grid size =', grid.length, 'x', grid[0]?.length ?? 0)
    this.worker.postMessage(message)
  }

  /**
   * Check if the worker has a persistent interpreter ready for REPL mode.
   * Returns true after a program has been executed (successfully or with error),
   * false before first execution or after terminate/error.
   */
  isReplReady(): boolean {
    return this._replReady
  }

  /**
   * Execute a single REPL statement in the web worker.
   * Requires the worker to be initialized.
   */
  async replExecute(
    statement: string,
    options: { timeout?: number } = {}
  ): Promise<ExecutionResult> {
    if (!this.worker) {
      throw new Error('Worker not initialized')
    }

    const messageId = (++this.messageId).toString()
    const timeout = options.timeout ?? DEFAULTS.WEB_WORKER.MESSAGE_TIMEOUT

    return new Promise<ExecutionResult>((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        logWorker.warn('REPL_EXECUTE timeout after', timeout, 'ms')
        this.pendingMessages.delete(messageId)
        reject(new Error(`REPL_EXECUTE timeout after ${timeout}ms`))
      }, timeout)

      this.pendingMessages.set(messageId, {
        resolve: (result) => { resolve(result) },
        reject: (error) => { reject(error) },
        timeout: timeoutHandle,
      })

      this.ensureReplMessageHandler()

      const message: ReplExecuteMessage = {
        type: 'REPL_EXECUTE',
        id: messageId,
        timestamp: Date.now(),
        data: { statement },
      }

      logWorker.debug('Posting REPL_EXECUTE message:', { id: messageId, statement })
      this.worker!.postMessage(message)
    })
  }

  /**
   * Re-run the stored program in the web worker (REPL RUN).
   * Requires the worker to be initialized.
   */
  async replRun(options: { timeout?: number } = {}): Promise<ExecutionResult> {
    if (!this.worker) {
      throw new Error('Worker not initialized')
    }

    const messageId = (++this.messageId).toString()
    const timeout = options.timeout ?? DEFAULTS.WEB_WORKER.MESSAGE_TIMEOUT

    return new Promise<ExecutionResult>((resolve, reject) => {
      const timeoutHandle = setTimeout(() => {
        logWorker.warn('REPL_RUN timeout after', timeout, 'ms')
        this.pendingMessages.delete(messageId)
        reject(new Error(`REPL_RUN timeout after ${timeout}ms`))
      }, timeout)

      this.pendingMessages.set(messageId, {
        resolve: (result) => { resolve(result) },
        reject: (error) => { reject(error) },
        timeout: timeoutHandle,
      })

      this.ensureReplMessageHandler()

      const message: ReplRunMessage = {
        type: 'REPL_RUN',
        id: messageId,
        timestamp: Date.now(),
        data: {},
      }

      logWorker.debug('Posting REPL_RUN message:', { id: messageId })
      this.worker!.postMessage(message)
    })
  }

  /**
   * Clear the screen without terminating the interpreter (REPL CLS).
   * Requires the worker to be initialized.
   */
  async replClear(): Promise<void> {
    if (!this.worker) {
      throw new Error('Worker not initialized')
    }

    const message: ReplClearMessage = {
      type: 'REPL_CLEAR',
      id: `repl-clear-${Date.now()}`,
      timestamp: Date.now(),
      data: {},
    }

    logWorker.debug('Posting REPL_CLEAR message')
    this.worker.postMessage(message)
  }

  /**
   * Terminate the web worker
   */
  terminate(): void {
    if (this.worker) {
      this.worker.terminate()
      this.worker = null
      this._replReady = false
      this.rejectAllPending('Web worker terminated')
    }
  }

  /**
   * Get the worker instance (for setting up message listeners)
   */
  getWorker(): Worker | null {
    return this.worker
  }

  /**
   * Get pending messages map (for use by MessageHandler)
   */
  getPendingMessages(): Map<
    string,
    {
      resolve: (result: ExecutionResult) => void
      reject: (error: Error) => void
      timeout: NodeJS.Timeout
    }
  > {
    return this.pendingMessages
  }

  /**
   * Reject all pending messages (cleanup)
   */
  private rejectAllPending(reason: string): void {
    for (const [_id, pending] of this.pendingMessages) {
      clearTimeout(pending.timeout)
      pending.reject(new Error(reason))
    }
    this.pendingMessages.clear()
  }

  /**
   * Ensure the worker has an onmessage handler that resolves pending messages
   * from RESULT/ERROR responses. Only installs if no handler is already set
   * (e.g., by executeInWorker's onMessage callback).
   */
  private ensureReplMessageHandler(): void {
    if (!this.worker || this.worker.onmessage) return

    this.worker.onmessage = (event: MessageEvent) => {
      const message = event.data as AnyServiceWorkerMessage
      if (message.type === 'RESULT') {
        const resultMessage = message
        const pending = this.pendingMessages.get(resultMessage.id)
        if (pending) {
          clearTimeout(pending.timeout)
          this.pendingMessages.delete(resultMessage.id)
          pending.resolve(resultMessage.data)
        }
      } else if (message.type === 'ERROR') {
        const errorMessage = message
        const pending = this.pendingMessages.get(errorMessage.id)
        if (pending) {
          clearTimeout(pending.timeout)
          this.pendingMessages.delete(errorMessage.id)
          pending.reject(new Error(errorMessage.data.message))
        }
      }
    }
  }
}
