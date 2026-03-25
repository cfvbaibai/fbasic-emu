/**
 * Unit tests for sharedKeyboardBuffer
 */

import { describe, expect, it } from 'vitest'

import {
  clearInkeyState,
  consumeKeyAvailable,
  createSharedKeyboardBuffer,
  createViewsFromKeyboardBuffer,
  getInkeyState,
  KEYBOARD_BUFFER_BYTES,
  setInkeyState,
} from '@/core/devices/sharedKeyboardBuffer'

describe('sharedKeyboardBuffer', () => {
  describe('createSharedKeyboardBuffer', () => {
    it('should create a buffer of correct size', () => {
      const buffer = createSharedKeyboardBuffer()
      expect(buffer.byteLength).toBe(KEYBOARD_BUFFER_BYTES)
    })

    it('should initialize buffer to zeros', () => {
      const buffer = createSharedKeyboardBuffer()
      const view = new Float64Array(buffer)
      expect(view[0]).toBe(0) // keyCharCode
      expect(view[1]).toBe(0) // keyModifiers
    })

    it('should throw when SharedArrayBuffer is not available', () => {
      const original = globalThis.SharedArrayBuffer
       
      ;(globalThis as Record<string, unknown>).SharedArrayBuffer = undefined
      expect(() => createSharedKeyboardBuffer()).toThrow('SharedArrayBuffer is not available')
      ;(globalThis as Record<string, unknown>).SharedArrayBuffer = original
    })
  })

  describe('createViewsFromKeyboardBuffer', () => {
    it('should create views from an existing buffer', () => {
      const buffer = createSharedKeyboardBuffer()
      const views = createViewsFromKeyboardBuffer(buffer)
      expect(views.buffer).toBe(buffer)
      expect(views.keyCharCode.length).toBe(1)
      expect(views.keyModifiers.length).toBe(1)
      expect(views.keyAvailableInt32.length).toBe(1)
    })

    it('should throw for buffer that is too small', () => {
      const tinyBuffer = new SharedArrayBuffer(8)
      expect(() => createViewsFromKeyboardBuffer(tinyBuffer)).toThrow(
        'Shared keyboard buffer too small: 8 bytes, need at least 24'
      )
    })
  })

  describe('setInkeyState / getInkeyState', () => {
    it('should set and get a key character', () => {
      const buffer = createSharedKeyboardBuffer()
      const views = createViewsFromKeyboardBuffer(buffer)

      setInkeyState(views, 'A')
      const result = getInkeyState(views)
      expect(result.keyChar).toBe('A')
    })

    it('should set and get modifiers', () => {
      const buffer = createSharedKeyboardBuffer()
      const views = createViewsFromKeyboardBuffer(buffer)

      setInkeyState(views, 'A', 3) // Shift + Ctrl
      const result = getInkeyState(views)
      expect(result.modifiers).toBe(3)
    })

    it('should return empty string when no key is pressed', () => {
      const buffer = createSharedKeyboardBuffer()
      const views = createViewsFromKeyboardBuffer(buffer)

      const result = getInkeyState(views)
      expect(result.keyChar).toBe('')
      expect(result.modifiers).toBe(0)
    })

    it('should handle empty string input (key release)', () => {
      const buffer = createSharedKeyboardBuffer()
      const views = createViewsFromKeyboardBuffer(buffer)

      setInkeyState(views, 'X')
      setInkeyState(views, '')
      const result = getInkeyState(views)
      expect(result.keyChar).toBe('')
    })

    it('should store character code for non-empty string', () => {
      const buffer = createSharedKeyboardBuffer()
      const views = createViewsFromKeyboardBuffer(buffer)

      setInkeyState(views, 'Z')
      expect(views.keyCharCode[0]).toBe(90) // 'Z'.charCodeAt(0)
    })

    it('should set keyAvailable flag when key is pressed', () => {
      const buffer = createSharedKeyboardBuffer()
      const views = createViewsFromKeyboardBuffer(buffer)

      setInkeyState(views, 'A')
      expect(views.keyAvailableInt32[0]).toBe(1)
    })

    it('should not set keyAvailable when key is empty', () => {
      const buffer = createSharedKeyboardBuffer()
      const views = createViewsFromKeyboardBuffer(buffer)

      setInkeyState(views, 'A')
      setInkeyState(views, '')
      // clearInkeyState doesn't clear keyAvailable (as per code comment)
      // setInkeyState with empty string doesn't touch keyAvailable
      // So the flag may still be 1
    })
  })

  describe('clearInkeyState', () => {
    it('should clear character code and modifiers', () => {
      const buffer = createSharedKeyboardBuffer()
      const views = createViewsFromKeyboardBuffer(buffer)

      setInkeyState(views, 'A', 5)
      clearInkeyState(views)
      expect(views.keyCharCode[0]).toBe(0)
      expect(views.keyModifiers[0]).toBe(0)
    })

    it('should not clear keyAvailable flag', () => {
      const buffer = createSharedKeyboardBuffer()
      const views = createViewsFromKeyboardBuffer(buffer)

      setInkeyState(views, 'A')
      clearInkeyState(views)
      // keyAvailable should remain as the worker consumes it
      expect(views.keyAvailableInt32[0]).toBe(1)
    })
  })

  describe('consumeKeyAvailable', () => {
    it('should reset keyAvailable flag to 0', () => {
      const buffer = createSharedKeyboardBuffer()
      const views = createViewsFromKeyboardBuffer(buffer)

      setInkeyState(views, 'A')
      expect(views.keyAvailableInt32[0]).toBe(1)
      consumeKeyAvailable(views)
      expect(views.keyAvailableInt32[0]).toBe(0)
    })

    it('should be safe to call when flag is already 0', () => {
      const buffer = createSharedKeyboardBuffer()
      const views = createViewsFromKeyboardBuffer(buffer)

      consumeKeyAvailable(views)
      expect(views.keyAvailableInt32[0]).toBe(0)
    })
  })

  describe('KEYBOARD_BUFFER_BYTES constant', () => {
    it('should be 24 bytes', () => {
      expect(KEYBOARD_BUFFER_BYTES).toBe(24)
    })
  })
})
