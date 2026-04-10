/**
 * Screen Assertion API for Vitest Tests
 *
 * Granular screen state assertion helpers for verifying individual cells,
 * BG tiles, and text spans. Works with both DecodedScreenState (from
 * SharedDisplayBufferAccessor.readScreenState()) and DisplaySnapshotV1
 * (from captureDisplaySnapshotV1()).
 *
 * Usage:
 *   import { expectScreenCell, expectBgTile, expectScreenText } from './screen-assertions'
 *   expectScreenCell(screen, 5, 10).toBeChar('A')
 *   expectScreenCell(screen, 5, 10).toHaveColorPattern(2)
 *   expectBgTile(bgGrid, 2, 3).toBeTile(5)
 *   expectScreenText(screen, 0, 5).toBe('HELLO WORLD')
 */

import { expect } from 'vitest'

import { COLS } from '@/core/animation/sharedDisplayBuffer'
import type { DecodedScreenState } from '@/core/animation/sharedDisplayBufferAccessor'
import type { BgCell, BgGridData } from '@/features/bg-editor/types'

// Re-export snapshot type so consumers can use a single import
import type { DisplaySnapshotV1 } from './integration/displaySnapshotTestUtils'
export type { DisplaySnapshotV1 }

// ============================================================================
// Unified screen source types
// ============================================================================

/** Any data source that provides character and pattern data at (x, y). */
export interface ScreenSource {
  getChar(x: number, y: number): string
  getPattern(x: number, y: number): number
}

export function toScreenSource(screen: DecodedScreenState | DisplaySnapshotV1 | ScreenSource): ScreenSource {
  if ('getChar' in screen && typeof screen.getChar === 'function') {
    return screen
  }
  if ('buffer' in screen) {
    const state = screen
    return {
      getChar(x: number, y: number): string {
        return state.buffer[y]?.[x]?.character ?? ' '
      },
      getPattern(x: number, y: number): number {
        return state.buffer[y]?.[x]?.colorPattern ?? 0
      },
    }
  }
  const snapshot = screen as DisplaySnapshotV1
  return {
    getChar(x: number, y: number): string {
      const idx = y * COLS + x
      return String.fromCharCode(snapshot.chars[idx] ?? 0x20)
    },
    getPattern(x: number, y: number): number {
      const idx = y * COLS + x
      return (snapshot.patterns[idx] ?? 0) & 3
    },
  }
}

// ============================================================================
// Cell assertion chain
// ============================================================================

/**
 * Assertion chain for a single screen cell at position (x, y).
 * Obtain via `expectScreenCell(screen, x, y)`.
 */
export interface CellAssertion {
  toBeChar(expected: string): void
  toHaveColorPattern(expected: number): void
}

class CellAssertionImpl implements CellAssertion {
  constructor(
    private readonly source: ScreenSource,
    private readonly x: number,
    private readonly y: number
  ) {}

  toBeChar(expected: string): void {
    const actual = this.source.getChar(this.x, this.y)
    expect(actual, `Expected char at (${this.x}, ${this.y})`).toEqual(expected)
  }

  toHaveColorPattern(expected: number): void {
    const actual = this.source.getPattern(this.x, this.y)
    expect(actual, `Expected colorPattern at (${this.x}, ${this.y})`).toEqual(expected)
  }
}

/**
 * Assert properties of the screen cell at position (x, y).
 *
 * @param screen - DecodedScreenState, DisplaySnapshotV1, or ScreenSource
 * @param x - Column (0-27)
 * @param y - Row (0-23)
 * @returns CellAssertion chain for fluent assertions
 */
export function expectScreenCell(
  screen: DecodedScreenState | DisplaySnapshotV1 | ScreenSource,
  x: number,
  y: number
): CellAssertion {
  return new CellAssertionImpl(toScreenSource(screen), x, y)
}

// ============================================================================
// BG tile assertion chain
// ============================================================================

/**
 * Assertion chain for a single BG tile at position (x, y).
 * Obtain via `expectBgTile(bgGrid, x, y)`.
 */
export interface BgTileAssertion {
  toBeTile(expectedCharCode: number): void
  toHaveColorPattern(expected: number): void
}

class BgTileAssertionImpl implements BgTileAssertion {
  constructor(
    private readonly grid: BgGridData,
    private readonly x: number,
    private readonly y: number
  ) {}

  private getCell(): BgCell | undefined {
    return this.grid[this.y]?.[this.x]
  }

  toBeTile(expectedCharCode: number): void {
    const cell = this.getCell()
    expect(cell, `BG cell at (${this.x}, ${this.y}) should exist`).toBeDefined()
    expect(cell!.charCode, `Expected BG tile at (${this.x}, ${this.y})`).toEqual(expectedCharCode)
  }

