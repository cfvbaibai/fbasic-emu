/**
 * Device Screen Manager
 *
 * Manages all screen-related operations for WebWorkerDeviceAdapter.
 * Extracted to prevent the adapter from recurring 500-line overflow.
 *
 * Owns: ScreenStateManager, ScreenUpdateBatcher, shared display buffer accessor,
 * BG grid data, and all screen sync/palette/color/cursor operations.
 */

import type { SharedDisplayBufferAccessor } from '@/core/animation/sharedDisplayBufferAccessor'
import type { ScreenCell } from '@/core/types/execution-types'
import type { BgGridData } from '@/features/bg-editor/types'
import { logWorker } from '@/shared/logger'

import { copyBgGraphicToScreenBuffer } from './DeviceBgGraphicHelpers'
import { postOutputMessage } from './DeviceOutputHelpers'
import { ScreenStateManager } from './ScreenStateManager'
import { ScreenUpdateBatcher } from './ScreenUpdateBatcher'

export class DeviceScreenManager {
  private screenStateManager: ScreenStateManager
  private sharedDisplayAccessor: SharedDisplayBufferAccessor | null = null
  /** BG GRAPHIC data for VIEW command. Set via SET_BG_DATA message from main thread. */
  private bgGridData: BgGridData | null = null
  private readonly screenUpdateBatcher: ScreenUpdateBatcher

  constructor() {
    this.screenStateManager = new ScreenStateManager()
    this.screenUpdateBatcher = new ScreenUpdateBatcher(() => {
      this.syncScreenStateToShared()
      this.postScreenChanged()
    })
  }

  // === SCREEN STATE ACCESSORS ===

  /** Get the current execution ID from screen state. */
  getCurrentExecutionId(): string | null {
    return this.screenStateManager.getCurrentExecutionId()
  }

  /** Get the screen buffer. */
  getScreenBuffer(): ScreenCell[][] {
    return this.screenStateManager.getScreenBuffer()
  }

  // === EXECUTION LIFECYCLE ===

  /** Set the current execution ID and perform screen initialization. */
  setCurrentExecutionId(executionId: string | null): void {
    this.screenStateManager.setCurrentExecutionId(executionId)
    if (executionId) {
      this.screenStateManager.resetState()
      this.bgGridData = null
      this.syncScreenStateToShared()
      this.postScreenChanged()
      this.cancelPendingScreenUpdate()
      // Send palette-combination reset messages so the main thread's
      // BACKGROUND_PALETTES and SPRITE_PALETTES are also restored to defaults.
      this.postPaletteCombinationResetMessages()
    } else {
      this.screenUpdateBatcher.flush()
    }
  }

  // === TEXT OUTPUT METHODS ===

  printOutput(output: string): void {
    postOutputMessage(this.screenStateManager.getCurrentExecutionId() ?? 'unknown', output, 'print')
    for (const char of output) {
      this.screenStateManager.writeCharacter(char)
    }
    this.screenUpdateBatcher.schedule()
  }

  debugOutput(output: string): void {
    postOutputMessage(this.screenStateManager.getCurrentExecutionId() ?? 'unknown', output, 'debug')
  }

  errorOutput(output: string): void {
    postOutputMessage(this.screenStateManager.getCurrentExecutionId() ?? 'unknown', output, 'error')
  }

  // === SCREEN OPERATIONS ===

  clearScreen(): void {
    this.screenStateManager.initializeScreen()
    this.syncScreenStateToShared()
    this.postScreenChanged()
    this.cancelPendingScreenUpdate()
  }

  setCursorPosition(x: number, y: number): void {
    this.screenStateManager.setCursorPosition(x, y)
    this.syncScreenStateToShared()
    this.postScreenChanged()
  }

  getCursorPosition(): { x: number; y: number } {
    return this.screenStateManager.getCursorPosition()
  }

  getScreenCell(x: number, y: number, colorSwitch = 0): string | number {
    return this.screenStateManager.getScreenCell(x, y, colorSwitch)
  }

  setColorPattern(x: number, y: number, pattern: number): void {
    this.screenStateManager.setColorPattern(x, y, pattern)
    this.syncScreenStateToShared()
    this.postScreenChanged()
  }

  setColorPalette(bgPalette: number, spritePalette: number): void {
    this.screenStateManager.setColorPalette(bgPalette, spritePalette)
    this.syncScreenStateToShared()
    this.postScreenChanged()
  }

