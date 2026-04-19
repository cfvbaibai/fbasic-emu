/**
 * Worker Message Senders
 *
 * Constructs and posts response messages from the web worker back to the main thread.
 * These are pure functions that receive the data needed to build messages — they do
 * not depend on class state, making them independently testable and reusable.
 */

import type { ErrorMessage, OutputMessage, ResultMessage } from '@/core/types/worker-messages'
import { logWorker } from '@/shared/logger'

/**
 * Send an output message (print, debug, error) to the main thread.
 *
 * @param currentExecutionId - The active execution ID, or null to suppress output.
 * @param output - The text content to send.
 * @param outputType - The category of output being sent.
 */
export function sendOutput(
  currentExecutionId: string | null,
  output: string,
  outputType: 'print' | 'debug' | 'error'
): void {
  if (!currentExecutionId) return

  const message: OutputMessage = {
    type: 'OUTPUT',
    id: `output-${Date.now()}`,
    timestamp: Date.now(),
    data: {
      executionId: currentExecutionId,
      output,
      outputType,
      timestamp: Date.now(),
    },
  }
  logWorker.debug('Sending OUTPUT message:', {
    outputType,
    outputLength: output.length,
    executionId: currentExecutionId,
  })
  self.postMessage(message)
}

/**
 * Send a result message (execution complete) to the main thread.
 *
 * @param messageId - The correlation ID for this result.
 * @param result - The execution result data to send.
 */
export function sendResult(messageId: string, result: ResultMessage['data']): void {
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

/**
 * Send an error message to the main thread.
 *
 * @param messageId - The correlation ID for this error.
 * @param error - The error to report.
 * @param location - Optional source location where the error occurred.
 */
export function sendError(
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
