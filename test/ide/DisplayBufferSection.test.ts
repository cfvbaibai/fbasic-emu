// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import DisplayBufferSection from '@/features/ide/components/DisplayBufferSection.vue'
import type { ScreenBufferReader } from '@/features/ide/components/types'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => {
      const messages: Record<string, string> = {
        'ide.bufferInspector.displayBufferCharTitle': 'Character Codes',
        'ide.bufferInspector.displayBufferPatternTitle': 'Color Patterns',
      }
      return messages[key] ?? key
    },
  }),
}))

/** Create a mock accessor with screen char/pattern data */
function makeMockAccessor(overrides: {
  chars?: number[][]
  patterns?: number[][]
} = {}): ScreenBufferReader {
  const allSpaceChars = Array.from({ length: 24 }, () =>
    Array.from({ length: 28 }, () => 0x20),
  )
  const allZeroPatterns = Array.from({ length: 24 }, () =>
    Array.from({ length: 28 }, () => 0),
  )

  const chars = overrides.chars ?? allSpaceChars
  const patterns = overrides.patterns ?? allZeroPatterns

  return {
    readScreenChar: (x: number, y: number) => chars[y]?.[x] ?? 0x20,
    readScreenPattern: (x: number, y: number) => (patterns[y]?.[x] ?? 0) & 3,
  }
}

