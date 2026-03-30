/**
 * Message Handler
 *
 * Handles messages from web workers and routes them appropriately.
 */

import type { ExecutionResult } from '@/core/types/execution-types'
import type { AnyServiceWorkerMessage, OutputMessage } from '@/core/types/worker-messages'
import { logIdeMessages } from '@/shared/logger'

export interface PendingMessage {
  resolve: (result: ExecutionResult) => void
  reject: (error: Error) => void
  timeout: NodeJS.Timeout
}

export class MessageHandler {
  constructor(private pendingMessages: Map<string, PendingMessage>) {}

  /**
   * Handle messages from the web worker
   */
  handleWorkerMessage(message: AnyServiceWorkerMessage, onOutput?: (message: OutputMessage) => void): void {
    logIdeMessages.debug('Processing worker message:', {
      type: message.type,
      id: message.id,
      timestamp: message.timestamp,
    })

    // Handle OUTPUT messages separately as they don't have pending message IDs
    if (message.type === 'OUTPUT') {
      logIdeMessages.debug('Handling OUTPUT message:', {
        outputType: message.data.outputType,
        outputLength: message.data.output.length,
      })
      if (onOutput) {
        onOutput(message)
      }
      return
    }

    // SCREEN_UPDATE messages are handled by the composable directly via worker.onmessage
    // They don't need to be processed here, just pass through
    if (message.type === 'SCREEN_UPDATE') {
      const screenMessage = message as { data: { updateType: string } }
      logIdeMessages.debug('SCREEN_UPDATE message received (handled by composable):', {
        updateType: screenMessage.data.updateType,
      })
      return
    }

    const pending = this.pendingMessages.get(message.id)
    if (!pending) {
      logIdeMessages.warn('No pending message found for ID:', message.id)
      return
    }

    logIdeMessages.debug('Found pending message for ID:', message.id)
    // -- Only handling response messages, not request messages
    // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
    switch (message.type) {
      case 'RESULT': {
        const resultMessage = message
        logIdeMessages.debug('Received RESULT message:', {
          success: resultMessage.data.success,
          executionTime: resultMessage.data.executionTime,
        })
        clearTimeout(pending.timeout)
        this.pendingMessages.delete(message.id)

        // Use machine-readable unsupported-feature signal from worker errors for fallback.
        if (resultMessage.data.errors?.some(error => error.code === 'UNSUPPORTED_FEATURE')) {
          logIdeMessages.warn('Web worker indicates fallback needed, rejecting to trigger fallback')
          // Web worker can't handle the execution, reject to trigger fallback
          pending.reject(new Error('Web worker execution not implemented, falling back to main thread'))
        } else {
          logIdeMessages.debug('Web worker result is valid, resolving pending promise')
          pending.resolve(resultMessage.data)
        }
        break
      }

      case 'ERROR': {
        const errorMessage = message
        logIdeMessages.debug('Received ERROR message:', {
          message: errorMessage.data.message,
          errorType: errorMessage.data.errorType,
          recoverable: errorMessage.data.recoverable,
        })
        clearTimeout(pending.timeout)
        this.pendingMessages.delete(message.id)
        logIdeMessages.debug('Rejecting pending promise due to error')
        pending.reject(new Error(errorMessage.data.message))
        break
      }

      case 'PROGRESS': {
        // Handle progress updates if needed
        const progressMessage = message
        logIdeMessages.debug('Received PROGRESS message:', {
          progress: progressMessage.data.progress,
        })
        // Could emit progress events here
        break
      }

      default:
        // Other message types (EXECUTE, STOP, STRIG_EVENT, STICK_EVENT, INIT, READY)
        // are requests sent to the worker, not responses handled here
        logIdeMessages.warn('Unexpected message type:', message.type)
        break
    }
  }

  /**
   * Reject all pending messages (cleanup)
   */
  rejectAllPending(reason: string): void {
    for (const [_id, pending] of this.pendingMessages) {
      clearTimeout(pending.timeout)
      pending.reject(new Error(reason))
    }
    this.pendingMessages.clear()
  }
}
