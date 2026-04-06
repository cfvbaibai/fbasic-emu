/**
 * Unit tests for DeviceScreenManager
 *
 * Tests screen lifecycle operations, focusing on the palette-combination
 * reset messages sent when a new execution starts (issue #435).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DeviceScreenManager } from '@/core/devices/DeviceScreenManager'
import { BACKGROUND_PALETTES, SPRITE_PALETTES } from '@/shared/data/palette'

// Mock logger to suppress warnings in test output
vi.mock('@/shared/logger', () => ({
  logWorker: {
    warn: vi.fn(),
    debug: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

// ============================================================================
// postMessage mock — DeviceScreenManager uses self.postMessage (worker API)
// ============================================================================

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

// ============================================================================
// Helpers
// ============================================================================

interface ScreenUpdateMsg {
  type: string
  data: {
    updateType: string
    paletteTarget?: string
    paletteIndex?: number
    paletteCombination?: number
    paletteColors?: [number, number, number, number]
    [key: string]: unknown
  }
}

function getPaletteCombinationMessages(): ScreenUpdateMsg[] {
  return capturedMessages.filter(
    (msg): msg is ScreenUpdateMsg =>
      typeof msg === 'object' && msg !== null &&
      (msg as ScreenUpdateMsg).type === 'SCREEN_UPDATE' &&
      (msg as ScreenUpdateMsg).data?.updateType === 'palette-combination',
  )
}

describe('DeviceScreenManager', () => {
  let manager: DeviceScreenManager

  beforeEach(() => {
    manager = new DeviceScreenManager()
  })

  describe('setCurrentExecutionId — palette combination reset', () => {
    it('should send palette-combination reset messages for all background palettes', () => {
      manager.setCurrentExecutionId('exec-1')

      const msgs = getPaletteCombinationMessages()

      // BACKGROUND_PALETTES has 2 palettes, each with 4 combinations = 8
      const bgMsgs = msgs.filter(m => m.data.paletteTarget === 'B')
      expect(bgMsgs.length).toBe(8) // 2 palettes x 4 combinations

      // Verify each combination has the original palette data
      for (const msg of bgMsgs) {
        const { paletteIndex, paletteCombination, paletteColors } = msg.data
        const expected = BACKGROUND_PALETTES[paletteIndex! as 0 | 1][paletteCombination! as 0 | 1 | 2 | 3]
        expect(paletteColors).toEqual([...expected] as [number, number, number, number])
      }
    })

    it('should send palette-combination reset messages for all sprite palettes', () => {
      manager.setCurrentExecutionId('exec-1')

      const msgs = getPaletteCombinationMessages()

      // SPRITE_PALETTES has 3 palettes, each with 4 combinations = 12
      const spriteMsgs = msgs.filter(m => m.data.paletteTarget === 'S')
      expect(spriteMsgs.length).toBe(12) // 3 palettes x 4 combinations

      // Verify each combination has the original palette data
      for (const msg of spriteMsgs) {
        const { paletteIndex, paletteCombination, paletteColors } = msg.data
        const expected = SPRITE_PALETTES[paletteIndex! as 0 | 1 | 2][paletteCombination! as 0 | 1 | 2 | 3]
        expect(paletteColors).toEqual([...expected] as [number, number, number, number])
      }
    })

    it('should send a total of 20 palette-combination messages (8 bg + 12 sprite)', () => {
      manager.setCurrentExecutionId('exec-1')

      const msgs = getPaletteCombinationMessages()
      expect(msgs.length).toBe(20)
    })

    it('should include the correct executionId in reset messages', () => {
      manager.setCurrentExecutionId('test-exec-42')

      const msgs = getPaletteCombinationMessages()
      for (const msg of msgs) {
        expect(msg.data.executionId).toBe('test-exec-42')
      }
    })

    it('should not send palette-combination messages when executionId is null', () => {
      manager.setCurrentExecutionId(null)

      const msgs = getPaletteCombinationMessages()
      expect(msgs.length).toBe(0)
    })

    it('should send reset messages on each new execution start', () => {
      // First execution
      manager.setCurrentExecutionId('exec-1')
      const firstBatch = getPaletteCombinationMessages()
      expect(firstBatch.length).toBe(20)

      // Second execution — should also reset
      capturedMessages = []
      manager.setCurrentExecutionId('exec-2')
      const secondBatch = getPaletteCombinationMessages()
      expect(secondBatch.length).toBe(20)
    })
  })
})
