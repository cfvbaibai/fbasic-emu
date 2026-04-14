/**
 * Shared Display Buffer Accessor
 *
 * Unified accessor for the combined display buffer that creates consistent views
 * for all sections: sprites, screen, cursor, sequence, scalars, and animation sync.
 *
 * This class encapsulates all offset calculations and provides type-safe methods,
 * serving as the single source of truth for buffer layout. Raw views are private
 * to prevent direct array access from outside.
 *
 * Operation logic is delegated to focused modules:
 * - bufferScreenOperations.ts: Screen, cursor, sequence, scalar read/write
 * - bufferSpriteOperations.ts: Sprite position/state read/write
 * - bufferSyncOperations.ts: Sync command and Atomics acknowledgment
 * - bufferScalarOperations.ts: Individual scalar read/write
 * - sharedDisplayBufferTypes.ts: Type definitions
 *
 * @see {@link docs/reference/shared-display-buffer.md} for full buffer layout
 */

import type { ScreenCell } from '@/core/types/execution-types'

import {
  readAllScalars as readAllScalarsFromOps,
  readBackdropColor as readBackdropColorFromOps,
  readBgPalette as readBgPaletteFromOps,
  readCgenMode as readCgenModeFromOps,
  readSpritePalette as readSpritePaletteFromOps,
  writeAllScalars as writeAllScalarsToOps,
  writeBackdropColor as writeBackdropColorToOps,
  writeBgPalette as writeBgPaletteToOps,
  writeCgenMode as writeCgenModeToOps,
  writeSpritePalette as writeSpritePaletteToOps,
} from './bufferScalarOperations'
import {
  incrementSequence as incrementSequenceToOps,
  readCursor as readCursorFromOps,
  readScreenBuffer as readScreenBufferFromOps,
  readScreenState as readScreenStateFromOps,
  readSequence as readSequenceFromOps,
  writeCursor as writeCursorToOps,
  writeScreenState as writeScreenStateToOps,
} from './bufferScreenOperations'
import {
  clearAllSprites,
  readAllMovementStates,
  readSpriteCharacterTypeFromView,
  readSpriteColorCombinationFromView,
  readSpriteDirectionFromView,
  readSpriteFrameIndexFromView,
  readSpriteIsActiveFromView,
  readSpriteIsVisibleFromView,
  readSpritePositionFromView,
  readSpritePriorityFromView,
  readSpriteRemainingDistanceFromView,
  readSpriteSpeedFromView,
  readSpriteTotalDistanceFromView,
  writeSpriteStateToView,
} from './bufferSpriteOperations'
import {
  clearSyncCommand as clearSyncCommandToOps,
  notifyAck as notifyAckToOps,
  notifySync,
  readAck as readAckFromOps,
  readSyncCommand as readSyncCommandFromOps,
  waitForAck as waitForAckFromOps,
  writeAck as writeAckToOps,
  writeSyncCommand as writeSyncCommandToOps,
} from './bufferSyncOperations'
import type {
  SyncCommandType} from './sharedDisplayBuffer';
import {
  COLS,
  OFFSET_ANIMATION_SYNC,
  OFFSET_CHARS,
  OFFSET_CURSOR,
  OFFSET_PATTERNS,
  OFFSET_SCALARS,
  OFFSET_SEQUENCE,
  ROWS,
  SHARED_DISPLAY_BUFFER_BYTES,
  SPRITE_DATA_FLOATS
} from './sharedDisplayBuffer'
import type { SyncCommand, SyncCommandParams } from './sharedDisplayBufferTypes'

// Re-export types for convenience (preserve original public API)
export type { SyncCommandType } from './sharedDisplayBuffer'
export type { DecodedScreenState, SyncCommand, SyncCommandParams } from './sharedDisplayBufferTypes'

/**
 * Unified accessor for shared display buffer.
 *
 * Creates consistent views for all buffer sections, with methods
 * for all operations. Raw views are private - use accessor methods.
 */
export class SharedDisplayBufferAccessor {
  private readonly buffer: SharedArrayBuffer

