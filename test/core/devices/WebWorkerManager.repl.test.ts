/**
 * Unit tests for WebWorkerManager — REPL-specific tests.
 * Core lifecycle and message tests live in WebWorkerManager.test.ts.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock logger to suppress debug output
vi.mock('@/shared/logger', () => ({
  logWorker: {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

// Must import after mocks are set up
import { WebWorkerManager } from '@/core/devices/WebWorkerManager'
import type { MockWorkerLike } from '../../helpers/mockWorker'
import { createMockWorkerClass } from '../../helpers/mockWorker'

describe('WebWorkerManager REPL', () => {
  let manager: WebWorkerManager
  let savedWorker: typeof globalThis.Worker | undefined

  beforeEach(() => {
    manager = new WebWorkerManager()
    savedWorker = globalThis.Worker
  })

  afterEach(() => {
    manager.terminate()
    if (savedWorker !== undefined) {
      globalThis.Worker = savedWorker
    }
  })

  /**
   * Install a mock Worker and return a tracker for the last instance.
   */
  function installMockWorker(): { getLastInstance: () => MockWorkerLike | null } {
    const mockClass = createMockWorkerClass()
    let lastInstance: MockWorkerLike | null = null

    // Create a wrapper that tracks instances
    // eslint-disable-next-line @typescript-eslint/naming-convention
    function MockWorkerWrapper(this: MockWorkerLike) {
      const instance = new mockClass()
      lastInstance = instance
      return instance
    }
    MockWorkerWrapper.prototype = mockClass.prototype

    // Double assertion needed: test mock -> Worker browser API
    // eslint-disable-next-line no-restricted-syntax
    const workerCtor = MockWorkerWrapper as unknown as typeof Worker
    globalThis.Worker = workerCtor

    return { getLastInstance: () => lastInstance }
  }

  describe('isReplReady', () => {
    it('should return false before any execution', () => {
      expect(manager.isReplReady()).toBe(false)
    })

    it('should return false after terminate', async () => {
      installMockWorker()
      await manager.initialize()
      manager.terminate()
      expect(manager.isReplReady()).toBe(false)
    })

    it('should return true after successful executeInWorker completes', async () => {
      const { getLastInstance } = installMockWorker()

      await manager.initialize()
      const worker = getLastInstance()!

      const executePromise = manager.executeInWorker('10 PRINT "HI"', {
        maxIterations: 1000,
        maxOutputLines: 100,
        enableDebugMode: false,
        strictMode: false,
      }, { timeout: 5000 })

      // Simulate MessageHandler resolving the pending message (as the real app does)
      const postedMsg = worker.postedMessages[0] as { id: string }
      const pending = manager.getPendingMessages().get(postedMsg.id)
      expect(pending).toBeDefined()
      pending!.resolve({
        success: true,
        errors: [],
        variables: new Map(),
        executionTime: 10,
      })

      await executePromise
      expect(manager.isReplReady()).toBe(true)
    })

    it('should return true after executeInWorker with error completes', async () => {
      const { getLastInstance } = installMockWorker()

      await manager.initialize()
      const worker = getLastInstance()!

      const executePromise = manager.executeInWorker('10 PRINT "HI"', {
        maxIterations: 1000,
        maxOutputLines: 100,
        enableDebugMode: false,
        strictMode: false,
      }, { timeout: 5000 })

      // Simulate MessageHandler rejecting the pending message with an execution error
      const postedMsg = worker.postedMessages[0] as { id: string }
      const pending = manager.getPendingMessages().get(postedMsg.id)
      expect(pending).toBeDefined()
      pending!.reject(new Error('some error'))

      await expect(executePromise).rejects.toThrow('some error')
      expect(manager.isReplReady()).toBe(true)
    })

    it('should return false after worker error', async () => {
      const { getLastInstance } = installMockWorker()

      await manager.initialize()
      const worker = getLastInstance()!

      // Simulate worker error event (ErrorEvent not available in jsdom)
      const errorEvent = { message: 'worker crashed', filename: '', lineno: 0, colno: 0 } as ErrorEvent
      worker.onerror?.(errorEvent)

      expect(manager.isReplReady()).toBe(false)
    })
  })

  describe('replExecute', () => {
    it('should reject if worker is not initialized', async () => {
      await expect(manager.replExecute('PRINT "HI"')).rejects.toThrow('Worker not initialized')
    })

    it('should post REPL_EXECUTE message and resolve with ExecutionResult on RESULT', async () => {
      const { getLastInstance } = installMockWorker()

      await manager.initialize()
      const worker = getLastInstance()!

      const replPromise = manager.replExecute('PRINT "HI"')

      // Verify REPL_EXECUTE was posted
      expect(worker.postedMessages.length).toBe(1)
      const postedMsg = worker.postedMessages[0] as { type: string; id: string; data: { statement: string } }
      expect(postedMsg.type).toBe('REPL_EXECUTE')
      expect(postedMsg.data.statement).toBe('PRINT "HI"')

      // Simulate worker RESULT response
      const resultData = {
        success: true,
        errors: [],
        variables: new Map(),
        executionTime: 5,
        executionId: postedMsg.id,
      }
      worker.onmessage?.(new MessageEvent('message', {
        data: {
          type: 'RESULT',
          id: postedMsg.id,
          timestamp: Date.now(),
          data: resultData,
        },
      }))

      const result = await replPromise
      expect(result.success).toBe(true)
      expect(result.executionTime).toBe(5)
    })

    it('should reject when worker responds with ERROR', async () => {
      const { getLastInstance } = installMockWorker()

      await manager.initialize()
      const worker = getLastInstance()!

      const replPromise = manager.replExecute('INVALID')

      const postedMsg = worker.postedMessages[0] as { id: string }
      worker.onmessage?.(new MessageEvent('message', {
        data: {
          type: 'ERROR',
          id: postedMsg.id,
          timestamp: Date.now(),
          data: {
            executionId: postedMsg.id,
            message: 'syntax error',
            errorType: 'execution',
            recoverable: true,
          },
        },
      }))

      await expect(replPromise).rejects.toThrow('syntax error')
    })

    it('should reject on timeout if worker does not respond', async () => {
      installMockWorker()

      await manager.initialize()

      await expect(
        manager.replExecute('PRINT "HI"', { timeout: 100 })
      ).rejects.toThrow('timeout')
    })
  })

  describe('replRun', () => {
    it('should reject if worker is not initialized', async () => {
      await expect(manager.replRun()).rejects.toThrow('Worker not initialized')
    })

    it('should post REPL_RUN message and resolve with ExecutionResult on RESULT', async () => {
      const { getLastInstance } = installMockWorker()

      await manager.initialize()
      const worker = getLastInstance()!

      const runPromise = manager.replRun()

      expect(worker.postedMessages.length).toBe(1)
      const postedMsg = worker.postedMessages[0] as { type: string; id: string }
      expect(postedMsg.type).toBe('REPL_RUN')

      // Simulate worker RESULT response
      const resultData = {
        success: true,
        errors: [],
        variables: new Map(),
        executionTime: 50,
        executionId: postedMsg.id,
        spriteStates: [],
        spriteEnabled: false,
      }
      worker.onmessage?.(new MessageEvent('message', {
        data: {
          type: 'RESULT',
          id: postedMsg.id,
          timestamp: Date.now(),
          data: resultData,
        },
      }))

      const result = await runPromise
      expect(result.success).toBe(true)
      expect(result.executionTime).toBe(50)
    })

    it('should reject when worker responds with ERROR', async () => {
      const { getLastInstance } = installMockWorker()

      await manager.initialize()
      const worker = getLastInstance()!

      const runPromise = manager.replRun()

      const postedMsg = worker.postedMessages[0] as { id: string }
      worker.onmessage?.(new MessageEvent('message', {
        data: {
          type: 'ERROR',
          id: postedMsg.id,
          timestamp: Date.now(),
          data: {
            executionId: postedMsg.id,
            message: 'no program',
            errorType: 'execution',
            recoverable: true,
          },
        },
      }))

      await expect(runPromise).rejects.toThrow('no program')
    })
  })

  describe('replClear', () => {
    it('should reject if worker is not initialized', async () => {
      await expect(manager.replClear()).rejects.toThrow('Worker not initialized')
    })

    it('should post REPL_CLEAR message', async () => {
      const { getLastInstance } = installMockWorker()

      await manager.initialize()
      const worker = getLastInstance()!

      await manager.replClear()

      expect(worker.postedMessages.length).toBe(1)
      const postedMsg = worker.postedMessages[0] as { type: string }
      expect(postedMsg.type).toBe('REPL_CLEAR')
    })
  })
})
