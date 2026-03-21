/**
 * Animation Worker - Manages sprite state (positions, movement, physics) as the SINGLE WRITER
 * to the shared animation buffer. Main thread becomes read-only for rendering.
 *
 * NEW: Supports direct synchronization from Executor Worker via shared buffer sync section.
 * Polls for commands in sync section and writes acknowledgment when complete.
 *
 * Responsibilities:
 * - Poll sync section for commands from Executor Worker (direct, no message passing)
 * - Calculate sprite positions (x += dx * speed * dt)
 * - Handle screen wrapping (modulo 256×240)
 * - Manage movement lifecycle (isActive, remainingDistance)
 * - Write positions to shared buffer (ONLY writer)
 * - Write acknowledgment when command is processed
 * - Run at fixed 60Hz tick rate
 */

import { DEFAULT_SPRITE_FRAME_RATE, MAX_SPRITES, SyncCommandType } from '@/core/animation/sharedDisplayBuffer'
import { SHARED_DISPLAY_BUFFER_BYTES } from '@/core/animation/sharedDisplayBuffer'
import { SharedDisplayBufferAccessor } from '@/core/animation/sharedDisplayBufferAccessor'
import { SCREEN_DIMENSIONS } from '@/core/constants'
import type { MoveDefinition } from '@/core/sprite/types'
import { logWorker } from '@/shared/logger'

/**
 * Animation Worker command types (Main Thread → Animation Worker via message)
 *
 * Note: Animation commands (START/STOP/ERASE/SET_POSITION) come from Executor Worker
 * via direct shared buffer sync, not via postMessage.
 */
export type AnimationWorkerCommand =
  | { type: 'SET_SHARED_BUFFER'; buffer: SharedArrayBuffer }
  | { type: 'TICK'; deltaTime: number }

/**
 * Movement state tracked by Animation Worker
 * Position is the single source of truth, written to shared buffer
 */
interface WorkerMovementState {
  actionNumber: number
  definition: MoveDefinition
  x: number
  y: number
  remainingDistance: number
  totalDistance: number // Total distance in dots (2 × MOVE distance parameter)
  speedDotsPerSecond: number
  directionDeltaX: number
  directionDeltaY: number
  isActive: boolean
  currentFrameIndex: number
  frameCounter: number
}

const TARGET_FPS = 60
const FRAME_INTERVAL_MS = 1000 / TARGET_FPS
const MAX_DELTA_TIME_MS = 100 // Cap at 100ms to prevent teleportation

/**
 * AnimationWorker class - manages sprite animation state and writes to shared buffer
 * with direct synchronization from Executor Worker.
 */
export class AnimationWorker {
  private movementStates: Map<number, WorkerMovementState> = new Map()
  private accessor?: SharedDisplayBufferAccessor
  private tickInterval: number | null = null
  private lastTickTime = 0
  private isRunning = false

  constructor() {
    logWorker.debug('[AnimationWorker] Created')
  }

  /**
   * Handle message from Main Thread.
   * Note: Animation commands (START/STOP/ERASE/SET_POSITION) come from Executor Worker
   * via direct shared buffer sync, not via postMessage.
   */
  handleMessage(command: AnimationWorkerCommand): void {
    logWorker.debug('[AnimationWorker] Received command:', command.type)
    switch (command.type) {
      case 'SET_SHARED_BUFFER':
        this.handleSetSharedBuffer(command.buffer)
        break
      case 'TICK':
        this.tick(command.deltaTime)
        break
      default:
        logWorker.warn('[AnimationWorker] Unknown command type:', (command as { type: string }).type)
    }
  }

