/**
 * WebAudioPlayer
 *
 * Vanilla (non-Vue) Web Audio API player for F-BASIC PLAY command.
 * Designed for the export runtime where Vue composables are not available.
 *
 * Handles 3-channel polyphonic playback with duty cycle, envelope, and volume.
 * Based on the same approach as useWebAudioPlayer.ts but without Vue reactivity.
 *
 * All note scheduling uses Web Audio API's built-in timing (ctx.currentTime)
 * rather than setTimeout, so playback continues correctly even when the
 * browser tab is in the background.
 */

import { ENVELOPE_DECAY_BASE } from '@/core/sound/constants'
import type { CompiledAudio, Note, Rest } from '@/core/sound/types'

/**
 * Track pending timeout IDs for completion callbacks.
 * Stored as a Set for O(1) add/delete.
 */
type PendingTimeouts = Set<ReturnType<typeof setTimeout>>

/**
 * Get calibrated decay time for an envelope value.
 *
 * Uses ENVELOPE_DECAY_BASE which is calibrated to NES APU hardware:
 * - Volume decrements from 15 to 0 in 16 steps
 * - Each step takes (V+1)/240 seconds (NTSC 240Hz clock)
 * - Total decay time = 16 x (V+1) / 240 seconds
 */
function getEnvelopeDecayMs(envelopeValue: number): number {
  return ENVELOPE_DECAY_BASE[envelopeValue] ?? ENVELOPE_DECAY_BASE[0]!
}

/** Total duration (ms) of a channel's events (notes + rests). */
function getChannelDurationMs(channelEvents: Array<Note | Rest>): number {
  return channelEvents.reduce((sum, e) => sum + e.duration, 0)
}

/** Total playback time (ms) = max of per-channel durations. */
function getTotalDurationMs(channels: Array<Array<Note | Rest>>): number {
  if (channels.length === 0) return 0
  return Math.max(...channels.map(getChannelDurationMs))
}

/**
 * Safari may expose AudioContext under the webkit-prefixed name.
 * We check for it here to avoid `as unknown as` casts elsewhere.
 */
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
type AudioContextConstructor = new (...args: any[]) => AudioContext

/**
 * Create an AudioContext instance.
 *
 * Handles Safari's webkitAudioContext prefix.
 */
function createAudioContext(): AudioContext | null {
  const contextClass: AudioContextConstructor | undefined =
    globalThis.AudioContext
    ?? (globalThis as Record<string, unknown>)['webkitAudioContext'] as AudioContextConstructor | undefined
  if (!contextClass) return null
  return new contextClass()
}

/**
 * Web Audio player for the F-BASIC export runtime.
 *
 * Provides PLAY (synchronous), BGPLAY (background), and BEEP playback
 * using the Web Audio API directly on the main thread.
 *
 * Usage:
 * ```ts
 * const player = new WebAudioPlayer()
 * await player.playSound(compiledAudio) // blocks until playback completes
 * player.beep()                        // short beep
 * player.dispose()                     // release resources
 * ```
 */
export class WebAudioPlayer {
  private audioContext: AudioContext | null = null
  private pendingTimeouts: PendingTimeouts = new Set()
  private scheduledOscillators = new Set<OscillatorNode>()
  private scheduledGainNodes = new Set<GainNode>()
  private visibilityHandler: (() => void) | null = null
  /** Pending playSound promises to reject on stopAll/dispose. */
  private pendingPlayResolvers: Array<() => void> = []

  // === PUBLIC API ===

  /**
   * Play compiled audio synchronously (blocking).
   * Returns a Promise that resolves when playback finishes.
   */
  playSound(audio: CompiledAudio): Promise<void> {
    this.ensureContext()
    if (!this.audioContext) return Promise.resolve()

    this.scheduleAllChannels(audio.channels)

    const totalMs = getTotalDurationMs(audio.channels)
    if (totalMs <= 0) return Promise.resolve()

    return new Promise<void>((resolve) => {
      this.pendingPlayResolvers.push(resolve)
      const timeoutId = setTimeout(() => {
        this.pendingTimeouts.delete(timeoutId)
        const idx = this.pendingPlayResolvers.indexOf(resolve)
        if (idx !== -1) this.pendingPlayResolvers.splice(idx, 1)
        resolve()
      }, totalMs)
      this.pendingTimeouts.add(timeoutId)
    })
  }

  /**
   * Play compiled audio in background (non-blocking).
   * Used by BGPLAY statement.
   */
  playSoundBackground(audio: CompiledAudio): void {
    this.ensureContext()
    if (!this.audioContext) return

    this.scheduleAllChannels(audio.channels)
  }

  /**
   * Play a short beep sound.
   * 1200Hz for 300ms at volume 15 with duty cycle 2 (50%).
   */
  beep(): void {
    this.ensureContext()
    if (!this.audioContext) return

    const beepNote: Note = {
      frequency: 1200,
      duration: 300,
      channel: 0,
      duty: 2,
      envelope: 0,
      volumeOrLength: 15,
    }
    this.scheduleAllChannels([[beepNote]])
  }

