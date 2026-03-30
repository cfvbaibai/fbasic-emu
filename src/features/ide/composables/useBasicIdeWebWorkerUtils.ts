/**
 * Web worker management utilities for BASIC IDE
 */

import { DEFAULTS, ERROR_MESSAGES } from '@/core/constants'
import type { ExecutionResult } from '@/core/types/execution-types'
import type { AnyServiceWorkerMessage } from '@/core/types/worker-messages'
import { logComposable } from '@/shared/logger'

export interface WebWorkerManager {
  worker: Worker | null
  messageId: number
  pendingMessages: Map<
    string,
    {
      resolve: (result: ExecutionResult) => void
      reject: (error: Error) => void
      timeout: NodeJS.Timeout
    }
  >
}

/**
 * Initialize web worker
 */
export async function initializeWebWorker(
  webWorkerManager: WebWorkerManager,
  onMessage: (message: AnyServiceWorkerMessage) => void,
  sharedAnimationBuffer: SharedArrayBuffer,
  sharedJoystickBuffer?: SharedArrayBuffer,
  sharedKeyboardBuffer?: SharedArrayBuffer
): Promise<void> {
  if (webWorkerManager.worker) {
    logComposable.debug('Web worker already initialized')
    return
  }

  try {
    logComposable.debug('Initializing web worker...')
    // Vite bundles this automatically with the ?worker suffix pattern
    webWorkerManager.worker = new Worker(
      new URL('../../../core/workers/WebWorkerInterpreter.ts?worker', import.meta.url),
      { type: 'module' }
    )

    // Set up message handling
    webWorkerManager.worker.onmessage = event => {
      onMessage(event.data)
    }

    webWorkerManager.worker.onerror = error => {
      logComposable.error('Web worker error:', error)
      rejectAllPendingMessages(webWorkerManager, `Web worker error: ${error.message}`)
      // Restart web worker on error
      void restartWebWorker(webWorkerManager, onMessage, sharedAnimationBuffer)
    }

    webWorkerManager.worker.onmessageerror = error => {
      logComposable.error('Web worker message error:', error)
      rejectAllPendingMessages(webWorkerManager, 'Web worker message error')
      void restartWebWorker(webWorkerManager, onMessage, sharedAnimationBuffer)
    }

    webWorkerManager.worker.postMessage({
      type: 'SET_SHARED_ANIMATION_BUFFER',
      id: `init-buffer-${Date.now()}`,
      timestamp: Date.now(),
      data: { buffer: sharedAnimationBuffer },
    })

    if (sharedJoystickBuffer) {
      webWorkerManager.worker.postMessage({
        type: 'SET_SHARED_JOYSTICK_BUFFER',
        id: `init-joystick-${Date.now()}`,
        timestamp: Date.now(),
        data: { buffer: sharedJoystickBuffer },
      })
      logComposable.debug('Shared joystick buffer sent to worker')
    }

    if (sharedKeyboardBuffer) {
      webWorkerManager.worker.postMessage({
        type: 'SET_SHARED_KEYBOARD_BUFFER',
        id: `init-keyboard-${Date.now()}`,
        timestamp: Date.now(),
        data: { buffer: sharedKeyboardBuffer },
      })
      logComposable.debug('Shared keyboard buffer sent to worker')
    }

    logComposable.debug('Web worker initialized successfully')
  } catch (error) {
    logComposable.error('Failed to initialize web worker:', error)
    throw error
  }
}

/**
 * Restart web worker
 */
export async function restartWebWorker(
  webWorkerManager: WebWorkerManager,
  onMessage: (message: AnyServiceWorkerMessage) => void,
  sharedAnimationBuffer: SharedArrayBuffer
): Promise<void> {
  logComposable.debug('Restarting web worker...')

  if (webWorkerManager.worker) {
    webWorkerManager.worker.terminate()
    webWorkerManager.worker = null
  }

  rejectAllPendingMessages(webWorkerManager, 'Web worker restarted')
  await new Promise(resolve => setTimeout(resolve, 100))
  await initializeWebWorker(webWorkerManager, onMessage, sharedAnimationBuffer)
}

