/**
 * Test Device Adapter
 *
 * A mock implementation of BasicDeviceAdapter for unit testing the BasicInterpreter.
 * Provides controlled behavior for testing without external dependencies.
 *
 * Screen output capture and display state tracking are delegated to TestScreenCapture.
 * Backward-compatible property accessors proxy to screen.* so existing tests
 * continue to work unchanged. New code should access screen.* directly.
 */

import type { CompiledAudio } from '@/core/sound/types'
import type { BasicDeviceAdapter } from '@/core/types/device-types'
import type { BgGridData } from '@/features/bg-editor/types'
import { logDevice } from '@/shared/logger'

import { TestDeviceInputScheduler } from './TestDeviceInputScheduler'
import { TestScreenCapture } from './TestScreenCapture'

export class TestDeviceAdapter implements BasicDeviceAdapter {
  // === SCREEN CAPTURE (delegated) ===
  public readonly screen = new TestScreenCapture()

  // === JOYSTICK STATE ===
  private joystickCount = 2
  private stickStates: Map<number, number> = new Map()
  private strigBuffer: Map<number, number[]> = new Map()

  // === INPUT (for INPUT/LINPUT executor tests) ===
  public inputResponseQueue: string[][] = []

  // === INPUT TIMELINE SCHEDULING ===
  public readonly inputScheduler = new TestDeviceInputScheduler({
    setStickState: (player, direction) => this.setStickState(player, direction),
    pushStrigState: (player, button) => this.pushStrigState(player, button),
    setInkeyState: (keyChar) => this.setInkeyStateForTest(keyChar),
  })

  // === SPRITE STATE ===
  private spritePositions: Map<number, { x: number; y: number }> = new Map()

  // === SOUND CAPTURE ===
  public playSoundCalls: CompiledAudio[] = []
  public playSoundBackgroundCalls: CompiledAudio[] = []
  public beepCalls: number = 0

  // === BG GRAPHIC (VIEW command) ===
  public copyBgGraphicToBackgroundCalls = 0
  private seededBgData: BgGridData | null = null

  // === KEYBOARD INPUT (INKEY$) ===
  private inkeyState: string = ''
  public waitForInkeyQueue: string[] = []

  constructor() {
    logDevice.debug('TestDeviceAdapter created')
  }

  // ===========================================================================
  // Backward-compatible property accessors
  // New code should use screen.* directly. These exist so that the ~50 test
  // files referencing adapter.printOutputs etc. continue to compile unchanged.
  // ===========================================================================

  get printOutputs() { return this.screen.printOutputs }
  set printOutputs(v: string[]) { this.screen.printOutputs = v }
  get debugOutputs() { return this.screen.debugOutputs }
  set debugOutputs(v: string[]) { this.screen.debugOutputs = v }
  get errorOutputs() { return this.screen.errorOutputs }
  set errorOutputs(v: string[]) { this.screen.errorOutputs = v }
  get clearScreenCalls() { return this.screen.clearScreenCalls }
  set clearScreenCalls(v: number) { this.screen.clearScreenCalls = v }
  get cursorPosition() { return this.screen.cursorPosition }
  set cursorPosition(v: { x: number; y: number }) { this.screen.cursorPosition = v }
  get colorPatternCalls() { return this.screen.colorPatternCalls }
  set colorPatternCalls(v: Array<{ x: number; y: number; pattern: number }>) { this.screen.colorPatternCalls = v }
  get colorPaletteCalls() { return this.screen.colorPaletteCalls }
  set colorPaletteCalls(v: Array<{ bgPalette: number; spritePalette: number }>) { this.screen.colorPaletteCalls = v }
  get paletteCombinationCalls() { return this.screen.paletteCombinationCalls }
  set paletteCombinationCalls(v: typeof this.screen.paletteCombinationCalls) { this.screen.paletteCombinationCalls = v }
  get currentColorPalette() { return this.screen.currentColorPalette }
  set currentColorPalette(v: { bgPalette: number; spritePalette: number }) { this.screen.currentColorPalette = v }
  get runtimeBackgroundPalettes() { return this.screen.runtimeBackgroundPalettes }
  set runtimeBackgroundPalettes(v: [number, number, number, number][][]) { this.screen.runtimeBackgroundPalettes = v }
  get runtimeSpritePalettes() { return this.screen.runtimeSpritePalettes }
  set runtimeSpritePalettes(v: [number, number, number, number][][]) { this.screen.runtimeSpritePalettes = v }
  get backdropColorCalls() { return this.screen.backdropColorCalls }
  set backdropColorCalls(v: number[]) { this.screen.backdropColorCalls = v }
  get currentBackdropColor() { return this.screen.currentBackdropColor }
  set currentBackdropColor(v: number) { this.screen.currentBackdropColor = v }
  get cgenModeCalls() { return this.screen.cgenModeCalls }
  set cgenModeCalls(v: number[]) { this.screen.cgenModeCalls = v }
  get currentCgenMode() { return this.screen.currentCgenMode }
  set currentCgenMode(v: number) { this.screen.currentCgenMode = v }

