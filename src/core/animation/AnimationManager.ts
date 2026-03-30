/**
 * Animation Manager
 * Manages animated sprite movement for DEF MOVE and MOVE commands
 */

import { getSpriteSizeForMoveDefinition } from '@/core/animation/CharacterAnimationBuilder'
import { SHARED_DISPLAY_BUFFER_BYTES, SyncCommandType } from '@/core/animation/sharedDisplayBuffer'
import { SharedDisplayBufferAccessor } from '@/core/animation/sharedDisplayBufferAccessor'
import { SCREEN_DIMENSIONS } from '@/core/constants'
import type { MoveDefinition, MovementState } from '@/core/sprite/types'
import type { BasicDeviceAdapter } from '@/core/types/device-types'
import { logWorker } from '@/shared/logger'

const SYNC_ACK_WAIT_TIMEOUT_MS = 16

/**
 * AnimationManager - Manages 8 action slots (0-7) for animated sprite movement
 * Handles move definitions and movement states with direct synchronization to Animation Worker.
 */
export class AnimationManager {
  private moveDefinitions: Map<number, MoveDefinition> = new Map()
  private deviceAdapter?: BasicDeviceAdapter
  /** Accessor for shared display buffer (creates consistent views). */
  private accessor?: SharedDisplayBufferAccessor

  /**
   * Set device adapter for device operations (sprite position queries, etc.).
   * @param adapter - Device adapter implementing setSpritePosition, clearSpritePosition
   */
  setDeviceAdapter(adapter: BasicDeviceAdapter): void {
    this.deviceAdapter = adapter
  }

  /**
   * Set shared animation buffer (used by worker for getMovementStatus / MOVE(n)).
   * Expects the combined display buffer (sharedDisplayBuffer.ts).
   * Creates accessor with consistent views for sprite data and sync section.
   */
  setSharedAnimationBuffer(buffer: SharedArrayBuffer | undefined): void {
    if (!buffer) {
      this.accessor = undefined
      logWorker.debug('[AnimationManager] setSharedAnimationBuffer: buffer is null/undefined')
      return
    }

    if (buffer.byteLength < SHARED_DISPLAY_BUFFER_BYTES) {
      throw new RangeError(
        `Buffer too small: ${buffer.byteLength} bytes, need at least ${SHARED_DISPLAY_BUFFER_BYTES}`
      )
    }

    this.accessor = new SharedDisplayBufferAccessor(buffer)
    logWorker.debug('[AnimationManager] setSharedAnimationBuffer: accessor created, buffer.byteLength =', buffer.byteLength)
  }

  constructor(sharedAnimationBuffer?: SharedArrayBuffer) {
    logWorker.debug('[AnimationManager] Constructor called with sharedAnimationBuffer:', {
      hasBuffer: !!sharedAnimationBuffer,
      byteLength: sharedAnimationBuffer?.byteLength,
    })
    if (sharedAnimationBuffer) {
      this.setSharedAnimationBuffer(sharedAnimationBuffer)
    }
  }

  private dispatchSyncCommand(commandType: SyncCommandType, actionNumber: number, params: {
    startX?: number
    startY?: number
    direction?: number
    speed?: number
    distance?: number
    priority?: number
  }): void {
    if (!this.accessor) {
      throw new Error('[AnimationManager] Shared buffer not available - cannot sync animation command')
    }

    this.accessor.writeSyncCommand(commandType, actionNumber, params)
    this.accessor.notify()

    const ackReceived = this.accessor.waitForAck(SYNC_ACK_WAIT_TIMEOUT_MS)
    if (!ackReceived) {
      logWorker.debug('[AnimationManager] Animation Worker ack timeout; clearing sync command', {
        commandType,
        actionNumber,
        timeoutMs: SYNC_ACK_WAIT_TIMEOUT_MS,
      })
      this.accessor.clearSyncCommand()
      return
    }

    this.accessor.writeAck(0)
    this.accessor.clearSyncCommand()
  }

