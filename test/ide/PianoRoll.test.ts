// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'

import PianoRoll from '@/features/ide/components/PianoRoll.vue'
import type { NoteCellKey } from '@/features/ide/components/pianoRollConstants'

const WRAPPER_SELECTOR = '.piano-roll'
const GRID_SELECTOR = '.piano-roll__grid'
const CELL_SELECTOR = '.piano-roll__cell'
const LABEL_SELECTOR = '.piano-roll__label'
const ACTIVE_SELECTOR = '.piano-roll__cell--active'

function cellKey(noteIndex: number, stepIndex: number): NoteCellKey {
  return `${noteIndex}-${stepIndex}`
}

function mountPianoRoll(props: {
  modelValue?: Set<NoteCellKey>
  steps?: 16 | 32
} = {}) {
  return mount(PianoRoll, {
    props: {
      modelValue: props.modelValue ?? new Set<NoteCellKey>(),
      steps: props.steps ?? 16,
    },
  })
}

describe('PianoRoll', () => {
  describe('grid rendering', () => {
    it('renders the piano roll container', () => {
      const wrapper = mountPianoRoll()

      expect(wrapper.find(WRAPPER_SELECTOR).exists()).toBe(true)
      wrapper.unmount()
    })

    it('renders the CSS grid', () => {
      const wrapper = mountPianoRoll()

      expect(wrapper.find(GRID_SELECTOR).exists()).toBe(true)
      wrapper.unmount()
    })

    it('renders 36 note labels (C3 to B5)', () => {
      const wrapper = mountPianoRoll()

      const labels = wrapper.findAll(LABEL_SELECTOR)
      expect(labels).toHaveLength(36)
      // Top row should be B5 (highest note displayed first)
      expect(labels[0]!.text()).toEqual('B5')
      // Bottom row should be C3 (lowest note)
      expect(labels[35]!.text()).toEqual('C3')
      wrapper.unmount()
    })

    it('renders correct number of cells (36 notes x 16 steps default)', () => {
      const wrapper = mountPianoRoll()

      const cells = wrapper.findAll(CELL_SELECTOR)
      expect(cells).toHaveLength(36 * 16)
      wrapper.unmount()
    })

    it('renders correct number of cells with 32 steps prop', () => {
      const wrapper = mountPianoRoll({ steps: 32 })

      const cells = wrapper.findAll(CELL_SELECTOR)
      expect(cells).toHaveLength(36 * 32)
      wrapper.unmount()
    })
  })

  describe('note label order (top to bottom: B5 down to C3)', () => {
    it('has C#3 after C3 (ascending within octave)', () => {
      const wrapper = mountPianoRoll()
      const labels = wrapper.findAll(LABEL_SELECTOR)

      // C3 is at index 35 (bottom), C#3 is at index 34
      expect(labels[35]!.text()).toEqual('C3')
      expect(labels[34]!.text()).toEqual('C#3')
      wrapper.unmount()
    })

    it('has C4 after B3 (octave boundary)', () => {
      const wrapper = mountPianoRoll()
      const labels = wrapper.findAll(LABEL_SELECTOR)

      // B3 is at index 24, C4 is at index 23
      expect(labels[24]!.text()).toEqual('B3')
      expect(labels[23]!.text()).toEqual('C4')
      wrapper.unmount()
    })

    it('has full correct sequence for first and last few labels', () => {
      const wrapper = mountPianoRoll()
      const labels = wrapper.findAll(LABEL_SELECTOR)
      const texts = labels.map((l) => l.text())

      // Top 5: B5, A#5, A5, G#5, G5
      expect(texts.slice(0, 5)).toEqual(['B5', 'A#5', 'A5', 'G#5', 'G5'])
      // Bottom 5: E3, D#3, D3, C#3, C3
      expect(texts.slice(-5)).toEqual(['E3', 'D#3', 'D3', 'C#3', 'C3'])
      wrapper.unmount()
    })
  })

  describe('cell data attributes', () => {
    it('sets data-note-index and data-step-index on each cell', () => {
      const wrapper = mountPianoRoll()

      // Check first cell (top-left: note 0 = B5, step 0)
      const firstCell = wrapper.find(CELL_SELECTOR)
      expect(firstCell.attributes('data-note-index')).toEqual('0')
      expect(firstCell.attributes('data-step-index')).toEqual('0')

      // Check a cell in the middle (note 18 = C4, step 4)
      const cell = wrapper.find(
        `${CELL_SELECTOR}[data-note-index="18"][data-step-index="4"]`
      )
      expect(cell.exists()).toBe(true)
      wrapper.unmount()
    })
  })

  describe('active note display', () => {
    it('marks active notes with the active class', () => {
      const activeNotes = new Set<NoteCellKey>([
        cellKey(0, 0),
        cellKey(18, 4),
      ])
      const wrapper = mountPianoRoll({ modelValue: activeNotes })

      const activeCells = wrapper.findAll(ACTIVE_SELECTOR)
      expect(activeCells).toHaveLength(2)
      wrapper.unmount()
    })

    it('does not mark inactive notes', () => {
      const activeNotes = new Set<NoteCellKey>([cellKey(0, 0)])
      const wrapper = mountPianoRoll({ modelValue: activeNotes })

      // Cell at note 0, step 1 should not be active
      const inactiveCell = wrapper.find(
        `${CELL_SELECTOR}[data-note-index="0"][data-step-index="1"]`
      )
      expect(inactiveCell.classes()).not.toContain('piano-roll__cell--active')
      wrapper.unmount()
    })
  })

  describe('black key styling', () => {
    it('applies black-key class to sharp notes', () => {
      const wrapper = mountPianoRoll()

      // C#3 is noteIndex 34 (in reversed display)
      const cSharp3Cell = wrapper.find(
        `${CELL_SELECTOR}[data-note-index="34"][data-step-index="0"]`
      )
      expect(cSharp3Cell.classes()).toContain('piano-roll__cell--black-key')

      // C3 is noteIndex 35 (natural note)
      const c3Cell = wrapper.find(
        `${CELL_SELECTOR}[data-note-index="35"][data-step-index="0"]`
      )
      expect(c3Cell.classes()).not.toContain('piano-roll__cell--black-key')
      wrapper.unmount()
    })
  })

  describe('beat markers', () => {
    it('applies beat-marker class every 4 steps', () => {
      const wrapper = mountPianoRoll()

      // Step 0 should have beat marker
      const step0 = wrapper.find(
        `${CELL_SELECTOR}[data-note-index="0"][data-step-index="0"]`
      )
      expect(step0.classes()).toContain('piano-roll__cell--beat-start')

      // Step 4 should have beat marker
      const step4 = wrapper.find(
        `${CELL_SELECTOR}[data-note-index="0"][data-step-index="4"]`
      )
      expect(step4.classes()).toContain('piano-roll__cell--beat-start')

      // Step 3 should NOT have beat marker
      const step3 = wrapper.find(
        `${CELL_SELECTOR}[data-note-index="0"][data-step-index="3"]`
      )
      expect(step3.classes()).not.toContain('piano-roll__cell--beat-start')
      wrapper.unmount()
    })
  })

  describe('click to toggle note', () => {
    it('emits update:modelValue with added note when clicking empty cell', async () => {
      const wrapper = mountPianoRoll()

      const cell = wrapper.find(
        `${CELL_SELECTOR}[data-note-index="0"][data-step-index="0"]`
      )
      await cell.trigger('mousedown')

      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      const emitted = wrapper.emitted<
        [Set<NoteCellKey>]
      >('update:modelValue')![0]![0]
      expect(emitted.has(cellKey(0, 0))).toBe(true)
      wrapper.unmount()
    })

    it('emits update:modelValue with removed note when clicking active cell', async () => {
      const activeNotes = new Set<NoteCellKey>([cellKey(0, 0)])
      const wrapper = mountPianoRoll({ modelValue: activeNotes })

      const cell = wrapper.find(
        `${CELL_SELECTOR}[data-note-index="0"][data-step-index="0"]`
      )
      await cell.trigger('mousedown')

      expect(wrapper.emitted('update:modelValue')).toBeTruthy()
      const emitted = wrapper.emitted<
        [Set<NoteCellKey>]
      >('update:modelValue')![0]![0]
      expect(emitted.has(cellKey(0, 0))).toBe(false)
      wrapper.unmount()
    })

    it('preserves other active notes when toggling one', async () => {
      const activeNotes = new Set<NoteCellKey>([
        cellKey(0, 0),
        cellKey(18, 4),
      ])
      const wrapper = mountPianoRoll({ modelValue: activeNotes })

      const cell = wrapper.find(
        `${CELL_SELECTOR}[data-note-index="0"][data-step-index="0"]`
      )
      await cell.trigger('mousedown')

      const emitted = wrapper.emitted<
        [Set<NoteCellKey>]
      >('update:modelValue')![0]![0]
      // cellKey(0, 0) removed, cellKey(18, 4) preserved
      expect(emitted.has(cellKey(0, 0))).toBe(false)
      expect(emitted.has(cellKey(18, 4))).toBe(true)
      wrapper.unmount()
    })
  })

  describe('drag to paint notes', () => {
    it('adds note on mousedown + mouseenter', async () => {
      const wrapper = mountPianoRoll()

      const cell = wrapper.find(
        `${CELL_SELECTOR}[data-note-index="0"][data-step-index="0"]`
      )
      await cell.trigger('mousedown')

      const nextCell = wrapper.find(
        `${CELL_SELECTOR}[data-note-index="0"][data-step-index="1"]`
      )
      await nextCell.trigger('mouseenter')

      // Should have two emissions: one for mousedown, one for mouseenter
      const emissions = wrapper.emitted<[Set<NoteCellKey>]>(
        'update:modelValue'
      )!
      expect(emissions).toHaveLength(2)

      // The second emission (mouseenter) should include the painted cell
      const secondEmission = emissions[1]![0]
      expect(secondEmission.has(cellKey(0, 1))).toBe(true)
      wrapper.unmount()
    })

    it('does not paint when dragging starts on an active note (erase mode)', async () => {
      const activeNotes = new Set<NoteCellKey>([cellKey(0, 0)])
      const wrapper = mountPianoRoll({ modelValue: activeNotes })

      // Start drag on active note (erase mode)
      const activeCell = wrapper.find(
        `${CELL_SELECTOR}[data-note-index="0"][data-step-index="0"]`
      )
      await activeCell.trigger('mousedown')

      // Drag over inactive cell — should remove it (erase mode)
      const nextCell = wrapper.find(
        `${CELL_SELECTOR}[data-note-index="0"][data-step-index="1"]`
      )
      await nextCell.trigger('mouseenter')

      const emissions = wrapper.emitted<[Set<NoteCellKey>]>(
        'update:modelValue'
      )!
      expect(emissions).toHaveLength(2)

      // mousedown emission: removed cellKey(0,0)
      expect(emissions[0]![0].has(cellKey(0, 0))).toBe(false)

      // mouseenter emission: should NOT add cellKey(0,1) since we're in erase mode
      expect(emissions[1]![0].has(cellKey(0, 1))).toBe(false)
      wrapper.unmount()
    })
  })

  describe('mouseup resets drag state', () => {
    it('stops painting after mouseup event on the grid', async () => {
      const wrapper = mountPianoRoll()

      const cell1 = wrapper.find(
        `${CELL_SELECTOR}[data-note-index="0"][data-step-index="0"]`
      )
      await cell1.trigger('mousedown')

      // Emit mouseup on the grid
      await wrapper.find(GRID_SELECTOR).trigger('mouseup')

      // Now mouseenter should NOT paint
      const cell2 = wrapper.find(
        `${CELL_SELECTOR}[data-note-index="0"][data-step-index="1"]`
      )
      await cell2.trigger('mouseenter')

      // Only 1 emission (from mousedown), not 2
      const emissions = wrapper.emitted<[Set<NoteCellKey>]>(
        'update:modelValue'
      )!
      expect(emissions).toHaveLength(1)
      wrapper.unmount()
    })
  })

  describe('step column headers', () => {
    it('renders step number headers', () => {
      const wrapper = mountPianoRoll()

      const headers = wrapper.findAll('.piano-roll__step-header')
      expect(headers).toHaveLength(16)
      expect(headers[0]!.text()).toEqual('1')
      expect(headers[15]!.text()).toEqual('16')
      wrapper.unmount()
    })
  })
})
