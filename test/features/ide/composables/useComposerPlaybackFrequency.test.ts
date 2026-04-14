// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { useComposer } from '@/features/ide/composables/useComposer'
import { useComposerPlayback } from '@/features/ide/composables/useComposerPlayback'

// ---------------------------------------------------------------------------
// Mock useWebAudioPlayer (vi.hoisted ensures availability inside vi.mock)
// ---------------------------------------------------------------------------

const { mockPlayMusic } = vi.hoisted(() => ({
  mockPlayMusic: vi.fn(),
}))

vi.mock('@/features/ide/composables/useWebAudioPlayer', () => ({
  useWebAudioPlayer: () => ({
    playMusic: mockPlayMusic,
    stopAll: vi.fn(),
    initialize: vi.fn(),
    isInitialized: { value: true },
  }),
}))

describe('useComposerPlayback - frequency calculation', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.clearAllMocks()

    // Reset composer state
    const { reset } = useComposer()
    reset()

    // Reset playback state
    const playback = useComposerPlayback()
    playback.reset()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('produces correct frequency for C4 (middle C) at default octave', () => {
    const composer = useComposer()
    const { play } = useComposerPlayback()

    // noteIndex 23 = C4, channel 0, step 0
    // Default octave = 4, so octaveOffset = 0, effective octave = 4
    composer.toggleNote(23, 0)

    play()
    vi.advanceTimersByTime(250)

    expect(mockPlayMusic).toHaveBeenCalledTimes(1)
    const channels = mockPlayMusic.mock.calls[0]![0] as Array<Array<{ frequency: number }>>
    const note = channels[0]!.find((e) => 'frequency' in e && typeof e.frequency === 'number')
    expect(note).toBeDefined()
    expect(note!.frequency).toBeCloseTo(261.63, 1) // C4 = 261.63 Hz
  })

  it('produces correct frequency for A4 (440 Hz) at default octave', () => {
    const composer = useComposer()
    const { play } = useComposerPlayback()

    // A4: ascending index 21, reversed (NOTE_NAMES) index = 35 - 21 = 14
    composer.toggleNote(14, 0)

    play()
    vi.advanceTimersByTime(250)

    expect(mockPlayMusic).toHaveBeenCalledTimes(1)
    const channels = mockPlayMusic.mock.calls[0]![0] as Array<Array<{ frequency: number }>>
    const note = channels[0]!.find((e) => 'frequency' in e && typeof e.frequency === 'number')
    expect(note).toBeDefined()
    expect(note!.frequency).toBeCloseTo(440.0, 1) // A4 = 440 Hz
  })

  it('produces correct frequency for C#4 (sharp note)', () => {
    const composer = useComposer()
    const { play } = useComposerPlayback()

    // C#4: ascending index 13, reversed (NOTE_NAMES) index = 35 - 13 = 22
    composer.toggleNote(22, 0)

    play()
    vi.advanceTimersByTime(250)

    expect(mockPlayMusic).toHaveBeenCalledTimes(1)
    const channels = mockPlayMusic.mock.calls[0]![0] as Array<Array<{ frequency: number }>>
    const note = channels[0]!.find((e) => 'frequency' in e && typeof e.frequency === 'number')
    expect(note).toBeDefined()
    // C#4 = 277.18 Hz
    expect(note!.frequency).toBeCloseTo(277.18, 1)
  })

  it('shifts frequency up one octave when composer octave is 5', () => {
    const composer = useComposer()
    const { play } = useComposerPlayback()

    // C4 at composer octave 5 → effective octave 5 → C5 = 523.25 Hz
    // C4: reversed index = 23
    composer.toggleNote(23, 0)
    composer.setOctave(5, 0)

    play()
    vi.advanceTimersByTime(250)

    expect(mockPlayMusic).toHaveBeenCalledTimes(1)
    const channels = mockPlayMusic.mock.calls[0]![0] as Array<Array<{ frequency: number }>>
    const note = channels[0]!.find((e) => 'frequency' in e && typeof e.frequency === 'number')
    expect(note).toBeDefined()
    expect(note!.frequency).toBeCloseTo(523.25, 1) // C5 = 523.25 Hz
  })
})