  // ===========================================================================
  // JOYSTICK INPUT
  // ===========================================================================

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

  // ===========================================================================
  // KEYBOARD INPUT (INKEY$)
  // ===========================================================================

  getInkeyState(): string {
    return this.inkeyState
  }

  /** Set keyboard state for testing INKEY$ */
  setInkeyStateForTest(keyChar: string): void {
    this.inkeyState = keyChar
  }

  /** Clear keyboard state (called on key up in real adapter) */
  clearInkeyStateForTest(): void {
    this.inkeyState = ''
  }

  /** Wait for a key press (blocking mode for INKEY$(0)). Returns immediately for testing. */
  waitForInkey?(): Promise<string> {
    if (this.waitForInkeyQueue.length > 0) {
      return Promise.resolve(this.waitForInkeyQueue.shift()!)
    }
    return Promise.resolve(this.inkeyState)
  }

  /** Wait for a key press synchronously (blocking mode for INKEY$(0)). Returns immediately for testing. */
  waitForInkeyBlocking?(): string {
    if (this.waitForInkeyQueue.length > 0) {
      return this.waitForInkeyQueue.shift()!
    }
    return this.inkeyState
  }

  // ===========================================================================
  // SPRITE POSITION
  // ===========================================================================

  getSpritePosition(actionNumber: number): { x: number; y: number } | null {
    return this.spritePositions.get(actionNumber) ?? null
  }

  /** Store position for sprite (called when POSITION runs). */
  setSpritePosition(actionNumber: number, x: number, y: number): void {
    this.spritePositions.set(actionNumber, { x, y })
    logDevice.debug('Set sprite position:', { actionNumber, x, y })
  }

  /** Alias for test helper (setSpritePosition) */
  setSpritePositionForTest(actionNumber: number, x: number, y: number): void {
    this.setSpritePosition(actionNumber, x, y)
  }

  // ===========================================================================
  // INPUT (INPUT/LINPUT)
  // ===========================================================================

  requestInput?(
    _prompt: string,
    _options?: { variableCount?: number; isLinput?: boolean }
  ): Promise<string[]> {
    const values = this.inputResponseQueue.shift()
    return Promise.resolve(values ?? ['0'])
  }

  // ===========================================================================
  // SOUND OUTPUT
  // ===========================================================================

  playSound?(audio: CompiledAudio): Promise<void> {
    this.playSoundCalls.push(audio)
    logDevice.debug('Play sound, channels:', audio.channels.length)
    return Promise.resolve()
  }

  playSoundBackground?(audio: CompiledAudio): void {
    this.playSoundBackgroundCalls.push(audio)
    logDevice.debug('BGPLAY sound, channels:', audio.channels.length)
  }

  beep?(): void {
    this.beepCalls++
    logDevice.debug('Beep')
  }

  // ===========================================================================
  // BG GRAPHIC (VIEW command)
  // ===========================================================================

  copyBgGraphicToBackground?(): void {
    this.copyBgGraphicToBackgroundCalls++
    logDevice.debug('Copy BG GRAPHIC to Background Screen called')
  }

  getSeededBgData(): BgGridData | null {
    return this.seededBgData
  }

  /**
   * Seed BG tile grid data for VIEW command testing.
   * Subclasses with screen buffers (e.g. SharedBufferTestAdapter) override
   * copyBgGraphicToBackground() to apply this data to the buffer.
   */
  seedBgData(bgTiles: BgGridData): void {
    this.seededBgData = bgTiles
    logDevice.debug('BG data seeded:', { rows: bgTiles.length })
  }

