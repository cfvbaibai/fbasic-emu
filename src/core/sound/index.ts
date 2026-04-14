/**
 * Sound System Module
 *
 * Exports for the PLAY command sound system.
 */

export {
  CHANNEL_C_DEFAULT_DUTY,
  CHANNEL_C_DEFAULT_ENVELOPE,
  CHANNEL_C_INDEX,
  COMPOSER_DEFAULT_VOLUME,
  ENVELOPE_DECAY_BASE,
} from './constants'
export {
  compileToAudio,
  parseMusic,
  parseMusicToAst,
  validateMusicString,
} from './MusicDSLParser'
export { SoundStateManager } from './SoundStateManager'
export type {
  CompiledAudio,
  MusicEvent,
  MusicScore,
  Note,
  NoteName,
  ParsedDutyEvent,
  ParsedEnvelopeEvent,
  ParsedNoteEvent,
  ParsedOctaveEvent,
  ParsedRestEvent,
  ParsedTempoEvent,
  ParsedVolumeEvent,
  Rest,
  SoundEvent,
  SoundState,
} from './types'
export { isNote, isRest } from './types'