  setPaletteCombination(
    target: 'B' | 'S', combination: number,
    c1: number, c2: number, c3: number, c4: number
  ): void {
    const { paletteIndex, colors } = this.screenStateManager.setPaletteCombination(
      target, combination, [c1, c2, c3, c4]
    )
    self.postMessage({
      type: 'SCREEN_UPDATE',
      id: `screen-palette-combination-${Date.now()}`,
      timestamp: Date.now(),
      data: {
        executionId: this.screenStateManager.getCurrentExecutionId() ?? 'unknown',
        updateType: 'palette-combination',
        paletteTarget: target,
        paletteIndex,
        paletteCombination: combination,
        paletteColors: colors,
        timestamp: Date.now(),
      },
    })
  }

  setBackdropColor(colorCode: number): void {
    this.screenStateManager.setBackdropColor(colorCode)
    this.syncScreenStateToShared()
    this.postScreenChanged()
  }

  setCharacterGeneratorMode(mode: number): void {
    this.screenStateManager.setCharacterGeneratorMode(mode)
    this.syncScreenStateToShared()
    this.postScreenChanged()
  }

  getCharacterGeneratorMode(): number {
    return this.screenStateManager.getCgenMode()
  }

  // === BG GRAPHIC METHODS (VIEW command) ===

  /** Set BG grid data for VIEW command. */
  setBgGridData(data: BgGridData): void {
    this.bgGridData = data
  }

  /** Copy BG GRAPHIC to Background Screen (per F-BASIC Manual page 36). */
  copyBgGraphicToBackground(): void {
    if (!this.bgGridData) return
    copyBgGraphicToScreenBuffer(this.bgGridData, this.screenStateManager.getScreenBuffer())
    this.syncScreenStateToShared()
    this.postScreenChanged()
  }

  // === SHARED DISPLAY BUFFER ===

  /** Set shared display buffer accessor. */
  setSharedDisplayBufferAccessor(accessor: SharedDisplayBufferAccessor): void {
    this.sharedDisplayAccessor = accessor
  }

  /** Get the shared display buffer accessor for sprite position queries. */
  getSharedDisplayAccessor(): SharedDisplayBufferAccessor | null {
    return this.sharedDisplayAccessor
  }

  /** Cancel any pending screen update. */
  cancelPendingScreenUpdate(): void {
    this.screenUpdateBatcher.cancel()
  }

  // === PRIVATE METHODS ===

  private syncScreenStateToShared(): void {
    const accessor = this.sharedDisplayAccessor
    if (!accessor) return
    const manager = this.screenStateManager
    if (!manager) return
    const buffer = manager.getScreenBuffer()
    if (buffer == null) {
      logWorker.warn('[DeviceScreenManager] syncScreenStateToShared: getScreenBuffer() returned null/undefined, skipping')
      return
    }
    const { x: cursorX, y: cursorY } = manager.getCursorPosition()
    const { bgPalette, spritePalette } = manager.getPalette()
    accessor.writeScreenState(
      buffer, cursorX, cursorY, bgPalette, spritePalette,
      manager.getBackdropColor(), manager.getCgenMode()
    )
    accessor.incrementSequence()
  }

  private postScreenChanged(): void {
    self.postMessage({
      type: 'SCREEN_CHANGED',
      id: `screen-changed-${Date.now()}`,
      timestamp: Date.now(),
    })
  }

  /**
   * Send palette-combination SCREEN_UPDATE messages to reset the main thread's
   * BACKGROUND_PALETTES and SPRITE_PALETTES to their original values.
   * Called after resetState() to keep the worker as the single source of truth.
   */
  private postPaletteCombinationResetMessages(): void {
    const executionId = this.screenStateManager.getCurrentExecutionId() ?? 'unknown'
    const { background, sprite } = this.screenStateManager.getAllPaletteCombinations()

    for (const entry of background) {
      this.postSinglePaletteCombinationMessage(executionId, 'B', entry.paletteIndex, entry.combination, entry.colors)
    }
    for (const entry of sprite) {
      this.postSinglePaletteCombinationMessage(executionId, 'S', entry.paletteIndex, entry.combination, entry.colors)
    }
  }

  private postSinglePaletteCombinationMessage(
    executionId: string,
    target: 'B' | 'S',
    paletteIndex: number,
    combination: number,
    colors: [number, number, number, number],
  ): void {
    self.postMessage({
      type: 'SCREEN_UPDATE',
      id: `screen-palette-combination-reset-${Date.now()}-${target}${paletteIndex}-${combination}`,
      timestamp: Date.now(),
      data: {
        executionId,
        updateType: 'palette-combination',
        paletteTarget: target,
        paletteIndex,
        paletteCombination: combination,
        paletteColors: colors,
        timestamp: Date.now(),
      },
    })
  }
}
