/**
 * Device adapter interfaces for the Family Basic Interpreter
 *
 * Defines the contract between the execution engine and device implementations
 * (Web Worker adapter, test adapter, etc.).
 */

import type { CompiledAudio } from '@/core/sound/types'
import type { SpriteState } from '@/core/sprite/types'

/**
 * Basic Device Adapter interface for Family BASIC interpreter
 *
 * Handles all input/output/debugging/audio features needed for Family BASIC
 */
export interface BasicDeviceAdapter {
  // === JOYSTICK INPUT ===
  getJoystickCount(): number
  getStickState(joystickId: number): number
  setStickState(joystickId: number, state: number): void
  pushStrigState(joystickId: number, state: number): void
  consumeStrigState(joystickId: number): number

  // === KEYBOARD INPUT (INKEY$) ===
  /**
   * Get current keyboard state for INKEY$ function.
   * Returns the currently pressed key character, or empty string if no key pressed.
   * This is a polling (non-consuming) read - the key remains "pressed" until released.
   */
  getInkeyState(): string
  /**
   * Set keyboard state (main thread only).
   * Used to update the current key state when keyboard events occur.
   */
  setInkeyState?(keyChar: string): void
  /**
   * Clear keyboard state (main thread only).
   * Called when key is released.
   */
  clearInkeyState?(): void
  /**
   * Set shared keyboard buffer (worker only).
   * Called when receiving SET_SHARED_KEYBOARD_BUFFER message.
   */
  setSharedKeyboardBuffer?(buffer: SharedArrayBuffer): void
  /**
   * Wait for a key press (blocking mode for INKEY$(0)).
   * Blocks execution until a key is pressed, then returns the character.
   * @returns Promise resolving to the pressed character string
   */
  waitForInkey?(): Promise<string>
  /**
   * Wait for a key press synchronously (blocking mode for INKEY$(0)).
   * Uses Atomics.wait() to block the worker until a key is pressed.
   * @returns The pressed character string, or empty string if timeout/stop
   */
  waitForInkeyBlocking?(): string

  // === SPRITE POSITION QUERY ===
  getSpritePosition(actionNumber: number): { x: number; y: number } | null
  /** Store position for sprite (called when POSITION runs); used so MOVE uses it when no prior START_MOVEMENT. */
  setSpritePosition?(actionNumber: number, x: number, y: number): void
  /** Clear stored position for sprite (e.g. after START_MOVEMENT so next MOVE uses buffer/default). */
  clearSpritePosition?(actionNumber: number): void

  // === SPRITE STATE NOTIFICATION ===
  /**
   * Send sprite states to main thread for rendering.
   * Called by executors when sprite states change (DEF SPRITE, SPRITE, SPRITE ON/OFF).
   * @param spriteStates - Array of all sprite states
   * @param spriteEnabled - Whether sprite display is enabled
   */
  sendSpriteStates?(spriteStates: SpriteState[], spriteEnabled: boolean): void

  // === TEXT OUTPUT ===
  printOutput(output: string): void
  debugOutput(output: string): void
  errorOutput(output: string): void
  clearScreen(): void
  setCursorPosition(x: number, y: number): void
  getCursorPosition(): { x: number; y: number }
  getScreenCell(x: number, y: number, colorSwitch?: number): string | number
  setColorPattern(x: number, y: number, pattern: number): void
  setColorPalette(bgPalette: number, spritePalette: number): void
  setPaletteCombination?(
    target: 'B' | 'S',
    combination: number,
    c1: number,
    c2: number,
    c3: number,
    c4: number
  ): void
  setBackdropColor(colorCode: number): void
  setCharacterGeneratorMode(mode: number): void
  getCharacterGeneratorMode(): number

  // === KEYBOARD INPUT (INPUT / LINPUT) ===
  /**
   * Request user input from the IDE. Blocks until main thread sends INPUT_VALUE or execution is stopped.
   * @param prompt - Prompt string to show (e.g. "A=" or "?").
   * @param options - variableCount for INPUT (number of variables), or isLinput: true for LINPUT (single string).
   * @returns Promise resolving to entered values (one per variable for INPUT, single-element for LINPUT).
   *   Rejects if cancelled (e.g. user Stop).
   */
  requestInput?(
    prompt: string,
    options?: { variableCount?: number; isLinput?: boolean }
  ): Promise<string[]>

  // === SOUND OUTPUT ===
  /**
   * Play compiled audio synchronously (blocking).
   * Blocks until audio playback completes (main thread sends PLAY_SOUND_COMPLETE).
   * @param audio - Compiled audio with calculated frequencies and durations
   * @returns Promise that resolves when playback finishes
   */
  playSound?(audio: CompiledAudio): Promise<void>

  /**
   * Play compiled audio in background (non-blocking).
   * Used by BGPLAY statement - sends audio but does not wait for completion.
   * No PLAY_SOUND_COMPLETE message is expected.
   * @param audio - Compiled audio with calculated frequencies and durations
   */
  playSoundBackground?(audio: CompiledAudio): void

  /**
   * Play a beep sound (BEEP statement)
   * Produces a short beep tone using Web Audio API
   */
  beep?(): void

  // === BG GRAPHIC (VIEW command) ===
  /**
   * Copy BG GRAPHIC data to the background screen.
   * Called by VIEW command to display the BG Editor content on screen.
   * Per F-BASIC Manual page 36: "Upon executing the VIEW command,
   * the BG GRAPHIC Screen will be copied to the Background Screen."
   */
  copyBgGraphicToBackground?(): void
}
