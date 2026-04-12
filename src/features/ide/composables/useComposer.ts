/**
 * useComposer composable
 *
 * Manages note data, channel state, and composition metadata
 * for the visual music composer (Step 3 of 7 for #536).
 *
 * Provides a reactive state layer connecting PianoRoll.vue and
 * ComposerControls.vue, supporting 3 independent channels.
 */

import { computed, ref } from 'vue'

import {
  DEFAULT_DURATION,
  DEFAULT_ENVELOPE,
  DEFAULT_OCTAVE,
  DEFAULT_STEPS,
  DEFAULT_TEMPO,
} from '@/features/ide/components/composerControlsConstants'
import type { NoteCellKey } from '@/features/ide/components/pianoRollConstants'
import { createNoteCellKey } from '@/features/ide/components/pianoRollConstants'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Number of sound channels in F-BASIC. */
const CHANNEL_COUNT = 3

// ---------------------------------------------------------------------------
// Module-level singleton state
// ---------------------------------------------------------------------------

const tempo = ref(DEFAULT_TEMPO)
const steps = ref<number>(DEFAULT_STEPS)
const duration = ref(DEFAULT_DURATION)
const envelope = ref(DEFAULT_ENVELOPE)
const title = ref('')
const activeChannel = ref(0)

/** Per-channel note sets. Index 0-2 maps to F-BASIC channels. */
const channelNotes = ref<Set<NoteCellKey>[]>([
  new Set(),
  new Set(),
  new Set(),
])

/** Per-channel octave values. */
const channelOctaves = ref<number[]>([
  DEFAULT_OCTAVE,
  DEFAULT_OCTAVE,
  DEFAULT_OCTAVE,
])

// ---------------------------------------------------------------------------
// Composable
// ---------------------------------------------------------------------------

/**
 * Composable for managing the visual music composer state.
 *
 * Provides reactive state for 3-channel note data, composition
 * metadata (tempo, steps, duration, envelope), and operations
 * for toggling notes, switching channels, and resetting.
 *
 * Implemented as a module-level singleton since the composer
 * is a single-page feature.
 */
export function useComposer() {
  // -------------------------------------------------------------------------
  // Computed
  // -------------------------------------------------------------------------

  /** Notes for the currently active channel. */
  const activeNotes = computed(
    () => channelNotes.value[activeChannel.value] ?? new Set<NoteCellKey>()
  )

  // -------------------------------------------------------------------------
  // Operations
  // -------------------------------------------------------------------------

  /**
   * Toggles a note on the active channel.
   * Adds the note if absent, removes it if present.
   */
  function toggleNote(noteIndex: number, stepIndex: number): void {
    const key = createNoteCellKey(noteIndex, stepIndex)
    const channel = new Set(channelNotes.value[activeChannel.value])

    if (channel.has(key)) {
      channel.delete(key)
    } else {
      channel.add(key)
    }

    channelNotes.value[activeChannel.value] = channel
  }

  /**
   * Clears all notes on a specific channel.
   * Defaults to the active channel if no index is provided.
   */
  function clearChannel(channelIndex?: number): void {
    const index = channelIndex ?? activeChannel.value
    if (Number.isNaN(index) || index < 0 || index >= CHANNEL_COUNT) return
    channelNotes.value[index] = new Set()
  }

  /** Clears all notes on every channel. */
  function clearAll(): void {
    for (let i = 0; i < CHANNEL_COUNT; i++) {
      channelNotes.value[i] = new Set()
    }
  }

  /**
   * Switches the active channel.
   * Ignores out-of-range indices (must be 0 to CHANNEL_COUNT - 1).
   */
  function setActiveChannel(index: number): void {
    if (Number.isNaN(index) || index < 0 || index >= CHANNEL_COUNT) return
    activeChannel.value = index
  }

  /** Sets the composition tempo (BPM). */
  function setTempo(value: number): void {
    tempo.value = value
  }

  /** Sets the number of steps in the sequence (16 or 32). */
  function setSteps(value: number): void {
    steps.value = value
  }

  /**
   * Sets the octave for a channel.
   * Defaults to the active channel if no index is provided.
   */
  function setOctave(value: number, channelIndex?: number): void {
    const index = channelIndex ?? activeChannel.value
    if (Number.isNaN(index) || index < 0 || index >= CHANNEL_COUNT) return
    channelOctaves.value[index] = value
  }

  /** Gets the octave for a specific channel. */
  function getChannelOctave(channelIndex: number): number {
    if (Number.isNaN(channelIndex) || channelIndex < 0 || channelIndex >= CHANNEL_COUNT)
      return DEFAULT_OCTAVE
    return channelOctaves.value[channelIndex] ?? DEFAULT_OCTAVE
  }

  /** Sets the note duration preset. */
  function setDuration(value: string): void {
    duration.value = value
  }

  /** Sets the envelope preset. */
  function setEnvelope(value: string): void {
    envelope.value = value
  }

  /** Sets the composition title. */
  function setTitle(value: string): void {
    title.value = value
  }

  /** Returns the number of active notes on a specific channel. */
  function channelNoteCount(channelIndex: number): number {
    return channelNotes.value[channelIndex]?.size ?? 0
  }

  /** Resets all state to defaults. */
  function reset(): void {
    tempo.value = DEFAULT_TEMPO
    steps.value = DEFAULT_STEPS
    duration.value = DEFAULT_DURATION
    envelope.value = DEFAULT_ENVELOPE
    title.value = ''
    activeChannel.value = 0

    for (let i = 0; i < CHANNEL_COUNT; i++) {
      channelNotes.value[i] = new Set()
      channelOctaves.value[i] = DEFAULT_OCTAVE
    }
  }

  return {
    // Reactive state
    tempo,
    steps,
    duration,
    envelope,
    title,
    activeChannel,
    activeNotes,
    channelNotes,

    // Operations
    toggleNote,
    clearChannel,
    clearAll,
    setActiveChannel,
    setTempo,
    setSteps,
    setOctave,
    getChannelOctave,
    setDuration,
    setEnvelope,
    setTitle,
    reset,

    // Query
    channelNoteCount,
  }
}
