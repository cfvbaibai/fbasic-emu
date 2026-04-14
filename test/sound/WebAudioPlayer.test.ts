/**
 * Tests for WebAudioPlayer
 *
 * Verifies the vanilla (non-Vue) Web Audio player used by the export runtime.
 * Tests note scheduling, envelope handling, duty cycle, multi-channel playback,
 * beep, and cleanup using mocked Web Audio API types.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import type { CompiledAudio, Note, Rest } from '@/core/sound/types'
import { WebAudioPlayer } from '@/core/sound/WebAudioPlayer'

// ============================================================================
// Web Audio API Mocks
// ============================================================================

/* eslint-disable no-restricted-syntax -- test mocks need double casts for Web Audio API types */

/**
 * Creates a mock GainNode that records gain automation calls.
 */
function createMockGainNode() {
  const gain = {
    setValueAtTime: vi.fn(),
    linearRampToValueAtTime: vi.fn(),
  }
  const connect = vi.fn<(...args: unknown[]) => unknown>().mockReturnValue({})
  const disconnect = vi.fn()
  const node = { gain, connect, disconnect } as unknown as GainNode
  return { node, gain, connect, disconnect }
}

/**
 * Creates a mock OscillatorNode that records scheduling calls.
 */
function createMockOscillatorNode() {
  const start = vi.fn()
  const stop = vi.fn()
  const connect = vi.fn<(...args: unknown[]) => unknown>().mockReturnValue({})
  const setPeriodicWave = vi.fn()
  let onendedHandler: (() => void) | null = null
  const node = {
    start,
    stop,
    connect,
    setPeriodicWave,
    frequency: { value: 0 },
    get onended() { return onendedHandler },
    set onended(fn: (() => void) | null) { onendedHandler = fn },
  } as unknown as OscillatorNode
  return {
    node,
    start,
    stop,
    connect,
    setPeriodicWave,
    get onended(): (() => void) | null { return onendedHandler },
    set onended(fn: (() => void) | null) { onendedHandler = fn },
  }
}

/**
 * Creates a mock AudioContext with tracking for all created nodes.
 */
function createMockAudioContext() {
  const oscillators: Array<ReturnType<typeof createMockOscillatorNode>> = []
  const gainNodes: Array<ReturnType<typeof createMockGainNode>> = []
  const periodicWaves: Array<{ real: Float32Array; imag: Float32Array }> = []
  let closed = false
  let suspended = false

  const context = {
    get currentTime() {
      return 0
    },
    get state() {
      return suspended ? 'suspended' : 'running'
    },
    resume: vi.fn().mockImplementation(async () => {
      suspended = false
    }),
    close: vi.fn().mockImplementation(async () => {
      closed = true
    }),
    createOscillator: vi.fn().mockImplementation(() => {
      const osc = createMockOscillatorNode()
      oscillators.push(osc)
      return osc.node
    }),
    createGain: vi.fn().mockImplementation(() => {
      const gain = createMockGainNode()
      gainNodes.push(gain)
      return gain.node
    }),
    createPeriodicWave: vi.fn().mockImplementation(
      (real: Float32Array, imag: Float32Array) => {
        const wave = { real, imag }
        periodicWaves.push(wave)
        return wave
      },
    ),
    destination: {},
    get closed() {
      return closed
    },
  } as unknown as AudioContext

  return {
    context,
    oscillators,
    gainNodes,
    periodicWaves,
    get closed() {
      return closed
    },
  }
}
/* eslint-enable no-restricted-syntax */

// ============================================================================
// Test Helpers
// ============================================================================

/** Create a Note event for testing. */
function makeNote(overrides: Partial<Note> = {}): Note {
  return {
    frequency: 440,
    duration: 500,
    channel: 0,
    duty: 2,
    envelope: 0,
    volumeOrLength: 15,
    ...overrides,
  }
}

/** Create a Rest event for testing. */
function makeRest(overrides: Partial<Rest> = {}): Rest {
  return {
    duration: 250,
    channel: 0,
    ...overrides,
  }
}

/** Create a CompiledAudio with a single channel. */
function makeSingleChannelAudio(events: Array<Note | Rest>): CompiledAudio {
  return { channels: [events] }
}

/** Create a CompiledAudio with two channels. */
function makeTwoChannelAudio(
  ch0: Array<Note | Rest>,
  ch1: Array<Note | Rest>,
): CompiledAudio {
  return { channels: [ch0, ch1] }
}

// ============================================================================
// Tests
// ============================================================================

