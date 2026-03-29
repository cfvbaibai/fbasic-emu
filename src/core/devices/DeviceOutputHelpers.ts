/**
 * Device Output Helpers
 *
 * Standalone functions for output handling in WebWorkerDeviceAdapter.
 * Extracted from WebWorkerDeviceAdapter.ts for modularity.
 *
 * Handles: Text output, sound playback (PLAY, BEEP), and audio event serialization.
 */

import type { CompiledAudio } from '@/core/sound/types'
import { logWorker } from '@/shared/logger'

// ============================================================================
// Text Output
// ============================================================================

/** Post an OUTPUT message to main thread. */
export function postOutputMessage(
  executionId: string,
  output: string,
  outputType: 'print' | 'debug' | 'error'
): void {
  const logFn = outputType === 'error' ? logWorker.error
    : outputType === 'debug' ? logWorker.debug
    : logWorker.debug
  logFn(`${outputType === 'print' ? 'Print' : outputType} output:`, output)
  self.postMessage({
    type: 'OUTPUT',
    id: `${outputType}-${crypto.randomUUID()}`,
    timestamp: Date.now(),
    data: { executionId, output, outputType, timestamp: Date.now() },
  })
}

// ============================================================================
// Audio Event Serialization
// ============================================================================

/**
 * Serialized audio event for transmission to main thread.
 */
export interface SerializedAudioEvent {
  frequency?: number
  duration: number
  channel: number
  duty: number
  envelope: number
  volumeOrLength: number
}

/**
 * Serialize compiled audio events for postMessage transmission.
 */
export function serializeAudioEvents(audio: CompiledAudio): SerializedAudioEvent[] {
  const events = audio.channels.flatMap((channelEvents) => channelEvents)
  return events.map((event) => ({
    frequency: 'frequency' in event ? event.frequency : undefined,
    duration: event.duration,
    channel: event.channel,
    duty: 'duty' in event ? event.duty : 0,
    envelope: 'envelope' in event ? event.envelope : 0,
    volumeOrLength: 'volumeOrLength' in event ? event.volumeOrLength : 0,
  }))
}

// ============================================================================
// Sound Message Builders
// ============================================================================

/**
 * Build PLAY_SOUND message for posting to main thread.
 */
export function buildPlaySoundMessage(
  executionId: string,
  events: SerializedAudioEvent[],
  musicString?: string,
  playId?: string
) {
  const id = playId ?? crypto.randomUUID()
  return {
    type: 'PLAY_SOUND' as const,
    id,
    timestamp: Date.now(),
    data: {
      executionId,
      playId: id,
      events,
      ...(musicString ? { musicString } : {}),
    },
  }
}

/**
 * Build BEEP message for posting to main thread.
 */
export function buildBeepMessage(executionId: string) {
  return buildPlaySoundMessage(
    executionId,
    [{ frequency: 1200, duration: 300, channel: 0, duty: 2, envelope: 0, volumeOrLength: 15 }],
    'BEEP'
  )
}

/** Post a PLAY_SOUND message to main thread. Returns the playId for completion tracking. */
export function postPlaySound(executionId: string, audio: CompiledAudio): string {
  logWorker.debug('Playing sound, channels:', audio.channels.length)
  const events = serializeAudioEvents(audio)
  const message = buildPlaySoundMessage(executionId, events)
  self.postMessage(message)
  return message.data.playId
}

/** Post a BEEP message to main thread. */
export function postBeep(executionId: string): void {
  logWorker.debug('Playing beep')
  self.postMessage(buildBeepMessage(executionId))
}
