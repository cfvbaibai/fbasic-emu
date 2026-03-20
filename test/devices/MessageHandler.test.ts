import { afterEach, describe, expect, it, vi } from 'vitest'

import { MessageHandler, type PendingMessage } from '@/core/devices/MessageHandler'
import type { AnyServiceWorkerMessage, ExecutionResult } from '@/core/interfaces'

function createResultMessage(id: string, data: ResultMessageData): AnyServiceWorkerMessage {
  return {
    type: 'RESULT',
    id,
    timestamp: Date.now(),
    data,
  }
}

type ResultMessageData = ExecutionResult & {
  executionId: string
  workerId?: string
}

function createBaseResult(overrides: Partial<ResultMessageData> = {}): ResultMessageData {
  return {
    success: true,
    errors: [],
    variables: new Map(),
    executionTime: 5,
    executionId: 'exec-1',
    ...overrides,
  }
}

describe('MessageHandler', () => {
  const timeouts: NodeJS.Timeout[] = []

  afterEach(() => {
    for (const timeout of timeouts) {
      clearTimeout(timeout)
    }
    timeouts.length = 0
  })

  function setupPending(id: string) {
    const pendingMessages = new Map<string, PendingMessage>()
    const resolve = vi.fn()
    const reject = vi.fn()
    const timeout = setTimeout(() => {}, 30_000)
    timeouts.push(timeout)
    pendingMessages.set(id, { resolve, reject, timeout })
    const handler = new MessageHandler(pendingMessages)
    return { handler, pendingMessages, resolve, reject }
  }

  it('rejects RESULT when worker marks unsupported feature', () => {
    const messageId = 'msg-unsupported'
    const { handler, pendingMessages, resolve, reject } = setupPending(messageId)

    handler.handleWorkerMessage(
      createResultMessage(
        messageId,
        createBaseResult({
          success: false,
          errors: [{ line: 10, message: 'Unsupported statement type', type: 'RUNTIME', code: 'UNSUPPORTED_FEATURE' }],
        })
      )
    )

    expect(resolve).not.toHaveBeenCalled()
    expect(reject).toHaveBeenCalledTimes(1)
    expect(reject.mock.calls[0]?.[0]).toBeInstanceOf(Error)
    expect((reject.mock.calls[0]?.[0] as Error).message).toContain('falling back to main thread')
    expect(pendingMessages.has(messageId)).toBe(false)
  })

  it('rejects ERROR messages as normal error handling', () => {
    const messageId = 'msg-error'
    const { handler, pendingMessages, resolve, reject } = setupPending(messageId)

    const errorMessage: AnyServiceWorkerMessage = {
      type: 'ERROR',
      id: messageId,
      timestamp: Date.now(),
      data: {
        executionId: 'exec-2',
        message: 'Worker execution failed',
        errorType: 'execution',
        recoverable: true,
      },
    }

    handler.handleWorkerMessage(errorMessage)

    expect(resolve).not.toHaveBeenCalled()
    expect(reject).toHaveBeenCalledTimes(1)
    expect((reject.mock.calls[0]?.[0] as Error).message).toBe('Worker execution failed')
    expect(pendingMessages.has(messageId)).toBe(false)
  })

  it('resolves valid RESULT messages unchanged', () => {
    const messageId = 'msg-result'
    const { handler, pendingMessages, resolve, reject } = setupPending(messageId)
    const result = createBaseResult({ success: true, executionTime: 12 })

    handler.handleWorkerMessage(createResultMessage(messageId, result))

    expect(reject).not.toHaveBeenCalled()
    expect(resolve).toHaveBeenCalledTimes(1)
    expect(resolve).toHaveBeenCalledWith(result)
    expect(pendingMessages.has(messageId)).toBe(false)
  })
})
