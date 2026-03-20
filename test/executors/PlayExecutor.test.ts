/**
 * PLAY Executor Tests
 *
 * Unit tests for the PlayExecutor class execution behavior.
 */

import { beforeEach, describe, expect, it } from 'vitest'

import { BasicInterpreter } from '@/core/BasicInterpreter'
import { TestDeviceAdapter } from '@/core/devices/TestDeviceAdapter'
import type { CompiledAudio, Note } from '@/core/sound/types'
/**
 * Helper to extract note frequencies from CompiledAudio for verification
 * Returns frequencies rounded to nearest integer for easier comparison
 */
function extractFrequencies(audio: CompiledAudio): number[] {
  const frequencies: number[] = []
  for (const channel of audio.channels) {
    for (const event of channel) {
      if ('frequency' in event) {
        frequencies.push(Math.round(event.frequency))
      }
    }
  }
  return frequencies
}

/**
 * Helper to count notes in CompiledAudio
 */
function countNotes(audio: CompiledAudio): number {
  let count = 0
  for (const channel of audio.channels) {
    for (const event of channel) {
      if ('frequency' in event) {
        count++
      }
    }
  }
  return count
}

/**
 * Expected frequencies for common notes (F-BASIC octave mapping)
 * Using A4 = 440Hz standard
 * F-BASIC convention: O2 = middle C (C4 ≈ 262Hz)
 */
const _NOTE_FREQUENCIES: Record<string, number> = {
  C3: 131,
  D3: 147,
  E3: 165,
  F3: 175,
  G3: 196,
  A3: 220,
  B3: 247,
  C4: 262,
  D4: 294,
  E4: 330,
  F4: 349,
  G4: 392,
  A4: 440,
  B4: 494,
}

