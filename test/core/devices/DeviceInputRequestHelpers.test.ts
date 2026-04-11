// @vitest-environment jsdom
/**
 * Unit tests for DeviceInputRequestHelpers
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  createInputRequest,
  createInputRequestsMap,
  handleInputValueMessage,
  rejectAllInputRequests,
} from '@/core/devices/DeviceInputRequestHelpers'
import type { InputValueMessage } from '@/core/types/worker-messages'

// Capture postMessage calls
let capturedMessages: unknown[] = []

beforeEach(() => {
  capturedMessages = []
  const selfTyped = self as typeof self & {
    postMessage: (msg: unknown, transfer?: Transferable[]) => void
  }
  selfTyped.postMessage = (msg: unknown) => {
    capturedMessages.push(msg)
  }
})

afterEach(() => {
  capturedMessages = []
})

describe('DeviceInputRequestHelpers', () => {
  describe('createInputRequestsMap', () => {
    it('should return an empty map', () => {
      const map = createInputRequestsMap()
      expect(map).toBeInstanceOf(Map)
      expect(map.size).toBe(0)
    })
  })

  describe('createInputRequest', () => {
    it('should post a REQUEST_INPUT message', () => {
      const map = createInputRequestsMap()
      void createInputRequest(map, 'exec-1', 'Enter name:', 1, false)

      expect(capturedMessages.length).toBe(1)
      const msg = capturedMessages[0] as Record<string, unknown>
      expect(msg.type).toBe('REQUEST_INPUT')
      expect(msg.data).toEqual({
        requestId: expect.any(String),
        executionId: 'exec-1',
        prompt: 'Enter name:',
        variableCount: 1,
        isLinput: false,
      })
    })

    it('should create a pending entry in the map', () => {
      const map = createInputRequestsMap()
      void createInputRequest(map, 'exec-1', '?', 1, false)

      expect(map.size).toBe(1)
    })

    it('should generate unique request IDs', () => {
      const map = createInputRequestsMap()
      void createInputRequest(map, 'exec-1', '?', 1, false)
      void createInputRequest(map, 'exec-1', '?', 1, false)

      const ids = new Set(capturedMessages.map(m => (m as Record<string, unknown>).data))
      expect(ids.size).toBe(2)
    })
  })

  describe('handleInputValueMessage', () => {
    it('should resolve pending request with values', async () => {
      const map = createInputRequestsMap()
      const promise = createInputRequest(map, 'exec-1', '?', 2, false)

      const requestId = (capturedMessages[0] as Record<string, Record<string, unknown>>).data!.requestId as string

      const message: InputValueMessage = {
        type: 'INPUT_VALUE',
        id: 'input-value-1',
        timestamp: Date.now(),
        data: {
          requestId,
          values: ['Hello', 'World'],
          cancelled: false,
        },
      }

      handleInputValueMessage(map, message)

      await expect(promise).resolves.toEqual(['Hello', 'World'])
    })

    it('should reject pending request when cancelled', async () => {
      const map = createInputRequestsMap()
      const promise = createInputRequest(map, 'exec-1', '?', 1, false)

      const requestId = (capturedMessages[0] as Record<string, Record<string, unknown>>).data!.requestId as string

      const message: InputValueMessage = {
        type: 'INPUT_VALUE',
        id: 'input-value-1',
        timestamp: Date.now(),
        data: {
          requestId,
          values: [],
          cancelled: true,
        },
      }

      handleInputValueMessage(map, message)

      await expect(promise).rejects.toThrow('Input cancelled')
    })

    it('should handle unknown request id gracefully', () => {
      const map = createInputRequestsMap()
      const message: InputValueMessage = {
        type: 'INPUT_VALUE',
        id: 'input-value-1',
        timestamp: Date.now(),
        data: {
          requestId: 'nonexistent',
          values: ['val'],
          cancelled: false,
        },
      }

      expect(() => handleInputValueMessage(map, message)).not.toThrow()
    })

    it('should remove the request from the map after handling', () => {
      const map = createInputRequestsMap()
      void createInputRequest(map, 'exec-1', '?', 1, false)

      expect(map.size).toBe(1)

      const requestId = (capturedMessages[0] as Record<string, Record<string, unknown>>).data!.requestId as string

      const message: InputValueMessage = {
        type: 'INPUT_VALUE',
        id: 'input-value-1',
        timestamp: Date.now(),
        data: {
          requestId,
          values: ['X'],
          cancelled: false,
        },
      }

      handleInputValueMessage(map, message)
      expect(map.size).toBe(0)
    })
  })

  describe('rejectAllInputRequests', () => {
    it('should reject all pending requests', async () => {
      const map = createInputRequestsMap()
      const promise1 = createInputRequest(map, 'exec-1', '?', 1, false)
      const promise2 = createInputRequest(map, 'exec-1', '?', 1, false)

      rejectAllInputRequests(map, 'User stopped')

      await expect(promise1).rejects.toThrow('User stopped')
      await expect(promise2).rejects.toThrow('User stopped')
      expect(map.size).toBe(0)
    })

    it('should use default reason when not specified', async () => {
      const map = createInputRequestsMap()
      const promise = createInputRequest(map, 'exec-1', '?', 1, false)

      rejectAllInputRequests(map)

      await expect(promise).rejects.toThrow('Execution stopped')
    })

    it('should handle empty map gracefully', () => {
      const map = createInputRequestsMap()
      expect(() => rejectAllInputRequests(map)).not.toThrow()
    })
  })
})