  // ===========================================================================
  // TEXT OUTPUT (delegated to screen capture)
  // ===========================================================================

  printOutput(output: string): void {
    this.screen.recordPrintOutput(output)
    logDevice.debug('Print output:', output)
  }

  debugOutput(output: string): void {
    this.screen.recordDebugOutput(output)
    logDevice.debug('Debug output:', output)
  }

  errorOutput(output: string): void {
    this.screen.recordErrorOutput(output)
    logDevice.debug('Error output:', output)
  }

  clearScreen(): void {
    this.screen.recordClearScreen()
    logDevice.debug('Clear screen called')
  }

  setCursorPosition(x: number, y: number): void {
    this.screen.recordCursorPosition(x, y)
    logDevice.debug('Set cursor position:', { x, y })
  }

  getCursorPosition(): { x: number; y: number } {
    return this.screen.cursorPosition
  }

  getScreenCell(x: number, y: number, _colorSwitch = 0): string | number {
    logDevice.debug('Get screen cell:', { x, y })
    return ' '
  }

  setColorPattern(x: number, y: number, pattern: number): void {
    this.screen.recordColorPattern(x, y, pattern)
    logDevice.debug('Set color pattern:', { x, y, pattern })
  }

  setColorPalette(bgPalette: number, spritePalette: number): void {
    this.screen.recordColorPalette(bgPalette, spritePalette)
    logDevice.debug('Set color palette:', { bgPalette, spritePalette })
  }

  setPaletteCombination(target: 'B' | 'S', combination: number, c1: number, c2: number, c3: number, c4: number): void {
    this.screen.recordPaletteCombination(target, combination, c1, c2, c3, c4)
  }

  setBackdropColor(colorCode: number): void {
    this.screen.recordBackdropColor(colorCode)
    logDevice.debug('Set backdrop color:', colorCode)
  }

  setCharacterGeneratorMode(mode: number): void {
    this.screen.recordCgenMode(mode)
    logDevice.debug('Set character generator mode:', mode)
  }

  getCharacterGeneratorMode(): number {
    return this.screen.currentCgenMode
  }

  // ===========================================================================
  // TEST HELPERS
  // ===========================================================================

  /** Set up joystick state for testing */
  setupJoystickState(joystickId: number, stickState: number, strigEvents: number[] = []): void {
    this.setStickState(joystickId, stickState)
    for (const strigEvent of strigEvents) {
      this.pushStrigState(joystickId, strigEvent)
    }
  }

  /** Simulate STRIG button press */
  simulateStrigPress(joystickId: number, buttonValue: number): void {
    this.pushStrigState(joystickId, buttonValue)
  }

  /** Simulate STICK direction */
  simulateStickDirection(joystickId: number, directionValue: number): void {
    this.setStickState(joystickId, directionValue)
  }

  /** Clear all captured outputs */
  clearOutputs(): void {
    this.screen.clearOutputs()
  }

  /** Clear all joystick state */
  clearJoystickState(): void {
    this.stickStates.clear()
    this.strigBuffer.clear()
  }

  /** Reset all state */
  reset(): void {
    this.clearOutputs()
    this.clearJoystickState()
    this.spritePositions.clear()
    this.seededBgData = null
    this.inputScheduler.reset()
  }

  /** Get all captured outputs as a single string */
  getAllOutputs(): string {
    return this.screen.getAllOutputs()
  }

  /** Check if specific output was captured */
  hasOutput(output: string, type: 'print' | 'debug' | 'error' = 'print'): boolean {
    return this.screen.hasOutput(output, type)
  }

  /** Get the number of times clearScreen was called */
  getClearScreenCallCount(): number {
    return this.screen.getClearScreenCallCount()
  }

  /** Check if any STRIG events are pending for a joystick */
  hasPendingStrigEvents(joystickId: number): boolean {
    const buffer = this.strigBuffer.get(joystickId)
    return buffer ? buffer.length > 0 : false
  }

  /** Get pending STRIG events count for a joystick */
  getPendingStrigEventsCount(joystickId: number): number {
    const buffer = this.strigBuffer.get(joystickId)
    return buffer ? buffer.length : 0
  }
}
