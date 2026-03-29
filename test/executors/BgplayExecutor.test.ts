/**
 * BGPLAY Executor Tests
 *
 * Unit tests for the BgplayExecutor class execution behavior.
 * BGPLAY is the fire-and-forget variant of PLAY - same compilation, no blocking.
 */

import { beforeEach, describe, expect, it } from 'vitest'

import { BasicInterpreter } from '@/core/BasicInterpreter'
import { TestDeviceAdapter } from '@/core/devices/TestDeviceAdapter'
import type { CompiledAudio } from '@/core/sound/types'

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

describe('BgplayExecutor', () => {
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

  it('should execute BGPLAY with string literal', async () => {
    const source = `
10 BGPLAY "CRDRE"
20 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.playSoundBackgroundCalls.length).toBe(1)
    expect(countNotes(deviceAdapter.playSoundBackgroundCalls[0]!)).toBe(3)
  })

  it('should not use playSound (only playSoundBackground)', async () => {
    const source = `
10 BGPLAY "CDE"
20 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(deviceAdapter.playSoundCalls).toEqual([])
    expect(deviceAdapter.playSoundBackgroundCalls.length).toBe(1)
  })

  it('should execute BGPLAY with complex music string', async () => {
    const source = `
10 BGPLAY "T4Y2M0V15O3C5R5D5R5E5"
20 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.playSoundBackgroundCalls.length).toBe(1)
    expect(countNotes(deviceAdapter.playSoundBackgroundCalls[0]!)).toBe(3)
  })

  it('should execute BGPLAY with multi-channel music', async () => {
    const source = `
10 BGPLAY "C:E:G"
20 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.playSoundBackgroundCalls.length).toBe(1)
    expect(countNotes(deviceAdapter.playSoundBackgroundCalls[0]!)).toBe(3)
  })

  it('should execute BGPLAY with string variable', async () => {
    const source = `
10 A$ = "CDEFG"
20 BGPLAY A$
30 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.playSoundBackgroundCalls.length).toBe(1)
    expect(countNotes(deviceAdapter.playSoundBackgroundCalls[0]!)).toBe(5)
  })

  it('should handle BGPLAY with empty string', async () => {
    const source = `
10 BGPLAY ""
20 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.playSoundBackgroundCalls.length).toBe(1)
    expect(countNotes(deviceAdapter.playSoundBackgroundCalls[0]!)).toBe(0)
  })

  it('should error for non-string expression', async () => {
    const source = `
10 BGPLAY 123
20 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(false)
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.errors[0]?.message).toMatch(/Expected string/)
  })

  it('should handle BGPLAY with string concatenation', async () => {
    const source = `
10 A$ = "C"
20 B$ = "D"
30 BGPLAY A$ + B$ + "E"
40 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.playSoundBackgroundCalls.length).toBe(1)
    expect(countNotes(deviceAdapter.playSoundBackgroundCalls[0]!)).toBe(3)
  })

  it('should handle multiple BGPLAY commands', async () => {
    const source = `
10 BGPLAY "C"
20 BGPLAY "D"
30 BGPLAY "E"
40 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.playSoundBackgroundCalls.length).toBe(3)
    expect(countNotes(deviceAdapter.playSoundBackgroundCalls[0]!)).toBe(1)
    expect(countNotes(deviceAdapter.playSoundBackgroundCalls[1]!)).toBe(1)
    expect(countNotes(deviceAdapter.playSoundBackgroundCalls[2]!)).toBe(1)
  })

  it('should handle BGPLAY on same line as other commands', async () => {
    const source = `
10 PRINT "Before": BGPLAY "C": PRINT "After"
20 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.playSoundBackgroundCalls.length).toBe(1)
    expect(countNotes(deviceAdapter.playSoundBackgroundCalls[0]!)).toBe(1)
  })

  it('should handle BGPLAY in a loop', async () => {
    const source = `
10 FOR I = 1 TO 3
20 BGPLAY "C"
30 NEXT
40 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.playSoundBackgroundCalls.length).toBe(3)
    expect(countNotes(deviceAdapter.playSoundBackgroundCalls[0]!)).toBe(1)
    expect(countNotes(deviceAdapter.playSoundBackgroundCalls[1]!)).toBe(1)
    expect(countNotes(deviceAdapter.playSoundBackgroundCalls[2]!)).toBe(1)
  })

  it('should handle BGPLAY with conditional execution', async () => {
    const source = `
10 LET X = 1
20 IF X = 1 THEN BGPLAY "C"
30 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.playSoundBackgroundCalls.length).toBe(1)
    expect(countNotes(deviceAdapter.playSoundBackgroundCalls[0]!)).toBe(1)
  })

  it('should not execute BGPLAY when condition is false', async () => {
    const source = `
10 LET X = 0
20 IF X = 1 THEN BGPLAY "C"
30 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.playSoundBackgroundCalls).toEqual([])
  })

  it('should persist octave state across BGPLAY commands', async () => {
    const source = `
10 BGPLAY "O5C"
20 BGPLAY "D"
30 END
`
    const result = await interpreter.execute(source)

    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
    expect(deviceAdapter.playSoundBackgroundCalls.length).toBe(2)

    // First BGPLAY: O5 C (octave 5)
    const firstFrequencies = extractFrequencies(deviceAdapter.playSoundBackgroundCalls[0]!)
    // Second BGPLAY: D (should inherit octave 5)
    const secondFrequencies = extractFrequencies(deviceAdapter.playSoundBackgroundCalls[1]!)

    // Both should be in octave 5 (high frequencies)
    expect(firstFrequencies[0]).toBeGreaterThan(500) // C5
    expect(secondFrequencies[0]).toBeGreaterThan(550) // D5
  })

  it('should produce same compilation as PLAY for identical input', async () => {
    // BGPLAY and PLAY should compile identically - difference is only blocking vs non-blocking
    const bgplayAdapter = new TestDeviceAdapter()
    const bgplayInterpreter = new BasicInterpreter({
      maxIterations: 1000,
      maxOutputLines: 100,
      enableDebugMode: false,
      strictMode: false,
      deviceAdapter: bgplayAdapter,
    })

    const playAdapter = new TestDeviceAdapter()
    const playInterpreter = new BasicInterpreter({
      maxIterations: 1000,
      maxOutputLines: 100,
      enableDebugMode: false,
      strictMode: false,
      deviceAdapter: playAdapter,
    })

    const bgplayResult = await bgplayInterpreter.execute('10 BGPLAY "CDE"\n20 END')
    const playResult = await playInterpreter.execute('10 PLAY "CDE"\n20 END')

    expect(bgplayResult.success).toBe(true)
    expect(playResult.success).toBe(true)

    // Both should have same number of notes
    const bgplayNotes = countNotes(bgplayAdapter.playSoundBackgroundCalls[0]!)
    const playNotes = countNotes(playAdapter.playSoundCalls[0]!)
    expect(bgplayNotes).toEqual(playNotes)

    // Frequencies should match
    const bgplayFreqs = extractFrequencies(bgplayAdapter.playSoundBackgroundCalls[0]!)
    const playFreqs = extractFrequencies(playAdapter.playSoundCalls[0]!)
    expect(bgplayFreqs).toEqual(playFreqs)
  })
})
