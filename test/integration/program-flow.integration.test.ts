/**
 * Integration test for BG data flow from program store to worker
 *
 * Verifies that:
 * 1. Program store correctly stores and retrieves BG data
 * 2. BG compression/decompression works correctly
 * 3. Sample loading includes BG data
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { BG_GRID, DEFAULT_BG_CHAR_CODE } from '@/features/bg-editor/constants'
import type { BgGridData } from '@/features/bg-editor/types'

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {}
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
  }
})()

Object.defineProperty(window, 'localStorage', { value: localStorageMock })

// Mock fileIO module
vi.mock('@/shared/utils/fileIO', () => ({
  saveJsonFile: vi.fn().mockResolvedValue(undefined),
  loadJsonFile: vi.fn().mockResolvedValue(null),
  isValidProgramFile: vi.fn().mockReturnValue(false),
}))

describe('BG Data Flow Integration', () => {
  beforeEach(() => {
    localStorageMock.clear()
  })

  describe('Program Store + BG Compression', () => {
    it('should store and retrieve BG data through program store', async () => {
      const { useProgramStore } = await import('@/features/ide/composables/useProgramStore')

      const programStore = useProgramStore()

      // Create test BG data with some non-empty cells
      const testGrid: BgGridData = []
      for (let y = 0; y < BG_GRID.ROWS; y++) {
        const row = []
        for (let x = 0; x < BG_GRID.COLS; x++) {
          row.push({ charCode: DEFAULT_BG_CHAR_CODE, colorPattern: 0 as const })
        }
        testGrid.push(row)
      }

      // Add some test content
      testGrid[0]![0] = { charCode: 65, colorPattern: 1 } // 'A'
      testGrid[5]![10] = { charCode: 66, colorPattern: 2 } // 'B'
      testGrid[10]![20] = { charCode: 67, colorPattern: 3 } // 'C'

      // Store BG data
      programStore.setBg(testGrid)

      // Retrieve BG data
      const retrievedGrid = programStore.bg

      // Verify the content is preserved
      expect(retrievedGrid[0]![0]).toEqual({ charCode: 65, colorPattern: 1 })
      expect(retrievedGrid[5]![10]).toEqual({ charCode: 66, colorPattern: 2 })
      expect(retrievedGrid[10]![20]).toEqual({ charCode: 67, colorPattern: 3 })
    })

    it('should handle empty grid correctly', async () => {
      const { useProgramStore } = await import('@/features/ide/composables/useProgramStore')

      const programStore = useProgramStore()

      // New program should have empty grid
      programStore.newProgram()

      const grid = programStore.bg

      // Should be a valid 28x21 grid
      expect(grid.length).toBe(BG_GRID.ROWS)
      for (const row of grid) {
        expect(row.length).toBe(BG_GRID.COLS)
        for (const cell of row) {
          expect(cell.charCode).toBe(DEFAULT_BG_CHAR_CODE)
          expect(cell.colorPattern).toBe(0)
        }
      }
    })
  })

  describe('Sample Loading with BG', () => {
    it('should load sample with BG data', async () => {
      const { getSampleCode } = await import('@/core/samples')
      const { getSampleBgData, hasSampleBgData } = await import('@/core/samples/sampleBgData')

      // Check bgView sample
      const sample = getSampleCode('bgView')
      expect(sample).toBeDefined()
      expect(sample?.bgKey).toBe('bgView')

      // Check BG data exists
      expect(hasSampleBgData('bgView')).toBe(true)

      // Get BG data
      const bgData = getSampleBgData('bgView')
      expect(bgData.length).toBe(BG_GRID.ROWS)

      // Should have content (not all empty)
      const hasContent = bgData.flat().some(cell => cell.charCode !== DEFAULT_BG_CHAR_CODE)
      expect(hasContent).toBe(true)
    })

    it('should handle sample without BG data', async () => {
      const { getSampleCode } = await import('@/core/samples')
      const { hasSampleBgData, getSampleBgData } = await import('@/core/samples/sampleBgData')

      // Check basic sample (no BG)
      const sample = getSampleCode('basic')
      expect(sample).toBeDefined()
      expect(sample?.bgKey).toBeUndefined()

      // Check no BG data
      expect(hasSampleBgData('basic')).toBe(false)

      // Get BG data should return empty grid
      const bgData = getSampleBgData('basic')
      expect(bgData.length).toBe(BG_GRID.ROWS)
      const isEmpty = bgData.flat().every(cell => cell.charCode === DEFAULT_BG_CHAR_CODE)
      expect(isEmpty).toBe(true)
    })
  })

  describe('Data format compatibility', () => {
    it('should produce grid compatible with SetBgDataMessage', async () => {
      const { useProgramStore } = await import('@/features/ide/composables/useProgramStore')

      const programStore = useProgramStore()

      // Get BG data from store
      const grid = programStore.bg

      // Verify it matches the expected format for SetBgDataMessage
      expect(Array.isArray(grid)).toBe(true)
      expect(grid.length).toBe(BG_GRID.ROWS)

      for (const row of grid) {
        expect(Array.isArray(row)).toBe(true)
        expect(row.length).toBe(BG_GRID.COLS)

        for (const cell of row) {
          expect(cell).toHaveProperty('charCode')
          expect(cell).toHaveProperty('colorPattern')
          expect(typeof cell.charCode).toBe('number')
          expect(typeof cell.colorPattern).toBe('number')
          expect(cell.colorPattern).toBeGreaterThanOrEqual(0)
          expect(cell.colorPattern).toBeLessThanOrEqual(3)
        }
      }
    })
  })
})
