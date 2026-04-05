/**
 * Shared Buffer Test Adapter
 *
 * A test device adapter that synchronizes state to shared buffers for integration testing.
 * Extends TestDeviceAdapter with optional shared buffer participation.
 */

import {
  COLS,
  createViewsFromDisplayBuffer,
  ROWS,
  type SharedDisplayViews,
} from '@/core/animation/sharedDisplayBuffer'
import { SharedDisplayBufferAccessor } from '@/core/animation/sharedDisplayBufferAccessor'
import { copyBgGraphicToScreenBuffer } from '@/core/devices/DeviceBgGraphicHelpers'
import { TestDeviceAdapter } from '@/core/devices/TestDeviceAdapter'
import type { ScreenCell } from '@/core/types/execution-types'

/**
 * Configuration for shared buffer test adapter
 */
export interface SharedBufferTestConfig {
  /** Enable shared display buffer synchronization */
  enableDisplayBuffer?: boolean
  /** Enable shared animation buffer synchronization */
  enableAnimationBuffer?: boolean
}

/**
 * Test adapter with optional shared buffer synchronization.
 * When enabled, screen state is synced to shared display buffer after each operation.
 * This allows integration tests to verify buffer contents directly.
 */
export class SharedBufferTestAdapter extends TestDeviceAdapter {
  private displayViews: SharedDisplayViews | null = null
  private displayAccessor: SharedDisplayBufferAccessor | null = null
  private enableDisplaySync: boolean = false
  private enableAnimationSync: boolean = false

  // Internal screen buffer for tracking screen state
  private screenBuffer: ScreenCell[][] = []
  private cursorX: number = 0
  private cursorY: number = 0
  private bgPalette: number = 1
  private spritePalette: number = 1
  private backdropColor: number = 0
  private cgenMode: number = 2

  constructor() {
    super()
    this.initializeScreenBuffer()
  }

  /**
   * Initialize internal screen buffer with empty cells
   */
  private initializeScreenBuffer(): void {
    this.screenBuffer = []
    for (let y = 0; y < ROWS; y++) {
      const row: ScreenCell[] = []
      for (let x = 0; x < COLS; x++) {
        row.push({ character: ' ', colorPattern: 0, x, y })
      }
      this.screenBuffer.push(row)
    }
  }

  /**
   * Set shared display buffer for synchronization
   */
  setSharedDisplayBuffer(buffer: SharedArrayBuffer | undefined): void {
    if (buffer) {
      this.displayViews = createViewsFromDisplayBuffer(buffer)
      this.displayAccessor = new SharedDisplayBufferAccessor(buffer)
    } else {
      this.displayViews = null
      this.displayAccessor = null
    }
  }

  /**
   * Configure shared buffer participation
   */
  configure(config: SharedBufferTestConfig): void {
    this.enableDisplaySync = config.enableDisplayBuffer ?? false
    this.enableAnimationSync = config.enableAnimationBuffer ?? false
  }

  /**
   * Get the shared display buffer views for test assertions
   */
  getDisplayViews(): SharedDisplayViews | null {
    return this.displayViews
  }

  /**
   * Get internal screen buffer for test assertions
   */
  getScreenBuffer(): ScreenCell[][] {
    return this.screenBuffer
  }

  /** Sync current state to shared display buffer */
  private syncToDisplayBuffer(): void {
    if (!this.enableDisplaySync || !this.displayAccessor) {
      return
    }

    this.displayAccessor.writeScreenState(
      this.screenBuffer,
      this.cursorX,
      this.cursorY,
      this.bgPalette,
      this.spritePalette,
      this.backdropColor,
      this.cgenMode
    )
    this.displayAccessor.incrementSequence()
  }

  // === OVERRIDDEN METHODS WITH BUFFER SYNC ===

  override printOutput(output: string): void {
    super.printOutput(output)

    // Write to internal screen buffer
    for (const char of output) {
      if (char === '\n') {
        this.cursorY++
        this.cursorX = 0
      } else if (char !== '\r') {
        if (this.cursorX < COLS && this.cursorY < ROWS) {
          this.screenBuffer[this.cursorY]![this.cursorX]!.character = char
          this.cursorX++
        }
      }
    }

    // Wrap cursor if needed
    if (this.cursorX >= COLS) {
      this.cursorX = 0
      this.cursorY++
    }
    if (this.cursorY >= ROWS) {
      this.cursorY = ROWS - 1
    }

    this.syncToDisplayBuffer()
  }

