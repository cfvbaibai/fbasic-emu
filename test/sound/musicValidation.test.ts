/**
 * Unit tests for validateMusicString()
 *
 * Directly tests the PLAY command music string validator from musicValidation.ts.
 * Covers all validation rules: invalid characters, command range checks,
 * sharp note validation, rest/note parsing, and edge cases.
 */

import { describe, expect, test } from 'vitest'

import { validateMusicString } from '@/core/sound/musicValidation'

// ============================================================================
// Valid strings - should not throw
// ============================================================================

describe('validateMusicString - valid strings', () => {
  test('accepts empty string', () => {
    expect(() => validateMusicString('')).not.toThrow()
  })

  test('accepts whitespace-only string', () => {
    expect(() => validateMusicString('   ')).not.toThrow()
  })

  test('accepts single natural note', () => {
    expect(() => validateMusicString('C')).not.toThrow()
  })

  test('accepts all natural notes', () => {
    expect(() => validateMusicString('CDEFGAB')).not.toThrow()
  })

  test('accepts notes with length codes', () => {
    expect(() => validateMusicString('C1D2E4G8')).not.toThrow()
  })

  test('accepts rest without length', () => {
    expect(() => validateMusicString('R')).not.toThrow()
  })

  test('accepts rest with length codes', () => {
    expect(() => validateMusicString('R1R4R9')).not.toThrow()
  })

  test('accepts spaces between notes', () => {
    expect(() => validateMusicString('C D E F G')).not.toThrow()
  })

  test('accepts colon channel separator', () => {
    expect(() => validateMusicString('C:E:G')).not.toThrow()
  })

  test('accepts sharp before valid notes', () => {
    expect(() => validateMusicString('#C#D#E#F#G#A#B')).not.toThrow()
  })

  test('accepts sharp note with length code', () => {
    expect(() => validateMusicString('#C4')).not.toThrow()
  })

  test('accepts all commands in sequence', () => {
    expect(() => validateMusicString('T3O2Y2M0V15CDEFG')).not.toThrow()
  })

  test('normalizes lowercase to uppercase', () => {
    expect(() => validateMusicString('cde')).not.toThrow()
  })

  test('accepts note after command', () => {
    expect(() => validateMusicString('T4C')).not.toThrow()
    expect(() => validateMusicString('O3G')).not.toThrow()
    expect(() => validateMusicString('V10A')).not.toThrow()
  })
})

// ============================================================================
// Invalid characters
// ============================================================================

describe('validateMusicString - invalid characters', () => {
  test('rejects letter Z', () => {
    expect(() => validateMusicString('AZ')).toThrow(
      "Invalid character 'Z' in PLAY string at position 2"
    )
  })

  test('rejects letter X', () => {
    expect(() => validateMusicString('CX')).toThrow(
      "Invalid character 'X' in PLAY string at position 2"
    )
  })

  test('rejects letter P', () => {
    expect(() => validateMusicString('P')).toThrow(
      "Invalid character 'P' in PLAY string at position 1"
    )
  })

  test('rejects special character @', () => {
    expect(() => validateMusicString('C@D')).toThrow(
      "Invalid character '@' in PLAY string at position 2"
    )
  })

  test('rejects special character !', () => {
    expect(() => validateMusicString('!')).toThrow(
      "Invalid character '!' in PLAY string at position 1"
    )
  })

  test('rejects special character -', () => {
    expect(() => validateMusicString('C-D')).toThrow(
      "Invalid character '-' in PLAY string at position 2"
    )
  })

  test('rejects lowercase invalid character (normalized before check)', () => {
    expect(() => validateMusicString('aaaz')).toThrow(
      "Invalid character 'Z' in PLAY string at position 4"
    )
  })
})

// ============================================================================
// Tempo validation (T1-T8)
// ============================================================================

describe('validateMusicString - tempo (T)', () => {
  test('accepts lower boundary T1', () => {
    expect(() => validateMusicString('T1C')).not.toThrow()
  })

  test('accepts upper boundary T8', () => {
    expect(() => validateMusicString('T8C')).not.toThrow()
  })

  test('accepts mid-range T4', () => {
    expect(() => validateMusicString('T4C')).not.toThrow()
  })

  test('rejects T0 (below range)', () => {
    expect(() => validateMusicString('T0C')).toThrow('Invalid tempo T0: must be 1-8')
  })

  test('rejects T9 (above range)', () => {
    expect(() => validateMusicString('T9C')).toThrow('Invalid tempo T9: must be 1-8')
  })

  test('rejects T99 (well above range)', () => {
    expect(() => validateMusicString('T99C')).toThrow('Invalid tempo T99: must be 1-8')
  })

  test('rejects T without following digit', () => {
    expect(() => validateMusicString('TC')).toThrow('Tempo value required after T at position 2')
  })

  test('rejects T at end of string', () => {
    expect(() => validateMusicString('CT')).toThrow('Tempo value required after T at position 3')
  })

  test('accepts multi-digit tempo T12 parsed as value 12', () => {
    // T12 parses as value 12 (two digits), which is > 8
    expect(() => validateMusicString('T12C')).toThrow('Invalid tempo T12: must be 1-8')
  })
})

