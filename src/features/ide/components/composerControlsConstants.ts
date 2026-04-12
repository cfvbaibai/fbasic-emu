/**
 * Constants and types for the ComposerControls component.
 *
 * Extracted for clarity and testability, and so future steps
 * (state management, playback) can import them without pulling
 * in the component.
 */

/** Default tempo in BPM. */
export const DEFAULT_TEMPO = 120

/** Minimum tempo (BPM). */
export const MIN_TEMPO = 40

/** Maximum tempo (BPM). */
export const MAX_TEMPO = 240

/** Default number of sequence steps. */
export const DEFAULT_STEPS = 16 as const

/** All valid step counts. */
export const STEPS_OPTIONS = [16, 32] as const

/** Default base octave. */
export const DEFAULT_OCTAVE = 4

/** All valid octave values. */
export const OCTAVE_OPTIONS = [2, 3, 4, 5, 6] as const

/** Default note duration. */
export const DEFAULT_DURATION = '1/4'

/** All valid note duration values. */
export const DURATION_OPTIONS = ['1/16', '1/8', '1/4', '1/2', '1'] as const

/** Default envelope preset. */
export const DEFAULT_ENVELOPE = 'none'

/** All valid envelope preset values. */
export const ENVELOPE_OPTIONS = ['none', 'short', 'medium', 'long'] as const
