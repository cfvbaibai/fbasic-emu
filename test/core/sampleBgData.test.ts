// @vitest-environment jsdom
/**
 * Tests for Sample BG Data
 */

import { beforeEach, describe, expect, it, vi } from 'vitest'

import { BG_GRID, DEFAULT_BG_CHAR_CODE } from '@/features/bg-editor/constants'

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

describe('Sample BG Data', () => {
  beforeEach(() => {
    localStorageMock.clear()
  })

  describe('getSampleBgData', () => {
    it('should return a 28x21 grid for valid keys', async () => {
      const { getSampleBgData } = await import('@/core/samples/sampleBgData')

      const bgData = getSampleBgData('bgView')

      expect(bgData.length).toBe(BG_GRID.ROWS)
      for (const row of bgData) {
        expect(row.length).toBe(BG_GRID.COLS)
      }
    })

    it('should return empty grid for unknown keys', async () => {
      const { getSampleBgData } = await import('@/core/samples/sampleBgData')

      const bgData = getSampleBgData('nonexistent')

      // Should be a valid empty grid
      expect(bgData.length).toBe(BG_GRID.ROWS)
      for (const row of bgData) {
        expect(row.length).toBe(BG_GRID.COLS)
        for (const cell of row) {
          expect(cell.charCode).toBe(DEFAULT_BG_CHAR_CODE)
          expect(cell.colorPattern).toBe(0)
        }
      }
    })
  })

  describe('hasSampleBgData', () => {
    it('should return true for valid BG keys', async () => {
      const { hasSampleBgData } = await import('@/core/samples/sampleBgData')

      expect(hasSampleBgData('bgView')).toBe(true)
      expect(hasSampleBgData('titleScreen')).toBe(true)
      expect(hasSampleBgData('platformGame')).toBe(true)
    })

    it('should return false for unknown keys', async () => {
      const { hasSampleBgData } = await import('@/core/samples/sampleBgData')

      expect(hasSampleBgData('nonexistent')).toBe(false)
      expect(hasSampleBgData('basic')).toBe(false)
    })
  })

  describe('BG data content', () => {
    it('should create bgView with border pattern', async () => {
      const { getSampleBgData } = await import('@/core/samples/sampleBgData')

      const bgData = getSampleBgData('bgView')

      // Check top border has content (not empty)
      const topRow = bgData[0]
      expect(topRow).toBeDefined()
      const hasTopBorder = topRow?.some(cell => cell.charCode !== DEFAULT_BG_CHAR_CODE)
      expect(hasTopBorder).toBe(true)

      // Check bottom border has content
      const bottomRow = bgData[BG_GRID.ROWS - 1]
      expect(bottomRow).toBeDefined()
      const hasBottomBorder = bottomRow?.some(cell => cell.charCode !== DEFAULT_BG_CHAR_CODE)
      expect(hasBottomBorder).toBe(true)
    })

    it('should create platformGame with ground', async () => {
      const { getSampleBgData } = await import('@/core/samples/sampleBgData')

      const bgData = getSampleBgData('platformGame')

      // Ground should be at bottom rows
      const groundRow = bgData[BG_GRID.ROWS - 1]
      expect(groundRow).toBeDefined()
      const hasGround = groundRow?.some(cell => cell.charCode !== DEFAULT_BG_CHAR_CODE)
      expect(hasGround).toBe(true)
    })

    it('should create titleScreen with border decoration', async () => {
      const { getSampleBgData } = await import('@/core/samples/sampleBgData')

      const bgData = getSampleBgData('titleScreen')

      // Should have corner decorations
      const hasDecorations = bgData.flat().some(cell => cell.charCode !== DEFAULT_BG_CHAR_CODE)
      expect(hasDecorations).toBe(true)
    })
  })
})