/**
 * Check web worker health
 */
export async function checkWebWorkerHealth(
  webWorkerManager: WebWorkerManager,
  sendMessageToWorkerFn: (message: AnyServiceWorkerMessage) => Promise<ExecutionResult>
): Promise<boolean> {
  if (!webWorkerManager.worker) {
    return false
  }

  try {
    // Send PING; worker responds with RESULT (no BASIC execution, no user-visible output)
    await sendMessageToWorkerFn({
      type: 'PING',
      id: `ping-${Date.now()}`,
      timestamp: Date.now(),
      data: {},
    })

    return true
  } catch (error) {
    logComposable.warn('Web worker health check failed:', error)
    return false
  }
}

/**
 * Reject all pending messages
 */
export function rejectAllPendingMessages(webWorkerManager: WebWorkerManager, reason: string): void {
  logComposable.debug('Rejecting all pending messages:', reason)
  for (const [_messageId, pending] of webWorkerManager.pendingMessages) {
    clearTimeout(pending.timeout)
    pending.reject(new Error(reason))
  }
  webWorkerManager.pendingMessages.clear()
}

/** Default timeout (ms) when execution is waiting for INPUT/LINPUT. */
const INPUT_WAIT_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes

/**
 * Extend the timeout for an execution that is waiting for user input (REQUEST_INPUT).
 * Prevents WORKER_TIMEOUT error while the user fills INPUT/LINPUT prompts.
 */
export function extendExecutionTimeout(
  webWorkerManager: WebWorkerManager,
  executionId: string,
  durationMs: number = INPUT_WAIT_TIMEOUT_MS
): void {
  const pending = webWorkerManager.pendingMessages.get(executionId)
  if (!pending) return
  clearTimeout(pending.timeout)
  pending.timeout = setTimeout(() => {
    logComposable.debug('Message timeout (after input wait):', executionId)
    webWorkerManager.pendingMessages.delete(executionId)
    pending.reject(new Error(ERROR_MESSAGES.WORKER_TIMEOUT))
  }, durationMs)
}

/**
 * Send message to web worker and return promise
 */
export function sendMessageToWorker(
  message: AnyServiceWorkerMessage,
  webWorkerManager: WebWorkerManager
): Promise<ExecutionResult> {
  return new Promise((resolve, reject) => {
    if (!webWorkerManager.worker) {
      reject(new Error('Web worker not initialized'))
      return
    }

    const _messageId = (++webWorkerManager.messageId).toString()
    const messageWithId = { ...message, id: _messageId }

    const timeoutMs =
      message.type === 'EXECUTE'
        ? DEFAULTS.WEB_WORKER.EXECUTION_TIMEOUT
        : DEFAULTS.WEB_WORKER.MESSAGE_TIMEOUT

    const timeout = setTimeout(() => {
      logComposable.debug('Message timeout:', _messageId)
      webWorkerManager.pendingMessages.delete(_messageId)
      reject(new Error(ERROR_MESSAGES.WORKER_TIMEOUT))
    }, timeoutMs)

    // Store pending message
    webWorkerManager.pendingMessages.set(_messageId, {
      resolve,
      reject,
      timeout,
    })

    logComposable.debug('Sending message to worker:', messageWithId.type, _messageId)
    logComposable.debug('Pending messages count:', webWorkerManager.pendingMessages.size)
    webWorkerManager.worker.postMessage(messageWithId)
  })
}

/**
 * Send BG grid data to web worker (for VIEW command)
 */
export function sendBgData(
  grid: Array<Array<{ charCode: number; colorPattern: number }>>,
  webWorkerManager: WebWorkerManager
): void {
  if (!webWorkerManager.worker) {
    logComposable.warn('[sendBgData] Web worker not initialized')
    return
  }

  webWorkerManager.worker.postMessage({
    type: 'SET_BG_DATA',
    id: `bg-data-${Date.now()}`,
    timestamp: Date.now(),
    data: { grid },
  })

  logComposable.debug('[sendBgData] BG grid data sent to worker, size =', grid.length, 'x', grid[0]?.length ?? 0)
}
