/**
 * Tests for BG Compression Utilities
 */

import { describe, expect, it } from 'vitest'

import { createEmptyGrid } from '@/features/bg-editor/composables/useBgGrid'
import { DEFAULT_BG_CHAR_CODE } from '@/features/bg-editor/constants'
import { compressBg, decompressBg } from '@/features/bg-editor/utils/bgCompression'

describe('bgCompression', () => {
  describe('compressBg', () => {
    it('should compress empty grid using sparse format', () => {
      const grid = createEmptyGrid()
      const compressed = compressBg(grid)

      expect(compressed.format).toBe('sparse1')
      expect(compressed.data).toBe('')
      expect(compressed.width).toBe(28)
      expect(compressed.height).toBe(21)
    })

    it('should compress sparse grid (single cell) using sparse format', () => {
      const grid = createEmptyGrid()
      const row = grid[0]
      if (row) {
        row[0] = { charCode: 65, colorPattern: 1 }
      }

      const compressed = compressBg(grid)

      expect(compressed.format).toBe('sparse1')
      expect(compressed.data).toBe('0,0,65,1')
    })

    it('should compress sparse grid (multiple cells) using sparse format', () => {
      const grid = createEmptyGrid()
      const row0 = grid[0]
      const row10 = grid[10]
      const row20 = grid[20]
      if (row0) row0[0] = { charCode: 65, colorPattern: 1 }
      if (row10) row10[5] = { charCode: 66, colorPattern: 2 }
      if (row20) row20[27] = { charCode: 67, colorPattern: 3 }

      const compressed = compressBg(grid)

      expect(compressed.format).toBe('sparse1')
      expect(compressed.data).toMatch(/0,0,65,1/)
      expect(compressed.data).toMatch(/5,10,66,2/)
      expect(compressed.data).toMatch(/27,20,67,3/)
    })

    it('should compress dense grid using RLE format', () => {
      const grid = createEmptyGrid()

      // Fill 50% of grid with same character (triggers RLE)
      for (let y = 0; y < 10; y++) {
        const row = grid[y]
        if (row) {
          for (let x = 0; x < 28; x++) {
            row[x] = { charCode: 65, colorPattern: 1 }
          }
        }
      }

      const compressed = compressBg(grid)

      expect(compressed.format).toBe('rle1')
      expect(compressed.width).toBe(28)
      expect(compressed.height).toBe(21)
    })
  })

  describe('decompressBg', () => {
    it('should decompress empty sparse data', () => {
      const compressed = {
        format: 'sparse1' as const,
        data: '',
        width: 28 as const,
        height: 21 as const,
      }

      const grid = decompressBg(compressed)

      expect(grid.length).toBe(21)
      expect(grid[0]?.length).toBe(28)

      // All cells should be empty (space character)
      for (const row of grid) {
        for (const cell of row) {
          expect(cell.charCode).toBe(DEFAULT_BG_CHAR_CODE)
          expect(cell.colorPattern).toBe(0)
        }
      }
    })

    it('should roundtrip sparse data correctly', () => {
      const original = createEmptyGrid()
      const row0 = original[0]
      const row10 = original[10]
      const row20 = original[20]
      if (row0) row0[0] = { charCode: 65, colorPattern: 1 }
      if (row10) row10[5] = { charCode: 66, colorPattern: 2 }
      if (row20) row20[27] = { charCode: 67, colorPattern: 3 }

      const compressed = compressBg(original)
      const restored = decompressBg(compressed)

      expect(restored[0]?.[0]).toEqual({ charCode: 65, colorPattern: 1 })
      expect(restored[10]?.[5]).toEqual({ charCode: 66, colorPattern: 2 })
      expect(restored[20]?.[27]).toEqual({ charCode: 67, colorPattern: 3 })

      // Empty cells should remain empty (space character)
      expect(restored[1]?.[1]).toEqual({ charCode: DEFAULT_BG_CHAR_CODE, colorPattern: 0 })
    })

    it('should roundtrip RLE data correctly', () => {
      const original = createEmptyGrid()

      // Fill entire grid with pattern
      for (let y = 0; y < 21; y++) {
        const row = original[y]
        if (row) {
          for (let x = 0; x < 28; x++) {
            row[x] = { charCode: 65, colorPattern: 1 }
          }
        }
      }

      const compressed = compressBg(original)
      expect(compressed.format).toBe('rle1')

      const restored = decompressBg(compressed)

      // All cells should have the same value
      for (const row of restored) {
        for (const cell of row) {
          expect(cell.charCode).toBe(65)
          expect(cell.colorPattern).toBe(1)
        }
      }
    })

    it('should roundtrip mixed pattern grid correctly', () => {
      const original = createEmptyGrid()
      const row = original[0]

      // Create a pattern with runs
      if (row) {
        for (let x = 0; x < 10; x++) {
          row[x] = { charCode: 65, colorPattern: 1 }
        }
        for (let x = 10; x < 20; x++) {
          row[x] = { charCode: 66, colorPattern: 2 }
        }
        for (let x = 20; x < 28; x++) {
          row[x] = { charCode: 67, colorPattern: 3 }
        }
      }

      const compressed = compressBg(original)
      const restored = decompressBg(compressed)
      const restoredRow = restored[0]

      // Verify pattern
      if (restoredRow) {
        for (let x = 0; x < 10; x++) {
          expect(restoredRow[x]).toEqual({ charCode: 65, colorPattern: 1 })
        }
        for (let x = 10; x < 20; x++) {
          expect(restoredRow[x]).toEqual({ charCode: 66, colorPattern: 2 })
        }
        for (let x = 20; x < 28; x++) {
          expect(restoredRow[x]).toEqual({ charCode: 67, colorPattern: 3 })
        }
      }
    })
  })

  describe('compression efficiency', () => {
    it('should produce smaller output than JSON for sparse grids', () => {
      const grid = createEmptyGrid()
      const row0 = grid[0]
      const row10 = grid[10]
      if (row0) row0[0] = { charCode: 65, colorPattern: 1 }
      if (row10) row10[14] = { charCode: 66, colorPattern: 2 }

      const compressed = compressBg(grid)
      const jsonLength = JSON.stringify(grid).length

      // Compressed should be much smaller
      expect(compressed.data.length).toBeLessThan(jsonLength / 10)
    })

    it('should produce compact output for dense grids', () => {
      const grid = createEmptyGrid()

      // Fill with repeating pattern (good for RLE)
      for (let y = 0; y < 21; y++) {
        const row = grid[y]
        if (row) {
          for (let x = 0; x < 28; x++) {
            row[x] = { charCode: 65, colorPattern: 1 }
          }
        }
      }

      const compressed = compressBg(grid)
      const jsonLength = JSON.stringify(grid).length

      // RLE should compress to about 5 chars for 588 cells
      // vs ~4700 chars for JSON
      expect(compressed.data.length).toBeLessThan(100)
      expect(compressed.data.length).toBeLessThan(jsonLength / 40)
    })
  })
})
