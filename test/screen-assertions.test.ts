/**
 * Tests for Screen Assertion API
 *
 * Verifies expectScreenCell, expectBgTile, expectScreenText,
 * and the Vitest custom matchers (screenMatchers).
 */

import { beforeEach, describe, expect, it } from 'vitest'

import { COLS } from '@/core/animation/sharedDisplayBuffer'
import type { DecodedScreenState } from '@/core/animation/sharedDisplayBufferAccessor'
import type { ScreenCell } from '@/core/types/execution-types'
import type { BgCell, BgGridData } from '@/features/bg-editor/types'

import type { DisplaySnapshotV1, ScreenSource } from './screen-assertions'
import {
  expectBgTile,
  expectScreenCell,
  expectScreenText,
  screenMatchers,
  toScreenSource,
} from './screen-assertions'

// Register custom matchers for this test file
expect.extend(screenMatchers)

// Module augmentation to make custom matchers type-safe
declare module 'vitest' {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  interface Assertion<T = any> {
    toHaveCharAt(x: number, y: number, expected: string): Assertion<T>
    toHaveColorPatternAt(x: number, y: number, expected: number): Assertion<T>
    toHaveTextAt(x: number, y: number, expected: string): Assertion<T>
  }

   
  interface AsymmetricMatchersContaining {}
}

// ============================================================================
// Helpers
// ============================================================================

function makeScreenCell(x: number, y: number, character = ' ', colorPattern = 0): ScreenCell {
  return { character, colorPattern, x, y }
}

function makeDecodedScreenState(overrides?: Partial<DecodedScreenState>): DecodedScreenState {
  const buffer: ScreenCell[][] = []
  for (let y = 0; y < 24; y++) {
    const row: ScreenCell[] = []
    for (let x = 0; x < COLS; x++) {
      row.push(makeScreenCell(x, y))
    }
    buffer.push(row)
  }

  // Apply overrides to specific cells
  if (overrides?.buffer) {
    for (const [y, row] of overrides.buffer.entries()) {
      for (const [x, cell] of row.entries()) {
        if (cell) {
          buffer[y]![x] = cell
        }
      }
    }
  }

  return {
    buffer,
    cursorX: 0,
    cursorY: 0,
    bgPalette: 1,
    spritePalette: 1,
    backdropColor: 0,
    cgenMode: 2,
    ...overrides,
  }
}

function makeDisplaySnapshotV1(overrides?: {
  chars?: number[]
  patterns?: number[]
}): DisplaySnapshotV1 {
  const totalCells = 24 * COLS
  const chars = new Array<number>(totalCells).fill(0x20)
  const patterns = new Array<number>(totalCells).fill(0)

  if (overrides?.chars) {
    for (let i = 0; i < overrides.chars.length; i++) {
      chars[i] = overrides.chars[i]!
    }
  }
  if (overrides?.patterns) {
    for (let i = 0; i < overrides.patterns.length; i++) {
      patterns[i] = overrides.patterns[i]!
    }
  }

  return {
    version: 1,
    sequence: 1,
    cursor: { x: 0, y: 0 },
    scalars: { bgPalette: 1, spritePalette: 1, backdropColor: 0, cgenMode: 2 },
    chars,
    patterns,
    sprites: [],
    meta: { sampleKey: 'test', checkpoint: 'end' },
  }
}

function makeBgGridData(width = 28, height = 21, fill?: Partial<BgCell>): BgGridData {
  const grid: BgGridData = []
  for (let y = 0; y < height; y++) {
    const row: BgCell[] = []
    for (let x = 0; x < width; x++) {
      row.push({ charCode: 0x20, colorPattern: 0, ...fill })
    }
    grid.push(row)
  }
  return grid
}

function makeScreenSource(chars: Map<string, string>, patterns: Map<string, number>): ScreenSource {
  return {
    getChar(x: number, y: number): string {
      return chars.get(`${x},${y}`) ?? ' '
    },
    getPattern(x: number, y: number): number {
      return patterns.get(`${x},${y}`) ?? 0
    },
  }
}

// ============================================================================
// expectScreenCell tests
// ============================================================================

