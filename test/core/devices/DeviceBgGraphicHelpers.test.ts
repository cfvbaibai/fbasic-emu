/**
 * Unit tests for DeviceBgGraphicHelpers
 */

import { describe, expect, it } from 'vitest'

import { copyBgGraphicToScreenBuffer } from '@/core/devices/DeviceBgGraphicHelpers'
import type { ScreenCell } from '@/core/types/execution-types'
import type { BgCell, ColorPattern } from '@/features/bg-editor/types'

/**
 * Create a 28x24 screen buffer filled with spaces and colorPattern 0
 */
function createEmptyScreenBuffer(): ScreenCell[][] {
  const buffer: ScreenCell[][] = []
  for (let y = 0; y < 24; y++) {
    const row: ScreenCell[] = []
    for (let x = 0; x < 28; x++) {
      row.push({ character: ' ', colorPattern: 0, x, y })
    }
    buffer.push(row)
  }
  return buffer
}

describe('DeviceBgGraphicHelpers', () => {
  describe('copyBgGraphicToScreenBuffer', () => {
    it('should copy character codes to screen buffer', () => {
      const screenBuffer = createEmptyScreenBuffer()
      const bgGridData: BgCell[][] = [
        [{ charCode: 65, colorPattern: 1 }], // 'A'
      ]

      copyBgGraphicToScreenBuffer(bgGridData, screenBuffer)

      expect(screenBuffer[0]![0]!.character).toBe('A')
      expect(screenBuffer[0]![0]!.colorPattern).toBe(1)
    })

    it('should copy multiple rows', () => {
      const screenBuffer = createEmptyScreenBuffer()
      const bgGridData: BgCell[][] = [
        [{ charCode: 65, colorPattern: 1 }],
        [{ charCode: 66, colorPattern: 2 }],
        [{ charCode: 67, colorPattern: 3 }],
      ]

      copyBgGraphicToScreenBuffer(bgGridData, screenBuffer)

      expect(screenBuffer[0]![0]!.character).toBe('A')
      expect(screenBuffer[1]![0]!.character).toBe('B')
      expect(screenBuffer[2]![0]!.character).toBe('C')
    })

    it('should copy multiple columns', () => {
      const screenBuffer = createEmptyScreenBuffer()
      const bgGridData: BgCell[][] = [
        [
          { charCode: 72, colorPattern: 1 },
          { charCode: 73, colorPattern: 2 },
          { charCode: 74, colorPattern: 3 },
        ],
      ]

      copyBgGraphicToScreenBuffer(bgGridData, screenBuffer)

      expect(screenBuffer[0]![0]!.character).toBe('H')
      expect(screenBuffer[0]![1]!.character).toBe('I')
      expect(screenBuffer[0]![2]!.character).toBe('J')
    })

    it('should not exceed 28 columns', () => {
      const screenBuffer = createEmptyScreenBuffer()
      const bgGridData: BgCell[][] = [
        Array.from({ length: 30 }, (_, i) => ({ charCode: 65 + i, colorPattern: (i % 4) as ColorPattern })),
      ]

      copyBgGraphicToScreenBuffer(bgGridData, screenBuffer)

      // Only first 28 columns should be copied
      expect(screenBuffer[0]![27]!.character).toBe(String.fromCharCode(65 + 27))
      // Column 29+ should not be written
    })

    it('should not exceed 24 rows', () => {
      const screenBuffer = createEmptyScreenBuffer()
      const bgGridData: BgCell[][] = Array.from({ length: 26 }, (_, row) => [
        { charCode: 65 + row, colorPattern: (row % 4) as ColorPattern },
      ])

      copyBgGraphicToScreenBuffer(bgGridData, screenBuffer)

      // Row 23 should have the 24th entry (index 23)
      expect(screenBuffer[23]![0]!.character).toBe(String.fromCharCode(65 + 23))
      // Row 24 should remain unchanged (space)
    })

    it('should skip falsy rows', () => {
      const screenBuffer = createEmptyScreenBuffer()
      // BgGridData is BgCell[][] but production code guards against falsy rows
      const validRow: BgCell[] = [{ charCode: 88, colorPattern: 1 }]
      // eslint-disable-next-line no-restricted-syntax
      const bgGridData = [undefined, validRow] as unknown as BgCell[][]

      copyBgGraphicToScreenBuffer(bgGridData, screenBuffer)

      expect(screenBuffer[0]![0]!.character).toBe(' ')
      expect(screenBuffer[1]![0]!.character).toBe('X')
    })

    it('should skip falsy cells', () => {
      const screenBuffer = createEmptyScreenBuffer()
      const rowWithEmpty: (BgCell | undefined)[] = [
        { charCode: 65, colorPattern: 1 },
        undefined,
        { charCode: 67, colorPattern: 3 },
      ]
      const bgGridData = [rowWithEmpty] as BgCell[][]

      copyBgGraphicToScreenBuffer(bgGridData, screenBuffer)

      expect(screenBuffer[0]![0]!.character).toBe('A')
      expect(screenBuffer[0]![1]!.character).toBe(' ')
      expect(screenBuffer[0]![2]!.character).toBe('C')
    })

    it('should not modify cells outside of BG grid area', () => {
      const screenBuffer = createEmptyScreenBuffer()
      // Write something at row 5
      screenBuffer[5]![0]!.character = 'Z'

      const bgGridData: BgCell[][] = [
        [{ charCode: 65, colorPattern: 1 }],
      ]

      copyBgGraphicToScreenBuffer(bgGridData, screenBuffer)

      // Row 5 should remain unchanged
      expect(screenBuffer[5]![0]!.character).toBe('Z')
    })
  })
})
