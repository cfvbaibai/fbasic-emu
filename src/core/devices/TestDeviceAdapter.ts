/**
 * Test Device Adapter
 *
 * A mock implementation of BasicDeviceAdapter for unit testing the BasicInterpreter.
 * Provides controlled behavior for testing without external dependencies.
 */

import type { CompiledAudio } from '@/core/sound/types'
import type { BasicDeviceAdapter } from '@/core/types/device-types'
import type { BgGridData } from '@/features/bg-editor/types'
import { logDevice } from '@/shared/logger'

import {
  aggregateAllOutputs,
  applyPaletteCombination,
  DEFAULT_BACKGROUND_PALETTES,
  DEFAULT_SPRITE_PALETTES,
} from './TestDeviceAdapterHelpers'
import { TestDeviceInputScheduler } from './TestDeviceInputScheduler'

export class TestDeviceAdapter implements BasicDeviceAdapter {
  // === JOYSTICK STATE ===
  private joystickCount = 2
  private stickStates: Map<number, number> = new Map()
  private strigBuffer: Map<number, number[]> = new Map()

  // === OUTPUT CAPTURE ===
  public printOutputs: string[] = []
  public debugOutputs: string[] = []
  public errorOutputs: string[] = []
  public clearScreenCalls = 0
  public cursorPosition: { x: number; y: number } = { x: 0, y: 0 }
  public colorPatternCalls: Array<{ x: number; y: number; pattern: number }> = []
  public colorPaletteCalls: Array<{
    bgPalette: number
    spritePalette: number
  }> = []
  public paletteCombinationCalls: Array<{
    target: 'B' | 'S'
    paletteIndex: number
    combination: number
    colors: [number, number, number, number]
  }> = []
  public currentColorPalette: { bgPalette: number; spritePalette: number } = {
    bgPalette: 1,
    spritePalette: 1,
  }
  public runtimeBackgroundPalettes = DEFAULT_BACKGROUND_PALETTES.map(
    p => p.map(c => [...c] as [number, number, number, number])
  )
  public runtimeSpritePalettes = DEFAULT_SPRITE_PALETTES.map(
    p => p.map(c => [...c] as [number, number, number, number])
  )
  public backdropColorCalls: number[] = []
  public currentBackdropColor: number = 0 // Default backdrop color (0 = black)
  public cgenModeCalls: number[] = []
  public currentCgenMode: number = 2 // Default is 2 (B on BG, A on sprite)

  private spritePositions: Map<number, { x: number; y: number }> = new Map()

  // === INPUT (for INPUT/LINPUT executor tests) ===
  /** Queue of responses for requestInput; each call pops the next. Default: ['0'] if empty. */
  public inputResponseQueue: string[][] = []

  // === INPUT TIMELINE SCHEDULING ===
  /** Scheduler delegates frame tracking and event delivery. Public for direct access. */
  public readonly inputScheduler = new TestDeviceInputScheduler({
    setStickState: (player, direction) => this.setStickState(player, direction),
    pushStrigState: (player, button) => this.pushStrigState(player, button),
    setInkeyState: (keyChar) => this.setInkeyStateForTest(keyChar),
  })

  constructor() {
    logDevice.debug('TestDeviceAdapter created')
  }

  // === JOYSTICK INPUT METHODS ===

  getJoystickCount(): number {
    return this.joystickCount
  }

  getStickState(joystickId: number): number {
    return this.stickStates.get(joystickId) ?? 0
  }

  setStickState(joystickId: number, state: number): void {
    this.stickStates.set(joystickId, state)
    logDevice.debug('Stick state set:', { joystickId, state })
  }

  pushStrigState(joystickId: number, state: number): void {
    if (!this.strigBuffer.has(joystickId)) {
      this.strigBuffer.set(joystickId, [])
    }
    const buffer = this.strigBuffer.get(joystickId)!
    buffer.push(state)
    logDevice.debug('STRIG state pushed:', {
      joystickId,
      state,
      bufferSize: buffer.length,
    })
  }

  consumeStrigState(joystickId: number): number {
    if (!this.strigBuffer.has(joystickId)) {
      return 0
    }

    const buffer = this.strigBuffer.get(joystickId)!
    if (buffer.length === 0) {
      return 0
    }

    const state = buffer.shift()!
    logDevice.debug('STRIG state consumed:', {
      joystickId,
      state,
      remaining: buffer.length,
    })
    return state
  }

  // === KEYBOARD INPUT (INKEY$) ===

  /** Current keyboard state for INKEY$ testing */
  private inkeyState: string = ''

  getInkeyState(): string {
    return this.inkeyState
  }

  /**
   * Set keyboard state for testing INKEY$
   */
  setInkeyStateForTest(keyChar: string): void {
    this.inkeyState = keyChar
  }

  /**
   * Clear keyboard state (called on key up in real adapter)
   */
  clearInkeyStateForTest(): void {
    this.inkeyState = ''
  }

