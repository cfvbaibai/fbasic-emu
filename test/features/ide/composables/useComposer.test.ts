// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'

import {
  DEFAULT_DURATION,
  DEFAULT_ENVELOPE,
  DEFAULT_OCTAVE,
  DEFAULT_STEPS,
  DEFAULT_TEMPO,
} from '@/features/ide/components/composerControlsConstants'
import { createNoteCellKey } from '@/features/ide/components/pianoRollConstants'
import { useComposer } from '@/features/ide/composables/useComposer'

describe('useComposer', () => {
  beforeEach(() => {
    // Reset singleton state between tests
    const { reset } = useComposer()
    reset()
  })

  // ---------------------------------------------------------------------------
  // Default state
  // ---------------------------------------------------------------------------

  describe('default state', () => {
    it('returns tempo as DEFAULT_TEMPO (120)', () => {
      const { tempo } = useComposer()

      expect(tempo.value).toEqual(DEFAULT_TEMPO)
    })

    it('returns steps as DEFAULT_STEPS (16)', () => {
      const { steps } = useComposer()

      expect(steps.value).toEqual(DEFAULT_STEPS)
    })

    it('returns duration as DEFAULT_DURATION ("1/4")', () => {
      const { duration } = useComposer()

      expect(duration.value).toEqual(DEFAULT_DURATION)
    })

    it('returns envelope as DEFAULT_ENVELOPE ("none")', () => {
      const { envelope } = useComposer()

      expect(envelope.value).toEqual(DEFAULT_ENVELOPE)
    })

    it('returns title as empty string', () => {
      const { title } = useComposer()

      expect(title.value).toEqual('')
    })

    it('returns activeChannel as 0', () => {
      const { activeChannel } = useComposer()

      expect(activeChannel.value).toEqual(0)
    })

    it('returns empty activeNotes set', () => {
      const { activeNotes } = useComposer()

      expect(activeNotes.value.size).toEqual(0)
    })

    it('returns all channels with empty note sets', () => {
      const { channelNoteCount } = useComposer()

      expect(channelNoteCount(0)).toEqual(0)
      expect(channelNoteCount(1)).toEqual(0)
      expect(channelNoteCount(2)).toEqual(0)
    })

    it('returns per-channel octave as DEFAULT_OCTAVE (4)', () => {
      const { getChannelOctave } = useComposer()

      expect(getChannelOctave(0)).toEqual(DEFAULT_OCTAVE)
      expect(getChannelOctave(1)).toEqual(DEFAULT_OCTAVE)
      expect(getChannelOctave(2)).toEqual(DEFAULT_OCTAVE)
    })
  })

  // ---------------------------------------------------------------------------
  // Active channel switching
  // ---------------------------------------------------------------------------

  describe('setActiveChannel', () => {
    it('switches active channel to 1', () => {
      const { activeChannel, setActiveChannel } = useComposer()

      setActiveChannel(1)

      expect(activeChannel.value).toEqual(1)
    })

    it('switches active channel to 2', () => {
      const { activeChannel, setActiveChannel } = useComposer()

      setActiveChannel(2)

      expect(activeChannel.value).toEqual(2)
    })

    it('updates activeNotes to reflect new channel', () => {
      const { activeNotes, setActiveChannel, toggleNote } = useComposer()

      // Add a note on channel 0
      toggleNote(5, 3)

      // Switch to channel 1
      setActiveChannel(1)

      // activeNotes should now be empty (channel 1 has no notes)
      expect(activeNotes.value.size).toEqual(0)

      // Switch back to channel 0
      setActiveChannel(0)

      // activeNotes should have the note we added
      expect(activeNotes.value.size).toEqual(1)
      expect(activeNotes.value.has(createNoteCellKey(5, 3))).toEqual(true)
    })
  })

  // ---------------------------------------------------------------------------
  // Note toggling
  // ---------------------------------------------------------------------------

  describe('toggleNote', () => {
    it('adds a note to the active channel', () => {
      const { activeNotes, toggleNote } = useComposer()

      toggleNote(5, 3)

      expect(activeNotes.value.has(createNoteCellKey(5, 3))).toEqual(true)
      expect(activeNotes.value.size).toEqual(1)
    })

    it('removes a note when toggled again', () => {
      const { activeNotes, toggleNote } = useComposer()

      toggleNote(5, 3)
      toggleNote(5, 3)

      expect(activeNotes.value.size).toEqual(0)
    })

    it('adds multiple notes to the active channel', () => {
      const { activeNotes, toggleNote } = useComposer()

      toggleNote(5, 3)
      toggleNote(10, 7)
      toggleNote(0, 0)

      expect(activeNotes.value.size).toEqual(3)
    })

    it('does not affect other channels', () => {
      const { toggleNote, channelNoteCount, setActiveChannel } = useComposer()

      // Add notes on channel 0
      toggleNote(5, 3)
      toggleNote(10, 7)

      // Channel 0 has 2 notes, others have 0
      expect(channelNoteCount(0)).toEqual(2)
      expect(channelNoteCount(1)).toEqual(0)
      expect(channelNoteCount(2)).toEqual(0)

      // Switch to channel 1 and add a note
      setActiveChannel(1)
      toggleNote(2, 4)

      // Channel 0 still has 2, channel 1 has 1
      expect(channelNoteCount(0)).toEqual(2)
      expect(channelNoteCount(1)).toEqual(1)
      expect(channelNoteCount(2)).toEqual(0)
    })

    it('allows same note on different channels', () => {
      const { toggleNote, channelNoteCount, setActiveChannel } = useComposer()

      // Add note on channel 0
      toggleNote(5, 3)

      // Add same note on channel 1
      setActiveChannel(1)
      toggleNote(5, 3)

      // Both channels have the note independently
      expect(channelNoteCount(0)).toEqual(1)
      expect(channelNoteCount(1)).toEqual(1)
    })
  })

  // ---------------------------------------------------------------------------
  // Clear channel
  // ---------------------------------------------------------------------------

  describe('clearChannel', () => {
    it('clears notes on the active channel when no argument given', () => {
      const { activeNotes, toggleNote, clearChannel } = useComposer()

      toggleNote(5, 3)
      toggleNote(10, 7)
      expect(activeNotes.value.size).toEqual(2)

      clearChannel()

      expect(activeNotes.value.size).toEqual(0)
    })

    it('clears notes on a specific channel by index', () => {
      const {
        toggleNote,
        clearChannel,
        channelNoteCount,
        setActiveChannel,
      } = useComposer()

      // Add notes on channel 0
      toggleNote(5, 3)
      // Add notes on channel 1
      setActiveChannel(1)
      toggleNote(10, 7)

      expect(channelNoteCount(0)).toEqual(1)
      expect(channelNoteCount(1)).toEqual(1)

      // Clear channel 0 while active channel is 1
      clearChannel(0)

      expect(channelNoteCount(0)).toEqual(0)
      expect(channelNoteCount(1)).toEqual(1)
    })

  })

  // ---------------------------------------------------------------------------
  // Clear all
  // ---------------------------------------------------------------------------

  describe('clearAll', () => {
    it('clears notes on all channels', () => {
      const {
        toggleNote,
        clearAll,
        channelNoteCount,
        setActiveChannel,
      } = useComposer()

      // Add notes on all channels
      toggleNote(5, 3)
      setActiveChannel(1)
      toggleNote(10, 7)
      setActiveChannel(2)
      toggleNote(0, 0)

      expect(channelNoteCount(0)).toEqual(1)
      expect(channelNoteCount(1)).toEqual(1)
      expect(channelNoteCount(2)).toEqual(1)

      clearAll()

      expect(channelNoteCount(0)).toEqual(0)
      expect(channelNoteCount(1)).toEqual(0)
      expect(channelNoteCount(2)).toEqual(0)
    })
  })

  // ---------------------------------------------------------------------------
  // Setters for composition metadata
  // ---------------------------------------------------------------------------

  describe('setTempo', () => {
    it('sets tempo to a new value', () => {
      const { tempo, setTempo } = useComposer()

      setTempo(180)

      expect(tempo.value).toEqual(180)
    })
  })

  describe('setSteps', () => {
    it('sets steps to 32', () => {
      const { steps, setSteps } = useComposer()

      setSteps(32)

      expect(steps.value).toEqual(32)
    })
  })

  describe('setDuration', () => {
    it('sets duration to a new value', () => {
      const { duration, setDuration } = useComposer()

      setDuration('1/8')

      expect(duration.value).toEqual('1/8')
    })
  })

  describe('setEnvelope', () => {
    it('sets envelope to a new value', () => {
      const { envelope, setEnvelope } = useComposer()

      setEnvelope('short')

      expect(envelope.value).toEqual('short')
    })
  })

  describe('setTitle', () => {
    it('sets title to a new value', () => {
      const { title, setTitle } = useComposer()

      setTitle('My Song')

      expect(title.value).toEqual('My Song')
    })
  })

  describe('setOctave', () => {
    it('sets octave for the active channel', () => {
      const { setOctave, getChannelOctave } = useComposer()

      setOctave(5)

      expect(getChannelOctave(0)).toEqual(5)
      // Other channels unchanged
      expect(getChannelOctave(1)).toEqual(DEFAULT_OCTAVE)
    })

    it('sets octave for a specific channel', () => {
      const { setOctave, getChannelOctave } = useComposer()

      setOctave(3, 2)

      expect(getChannelOctave(0)).toEqual(DEFAULT_OCTAVE)
      expect(getChannelOctave(1)).toEqual(DEFAULT_OCTAVE)
      expect(getChannelOctave(2)).toEqual(3)
    })

  })

  // ---------------------------------------------------------------------------
  // Reset
  // ---------------------------------------------------------------------------

  describe('reset', () => {
    it('resets tempo to default', () => {
      const { tempo, setTempo, reset } = useComposer()

      setTempo(200)
      reset()

      expect(tempo.value).toEqual(DEFAULT_TEMPO)
    })

    it('resets steps to default', () => {
      const { steps, setSteps, reset } = useComposer()

      setSteps(32)
      reset()

      expect(steps.value).toEqual(DEFAULT_STEPS)
    })

    it('resets duration to default', () => {
      const { duration, setDuration, reset } = useComposer()

      setDuration('1/2')
      reset()

      expect(duration.value).toEqual(DEFAULT_DURATION)
    })

    it('resets envelope to default', () => {
      const { envelope, setEnvelope, reset } = useComposer()

      setEnvelope('long')
      reset()

      expect(envelope.value).toEqual(DEFAULT_ENVELOPE)
    })

    it('resets title to empty string', () => {
      const { title, setTitle, reset } = useComposer()

      setTitle('My Song')
      reset()

      expect(title.value).toEqual('')
    })

    it('resets active channel to 0', () => {
      const { activeChannel, setActiveChannel, reset } = useComposer()

      setActiveChannel(2)
      reset()

      expect(activeChannel.value).toEqual(0)
    })

    it('clears all notes on all channels', () => {
      const { toggleNote, reset, channelNoteCount, setActiveChannel } =
        useComposer()

      toggleNote(5, 3)
      setActiveChannel(1)
      toggleNote(10, 7)

      reset()

      expect(channelNoteCount(0)).toEqual(0)
      expect(channelNoteCount(1)).toEqual(0)
      expect(channelNoteCount(2)).toEqual(0)
    })

    it('resets per-channel octaves to default', () => {
      const { setOctave, getChannelOctave, reset } = useComposer()

      setOctave(6, 0)
      setOctave(2, 1)
      reset()

      expect(getChannelOctave(0)).toEqual(DEFAULT_OCTAVE)
      expect(getChannelOctave(1)).toEqual(DEFAULT_OCTAVE)
      expect(getChannelOctave(2)).toEqual(DEFAULT_OCTAVE)
    })
  })

  // ---------------------------------------------------------------------------
  // Return type
  // ---------------------------------------------------------------------------

  describe('return type', () => {
    it('returns all expected properties', () => {
      const result = useComposer()

      expect(result).toHaveProperty('tempo')
      expect(result).toHaveProperty('steps')
      expect(result).toHaveProperty('duration')
      expect(result).toHaveProperty('envelope')
      expect(result).toHaveProperty('title')
      expect(result).toHaveProperty('activeChannel')
      expect(result).toHaveProperty('activeNotes')
      expect(result).toHaveProperty('channelNotes')
      expect(typeof result.toggleNote).toEqual('function')
      expect(typeof result.clearChannel).toEqual('function')
      expect(typeof result.clearAll).toEqual('function')
      expect(typeof result.setActiveChannel).toEqual('function')
      expect(typeof result.setTempo).toEqual('function')
      expect(typeof result.setSteps).toEqual('function')
      expect(typeof result.setOctave).toEqual('function')
      expect(typeof result.setDuration).toEqual('function')
      expect(typeof result.setEnvelope).toEqual('function')
      expect(typeof result.setTitle).toEqual('function')
      expect(typeof result.reset).toEqual('function')
      expect(typeof result.channelNoteCount).toEqual('function')
      expect(typeof result.getChannelOctave).toEqual('function')
    })
  })
})