  // Cached views - created once in constructor (all private)
  private readonly spriteViewInternal: Float64Array
  private readonly charViewInternal: Uint8Array
  private readonly patternViewInternal: Uint8Array
  private readonly cursorViewInternal: Uint8Array
  private readonly sequenceViewInternal: Int32Array
  private readonly scalarsViewInternal: Uint8Array
  private readonly syncViewInternal: Float64Array
  private readonly syncInt32ViewInternal: Int32Array

  // Section sizes
  private static readonly SCREEN_CHARS = 672 // 28 x 24
  private static readonly SCREEN_PATTERNS = 672 // 28 x 24
  private static readonly CURSOR_BYTES = 2
  private static readonly SEQUENCE_INTS = 1
  private static readonly SCALARS_BYTES = 4
  private static readonly SYNC_SECTION_FLOATS = 9 // command type + action number + 6 params + ack

  // Screen helper
  private cellIndex(x: number, y: number): number {
    return y * COLS + x
  }

  /**
   * Create accessor from combined display buffer.
   * @param buffer - SharedArrayBuffer (must be SHARED_DISPLAY_BUFFER_BYTES)
   * @throws RangeError if buffer is too small
   */
  constructor(buffer: SharedArrayBuffer) {
    if (buffer.byteLength < SHARED_DISPLAY_BUFFER_BYTES) {
      throw new RangeError(`Buffer too small: ${buffer.byteLength} bytes, need at least ${SHARED_DISPLAY_BUFFER_BYTES}`)
    }

    this.buffer = buffer

    // Sprite data view: 96 Float64 elements at byte offset 0
    this.spriteViewInternal = new Float64Array(buffer, 0, SPRITE_DATA_FLOATS)

    // Screen characters: 672 Uint8 elements at byte offset 768
    this.charViewInternal = new Uint8Array(buffer, OFFSET_CHARS, SharedDisplayBufferAccessor.SCREEN_CHARS)

    // Screen patterns: 672 Uint8 elements at byte offset 1440
    this.patternViewInternal = new Uint8Array(buffer, OFFSET_PATTERNS, SharedDisplayBufferAccessor.SCREEN_PATTERNS)

    // Cursor: 2 Uint8 elements at byte offset 2112
    this.cursorViewInternal = new Uint8Array(buffer, OFFSET_CURSOR, SharedDisplayBufferAccessor.CURSOR_BYTES)

    // Sequence: 1 Int32 element at byte offset 2116
    this.sequenceViewInternal = new Int32Array(buffer, OFFSET_SEQUENCE, SharedDisplayBufferAccessor.SEQUENCE_INTS)

    // Scalars: 4 Uint8 elements at byte offset 2120
    this.scalarsViewInternal = new Uint8Array(buffer, OFFSET_SCALARS, SharedDisplayBufferAccessor.SCALARS_BYTES)

    // Sync section view: 9 Float64 elements at byte offset OFFSET_ANIMATION_SYNC (2128)
    this.syncViewInternal = new Float64Array(
      buffer,
      OFFSET_ANIMATION_SYNC,
      SharedDisplayBufferAccessor.SYNC_SECTION_FLOATS
    )

    // Int32 view for Atomics: 9 Float64 x 2 = 18 Int32 elements at same offset
    this.syncInt32ViewInternal = new Int32Array(
      buffer,
      OFFSET_ANIMATION_SYNC,
      SharedDisplayBufferAccessor.SYNC_SECTION_FLOATS * 2
    )
  }

  // ============================================================================
  // Sync Command Methods (delegated to bufferSyncOperations)
  // ============================================================================

  /** Notify waiting threads that sync state has changed. */
  notify(count = 1): void {
    notifySync(this.syncInt32ViewInternal, count)
  }

  /** Write a sync command to the shared buffer for Animation Worker to process. */
  writeSyncCommand(commandType: SyncCommandType, actionNumber: number, params: SyncCommandParams = {}): void {
    writeSyncCommandToOps(this.syncViewInternal, commandType, actionNumber, params)
  }

  /** Read sync command from shared buffer. Returns null if no command is pending. */
  readSyncCommand(): SyncCommand | null {
    return readSyncCommandFromOps(this.syncViewInternal)
  }

  /** Clear sync command from shared buffer (set to NONE). */
  clearSyncCommand(): void {
    clearSyncCommandToOps(this.syncViewInternal)
  }

