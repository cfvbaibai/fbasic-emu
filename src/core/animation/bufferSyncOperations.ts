/**
 * Buffer Sync Operations
 *
 * Standalone functions for reading/writing animation sync commands in the shared display buffer.
 * Extracted from SharedDisplayBufferAccessor for modularity.
 *
 * The sync section (9 Float64 values) provides a command channel between
 * Executor Worker and Animation Worker, plus Atomics-based acknowledgment.
 *
 * @see {@link docs/reference/shared-display-buffer.md} for buffer layout
 */

import {
  ACK_PENDING,
  ACK_RECEIVED,
  SyncCommandType,
} from './sharedDisplayBuffer'
import type { SyncCommand, SyncCommandParams } from './sharedDisplayBufferTypes'

// ============================================================================
// Sync Section Index Constants
// ============================================================================

const SYNC_COMMAND_TYPE_INDEX = 0
const SYNC_ACTION_NUMBER_INDEX = 1
const SYNC_PARAM1_INDEX = 2
const SYNC_PARAM2_INDEX = 3
const SYNC_PARAM3_INDEX = 4
const SYNC_PARAM4_INDEX = 5
const SYNC_PARAM5_INDEX = 6
const SYNC_PARAM6_INDEX = 7
const SYNC_ACK_INDEX = 8

/** Ack is at Float64 index 8, so Int32 index is 16. */
const ACK_INT32_INDEX = 8 * 2

// ============================================================================
// Sync Command Write Operations
// ============================================================================

/**
 * Write a sync command to the shared buffer for Animation Worker to process.
 */
export function writeSyncCommand(
  syncView: Float64Array,
  commandType: SyncCommandType,
  actionNumber: number,
  params: SyncCommandParams = {}
): void {
  syncView[SYNC_COMMAND_TYPE_INDEX] = commandType
  syncView[SYNC_ACTION_NUMBER_INDEX] = actionNumber
  syncView[SYNC_PARAM1_INDEX] = params.startX ?? 0
  syncView[SYNC_PARAM2_INDEX] = params.startY ?? 0
  syncView[SYNC_PARAM3_INDEX] = params.direction ?? 0
  syncView[SYNC_PARAM4_INDEX] = params.speed ?? 0
  syncView[SYNC_PARAM5_INDEX] = params.distance ?? 0
  syncView[SYNC_PARAM6_INDEX] = params.priority ?? 0
  syncView[SYNC_ACK_INDEX] = ACK_PENDING
}

/**
 * Clear sync command from shared buffer (set to NONE).
 */
export function clearSyncCommand(syncView: Float64Array): void {
  syncView[SYNC_COMMAND_TYPE_INDEX] = SyncCommandType.NONE
  syncView[SYNC_ACTION_NUMBER_INDEX] = 0
  syncView[SYNC_PARAM1_INDEX] = 0
  syncView[SYNC_PARAM2_INDEX] = 0
  syncView[SYNC_PARAM3_INDEX] = 0
  syncView[SYNC_PARAM4_INDEX] = 0
  syncView[SYNC_PARAM5_INDEX] = 0
  syncView[SYNC_PARAM6_INDEX] = 0
}

// ============================================================================
// Sync Command Read Operations
// ============================================================================

/**
 * Read sync command from shared buffer. Returns null if no command is pending.
 */
export function readSyncCommand(syncView: Float64Array): SyncCommand | null {
  const commandType = syncView[SYNC_COMMAND_TYPE_INDEX] as SyncCommandType

  if (commandType < SyncCommandType.START_MOVEMENT || commandType > SyncCommandType.CLEAR_ALL_MOVEMENTS) {
    return null
  }

  return {
    commandType,
    actionNumber: syncView[SYNC_ACTION_NUMBER_INDEX] as number,
    params: {
      startX: syncView[SYNC_PARAM1_INDEX] as number,
      startY: syncView[SYNC_PARAM2_INDEX] as number,
      direction: syncView[SYNC_PARAM3_INDEX] as number,
      speed: syncView[SYNC_PARAM4_INDEX] as number,
      distance: syncView[SYNC_PARAM5_INDEX] as number,
      priority: syncView[SYNC_PARAM6_INDEX] as number,
    },
  }
}

// ============================================================================
// Acknowledgment Operations
// ============================================================================

/**
 * Write acknowledgment flag.
 */
export function writeAck(syncView: Float64Array, ack: number): void {
  syncView[SYNC_ACK_INDEX] = ack
}

/**
 * Read acknowledgment flag.
 */
export function readAck(syncView: Float64Array): number {
  return syncView[SYNC_ACK_INDEX] as number
}

/**
 * Notify waiting thread using Atomics (sets ack to RECEIVED and notifies).
 */
export function notifyAck(syncInt32View: Int32Array): void {
  syncInt32View[ACK_INT32_INDEX] = ACK_RECEIVED
  try {
    Atomics.notify(syncInt32View, ACK_INT32_INDEX, 1)
  } catch {
    // Atomics.notify may throw in some contexts, ignore
  }
}

/**
 * Wait for acknowledgment using Atomics.
 * Returns true if ACK_RECEIVED was observed within timeoutMs, false otherwise.
 */
export function waitForAck(syncInt32View: Int32Array, timeoutMs: number = 100): boolean {
  const startTime = performance.now()

  while (syncInt32View[ACK_INT32_INDEX] === ACK_PENDING) {
    const elapsed = performance.now() - startTime
    if (elapsed >= timeoutMs) {
      return false
    }
    try {
      const remaining = Math.min(10, timeoutMs - elapsed)
      Atomics.wait(syncInt32View, ACK_INT32_INDEX, ACK_PENDING, remaining)
    } catch {
      const start = performance.now()
      while (performance.now() - start < 1) {
        // Busy-wait for 1ms to yield CPU
      }
    }
  }

  return syncInt32View[ACK_INT32_INDEX] === ACK_RECEIVED
}

// ============================================================================
// Atomics Notify
// ============================================================================

/**
 * Notify waiting threads that sync state has changed.
 */
export function notifySync(syncInt32View: Int32Array, count = 1): void {
  try {
    Atomics.notify(syncInt32View, 0, count)
  } catch {
    // Atomics.notify may throw in some contexts, ignore
  }
}
