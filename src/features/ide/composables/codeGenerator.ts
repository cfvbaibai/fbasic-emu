/**
 * Code generator for the Visual Music Composer.
 *
 * Converts composer state (note data, channel configuration, metadata)
 * into F-BASIC PLAY statement lines.
 *
 * Step 5 of 7 for #536 (Visual Music Composer).
 */

import type { NoteCellKey } from '@/features/ide/components/pianoRollConstants'
import {
  NOTE_NAMES,
  parseNoteCellKey,
} from '@/features/ide/components/pianoRollConstants'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Plain data snapshot of composer state for code generation. */
export interface ComposerState {
  tempo: number
  steps: number
  duration: string
  envelope: string
  title: string
  channelNotes: NoteCellKey[][]
  channelOctaves: number[]
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** Maximum length of a PLAY string before splitting into a variable. */
const MAX_PLAY_STRING_LENGTH = 32

/** Mapping from duration preset to F-BASIC note length value (1-9). */
const DURATION_TO_LENGTH: Record<string, number> = {
  '1/16': 1,
  '1/8': 3,
  '1/4': 5,
  '1/2': 7,
  '1': 9,
}

/** Mapping from envelope preset to F-BASIC envelope string. */
const ENVELOPE_TO_STRING: Record<string, string> = {
  none: 'M0V15',
  short: 'M1V3',
  medium: 'M1V7',
  long: 'M1V15',
}

/** Note names by semitone index (0=C, 1=C#, ... 11=B). */
const NOTE_BY_SEMITONE = [
  'C', '#C', 'D', '#D', 'E', 'F', '#F', 'G', '#G', 'A', '#A', 'B',
] as const

// ---------------------------------------------------------------------------
// Mapping helpers
// ---------------------------------------------------------------------------

/**
 * Maps a tempo BPM value (40-240) to F-BASIC T parameter (1-8).
 *
 * T1 = fastest (240 BPM), T8 = slowest (40 BPM).
 * Linear interpolation across the range.
 */
function mapTempoToT(tempo: number): number {
  const clamped = Math.max(40, Math.min(240, tempo))
  const t = 8 - ((clamped - 40) / 200) * 7
  return Math.round(t)
}

/**
 * Maps a duration preset string to the F-BASIC note length value.
 */
function mapDurationToLength(duration: string): number {
  return DURATION_TO_LENGTH[duration] ?? 5
}

/**
 * Maps an envelope preset string to the F-BASIC envelope string.
 */
function mapEnvelopeToString(envelope: string): string {
  return ENVELOPE_TO_STRING[envelope] ?? 'M0V15'
}

// ---------------------------------------------------------------------------
// Note parsing
// ---------------------------------------------------------------------------

/**
 * Extracts the semitone index (0-11) and octave from a note name.
 *
 * Handles natural notes (C4 -> semitone 0, octave 4) and
 * sharp notes (F#4 -> semitone 6, octave 4).
 */
function parseNoteName(
  noteName: string
): { semitone: number; octave: number } | null {
  if (noteName.length === 0) return null

  const sharpIndex = noteName.indexOf('#')
  const firstChar = noteName[0] ?? ''

  let notePart: string
  let octaveStr: string

  if (sharpIndex !== -1) {
    // Sharp note: "F#4" -> notePart="#F" (F-BASIC format), octaveStr="4"
    notePart = `#${firstChar}`
    octaveStr = noteName.slice(sharpIndex + 1)
  } else {
    // Natural note: "C4" -> notePart="C", octaveStr="4"
    notePart = firstChar
    octaveStr = noteName.slice(1)
  }

  const semitone = NOTE_BY_SEMITONE.indexOf(
    notePart as (typeof NOTE_BY_SEMITONE)[number]
  )
  if (semitone === -1) return null

  const octave = Number.parseInt(octaveStr, 10)
  if (Number.isNaN(octave)) return null

  return { semitone, octave }
}

// ---------------------------------------------------------------------------
// Channel string builder
// ---------------------------------------------------------------------------

/**
 * Builds the PLAY string data for a single channel.
 *
 * Converts note cell keys into a sequential string of F-BASIC note
 * commands. Inserts octave changes when the octave differs from the
 * current octave, and rests for empty steps.
 *
 * Notes are generated from step 0 through the last step that contains
 * a note. Trailing empty steps after the last note are omitted.
 *
 * @param notes - Note cell keys for this channel
 * @param noteLength - F-BASIC note length value (1-9)
 */
function buildChannelString(
  notes: NoteCellKey[],
  noteLength: number
): string {
  if (notes.length === 0) return ''

  // Group notes by step index
  const notesByStep = new Map<number, string[]>()
  let maxStep = 0

  for (const key of notes) {
    const { noteIndex, stepIndex } = parseNoteCellKey(key)
    const noteName = NOTE_NAMES[noteIndex]
    if (!noteName) continue

    if (!notesByStep.has(stepIndex)) {
      notesByStep.set(stepIndex, [])
    }
    notesByStep.get(stepIndex)!.push(noteName)

    if (stepIndex > maxStep) {
      maxStep = stepIndex
    }
  }

  const parts: string[] = []
  let currentOctave = 4 // F-BASIC PLAY default octave

  for (let step = 0; step <= maxStep; step++) {
    const noteNames = notesByStep.get(step)

    if (noteNames === undefined) {
      parts.push(`R${noteLength}`)
      continue
    }

    for (const noteName of noteNames) {
      const parsed = parseNoteName(noteName)
      if (!parsed) continue

      if (parsed.octave !== currentOctave) {
        parts.push(`O${parsed.octave}`)
        currentOctave = parsed.octave
      }

      parts.push(`${NOTE_BY_SEMITONE[parsed.semitone]}${noteLength}`)
    }
  }

  return parts.join('')
}

// ---------------------------------------------------------------------------
// Long string splitting
// ---------------------------------------------------------------------------

/**
 * Wraps a PLAY string into a string variable assignment if it exceeds
 * the maximum length.
 *
 * Short: `10 PLAY "..."`
 * Long:  `10 A$="...":PLAY A$`
 */
function formatPlayLine(
  lineNumber: number,
  playString: string
): string[] {
  if (playString.length <= MAX_PLAY_STRING_LENGTH) {
    return [`${lineNumber} PLAY "${playString}"`]
  }

  const lines: string[] = []
  const varNames: string[] = []
  let varIndex = 0

  for (let offset = 0; offset < playString.length;) {
    const remaining = playString.length - offset
    const chunkSize = Math.min(remaining, MAX_PLAY_STRING_LENGTH)
    const chunk = playString.slice(offset, offset + chunkSize)
    offset += chunkSize

    const varName = String.fromCharCode(65 + varIndex)
    varNames.push(varName)
    lines.push(`${lineNumber} ${varName}$="${chunk}"`)
    lineNumber += 10
    varIndex++
  }

  // Play all chunks concatenated with + to preserve all notes
  lines.push(`${lineNumber} PLAY ${varNames.map((v) => `${v}$`).join('+')}`)

  return lines
}

// ---------------------------------------------------------------------------
// Main generator
// ---------------------------------------------------------------------------

/**
 * Generates F-BASIC code lines from composer state.
 *
 * Produces an array of BASIC program lines (with line numbers)
 * that play back the composed music using PLAY statements.
 *
 * @param state - Composer state snapshot
 * @returns Array of BASIC line strings
 */
export function generatePlayCode(state: ComposerState): string[] {
  const lines: string[] = []
  let lineNumber = 10

  // Title as REM comment
  if (state.title.trim()) {
    lines.push(`${lineNumber} REM ${state.title.trim()}`)
    lineNumber += 10
  }

  // Build per-channel strings
  const channelStrings: string[] = []
  for (let ch = 0; ch < 3; ch++) {
    const chNotes = state.channelNotes[ch] ?? []
    const chString = buildChannelString(
      chNotes,
      mapDurationToLength(state.duration)
    )
    if (chString) {
      channelStrings.push(chString)
    }
  }

  // No notes at all
  if (channelStrings.length === 0) {
    return lines
  }

  // Build the prefix: tempo + envelope
  const tempoStr = `T${mapTempoToT(state.tempo)}`
  const envelopeStr = mapEnvelopeToString(state.envelope)

  // Join channels with colon
  const combinedString = `${tempoStr}${envelopeStr}${channelStrings.join(':')}`

  // Format the PLAY line(s)
  const playLines = formatPlayLine(lineNumber, combinedString)
  lines.push(...playLines)

  return lines
}