  /**
   * Set shared animation buffer (called by Main Thread during initialization)
   * Creates accessor with consistent views for sprite data and sync section.
   * Expects the combined display buffer (sharedDisplayBuffer.ts).
   */
  private handleSetSharedBuffer(buffer: SharedArrayBuffer): void {
    logWorker.debug('[AnimationWorker] handleSetSharedBuffer called, byteLength =', buffer.byteLength)
    if (buffer.byteLength < SHARED_DISPLAY_BUFFER_BYTES) {
      throw new RangeError(
        `Shared buffer too small: ${buffer.byteLength} bytes, need at least ${SHARED_DISPLAY_BUFFER_BYTES}`
      )
    }

    this.accessor = new SharedDisplayBufferAccessor(buffer)
    logWorker.debug('[AnimationWorker] Direct sync enabled (combined display buffer, sync section at byte 2128)')
    logWorker.debug('[AnimationWorker] Shared animation buffer set, byteLength =', buffer.byteLength)

    // Only initialize slots that haven't been set by DEF MOVE yet (characterType = -1 or missing)
    // DEF MOVE may have already written to the buffer before worker initialized
    for (let actionNumber = 0; actionNumber < MAX_SPRITES; actionNumber++) {
      const existingCharacterType = this.accessor.readSpriteCharacterType(actionNumber)
      // Only initialize if truly uninitialized (characterType is exactly -1, which is our sentinel for "never set")
      if (existingCharacterType === -1) {
        this.accessor.writeSpriteState(actionNumber, 0, 0, false, false, 0, 0, 0, 0, 0, 0, -1, 0)
      }
    }

    // Start tick loop to poll for sync commands from Executor Worker
    if (!this.isRunning) {
      this.startTickLoop()
    }
  }

  /**
   * Poll sync section for commands from Executor Worker (direct communication).
   * Processes any pending command and writes acknowledgment when complete.
   */
  private pollSyncCommands(): void {
    if (!this.accessor) return

    const command = this.accessor.readSyncCommand()
    if (!command) return // No pending command

    try {
      switch (command.commandType) {
        case SyncCommandType.NONE:
          // Should not happen as readSyncCommand returns null for NONE
          break
        case SyncCommandType.START_MOVEMENT:
          this.handleStartMovementFromSync(command.actionNumber, command.params)
          break
        case SyncCommandType.STOP_MOVEMENT:
          this.handleStopMovementFromSync(command.actionNumber)
          break
        case SyncCommandType.ERASE_MOVEMENT:
          this.handleEraseMovementFromSync(command.actionNumber)
          break
        case SyncCommandType.SET_POSITION:
          this.handleSetPositionFromSync(command.actionNumber, command.params.startX, command.params.startY)
          break
        case SyncCommandType.CLEAR_ALL_MOVEMENTS:
          logWorker.debug('[AnimationWorker] CLEAR_ALL_MOVEMENTS: clearing all sprite data')
          this.handleClearAllMovementsFromSync()
          // Clear the command immediately after processing so it's not re-read every tick
          this.accessor.clearSyncCommand()
          break
      }

      // Write acknowledgment
      this.accessor.notifyAck()
    } catch (error) {
      logWorker.error('[AnimationWorker] Error processing sync command:', error)
      // Still write ack to prevent Executor Worker from hanging
      this.accessor.notifyAck()
    }
  }