  /**
   * Define a movement (DEF MOVE command). Stores the definition; does not start movement.
   * Typical flow: DEF MOVE(0)=SPRITE(...) → POSITION 0, X, Y → MOVE 0.
   * Position for this action is initialized to screen center here (right after the move is
   * defined); POSITION can then override it before MOVE runs.
   * @param definition - MoveDefinition (actionNumber 0-7, characterType, direction,
   *   speed, distance, priority, colorCombination)
   * @throws Error if any parameter is out of range
   */
  defineMovement(definition: MoveDefinition): void {
    // Validate action number
    if (definition.actionNumber < 0 || definition.actionNumber > 7) {
      throw new Error(`Invalid action number: ${definition.actionNumber} (must be 0-7)`)
    }

    // Validate parameters
    if (definition.characterType < 0 || definition.characterType > 15) {
      throw new Error(`Invalid character type: ${definition.characterType} (must be 0-15)`)
    }
    if (definition.direction < 0 || definition.direction > 8) {
      throw new Error(`Invalid direction: ${definition.direction} (must be 0-8)`)
    }
    if (definition.speed < 0 || definition.speed > 255) {
      throw new Error(`Invalid speed: ${definition.speed} (must be 0-255)`)
    }
    if (definition.distance < 1 || definition.distance > 255) {
      throw new Error(`Invalid distance: ${definition.distance} (must be 1-255)`)
    }
    if (definition.priority < 0 || definition.priority > 1) {
      throw new Error(`Invalid priority: ${definition.priority} (must be 0-1)`)
    }
    if (definition.colorCombination < 0 || definition.colorCombination > 3) {
      throw new Error(`Invalid color combination: ${definition.colorCombination} (must be 0-3)`)
    }

    this.moveDefinitions.set(definition.actionNumber, definition)
    logWorker.debug(
      '[AnimationManager] defineMovement: stored definition for action',
      definition.actionNumber,
      'total definitions:',
      this.moveDefinitions.size
    )

    // Write movement definition to shared buffer so Main Thread can create sprites immediately
    // This includes: characterType, colorCombination, direction, speed, priority
    // Position and isActive will be set later by START_MOVEMENT
    if (this.accessor) {
      // Get current position (or default to screen center)
      let x: number = SCREEN_DIMENSIONS.SPRITE.DEFAULT_X
      let y: number = SCREEN_DIMENSIONS.SPRITE.DEFAULT_Y
      if (this.deviceAdapter?.getSpritePosition) {
        const existing = this.deviceAdapter.getSpritePosition(definition.actionNumber)
        if (existing) {
          x = existing.x
          y = existing.y
        }
      }

      this.accessor.writeSpriteState(
        definition.actionNumber,
        x,
        y,
        false, // isActive = false (DEF MOVE doesn't start movement)
        false, // isVisible = false (not visible until MOVE is executed)
        0, // frameIndex = 0 (initial frame)
        0, // remainingDistance = 0 (not moving yet)
        definition.distance * 2, // totalDistance (stored but not used until MOVE)
        definition.direction,
        definition.speed,
        definition.priority,
        definition.characterType,
        definition.colorCombination
      )
      logWorker.debug(
        '[AnimationManager] defineMovement: wrote definition to shared buffer for action',
        definition.actionNumber
      )
    }

    // Initialize POSITION for this action to screen center when DEF MOVE runs (like DEF SPRITE)
    if (this.deviceAdapter?.setSpritePosition) {
      const existing = this.deviceAdapter.getSpritePosition(definition.actionNumber)
      if (existing === null) {
        const halfSize = getSpriteSizeForMoveDefinition(definition) / 2
        const centerX = SCREEN_DIMENSIONS.SPRITE.DEFAULT_X - halfSize
        const centerY = SCREEN_DIMENSIONS.SPRITE.DEFAULT_Y - halfSize
        this.deviceAdapter.setSpritePosition(definition.actionNumber, centerX, centerY)
      }
    }
  }

  /**
   * Get movement definition for an action slot.
   * @param actionNumber - Action slot 0-7
   * @returns MoveDefinition if defined, otherwise undefined
   */
  getMoveDefinition(actionNumber: number): MoveDefinition | undefined {
    return this.moveDefinitions.get(actionNumber)
  }

  /**
   * Start movement (MOVE command). Sends START_MOVEMENT command to Animation Worker.
   * @param actionNumber - Action slot 0-7 (must have been defined with DEF MOVE)
   * @param startX - Optional pixel X (0-255); default center if omitted
   * @param startY - Optional pixel Y (0-255); default center if omitted
   * @throws Error if no definition exists for actionNumber
   */
  startMovement(actionNumber: number, startX?: number, startY?: number): void {
    logWorker.debug('[AnimationManager] startMovement called for sprite', actionNumber)

    const definition = this.moveDefinitions.get(actionNumber)
    if (!definition) {
      throw new Error(`No movement definition for action number ${actionNumber} (use DEF MOVE first)`)
    }

    // Start position: from POSITION command, or default so sprite center is at screen center
    const screenCenterX = SCREEN_DIMENSIONS.SPRITE.DEFAULT_X
    const screenCenterY = SCREEN_DIMENSIONS.SPRITE.DEFAULT_Y
    const halfSize =
      startX === undefined || startY === undefined
        ? getSpriteSizeForMoveDefinition(definition) / 2
        : 0
    const initialX = startX ?? screenCenterX - halfSize
    const initialY = startY ?? screenCenterY - halfSize

    logWorker.debug('[AnimationManager] Starting movement at position:', initialX, initialY)

    // Write START_MOVEMENT command to shared buffer
    if (!this.accessor) {
      throw new Error('[AnimationManager] Shared buffer not available - cannot start movement')
    }

    logWorker.debug('[AnimationManager] Writing START_MOVEMENT command to buffer...')
    this.dispatchSyncCommand(SyncCommandType.START_MOVEMENT, actionNumber, {
      startX: initialX,
      startY: initialY,
      direction: definition.direction,
      speed: definition.speed,
      distance: definition.distance,
      priority: definition.priority,
    })
  }

