/**
 * Web Audio API player for F-BASIC PLAY command
 *
 * Handles 3-channel polyphonic playback with duty cycle, envelope, and volume.
 * Based on POC implementation in docs/poc/play-command-poc.html.
 *
 * All note scheduling uses Web Audio API's built-in timing (ctx.currentTime)
 * rather than setTimeout, so playback continues correctly even when the
 * browser tab is in the background.
 */

import { ref } from 'vue'

import { ENVELOPE_DECAY_BASE } from '@/core/sound/constants'
import type { Note, Rest } from '@/core/sound/types'

/** Current decay factor (1.0 = use base values) */
let envelopeDecayFactor = 1.0

/**
 * Set the envelope decay factor
 * @param factor - Multiplier for envelope decay times (< 1.0 = shorter, > 1.0 = longer)
 */
export function setEnvelopeDecayFactor(factor: number): void {
  envelopeDecayFactor = Math.max(0.1, Math.min(5, factor))
}

/**
 * Get the current envelope decay factor
 */
export function getEnvelopeDecayFactor(): number {
  return envelopeDecayFactor
}

/**
 * Get calibrated decay time for an envelope value
 */
function getEnvelopeDecayMs(envelopeValue: number): number {
  const baseMs = ENVELOPE_DECAY_BASE[envelopeValue] ?? ENVELOPE_DECAY_BASE[0]!
  return baseMs * envelopeDecayFactor
}

/** Total duration (ms) of a channel's events (notes + rests) */
function getChannelDurationMs(channelEvents: Array<Note | Rest>): number {
  return channelEvents.reduce((sum, e) => sum + e.duration, 0)
}

/** Total playback time (ms) = max of per-channel durations (channels play in parallel) */
function getTotalDurationMs(channels: Array<Array<Note | Rest>>): number {
  if (channels.length === 0) return 0
  return Math.max(...channels.map(getChannelDurationMs))
}