describe('expectScreenCell', () => {
  describe('with DecodedScreenState', () => {
    it('should assert character at position', () => {
      const buffer: ScreenCell[][] = []
      for (let y = 0; y < 24; y++) {
        const row: ScreenCell[] = []
        for (let x = 0; x < COLS; x++) {
          row.push(makeScreenCell(x, y))
        }
        buffer.push(row)
      }
      buffer[5]![10] = makeScreenCell(10, 5, 'A')

      const screen = makeDecodedScreenState({ buffer })
      expectScreenCell(screen, 10, 5).toBeChar('A')
    })

    it('should assert colorPattern at position', () => {
      const buffer: ScreenCell[][] = []
      for (let y = 0; y < 24; y++) {
        const row: ScreenCell[] = []
        for (let x = 0; x < COLS; x++) {
          row.push(makeScreenCell(x, y))
        }
        buffer.push(row)
      }
      buffer[3]![7] = makeScreenCell(7, 3, 'X', 2)

      const screen = makeDecodedScreenState({ buffer })
      expectScreenCell(screen, 7, 3).toHaveColorPattern(2)
    })

    it('should fail on wrong character', () => {
      const screen = makeDecodedScreenState()
      expect(() => expectScreenCell(screen, 0, 0).toBeChar('X')).toThrow()
    })

    it('should fail on wrong colorPattern', () => {
      const screen = makeDecodedScreenState()
      expect(() => expectScreenCell(screen, 0, 0).toHaveColorPattern(3)).toThrow()
    })

    it('should default to space for out-of-bounds cell', () => {
      const screen = makeDecodedScreenState()
      expectScreenCell(screen, 0, 0).toBeChar(' ')
      expectScreenCell(screen, 27, 23).toBeChar(' ')
    })
  })

  describe('with DisplaySnapshotV1', () => {
    it('should assert character from char codes', () => {
      const chars = new Array<number>(24 * COLS).fill(0x20)
      chars[5 * COLS + 10] = 0x41 // 'A' at (10, 5)
      const snapshot = makeDisplaySnapshotV1({ chars })

      expectScreenCell(snapshot, 10, 5).toBeChar('A')
    })

    it('should assert colorPattern from pattern array', () => {
      const patterns = new Array<number>(24 * COLS).fill(0)
      patterns[3 * COLS + 7] = 2
      const snapshot = makeDisplaySnapshotV1({ patterns })

      expectScreenCell(snapshot, 7, 3).toHaveColorPattern(2)
    })

    it('should default to space for out-of-bounds index', () => {
      const snapshot = makeDisplaySnapshotV1()
      expectScreenCell(snapshot, 0, 0).toBeChar(' ')
    })
  })

  describe('with ScreenSource', () => {
    it('should use getChar from custom source', () => {
      const source = makeScreenSource(
        new Map([['5,10', 'Z']]),
        new Map()
      )
      expectScreenCell(source, 5, 10).toBeChar('Z')
    })

    it('should use getPattern from custom source', () => {
      const source = makeScreenSource(
        new Map(),
        new Map([['5,10', 3]])
      )
      expectScreenCell(source, 5, 10).toHaveColorPattern(3)
    })
  })
})

// ============================================================================
// expectBgTile tests
// ============================================================================

describe('expectBgTile', () => {
  let grid: BgGridData

  beforeEach(() => {
    grid = makeBgGridData()
  })

  it('should assert charCode at position', () => {
    grid[2]![3] = { charCode: 65, colorPattern: 0 }
    expectBgTile(grid, 3, 2).toBeTile(65)
  })

  it('should assert colorPattern at position', () => {
    grid[4]![6] = { charCode: 0x20, colorPattern: 2 }
    expectBgTile(grid, 6, 4).toHaveColorPattern(2)
  })

  it('should fail on wrong charCode', () => {
    expect(() => expectBgTile(grid, 3, 2).toBeTile(99)).toThrow()
  })

  it('should fail on wrong colorPattern', () => {
    expect(() => expectBgTile(grid, 3, 2).toHaveColorPattern(3)).toThrow()
  })

  it('should fail on out-of-bounds position', () => {
    expect(() => expectBgTile(grid, 0, 21).toBeTile(0)).toThrow()
  })
})

// ============================================================================
// expectScreenText tests
// ============================================================================

describe('expectScreenText', () => {
  describe('with DecodedScreenState', () => {
    it('should assert text span on a single row', () => {
      const buffer: ScreenCell[][] = []
      for (let y = 0; y < 24; y++) {
        const row: ScreenCell[] = []
        for (let x = 0; x < COLS; x++) {
          row.push(makeScreenCell(x, y))
        }
        buffer.push(row)
      }
      const text = 'HELLO'
      for (let i = 0; i < text.length; i++) {
        buffer[5]![10 + i] = makeScreenCell(10 + i, 5, text[i])
      }

      const screen = makeDecodedScreenState({ buffer })
      expectScreenText(screen, 10, 5).toBe('HELLO')
    })

    it('should fail when text does not match', () => {
      const screen = makeDecodedScreenState()
      expect(() => expectScreenText(screen, 0, 0).toBe('WRONG')).toThrow()
    })

    it('should assert single character text', () => {
      const buffer: ScreenCell[][] = []
      for (let y = 0; y < 24; y++) {
        const row: ScreenCell[] = []
        for (let x = 0; x < COLS; x++) {
          row.push(makeScreenCell(x, y))
        }
        buffer.push(row)
      }
      buffer[0]![0] = makeScreenCell(0, 0, 'A')

      const screen = makeDecodedScreenState({ buffer })
      expectScreenText(screen, 0, 0).toBe('A')
    })
  })

  describe('with DisplaySnapshotV1', () => {
    it('should assert text from char code array', () => {
      const chars = new Array<number>(24 * COLS).fill(0x20)
      const text = 'TEST'
      for (let i = 0; i < text.length; i++) {
        chars[10 * COLS + 5 + i] = text.charCodeAt(i)
      }
      const snapshot = makeDisplaySnapshotV1({ chars })

      expectScreenText(snapshot, 5, 10).toBe('TEST')
    })
  })
})

