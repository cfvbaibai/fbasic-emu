/**
 * String Functions
 *
 * Evaluation implementations for all F-BASIC string functions.
 * Extracted from FunctionEvaluator.ts for modularity.
 *
 * Functions: LEN, LEFT$, RIGHT$, MID$, STR$, HEX$, CHR$, ASC
 */

import { getCharacterByCode } from '@/shared/utils/backgroundLookup'

/**
 * Convert a value to an integer.
 * Family Basic only supports integer numerical values.
 */
export function toNumber(value: number | string | boolean | undefined): number {
  if (typeof value === 'number') {
    return Math.trunc(value)
  }
  if (typeof value === 'boolean') return value ? 1 : 0
  if (typeof value === 'string') {
    const parsed = parseFloat(value)
    return isNaN(parsed) ? 0 : Math.trunc(parsed)
  }
  return 0
}

// ============================================================================
// String Functions
// ============================================================================

/** LEN(string) - returns the length of a string */
export function evaluateLen(args: Array<number | string>): number {
  if (args.length !== 1) {
    throw new Error('LEN function requires exactly 1 argument')
  }
  return String(args[0] ?? '').length
}

/** LEFT$(string, n) - returns leftmost n characters */
export function evaluateLeft(args: Array<number | string>): string {
  if (args.length !== 2) {
    throw new Error('LEFT$ function requires exactly 2 arguments')
  }
  const str = String(args[0] ?? '')
  const n = Math.floor(toNumber(args[1]))
  if (n < 0) return ''
  return str.substring(0, n)
}

/** RIGHT$(string, n) - returns rightmost n characters */
export function evaluateRight(args: Array<number | string>): string {
  if (args.length !== 2) {
    throw new Error('RIGHT$ function requires exactly 2 arguments')
  }
  const str = String(args[0] ?? '')
  const n = Math.floor(toNumber(args[1]))
  if (n < 0) return ''
  const start = Math.max(0, str.length - n)
  return str.substring(start)
}

/** MID$(string, start, length) - returns substring at position start with given length */
export function evaluateMid(args: Array<number | string>): string {
  if (args.length !== 3) {
    throw new Error('MID$ function requires exactly 3 arguments')
  }
  const str = String(args[0] ?? '')
  const start = Math.floor(toNumber(args[1]))
  const length = Math.floor(toNumber(args[2]))

  if (start <= 0 || length <= 0) return ''
  const startIndex = start - 1 // BASIC uses 1-based indexing
  if (startIndex >= str.length) return ''
  return str.substring(startIndex, startIndex + length)
}

/** STR$(x) - converts numerical value to string. Adds leading space for positive numbers. */
export function evaluateStr(args: Array<number | string>): string {
  if (args.length !== 1) {
    throw new Error('STR$ function requires exactly 1 argument')
  }
  const num = toNumber(args[0] ?? 0)
  return num >= 0 ? ` ${String(num)}` : String(num)
}

/**
 * HEX$(x) - converts numerical value to hexadecimal string.
 * Input range: -32768 to +32767. Returns uppercase hex without &H prefix.
 */
export function evaluateHex(args: Array<number | string>): string {
  if (args.length !== 1) {
    throw new Error('HEX$ function requires exactly 1 argument')
  }
  let value = toNumber(args[0] ?? 0)
  if (value < 0) value += 65536 // Two's complement
  if (value < 0) value = 0
  if (value > 65535) value = 65535
  return value.toString(16).toUpperCase()
}

/**
 * CHR$(x) - converts character code to character.
 * Input range: 0 to 255. Maps using background items data with String.fromCharCode fallback.
 */
export function evaluateChr(args: Array<number | string>): string {
  if (args.length !== 1) {
    throw new Error('CHR$ function requires exactly 1 argument')
  }
  const charCode = Math.max(0, Math.min(255, Math.trunc(toNumber(args[0] ?? 0))))
  const mappedChar = getCharacterByCode(charCode)
  if (mappedChar !== null) return mappedChar
  return String.fromCharCode(charCode)
}

/**
 * ASC(string) - converts first character to character code.
 * Returns 0 for empty strings. Range: 0-255.
 */
export function evaluateAsc(args: Array<number | string>): number {
  if (args.length !== 1) {
    throw new Error('ASC function requires exactly 1 argument')
  }
  const str = String(args[0] ?? '')
  if (str.length === 0) return 0
  const charCode = str.charCodeAt(0)
  if (charCode < 0) return 0
  if (charCode > 255) return 255
  return charCode
}
