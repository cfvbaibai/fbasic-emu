// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from 'vitest'

import { DEFAULT_OCTAVE } from '@/features/ide/components/composerControlsConstants'
import { useComposer } from '@/features/ide/composables/useComposer'

describe('useComposer octave', () => {
  beforeEach(() => {
    // Reset singleton state between tests
    const { reset } = useComposer()
    reset()
  })

  // ---------------------------------------------------------------------------
  // setOctave
  // ---------------------------------------------------------------------------

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

    it.each([
      [NaN, 'NaN'],
      [-1, 'negative index'],
      [3, 'index equal to CHANNEL_COUNT (3)'],
      [5, 'index greater than CHANNEL_COUNT (5)'],
    ])('ignores %s for explicit channel index', (index) => {
      const { setOctave, getChannelOctave } = useComposer()

      setOctave(7, index)

      // All valid channels should remain at DEFAULT_OCTAVE
      expect(getChannelOctave(0)).toEqual(DEFAULT_OCTAVE)
      expect(getChannelOctave(1)).toEqual(DEFAULT_OCTAVE)
      expect(getChannelOctave(2)).toEqual(DEFAULT_OCTAVE)
      // The invalid index itself should also return DEFAULT_OCTAVE
      expect(getChannelOctave(index)).toEqual(DEFAULT_OCTAVE)
    })
  })

  // ---------------------------------------------------------------------------
  // getChannelOctave
  // ---------------------------------------------------------------------------

  describe('getChannelOctave', () => {
    it.each([
      [NaN, 'NaN'],
      [-1, 'negative index'],
      [3, 'index equal to CHANNEL_COUNT (3)'],
      [5, 'index greater than CHANNEL_COUNT (5)'],
    ])('returns DEFAULT_OCTAVE for %s', (index) => {
      const { setOctave, getChannelOctave } = useComposer()

      // Set a non-default octave on all valid channels first
      setOctave(7, 0)
      setOctave(7, 1)
      setOctave(7, 2)

      // Invalid indices should return DEFAULT_OCTAVE
      expect(getChannelOctave(index)).toEqual(DEFAULT_OCTAVE)
    })
  })
})