  /** Queue of key responses for waitForInkey; each call pops the next. */
  public waitForInkeyQueue: string[] = []

  /**
   * Wait for a key press (blocking mode for INKEY$(0)).
   * For testing: returns immediately with queued key or current state.
   */
  waitForInkey?(): Promise<string> {
    // First check if there's a queued response
    if (this.waitForInkeyQueue.length > 0) {
      return Promise.resolve(this.waitForInkeyQueue.shift()!)
    }
    // Otherwise return current state (may be empty string if no key pressed)
    return Promise.resolve(this.inkeyState)
  }

  /**
   * Wait for a key press synchronously (blocking mode for INKEY$(0)).
   * For testing: returns immediately with queued key or current state.
   */
  waitForInkeyBlocking?(): string {
    // First check if there's a queued response
    if (this.waitForInkeyQueue.length > 0) {
      return this.waitForInkeyQueue.shift()!
    }
    // Otherwise return current state
    return this.inkeyState
  }

  // === SPRITE POSITION QUERY ===

  getSpritePosition(actionNumber: number): { x: number; y: number } | null {
    return this.spritePositions.get(actionNumber) ?? null
  }

  /**
   * Store position for sprite (called when POSITION runs).
   * Used so MOVE uses it when no prior START_MOVEMENT.
   */
  setSpritePosition(actionNumber: number, x: number, y: number): void {
    this.spritePositions.set(actionNumber, { x, y })
    logDevice.debug('Set sprite position:', { actionNumber, x, y })
  }

  /**
   * Set sprite position for XPOS/YPOS tests (alias for test helper)
   */
  setSpritePositionForTest(actionNumber: number, x: number, y: number): void {
    this.setSpritePosition(actionNumber, x, y)
  }

  // === INPUT (INPUT/LINPUT) ===

  requestInput?(
    _prompt: string,
    _options?: { variableCount?: number; isLinput?: boolean }
  ): Promise<string[]> {
    const values = this.inputResponseQueue.shift()
    return Promise.resolve(values ?? ['0'])
  }

  // === SOUND OUTPUT ===

  /** Captured playSound calls for testing */
  public playSoundCalls: CompiledAudio[] = []

  playSound?(audio: CompiledAudio): Promise<void> {
    this.playSoundCalls.push(audio)
    logDevice.debug('Play sound, channels:', audio.channels.length)
    return Promise.resolve()
  }

  /** Captured playSoundBackground calls for testing */
  public playSoundBackgroundCalls: CompiledAudio[] = []

  playSoundBackground?(audio: CompiledAudio): void {
    this.playSoundBackgroundCalls.push(audio)
    logDevice.debug('BGPLAY sound, channels:', audio.channels.length)
  }

  /** Captured beep calls for testing */
  public beepCalls: number = 0

  beep?(): void {
    this.beepCalls++
    logDevice.debug('Beep')
  }

  // === BG GRAPHIC (VIEW command) ===

  /** Count of copyBgGraphicToBackground calls for testing */
  public copyBgGraphicToBackgroundCalls = 0

  /** Seeded BG grid data for VIEW command testing. Null until seedBgData() is called. */
  private seededBgData: BgGridData | null = null

  copyBgGraphicToBackground?(): void {
    this.copyBgGraphicToBackgroundCalls++
    logDevice.debug('Copy BG GRAPHIC to Background Screen called')
  }

  /**
   * Get the seeded BG grid data, or null if no data has been seeded.
   */
  getSeededBgData(): BgGridData | null {
    return this.seededBgData
  }

  // === TEXT OUTPUT METHODS ===

  printOutput(output: string): void {
    this.printOutputs.push(output)
    logDevice.debug('Print output:', output)
  }

  debugOutput(output: string): void {
    this.debugOutputs.push(output)
    logDevice.debug('Debug output:', output)
  }

  errorOutput(output: string): void {
    this.errorOutputs.push(output)
    logDevice.debug('Error output:', output)
  }

  clearScreen(): void {
    this.clearScreenCalls++
    this.printOutputs = []
    this.debugOutputs = []
    this.errorOutputs = []
    logDevice.debug('Clear screen called')
  }

  setCursorPosition(x: number, y: number): void {
    this.cursorPosition = { x, y }
    logDevice.debug('Set cursor position:', { x, y })
  }

  getCursorPosition(): { x: number; y: number } {
    return this.cursorPosition
  }

  getScreenCell(x: number, y: number, _colorSwitch = 0): string | number {
    // Simple implementation for testing - returns space character
    // Real implementation would use screen buffer
    logDevice.debug('Get screen cell:', { x, y })
    return ' '
  }

  setColorPattern(x: number, y: number, pattern: number): void {
    // Store color pattern calls for testing
    if (!this.colorPatternCalls) {
      this.colorPatternCalls = []
    }
    this.colorPatternCalls.push({ x, y, pattern })
    logDevice.debug('Set color pattern:', { x, y, pattern })
  }

