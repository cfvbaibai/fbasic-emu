/**
 * Unit tests for DeviceOutputHelpers
 */

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import {
  buildBeepMessage,
  buildPlaySoundMessage,
  postBeep,
  postOutputMessage,
  postPlaySound,
  serializeAudioEvents,
} from '@/core/devices/DeviceOutputHelpers'
import type { PlaySoundMessage } from '@/core/interfaces'
import type { CompiledAudio } from '@/core/sound/types'

// Mock logger
vi.mock('@/shared/logger', () => ({
  logWorker: {
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}))

// Capture postMessage calls
let capturedMessages: unknown[] = []

beforeEach(() => {
  capturedMessages = []
  const selfTyped = self as typeof self & {
    postMessage: (msg: unknown, transfer?: Transferable[]) => void
  }
  selfTyped.postMessage = (msg: unknown) => {
    capturedMessages.push(msg)
  }
})

afterEach(() => {
  capturedMessages = []
})

describe('DeviceOutputHelpers', () => {
  describe('postOutputMessage', () => {
    it('should post an OUTPUT message with print type', () => {
      postOutputMessage('exec-1', 'Hello World', 'print')
      expect(capturedMessages.length).toBe(1)
      const msg = capturedMessages[0] as Record<string, unknown>
      expect(msg.type).toBe('OUTPUT')
      expect(msg.data).toEqual({
        executionId: 'exec-1',
        output: 'Hello World',
        outputType: 'print',
        timestamp: expect.any(Number),
      })
    })

    it('should post an OUTPUT message with debug type', () => {
      postOutputMessage('exec-2', 'debug info', 'debug')
      expect(capturedMessages.length).toBe(1)
      const msg = capturedMessages[0] as Record<string, unknown>
      expect(msg.data).toEqual({
        executionId: 'exec-2',
        output: 'debug info',
        outputType: 'debug',
        timestamp: expect.any(Number),
      })
    })

    it('should post an OUTPUT message with error type', () => {
      postOutputMessage('exec-3', 'something failed', 'error')
      expect(capturedMessages.length).toBe(1)
      const msg = capturedMessages[0] as Record<string, unknown>
      expect(msg.data).toEqual({
        executionId: 'exec-3',
        output: 'something failed',
        outputType: 'error',
        timestamp: expect.any(Number),
      })
    })
  })

  describe('serializeAudioEvents', () => {
    it('should serialize note events', () => {
      const audio: CompiledAudio = {
        channels: [
          [
            { frequency: 440, duration: 500, channel: 0, duty: 2, envelope: 0, volumeOrLength: 15 },
          ],
        ],
      }
      const events = serializeAudioEvents(audio)
      expect(events).toEqual([
        { frequency: 440, duration: 500, channel: 0, duty: 2, envelope: 0, volumeOrLength: 15 },
      ])
    })

    it('should serialize rest events (no frequency)', () => {
      const audio: CompiledAudio = {
        channels: [
          [
            { duration: 250, channel: 0 },
          ],
        ],
      }
      const events = serializeAudioEvents(audio)
      expect(events).toEqual([
        { frequency: undefined, duration: 250, channel: 0, duty: 0, envelope: 0, volumeOrLength: 0 },
      ])
    })

    it('should flatten events across multiple channels', () => {
      const audio: CompiledAudio = {
        channels: [
          [{ frequency: 440, duration: 500, channel: 0, duty: 2, envelope: 0, volumeOrLength: 15 }],
          [{ frequency: 880, duration: 300, channel: 1, duty: 1, envelope: 0, volumeOrLength: 10 }],
        ],
      }
      const events = serializeAudioEvents(audio)
      expect(events.length).toBe(2)
      expect(events[0]!.frequency).toBe(440)
      expect(events[1]!.frequency).toBe(880)
    })

    it('should handle multiple events in a single channel', () => {
      const audio: CompiledAudio = {
        channels: [
          [
            { frequency: 262, duration: 200, channel: 0, duty: 2, envelope: 0, volumeOrLength: 15 },
            { duration: 100, channel: 0 },
            { frequency: 330, duration: 200, channel: 0, duty: 2, envelope: 0, volumeOrLength: 15 },
          ],
        ],
      }
      const events = serializeAudioEvents(audio)
      expect(events.length).toBe(3)
      expect(events[0]!.frequency).toBe(262)
      expect(events[1]!.frequency).toBe(undefined)
      expect(events[2]!.frequency).toBe(330)
    })
  })

  describe('buildPlaySoundMessage', () => {
    it('should build a PLAY_SOUND message with events', () => {
      const events = [{ frequency: 440, duration: 500, channel: 0, duty: 2, envelope: 0, volumeOrLength: 15 }]
      const msg = buildPlaySoundMessage('exec-1', events)
      expect(msg.type).toBe('PLAY_SOUND')
      expect(msg.data.executionId).toBe('exec-1')
      expect(msg.data.events).toEqual(events)
      expect(msg.data.musicString).toBe(undefined)
    })

    it('should include musicString when provided', () => {
      const events: PlaySoundMessage['data']['events'] = []
      const msg = buildPlaySoundMessage('exec-1', events, 'C4D4E4')
      expect(msg.data.musicString).toBe('C4D4E4')
    })
  })

  describe('buildBeepMessage', () => {
    it('should build a BEEP message with default frequency 1200', () => {
      const msg = buildBeepMessage('exec-1')
      expect(msg.type).toBe('PLAY_SOUND')
      expect(msg.data.executionId).toBe('exec-1')
      expect(msg.data.musicString).toBe('BEEP')
      expect(msg.data.events).toEqual([
        { frequency: 1200, duration: 300, channel: 0, duty: 2, envelope: 0, volumeOrLength: 15 },
      ])
    })
  })

  describe('postPlaySound', () => {
    it('should post PLAY_SOUND message for compiled audio', () => {
      const audio: CompiledAudio = {
        channels: [
          [{ frequency: 440, duration: 500, channel: 0, duty: 2, envelope: 0, volumeOrLength: 15 }],
        ],
      }
      postPlaySound('exec-1', audio)
      expect(capturedMessages.length).toBe(1)
      const msg = capturedMessages[0] as Record<string, unknown>
      expect(msg.type).toBe('PLAY_SOUND')
      const data = msg.data as Record<string, unknown>
      expect(data.executionId).toBe('exec-1')
      expect((data.events as unknown[]).length).toBe(1)
    })
  })

  describe('postBeep', () => {
    it('should post a BEEP sound message', () => {
      postBeep('exec-1')
      expect(capturedMessages.length).toBe(1)
      const msg = capturedMessages[0] as Record<string, unknown>
      expect(msg.type).toBe('PLAY_SOUND')
      const data = msg.data as Record<string, unknown>
      expect(data.executionId).toBe('exec-1')
      expect(data.musicString).toBe('BEEP')
    })
  })
})
