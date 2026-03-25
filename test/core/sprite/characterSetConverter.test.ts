/**
 * characterSetConverter unit tests
 *
 * Covers convertCharacterSetToTiles (string and number input, 8x8 and 16x16,
 * Table A vs Table B) and stringToCharCodes.
 */

import { describe, expect, it } from 'vitest'

import { convertCharacterSetToTiles, stringToCharCodes } from '@/core/sprite/characterSetConverter'

describe('characterSetConverter', () => {
  describe('convertCharacterSetToTiles', () => {
    describe('8x8 sprites (size=0)', () => {
      it('should accept a single-character string', () => {
        // '@' is character code 64, a common sprite character
        const tiles = convertCharacterSetToTiles('@', 0)

        expect(tiles.length).toEqual(1)
        expect(tiles[0]).toBeDefined()
      })

      it('should accept a single-element number array', () => {
        const tiles = convertCharacterSetToTiles([64], 0)

        expect(tiles.length).toEqual(1)
        expect(tiles[0]).toBeDefined()
      })
    })

    describe('16x16 sprites (size=1)', () => {
      it('should accept a 4-character string', () => {
        const tiles = convertCharacterSetToTiles('@ABC', 1)

        expect(tiles.length).toEqual(4)
      })

      it('should accept a 4-element number array', () => {
        const tiles = convertCharacterSetToTiles([64, 65, 66, 67], 1)

        expect(tiles.length).toEqual(4)
      })
    })

    describe('Table A vs Table B', () => {
      it('should use Table A by default (useTableB=false)', () => {
        // Should not throw for valid sprite character code
        expect(() => convertCharacterSetToTiles([64], 0, false)).not.toThrow()
      })

      it('should use Table B when useTableB=true', () => {
        // Should not throw for valid background character code
        expect(() => convertCharacterSetToTiles([64], 0, true)).not.toThrow()
      })
    })

    describe('error cases', () => {
      it('should throw for wrong character count with 8x8 (size=0)', () => {
        expect(() => convertCharacterSetToTiles('@ABC', 0)).toThrow(
          'Invalid character set length: expected 1 for 8\u00d78 sprite, got 4'
        )
      })

      it('should throw for wrong character count with 16x16 (size=1)', () => {
        expect(() => convertCharacterSetToTiles('@', 1)).toThrow(
          'Invalid character set length: expected 4 for 16\u00d716 sprite, got 1'
        )
      })

      it('should throw for empty string with 8x8', () => {
        expect(() => convertCharacterSetToTiles('', 0)).toThrow(
          'Invalid character set length: expected 1 for 8\u00d78 sprite, got 0'
        )
      })

      it('should throw for empty array with 16x16', () => {
        expect(() => convertCharacterSetToTiles([], 1)).toThrow(
          'Invalid character set length: expected 4 for 16\u00d716 sprite, got 0'
        )
      })

      it('should wrap lookup errors with DEF SPRITE prefix for Table A', () => {
        // Use an invalid code that the lookup table cannot resolve
        expect(() => convertCharacterSetToTiles([99999], 0)).toThrow('DEF SPRITE')
      })
    })
  })

  describe('stringToCharCodes', () => {
    it('should convert plain string to char codes', () => {
      expect(stringToCharCodes('ABC')).toEqual([65, 66, 67])
    })

    it('should remove surrounding quotes', () => {
      expect(stringToCharCodes('"ABC"')).toEqual([65, 66, 67])
    })

    it('should handle single character', () => {
      expect(stringToCharCodes('@')).toEqual([64])
    })

    it('should handle quoted single character', () => {
      expect(stringToCharCodes('"@"')).toEqual([64])
    })

    it('should handle empty string', () => {
      expect(stringToCharCodes('')).toEqual([])
    })

    it('should handle only quotes (empty quoted string)', () => {
      expect(stringToCharCodes('""')).toEqual([])
    })
  })
})