// ============================================================================
// Octave validation (O0-O5)
// ============================================================================

describe('validateMusicString - octave (O)', () => {
  test('accepts lower boundary O0', () => {
    expect(() => validateMusicString('O0C')).not.toThrow()
  })

  test('accepts upper boundary O5', () => {
    expect(() => validateMusicString('O5C')).not.toThrow()
  })

  test('accepts mid-range O2', () => {
    expect(() => validateMusicString('O2C')).not.toThrow()
  })

  test('rejects O6 (above range)', () => {
    expect(() => validateMusicString('O6C')).toThrow('Invalid octave O6: must be 0-5')
  })

  test('rejects O9 (well above range)', () => {
    expect(() => validateMusicString('O9C')).toThrow('Invalid octave O9: must be 0-5')
  })

  test('rejects O without following digit', () => {
    expect(() => validateMusicString('OC')).toThrow('Octave value required after O at position 2')
  })

  test('rejects O at end of string', () => {
    expect(() => validateMusicString('CO')).toThrow('Octave value required after O at position 3')
  })
})

// ============================================================================
// Duty validation (Y0-Y3)
// ============================================================================

describe('validateMusicString - duty (Y)', () => {
  test('accepts lower boundary Y0', () => {
    expect(() => validateMusicString('Y0C')).not.toThrow()
  })

  test('accepts upper boundary Y3', () => {
    expect(() => validateMusicString('Y3C')).not.toThrow()
  })

  test('rejects Y4 (above range)', () => {
    expect(() => validateMusicString('Y4C')).toThrow('Invalid duty Y4: must be 0-3')
  })

  test('rejects Y9 (well above range)', () => {
    expect(() => validateMusicString('Y9C')).toThrow('Invalid duty Y9: must be 0-3')
  })

  test('rejects Y without following digit', () => {
    expect(() => validateMusicString('YC')).toThrow('Duty value required after Y at position 2')
  })

  test('rejects Y at end of string', () => {
    expect(() => validateMusicString('CY')).toThrow('Duty value required after Y at position 3')
  })
})

// ============================================================================
// Envelope validation (M0-M1)
// ============================================================================

describe('validateMusicString - envelope (M)', () => {
  test('accepts M0', () => {
    expect(() => validateMusicString('M0C')).not.toThrow()
  })

  test('accepts M1', () => {
    expect(() => validateMusicString('M1C')).not.toThrow()
  })

  test('rejects M2 (above range)', () => {
    expect(() => validateMusicString('M2C')).toThrow('Invalid envelope M2: must be 0-1')
  })

  test('rejects M9 (well above range)', () => {
    expect(() => validateMusicString('M9C')).toThrow('Invalid envelope M9: must be 0-1')
  })

  test('rejects M without following digit', () => {
    expect(() => validateMusicString('MC')).toThrow('Envelope value required after M at position 2')
  })

  test('rejects M at end of string', () => {
    expect(() => validateMusicString('CM')).toThrow('Envelope value required after M at position 3')
  })
})

// ============================================================================
// Volume validation (V0-V15)
// ============================================================================

describe('validateMusicString - volume (V)', () => {
  test('accepts lower boundary V0', () => {
    expect(() => validateMusicString('V0C')).not.toThrow()
  })

  test('accepts upper boundary V15', () => {
    expect(() => validateMusicString('V15C')).not.toThrow()
  })

  test('accepts mid-range V7', () => {
    expect(() => validateMusicString('V7C')).not.toThrow()
  })

  test('rejects V16 (above range)', () => {
    expect(() => validateMusicString('V16C')).toThrow('Invalid volume V16: must be 0-15')
  })

  test('rejects V99 (well above range)', () => {
    expect(() => validateMusicString('V99C')).toThrow('Invalid volume V99: must be 0-15')
  })

  test('rejects V without following digit', () => {
    expect(() => validateMusicString('VC')).toThrow('Volume value required after V at position 2')
  })

  test('rejects V at end of string', () => {
    expect(() => validateMusicString('CV')).toThrow('Volume value required after V at position 3')
  })
})

// ============================================================================
// Sharp note validation
// ============================================================================

