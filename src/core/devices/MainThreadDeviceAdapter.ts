/**
 * MainThreadDeviceAdapter
 *
 * A BasicDeviceAdapter implementation for the export runtime that renders
 * directly to an HTML5 canvas on the main thread, without web workers
 * or SharedArrayBuffer.
 *
 * Screen operations are delegated to:
 * - {@link ScreenStateManager} for screen buffer state management
 * - {@link CanvasScreenRenderer} for drawing the buffer to the canvas
 *
 * Sprite operations are delegated to:
 * - {@link CanvasSpriteRenderer} for drawing sprites to the canvas
 *
 * Sound and input dialogs are stubbed for future steps.
 */

import type { CompiledAudio } from '@/core/sound/types'
import type { SpriteState } from '@/core/sprite/types'
import { WebAudioPlayer } from '@/core/sound/WebAudioPlayer'
import type { BasicDeviceAdapter } from '@/core/types/device-types'

import type { CanvasSurface } from './CanvasScreenRenderer'
import { CanvasScreenRenderer } from './CanvasScreenRenderer'
import { CanvasSpriteRenderer } from './CanvasSpriteRenderer'
import { ScreenStateManager } from './ScreenStateManager'

/** Configuration for creating a MainThreadDeviceAdapter. */
export interface MainThreadDeviceAdapterOptions {
  /** The canvas surface to render the screen buffer and sprites to. */
  canvas: CanvasSurface
}

/**
 * Device adapter for the export runtime.
 *
 * Runs on the main thread and renders to a canvas. Used by standalone
 * exported HTML files that cannot use web workers or SharedArrayBuffer.
 *
 * Implements all required methods from BasicDeviceAdapter. Input dialog
 * methods are stubbed no-ops pending future implementation steps.
 */
export class MainThreadDeviceAdapter implements BasicDeviceAdapter {
  private readonly screenState: ScreenStateManager
  private readonly renderer: CanvasScreenRenderer
  private readonly audioPlayer: WebAudioPlayer
  private readonly spriteRenderer: CanvasSpriteRenderer

  // === KEYBOARD INPUT STATE ===

  private currentKey: string = ''

  // === SPRITE POSITION CACHE ===

  private readonly spritePositionCache = new Map<number, { x: number; y: number }>()

  constructor(options: MainThreadDeviceAdapterOptions) {
    this.screenState = new ScreenStateManager()
    this.renderer = new CanvasScreenRenderer(options.canvas)
    this.audioPlayer = new WebAudioPlayer()
    this.spriteRenderer = new CanvasSpriteRenderer(options.canvas)
  }

  // === JOYSTICK INPUT (stubbed — no joystick support in export) ===

  getJoystickCount(): number {
    return 0
  }

  getStickState(_joystickId: number): number {
    return 0
  }

  setStickState(_joystickId: number, _state: number): void {
    // No-op: joystick not supported in export
  }

  pushStrigState(_joystickId: number, _state: number): void {
    // No-op: joystick not supported in export
  }

  consumeStrigState(_joystickId: number): number {
    return 0
  }

  // === KEYBOARD INPUT (INKEY$) ===

  getInkeyState(): string {
    return this.currentKey
  }

  setInkeyState(keyChar: string): void {
    this.currentKey = keyChar
  }

  clearInkeyState(): void {
    this.currentKey = ''
  }

  // === SPRITE POSITION ===

  getSpritePosition(actionNumber: number): { x: number; y: number } | null {
    return this.spritePositionCache.get(actionNumber) ?? null
  }

  setSpritePosition(actionNumber: number, x: number, y: number): void {
    this.spritePositionCache.set(actionNumber, { x, y })
  }

  clearSpritePosition(actionNumber: number): void {
    this.spritePositionCache.delete(actionNumber)
  }

  // === SPRITE STATE NOTIFICATION ===

  /**
   * Receive sprite states from the executor and render them to the canvas.
   *
   * Called when DEF SPRITE, SPRITE, or SPRITE ON/OFF commands execute.
   * Stores the sprite states and renders visible sprites on the canvas
   * overlay (after the text screen layer).
   */
  sendSpriteStates(spriteStates: SpriteState[], spriteEnabled: boolean): void {
    this.spriteRenderer.setSpriteEnabled(spriteEnabled)
    this.spriteRenderer.renderSprites(spriteStates)
  }

  // === SOUND OUTPUT ===

  playSound(audio: CompiledAudio): Promise<void> {
    return this.audioPlayer.playSound(audio)
  }

  playSoundBackground(audio: CompiledAudio): void {
    this.audioPlayer.playSoundBackground(audio)
  }

  beep(): void {
    this.audioPlayer.beep()
  }

  // === TEXT OUTPUT ===

  printOutput(output: string): void {
    this.writeToScreen(output)
  }

  debugOutput(output: string): void {
    this.writeToScreen(output)
  }

  errorOutput(output: string): void {
    this.writeToScreen(output)
  }

  clearScreen(): void {
    this.screenState.initializeScreen()
    this.renderer.clear()
  }

  setCursorPosition(x: number, y: number): void {
    this.screenState.setCursorPosition(x, y)
  }

  getCursorPosition(): { x: number; y: number } {
    return this.screenState.getCursorPosition()
  }

  getScreenCell(x: number, y: number, colorSwitch?: number): string | number {
    return this.screenState.getScreenCell(x, y, colorSwitch)
  }

  setColorPattern(x: number, y: number, pattern: number): void {
    this.screenState.setColorPattern(x, y, pattern)
  }

  setColorPalette(bgPalette: number, spritePalette: number): void {
    this.screenState.setColorPalette(bgPalette, spritePalette)
  }

  setPaletteCombination(
    target: 'B' | 'S',
    combination: number,
    c1: number,
    c2: number,
    c3: number,
    c4: number,
  ): void {
    this.screenState.setPaletteCombination(target, combination, [c1, c2, c3, c4])
  }

  setBackdropColor(colorCode: number): void {
    this.screenState.setBackdropColor(colorCode)
  }

  setCharacterGeneratorMode(mode: number): void {
    this.screenState.setCharacterGeneratorMode(mode)
  }

  getCharacterGeneratorMode(): number {
    return this.screenState.getCgenMode()
  }

  // === RESET ===

  /**
   * Reset all screen and sprite state, then re-render the screen.
   * Called when starting a new program execution.
   */
  resetState(): void {
    this.screenState.resetState()
    this.spriteRenderer.resetState()
    this.spritePositionCache.clear()
    this.renderer.render(this.screenState.getScreenBuffer())
  }

  // === PRIVATE HELPERS ===

  /**
   * Write a string to the screen buffer and trigger canvas rendering.
   * Handles each character individually to properly manage cursor
   * position (newlines, scrolling, line wrapping).
   */
  private writeToScreen(output: string): void {
    for (const char of output) {
      this.screenState.writeCharacter(char)
    }
    this.renderer.render(this.screenState.getScreenBuffer())
  }
}
