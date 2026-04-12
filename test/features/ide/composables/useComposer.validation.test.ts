// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'

import { DEFAULT_OCTAVE } from '@/features/ide/components/composerControlsConstants'
import { useComposer } from '@/features/ide/composables/useComposer'

describe('useComposer input validation', () => {
  beforeEach(() => {
    const { reset } = useComposer()
    reset()
  })

  // ---------------------------------------------------------------------------
  // Shared invalid indices
  // ---------------------------------------------------------------------------

  const INVALID_INDICES = [
    [-1, 'negative index'],
    [3, 'index equal to CHANNEL_COUNT (3)'],
    [5, 'index greater than CHANNEL_COUNT (5)'],
    [1.5, 'non-integer float'],
    [NaN, 'NaN'],
  ] as const

  // ---------------------------------------------------------------------------
  // setActiveChannel
  // ---------------------------------------------------------------------------

  describe('setActiveChannel', () => {
    it.each(INVALID_INDICES)('ignores %s', (index) => {
      const { activeChannel, setActiveChannel } = useComposer()

      setActiveChannel(index)

      expect(activeChannel.value).toEqual(0)
    })
  })

  // ---------------------------------------------------------------------------
  // clearChannel
  // ---------------------------------------------------------------------------

  describe('clearChannel', () => {
    it.each(INVALID_INDICES)('ignores %s', (index) => {
      const { toggleNote, clearChannel, channelNoteCount, channelNotes } =
        useComposer()

      toggleNote(5, 3)
      clearChannel(index)

      expect(channelNoteCount(0)).toEqual(1)
      expect(channelNotes.value.length).toEqual(3)
      expect('NaN' in channelNotes.value).toEqual(false)
    })
  })

  // ---------------------------------------------------------------------------
  // setOctave
  // ---------------------------------------------------------------------------

  describe('setOctave', () => {
    it.each(INVALID_INDICES)('ignores invalid channel index %s', (index) => {
      const { setOctave, getChannelOctave } = useComposer()

      setOctave(7, index)

      expect(getChannelOctave(0)).toEqual(DEFAULT_OCTAVE)
      expect(getChannelOctave(1)).toEqual(DEFAULT_OCTAVE)
      expect(getChannelOctave(2)).toEqual(DEFAULT_OCTAVE)
    })
  })

  // ---------------------------------------------------------------------------
  // getChannelOctave
  // ---------------------------------------------------------------------------

  describe('getChannelOctave', () => {
    it.each(INVALID_INDICES)(
      'returns DEFAULT_OCTAVE for invalid channel index %s',
      (index) => {
        const { setOctave, getChannelOctave } = useComposer()

        setOctave(7, 0)

        expect(getChannelOctave(index)).toEqual(DEFAULT_OCTAVE)
      }
    )
  })
})
