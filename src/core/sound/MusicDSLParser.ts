/**
 * Music DSL Parser
 *
 * Two-stage parsing for F-BASIC PLAY command:
 *   Stage 1: parseMusicToAst() → MusicScore (symbolic notation)
 *   Stage 2: compileToAudio() → CompiledAudio (audio-ready events)
 *
 * Frequency Calculation:
 * - Uses equal temperament tuning with A4 = 440Hz standard
 * - Formula: f = 440 * 2^((n-57)/12) where n is MIDI note number
 */

import {
  CHANNEL_C_DEFAULT_DUTY,
  CHANNEL_C_DEFAULT_ENVELOPE,
  CHANNEL_C_INDEX,
} from './constants'
import { validateMusicString } from './musicValidation'
import type { SoundStateManager } from './SoundStateManager'
import type {
  CompiledAudio,
  MusicEvent,
  MusicScore,
  Note,
  ParsedDutyEvent,
  ParsedEnvelopeEvent,
  ParsedNoteEvent,
  ParsedOctaveEvent,
  ParsedRestEvent,
  ParsedTempoEvent,
  ParsedVolumeEvent,
  Rest,
  SoundEvent,
} from './types'

export { validateMusicString }

/**
 * Note names to semitone offset mapping (C = 0)
 */
const NOTE_SEMITONES: Record<string, number> = {
  C: 0,
  D: 2,
  E: 4,
  F: 5,
  G: 7,
  A: 9,
  B: 11,
}

/**
 * Tempo to milliseconds per whole note mapping
 * T1 (fastest) to T8 (slowest) - per F-BASIC manual
 */
const TEMPO_MS_PER_WHOLE_NOTE: Record<number, number> = {
  1: 1100,
  2: 1375,
  3: 1650,
  4: 2200, // Default
  5: 2750,
  6: 3300,
  7: 3850,
  8: 4400,
}

/**
 * F-BASIC length codes 0-9 to fraction of whole note (manual page 81)
 */
const LENGTH_CODE_TO_FRACTION: Record<number, number> = {
  0: 1 / 32,
  1: 1 / 16,
  2: 3 / 32, // dotted 16th
  3: 1 / 8,
  4: 3 / 16, // dotted 8th
  5: 1 / 4, // quarter (default)
  6: 3 / 8, // dotted quarter
  7: 1 / 2, // half
  8: 3 / 4, // dotted half
  9: 1, // whole
}

/** Default length code when none specified (5 = quarter note) */
const DEFAULT_LENGTH_CODE = 5

// ============================================================================
// STAGE 1: Parse string to MusicScore (symbolic notation)
// ============================================================================

/**
 * Parse a single channel's music string into MusicEvent array
 */
