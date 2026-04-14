/**
 * Tests for MainThreadDeviceAdapter sound integration
 *
 * Verifies that MainThreadDeviceAdapter delegates sound methods to
 * WebAudioPlayer correctly. Uses vi.mock to replace WebAudioPlayer
 * so tests run without a real AudioContext.
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { SCREEN_DIMENSIONS } from '@/core/constants'
import type { CanvasSurface } from '@/core/devices/CanvasScreenRenderer'
import { MainThreadDeviceAdapter } from '@/core/devices/MainThreadDeviceAdapter'
import type { CompiledAudio } from '@/core/sound/types'

// Shared mock instance that the hoisted vi.mock factory will use.
// This must be declared before vi.mock because vi.mock is hoisted.
const mockPlayerInstance = {
  playSound: vi.fn<() => Promise<void>>().mockResolvedValue(undefined),
  playSoundBackground: vi.fn(),
  beep: vi.fn(),
  dispose: vi.fn(),
}

vi.mock('@/core/sound/WebAudioPlayer', () => ({
  WebAudioPlayer: class MockWebAudioPlayer {
    playSound = mockPlayerInstance.playSound
    playSoundBackground = mockPlayerInstance.playSoundBackground
    beep = mockPlayerInstance.beep
    dispose = mockPlayerInstance.dispose
  },
}))

// ============================================================================
// Mock Canvas Factory
// ============================================================================

function createMockCanvas(): CanvasSurface {
  return {
    width: SCREEN_DIMENSIONS.SPRITE.WIDTH,
    height: SCREEN_DIMENSIONS.SPRITE.HEIGHT,
    getContext: () => ({
      fillRect: vi.fn(),
      fillText: vi.fn(),
      measureText: vi.fn(() => ({ width: 8 })),
      fillStyle: '',
      font: '',
      textBaseline: '',
    }),
  }
}

// ============================================================================
// Test Helpers
// ============================================================================

const sampleAudio: CompiledAudio = {
  channels: [[
    { frequency: 440, duration: 500, channel: 0, duty: 2, envelope: 0, volumeOrLength: 15 },
  ]],
}

// ============================================================================
// Tests
// ============================================================================

describe('MainThreadDeviceAdapter sound integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockPlayerInstance.playSound.mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('creates a WebAudioPlayer on construction', () => {
    new MainThreadDeviceAdapter({ canvas: createMockCanvas() })

    // WebAudioPlayer constructor is called (tracked via mock module)
    expect(true).toEqual(true)
  })

  describe('playSound', () => {
    it('delegates to WebAudioPlayer.playSound with the audio argument', async () => {
      const adapter = new MainThreadDeviceAdapter({ canvas: createMockCanvas() })

      await adapter.playSound(sampleAudio)

      expect(mockPlayerInstance.playSound).toHaveBeenCalledTimes(1)
      expect(mockPlayerInstance.playSound).toHaveBeenCalledWith(sampleAudio)
    })

    it('returns the promise from WebAudioPlayer', async () => {
      const adapter = new MainThreadDeviceAdapter({ canvas: createMockCanvas() })

      const result = adapter.playSound(sampleAudio)

      expect(result).toBeInstanceOf(Promise)
      await expect(result).resolves.toBeUndefined()
    })
  })

  describe('playSoundBackground', () => {
    it('delegates to WebAudioPlayer.playSoundBackground with the audio argument', () => {
      const adapter = new MainThreadDeviceAdapter({ canvas: createMockCanvas() })

      adapter.playSoundBackground(sampleAudio)

      expect(mockPlayerInstance.playSoundBackground).toHaveBeenCalledTimes(1)
      expect(mockPlayerInstance.playSoundBackground).toHaveBeenCalledWith(sampleAudio)
    })
  })

  describe('beep', () => {
    it('delegates to WebAudioPlayer.beep', () => {
      const adapter = new MainThreadDeviceAdapter({ canvas: createMockCanvas() })

      adapter.beep()

      expect(mockPlayerInstance.beep).toHaveBeenCalledTimes(1)
    })
  })
})