// ============================================================================
// screenMatchers (expect.extend) tests
// ============================================================================

describe('screenMatchers', () => {
  describe('toHaveCharAt', () => {
    it('should pass when char matches', () => {
      const buffer: ScreenCell[][] = []
      for (let y = 0; y < 24; y++) {
        const row: ScreenCell[] = []
        for (let x = 0; x < COLS; x++) {
          row.push(makeScreenCell(x, y))
        }
        buffer.push(row)
      }
      buffer[0]![0] = makeScreenCell(0, 0, 'B')

      const screen = makeDecodedScreenState({ buffer })
      expect(screen).toHaveCharAt(0, 0, 'B')
    })

    it('should fail when char does not match', () => {
      const screen = makeDecodedScreenState()
      expect(() => expect(screen).toHaveCharAt(0, 0, 'X')).toThrow()
    })

    it('should support .not.toHaveCharAt', () => {
      const screen = makeDecodedScreenState()
      expect(screen).not.toHaveCharAt(0, 0, 'X')
    })
  })

  describe('toHaveColorPatternAt', () => {
    it('should pass when pattern matches', () => {
      const buffer: ScreenCell[][] = []
      for (let y = 0; y < 24; y++) {
        const row: ScreenCell[] = []
        for (let x = 0; x < COLS; x++) {
          row.push(makeScreenCell(x, y))
        }
        buffer.push(row)
      }
      buffer[1]![2] = makeScreenCell(2, 1, ' ', 3)

      const screen = makeDecodedScreenState({ buffer })
      expect(screen).toHaveColorPatternAt(2, 1, 3)
    })

    it('should fail when pattern does not match', () => {
      const screen = makeDecodedScreenState()
      expect(() => expect(screen).toHaveColorPatternAt(0, 0, 1)).toThrow()
    })
  })

  describe('toHaveTextAt', () => {
    it('should pass when text matches', () => {
      const buffer: ScreenCell[][] = []
      for (let y = 0; y < 24; y++) {
        const row: ScreenCell[] = []
        for (let x = 0; x < COLS; x++) {
          row.push(makeScreenCell(x, y))
        }
        buffer.push(row)
      }
      buffer[0]![0] = makeScreenCell(0, 0, 'O')
      buffer[0]![1] = makeScreenCell(1, 0, 'K')

      const screen = makeDecodedScreenState({ buffer })
      expect(screen).toHaveTextAt(0, 0, 'OK')
    })

    it('should fail when text does not match', () => {
      const screen = makeDecodedScreenState()
      expect(() => expect(screen).toHaveTextAt(0, 0, 'NO')).toThrow()
    })

    it('should support .not.toHaveTextAt', () => {
      const screen = makeDecodedScreenState()
      expect(screen).not.toHaveTextAt(0, 0, 'NOPE')
    })
  })

  describe('with invalid input', () => {
    it('should fail with descriptive message for non-screen input', () => {
      expect(() => expect({ foo: 'bar' }).toHaveCharAt(0, 0, 'A')).toThrow(/Expected a screen source/)
    })
  })
})

// ============================================================================
// toScreenSource tests
// ============================================================================

describe('toScreenSource', () => {
  it('should return ScreenSource directly', () => {
    const source: ScreenSource = {
      getChar: () => 'Q',
      getPattern: () => 1,
    }
    const result = toScreenSource(source)
    expect(result.getChar(0, 0)).toEqual('Q')
    expect(result.getPattern(0, 0)).toEqual(1)
  })

  it('should adapt DecodedScreenState', () => {
    const buffer: ScreenCell[][] = []
    for (let y = 0; y < 24; y++) {
      const row: ScreenCell[] = []
      for (let x = 0; x < COLS; x++) {
        row.push(makeScreenCell(x, y))
      }
      buffer.push(row)
    }
    buffer[0]![0] = makeScreenCell(0, 0, 'Z', 3)

    const screen = makeDecodedScreenState({ buffer })
    const source = toScreenSource(screen)
    expect(source.getChar(0, 0)).toEqual('Z')
    expect(source.getPattern(0, 0)).toEqual(3)
  })

  it('should adapt DisplaySnapshotV1', () => {
    const chars = new Array<number>(24 * COLS).fill(0x20)
    chars[0] = 0x48 // 'H'
    const patterns = new Array<number>(24 * COLS).fill(0)
    patterns[0] = 2
    const snapshot = makeDisplaySnapshotV1({ chars, patterns })

    const source = toScreenSource(snapshot)
    expect(source.getChar(0, 0)).toEqual('H')
    expect(source.getPattern(0, 0)).toEqual(2)
  })
})