describe('DisplayBufferSection', () => {
  it('has the correct component name', () => {
    const wrapper = mount(DisplayBufferSection, {
      props: {
        sharedDisplayBufferAccessor: makeMockAccessor(),
      },
    })

    expect(wrapper.vm.$options.name).toBe('DisplayBufferSection')
    wrapper.unmount()
  })

  it('renders section title for character codes grid', () => {
    const wrapper = mount(DisplayBufferSection, {
      props: {
        sharedDisplayBufferAccessor: makeMockAccessor(),
      },
    })

    const charTitle = wrapper.find('.display-buffer-char-title')
    expect(charTitle.exists()).toBe(true)
    expect(charTitle.text()).toBe('Character Codes')
    wrapper.unmount()
  })

  it('renders section title for color patterns grid', () => {
    const wrapper = mount(DisplayBufferSection, {
      props: {
        sharedDisplayBufferAccessor: makeMockAccessor(),
      },
    })

    const patternTitle = wrapper.find('.display-buffer-pattern-title')
    expect(patternTitle.exists()).toBe(true)
    expect(patternTitle.text()).toBe('Color Patterns')
    wrapper.unmount()
  })

  it('renders 24 rows for character codes grid (28x24)', () => {
    const wrapper = mount(DisplayBufferSection, {
      props: {
        sharedDisplayBufferAccessor: makeMockAccessor(),
      },
    })

    const charRows = wrapper.findAll('.display-buffer-char-row')
    expect(charRows.length).toBe(24)
    wrapper.unmount()
  })

  it('renders 28 cells per row in character codes grid', () => {
    const wrapper = mount(DisplayBufferSection, {
      props: {
        sharedDisplayBufferAccessor: makeMockAccessor(),
      },
    })

    const firstRow = wrapper.find('.display-buffer-char-row')
    const cells = firstRow.findAll('.display-buffer-char-cell')
    expect(cells.length).toBe(28)
    wrapper.unmount()
  })

  it('renders 24 rows for color patterns grid (28x24)', () => {
    const wrapper = mount(DisplayBufferSection, {
      props: {
        sharedDisplayBufferAccessor: makeMockAccessor(),
      },
    })

    const patternRows = wrapper.findAll('.display-buffer-pattern-row')
    expect(patternRows.length).toBe(24)
    wrapper.unmount()
  })

  it('renders 28 cells per row in color patterns grid', () => {
    const wrapper = mount(DisplayBufferSection, {
      props: {
        sharedDisplayBufferAccessor: makeMockAccessor(),
      },
    })

    const firstRow = wrapper.find('.display-buffer-pattern-row')
    const cells = firstRow.findAll('.display-buffer-pattern-cell')
    expect(cells.length).toBe(28)
    wrapper.unmount()
  })

  it('displays hex character code values in each cell', () => {
    const chars = Array.from({ length: 24 }, () =>
      Array.from({ length: 28 }, () => 0x20),
    )
    // Place 'A' (0x41) at position (0, 0)
    chars[0]![0] = 0x41
    // Place 'Z' (0x5A) at position (5, 3)
    chars[3]![5] = 0x5A

    const wrapper = mount(DisplayBufferSection, {
      props: {
        sharedDisplayBufferAccessor: makeMockAccessor({ chars }),
      },
    })

    const charCells = wrapper.findAll('.display-buffer-char-cell')
    expect(charCells[0]!.text()).toBe('41')
    // Position (5, 3) -> row 3, col 5 -> index 3*28 + 5 = 89
    expect(charCells[89]!.text()).toBe('5A')
    wrapper.unmount()
  })

  it('displays decimal color pattern values in each cell', () => {
    const patterns = Array.from({ length: 24 }, () =>
      Array.from({ length: 28 }, () => 0),
    )
    // Set pattern 2 at position (0, 0)
    patterns[0]![0] = 2
    // Set pattern 3 at position (10, 5)
    patterns[5]![10] = 3

    const wrapper = mount(DisplayBufferSection, {
      props: {
        sharedDisplayBufferAccessor: makeMockAccessor({ patterns }),
      },
    })

    const patternCells = wrapper.findAll('.display-buffer-pattern-cell')
    expect(patternCells[0]!.text()).toBe('2')
    // Position (10, 5) -> row 5, col 10 -> index 5*28 + 10 = 150
    expect(patternCells[150]!.text()).toBe('3')
    wrapper.unmount()
  })

  it('highlights non-space cells with CSS class in character grid', () => {
    const chars = Array.from({ length: 24 }, () =>
      Array.from({ length: 28 }, () => 0x20),
    )
    chars[0]![0] = 0x41 // 'A' at (0, 0) - non-space
    chars[0]![1] = 0x20 // space at (1, 0)
    chars[1]![0] = 0x00 // null at (0, 1) - non-space

    const wrapper = mount(DisplayBufferSection, {
      props: {
        sharedDisplayBufferAccessor: makeMockAccessor({ chars }),
      },
    })

    const charCells = wrapper.findAll('.display-buffer-char-cell')
    expect(charCells[0]!.classes()).toContain('display-buffer-cell-highlighted')
    expect(charCells[1]!.classes()).not.toContain('display-buffer-cell-highlighted')
    // Row 1, col 0 -> index 28
    expect(charCells[28]!.classes()).toContain('display-buffer-cell-highlighted')
    wrapper.unmount()
  })

  it('highlights non-zero pattern cells with CSS class in pattern grid', () => {
    const patterns = Array.from({ length: 24 }, () =>
      Array.from({ length: 28 }, () => 0),
    )
    patterns[0]![0] = 1 // non-zero at (0, 0)
    patterns[0]![1] = 0 // zero at (1, 0)

    const wrapper = mount(DisplayBufferSection, {
      props: {
        sharedDisplayBufferAccessor: makeMockAccessor({ patterns }),
      },
    })

    const patternCells = wrapper.findAll('.display-buffer-pattern-cell')
    expect(patternCells[0]!.classes()).toContain('display-buffer-cell-highlighted')
    expect(patternCells[1]!.classes()).not.toContain('display-buffer-cell-highlighted')
    wrapper.unmount()
  })

  it('displays row index labels for character codes grid', () => {
    const wrapper = mount(DisplayBufferSection, {
      props: {
        sharedDisplayBufferAccessor: makeMockAccessor(),
      },
    })

    const rowLabels = wrapper.findAll('.display-buffer-char-row-label')
    expect(rowLabels.length).toBe(24)
    expect(rowLabels[0]!.text()).toBe('00')
    expect(rowLabels[5]!.text()).toBe('05')
    expect(rowLabels[23]!.text()).toBe('17')
    wrapper.unmount()
  })

  it('displays row index labels for color patterns grid', () => {
    const wrapper = mount(DisplayBufferSection, {
      props: {
        sharedDisplayBufferAccessor: makeMockAccessor(),
      },
    })

    const rowLabels = wrapper.findAll('.display-buffer-pattern-row-label')
    expect(rowLabels.length).toBe(24)
    expect(rowLabels[0]!.text()).toBe('00')
    expect(rowLabels[15]!.text()).toBe('0F')
    expect(rowLabels[23]!.text()).toBe('17')
    wrapper.unmount()
  })

  it('reads from accessor on initial render with mixed char data', () => {
    const chars = Array.from({ length: 24 }, () =>
      Array.from({ length: 28 }, () => 0x20),
    )
    // Set specific non-space values to test initial render
    chars[0]![0] = 0x41 // 'A'
    chars[0]![1] = 0x20 // space
    chars[0]![2] = 0xFF // max value

    const wrapper = mount(DisplayBufferSection, {
      props: {
        sharedDisplayBufferAccessor: makeMockAccessor({ chars }),
      },
    })

    const charCells = wrapper.findAll('.display-buffer-char-cell')
    expect(charCells[0]!.text()).toBe('41')
    expect(charCells[1]!.text()).toBe('20')
    expect(charCells[2]!.text()).toBe('FF')
    wrapper.unmount()
  })
})

