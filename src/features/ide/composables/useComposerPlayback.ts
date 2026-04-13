/**
 * useComposerPlayback composable
 *
 * Manages real-time audio preview of the composer's note sequence.
 * Integrates with useWebAudioPlayer for sound output and provides
 * play/pause/stop controls, playback position tracking, and
 * channel mute/solo toggles (Step 4 of 7 for #536).
 *
 * Implemented as a module-level singleton matching the useComposer pattern.
 */

import { computed, ref } from 'vue'

import { CHANNEL_C_DEFAULT_DUTY, CHANNEL_C_DEFAULT_ENVELOPE } from '@/core/sound/constants'
import { calculateNoteFrequency } from '@/core/sound/noteFrequency'
import type { Note, Rest } from '@/core/sound/types'
import type { NoteCellKey } from '@/features/ide/components/pianoRollConstants'
import { NOTE_NAMES } from '@/features/ide/components/pianoRollConstants'
import { parseNoteCellKey } from '@/features/ide/components/pianoRollConstants'
import { useComposer } from '@/features/ide/composables/useComposer'
import { useWebAudioPlayer } from '@/features/ide/composables/useWebAudioPlayer'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Number of sound channels in F-BASIC. */
const CHANNEL_COUNT = 3

/** Default volume for composer playback preview (0-15 scale). */
const COMPOSER_DEFAULT_VOLUME = 10

/** Returns true if the given index is a valid channel index (0 to CHANNEL_COUNT - 1). */
function isValidChannelIndex(index: number): boolean {
  return !Number.isNaN(index) && index >= 0 && index < CHANNEL_COUNT
}

/**
 * Calculate frequency in Hz for a full note name (e.g. "C#4") and standard musical octave.
 * Parses the note name to extract the base letter and sharp flag,
 * converts standard octave to F-BASIC octave, then delegates to the shared utility.
 */
