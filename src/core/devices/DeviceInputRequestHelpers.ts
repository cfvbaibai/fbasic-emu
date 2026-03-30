/**
 * Device Input Request Helpers
 *
 * Standalone functions for input request handling in WebWorkerDeviceAdapter.
 * Extracted from WebWorkerDeviceAdapter.ts for modularity.
 *
 * Handles: INPUT/LINPUT request/response lifecycle.
 */

import type { InputValueMessage } from '@/core/types/worker-messages'

// ============================================================================
// Input Request State
// ============================================================================

interface PendingInputRequest {
  resolve: (values: string[]) => void
  reject: (err: Error) => void
}

/**
 * Create a new input requests map.
 */
export function createInputRequestsMap(): Map<string, PendingInputRequest> {
  return new Map()
}

/**
 * Create an input request and post REQUEST_INPUT to main thread.
 * Returns a promise that resolves with the input values or rejects on cancel/error.
 */
export function createInputRequest(
  pendingInputRequests: Map<string, PendingInputRequest>,
  executionId: string,
  prompt: string,
  variableCount: number,
  isLinput: boolean
): Promise<string[]> {
  const requestId = `input-${Date.now()}-${Math.random().toString(36).slice(2)}`

  const promise = new Promise<string[]>((resolve, reject) => {
    pendingInputRequests.set(requestId, { resolve, reject })
  })

  self.postMessage({
    type: 'REQUEST_INPUT',
    id: requestId,
    timestamp: Date.now(),
    data: { requestId, executionId, prompt, variableCount, isLinput },
  })

  return promise
}

/**
 * Handle an INPUT_VALUE message from main thread.
 * Resolves or rejects the matching pending request.
 */
export function handleInputValueMessage(
  pendingInputRequests: Map<string, PendingInputRequest>,
  message: InputValueMessage
): void {
  const { requestId, values, cancelled } = message.data
  const pending = pendingInputRequests.get(requestId)
  pendingInputRequests.delete(requestId)
  if (!pending) return
  if (cancelled) {
    pending.reject(new Error('Input cancelled'))
  } else {
    pending.resolve(values)
  }
}

/**
 * Reject all pending input requests (e.g., when STOP is pressed).
 */
export function rejectAllInputRequests(
  pendingInputRequests: Map<string, PendingInputRequest>,
  reason: string = 'Execution stopped'
): void {
  for (const [, pending] of pendingInputRequests) {
    pending.reject(new Error(reason))
  }
  pendingInputRequests.clear()
}
