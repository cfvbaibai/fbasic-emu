import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import ProgramToolbar from '@/features/ide/components/ProgramToolbar.vue'

const mockConfirm = vi.fn()

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => {
      const messages: Record<string, string> = {
        'ide.toolbar.new': 'New',
        'ide.toolbar.import': 'Import',
        'ide.toolbar.export': 'Export',
        'ide.toolbar.discardConfirm': 'Discard unsaved changes?',
      }
      return messages[key] ?? key
    },
    locale: ref('en'),
  }),
}))

vi.mock('@/features/ide/composables/useProgramStore', () => ({
  useProgramStore: () => ({
    isDirty: ref(true),
    programName: 'Test Program',
    newProgram: vi.fn(),
    open: vi.fn(),
    save: vi.fn(),
    currentProgram: ref(null),
    loadProgram: vi.fn(),
  }),
}))

describe('ProgramToolbar', () => {
  beforeEach(() => {
    vi.stubGlobal('confirm', mockConfirm)
    mockConfirm.mockReset()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('calls confirm with localized discard message when New is clicked and program is dirty', async () => {
    mockConfirm.mockReturnValue(false)

    const wrapper = mount(ProgramToolbar, {
      props: { isCompact: false },
    })

    // Find the New button (first button in file-buttons)
    const buttons = wrapper.findAll('button')
    expect(buttons.length).toBeGreaterThanOrEqual(1)
    await buttons[0]!.trigger('click')

    expect(mockConfirm).toHaveBeenCalledWith('Discard unsaved changes?')

    wrapper.unmount()
  })
})