  toHaveColorPattern(expected: number): void {
    const cell = this.getCell()
    expect(cell, `BG cell at (${this.x}, ${this.y}) should exist`).toBeDefined()
    expect(cell!.colorPattern, `Expected BG colorPattern at (${this.x}, ${this.y})`).toEqual(expected)
  }
}

/**
 * Assert properties of the BG tile at position (x, y).
 *
 * @param bgGrid - BgGridData (28x21 grid of BgCell)
 * @param x - Column (0-27)
 * @param y - Row (0-20)
 * @returns BgTileAssertion chain for fluent assertions
 */
export function expectBgTile(bgGrid: BgGridData, x: number, y: number): BgTileAssertion {
  return new BgTileAssertionImpl(bgGrid, x, y)
}

// ============================================================================
// Text span assertion
// ============================================================================

/**
 * Assertion for a text span starting at position (x, y).
 * Obtain via `expectScreenText(screen, x, y)`.
 */
export interface TextAssertion {
  toBe(expected: string): void
}

class TextAssertionImpl implements TextAssertion {
  constructor(
    private readonly source: ScreenSource,
    private readonly x: number,
    private readonly y: number
  ) {}

  toBe(expected: string): void {
    const actualChars: string[] = []
    for (let i = 0; i < expected.length; i++) {
      actualChars.push(this.source.getChar(this.x + i, this.y))
    }
    const actual = actualChars.join('')
    expect(actual, `Expected text at row ${this.y}, col ${this.x}`).toEqual(expected)
  }
}

/**
 * Assert that a text span starting at (x, y) matches exactly.
 *
 * @param screen - DecodedScreenState, DisplaySnapshotV1, or ScreenSource
 * @param x - Starting column
 * @param y - Row
 * @returns TextAssertion with toBe() method
 */
export function expectScreenText(
  screen: DecodedScreenState | DisplaySnapshotV1 | ScreenSource,
  x: number,
  y: number
): TextAssertion {
  return new TextAssertionImpl(toScreenSource(screen), x, y)
}

// ============================================================================
// Vitest custom matchers (via expect.extend)
// ============================================================================

interface ScreenCellMatcherContext {
  isNot: boolean
  equals(a: unknown, b: unknown): boolean
}

function extractSource(received: unknown): ScreenSource | null {
  if (received && typeof received === 'object' && 'getChar' in received) {
    return received as ScreenSource
  }
  if (received && typeof received === 'object' && 'buffer' in received) {
    return toScreenSource(received as DecodedScreenState)
  }
  if (received && typeof received === 'object' && 'chars' in received) {
    return toScreenSource(received as DisplaySnapshotV1)
  }
  return null
}

/**
 * Vitest custom matchers for screen assertions.
 * Register with: expect.extend(screenMatchers)
 */
export const screenMatchers = {
  toHaveCharAt(
    this: ScreenCellMatcherContext,
    received: unknown,
    x: number,
    y: number,
    expected: string
  ): { pass: boolean; message: () => string } {
    const source = extractSource(received)
    if (!source) {
      return {
        pass: false,
        message: () => `Expected a screen source (DecodedScreenState, DisplaySnapshotV1, or ScreenSource), but received ${typeof received}`,
      }
    }
    const actual = source.getChar(x, y)
    const pass = this.equals(actual, expected)
    return {
      pass,
      message: () =>
        `Expected char at (${x}, ${y})${this.isNot ? ' not' : ''} to be '${expected}', but got '${actual}'`,
    }
  },

  toHaveColorPatternAt(
    this: ScreenCellMatcherContext,
    received: unknown,
    x: number,
    y: number,
    expected: number
  ): { pass: boolean; message: () => string } {
    const source = extractSource(received)
    if (!source) {
      return {
        pass: false,
        message: () => `Expected a screen source (DecodedScreenState, DisplaySnapshotV1, or ScreenSource), but received ${typeof received}`,
      }
    }
    const actual = source.getPattern(x, y)
    const pass = this.equals(actual, expected)
    return {
      pass,
      message: () =>
        `Expected colorPattern at (${x}, ${y})${this.isNot ? ' not' : ''} to be ${expected}, but got ${actual}`,
    }
  },

  toHaveTextAt(
    this: ScreenCellMatcherContext,
    received: unknown,
    x: number,
    y: number,
    expected: string
  ): { pass: boolean; message: () => string } {
    const source = extractSource(received)
    if (!source) {
      return {
        pass: false,
        message: () => `Expected a screen source (DecodedScreenState, DisplaySnapshotV1, or ScreenSource), but received ${typeof received}`,
      }
    }
    const actualChars: string[] = []
    for (let i = 0; i < expected.length; i++) {
      actualChars.push(source.getChar(x + i, y))
    }
    const actual = actualChars.join('')
    const pass = this.equals(actual, expected)
    return {
      pass,
      message: () =>
        `Expected text at (${x}, ${y})${this.isNot ? ' not' : ''} to be '${expected}', but got '${actual}'`,
    }
  },
}
