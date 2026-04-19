/**
 * Unit tests for useReplWorkerAdapter composable.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { ExecutionResult } from '@/core/types/execution-types'

import type { MockWorkerLike } from '../helpers/mockWorker'
import { createMockWorkerClass } from '../helpers/mockWorker'

// Mock logger to suppress debug output
vi.mock('@/shared/logger', () => ({
  logComposable: {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

import type { WebWorkerManager } from '@/features/ide/composables/useBasicIdeWebWorkerUtils'
import { createReplWorkerAdapter } from '@/features/ide/composables/useReplWorkerAdapter'

describe('createReplWorkerAdapter', () => {
  let worker: MockWorkerLike
  let webWorkerManager: WebWorkerManager
  let savedWorker: typeof globalThis.Worker | undefined

  function createWebWorkerManager(workerInstance: MockWorkerLike): WebWorkerManager {
    return {
      // eslint-disable-next-line no-restricted-syntax
      worker: workerInstance as unknown as Worker,
      messageId: 0,
      pendingMessages: new Map(),
    }
  }

  function installMockWorker(): MockWorkerLike {
    const mockClass = createMockWorkerClass()
     
    const instance = new mockClass()
    worker = instance
    webWorkerManager = createWebWorkerManager(instance)
    return instance
  }

  beforeEach(() => {
    savedWorker = globalThis.Worker
    installMockWorker()
  })

  afterEach(() => {
    if (savedWorker !== undefined) {
      globalThis.Worker = savedWorker
    }
  })

  it('isReplReady returns false initially', () => {
    const { adapter } = createReplWorkerAdapter(webWorkerManager)

    expect(adapter.isReplReady()).toBe(false)
  })

  it('isReplReady returns true after markReplReady', () => {
    const { adapter, markReplReady } = createReplWorkerAdapter(webWorkerManager)

    markReplReady()

    expect(adapter.isReplReady()).toBe(true)
  })

  it('isReplReady returns false after markReplNotReady', () => {
    const { adapter, markReplReady, markReplNotReady } = createReplWorkerAdapter(webWorkerManager)

    markReplReady()
    markReplNotReady()

    expect(adapter.isReplReady()).toBe(false)
  })

  it('replExecute posts REPL_EXECUTE message', () => {
    const { adapter } = createReplWorkerAdapter(webWorkerManager)

    void adapter.replExecute('PRINT "Hello"')

    expect(worker.postedMessages.length).toBe(1)
    const msg = worker.postedMessages[0] as { type: string; data: { statement: string } }
    expect(msg.type).toBe('REPL_EXECUTE')
    expect(msg.data.statement).toBe('PRINT "Hello"')
  })

  it('replExecute uses sendMessageToWorker which tracks pending messages', () => {
    const { adapter } = createReplWorkerAdapter(webWorkerManager)

    const promise = adapter.replExecute('PRINT "Hello"')

    // The promise is tracked in pendingMessages
    expect(webWorkerManager.pendingMessages.size).toBe(1)
    // Don't wait for it - it will timeout eventually, but we just want to verify the message was sent
    void promise
  })

  it('replRun posts REPL_RUN message', () => {
    const { adapter } = createReplWorkerAdapter(webWorkerManager)

    void adapter.replRun()

    expect(worker.postedMessages.length).toBe(1)
    const msg = worker.postedMessages[0] as { type: string }
    expect(msg.type).toBe('REPL_RUN')
  })

  it('replClear posts REPL_CLEAR message', async () => {
    const { adapter } = createReplWorkerAdapter(webWorkerManager)

    await adapter.replClear()

    expect(worker.postedMessages.length).toBe(1)
    const msg = worker.postedMessages[0] as { type: string }
    expect(msg.type).toBe('REPL_CLEAR')
  })

  it('replClear does nothing when worker is null', async () => {
    webWorkerManager.worker = null
    const { adapter } = createReplWorkerAdapter(webWorkerManager)

    await adapter.replClear()

    expect(worker.postedMessages.length).toBe(0)
  })

  it('replExecute resolves when RESULT message is received', async () => {
    const { adapter } = createReplWorkerAdapter(webWorkerManager)

    const promise = adapter.replExecute('PRINT "Hello"')

    // Simulate RESULT response from worker
    const msg = worker.postedMessages[0] as { id: string }
    const resultData: ExecutionResult = {
      success: true,
      errors: [],
      variables: new Map(),
      executionTime: 5,
    }
    // Manually resolve the pending message (simulating what handleWorkerMessage does)
    const pending = webWorkerManager.pendingMessages.get(msg.id)
    expect(pending).toBeDefined()
    pending!.resolve(resultData)

    const result = await promise
    expect(result.success).toBe(true)
  })

  it('replExecute rejects when ERROR message is received', async () => {
    const { adapter } = createReplWorkerAdapter(webWorkerManager)

    const promise = adapter.replExecute('INVALID')

    // Simulate ERROR response
    const msg = worker.postedMessages[0] as { id: string }
    const pending = webWorkerManager.pendingMessages.get(msg.id)
    expect(pending).toBeDefined()
    pending!.reject(new Error('syntax error'))

    await expect(promise).rejects.toThrow('syntax error')
  })
})
