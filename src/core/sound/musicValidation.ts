/**
 * Music DSL Validation
 *
 * Validates PLAY command music strings for correct syntax.
 * F-BASIC raises SN (Syntax) error for invalid music strings.
 */

/**
 * Valid characters in PLAY music string (excluding colon which is channel separator)
 */
const VALID_MUSIC_CHARS = new Set([
  'A',
  'B',
  'C',
  'D',
  'E',
  'F',
  'G', // Notes
  'O',
  'T',
  'Y',
  'M',
  'V',
  'R', // Commands
  '#', // Sharp
  '0',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9', // Digits
  ' ', // Space (ignored)
])

/**
 * Validate a music string and throw error if invalid format
 * F-BASIC raises SN (Syntax) error for invalid music strings
 *
 * Validates:
 * - Invalid characters
 * - Tempo: T1-T8
 * - Octave: O0-O5
 * - Duty: Y0-Y3
 * - Envelope: M0-M1
 * - Volume: V0-V15
 * - Length codes: 0-9
 * - Sharp notes: #C, #D, #F, #G, #A, #B, #E (all sharps supported)
 */
export function validateMusicString(musicString: string): void {
  const input = musicString.toUpperCase()
  let i = 0

  while (i < input.length) {
    const char = input[i]!

    // Skip spaces
    if (char === ' ') {
      i++
      continue
    }

    // Colon is channel separator
    if (char === ':') {
      i++
      continue
    }

    // Check for invalid characters
    if (!VALID_MUSIC_CHARS.has(char)) {
      throw new Error(`Invalid character '${char}' in PLAY string at position ${i + 1}`)
    }

    // Validate Tempo: T1-T8
    if (char === 'T') {
      i++
      const match = input.slice(i).match(/^(\d+)/)
      if (!match?.[1]) {
        throw new Error(`Tempo value required after T at position ${i + 1}`)
      }
      const value = parseInt(match[1], 10)
      if (value < 1 || value > 8) {
        throw new Error(`Invalid tempo T${value}: must be 1-8`)
      }
      i += match[1].length
      continue
    }

    // Validate Octave: O0-O5
    if (char === 'O') {
      i++
      const match = input.slice(i).match(/^(\d+)/)
      if (!match?.[1]) {
        throw new Error(`Octave value required after O at position ${i + 1}`)
      }
      const value = parseInt(match[1], 10)
      if (value < 0 || value > 5) {
        throw new Error(`Invalid octave O${value}: must be 0-5`)
      }
      i += match[1].length
      continue
    }

    // Validate Duty: Y0-Y3
    if (char === 'Y') {
      i++
      const match = input.slice(i).match(/^(\d+)/)
      if (!match?.[1]) {
        throw new Error(`Duty value required after Y at position ${i + 1}`)
      }
      const value = parseInt(match[1], 10)
      if (value < 0 || value > 3) {
        throw new Error(`Invalid duty Y${value}: must be 0-3`)
      }
      i += match[1].length
      continue
    }

    // Validate Envelope: M0-M1
    if (char === 'M') {
      i++
      const match = input.slice(i).match(/^(\d+)/)
      if (!match?.[1]) {
        throw new Error(`Envelope value required after M at position ${i + 1}`)
      }
      const value = parseInt(match[1], 10)
      if (value < 0 || value > 1) {
        throw new Error(`Invalid envelope M${value}: must be 0-1`)
      }
      i += match[1].length
      continue
    }

    // Validate Volume: V0-V15
    if (char === 'V') {
      i++
      const match = input.slice(i).match(/^(\d+)/)
      if (!match?.[1]) {
        throw new Error(`Volume value required after V at position ${i + 1}`)
      }
      const value = parseInt(match[1], 10)
      if (value < 0 || value > 15) {
        throw new Error(`Invalid volume V${value}: must be 0-15`)
      }
      i += match[1].length
      continue
    }

    // Validate Sharp: # must be followed by a valid note (C, D, E, F, G, A, B)
    if (char === '#') {
      i++
      const nextChar = input[i]
      if (!nextChar) {
        throw new Error(`Sharp (#) at position ${i} must be followed by a note`)
      }
      if (!'CDEFGAB'.includes(nextChar)) {
        throw new Error(
          `Invalid sharp #${nextChar} at position ${i}: # must be followed by a note (C, D, E, F, G, A, B)`
        )
      }
      i++
      // Optional length code
      if (input[i] && /[0-9]/.test(input[i]!)) {
        i++
      }
      continue
    }

    // Rest: R with optional length
    if (char === 'R') {
      i++
      if (input[i] && /[0-9]/.test(input[i]!)) {
        i++
      }
      continue
    }

    // Natural notes: C, D, E, F, G, A, B with optional length
    if ('CDEFGAB'.includes(char)) {
      i++
      if (input[i] && /[0-9]/.test(input[i]!)) {
        i++
      }
      continue
    }

    // Digits should only appear after commands/notes
    if (/[0-9]/.test(char)) {
      throw new Error(
        `Unexpected digit '${char}' at position ${i}: digits must follow a command or note`
      )
    }

    i++
  }
}