function calculateNoteFrequencyFromName(noteName: string, octave: number): number {
  const baseName = noteName.replace(/[#0-9]/g, '')
  const isSharp = noteName.includes('#')
  // octave is a standard musical octave (3-5); convert to F-BASIC octave (octave - 2)
  // so the formula matches MusicDSLParser's convention (F-BASIC octave 2 = MIDI octave 4)
  const fbOctave = octave - 2
  return calculateNoteFrequency(baseName, fbOctave, isSharp)
}

/**
 * Infer the octave for a note index.
 * NOTE_NAMES is ordered B5(highest) to C3(lowest).
 * Index 0-11 = octave 5, 12-23 = octave 4, 24-35 = octave 3.
 */
function noteIndexToBaseOctave(noteIndex: number): number {
  if (noteIndex < 12) return 5
  if (noteIndex < 24) return 4
  return 3
}

// ---------------------------------------------------------------------------
// Module-level singleton state
// ---------------------------------------------------------------------------

const isPlaying = ref(false)
const isPaused = ref(false)
const currentStep = ref(0)

/** Per-channel mute state. */
const channelMuted = ref<boolean[]>([false, false, false])

/** Per-channel solo state. */
const channelSoloed = ref<boolean[]>([false, false, false])

/** Timer ID for the step-advance interval. */
let stepTimerId: ReturnType<typeof setInterval> | null = null

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Determines if a channel should produce sound.
 * A channel is audible when:
 * - It is not muted, AND
 * - Either no channel is soloed, OR this channel is soloed.
 */
function isChannelAudible(channelIndex: number): boolean {
  if (!isValidChannelIndex(channelIndex)) return false

  const hasSolo = channelSoloed.value.some((s) => s)
  const soloed = channelSoloed.value[channelIndex]
  const muted = channelMuted.value[channelIndex]

  // Solo overrides mute: if this channel is soloed, it's audible regardless
  if (soloed) return true

  // If any channel is soloed but this one isn't, it's silent
  if (hasSolo) return false

  // No solo active: audible unless muted
  return !muted
}

/**
 * Builds the audio events for a single step across all audible channels.
 * For each audible channel, finds notes placed at the current step
 * and converts them to Note objects for useWebAudioPlayer.
 */
function buildStepAudioEvents(
  step: number,
  channelNotes: ReadonlyArray<ReadonlySet<string>>,
  getChannelOctave: (index: number) => number,
  stepDurationMs: number
): Array<Array<Note | Rest>> {
  const channels: Array<Array<Note | Rest>> = []

  for (let ch = 0; ch < CHANNEL_COUNT; ch++) {
    const events: Array<Note | Rest> = []

    if (!isChannelAudible(ch)) {
      // Muted/silent channel: emit a rest for timing
      events.push({ duration: stepDurationMs, channel: ch })
      channels.push(events)
      continue
    }

    const notes = channelNotes[ch] ?? new Set<string>()
    let hasNotes = false

    // Collect all notes at this step on this channel
    const octave = getChannelOctave(ch)
    const notesAtStep: Note[] = []

    for (const key of notes) {
      const { noteIndex, stepIndex } = parseNoteCellKey(key as NoteCellKey)
      if (stepIndex === step) {
        const noteName = NOTE_NAMES[noteIndex]
        if (noteName) {
          const baseOctave = noteIndexToBaseOctave(noteIndex)
          const octaveOffset = octave - 4
          const frequency = calculateNoteFrequencyFromName(
            noteName,
            baseOctave + octaveOffset
          )
          notesAtStep.push({
            frequency,
            duration: stepDurationMs,
            channel: ch,
            duty: CHANNEL_C_DEFAULT_DUTY,
            envelope: CHANNEL_C_DEFAULT_ENVELOPE,
            volumeOrLength: COMPOSER_DEFAULT_VOLUME,
          })
          hasNotes = true
        }
      }
    }

    if (hasNotes) {
      events.push(...notesAtStep)
    } else {
      // No notes at this step: emit a rest
      events.push({ duration: stepDurationMs, channel: ch })
    }

    channels.push(events)
  }

  return channels
}

/**
 * Calculates the step interval in milliseconds from the composer tempo.
 * Each beat has 2 steps (8th notes), so step interval = (60000 / tempo) / 2.
 */
function calculateStepIntervalMs(tempo: number): number {
  return Math.round(60000 / tempo / 2)
}

// ---------------------------------------------------------------------------
// Web Audio Player (singleton)
// ---------------------------------------------------------------------------

const webAudioPlayer = useWebAudioPlayer()

// ---------------------------------------------------------------------------
// Composable
// ---------------------------------------------------------------------------

/**
 * Composable for managing composer playback state and audio preview.
 *
 * Provides play/pause/stop controls, step-sequenced playback,
 * visual cursor position (currentStep), and per-channel mute/solo.
 *
 * Implemented as a module-level singleton since the composer
 * is a single-page feature.
 */
export function useComposerPlayback() {
  // -------------------------------------------------------------------------
  // Computed
  // -------------------------------------------------------------------------

  /**
   * Whether any channel is currently soloed.
   * When true, only soloed channels produce sound.
   */
  const hasSolo = computed(() => channelSoloed.value.some((s) => s))

  // -------------------------------------------------------------------------
  // Internal: Step scheduling
  // -------------------------------------------------------------------------

  /**
   * Starts the step-advance timer.
   * On each tick, plays the current step's notes and advances to the next.
   */
  function startStepTimer(): void {
    stopStepTimer()

    const composer = useComposer()
    const stepIntervalMs = calculateStepIntervalMs(composer.tempo.value)

    // Calculate step duration for note scheduling
    // At 120 BPM with 2 steps per beat, each step = 250ms
    const stepDurationMs = stepIntervalMs

    stepTimerId = setInterval(() => {
      if (isPaused.value) return

      const comp = useComposer()
      const step = currentStep.value
      const totalSteps = comp.steps.value

      // Build and play audio events for this step
      const channels = buildStepAudioEvents(
        step,
        comp.channelNotes.value,
        comp.getChannelOctave,
        stepDurationMs
      )

      webAudioPlayer.playMusic(channels)

      // Advance to next step (loop)
      currentStep.value = (step + 1) % totalSteps
    }, stepIntervalMs)
  }

  /**
   * Stops the step-advance timer.
   */
  function stopStepTimer(): void {
    if (stepTimerId !== null) {
      clearInterval(stepTimerId)
      stepTimerId = null
    }
  }

  // -------------------------------------------------------------------------
  // Public controls
  // -------------------------------------------------------------------------

  /**
   * Start or resume playback from the current step.
   * If paused, resumes. If stopped, starts from step 0.
   */
  function play(): void {
    if (isPaused.value) {
      // Resume from paused state
      isPaused.value = false
      startStepTimer()
      return
    }

    // Fresh start
    currentStep.value = 0
    isPlaying.value = true
    isPaused.value = false

    // Initialize audio context
    webAudioPlayer.initialize()

    startStepTimer()
  }

  /**
   * Pause playback, keeping the current step position.
   */
  function pause(): void {
    if (!isPlaying.value) return

    isPaused.value = true
    stopStepTimer()
  }

  /**
   * Stop playback and reset to step 0.
   */
  function stop(): void {
    stopStepTimer()
    webAudioPlayer.stopAll()

    isPlaying.value = false
    isPaused.value = false
    currentStep.value = 0
  }

  /**
   * Toggle mute state for a channel.
   * Ignored for invalid channel indices.
   */
  function toggleMute(channelIndex: number): void {
    if (!isValidChannelIndex(channelIndex)) return
    const updated = [...channelMuted.value]
    updated[channelIndex] = !updated[channelIndex]
    channelMuted.value = updated
  }

  /**
   * Toggle solo state for a channel.
   * Ignored for invalid channel indices.
   */
  function toggleSolo(channelIndex: number): void {
    if (!isValidChannelIndex(channelIndex)) return
    const updated = [...channelSoloed.value]
    updated[channelIndex] = !updated[channelIndex]
    channelSoloed.value = updated
  }

  /**
   * Query whether a channel is muted.
   */
  function isChannelMuted(channelIndex: number): boolean {
    if (!isValidChannelIndex(channelIndex)) return false
    return channelMuted.value[channelIndex] === true
  }

  /**
   * Query whether a channel is soloed.
   */
  function isChannelSoloed(channelIndex: number): boolean {
    if (!isValidChannelIndex(channelIndex)) return false
    return channelSoloed.value[channelIndex] === true
  }

  /**
   * Reset all playback state to defaults.
   * Used in tests and when clearing the composition.
   */
  function reset(): void {
    stop()
    channelMuted.value = [false, false, false]
    channelSoloed.value = [false, false, false]
  }

  return {
    // Reactive state
    isPlaying,
    isPaused,
    currentStep,

    // Controls
    play,
    pause,
    stop,
    reset,

    // Channel mute/solo
    toggleMute,
    toggleSolo,
    isChannelMuted,
    isChannelSoloed,
    isChannelAudible,
    hasSolo,
  }
}
