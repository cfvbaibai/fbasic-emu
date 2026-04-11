/**
 * Tests for programCodec utility
 */

import { describe, expect, it } from 'vitest'

import type { CompactBg } from '@/core/types/program-types'
import {
  decodeProgram,
  encodeProgram,
  ProgramDecodeError,
} from '@/shared/utils/programCodec'

// ============================================================================
// Helpers
// ============================================================================

/** Create a fake CompactBg for testing */
function makeFakeBg(): CompactBg {
  return {
    format: 'sparse1',
    data: '0,0,65,1',
    width: 28,
    height: 21,
  }
}

/** Create a long source string of a given length */
function longSource(length: number): string {
  const line = '10 REM A line of padding text for testing\n'
  let result = ''
  while (result.length < length) {
    result += line
  }
  return result.slice(0, length)
}

/** Base URL for test environments where window.location is unavailable */
const TEST_BASE_URL = 'https://example.com/#/share/'

describe('programCodec', () => {
  // ========================================================================
  // encodeProgram - plain (small programs)
  // ========================================================================

  describe('encodeProgram (plain)', () => {
    it('encodes a simple program without compression', async () => {
      const result = await encodeProgram('10 PRINT "HELLO"', undefined, {
        baseUrl: TEST_BASE_URL,
      })

      expect(result.compressed).toBe(false)
      expect(result.encoded.startsWith('z')).toBe(false)
      expect(result.url).toContain('#/share/')
      expect(result.tooLarge).toBe(false)
    })

    it('encodes program with BG data', async () => {
      const bg = makeFakeBg()
      const result = await encodeProgram('10 PRINT "HI"', bg, {
        baseUrl: TEST_BASE_URL,
      })

      expect(result.compressed).toBe(false)
      // The encoded string should contain the BG data when decoded
      const decoded = await decodeProgram(result.encoded)
      expect(decoded.b).toEqual(bg)
    })

    it('produces round-trip compatible output for tiny programs', async () => {
      const source = '10 PRINT "HELLO WORLD"'
      const result = await encodeProgram(source, undefined, {
        baseUrl: TEST_BASE_URL,
      })

      const decoded = await decodeProgram(result.encoded)
      expect(decoded.c).toEqual(source)
      expect(decoded.b).toBeUndefined()
    })

    it('produces round-trip compatible output with BG data', async () => {
      const source = '20 LOCATE 10,10:PRINT "X"'
      const bg = makeFakeBg()
      const result = await encodeProgram(source, bg, {
        baseUrl: TEST_BASE_URL,
      })

      const decoded = await decodeProgram(result.encoded)
      expect(decoded.c).toEqual(source)
      expect(decoded.b).toEqual(bg)
    })
  })

  // ========================================================================
  // encodeProgram - compressed (large programs)
  // ========================================================================

  describe('encodeProgram (compressed)', () => {
    it('compresses programs with source >= 2000 chars', async () => {
      const source = longSource(2000)
      const result = await encodeProgram(source, undefined, {
        baseUrl: TEST_BASE_URL,
      })

      expect(result.compressed).toBe(true)
      expect(result.encoded.startsWith('z')).toBe(true)
      expect(result.tooLarge).toBe(false)
    })

    it('does not compress programs with source < 2000 chars', async () => {
      const source = longSource(1999)
      const result = await encodeProgram(source, undefined, {
        baseUrl: TEST_BASE_URL,
      })

      expect(result.compressed).toBe(false)
    })

    it('round-trips compressed programs with BG data', async () => {
      const source = longSource(3000)
      const bg = makeFakeBg()
      const result = await encodeProgram(source, bg, {
        baseUrl: TEST_BASE_URL,
      })

      const decoded = await decodeProgram(result.encoded)
      expect(decoded.c).toEqual(source)
      expect(decoded.b).toEqual(bg)
    })

    it('produces shorter output for compressible data', async () => {
      // A program with lots of repetition compresses well
      const source = '10 PRINT "AAAAAAAAAAAAAAAAAAAAAAAAAAA"\n'.repeat(200)
      const result = await encodeProgram(source, undefined, {
        baseUrl: TEST_BASE_URL,
      })

      // Compressed payload should exist and start with 'z'
      expect(result.compressed).toBe(true)
      expect(result.encoded.startsWith('z')).toBe(true)

      // The encoded length should be reasonable
      expect(result.encoded.length).toBeLessThan(source.length)
    })
  })

  // ========================================================================
  // encodeProgram - URL construction
  // ========================================================================

  describe('encodeProgram (URL)', () => {
    it('constructs correct share URL', async () => {
      const result = await encodeProgram('10 PRINT "TEST"', undefined, {
        baseUrl: TEST_BASE_URL,
      })

      expect(result.url).toEqual(
        `https://example.com/#/share/${result.encoded}`
      )
    })

    it('reports tooLarge for extremely large programs', async () => {
      // Generate enough source to exceed 32KB URL limit after compression.
      // Use non-repetitive content so compression is less effective.
      const parts: string[] = []
      for (let i = 0; i < 5000; i++) {
        parts.push(`${i} REM line ${i} unique content ${Math.random()}\n`)
      }
      const source = parts.join('')
      const result = await encodeProgram(source, undefined, {
        baseUrl: TEST_BASE_URL,
      })

      expect(result.tooLarge).toBe(true)
    })

    it('reports not tooLarge for small programs', async () => {
      const result = await encodeProgram('10 PRINT "HI"', undefined, {
        baseUrl: TEST_BASE_URL,
      })

      expect(result.tooLarge).toBe(false)
    })
  })

  // ========================================================================
  // decodeProgram - plain
  // ========================================================================

  describe('decodeProgram (plain)', () => {
    it('decodes a plain-encoded program', async () => {
      const source = '10 LET A=5\n20 PRINT A'
      const encoded = await encodeProgram(source, undefined, {
        baseUrl: TEST_BASE_URL,
      })
      const decoded = await decodeProgram(encoded.encoded)

      expect(decoded.c).toEqual(source)
    })

    it('decodes empty source code', async () => {
      const encoded = await encodeProgram('', undefined, {
        baseUrl: TEST_BASE_URL,
      })
      const decoded = await decodeProgram(encoded.encoded)

      expect(decoded.c).toEqual('')
    })

    it('preserves special characters in source', async () => {
      const source = '10 PRINT "Hello!@#$%^&*()_+-={}[]|:;<>,.?/~`\n20 REM \u00e9\u00e8\u00ea'
      const encoded = await encodeProgram(source, undefined, {
        baseUrl: TEST_BASE_URL,
      })
      const decoded = await decodeProgram(encoded.encoded)

      expect(decoded.c).toEqual(source)
    })
  })

  // ========================================================================
  // decodeProgram - compressed
  // ========================================================================

  describe('decodeProgram (compressed)', () => {
    it('decodes a compressed program', async () => {
      const source = longSource(5000)
      const encoded = await encodeProgram(source, undefined, {
        baseUrl: TEST_BASE_URL,
      })
      const decoded = await decodeProgram(encoded.encoded)

      expect(decoded.c).toEqual(source)
    })
  })

  // ========================================================================
  // decodeProgram - error handling
  // ========================================================================

  describe('decodeProgram (errors)', () => {
    it('throws ProgramDecodeError for empty string', async () => {
      await expect(decodeProgram('')).rejects.toThrow(ProgramDecodeError)
      await expect(decodeProgram('')).rejects.toThrow('No program data provided')
    })

    it('throws ProgramDecodeError for invalid base64', async () => {
      await expect(decodeProgram('!!!invalid-base64!!!')).rejects.toThrow(ProgramDecodeError)
      await expect(decodeProgram('!!!invalid-base64!!!')).rejects.toThrow('not valid base64')
    })

    it('throws ProgramDecodeError for valid base64 but invalid JSON', async () => {
      // "AAAA" decodes to 3 null bytes, which is not valid JSON
      await expect(decodeProgram('AAAA')).rejects.toThrow(ProgramDecodeError)
      await expect(decodeProgram('AAAA')).rejects.toThrow('not valid JSON')
    })

    it('throws ProgramDecodeError for JSON without source code', async () => {
      // '{"x":1}' is valid JSON but has no "c" field
      const encoded = btoa(JSON.stringify({ x: 1 }))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
      await expect(decodeProgram(encoded)).rejects.toThrow('missing source code')
    })

    it('throws ProgramDecodeError for invalid version byte', async () => {
      // Create a compressed payload with wrong version byte
      const json = new TextEncoder().encode(JSON.stringify({ c: 'test' }))
      const blob = new Blob([json])
      const stream = blob.stream().pipeThrough(new CompressionStream('gzip'))
      const compressed = new Uint8Array(await new Response(stream).arrayBuffer())

      // Prepend wrong version (0xFF instead of 0x01)
      const payload = new Uint8Array(1 + compressed.length)
      payload[0] = 0xFF
      payload.set(compressed, 1)

      // Encode as base64url with 'z' prefix
      let binary = ''
      for (let i = 0; i < payload.length; i++) {
        binary += String.fromCharCode(payload[i] as number)
      }
      const encoded = `z${  btoa(binary)
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')}`

      await expect(decodeProgram(encoded)).rejects.toThrow('Unsupported format version')
    })

    it('throws ProgramDecodeError for truncated compressed data', async () => {
      // Just the 'z' prefix with incomplete data
      await expect(decodeProgram('zAQID')).rejects.toThrow(ProgramDecodeError)
      await expect(decodeProgram('zAQID')).rejects.toThrow('decompression failed')
    })

    it('ignores invalid BG data gracefully', async () => {
      // Valid JSON with source but malformed BG data
      const payload = { c: '10 PRINT "X"', b: { bad: true } }
      const encoded = btoa(JSON.stringify(payload))
        .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

      const decoded = await decodeProgram(encoded)
      expect(decoded.c).toEqual('10 PRINT "X"')
      expect(decoded.b).toBeUndefined()
    })
  })

  // ========================================================================
  // Cross-format round-trip
  // ============================================================================

  describe('round-trip across formats', () => {
    it('medium program with BG data round-trips correctly', async () => {
      const source = longSource(2500)
      const bg = makeFakeBg()
      const result = await encodeProgram(source, bg, {
        baseUrl: TEST_BASE_URL,
      })

      const decoded = await decodeProgram(result.encoded)
      expect(decoded.c).toEqual(source)
      expect(decoded.b).toEqual(bg)
    })

    it('unicode content round-trips correctly', async () => {
      const source = '10 REM \u3053\u3093\u306b\u3061\u306f\u4e16\u754c\n20 PRINT "\u00dc\u00f6\u00e4"'
      const result = await encodeProgram(source, undefined, {
        baseUrl: TEST_BASE_URL,
      })

      const decoded = await decodeProgram(result.encoded)
      expect(decoded.c).toEqual(source)
    })
  })
})