describe('PlayExecutor', () => {
  let interpreter: BasicInterpreter
  let deviceAdapter: TestDeviceAdapter

  beforeEach(() => {
    deviceAdapter = new TestDeviceAdapter()
    interpreter = new BasicInterpreter({
      maxIterations: 1000,
      maxOutputLines: 100,
      enableDebugMode: false,
      strictMode: false,
      deviceAdapter: deviceAdapter,
    })
  })

  it('should execute PLAY with string literal', async () => {
    const source = `
10 PLAY "CRDRE"
20 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.playSoundCalls.length).toBe(1)
    expect(countNotes(deviceAdapter.playSoundCalls[0]!)).toBe(3)
  })

  it('should execute PLAY with complex music string', async () => {
    const source = `
10 PLAY "T4Y2M0V15O3C5R5D5R5E5"
20 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.playSoundCalls.length).toBe(1)
    expect(countNotes(deviceAdapter.playSoundCalls[0]!)).toBe(3)
  })

  it('should execute PLAY with multi-channel music', async () => {
    const source = `
10 PLAY "C:E:G"
20 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.playSoundCalls.length).toBe(1)
    expect(countNotes(deviceAdapter.playSoundCalls[0]!)).toBe(3)
  })

  it('should execute PLAY with string variable', async () => {
    const source = `
10 A$ = "CDEFG"
20 PLAY A$
30 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.playSoundCalls.length).toBe(1)
    expect(countNotes(deviceAdapter.playSoundCalls[0]!)).toBe(5)
  })

  it('should handle PLAY with empty string', async () => {
    const source = `
10 PLAY ""
20 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.playSoundCalls.length).toBe(1)
    expect(countNotes(deviceAdapter.playSoundCalls[0]!)).toBe(0)
  })

  it('should error for non-string expression', async () => {
    const source = `
10 PLAY 123
20 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors[0]?.message).toMatch(/Expected string/)
  })

  it('should handle PLAY with string concatenation', async () => {
    const source = `
10 A$ = "C"
20 B$ = "D"
30 PLAY A$ + B$ + "E"
40 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.playSoundCalls.length).toBe(1)
    expect(countNotes(deviceAdapter.playSoundCalls[0]!)).toBe(3)
  })

  it('should handle multiple PLAY commands', async () => {
    const source = `
10 PLAY "C"
20 PLAY "D"
30 PLAY "E"
40 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.playSoundCalls.length).toBe(3)
    expect(countNotes(deviceAdapter.playSoundCalls[0]!)).toBe(1)
    expect(countNotes(deviceAdapter.playSoundCalls[1]!)).toBe(1)
    expect(countNotes(deviceAdapter.playSoundCalls[2]!)).toBe(1)
  })

  it('should handle PLAY on same line as other commands', async () => {
    const source = `
10 PRINT "Before": PLAY "C": PRINT "After"
20 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.playSoundCalls.length).toBe(1)
    expect(countNotes(deviceAdapter.playSoundCalls[0]!)).toBe(1)
  })

  it('should handle PLAY in a loop', async () => {
    const source = `
10 FOR I = 1 TO 3
20 PLAY "C"
30 NEXT
40 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.playSoundCalls.length).toBe(3)
    expect(countNotes(deviceAdapter.playSoundCalls[0]!)).toBe(1)
    expect(countNotes(deviceAdapter.playSoundCalls[1]!)).toBe(1)
    expect(countNotes(deviceAdapter.playSoundCalls[2]!)).toBe(1)
  })

  it('should handle PLAY with conditional execution', async () => {
    const source = `
10 LET X = 1
20 IF X = 1 THEN PLAY "C"
30 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.playSoundCalls.length).toBe(1)
    expect(countNotes(deviceAdapter.playSoundCalls[0]!)).toBe(1)
  })

  it('should not execute PLAY when condition is false', async () => {
    const source = `
10 LET X = 0
20 IF X = 1 THEN PLAY "C"
30 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.playSoundCalls).toEqual([])
  })

  it('should handle PLAY with octave and tempo commands', async () => {
    const source = `
10 PLAY "T4O3C"
20 PLAY "D"
30 PLAY "E"
40 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.playSoundCalls.length).toBe(3)
    expect(countNotes(deviceAdapter.playSoundCalls[0]!)).toBe(1)
    expect(countNotes(deviceAdapter.playSoundCalls[1]!)).toBe(1)
    expect(countNotes(deviceAdapter.playSoundCalls[2]!)).toBe(1)
  })

  it('should handle PLAY with rest command', async () => {
    const source = `
10 PLAY "CR5D"
20 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.playSoundCalls.length).toBe(1)
    expect(countNotes(deviceAdapter.playSoundCalls[0]!)).toBe(2) // C and D, R is a rest
  })

  it('should handle PLAY with volume and waveform commands', async () => {
    const source = `
10 PLAY "V15Y2C"
20 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.playSoundCalls.length).toBe(1)
    expect(countNotes(deviceAdapter.playSoundCalls[0]!)).toBe(1)
  })

  it('should persist octave state across PLAY commands', async () => {
    const source = `
10 PLAY "O5C"
20 PLAY "D"
30 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.playSoundCalls.length).toBe(2)

    // First PLAY: O5 C (octave 5)
    const firstFrequencies = extractFrequencies(deviceAdapter.playSoundCalls[0]!)
    // Second PLAY: D (should inherit octave 5)
    const secondFrequencies = extractFrequencies(deviceAdapter.playSoundCalls[1]!)

    // Both should be in octave 5 (high frequencies)
    // C5 ≈ 523Hz, D5 ≈ 587Hz
    expect(firstFrequencies[0]).toBeGreaterThan(500) // C5
    expect(secondFrequencies[0]).toBeGreaterThan(550) // D5
  })

  it('should persist tempo state across PLAY commands', async () => {
    const source = `
10 PLAY "T1C"
20 PLAY "D"
30 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.playSoundCalls.length).toBe(2)

    // Both notes should have short durations (T1 is fastest tempo)
    const getDuration = (audio: CompiledAudio) => {
      for (const channel of audio.channels) {
        for (const event of channel) {
          if ('duration' in event) {
            return event.duration
          }
        }
      }
      return 0
    }

    const firstDuration = getDuration(deviceAdapter.playSoundCalls[0]!)
    const secondDuration = getDuration(deviceAdapter.playSoundCalls[1]!)

    // Both should have the same duration (T1 tempo inherited)
    expect(firstDuration).toBe(secondDuration)
  })

  it('should maintain independent state per channel', async () => {
    const source = `
10 PLAY "O3C:O1E"
20 PLAY "D:F"
30 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.playSoundCalls.length).toBe(2)

    // Second PLAY: Channel 0 should have O3 (high), Channel 1 should have O1 (low)
    const secondCall = deviceAdapter.playSoundCalls[1]!
    expect(secondCall.channels.length).toBe(2)

    // Get frequencies from each channel
    const ch0Freq = (secondCall.channels[0]?.find((e): e is Note => 'frequency' in e)?.frequency) ?? 0
    const ch1Freq = (secondCall.channels[1]?.find((e): e is Note => 'frequency' in e)?.frequency) ?? 0

    // F-BASIC octave mapping: O2 = middle C (C4 ≈ 262Hz)
    // O3D ≈ 587Hz (D5), O1F ≈ 175Hz (F3)
    expect(ch0Freq).toBeGreaterThan(500) // O3D ≈ 587Hz
    expect(ch1Freq).toBeLessThan(250) // O1F ≈ 175Hz
  })
})
