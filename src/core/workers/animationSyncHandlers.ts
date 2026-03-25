/**
 * Animation Worker Sync Command Handlers
 *
 * Handles direct synchronization commands from Executor Worker via shared buffer sync section.
 * These are extracted from AnimationWorker to keep the main class under 500 lines.
 */

import { SyncCommandType } from '@/core/animation/sharedDisplayBuffer'
import type { SharedDisplayBufferAccessor } from '@/core/animation/sharedDisplayBufferAccessor'
import type { MoveDefinition } from '@/core/sprite/types'
import { logWorker } from '@/shared/logger'

/**
 * Movement state tracked by Animation Worker
 * Position is the single source of truth, written to shared buffer
 */
export interface WorkerMovementState {
  actionNumber: number
  definition: MoveDefinition
  x: number
  y: number
  remainingDistance: number
  totalDistance: number // Total distance in dots (2 * MOVE distance parameter)
  speedDotsPerSecond: number
  directionDeltaX: number
  directionDeltaY: number
  isActive: boolean
  currentFrameIndex: number
  frameCounter: number
}

/**
 * Calculate direction deltas from direction code
 * Direction: 0=none, 1=up, 2=up-right, 3=right, 4=down-right,
 *            5=down, 6=down-left, 7=left, 8=up-left
 */
export function getDirectionDeltas(direction: number): { deltaX: number; deltaY: number } {
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
 * Handle START_MOVEMENT from sync buffer.
 */
export function handleStartMovementFromSync(
  actionNumber: number,
  params: {
    startX: number
    startY: number
    direction: number
    speed: number
    distance: number
    priority: number
  },
  movementStates: Map<number, WorkerMovementState>,
  accessor: SharedDisplayBufferAccessor
): void {
  const { deltaX, deltaY } = getDirectionDeltas(params.direction)
  const speedDotsPerSecond = params.speed === 0 ? 60 / 256 : 60 / params.speed
  const totalDistance = 2 * params.distance

  // Read characterType and colorCombination from buffer (set by DEF MOVE)
  // These values are already in the buffer from the DEF MOVE command
  const characterType = accessor.readSpriteCharacterType(actionNumber) ?? 0
  const colorCombination = accessor.readSpriteColorCombination(actionNumber) ?? 0

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

  movementStates.set(actionNumber, movementState)

  // Write initial position to shared buffer
  accessor.writeSpriteState(
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

/**
 * Handle STOP_MOVEMENT from sync buffer.
 */
export function handleStopMovementFromSync(
  actionNumber: number,
  movementStates: Map<number, WorkerMovementState>,
  accessor: SharedDisplayBufferAccessor
): void {
  logWorker.debug('[AnimationWorker] STOP_MOVEMENT from sync:', actionNumber)

  const movement = movementStates.get(actionNumber)
  if (movement) {
    movement.isActive = false
    // Write inactive state to shared buffer with all animation parameters
    // isVisible stays true after CUT (sprite remains visible but stops moving)
    accessor.writeSpriteState(
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
export function handleEraseMovementFromSync(
  actionNumber: number,
  movementStates: Map<number, WorkerMovementState>,
  accessor: SharedDisplayBufferAccessor
): void {
  logWorker.debug('[AnimationWorker] ERASE_MOVEMENT from sync:', actionNumber)

  movementStates.delete(actionNumber)
  // Write inactive state to shared buffer (reset all values, characterType=-1 marks as uninitialized)
  accessor.writeSpriteState(actionNumber, 0, 0, false, false, 0, 0, 0, 0, 0, 0, -1, 0)
}

/**
 * Handle SET_POSITION from sync buffer.
 */
export function handleSetPositionFromSync(
  actionNumber: number,
  x: number,
  y: number,
  movementStates: Map<number, WorkerMovementState>,
  accessor: SharedDisplayBufferAccessor
): void {
  const movement = movementStates.get(actionNumber)
  if (movement) {
    movement.x = x
    movement.y = y
  }

  // Write position to shared buffer while preserving characterType and colorCombination
  // These are set by DEF MOVE and should NOT be overwritten by SET_POSITION
  // Read existing characterType and colorCombination before overwriting
  const existingCharacterType = accessor.readSpriteCharacterType(actionNumber)
  const existingColorCombination = accessor.readSpriteColorCombination(actionNumber)

  const isActive = movement?.isActive ?? false
  const isVisible = movement ? true : false // isVisible is true if movement exists (has been MOVE'd without ERA)
  const frameIndex = movement?.currentFrameIndex ?? 0
  const def = movement?.definition

  accessor.writeSpriteState(
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

/**
 * Handle CLEAR_ALL_MOVEMENTS from sync buffer.
 * Called when user clicks CLEAR button - clears all internal movement states and sprite buffer.
 */
export function handleClearAllMovementsFromSync(
  movementStates: Map<number, WorkerMovementState>,
  accessor: SharedDisplayBufferAccessor
): void {
  logWorker.debug(
    '[AnimationWorker] CLEAR_ALL_MOVEMENTS: clearing',
    movementStates.size,
    'movement states and all sprite data'
  )

  // Clear all internal movement states
  movementStates.clear()

  // Clear sprite buffer (single writer: only AnimationWorker writes to sprite portion)
  // This sets all positions to 0, isActive=false, isVisible=false, characterType=-1
  accessor.clearAllSprites()
}

/**
 * Poll sync section for commands from Executor Worker (direct communication).
 * Processes any pending command and writes acknowledgment when complete.
 */
export function pollSyncCommands(
  movementStates: Map<number, WorkerMovementState>,
  accessor: SharedDisplayBufferAccessor
): boolean {
  const command = accessor.readSyncCommand()
  if (!command) return false // No pending command

  try {
    switch (command.commandType) {
      case SyncCommandType.NONE:
        // Should not happen as readSyncCommand returns null for NONE
        break
      case SyncCommandType.START_MOVEMENT:
        handleStartMovementFromSync(command.actionNumber, command.params, movementStates, accessor)
        break
      case SyncCommandType.STOP_MOVEMENT:
        handleStopMovementFromSync(command.actionNumber, movementStates, accessor)
        break
      case SyncCommandType.ERASE_MOVEMENT:
        handleEraseMovementFromSync(command.actionNumber, movementStates, accessor)
        break
      case SyncCommandType.SET_POSITION:
        handleSetPositionFromSync(
          command.actionNumber,
          command.params.startX,
          command.params.startY,
          movementStates,
          accessor
        )
        break
      case SyncCommandType.CLEAR_ALL_MOVEMENTS:
        logWorker.debug('[AnimationWorker] CLEAR_ALL_MOVEMENTS: clearing all sprite data')
        handleClearAllMovementsFromSync(movementStates, accessor)
        // Clear the command immediately after processing so it's not re-read every tick
        accessor.clearSyncCommand()
        break
    }

    // Write acknowledgment
    accessor.notifyAck()
  } catch (error) {
    logWorker.error('[AnimationWorker] Error processing sync command:', error)
    // Still write ack to prevent Executor Worker from hanging
    accessor.notifyAck()
  }

  return true
}
