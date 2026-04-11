// @vitest-environment jsdom
/**
 * Unit tests for DeviceScreenManager
 *
 * Tests screen lifecycle operations, focusing on the palette-combination
 * reset messages sent when a new execution starts (issue #435).
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DeviceScreenManager } from '@/core/devices/DeviceScreenManager'
import type { BgGridData } from '@/features/bg-editor/types'
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

  describe('setCurrentExecutionId — BG data persistence (issue #456)', () => {
    /** Minimal BG grid: 28 cols x 21 rows with a distinctive charCode. */
    function makeTestBgGrid(): BgGridData {
      const grid: BgGridData = []
      for (let row = 0; row < 21; row++) {
        const rowCells: { charCode: number; colorPattern: 0 | 1 | 2 | 3 }[] = []
        for (let col = 0; col < 28; col++) {
          rowCells.push({ charCode: 65 + (row * 28 + col) % 26, colorPattern: 0 })
        }
        grid.push(rowCells)
      }
      return grid
    }

    it('should preserve bgGridData when setCurrentExecutionId is called', () => {
      // Set BG data first (simulates SET_BG_DATA message from main thread)
      const bgData = makeTestBgGrid()
      manager.setBgGridData(bgData)

      // Start a new execution (simulates EXECUTE message)
      // Before the fix, this would reset bgGridData to null
      manager.setCurrentExecutionId('exec-1')

      // Verify that copyBgGraphicToBackground still renders (does not early-return)
      // We check by looking at the screen buffer — it should have BG data written to it
      const screenBefore = manager.getScreenBuffer()
      // Screen is initialized with spaces (charCode 32), so row 0 col 0 should be space initially
      expect(screenBefore[0]![0]!.character).toBe(' ')

      manager.copyBgGraphicToBackground()

      // After copyBgGraphicToBackground, row 0 col 0 should have the BG data (charCode 65 = 'A')
      const screenAfter = manager.getScreenBuffer()
      expect(screenAfter[0]![0]!.character).toBe('A')
    })

    it('should render BG data set before execution starts (SET_BG_DATA then EXECUTE ordering)', () => {
      // This test reproduces the exact race condition from issue #456:
      // 1. Main thread sends SET_BG_DATA
      // 2. Main thread sends EXECUTE
      // 3. VIEW command should still render the BG data

      const bgData = makeTestBgGrid()
      manager.setBgGridData(bgData)

      // Simulate the EXECUTE flow
      manager.setCurrentExecutionId('exec-with-bg')

      // Verify screen buffer was updated by copyBgGraphicToBackground
      manager.copyBgGraphicToBackground()
      const screen = manager.getScreenBuffer()

      // Check a few cells to confirm BG data was rendered
      expect(screen[0]![0]!.character).toBe('A') // charCode 65
      expect(screen[0]![1]!.character).toBe('B') // charCode 66
      // (20*28+27)=587, 587%26=15, 65+15=80='P'
      expect(screen[20]![27]!.character).toBe('P')
    })

    it('should preserve bgGridData across multiple execution starts', () => {
      const bgData = makeTestBgGrid()
      manager.setBgGridData(bgData)

      // First execution
      manager.setCurrentExecutionId('exec-1')
      manager.copyBgGraphicToBackground()
      let screen = manager.getScreenBuffer()
      expect(screen[0]![0]!.character).toBe('A')

      // Second execution — BG data should still be available
      manager.setCurrentExecutionId('exec-2')
      manager.copyBgGraphicToBackground()
      screen = manager.getScreenBuffer()
      expect(screen[0]![0]!.character).toBe('A')
    })
  })
})
