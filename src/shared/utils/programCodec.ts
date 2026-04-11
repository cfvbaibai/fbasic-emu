/**
 * Program Codec
 *
 * Encodes/decodes F-BASIC programs to/from URL-safe strings for sharing.
 *
 * Encoding strategy:
 * - Small programs (< 2000 chars source): plain base64url
 * - Larger programs: gzip-compressed then base64url
 *
 * Format: base64url(JSON({c: source, b?: CompactBg}))
 * Compressed: base64url(gzip(JSON({c: source, b?: CompactBg})))
 */

import type { CompactBg } from '@/core/types/program-types'

// ============================================================================
// Types
// ============================================================================

/** Payload stored in the share URL */
export interface SharePayload {
  /** F-BASIC source code */
  c: string
  /** Compressed BG data (optional) */
  b?: CompactBg
}

/** Result of encoding a program for sharing */
export interface EncodeResult {
  /** The encoded URL-safe string */
  encoded: string
  /** Whether compression was used */
  compressed: boolean
  /** The full share URL */
  url: string
  /** Whether the program is too large to share (~32KB URL limit) */
  tooLarge: boolean
}

/** Error thrown when decoding a shared program fails */
export class ProgramDecodeError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ProgramDecodeError'
  }
}

// ============================================================================
// Constants
// ============================================================================

/** Source length threshold below which compression is skipped */
const COMPRESSION_THRESHOLD = 2000

/** Maximum safe URL length (browsers handle ~2MB but we limit for usability) */
const MAX_URL_LENGTH = 32_000

/** Version byte prepended to compressed payloads to future-proof the format */
const FORMAT_VERSION = 0x01

// ============================================================================
// Base64URL Encoding/Decoding
// ============================================================================

/**
 * Encode a Uint8Array to a base64url string (no padding)
 */
function uint8ToBase64Url(data: Uint8Array): string {
  let binary = ''
  for (let i = 0; i < data.length; i++) {
    binary += String.fromCharCode(data[i] as number)
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/**
 * Decode a base64url string to a Uint8Array
 */
function base64UrlToUint8(base64url: string): Uint8Array {
  // Restore standard base64 characters
  let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/')
  // Restore padding
  const pad = (4 - (base64.length % 4)) % 4
  base64 += '='.repeat(pad)

  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return bytes
}

// ============================================================================
// Compression (gzip via CompressionStream API)
// ============================================================================

/**
 * Compress data using gzip.
 * Prepends a version byte for future format evolution.
 */
async function gzipCompress(data: Uint8Array): Promise<Uint8Array> {
  const stream = new Blob([data.buffer as ArrayBuffer]).stream().pipeThrough(
    new CompressionStream('gzip')
  )
  const compressed = new Uint8Array(await new Response(stream).arrayBuffer())
  // Prepend version byte
  const result = new Uint8Array(1 + compressed.length)
  result[0] = FORMAT_VERSION as number
  result.set(compressed, 1)
  return result
}

/**
 * Decompress gzip data.
 * Reads the version byte and validates it.
 */
async function gzipDecompress(data: Uint8Array): Promise<Uint8Array> {
  if (data.length < 1) {
    throw new ProgramDecodeError('Compressed data is empty')
  }

  const version = data[0] as number
  if (version !== FORMAT_VERSION) {
    throw new ProgramDecodeError(
      `Unsupported format version: ${version}`
    )
  }

  const payload = data.slice(1)
  const stream = new Blob([payload.buffer]).stream().pipeThrough(
    new DecompressionStream('gzip')
  )
  return new Uint8Array(await new Response(stream).arrayBuffer())
}

// ============================================================================
// Public API
// ============================================================================

/**
 * Encode a program for sharing via URL.
 *
 * @param source - The F-BASIC source code
 * @param bg - Optional compressed BG data
 * @param options - Optional encoding options
 * @param options.baseUrl - Custom base URL (defaults to current page origin)
 * @returns EncodeResult with the encoded string and metadata
 */
export async function encodeProgram(
  source: string,
  bg?: CompactBg,
  options?: { baseUrl?: string },
): Promise<EncodeResult> {
  const payload: SharePayload = { c: source }
  if (bg) {
    payload.b = bg
  }

  const json = JSON.stringify(payload)
  const jsonBytes = new TextEncoder().encode(json)

  // Decide whether to compress based on source length
  const useCompression = source.length >= COMPRESSION_THRESHOLD

  let encoded: string
  if (useCompression) {
    const compressed = await gzipCompress(jsonBytes)
    encoded = `z${  uint8ToBase64Url(compressed)}`
  } else {
    encoded = uint8ToBase64Url(jsonBytes)
  }

  const baseUrl = options?.baseUrl
    ?? `${window.location.origin}${window.location.pathname}#/share/`
  const fullUrl = baseUrl + encoded

  return {
    encoded,
    compressed: useCompression,
    url: fullUrl,
    tooLarge: fullUrl.length > MAX_URL_LENGTH,
  }
}

/**
 * Decode a shared program from a URL-safe string.
 *
 * @param encoded - The encoded string (without the "z" prefix or route path)
 * @returns The decoded program payload
 * @throws ProgramDecodeError if the data is invalid
 */
export async function decodeProgram(encoded: string): Promise<SharePayload> {
  if (!encoded || encoded.length === 0) {
    throw new ProgramDecodeError('No program data provided')
  }

  const isCompressed = encoded.startsWith('z')
  const data = isCompressed ? encoded.slice(1) : encoded

  let bytes: Uint8Array
  try {
    bytes = base64UrlToUint8(data)
  } catch {
    throw new ProgramDecodeError('Invalid program data: not valid base64')
  }

  let jsonBytes: Uint8Array
  try {
    jsonBytes = isCompressed
      ? await gzipDecompress(bytes)
      : bytes
  } catch (err) {
    if (err instanceof ProgramDecodeError) throw err
    throw new ProgramDecodeError(
      `Invalid program data: decompression failed`
    )
  }

  const json = new TextDecoder().decode(jsonBytes)

  let parsed: unknown
  try {
    parsed = JSON.parse(json)
  } catch {
    throw new ProgramDecodeError('Invalid program data: not valid JSON')
  }

  if (typeof parsed !== 'object' || parsed === null) {
    throw new ProgramDecodeError('Invalid program data: expected an object')
  }

  const obj = parsed as Record<string, unknown>

  if (typeof obj.c !== 'string') {
    throw new ProgramDecodeError('Invalid program data: missing source code')
  }

  const payload: SharePayload = { c: obj.c }

  // BG data is optional — validate structure if present
  if (obj.b !== undefined && typeof obj.b === 'object' && obj.b !== null) {
    const bg = obj.b as Record<string, unknown>
    if (
      typeof bg.format === 'string' &&
      typeof bg.data === 'string' &&
      typeof bg.width === 'number' &&
      typeof bg.height === 'number'
    ) {
      payload.b = {
        format: bg.format as CompactBg['format'],
        data: bg.data,
        width: 28,
        height: 21,
      }
    }
  }

  return payload
}