function parseChannelToAst(channelString: string): MusicEvent[] {
  const events: MusicEvent[] = []
  const input = channelString.toUpperCase().replace(/\s+/g, '')
  let i = 0

  while (i < input.length) {
    const char = input[i]

    // Tempo: T1-T8
    if (char === 'T') {
      i++
      const match = input.slice(i).match(/^(\d+)/)
      if (match?.[1]) {
        events.push({ type: 'tempo', value: parseInt(match[1], 10) } as ParsedTempoEvent)
        i += match[1].length
      }
      continue
    }

    // Duty cycle: Y0-Y3
    if (char === 'Y') {
      i++
      const match = input.slice(i).match(/^(\d+)/)
      if (match?.[1]) {
        events.push({ type: 'duty', value: parseInt(match[1], 10) } as ParsedDutyEvent)
        i += match[1].length
      }
      continue
    }

    // Envelope: M0-M1
    if (char === 'M') {
      i++
      const match = input.slice(i).match(/^(\d+)/)
      if (match?.[1]) {
        events.push({ type: 'envelope', value: parseInt(match[1], 10) } as ParsedEnvelopeEvent)
        i += match[1].length
      }
      continue
    }

    // Volume: V0-V15
    if (char === 'V') {
      i++
      const match = input.slice(i).match(/^(\d+)/)
      if (match?.[1]) {
        events.push({ type: 'volume', value: parseInt(match[1], 10) } as ParsedVolumeEvent)
        i += match[1].length
      }
      continue
    }

    // Octave: O0-O5
    if (char === 'O') {
      i++
      const match = input.slice(i).match(/^(\d+)/)
      if (match?.[1]) {
        events.push({ type: 'octave', value: parseInt(match[1], 10) } as ParsedOctaveEvent)
        i += match[1].length
      }
      continue
    }

    // Sharp: #C, #D, #E, #F, #G, #A, #B
    if (char === '#') {
      i++
      const nextChar = input[i]
      if (nextChar && 'CDEFGAB'.includes(nextChar)) {
        const noteName = nextChar as 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B'
        i++

        const digitMatch = input.slice(i).match(/^(\d)/)
        const event: ParsedNoteEvent = {
          type: 'note',
          note: noteName,
          sharp: true,
        }
        if (digitMatch) {
          event.length = parseInt(digitMatch[1]!, 10)
          i += 1
        }
        events.push(event)
      }
      continue
    }

    // Rest: R with optional length
    if (char === 'R') {
      i++
      const event: ParsedRestEvent = { type: 'rest' }
      const digitMatch = input.slice(i).match(/^(\d)/)
      if (digitMatch) {
        event.length = parseInt(digitMatch[1]!, 10)
        i += 1
      }
      events.push(event)
      continue
    }

    // Natural notes: C, D, E, F, G, A, B
    if (char && 'CDEFGAB'.includes(char)) {
      const noteName = char as 'C' | 'D' | 'E' | 'F' | 'G' | 'A' | 'B'
      i++

      const event: ParsedNoteEvent = {
        type: 'note',
        note: noteName,
        sharp: false,
      }
      const digitMatch = input.slice(i).match(/^(\d)/)
      if (digitMatch) {
        event.length = parseInt(digitMatch[1]!, 10)
        i += 1
      }
      events.push(event)
      continue
    }

    // Unknown character - skip (should not happen if validated)
    i++
  }

  return events
}

/**
 * Parse music string into MusicScore (Stage 1)
 *
 * @param musicString - Music DSL string
 * @returns Parsed music score with symbolic events
 */
export function parseMusicToAst(musicString: string): MusicScore {
  // Validate first
  validateMusicString(musicString)

  // Split by channel separator ":"
  const channelStrings = musicString.split(':')

  // Limit to 3 channels
  const channels = channelStrings.slice(0, 3).map((channelString) => {
    return parseChannelToAst(channelString)
  })

  return { channels }
}

// ============================================================================
// STAGE 2: Compile MusicScore to CompiledAudio (audio-ready)
// ============================================================================

/**
 * Calculate frequency in Hz for a given note and octave
 * Uses equal temperament tuning with A4 = 440Hz
 */
function calculateNoteFrequency(noteName: string, octave: number, sharp: boolean): number {
  const baseSemitone = NOTE_SEMITONES[noteName]
  if (baseSemitone === undefined) {
    throw new Error(`Invalid note name: ${noteName}`)
  }

  const semitone = baseSemitone + (sharp ? 1 : 0)
  const midiNote = (octave + 2) * 12 + semitone + 12
  const frequency = 440 * Math.pow(2, (midiNote - 69) / 12)

  return frequency
}

/**
 * Duration in ms for F-BASIC length code 0-9
 */
function lengthCodeToDuration(code: number, tempo: number): number {
  const clamped = Math.max(0, Math.min(9, code))
  const fraction =
    LENGTH_CODE_TO_FRACTION[clamped] ?? LENGTH_CODE_TO_FRACTION[DEFAULT_LENGTH_CODE] ?? 1 / 4
  const wholeNoteDuration = TEMPO_MS_PER_WHOLE_NOTE[tempo] ?? TEMPO_MS_PER_WHOLE_NOTE[4]!
  return wholeNoteDuration * fraction
}