  /**
   * Stop all sounds and clear the play queue.
   * Resolves any pending playSound promises.
   */
  stopAll(): void {
    // Clear all pending timeouts
    for (const timeoutId of this.pendingTimeouts) {
      clearTimeout(timeoutId)
    }
    this.pendingTimeouts.clear()

    // Resolve all pending playSound promises
    for (const resolve of this.pendingPlayResolvers) {
      resolve()
    }
    this.pendingPlayResolvers.length = 0

    // Stop all scheduled oscillators
    for (const oscillator of this.scheduledOscillators) {
      try {
        oscillator.stop()
        oscillator.disconnect()
      } catch {
        // Oscillator may have already stopped
      }
    }
    this.scheduledOscillators.clear()

    // Disconnect all gain nodes
    for (const gainNode of this.scheduledGainNodes) {
      try {
        gainNode.disconnect()
      } catch {
        // GainNode may have already been disconnected
      }
    }
    this.scheduledGainNodes.clear()
  }

  /**
   * Release all resources.
   * Stops all sounds, closes the AudioContext, and removes event listeners.
   */
  dispose(): void {
    this.stopAll()

    if (this.audioContext) {
      void this.audioContext.close()
      this.audioContext = null
    }

    this.removeVisibilityHandler()
  }

  // === PRIVATE METHODS ===

  /**
   * Ensure AudioContext is initialized and resumed.
   */
  private ensureContext(): void {
    if (!this.audioContext) {
      this.audioContext = createAudioContext()
      if (this.audioContext) {
        this.setupVisibilityHandler()
      }
    }
    this.resumeContext()
  }

  /**
   * Resume AudioContext if suspended (browser autoplay policy).
   */
  private resumeContext(): void {
    if (this.audioContext?.state === 'suspended') {
      void this.audioContext.resume()
    }
  }

  /**
   * Set up visibility change handler to resume AudioContext
   * when the tab becomes visible again.
   */
  private setupVisibilityHandler(): void {
    if (this.visibilityHandler) return
    if (typeof document === 'undefined') return

    this.visibilityHandler = () => {
      if (document.visibilityState === 'visible') {
        this.resumeContext()
      }
    }
    document.addEventListener('visibilitychange', this.visibilityHandler)
  }

  /**
   * Remove the visibility change handler.
   */
  private removeVisibilityHandler(): void {
    if (this.visibilityHandler && typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.visibilityHandler)
      this.visibilityHandler = null
    }
  }

  /**
   * Create square wave with duty cycle using Fourier series.
   *
   * Uses Fourier series for pulse wave generation:
   * duty: 0=12.5%, 1=25%, 2=50%, 3=75%
   */
  private createSquareWave(duty: number): PeriodicWave | null {
    if (!this.audioContext) return null

    const n = 32 // Number of harmonics
    const real = new Float32Array(n)
    const imag = new Float32Array(n)

    const dutyCycle = [0.125, 0.25, 0.5, 0.75][duty] ?? 0.5

    // DC offset for duty cycle != 50%
    real[0] = 2 * dutyCycle - 1

    // Fourier series for pulse wave
    for (let i = 1; i < n; i++) {
      const coeff = (2 / (Math.PI * i)) * Math.sin(Math.PI * i * dutyCycle)
      imag[i] = coeff
    }

    return this.audioContext.createPeriodicWave(real, imag, { disableNormalization: false })
  }

  /**
   * Schedule a single note at a specific AudioContext time offset.
   */
  private scheduleNote(note: Note, startTimeSeconds: number): void {
    if (!this.audioContext) return

    const ctx = this.audioContext
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.frequency.value = note.frequency

    // Set waveform (square wave with duty cycle)
    const periodicWave = this.createSquareWave(note.duty)
    if (periodicWave) {
      oscillator.setPeriodicWave(periodicWave)
    }

    // Connect: oscillator -> gainNode -> destination
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    // Calculate volume
    const duration = note.duration / 1000 // ms -> seconds

    if (note.envelope === 1) {
      // M1: Envelope decay mode (NES APU hardware behavior)
      gainNode.gain.setValueAtTime(1.0, startTimeSeconds)
      const envelopeDecayMs = getEnvelopeDecayMs(note.volumeOrLength)
      const decayTime = Math.min(envelopeDecayMs / 1000, duration)
      gainNode.gain.linearRampToValueAtTime(0, startTimeSeconds + decayTime)
    } else {
      // M0: Constant volume
      const volume = note.volumeOrLength / 15
      gainNode.gain.setValueAtTime(volume, startTimeSeconds)
    }

    // Schedule playback using Web Audio time
    oscillator.start(startTimeSeconds)
    oscillator.stop(startTimeSeconds + duration)

    // Track for cleanup; auto-remove when finished
    this.scheduledOscillators.add(oscillator)
    this.scheduledGainNodes.add(gainNode)
    oscillator.onended = () => {
      this.scheduledOscillators.delete(oscillator)
      this.scheduledGainNodes.delete(gainNode)
    }
  }

  /**
   * Schedule all notes across all channels using Web Audio API time offsets.
   * Channels play simultaneously (polyphonic).
   */
  private scheduleAllChannels(channels: Array<Array<Note | Rest>>): void {
    if (!this.audioContext) return

    const baseTime = this.audioContext.currentTime

    for (const channelEvents of channels) {
      let timeOffsetSeconds = 0

      for (const event of channelEvents) {
        if ('frequency' in event) {
          this.scheduleNote(event, baseTime + timeOffsetSeconds)
          timeOffsetSeconds += event.duration / 1000
        } else {
          timeOffsetSeconds += event.duration / 1000
        }
      }
    }
  }
}