  /**
   * Stop movement (CUT command). Stops movement but keeps sprite visible at current position.
   * Uses direct synchronization to Animation Worker.
   * @param actionNumbers - Action slots 0-7 to stop
   */
  stopMovement(actionNumbers: number[]): void {
    if (!this.accessor) {
      throw new Error('[AnimationManager] Shared buffer not available - cannot stop movement')
    }

    for (const actionNumber of actionNumbers) {
      this.dispatchSyncCommand(SyncCommandType.STOP_MOVEMENT, actionNumber, {})
    }
  }

  /**
   * Erase movement (ERA command). Stops movement, hides sprite, and clears the definition.
   * Uses direct synchronization to Animation Worker.
   * @param actionNumbers - Action slots 0-7 to erase
   */
  eraseMovement(actionNumbers: number[]): void {
    if (!this.accessor) {
      throw new Error('[AnimationManager] Shared buffer not available - cannot erase movement')
    }

    for (const actionNumber of actionNumbers) {
      this.dispatchSyncCommand(SyncCommandType.ERASE_MOVEMENT, actionNumber, {})

      // Clear the move definition
      this.moveDefinitions.delete(actionNumber)
    }
  }

  /**
   * Set initial position (POSITION command).
   * Uses direct synchronization to Animation Worker.
   * @param actionNumber - Action slot 0-7
   * @param x - Pixel X (0-255)
   * @param y - Pixel Y (0-255, per F-BASIC manual)
   * @throws Error if actionNumber or coordinates out of range
   */
  setPosition(actionNumber: number, x: number, y: number): void {
    if (actionNumber < 0 || actionNumber > 7) {
      throw new Error(`Invalid action number: ${actionNumber} (must be 0-7)`)
    }
    if (x < 0 || x > 255) {
      throw new Error(`Invalid X coordinate: ${x} (must be 0-255)`)
    }
    if (y < 0 || y > 255) {
      throw new Error(`Invalid Y coordinate: ${y} (must be 0-255)`)
    }

    if (!this.accessor) {
      throw new Error('[AnimationManager] Shared buffer not available - cannot set position')
    }

    // Store position locally for device adapter (for MOVE command to use as start position)
    this.deviceAdapter?.setSpritePosition?.(actionNumber, x, y)

    // Write SET_POSITION command to shared buffer
    this.dispatchSyncCommand(SyncCommandType.SET_POSITION, actionNumber, {
      startX: x,
      startY: y,
    })
  }

  /**
   * Get movement status (MOVE(n) function). -1 = moving, 0 = complete or not started.
   * Reads from shared buffer managed by Animation Worker.
   * @param actionNumber - Action slot 0-7
   * @returns -1 if movement is active, 0 otherwise
   */
  getMovementStatus(actionNumber: number): -1 | 0 {
    if (!this.accessor) {
      throw new Error('[AnimationManager] Shared buffer not available - cannot get movement status')
    }
    return this.accessor.readSpriteIsActive(actionNumber) ? -1 : 0
  }

  /**
   * Get sprite position (XPOS/YPOS functions). Position lives in Konva on main thread; worker returns null.
   * Frontend should read from shared buffer or Konva for XPOS/YPOS.
   * @param _actionNumber - Action slot 0-7 (unused in worker; frontend reads from buffer/Konva)
   * @returns null in worker; frontend uses shared buffer or Konva nodes
   */
  getSpritePosition(_actionNumber: number): { x: number; y: number } | null {
    // Position is in Konva nodes, not in worker state
    // Frontend will query Konva nodes for XPOS/YPOS
    return null
  }

  /**
   * Get all movement states (for testing/inspector).
   * Returns minimal MovementState objects from moveDefinitions.
   * Actual animation state is tracked by Animation Worker in shared buffer.
   * @returns Array of MovementState for all defined movements
   */
  getAllMovementStates(): MovementState[] {
    logWorker.debug('[AnimationManager] getAllMovementStates: moveDefinitions size:', this.moveDefinitions.size)
    const states = Array.from(this.moveDefinitions.values()).map(definition => ({
      actionNumber: definition.actionNumber,
      definition,
    }))
    logWorker.debug('[AnimationManager] getAllMovementStates: returning', states.length, 'states')
    return states
  }

  /**
   * Get movement state for a specific action slot (for testing/inspector).
   * Returns minimal MovementState from moveDefinition.
   * Actual animation state is tracked by Animation Worker in shared buffer.
   * @param actionNumber - Action slot 0-7
   * @returns MovementState if defined, otherwise undefined
   */
  getMovementState(actionNumber: number): MovementState | undefined {
    const definition = this.moveDefinitions.get(actionNumber)
    if (!definition) return undefined
    return {
      actionNumber,
      definition,
    }
  }

  /**
   * Reset all movement states (for program reset)
   */
  reset(): void {
    this.moveDefinitions.clear()
  }
}