/**
 * Compile a single channel's MusicEvent array to SoundEvent array
 *
 * Note: Per F-BASIC manual page 81, Channel C (index 2) ignores envelope (M)
 * and duty (Y) commands - it uses fixed M0 (volume mode) and Y2 (50% duty).
 */
function compileChannelToAudio(
  events: MusicEvent[],
  stateManager: SoundStateManager,
  channelNumber: number
): SoundEvent[] {
  const soundEvents: SoundEvent[] = []
  // Get lastLength from state manager (persists across PLAY calls)
  let lastLengthCode = stateManager.getLastLength()

  // Channel C (index 2) ignores M/Y commands per F-BASIC spec
  const isChannelC = channelNumber === CHANNEL_C_INDEX

  for (const event of events) {
    switch (event.type) {
      case 'tempo':
        stateManager.setTempo(event.value)
        break

      case 'duty':
        // Channel C ignores duty changes - uses fixed 50% duty
        if (!isChannelC) {
          stateManager.setDuty(event.value)
        }
        break

      case 'envelope':
        // Channel C ignores envelope changes - uses fixed M0 (volume mode)
        if (!isChannelC) {
          stateManager.setEnvelope(event.value)
        }
        break

      case 'volume':
        stateManager.setVolumeOrLength(event.value)
        break

      case 'octave':
        stateManager.setOctave(event.value)
        break

      case 'note': {
        const lengthCode = event.length ?? lastLengthCode
        // Update lastLength in state manager for cross-PLAY persistence
        lastLengthCode = lengthCode
        stateManager.setLastLength(lengthCode)

        const state = stateManager.getState()
        const frequency = calculateNoteFrequency(event.note, state.octave, event.sharp)
        const duration = lengthCodeToDuration(lengthCode, state.tempo)

        // Channel C uses fixed envelope and duty values
        const noteDuty = isChannelC ? CHANNEL_C_DEFAULT_DUTY : state.duty
        const noteEnvelope = isChannelC ? CHANNEL_C_DEFAULT_ENVELOPE : state.envelope

        soundEvents.push({
          frequency,
          duration,
          channel: channelNumber,
          duty: noteDuty,
          envelope: noteEnvelope,
          volumeOrLength: state.volumeOrLength,
        } as Note)
        break
      }

      case 'rest': {
        const lengthCode = event.length ?? lastLengthCode
        // Update lastLength in state manager for cross-PLAY persistence
        lastLengthCode = lengthCode
        stateManager.setLastLength(lengthCode)

        const state = stateManager.getState()
        const duration = lengthCodeToDuration(lengthCode, state.tempo)

        soundEvents.push({
          duration,
          channel: channelNumber,
        } as Rest)
        break
      }
    }
  }

  return soundEvents
}

/**
 * Compile MusicScore to CompiledAudio (Stage 2)
 *
 * @param score - Parsed music score
 * @param stateManagers - Array of sound state managers (one per channel) for state persistence
 * @returns Compiled audio ready for playback
 */
export function compileToAudio(
  score: MusicScore,
  stateManagers: SoundStateManager[]
): CompiledAudio {
  const channels = score.channels.map((channelEvents, index) => {
    const stateManager = stateManagers[index]!
    return compileChannelToAudio(channelEvents, stateManager, index)
  })

  return { channels }
}

// ============================================================================
// CONVENIENCE: Combined parse + compile
// ============================================================================

/**
 * Parse music string and compile to audio in one step
 * Convenience function for backward compatibility
 *
 * @param musicString - Music DSL string
 * @param stateManagers - Array of sound state managers (one per channel)
 * @returns Compiled audio ready for playback
 */
export function parseMusic(
  musicString: string,
  stateManagers: SoundStateManager[]
): CompiledAudio {
  const score = parseMusicToAst(musicString)
  return compileToAudio(score, stateManagers)
}
