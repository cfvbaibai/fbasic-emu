/**
 * Web Audio API player for F-BASIC PLAY command
 *
 * Handles 3-channel polyphonic playback with duty cycle, envelope, and volume.
 * Based on POC implementation in docs/poc/play-command-poc.html.
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

/**
 * Web Audio API player for F-BASIC PLAY command
 * Handles 3-channel polyphonic playback with duty cycle, envelope, volume
 */
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
  /** Track pending timeout IDs for cleanup */
  const pendingTimeouts = new Set<ReturnType<typeof setTimeout>>()

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
      }
    }

    // Resume if suspended (autoplay policy)
    if (audioContext.value?.state === 'suspended') {
      void audioContext.value.resume()
    }
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
   * Play a single note
   */
  function playNote(note: Note): void {
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
    const now = ctx.currentTime
    const duration = note.duration / 1000 // ms → seconds

    if (note.envelope === 1) {
      // M1: Envelope decay mode (NES APU hardware behavior)
      // The period becomes V + 1 quarter frames (240Hz clock)
      // Total decay time = 15 × (V + 1) / 240 seconds
      // Volume values are linear, decaying from 15 to 0
      const envelopeDecayMs = getEnvelopeDecayMs(note.volumeOrLength)
      const decayTime = Math.min(envelopeDecayMs / 1000, duration)

      gainNode.gain.setValueAtTime(volume, now)
      gainNode.gain.linearRampToValueAtTime(0, now + decayTime)
    } else {
      // M0: Constant volume
      gainNode.gain.setValueAtTime(volume, now)
    }

    // Schedule playback
    oscillator.start(now)
    oscillator.stop(now + duration)
  }

  /**
   * Play multiple channels simultaneously (polyphonic)
   */
  function playMusic(channels: Array<Array<Note | Rest>>): void {
    // Initialize audio context on first use
    if (!isInitialized.value) {
      initialize()
    }

    // Schedule all notes across all channels
    channels.forEach((channelEvents) => {
      let timeOffset = 0

      channelEvents.forEach((event) => {
        if ('frequency' in event) {
          // It's a Note - schedule playback
          const note = event

          // Schedule note to start at timeOffset (track for cleanup)
          const timeoutId = setTimeout(() => {
            pendingTimeouts.delete(timeoutId)
            playNote(note)
          }, timeOffset)
          pendingTimeouts.add(timeoutId)

          timeOffset += note.duration
        } else {
          // It's a Rest - just add to time offset
          const rest = event
          timeOffset += rest.duration
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

    playQueue.length = 0
    isPlaying = false
    if (audioContext.value) {
      // Close and recreate context to stop all sounds
      void audioContext.value.close()
      audioContext.value = null
      isInitialized.value = false
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
