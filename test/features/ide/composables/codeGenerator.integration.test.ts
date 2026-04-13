import { describe, expect, it } from 'vitest'

import type { NoteCellKey } from '@/features/ide/components/pianoRollConstants'
import { createNoteCellKey } from '@/features/ide/components/pianoRollConstants'
import type { ComposerState } from '@/features/ide/composables/codeGenerator'
import { generatePlayCode } from '@/features/ide/composables/codeGenerator'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeState(
  overrides: Partial<ComposerState> = {}
): ComposerState {
  return {
    tempo: 120,
    steps: 16,
    duration: '1/4',
    envelope: 'none',
    title: '',
    channelNotes: [[], [], []],
    channelOctaves: [4, 4, 4],
    ...overrides,
  }
}

// NOTE_NAMES index reference (reversed order, 0=B5 highest, 35=C3 lowest):
//   0: B5   1: A#5  2: A5   3: G#5  4: G5   5: F#5  6: F5   7: E5
//   8: D#5  9: D5  10: C#5 11: C5  12: B4  13: A#4 14: A4  15: G#4
//  16: G4  17: F#4 18: F4  19: E4  20: D#4 21: D4  22: C#4 23: C4
//  24: B3  25: A#3 26: A3  27: G#3 28: G3  29: F#3 30: F3  31: E3
//  32: D#3 33: D3  34: C#3 35: C3

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('generatePlayCode integration', () => {
  // -------------------------------------------------------------------------
  // Multi-channel output
  // -------------------------------------------------------------------------

  describe('multi-channel', () => {
    it('joins channel strings with colon separator', () => {
      const ch0Notes: NoteCellKey[] = [createNoteCellKey(23, 0)] // C4
      const ch1Notes: NoteCellKey[] = [createNoteCellKey(16, 0)] // G4
      const state = makeState({
        channelNotes: [ch0Notes, ch1Notes, []],
      })

      const lines = generatePlayCode(state)

      expect(lines).toEqual([
        '10 PLAY "T5M0V15C5:G5"',
      ])
    })

    it('handles all 3 channels', () => {
      const ch0Notes: NoteCellKey[] = [createNoteCellKey(23, 0)] // C4
      const ch1Notes: NoteCellKey[] = [createNoteCellKey(16, 0)] // G4
      const ch2Notes: NoteCellKey[] = [createNoteCellKey(19, 0)] // E4
      const state = makeState({
        channelNotes: [ch0Notes, ch1Notes, ch2Notes],
      })

      const lines = generatePlayCode(state)

      expect(lines).toEqual([
        '10 PLAY "T5M0V15C5:G5:E5"',
      ])
    })

    it('only includes channels with notes', () => {
      const ch2Notes: NoteCellKey[] = [createNoteCellKey(19, 0)] // E4
      const state = makeState({
        channelNotes: [[], [], ch2Notes],
      })

      const lines = generatePlayCode(state)

      expect(lines).toEqual([
        '10 PLAY "T5M0V15E5"',
      ])
    })

    it('uses note octave from note name, not channel octave', () => {
      const ch0Notes: NoteCellKey[] = [createNoteCellKey(23, 0)] // C4 (octave 4)
      const ch1Notes: NoteCellKey[] = [createNoteCellKey(11, 0)] // C5 (octave 5)
      const state = makeState({
        channelNotes: [ch0Notes, ch1Notes, []],
        channelOctaves: [3, 5, 4],
      })

      const lines = generatePlayCode(state)

      // Note octave comes from the note name, not the channel setting
      expect(lines).toEqual([
        '10 PLAY "T5M0V15C5:O5C5"',
      ])
    })
  })

  // -------------------------------------------------------------------------
  // Title / REM
  // -------------------------------------------------------------------------

  describe('title handling', () => {
    it('includes REM line with title when title is set', () => {
      const notes: NoteCellKey[] = [createNoteCellKey(23, 0)]
      const state = makeState({
        title: 'Mary Had a Little Lamb',
        channelNotes: [notes, [], []],
      })

      const lines = generatePlayCode(state)

      expect(lines).toEqual([
        '10 REM Mary Had a Little Lamb',
        '20 PLAY "T5M0V15C5"',
      ])
    })
  })

  // -------------------------------------------------------------------------
  // Line numbering
  // -------------------------------------------------------------------------

  describe('line numbering', () => {
    it('numbers lines starting at 10 with step 10', () => {
      const ch0Notes: NoteCellKey[] = [
        createNoteCellKey(23, 0),
        createNoteCellKey(19, 1),
      ]
      const state = makeState({
        title: 'Test',
        channelNotes: [ch0Notes, [], []],
      })

      const lines = generatePlayCode(state)

      expect(lines[0]).toMatch(/^10 /)
      expect(lines[1]).toMatch(/^20 /)
    })
  })

  // -------------------------------------------------------------------------
  // Long PLAY string splitting
  // -------------------------------------------------------------------------

  describe('long string handling', () => {
    it('splits long PLAY string and concatenates all chunks', () => {
      const notes: NoteCellKey[] = []
      for (let step = 0; step < 16; step++) {
        notes.push(createNoteCellKey(23, step))
      }
      const state = makeState({
        channelNotes: [notes, [], []],
      })

      const lines = generatePlayCode(state)

      expect(lines.length).toBeGreaterThanOrEqual(3)
      const lastLine = lines[lines.length - 1]
      expect(lastLine).toMatch(/PLAY [A-Z]\$\+[A-Z]\$/)

      // Verify all notes are present across variable assignments (no data loss)
      const varAssignments = lines.filter((l) => l.includes('$="'))
      const totalNoteChars = varAssignments.reduce((sum, line) => {
        const match = line.match(/\$="([^"]*)"/)
        return sum + (match?.[1] ? match[1].replace(/^T\dM\dV\d+/, '').length : 0)
      }, 0)
      // 16 notes × 2 chars each (C5) = 32 note characters
      expect(totalNoteChars).toEqual(32)
    })

    it('uses inline PLAY for short strings', () => {
      const notes: NoteCellKey[] = [createNoteCellKey(23, 0)]
      const state = makeState({
        channelNotes: [notes, [], []],
      })

      const lines = generatePlayCode(state)

      expect(lines).toEqual([
        '10 PLAY "T5M0V15C5"',
      ])
    })
  })
})