describe('formatHex', () => {
  it('formats 0 as "00" (zero padding)', () => {
    const chars = Array.from({ length: 24 }, () =>
      Array.from({ length: 28 }, () => 0x20),
    )
    chars[0]![0] = 0

    const wrapper = mount(DisplayBufferSection, {
      props: {
        sharedDisplayBufferAccessor: makeMockAccessor({ chars }),
      },
    })

    const charCells = wrapper.findAll('.display-buffer-char-cell')
    expect(charCells[0]!.text()).toBe('00')
    wrapper.unmount()
  })

  it('formats 15 as "0F" (single-digit hex, uppercase)', () => {
    const chars = Array.from({ length: 24 }, () =>
      Array.from({ length: 28 }, () => 0x20),
    )
    chars[0]![0] = 15

    const wrapper = mount(DisplayBufferSection, {
      props: {
        sharedDisplayBufferAccessor: makeMockAccessor({ chars }),
      },
    })

    const charCells = wrapper.findAll('.display-buffer-char-cell')
    expect(charCells[0]!.text()).toBe('0F')
    wrapper.unmount()
  })

  it('formats 255 as "FF" (max byte value)', () => {
    const chars = Array.from({ length: 24 }, () =>
      Array.from({ length: 28 }, () => 0x20),
    )
    chars[0]![0] = 255

    const wrapper = mount(DisplayBufferSection, {
      props: {
        sharedDisplayBufferAccessor: makeMockAccessor({ chars }),
      },
    })

    const charCells = wrapper.findAll('.display-buffer-char-cell')
    expect(charCells[0]!.text()).toBe('FF')
    wrapper.unmount()
  })

  it('formats 256 as "100" (overflow beyond 2-digit pad)', () => {
    const chars = Array.from({ length: 24 }, () =>
      Array.from({ length: 28 }, () => 0x20),
    )
    chars[0]![0] = 256

    const wrapper = mount(DisplayBufferSection, {
      props: {
        sharedDisplayBufferAccessor: makeMockAccessor({ chars }),
      },
    })

    const charCells = wrapper.findAll('.display-buffer-char-cell')
    expect(charCells[0]!.text()).toBe('100')
    wrapper.unmount()
  })
})