  /** Write acknowledgment flag. */
  writeAck(ack: number): void {
    writeAckToOps(this.syncViewInternal, ack)
  }

  /** Read acknowledgment flag. */
  readAck(): number {
    return readAckFromOps(this.syncViewInternal)
  }

  /** Notify waiting thread using Atomics (sets ack to RECEIVED and notifies). */
  notifyAck(): void {
    notifyAckToOps(this.syncInt32ViewInternal)
  }

  /** Wait for acknowledgment using Atomics. */
  waitForAck(timeoutMs: number = 100): boolean {
    return waitForAckFromOps(this.syncInt32ViewInternal, timeoutMs)
  }

  // ============================================================================
  // Screen Section Methods
  // ============================================================================

  /** Read screen character code at position. */
  readScreenChar(x: number, y: number): number {
    if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return 0x20
    return this.charViewInternal[this.cellIndex(x, y)] ?? 0x20
  }

  /** Write screen character code at position. */
  writeScreenChar(x: number, y: number, charCode: number): void {
    if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return
    this.charViewInternal[this.cellIndex(x, y)] = Math.max(0, Math.min(255, charCode))
  }

  /** Read screen color pattern at position. */
  readScreenPattern(x: number, y: number): number {
    if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return 0
    return (this.patternViewInternal[this.cellIndex(x, y)] ?? 0) & 3
  }

  /** Write screen color pattern at position. */
  writeScreenPattern(x: number, y: number, pattern: number): void {
    if (x < 0 || x >= COLS || y < 0 || y >= ROWS) return
    this.patternViewInternal[this.cellIndex(x, y)] = pattern & 3
  }

  /** Read entire screen as ScreenCell[][]. */
  readScreenBuffer() {
    return readScreenBufferFromOps(this.charViewInternal, this.patternViewInternal)
  }

  // ============================================================================
  // Cursor, Sequence, Bulk Screen (delegated to bufferScreenOperations)
  // ============================================================================

  /** Read cursor position. */
  readCursor() { return readCursorFromOps(this.cursorViewInternal) }

  /** Write cursor position. */
  writeCursor(x: number, y: number): void { writeCursorToOps(this.cursorViewInternal, x, y) }

  /** Read sequence number (change detection counter). */
  readSequence(): number { return readSequenceFromOps(this.sequenceViewInternal) }

  /** Increment sequence number to signal change. */
  incrementSequence(): void { incrementSequenceToOps(this.sequenceViewInternal) }

  /** Write screen state from ScreenCell[][] buffer into shared views. */
  writeScreenState(
    screenBuffer: ScreenCell[][],
    cursorX: number, cursorY: number,
    bgPalette: number, spritePalette: number,
    backdropColor: number, cgenMode: number
  ): void {
    writeScreenStateToOps(
      this.charViewInternal, this.patternViewInternal,
      this.cursorViewInternal, this.scalarsViewInternal,
      screenBuffer, cursorX, cursorY,
      bgPalette, spritePalette, backdropColor, cgenMode
    )
  }

  /** Read complete screen state from shared views. */
  readScreenState() {
    return readScreenStateFromOps(
      this.charViewInternal, this.patternViewInternal,
      this.cursorViewInternal, this.scalarsViewInternal
    )
  }

  // ============================================================================
  // Scalars Section Methods (delegated to bufferScalarOperations)
  // ============================================================================

  /** Read background palette (0-1). */
  readBgPalette(): number { return readBgPaletteFromOps(this.scalarsViewInternal) }

  /** Write background palette. */
  writeBgPalette(value: number): void { writeBgPaletteToOps(this.scalarsViewInternal, value) }

  /** Read sprite palette (0-3). */
  readSpritePalette(): number { return readSpritePaletteFromOps(this.scalarsViewInternal) }

  /** Write sprite palette. */
  writeSpritePalette(value: number): void { writeSpritePaletteToOps(this.scalarsViewInternal, value) }

  /** Read backdrop color (0-60). */
  readBackdropColor(): number { return readBackdropColorFromOps(this.scalarsViewInternal) }

  /** Write backdrop color. */
  writeBackdropColor(value: number): void { writeBackdropColorToOps(this.scalarsViewInternal, value) }

