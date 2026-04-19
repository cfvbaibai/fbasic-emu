/**
 * Unit tests for WebWorkerManager — core lifecycle and message tests.
 * REPL-specific tests live in WebWorkerManager.repl.test.ts.
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

describe('WebWorkerManager', () => {
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

  describe('static isSupported', () => {
    it('should return true when Worker is defined', () => {
      installMockWorker()
      expect(WebWorkerManager.isSupported()).toBe(true)
    })

    it('should return false when Worker is not defined', () => {
      // Temporarily remove Worker
      const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'Worker')
      Object.defineProperty(globalThis, 'Worker', { value: undefined, writable: true, configurable: true })
      expect(WebWorkerManager.isSupported()).toBe(false)
      if (descriptor) {
        Object.defineProperty(globalThis, 'Worker', descriptor)
      }
    })
  })

  describe('static isInWebWorker', () => {
    it('should return false in jsdom (has window)', () => {
      expect(WebWorkerManager.isInWebWorker()).toBe(false)
    })
  })

  describe('getWorker', () => {
    it('should return null before initialization', () => {
      expect(manager.getWorker()).toBe(null)
    })
  })

  describe('getPendingMessages', () => {
    it('should return an empty map initially', () => {
      expect(manager.getPendingMessages().size).toBe(0)
    })
  })

  describe('terminate', () => {
    it('should be safe to call before initialization', () => {
      expect(() => manager.terminate()).not.toThrow()
    })
  })

  describe('stopExecution', () => {
    it('should be safe to call before initialization', () => {
      expect(() => manager.stopExecution()).not.toThrow()
    })
  })

  describe('sendMessage', () => {
    it('should be safe to call before initialization (no-op)', () => {
      expect(() => manager.sendMessage({ type: 'STOP', id: 'test', timestamp: 0, data: { executionId: 'current' } })).not.toThrow()
    })
  })

  describe('sendBgData', () => {
    it('should be safe to call before initialization', () => {
      expect(() => manager.sendBgData([])).not.toThrow()
    })
  })

  describe('initialize', () => {
    it('should create a worker and set it up', async () => {
      const { getLastInstance } = installMockWorker()

      await manager.initialize()

      expect(manager.getWorker()).not.toBe(null)
      const worker = getLastInstance()!
      expect(worker.onerror).not.toBe(null)
      expect(worker.onmessageerror).not.toBe(null)
    })

    it('should not re-initialize if already initialized', async () => {
      const { getLastInstance } = installMockWorker()

      await manager.initialize()
      const firstWorker = getLastInstance()
      await manager.initialize()
      const secondWorker = getLastInstance()

      // Should be the same worker instance (not re-created)
      expect(firstWorker).toBe(secondWorker)
    })
  })

  describe('terminate with pending messages', () => {
    it('should reject pending messages on terminate', async () => {
      installMockWorker()

      await manager.initialize()

      // Start an execution (will not complete since mock doesn't respond)
      const executePromise = manager.executeInWorker('10 PRINT "HELLO"', {
        maxIterations: 1000,
        maxOutputLines: 100,
        enableDebugMode: false,
        strictMode: false,
      }, { timeout: 5000 })

      // Terminate immediately - should reject pending
      manager.terminate()

      await expect(executePromise).rejects.toThrow('Web worker terminated')
    })
  })

  describe('executeInWorker', () => {
    it('should reject if worker fails to initialize', async () => {
      const mockClass = createMockWorkerClass()

      // Create a throwing wrapper
      // eslint-disable-next-line @typescript-eslint/naming-convention
      function ThrowingWorker(this: MockWorkerLike) {
        throw new Error('Worker creation failed')
      }
      ThrowingWorker.prototype = mockClass.prototype

      // Double assertion needed: test mock -> Worker browser API
      // eslint-disable-next-line no-restricted-syntax
      const throwingCtor = ThrowingWorker as unknown as typeof Worker
      globalThis.Worker = throwingCtor

      await expect(manager.executeInWorker('10 PRINT "X"', {
        maxIterations: 1000,
        maxOutputLines: 100,
        enableDebugMode: false,
        strictMode: false,
      })).rejects.toThrow()
    })

    it('should post an EXECUTE message to the worker', async () => {
      const { getLastInstance } = installMockWorker()

      // Pre-initialize so we can capture the worker instance
      await manager.initialize()
      const worker = getLastInstance()!

      // Start execution (worker already initialized, so no new Worker created)
      const executePromise = manager.executeInWorker('10 PRINT "TEST"', {
        maxIterations: 1000,
        maxOutputLines: 100,
        enableDebugMode: false,
        strictMode: false,
      }, { timeout: 5000 })

      // Verify message was posted
      expect(worker.postedMessages.length).toBe(1)
      const msg = worker.postedMessages[0] as Record<string, unknown>
      expect(msg.type).toBe('EXECUTE')
      expect((msg.data as Record<string, unknown>).code).toBe('10 PRINT "TEST"')

      // Clean up (prevents afterEach double-terminate unhandled rejection)
      manager.terminate()
      // Suppress the unhandled rejection from terminate
      executePromise.catch(() => { /* expected rejection from terminate */ })
    })
  })

  describe('stopExecution', () => {
    it('should post STOP message to worker', async () => {
      const { getLastInstance } = installMockWorker()

      await manager.initialize()
      manager.stopExecution()

      const worker = getLastInstance()!
      expect(worker.postedMessages.length).toBe(1)
      const msg = worker.postedMessages[0] as Record<string, unknown>
      expect(msg.type).toBe('STOP')
      expect(msg.data).toEqual({
        executionId: 'current',
        reason: 'user_request',
      })
    })
  })

  describe('sendBgData', () => {
    it('should post SET_BG_DATA message to worker', async () => {
      const { getLastInstance } = installMockWorker()

      await manager.initialize()

      const grid = [[{ charCode: 65, colorPattern: 1 }]]
      manager.sendBgData(grid)

      const worker = getLastInstance()!
      expect(worker.postedMessages.length).toBe(1)
      const msg = worker.postedMessages[0] as Record<string, unknown>
      expect(msg.type).toBe('SET_BG_DATA')
      expect(msg.data).toEqual({ grid })
    })
  })

  describe('sendMessage', () => {
    it('should post arbitrary message to worker', async () => {
      const { getLastInstance } = installMockWorker()

      await manager.initialize()

      const customMessage = { type: 'CUSTOM', id: 'c1', timestamp: 0, data: { foo: 'bar' } }
      manager.sendMessage(customMessage as never)

      const worker = getLastInstance()!
      expect(worker.postedMessages.length).toBe(1)
      expect(worker.postedMessages[0]).toEqual(customMessage)
    })
  })

})