  /**
   * Handle START_MOVEMENT from sync buffer.
   */
  private handleStartMovementFromSync(
    actionNumber: number,
    params: {
      startX: number
      startY: number
      direction: number
      speed: number
      distance: number
      priority: number
    }
  ): void {
    const { deltaX, deltaY } = this.getDirectionDeltas(params.direction)
    const speedDotsPerSecond = params.speed === 0 ? 60 / 256 : 60 / params.speed
    const totalDistance = 2 * params.distance

    // Read characterType and colorCombination from buffer (set by DEF MOVE)
    // These values are already in the buffer from the DEF MOVE command
    const characterType = this.accessor?.readSpriteCharacterType(actionNumber) ?? 0
    const colorCombination = this.accessor?.readSpriteColorCombination(actionNumber) ?? 0

    const definition: MoveDefinition = {
      actionNumber,
      characterType,
      direction: params.direction,
      speed: params.speed,
      distance: params.distance,
      priority: params.priority as 0 | 1,
      colorCombination,
    }

    const movementState: WorkerMovementState = {
      actionNumber,
      definition,
      x: params.startX,
      y: params.startY,
      remainingDistance: totalDistance,
      totalDistance,
      speedDotsPerSecond,
      directionDeltaX: deltaX,
      directionDeltaY: deltaY,
      isActive: true,
      currentFrameIndex: 0,
      frameCounter: 0,
    }

    this.movementStates.set(actionNumber, movementState)

    // Write initial position to shared buffer
    if (this.accessor) {
      this.accessor.writeSpriteState(
        actionNumber,
        params.startX,
        params.startY,
        true, // isActive = true (moving)
        true, // isVisible = true (becomes visible on MOVE)
        0, // frameIndex
        totalDistance, // remainingDistance
        totalDistance, // totalDistance
        params.direction,
        params.speed,
        params.priority,
        definition.characterType,
        definition.colorCombination
      )
    }

    // Start tick loop if not already running
    if (!this.isRunning) {
      this.startTickLoop()
    }
  }

  /**
   * Handle STOP_MOVEMENT from sync buffer.
   */
  private handleStopMovementFromSync(actionNumber: number): void {
    logWorker.debug('[AnimationWorker] STOP_MOVEMENT from sync:', actionNumber)

    const movement = this.movementStates.get(actionNumber)
    if (movement && this.accessor) {
      movement.isActive = false
      // Write inactive state to shared buffer with all animation parameters
      // isVisible stays true after CUT (sprite remains visible but stops moving)
      this.accessor.writeSpriteState(
        actionNumber,
        movement.x,
        movement.y,
        false, // isActive = false (stopped)
        true, // isVisible = true (remains visible after CUT)
        movement.currentFrameIndex,
        movement.remainingDistance,
        movement.totalDistance,
        movement.definition.direction,
        movement.definition.speed,
        movement.definition.priority,
        movement.definition.characterType,
        movement.definition.colorCombination
      )
    }
  }

  /**
   * Handle ERASE_MOVEMENT from sync buffer.
   */
  private handleEraseMovementFromSync(actionNumber: number): void {
    logWorker.debug('[AnimationWorker] ERASE_MOVEMENT from sync:', actionNumber)

    this.movementStates.delete(actionNumber)
    // Write inactive state to shared buffer (reset all values, characterType=-1 marks as uninitialized)
    if (this.accessor) {
      this.accessor.writeSpriteState(actionNumber, 0, 0, false, false, 0, 0, 0, 0, 0, 0, -1, 0)
    }

    // Only stop tick loop if NOT using direct sync and no active movements
    if (
      !this.accessor &&
      (this.movementStates.size === 0 || !Array.from(this.movementStates.values()).some(m => m.isActive))
    ) {
      this.stopTickLoop()
    }
  }

  /**
   * Handle SET_POSITION from sync buffer.
   */
  private handleSetPositionFromSync(actionNumber: number, x: number, y: number): void {
    const movement = this.movementStates.get(actionNumber)
    if (movement) {
      movement.x = x
      movement.y = y
    }

    // Write position to shared buffer while preserving characterType and colorCombination
    // These are set by DEF MOVE and should NOT be overwritten by SET_POSITION
    if (this.accessor) {
      // Read existing characterType and colorCombination before overwriting
      const existingCharacterType = this.accessor.readSpriteCharacterType(actionNumber)
      const existingColorCombination = this.accessor.readSpriteColorCombination(actionNumber)

      const isActive = movement?.isActive ?? false
      const isVisible = movement ? true : false // isVisible is true if movement exists (has been MOVE'd without ERA)
      const frameIndex = movement?.currentFrameIndex ?? 0
      const def = movement?.definition

      this.accessor.writeSpriteState(
        actionNumber,
        x,
        y,
        isActive,
        isVisible,
        frameIndex,
        movement?.remainingDistance ?? 0,
        movement?.totalDistance ?? 0,
        def?.direction ?? 0,
        def?.speed ?? 0,
        def?.priority ?? 0,
        // IMPORTANT: Preserve characterType and colorCombination from DEF MOVE
        // Don't use def?.characterType ?? 0 because movement may not exist yet
        existingCharacterType,
        existingColorCombination
      )
    }
  }

