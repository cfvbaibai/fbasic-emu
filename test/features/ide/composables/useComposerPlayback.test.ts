// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { DEFAULT_TEMPO } from '@/features/ide/components/composerControlsConstants'
import { useComposer } from '@/features/ide/composables/useComposer'
import { useComposerPlayback } from '@/features/ide/composables/useComposerPlayback'

// ---------------------------------------------------------------------------
// Mock useWebAudioPlayer (vi.hoisted ensures availability inside vi.mock)
// ---------------------------------------------------------------------------

const { mockPlayMusic, mockStopAll, mockInitialize } = vi.hoisted(() => ({
  mockPlayMusic: vi.fn(),
  mockStopAll: vi.fn(),
  mockInitialize: vi.fn(),
}))

vi.mock('@/features/ide/composables/useWebAudioPlayer', () => ({
  useWebAudioPlayer: () => ({
    playMusic: mockPlayMusic,
    stopAll: mockStopAll,
    initialize: mockInitialize,
    isInitialized: { value: true },
  }),
}))

describe('useComposerPlayback', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()

    // Reset composer state
    const { reset } = useComposer()
    reset()

    // Reset playback state (including mute/solo)
    const playback = useComposerPlayback()
    playback.reset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  // ---------------------------------------------------------------------------
  // Default state
  // ---------------------------------------------------------------------------

  describe('default state', () => {
    it('returns isPlaying as false', () => {
      const { isPlaying } = useComposerPlayback()

      expect(isPlaying.value).toEqual(false)
    })

    it('returns isPaused as false', () => {
      const { isPaused } = useComposerPlayback()

      expect(isPaused.value).toEqual(false)
    })

    it('returns currentStep as 0', () => {
      const { currentStep } = useComposerPlayback()

      expect(currentStep.value).toEqual(0)
    })

    it('returns all channels as unmuted', () => {
      const { isChannelMuted } = useComposerPlayback()

      expect(isChannelMuted(0)).toEqual(false)
      expect(isChannelMuted(1)).toEqual(false)
      expect(isChannelMuted(2)).toEqual(false)
    })

    it('returns all channels as not soloed', () => {
      const { isChannelSoloed } = useComposerPlayback()

      expect(isChannelSoloed(0)).toEqual(false)
      expect(isChannelSoloed(1)).toEqual(false)
      expect(isChannelSoloed(2)).toEqual(false)
    })
  })

  // ---------------------------------------------------------------------------
  // Return type
  // ---------------------------------------------------------------------------

  describe('return type', () => {
    it('returns all expected properties', () => {
      const result = useComposerPlayback()

      expect(result).toHaveProperty('isPlaying')
      expect(result).toHaveProperty('isPaused')
      expect(result).toHaveProperty('currentStep')
      expect(typeof result.play).toEqual('function')
      expect(typeof result.pause).toEqual('function')
      expect(typeof result.stop).toEqual('function')
      expect(typeof result.reset).toEqual('function')
      expect(typeof result.toggleMute).toEqual('function')
      expect(typeof result.toggleSolo).toEqual('function')
      expect(typeof result.isChannelMuted).toEqual('function')
      expect(typeof result.isChannelSoloed).toEqual('function')
    })
  })

  // ---------------------------------------------------------------------------
  // Play
  // ---------------------------------------------------------------------------

  describe('play', () => {
    it('sets isPlaying to true', () => {
      const { play, isPlaying } = useComposerPlayback()

      play()

      expect(isPlaying.value).toEqual(true)
    })

    it('sets isPaused to false when starting fresh', () => {
      const { play, isPaused } = useComposerPlayback()

      play()

      expect(isPaused.value).toEqual(false)
    })

    it('advances currentStep on each tick at the given tempo', () => {
      const composer = useComposer()
      const { play, currentStep } = useComposerPlayback()

      // At 120 BPM, each step = 500ms (for 1/4 notes, 4 steps per beat)
      // stepIntervalMs = (60000 / tempo) / 2 = 250ms for 8th note steps
      composer.setTempo(DEFAULT_TEMPO)

      play()
      expect(currentStep.value).toEqual(0)

      // Advance one step
      vi.advanceTimersByTime(250)
      expect(currentStep.value).toEqual(1)

      // Advance another step
      vi.advanceTimersByTime(250)
      expect(currentStep.value).toEqual(2)
    })

    it('loops back to step 0 after reaching the last step', () => {
      const composer = useComposer()
      const { play, currentStep } = useComposerPlayback()

      composer.setTempo(DEFAULT_TEMPO)
      // Default 16 steps
      play()

      // Advance to step 15 (last step)
      for (let i = 0; i < 15; i++) {
        vi.advanceTimersByTime(250)
      }
      expect(currentStep.value).toEqual(15)

      // Next tick should loop back to 0
      vi.advanceTimersByTime(250)
      expect(currentStep.value).toEqual(0)
    })

    it('calls playMusic on useWebAudioPlayer with note data', () => {
      const composer = useComposer()
      const { play } = useComposerPlayback()

      // Add a note: noteIndex 0 (B5) at step 0 on channel 0
      composer.toggleNote(0, 0)
      // Set octave for channel 0
      composer.setOctave(5, 0)

      play()

      // Advance timer to trigger the first interval tick
      vi.advanceTimersByTime(250)

      expect(mockPlayMusic).toHaveBeenCalled()
    })
  })

  // ---------------------------------------------------------------------------
  // Pause
  // ---------------------------------------------------------------------------

  describe('pause', () => {
    it('sets isPaused to true when playing', () => {
      const { play, pause, isPaused } = useComposerPlayback()

      play()
      pause()

      expect(isPaused.value).toEqual(true)
    })

    it('keeps isPlaying as true when paused', () => {
      const { play, pause, isPlaying } = useComposerPlayback()

      play()
      pause()

      expect(isPlaying.value).toEqual(true)
    })

    it('stops advancing currentStep when paused', () => {
      const composer = useComposer()
      const { play, pause, currentStep } = useComposerPlayback()

      composer.setTempo(DEFAULT_TEMPO)

      play()
      vi.advanceTimersByTime(250)
      expect(currentStep.value).toEqual(1)

      pause()

      // Advance timer - step should NOT change
      vi.advanceTimersByTime(250)
      expect(currentStep.value).toEqual(1)
    })
  })

  // ---------------------------------------------------------------------------
  // Stop
  // ---------------------------------------------------------------------------

  describe('stop', () => {
    it('sets isPlaying to false', () => {
      const { play, stop, isPlaying } = useComposerPlayback()

      play()
      stop()

      expect(isPlaying.value).toEqual(false)
    })

    it('sets isPaused to false', () => {
      const { play, pause, stop, isPaused } = useComposerPlayback()

      play()
      pause()
      stop()

      expect(isPaused.value).toEqual(false)
    })

    it('resets currentStep to 0', () => {
      const composer = useComposer()
      const { play, stop, currentStep } = useComposerPlayback()

      composer.setTempo(DEFAULT_TEMPO)
      play()
      vi.advanceTimersByTime(250)
      expect(currentStep.value).toEqual(1)

      stop()

      expect(currentStep.value).toEqual(0)
    })

    it('calls stopAll on useWebAudioPlayer', () => {
      const { play, stop } = useComposerPlayback()

      play()
      stop()

      expect(mockStopAll).toHaveBeenCalled()
    })
  })

  // ---------------------------------------------------------------------------
  // Resume after pause
  // ---------------------------------------------------------------------------

  describe('resume after pause', () => {
    it('resumes playback from the paused step', () => {
      const composer = useComposer()
      const { play, pause, currentStep } = useComposerPlayback()

      composer.setTempo(DEFAULT_TEMPO)

      play()
      vi.advanceTimersByTime(250)
      expect(currentStep.value).toEqual(1)

      pause()
      // Play again to resume
      play()

      vi.advanceTimersByTime(250)
      expect(currentStep.value).toEqual(2)
    })
  })

  // ---------------------------------------------------------------------------
  // Mute
  // ---------------------------------------------------------------------------

  describe('toggleMute', () => {
    it('mutes a channel', () => {
      const { toggleMute, isChannelMuted } = useComposerPlayback()

      toggleMute(0)

      expect(isChannelMuted(0)).toEqual(true)
    })

    it('unmutes a channel when toggled again', () => {
      const { toggleMute, isChannelMuted } = useComposerPlayback()

      toggleMute(0)
      toggleMute(0)

      expect(isChannelMuted(0)).toEqual(false)
    })

    it('does not affect other channels', () => {
      const { toggleMute, isChannelMuted } = useComposerPlayback()

      toggleMute(0)

      expect(isChannelMuted(1)).toEqual(false)
      expect(isChannelMuted(2)).toEqual(false)
    })

    it('ignores invalid channel indices', () => {
      const { toggleMute, isChannelMuted } = useComposerPlayback()

      toggleMute(-1)
      toggleMute(3)
      toggleMute(NaN)

      expect(isChannelMuted(0)).toEqual(false)
      expect(isChannelMuted(1)).toEqual(false)
      expect(isChannelMuted(2)).toEqual(false)
    })
  })

  // ---------------------------------------------------------------------------
  // Solo
  // ---------------------------------------------------------------------------

  describe('toggleSolo', () => {
    it('solos a channel', () => {
      const { toggleSolo, isChannelSoloed } = useComposerPlayback()

      toggleSolo(0)

      expect(isChannelSoloed(0)).toEqual(true)
    })

    it('unsolos a channel when toggled again', () => {
      const { toggleSolo, isChannelSoloed } = useComposerPlayback()

      toggleSolo(0)
      toggleSolo(0)

      expect(isChannelSoloed(0)).toEqual(false)
    })

    it('does not affect other channels', () => {
      const { toggleSolo, isChannelSoloed } = useComposerPlayback()

      toggleSolo(0)

      expect(isChannelSoloed(1)).toEqual(false)
      expect(isChannelSoloed(2)).toEqual(false)
    })

    it('ignores invalid channel indices', () => {
      const { toggleSolo, isChannelSoloed } = useComposerPlayback()

      toggleSolo(-1)
      toggleSolo(3)
      toggleSolo(NaN)

      expect(isChannelSoloed(0)).toEqual(false)
      expect(isChannelSoloed(1)).toEqual(false)
      expect(isChannelSoloed(2)).toEqual(false)
    })
  })

  // ---------------------------------------------------------------------------
  // Mute/Solo interaction
  // ---------------------------------------------------------------------------

  describe('mute and solo interaction', () => {
    it('a muted channel is still audible when soloed', () => {
      const { toggleMute, toggleSolo, isChannelMuted, isChannelSoloed } =
        useComposerPlayback()

      toggleMute(0)
      toggleSolo(0)

      // Mute state is independent of solo
      expect(isChannelMuted(0)).toEqual(true)
      expect(isChannelSoloed(0)).toEqual(true)
    })
  })

  // ---------------------------------------------------------------------------
  // isChannelAudible
  // ---------------------------------------------------------------------------

  describe('isChannelAudible', () => {
    it('returns true when channel is not muted and no solo is active', () => {
      const { isChannelAudible } = useComposerPlayback()

      expect(isChannelAudible(0)).toEqual(true)
    })

    it('returns false when channel is muted and no solo is active', () => {
      const { toggleMute, isChannelAudible } = useComposerPlayback()

      toggleMute(0)

      expect(isChannelAudible(0)).toEqual(false)
    })

    it('returns true for soloed channel even when muted', () => {
      const { toggleMute, toggleSolo, isChannelAudible } = useComposerPlayback()

      toggleMute(0)
      toggleSolo(0)

      expect(isChannelAudible(0)).toEqual(true)
    })

    it('returns false for non-soloed channel when any solo is active', () => {
      const { toggleSolo, isChannelAudible } = useComposerPlayback()

      toggleSolo(0)

      expect(isChannelAudible(1)).toEqual(false)
      expect(isChannelAudible(2)).toEqual(false)
    })

    it('returns true for multiple soloed channels', () => {
      const { toggleSolo, isChannelAudible } = useComposerPlayback()

      toggleSolo(0)
      toggleSolo(2)

      expect(isChannelAudible(0)).toEqual(true)
      expect(isChannelAudible(1)).toEqual(false)
      expect(isChannelAudible(2)).toEqual(true)
    })
  })
})