  setColorPalette(bgPalette: number, spritePalette: number): void {
    // Store color palette calls for testing
    if (!this.colorPaletteCalls) {
      this.colorPaletteCalls = []
    }
    this.colorPaletteCalls.push({ bgPalette, spritePalette })
    this.currentColorPalette = { bgPalette, spritePalette }
    logDevice.debug('Set color palette:', {
      bgPalette,
      spritePalette,
    })
  }

  setPaletteCombination(target: 'B' | 'S', combination: number, c1: number, c2: number, c3: number, c4: number): void {
    const colors: [number, number, number, number] = [c1, c2, c3, c4]
    const result = applyPaletteCombination(
      target,
      combination,
      colors,
      this.currentColorPalette.bgPalette,
      this.currentColorPalette.spritePalette,
      this.runtimeBackgroundPalettes,
      this.runtimeSpritePalettes
    )
    this.paletteCombinationCalls.push(result)
  }

  setBackdropColor(colorCode: number): void {
    // Store backdrop color calls for testing
    if (!this.backdropColorCalls) {
      this.backdropColorCalls = []
    }
    this.backdropColorCalls.push(colorCode)
    this.currentBackdropColor = colorCode
    logDevice.debug('Set backdrop color:', colorCode)
  }

  setCharacterGeneratorMode(mode: number): void {
    // Store CGEN mode calls for testing
    if (!this.cgenModeCalls) {
      this.cgenModeCalls = []
    }
    this.cgenModeCalls.push(mode)
    this.currentCgenMode = mode
    logDevice.debug('Set character generator mode:', mode)
  }

  getCharacterGeneratorMode(): number {
    return this.currentCgenMode ?? 2 // Default is 2 per F-BASIC spec
  }

  // === TEST HELPER METHODS ===

  /**
   * Set up joystick state for testing
   */
  setupJoystickState(joystickId: number, stickState: number, strigEvents: number[] = []): void {
    this.setStickState(joystickId, stickState)
    for (const strigEvent of strigEvents) {
      this.pushStrigState(joystickId, strigEvent)
    }
  }

  /**
   * Simulate STRIG button press
   */
  simulateStrigPress(joystickId: number, buttonValue: number): void {
    this.pushStrigState(joystickId, buttonValue)
  }

  /**
   * Simulate STICK direction
   */
  simulateStickDirection(joystickId: number, directionValue: number): void {
    this.setStickState(joystickId, directionValue)
  }

  /**
   * Seed BG tile grid data for VIEW command testing.
   * Allows programmatically loading BG data before execution without UI interaction.
   * Subclasses with screen buffers (e.g. SharedBufferTestAdapter) override
   * copyBgGraphicToBackground() to apply this data to the buffer.
   */
  seedBgData(bgTiles: BgGridData): void {
    this.seededBgData = bgTiles
    logDevice.debug('BG data seeded:', { rows: bgTiles.length })
  }

  /**
   * Clear all captured outputs
   */
  clearOutputs(): void {
    this.printOutputs = []
    this.debugOutputs = []
    this.errorOutputs = []
    this.clearScreenCalls = 0
  }

  /**
   * Clear all joystick state
   */
  clearJoystickState(): void {
    this.stickStates.clear()
    this.strigBuffer.clear()
  }

  /**
   * Reset all state
   */
  reset(): void {
    this.clearOutputs()
    this.clearJoystickState()
    this.spritePositions.clear()
    this.seededBgData = null
    this.inputScheduler.reset()
  }

  /**
   * Get all captured outputs as a single string.
   * Delegates to aggregateAllOutputs helper.
   */
  getAllOutputs(): string {
    return aggregateAllOutputs(this.printOutputs, this.debugOutputs, this.errorOutputs)
  }

  /**
   * Check if specific output was captured
   */
  hasOutput(output: string, type: 'print' | 'debug' | 'error' = 'print'): boolean {
    switch (type) {
      case 'print':
        return this.printOutputs.includes(output)
      case 'debug':
        return this.debugOutputs.includes(output)
      case 'error':
        return this.errorOutputs.includes(output)
      default:
        return false
    }
  }

  /**
   * Get the number of times clearScreen was called
   */
  getClearScreenCallCount(): number {
    return this.clearScreenCalls
  }

  /**
   * Check if any STRIG events are pending for a joystick
   */
  hasPendingStrigEvents(joystickId: number): boolean {
    const buffer = this.strigBuffer.get(joystickId)
    return buffer ? buffer.length > 0 : false
  }

  /**
   * Get pending STRIG events count for a joystick
   */
  getPendingStrigEventsCount(joystickId: number): number {
    const buffer = this.strigBuffer.get(joystickId)
    return buffer ? buffer.length : 0
  }
}