  /** Read character generation mode (0-3). */
  readCgenMode(): number { return readCgenModeFromOps(this.scalarsViewInternal) }

  /** Write character generation mode. */
  writeCgenMode(value: number): void { writeCgenModeToOps(this.scalarsViewInternal, value) }

  /** Read all scalar values at once. */
  readScalars() { return readAllScalarsFromOps(this.scalarsViewInternal) }

  /** Write all scalar values at once. */
  writeScalars(bgPalette: number, spritePalette: number, backdropColor: number, cgenMode: number): void {
    writeAllScalarsToOps(this.scalarsViewInternal, bgPalette, spritePalette, backdropColor, cgenMode)
  }

  // ============================================================================
  // Sprite Section Methods (delegated to bufferSpriteOperations)
  // ============================================================================

  /** Write one sprite's full animation state to shared buffer. */
  writeSpriteState(
    actionNumber: number, x: number, y: number,
    isActive: boolean, isVisible: boolean,
    frameIndex = 0, remainingDistance = 0, totalDistance = 0,
    direction = 0, speed = 0, priority = 0,
    characterType = 0, colorCombination = 0
  ): void {
    writeSpriteStateToView(
      this.spriteViewInternal, actionNumber, x, y,
      isActive, isVisible, frameIndex, remainingDistance,
      totalDistance, direction, speed, priority,
      characterType, colorCombination
    )
  }

  /** Clear all sprite data in the shared buffer. */
  clearAllSprites(): void { clearAllSprites(this.spriteViewInternal) }

  /** Read one sprite's position from shared buffer. */
  readSpritePosition(actionNumber: number) {
    return readSpritePositionFromView(this.spriteViewInternal, actionNumber)
  }

  /** Read isActive for one sprite. */
  readSpriteIsActive(actionNumber: number): boolean {
    return readSpriteIsActiveFromView(this.spriteViewInternal, actionNumber)
  }

  /** Read isVisible for one sprite. */
  readSpriteIsVisible(actionNumber: number): boolean {
    return readSpriteIsVisibleFromView(this.spriteViewInternal, actionNumber)
  }

  /** Read frameIndex for one sprite. */
  readSpriteFrameIndex(actionNumber: number): number {
    return readSpriteFrameIndexFromView(this.spriteViewInternal, actionNumber)
  }

  /** Read remainingDistance for one sprite. */
  readSpriteRemainingDistance(actionNumber: number): number {
    return readSpriteRemainingDistanceFromView(this.spriteViewInternal, actionNumber)
  }

  /** Read totalDistance for one sprite. */
  readSpriteTotalDistance(actionNumber: number): number {
    return readSpriteTotalDistanceFromView(this.spriteViewInternal, actionNumber)
  }

  /** Read direction for one sprite. */
  readSpriteDirection(actionNumber: number): number {
    return readSpriteDirectionFromView(this.spriteViewInternal, actionNumber)
  }

  /** Read speed for one sprite. */
  readSpriteSpeed(actionNumber: number): number {
    return readSpriteSpeedFromView(this.spriteViewInternal, actionNumber)
  }

  /** Read priority for one sprite. */
  readSpritePriority(actionNumber: number): number {
    return readSpritePriorityFromView(this.spriteViewInternal, actionNumber)
  }

  /** Read characterType for one sprite. */
  readSpriteCharacterType(actionNumber: number): number {
    return readSpriteCharacterTypeFromView(this.spriteViewInternal, actionNumber)
  }

  /** Read colorCombination for one sprite. */
  readSpriteColorCombination(actionNumber: number): number {
    return readSpriteColorCombinationFromView(this.spriteViewInternal, actionNumber)
  }

  /** Read all movement states from shared buffer. */
  readAllMovementStates() {
    return readAllMovementStates(
      this.spriteViewInternal,
      (n) => this.readSpriteCharacterType(n),
      (n) => this.readSpriteTotalDistance(n),
      (n) => this.readSpriteDirection(n),
      (n) => this.readSpriteSpeed(n),
      (n) => this.readSpritePriority(n),
      (n) => this.readSpriteColorCombination(n)
    )
  }
}