  /**
   * Handle CLEAR_ALL_MOVEMENTS from sync buffer.
   * Called when user clicks CLEAR button - clears all internal movement states and sprite buffer.
   */
  private handleClearAllMovementsFromSync(): void {
    logWorker.debug(
      '[AnimationWorker] CLEAR_ALL_MOVEMENTS: clearing',
      this.movementStates.size,
      'movement states and all sprite data'
    )

    // Clear all internal movement states
    this.movementStates.clear()

    // Clear sprite buffer (single writer: only AnimationWorker writes to sprite portion)
    // This sets all positions to 0, isActive=false, isVisible=false, characterType=-1
    if (this.accessor) {
      this.accessor.clearAllSprites()
    }
  }

  /**
   * Start the tick loop (60Hz fixed)
   */

  /**
   * Start the tick loop (60Hz fixed)
   */
  private startTickLoop(): void {
    if (this.isRunning) return

    this.isRunning = true
    this.lastTickTime = performance.now()

    logWorker.debug('[AnimationWorker] Starting tick loop at 60Hz')

    // Use setInterval for fixed 60Hz tick rate
    this.tickInterval = self.setInterval(() => {
      const now = performance.now()
      const deltaTime = now - this.lastTickTime
      this.lastTickTime = now
      this.tick(deltaTime)
    }, FRAME_INTERVAL_MS)
  }

  /**
   * Stop the tick loop
   */
  private stopTickLoop(): void {
    if (!this.isRunning) return

    logWorker.debug('[AnimationWorker] Stopping tick loop')

    if (this.tickInterval !== null) {
      self.clearInterval(this.tickInterval)
      this.tickInterval = null
    }
    this.isRunning = false
  }