describe('WebAudioPlayer', () => {
  let mockCtx: ReturnType<typeof createMockAudioContext>
  let player: WebAudioPlayer
  let audioContextCreateCount: number

  beforeEach(() => {
    mockCtx = createMockAudioContext()
    audioContextCreateCount = 0
    /* eslint-disable no-restricted-syntax -- test mock needs double cast for AudioContext constructor */
    // Mock the global AudioContext constructor using a class with call tracking
    const mockContextClass = class MockAudioContext {
      // Forward all property accesses to the mock context object
      get currentTime() { return mockCtx.context.currentTime }
      get state() { return mockCtx.context.state }
      resume = mockCtx.context.resume
      close = mockCtx.context.close
      createOscillator = mockCtx.context.createOscillator
      createGain = mockCtx.context.createGain
      createPeriodicWave = mockCtx.context.createPeriodicWave
      get destination() { return mockCtx.context.destination }
      get closed() { return mockCtx.closed }
    } as unknown as typeof AudioContext
    /* eslint-enable no-restricted-syntax */
    // Wrap with tracking proxy to count constructor invocations
    vi.stubGlobal('AudioContext', new Proxy(mockContextClass, {
      construct() {
        audioContextCreateCount++
        return new mockContextClass()
      },
    }))
    player = new WebAudioPlayer()
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  describe('playSound', () => {
    it('returns a Promise that resolves after total duration', async () => {
      const audio = makeSingleChannelAudio([
        makeNote({ duration: 100 }),
        makeRest({ duration: 100 }),
      ])
      // Total duration = 200ms

      const promise = player.playSound(audio)
      expect(promise).toBeInstanceOf(Promise)

      // Advance timers past the total duration
      vi.useFakeTimers()
      await vi.advanceTimersByTimeAsync(250)
      vi.useRealTimers()

      await expect(promise).resolves.toBeUndefined()
    })

    it('creates oscillators for each note', async () => {
      const audio = makeSingleChannelAudio([
        makeNote({ frequency: 262, duration: 200 }),
        makeNote({ frequency: 330, duration: 200 }),
      ])

      void player.playSound(audio)

      // Two notes should create two oscillators
      expect(mockCtx.oscillators.length).toEqual(2)
      expect(mockCtx.oscillators[0]!.start).toHaveBeenCalledWith(0)
      expect(mockCtx.oscillators[1]!.start).toHaveBeenCalledWith(0.2) // 200ms = 0.2s
    })

    it('schedules notes at correct time offsets including rests', async () => {
      const audio = makeSingleChannelAudio([
        makeNote({ duration: 300 }),
        makeRest({ duration: 200 }),
        makeNote({ frequency: 523, duration: 300 }),
      ])

      void player.playSound(audio)

      expect(mockCtx.oscillators.length).toEqual(2)
      // First note starts at 0
      expect(mockCtx.oscillators[0]!.start).toHaveBeenCalledWith(0)
      // Second note starts after 300ms note + 200ms rest = 500ms = 0.5s
      expect(mockCtx.oscillators[1]!.start).toHaveBeenCalledWith(0.5)
    })

    it('connects oscillators through gain nodes to destination', async () => {
      const audio = makeSingleChannelAudio([makeNote()])
      void player.playSound(audio)

      // Oscillator -> GainNode -> Destination
      expect(mockCtx.oscillators[0]!.connect).toHaveBeenCalledWith(mockCtx.gainNodes[0]!.node)
      expect(mockCtx.gainNodes[0]!.connect).toHaveBeenCalledWith(mockCtx.context.destination)
    })

    it('resolves after the longest channel duration for multi-channel audio', async () => {
      const ch0 = [makeNote({ duration: 100 })] // 100ms total
      const ch1 = [makeNote({ duration: 300 })] // 300ms total
      const audio = makeTwoChannelAudio(ch0, ch1)

      const promise = player.playSound(audio)

      vi.useFakeTimers()
      await vi.advanceTimersByTimeAsync(350)
      vi.useRealTimers()

      await expect(promise).resolves.toBeUndefined()
    })
  })

  describe('playSoundBackground', () => {
    it('plays without returning a promise', () => {
      const audio = makeSingleChannelAudio([makeNote()])
      const result = player.playSoundBackground(audio)
      expect(result).toBeUndefined()
    })

    it('schedules oscillators the same way as playSound', () => {
      const audio = makeSingleChannelAudio([makeNote()])
      player.playSoundBackground(audio)

      expect(mockCtx.oscillators.length).toEqual(1)
      expect(mockCtx.oscillators[0]!.start).toHaveBeenCalledWith(0)
    })
  })

  describe('envelope handling', () => {
    it('M0: applies constant volume (no ramp)', () => {
      const audio = makeSingleChannelAudio([
        makeNote({ envelope: 0, volumeOrLength: 10 }),
      ])
      void player.playSound(audio)

      const gainNode = mockCtx.gainNodes[0]!
      expect(gainNode.gain.setValueAtTime).toHaveBeenCalledWith(10 / 15, 0)
      expect(gainNode.gain.linearRampToValueAtTime).not.toHaveBeenCalled()
    })

    it('M1: applies envelope decay ramp', () => {
      const audio = makeSingleChannelAudio([
        makeNote({ envelope: 1, volumeOrLength: 7 }),
      ])
      void player.playSound(audio)

      const gainNode = mockCtx.gainNodes[0]!
      // M1 starts at volume 1.0
      expect(gainNode.gain.setValueAtTime).toHaveBeenCalledWith(1.0, 0)
      // M1 ramps to 0 over decay time
      expect(gainNode.gain.linearRampToValueAtTime).toHaveBeenCalledWith(0, expect.any(Number))
    })
  })

  describe('duty cycle', () => {
    it('creates a PeriodicWave for each note', () => {
      const audio = makeSingleChannelAudio([makeNote({ duty: 1 })])
      void player.playSound(audio)

      expect(mockCtx.periodicWaves.length).toEqual(1)
    })

    it('sets the PeriodicWave on the oscillator', () => {
      const audio = makeSingleChannelAudio([makeNote({ duty: 0 })])
      void player.playSound(audio)

      expect(mockCtx.oscillators[0]!.setPeriodicWave).toHaveBeenCalledWith(
        mockCtx.periodicWaves[0],
      )
    })
  })

  describe('beep', () => {
    it('plays a short tone', () => {
      player.beep()

      expect(mockCtx.oscillators.length).toEqual(1)
      expect(mockCtx.oscillators[0]!.start).toHaveBeenCalledWith(0)
      // BEEP: 1200Hz, 300ms
      expect(mockCtx.oscillators[0]!.stop).toHaveBeenCalledWith(0.3)
    })

    it('sets frequency to 1200Hz', () => {
      player.beep()

      // The frequency is set via periodic wave, not oscillator.frequency
      expect(mockCtx.oscillators.length).toEqual(1)
    })
  })

  describe('stopAll', () => {
    it('stops all scheduled oscillators', () => {
      const audio = makeSingleChannelAudio([
        makeNote({ duration: 5000 }),
        makeNote({ duration: 5000 }),
      ])
      player.playSoundBackground(audio)

      player.stopAll()

      for (const osc of mockCtx.oscillators) {
        expect(osc.stop).toHaveBeenCalled()
      }
    })

    it('disconnects all gain nodes', () => {
      const audio = makeSingleChannelAudio([makeNote()])
      player.playSoundBackground(audio)

      player.stopAll()

      for (const gain of mockCtx.gainNodes) {
        expect(gain.disconnect).toHaveBeenCalled()
      }
    })

    it('clears the play queue so pending playSound resolves', async () => {
      const audio = makeSingleChannelAudio([makeNote({ duration: 10000 })])
      const promise = player.playSound(audio)

      player.stopAll()

      // After stopAll, the promise should resolve (not hang)
      await expect(promise).resolves.toBeUndefined()
    })
  })

  describe('dispose', () => {
    it('closes the AudioContext', async () => {
      player.playSoundBackground(makeSingleChannelAudio([makeNote()]))

      player.dispose()

      expect(mockCtx.context.close).toHaveBeenCalled()
    })

    it('stops all sounds before closing', () => {
      player.playSoundBackground(makeSingleChannelAudio([makeNote()]))

      player.dispose()

      for (const osc of mockCtx.oscillators) {
        expect(osc.stop).toHaveBeenCalled()
      }
    })

    it('can be called multiple times without error', () => {
      player.playSoundBackground(makeSingleChannelAudio([makeNote()]))
      player.dispose()
      player.dispose()

      expect(mockCtx.context.close).toHaveBeenCalledTimes(1)
    })
  })

  describe('AudioContext lifecycle', () => {
    it('creates AudioContext on first play', () => {
      expect(audioContextCreateCount).toEqual(0)

      player.playSoundBackground(makeSingleChannelAudio([makeNote()]))

      expect(audioContextCreateCount).toEqual(1)
    })

    it('reuses existing AudioContext for subsequent plays', () => {
      player.playSoundBackground(makeSingleChannelAudio([makeNote()]))

      expect(audioContextCreateCount).toEqual(1)

      player.playSoundBackground(makeSingleChannelAudio([makeNote()]))

      expect(audioContextCreateCount).toEqual(1)
    })

    it('creates a new AudioContext after dispose', () => {
      player.playSoundBackground(makeSingleChannelAudio([makeNote()]))
      player.dispose()

      player.playSoundBackground(makeSingleChannelAudio([makeNote()]))

      expect(audioContextCreateCount).toEqual(2)
    })
  })

  describe('edge cases', () => {
    it('handles empty channels array gracefully', async () => {
      const audio: CompiledAudio = { channels: [] }

      const promise = player.playSound(audio)

      // Should resolve immediately with 0 duration
      await expect(promise).resolves.toBeUndefined()
    })

    it('handles channels with no events', async () => {
      const audio: CompiledAudio = { channels: [[]] }

      const promise = player.playSound(audio)

      await expect(promise).resolves.toBeUndefined()
    })
  })
})