  override clearScreen(): void {
    super.clearScreen()
    this.initializeScreenBuffer()
    this.cursorX = 0
    this.cursorY = 0
    this.syncToDisplayBuffer()
  }

  override setCursorPosition(x: number, y: number): void {
    super.setCursorPosition(x, y)
    this.cursorX = Math.max(0, Math.min(COLS - 1, x))
    this.cursorY = Math.max(0, Math.min(ROWS - 1, y))
    this.syncToDisplayBuffer()
  }

  override setColorPattern(x: number, y: number, pattern: number): void {
    super.setColorPattern(x, y, pattern)

    // Clamp to valid range
    if (x < 0) x = 0
    if (x >= COLS) x = COLS - 1
    if (y < 0) y = 0
    if (y >= ROWS) y = ROWS - 1
    if (pattern < 0) pattern = 0
    if (pattern > 3) pattern = 3

    // Calculate the 2×2 area containing position (x, y)
    const areaX = Math.floor(x / 2) * 2 // Round down to even number (0, 2, 4, ...)
    const areaY = y // The y coordinate itself is the bottom row of the area

    // Update color pattern for all 4 cells in the 2×2 area
    // Top-left: (areaX, areaY - 1) or (areaX, 0) if areaY is 0
    const topY = areaY > 0 ? areaY - 1 : 0
    if (areaX < COLS && topY < ROWS) {
      const cell = this.screenBuffer[topY]?.[areaX]
      if (cell) {
        cell.colorPattern = pattern & 3
      }
    }

    // Top-right: (areaX + 1, areaY - 1) or (areaX + 1, 0) if areaY is 0
    if (areaX + 1 < COLS && topY < ROWS) {
      const row = this.screenBuffer[topY]
      const cell = row?.[areaX + 1]
      if (cell) {
        cell.colorPattern = pattern & 3
      }
    }

    // Bottom-left: (areaX, areaY)
    if (areaX < COLS && areaY < ROWS) {
      const row = this.screenBuffer[areaY]
      const cell = row?.[areaX]
      if (cell) {
        cell.colorPattern = pattern & 3
      }
    }

    // Bottom-right: (areaX + 1, areaY)
    if (areaX + 1 < COLS && areaY < ROWS) {
      const row = this.screenBuffer[areaY]
      const cell = row?.[areaX + 1]
      if (cell) {
        cell.colorPattern = pattern & 3
      }
    }

    this.syncToDisplayBuffer()
  }

  override setColorPalette(bgPalette: number, spritePalette: number): void {
    super.setColorPalette(bgPalette, spritePalette)
    this.bgPalette = bgPalette & 1
    this.spritePalette = spritePalette & 3
    this.syncToDisplayBuffer()
  }

  override setBackdropColor(colorCode: number): void {
    super.setBackdropColor(colorCode)
    this.backdropColor = Math.max(0, Math.min(60, colorCode))
    this.syncToDisplayBuffer()
  }

  /**
   * Apply seeded BG GRAPHIC data to the screen buffer.
   * If seedBgData() was called before execution, VIEW command will
   * copy the BG tile grid into the internal screen buffer.
   */
  override copyBgGraphicToBackground(): void {
    super.copyBgGraphicToBackground!()
    const bgData = this.getSeededBgData()
    if (bgData) {
      copyBgGraphicToScreenBuffer(bgData, this.screenBuffer)
      this.syncToDisplayBuffer()
    }
  }

  override setCharacterGeneratorMode(mode: number): void {
    super.setCharacterGeneratorMode(mode)
    this.cgenMode = mode & 3
    this.syncToDisplayBuffer()
  }

  /**
   * Reset adapter state including screen buffer
   */
  override reset(): void {
    super.reset()
    this.initializeScreenBuffer()
    this.cursorX = 0
    this.cursorY = 0
    this.bgPalette = 1
    this.spritePalette = 1
    this.backdropColor = 0
    this.cgenMode = 2

    // Reset shared buffer if enabled
    if (this.enableDisplaySync && this.displayAccessor) {
      this.displayAccessor.writeScreenState(
        this.screenBuffer,
        0,
        0,
        1,
        1,
        0,
        2
      )
      this.displayAccessor.incrementSequence()
    }
  }
}
