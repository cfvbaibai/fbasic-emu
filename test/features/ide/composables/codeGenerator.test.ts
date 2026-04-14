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

describe('generatePlayCode', () => {
  // -------------------------------------------------------------------------
  // Empty state
  // -------------------------------------------------------------------------

  describe('empty state', () => {
    it('returns no lines when all channels are empty', () => {
      const state = makeState()

      const lines = generatePlayCode(state)

      expect(lines).toEqual([])
    })

    it('returns only REM title when channels are empty', () => {
      const state = makeState({ title: 'My Song' })

      const lines = generatePlayCode(state)

      expect(lines).toEqual(['10 REM My Song'])
    })
  })

  // -------------------------------------------------------------------------
  // Single note generation
  // -------------------------------------------------------------------------

  describe('single note', () => {
    it('generates PLAY statement with tempo, envelope, octave, and note', () => {
      const notes: NoteCellKey[] = [createNoteCellKey(11, 0)] // C5
      const state = makeState({
        channelNotes: [notes, [], []],
        channelOctaves: [4, 4, 4],
      })

      const lines = generatePlayCode(state)

      expect(lines).toEqual([
        '10 PLAY "T5M0V15O5C5"',
      ])
    })

    it('generates correct note for D4 (index 21)', () => {
      const notes: NoteCellKey[] = [createNoteCellKey(21, 0)]
      const state = makeState({
        channelNotes: [notes, [], []],
        channelOctaves: [4, 4, 4],
      })

      const lines = generatePlayCode(state)

      expect(lines).toEqual([
        '10 PLAY "T5M0V15D5"',
      ])
    })

    it('generates correct note for sharp F#4 (index 17)', () => {
      const notes: NoteCellKey[] = [createNoteCellKey(17, 0)]
      const state = makeState({
        channelNotes: [notes, [], []],
        channelOctaves: [4, 4, 4],
      })

      const lines = generatePlayCode(state)

      expect(lines).toEqual([
        '10 PLAY "T5M0V15#F5"',
      ])
    })

    it('generates correct note for C3 (index 35)', () => {
      const notes: NoteCellKey[] = [createNoteCellKey(35, 0)]
      const state = makeState({
        channelNotes: [notes, [], []],
        channelOctaves: [3, 4, 4],
      })

      const lines = generatePlayCode(state)

      expect(lines).toEqual([
        '10 PLAY "T5M0V15O3C5"',
      ])
    })

    it('generates correct note for B5 (index 0)', () => {
      const notes: NoteCellKey[] = [createNoteCellKey(0, 0)]
      const state = makeState({
        channelNotes: [notes, [], []],
        channelOctaves: [5, 4, 4],
      })

      const lines = generatePlayCode(state)

      expect(lines).toEqual([
        '10 PLAY "T5M0V15O5B5"',
      ])
    })
  })

  // -------------------------------------------------------------------------
  // Multiple notes and rests
  // -------------------------------------------------------------------------

  describe('multiple notes', () => {
    it('generates sequential notes sorted by step index', () => {
      const notes: NoteCellKey[] = [
        createNoteCellKey(23, 0), // C4
        createNoteCellKey(19, 1), // E4
        createNoteCellKey(16, 2), // G4
      ]
      const state = makeState({
        channelNotes: [notes, [], []],
      })

      const lines = generatePlayCode(state)

      expect(lines).toEqual([
        '10 PLAY "T5M0V15C5E5G5"',
      ])
    })

    it('inserts rests for gaps between notes', () => {
      const notes: NoteCellKey[] = [
        createNoteCellKey(23, 0), // C4
        createNoteCellKey(16, 2), // G4
      ]
      const state = makeState({
        channelNotes: [notes, [], []],
      })

      const lines = generatePlayCode(state)

      expect(lines).toEqual([
        '10 PLAY "T5M0V15C5R5G5"',
      ])
    })

    it('inserts rests from the beginning when first note is not at step 0', () => {
      const notes: NoteCellKey[] = [createNoteCellKey(19, 2)] // E4
      const state = makeState({
        channelNotes: [notes, [], []],
      })

      const lines = generatePlayCode(state)

      expect(lines).toEqual([
        '10 PLAY "T5M0V15R5R5E5"',
      ])
    })

    it('does not add trailing rests after the last note', () => {
      const notes: NoteCellKey[] = [createNoteCellKey(23, 0)] // C4
      const state = makeState({
        channelNotes: [notes, [], []],
        steps: 16,
      })

      const lines = generatePlayCode(state)

      expect(lines).toEqual([
        '10 PLAY "T5M0V15C5"',
      ])
    })
  })

  // -------------------------------------------------------------------------
  // Octave changes
  // -------------------------------------------------------------------------

  describe('octave changes', () => {
    it('inserts octave prefix when note crosses octave boundary up', () => {
      const notes: NoteCellKey[] = [
        createNoteCellKey(12, 0), // B4
        createNoteCellKey(11, 1), // C5
      ]
      const state = makeState({
        channelNotes: [notes, [], []],
        channelOctaves: [4, 4, 4],
      })

      const lines = generatePlayCode(state)

      expect(lines).toEqual([
        '10 PLAY "T5M0V15B5O5C5"',
      ])
    })

    it('inserts octave prefix when note crosses octave boundary down', () => {
      const notes: NoteCellKey[] = [
        createNoteCellKey(11, 0), // C5
        createNoteCellKey(12, 1), // B4
      ]
      const state = makeState({
        channelNotes: [notes, [], []],
        channelOctaves: [5, 4, 4],
      })

      const lines = generatePlayCode(state)

      expect(lines).toEqual([
        '10 PLAY "T5M0V15O5C5O4B5"',
      ])
    })
  })

  // -------------------------------------------------------------------------
  // Duration mapping
  // -------------------------------------------------------------------------

  describe('duration mapping', () => {
    it.each([
      ['1/16', '1'],
      ['1/8', '3'],
      ['1/4', '5'],
      ['1/2', '7'],
      ['1', '9'],
    ] as const)('maps duration %s to length %s', (duration, expectedLength) => {
      const notes: NoteCellKey[] = [createNoteCellKey(23, 0)]
      const state = makeState({
        duration,
        channelNotes: [notes, [], []],
      })

      const lines = generatePlayCode(state)

      expect(lines[0]).toContain(`C${expectedLength}"`)
    })

    it('falls back to length 5 for unrecognized duration', () => {
      const notes: NoteCellKey[] = [createNoteCellKey(23, 0)]
      const state = makeState({
        duration: 'invalid',
        channelNotes: [notes, [], []],
      })

      const lines = generatePlayCode(state)

      expect(lines[0]).toContain('C5"')
    })
  })

  // -------------------------------------------------------------------------
  // Envelope mapping
  // -------------------------------------------------------------------------

  describe('envelope mapping', () => {
    it('maps "none" to M0V15', () => {
      const notes: NoteCellKey[] = [createNoteCellKey(23, 0)]
      const state = makeState({
        envelope: 'none',
        channelNotes: [notes, [], []],
      })

      const lines = generatePlayCode(state)

      expect(lines[0]).toContain('M0V15')
    })

    it('maps "short" to M1V3', () => {
      const notes: NoteCellKey[] = [createNoteCellKey(23, 0)]
      const state = makeState({
        envelope: 'short',
        channelNotes: [notes, [], []],
      })

      const lines = generatePlayCode(state)

      expect(lines[0]).toContain('M1V3')
    })

    it('maps "medium" to M1V7', () => {
      const notes: NoteCellKey[] = [createNoteCellKey(23, 0)]
      const state = makeState({
        envelope: 'medium',
        channelNotes: [notes, [], []],
      })

      const lines = generatePlayCode(state)

      expect(lines[0]).toContain('M1V7')
    })

    it('maps "long" to M1V15', () => {
      const notes: NoteCellKey[] = [createNoteCellKey(23, 0)]
      const state = makeState({
        envelope: 'long',
        channelNotes: [notes, [], []],
      })

      const lines = generatePlayCode(state)

      expect(lines[0]).toContain('M1V15')
    })

    it('falls back to M0V15 for unrecognized envelope', () => {
      const notes: NoteCellKey[] = [createNoteCellKey(23, 0)]
      const state = makeState({
        envelope: 'invalid',
        channelNotes: [notes, [], []],
      })

      const lines = generatePlayCode(state)

      expect(lines[0]).toContain('M0V15')
    })
  })

  // -------------------------------------------------------------------------
  // Tempo mapping
  // -------------------------------------------------------------------------

  describe('tempo mapping', () => {
    it('maps tempo 120 to T5', () => {
      const notes: NoteCellKey[] = [createNoteCellKey(23, 0)]
      const state = makeState({
        tempo: 120,
        channelNotes: [notes, [], []],
      })

      const lines = generatePlayCode(state)

      expect(lines[0]).toContain('T5')
    })

    it('maps tempo 40 to T8', () => {
      const notes: NoteCellKey[] = [createNoteCellKey(23, 0)]
      const state = makeState({
        tempo: 40,
        channelNotes: [notes, [], []],
      })

      const lines = generatePlayCode(state)

      expect(lines[0]).toContain('T8')
    })

    it('maps tempo 240 to T1', () => {
      const notes: NoteCellKey[] = [createNoteCellKey(23, 0)]
      const state = makeState({
        tempo: 240,
        channelNotes: [notes, [], []],
      })

      const lines = generatePlayCode(state)

      expect(lines[0]).toContain('T1')
    })

    it.each([
      [0, 'T8'],
      [-100, 'T8'],
      [39, 'T8'],
      [241, 'T1'],
      [300, 'T1'],
      [999, 'T1'],
    ] as const)('clamps out-of-range tempo %i to %s', (tempo, expectedT) => {
      const notes: NoteCellKey[] = [createNoteCellKey(23, 0)]
      const state = makeState({
        tempo,
        channelNotes: [notes, [], []],
      })

      const lines = generatePlayCode(state)

      expect(lines[0]).toContain(expectedT)
    })
  })
})
