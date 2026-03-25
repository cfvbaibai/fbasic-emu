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
 * - Handle screen wrapping (modulo 256x240)
 * - Manage movement lifecycle (isActive, remainingDistance)
 * - Write positions to shared buffer (ONLY writer)
 * - Write acknowledgment when command is processed
 * - Run at fixed 60Hz tick rate
 */

import { DEFAULT_SPRITE_FRAME_RATE, MAX_SPRITES, SHARED_DISPLAY_BUFFER_BYTES } from '@/core/animation/sharedDisplayBuffer'
import { SharedDisplayBufferAccessor } from '@/core/animation/sharedDisplayBufferAccessor'
import { SCREEN_DIMENSIONS } from '@/core/constants'
import { logWorker } from '@/shared/logger'

import type { WorkerMovementState } from './animationSyncHandlers'
import {
  pollSyncCommands,
} from './animationSyncHandlers'

/**
 * Animation Worker command types (Main Thread -> Animation Worker via message)
 *
 * Note: Animation commands (START/STOP/ERASE/SET_POSITION) come from Executor Worker
 * via direct shared buffer sync, not via postMessage.
 */
export type AnimationWorkerCommand =
  | { type: 'SET_SHARED_BUFFER'; buffer: SharedArrayBuffer }
  | { type: 'TICK'; deltaTime: number }

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
    pollSyncCommands(this.movementStates, this.accessor)

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