  /**
   * Single tick - update all active movements
   * This is the core animation loop
   */
  private tick(deltaTime: number): void {
    if (!this.accessor) return

    // Poll for sync commands from Executor Worker (direct communication)
    this.pollSyncCommands()

    // Cap deltaTime to prevent teleportation
    const cappedDeltaTime = Math.min(deltaTime, MAX_DELTA_TIME_MS)

    const completed: number[] = []

    for (const movement of this.movementStates.values()) {
      if (!movement.isActive || movement.remainingDistance <= 0) {
        if (movement.remainingDistance <= 0 && movement.isActive) {
          completed.push(movement.actionNumber)
        }
        movement.isActive = false
        // Write inactive state to shared buffer with all animation parameters
        // isVisible stays true (sprite remains visible even after movement completes)
        this.accessor.writeSpriteState(
          movement.actionNumber,
          movement.x,
          movement.y,
          false, // isActive = false (not moving)
          true, // isVisible = true (remains visible after movement completes)
          movement.currentFrameIndex,
          movement.remainingDistance,
          0, // totalDistance (computed from definition)
          movement.definition.direction,
          movement.definition.speed,
          movement.definition.priority,
          movement.definition.characterType,
          movement.definition.colorCombination
        )
        continue
      }

      // Calculate distance per frame
      const dotsPerFrame = movement.speedDotsPerSecond * (cappedDeltaTime / 1000)
      const distanceThisFrame = Math.min(dotsPerFrame, movement.remainingDistance)

      // Calculate new position
      movement.x += movement.directionDeltaX * distanceThisFrame
      movement.y += movement.directionDeltaY * distanceThisFrame
      movement.remainingDistance -= distanceThisFrame

      // Wrap at screen boundaries (real F-BASIC behavior)
      const w = SCREEN_DIMENSIONS.SPRITE.WIDTH
      const h = SCREEN_DIMENSIONS.SPRITE.HEIGHT
      movement.x = ((movement.x % w) + w) % w
      movement.y = ((movement.y % h) + h) % h

      // Update frame animation
      movement.frameCounter++
      const frameRate = DEFAULT_SPRITE_FRAME_RATE
      if (movement.frameCounter >= frameRate) {
        movement.frameCounter = 0
        movement.currentFrameIndex++
      }

      // Write position to shared buffer (SINGLE WRITER) with all animation parameters
      // isVisible stays true throughout movement
      this.accessor.writeSpriteState(
        movement.actionNumber,
        movement.x,
        movement.y,
        movement.isActive,
        true, // isVisible = true (sprite is visible during movement)
        movement.currentFrameIndex,
        movement.remainingDistance,
        movement.totalDistance,
        movement.definition.direction,
        movement.definition.speed,
        movement.definition.priority,
        movement.definition.characterType,
        movement.definition.colorCombination
      )

      // Check if movement is complete
      if (movement.remainingDistance <= 0) {
        completed.push(movement.actionNumber)
        movement.isActive = false
        this.accessor.writeSpriteState(
          movement.actionNumber,
          movement.x,
          movement.y,
          false, // isActive = false (movement complete)
          true, // isVisible = true (remains visible after movement completes)
          movement.currentFrameIndex,
          0, // remainingDistance (completed)
          movement.totalDistance,
          movement.definition.direction,
          movement.definition.speed,
          movement.definition.priority,
          movement.definition.characterType,
          movement.definition.colorCombination
        )
      }
    }

    // Only stop tick loop if NOT using direct sync
    // When using direct sync, the loop must keep running to poll for commands (SET_POSITION, etc.)
    if (!this.accessor && !Array.from(this.movementStates.values()).some(m => m.isActive)) {
      this.stopTickLoop()
    }
  }

  /**
   * Calculate direction deltas from direction code
   * Direction: 0=none, 1=up, 2=up-right, 3=right, 4=down-right,
   *            5=down, 6=down-left, 7=left, 8=up-left
   */
  private getDirectionDeltas(direction: number): { deltaX: number; deltaY: number } {
    switch (direction) {
      case 0:
        return { deltaX: 0, deltaY: 0 }
      case 1:
        return { deltaX: 0, deltaY: -1 }
      case 2:
        return { deltaX: 1, deltaY: -1 }
      case 3:
        return { deltaX: 1, deltaY: 0 }
      case 4:
        return { deltaX: 1, deltaY: 1 }
      case 5:
        return { deltaX: 0, deltaY: 1 }
      case 6:
        return { deltaX: -1, deltaY: 1 }
      case 7:
        return { deltaX: -1, deltaY: 0 }
      case 8:
        return { deltaX: -1, deltaY: -1 }
      default:
        return { deltaX: 0, deltaY: 0 }
    }
  }

  /**
   * Get all movement states (for debugging/inspection)
   */
  getAllMovementStates(): WorkerMovementState[] {
    return Array.from(this.movementStates.values())
  }

  /**
   * Reset all movement states
   */
  reset(): void {
    this.stopTickLoop()
    this.movementStates.clear()
    if (this.accessor) {
      for (let actionNumber = 0; actionNumber < MAX_SPRITES; actionNumber++) {
        this.accessor.writeSpriteState(actionNumber, 0, 0, false, false, 0, 0, 0, 0, 0, 0, -1, 0)
      }
    }
    // Restart tick loop if using direct sync, to keep polling for commands
    if (this.accessor && !this.isRunning) {
      this.startTickLoop()
    }
  }

  /**
   * Terminate the animation worker
   */
  terminate(): void {
    this.reset()
    this.accessor = undefined
  }
}