export function useWebAudioPlayer() {
  const audioContext = ref<AudioContext | null>(null)
  const isInitialized = ref(false)
  /** Queue for sequential PLAY: next melody starts after current finishes */
  const playQueue: Array<Array<Array<Note | Rest>>> = []
  let isPlaying = false
  /** Track pending timeout IDs for completion callbacks */
  const pendingTimeouts = new Set<ReturnType<typeof setTimeout>>()
  /** Track scheduled oscillators for cleanup */
  const scheduledOscillators = new Set<OscillatorNode>()
  /** Visibility change handler reference for cleanup */
  let visibilityHandler: (() => void) | null = null

  /**
   * Resume AudioContext if suspended.
   * Called during initialization and on visibility changes.
   */
  function resumeContext(): void {
    if (audioContext.value?.state === 'suspended') {
      void audioContext.value.resume()
    }
  }

  /**
   * Initialize AudioContext (requires user gesture)
   */
  function initialize(): void {
    if (!audioContext.value) {
      // Safari uses webkitAudioContext
      const contextClass =
        window.AudioContext ||
        (window as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
      if (contextClass) {
        audioContext.value = new contextClass()
        isInitialized.value = true
        setupVisibilityHandler()
      }
    }

    // Resume if suspended (autoplay policy)
    resumeContext()
  }

  /**
   * Set up visibility change handler to resume AudioContext
   * when the tab becomes visible again after being hidden.
   * Browsers suspend AudioContext when a tab goes inactive.
   */
  function setupVisibilityHandler(): void {
    if (visibilityHandler) return // Already registered

    visibilityHandler = () => {
      if (document.visibilityState === 'visible') {
        resumeContext()
      }
    }
    document.addEventListener('visibilitychange', visibilityHandler)
  }

  /**
   * Create square wave with duty cycle using Fourier series
   * See POC docs/poc/play-command-poc.html for reference
   */
  function createSquareWave(duty: number): PeriodicWave | null {
    if (!audioContext.value) return null

    const n = 32 // Number of harmonics
    const real = new Float32Array(n)
    const imag = new Float32Array(n)

    // Fourier series for square wave with duty cycle
    // duty: 0=12.5%, 1=25%, 2=50%, 3=75%
    const dutyCycle = [0.125, 0.25, 0.5, 0.75][duty] ?? 0.5

    // DC offset for duty cycle != 50%
    real[0] = 2 * dutyCycle - 1

    // Fourier series for pulse wave
    for (let i = 1; i < n; i++) {
      const coeff = (2 / (Math.PI * i)) * Math.sin(Math.PI * i * dutyCycle)
      imag[i] = coeff
    }

    return audioContext.value.createPeriodicWave(real, imag, { disableNormalization: false })
  }

  /**
   * Schedule a single note at a specific AudioContext time offset.
   * Uses Web Audio API scheduling which is immune to tab throttling.
   */
  function scheduleNote(note: Note, startTimeSeconds: number): void {
    if (!audioContext.value) {
      initialize()
      if (!audioContext.value) return
    }

    const ctx = audioContext.value
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    // Set frequency
    oscillator.frequency.value = note.frequency

    // Set waveform (square wave with duty cycle)
    const periodicWave = createSquareWave(note.duty)
    if (periodicWave) {
      oscillator.setPeriodicWave(periodicWave)
    }

    // Connect nodes
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    // Calculate volume
    // M0: volumeOrLength is volume (0-15)
    // M1: volumeOrLength is envelope length (0-15), start at max volume
    const volume = note.envelope === 0 ? note.volumeOrLength / 15 : 1.0

    // Apply envelope if M1
    const duration = note.duration / 1000 // ms -> seconds

    if (note.envelope === 1) {
      // M1: Envelope decay mode (NES APU hardware behavior)
      // The period becomes V + 1 quarter frames (240Hz clock)
      // Total decay time = 15 x (V + 1) / 240 seconds
      // Volume values are linear, decaying from 15 to 0
      const envelopeDecayMs = getEnvelopeDecayMs(note.volumeOrLength)
      const decayTime = Math.min(envelopeDecayMs / 1000, duration)

      gainNode.gain.setValueAtTime(volume, startTimeSeconds)
      gainNode.gain.linearRampToValueAtTime(0, startTimeSeconds + decayTime)
    } else {
      // M0: Constant volume
      gainNode.gain.setValueAtTime(volume, startTimeSeconds)
    }

    // Schedule playback using Web Audio time (not setTimeout)
    oscillator.start(startTimeSeconds)
    oscillator.stop(startTimeSeconds + duration)

    // Track for cleanup; auto-remove when finished
    scheduledOscillators.add(oscillator)
    oscillator.onended = () => {
      scheduledOscillators.delete(oscillator)
    }
  }

  /**
   * Play multiple channels simultaneously (polyphonic).
   * Schedules all notes using Web Audio API time offsets
   * instead of setTimeout, so playback works in background tabs.
   */
  function playMusic(channels: Array<Array<Note | Rest>>): void {
    // Initialize audio context on first use
    if (!isInitialized.value) {
      initialize()
    }
    if (!audioContext.value) return

    const ctx = audioContext.value
    const baseTime = ctx.currentTime

    // Schedule all notes across all channels using Web Audio time
    channels.forEach((channelEvents) => {
      let timeOffsetSeconds = 0

      channelEvents.forEach((event) => {
        if ('frequency' in event) {
          // It's a Note - schedule at baseTime + offset
          const note = event
          scheduleNote(note, baseTime + timeOffsetSeconds)
          timeOffsetSeconds += note.duration / 1000
        } else {
          // It's a Rest - just add to time offset
          const rest = event
          timeOffsetSeconds += rest.duration / 1000
        }
      })
    })
  }

  /**
   * Play melody and run onComplete after total duration (ms).
   * Used internally for sequential playback.
   */
  function playMusicWithCallback(
    channels: Array<Array<Note | Rest>>,
    onComplete: () => void
  ): void {
    playMusic(channels)
    const totalMs = getTotalDurationMs(channels)
    const timeoutId = setTimeout(() => {
      pendingTimeouts.delete(timeoutId)
      onComplete()
    }, totalMs)
    pendingTimeouts.add(timeoutId)
  }

  /**
   * Play melodies sequentially (F-BASIC: next PLAY starts after current finishes).
   * If a melody is already playing, the new one is queued.
   */
  function playMusicSequential(channels: Array<Array<Note | Rest>>): void {
    if (isPlaying) {
      playQueue.push(channels)
      return
    }
    isPlaying = true
    playMusicWithCallback(channels, () => {
      isPlaying = false
      const next = playQueue.shift()
      if (next) {
        playMusicSequential(next)
      }
    })
  }

  /**
   * Stop all sounds and clear the play queue
   */
  function stopAll(): void {
    // Clear all pending timeouts
    for (const timeoutId of pendingTimeouts) {
      clearTimeout(timeoutId)
    }
    pendingTimeouts.clear()

    // Stop all scheduled oscillators
    for (const oscillator of scheduledOscillators) {
      try {
        oscillator.stop()
        oscillator.disconnect()
      } catch {
        // Oscillator may have already stopped
      }
    }
    scheduledOscillators.clear()

    playQueue.length = 0
    isPlaying = false
    if (audioContext.value) {
      // Close and recreate context to stop all sounds
      void audioContext.value.close()
      audioContext.value = null
      isInitialized.value = false
    }

    // Remove visibility handler
    if (visibilityHandler) {
      document.removeEventListener('visibilitychange', visibilityHandler)
      visibilityHandler = null
    }
  }

  /**
   * Cleanup function for component unmount
   * Clears all pending timeouts and closes audio context
   */
  function cleanup(): void {
    stopAll()
  }

  return {
    isInitialized,
    initialize,
    playMusic,
    playMusicSequential,
    /** Total playback time (ms) for the given channels. */
    getTotalDurationMs,
    stopAll,
    cleanup,
  }
}
