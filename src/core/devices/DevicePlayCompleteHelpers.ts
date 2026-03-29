/**
 * Device Play Complete Helpers
 *
 * Standalone functions for PLAY sound completion tracking in WebWorkerDeviceAdapter.
 * Extracted from WebWorkerDeviceAdapter.ts for modularity.
 *
 * Handles: PLAY_SOUND/PLAY_SOUND_COMPLETE promise lifecycle.
 * Pattern mirrors DeviceInputRequestHelpers (INPUT_VALUE).
 */

import type { PlaySoundCompleteMessage } from '@/core/interfaces'

// ============================================================================
// Play Complete State
// ============================================================================

interface PendingPlayComplete {
  resolve: () => void
  reject: (err: Error) => void
}

/**
 * Create a pending play completion promise and store it in the map.
 * Returns the playId and the promise that resolves when PLAY_SOUND_COMPLETE arrives.
 */
export function createPlayCompleteRequest(
  pendingPlayComplete: Map<string, PendingPlayComplete>,
  playId: string
): Promise<void> {
  const promise = new Promise<void>((resolve, reject) => {
    pendingPlayComplete.set(playId, { resolve, reject })
  })
  return promise
}

/**
 * Handle a PLAY_SOUND_COMPLETE message from main thread.
 * Resolves the matching pending promise.
 */
export function handlePlaySoundCompleteMessage(
  pendingPlayComplete: Map<string, PendingPlayComplete>,
  message: PlaySoundCompleteMessage
): void {
  const { playId } = message.data
  const pending = pendingPlayComplete.get(playId)
  pendingPlayComplete.delete(playId)
  if (!pending) return
  pending.resolve()
}

/**
 * Reject all pending play complete requests (e.g., when STOP is pressed).
 */
export function rejectAllPlayCompleteRequests(
  pendingPlayComplete: Map<string, PendingPlayComplete>,
  reason: string = 'Execution stopped'
): void {
  for (const [, pending] of pendingPlayComplete) {
    pending.reject(new Error(reason))
  }
  pendingPlayComplete.clear()
}