describe('validateMusicString - sharp (#)', () => {
  test('accepts #C', () => {
    expect(() => validateMusicString('#C')).not.toThrow()
  })

  test('accepts #D', () => {
    expect(() => validateMusicString('#D')).not.toThrow()
  })

  test('accepts #E (E sharp = F)', () => {
    expect(() => validateMusicString('#E')).not.toThrow()
  })

  test('accepts #F', () => {
    expect(() => validateMusicString('#F')).not.toThrow()
  })

  test('accepts #G', () => {
    expect(() => validateMusicString('#G')).not.toThrow()
  })

  test('accepts #A', () => {
    expect(() => validateMusicString('#A')).not.toThrow()
  })

  test('accepts #B (B sharp = C)', () => {
    expect(() => validateMusicString('#B')).not.toThrow()
  })

  test('rejects #H (invalid note)', () => {
    expect(() => validateMusicString('#H')).toThrow(
      'Invalid sharp #H at position 1: # must be followed by a note (C, D, E, F, G, A, B)'
    )
  })

  test('rejects #0 (digit after sharp)', () => {
    expect(() => validateMusicString('#0')).toThrow(
      'Invalid sharp #0 at position 1: # must be followed by a note (C, D, E, F, G, A, B)'
    )
  })

  test('rejects # at end of string', () => {
    expect(() => validateMusicString('C#')).toThrow('Sharp (#) at position 2 must be followed by a note')
  })

  test('accepts sharp note followed by length digit', () => {
    expect(() => validateMusicString('#C4')).not.toThrow()
  })

  test('accepts sharp note at end of string after note', () => {
    expect(() => validateMusicString('C#C')).not.toThrow()
  })
})

// ============================================================================
// Rest validation
// ============================================================================

describe('validateMusicString - rest (R)', () => {
  test('accepts R without length', () => {
    expect(() => validateMusicString('R')).not.toThrow()
  })

  test('accepts R with length 1', () => {
    expect(() => validateMusicString('R1')).not.toThrow()
  })

  test('accepts R with length 9', () => {
    expect(() => validateMusicString('R9')).not.toThrow()
  })

  test('accepts multiple rests', () => {
    expect(() => validateMusicString('RRR')).not.toThrow()
  })
})

// ============================================================================
// Natural notes with optional length
// ============================================================================

describe('validateMusicString - natural notes', () => {
  for (const note of ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const) {
    test(`accepts note ${note} without length`, () => {
      expect(() => validateMusicString(note)).not.toThrow()
    })

    test(`accepts note ${note} with length 1`, () => {
      expect(() => validateMusicString(`${note}1`)).not.toThrow()
    })

    test(`accepts note ${note} with length 9`, () => {
      expect(() => validateMusicString(`${note}9`)).not.toThrow()
    })
  }
})

// ============================================================================
// Channel separator (colon)
// ============================================================================

describe('validateMusicString - channel separator', () => {
  test('accepts colon between notes', () => {
    expect(() => validateMusicString('C:E:G')).not.toThrow()
  })

  test('accepts multiple colons', () => {
    expect(() => validateMusicString(':::')).not.toThrow()
  })

  test('accepts colon at start', () => {
    expect(() => validateMusicString(':CDE')).not.toThrow()
  })

  test('accepts colon at end', () => {
    expect(() => validateMusicString('CDE:')).not.toThrow()
  })
})

// ============================================================================
// Standalone digits (must not appear outside commands/notes)
// ============================================================================

describe('validateMusicString - standalone digits', () => {
  test('rejects standalone digit at start', () => {
    expect(() => validateMusicString('5C')).toThrow(
      "Unexpected digit '5' at position 0: digits must follow a command or note"
    )
  })

  test('rejects standalone digit after rest (no double length)', () => {
    // R1 consumes 1 as length, then 5 is standalone
    expect(() => validateMusicString('R15C')).toThrow(
      "Unexpected digit '5' at position 2: digits must follow a command or note"
    )
  })

  test('rejects standalone digit after sharp note with length', () => {
    // #C4 consumes #C then 4 as length, then 5 is standalone
    expect(() => validateMusicString('#C45D')).toThrow(
      "Unexpected digit '5' at position 3: digits must follow a command or note"
    )
  })
})

// ============================================================================
// Complex / real-world strings
// ============================================================================

describe('validateMusicString - complex strings', () => {
  test('accepts typical song fragment', () => {
    expect(() => validateMusicString('T4O3C4D4E4F4G4A4B4')).not.toThrow()
  })

  test('accepts song with sharps and rests', () => {
    expect(() => validateMusicString('T4O3#C4D4R4E4#F4G4')).not.toThrow()
  })

  test('accepts multi-channel song', () => {
    expect(() => validateMusicString('T4O3C4E4G4:O3C4E4G4:O3C4E4G4')).not.toThrow()
  })

  test('accepts all settings before notes', () => {
    expect(() =>
      validateMusicString('T4O2Y1M0V12C D E F G A B R')
    ).not.toThrow()
  })
})
