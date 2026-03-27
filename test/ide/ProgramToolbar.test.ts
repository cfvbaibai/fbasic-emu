import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

import ProgramToolbar from '@/features/ide/components/ProgramToolbar.vue'

const mockNewProgram = vi.fn()
const mockOpen = vi.fn()
const isDirtyRef = ref(true)

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => {
      const messages: Record<string, string> = {
        'ide.toolbar.new': 'New',
        'ide.toolbar.import': 'Import',
        'ide.toolbar.export': 'Export',
        'ide.toolbar.discardConfirm': 'Discard unsaved changes?',
        'ide.toolbar.programNamePlaceholder': 'Program name',
        'ide.toolbar.unsavedChanges': 'Unsaved changes',
        'common.confirmDialog.confirm': 'OK',
        'common.confirmDialog.cancel': 'Cancel',
      }
      return messages[key] ?? key
    },
    locale: ref('en'),
  }),
}))

vi.mock('@/features/ide/composables/useProgramStore', () => ({
  useProgramStore: () => ({
    isDirty: isDirtyRef,
    programName: 'Test Program',
    newProgram: mockNewProgram,
    open: mockOpen,
    save: vi.fn(),
    currentProgram: ref(null),
    loadProgram: vi.fn(),
  }),
}))

describe('ProgramToolbar', () => {
  beforeEach(() => {
    mockNewProgram.mockReset()
    mockOpen.mockReset()
    isDirtyRef.value = true
  })

  it('shows confirm dialog when New is clicked and program is dirty', async () => {
    const wrapper = mount(ProgramToolbar, {
      props: { isCompact: false },
    })

    // Initially no confirm dialog visible
    expect(wrapper.find('.confirm-dialog-overlay').exists()).toBe(false)

    // Click the New button
    const buttons = wrapper.findAll('button')
    expect(buttons.length).toBeGreaterThanOrEqual(1)
    await buttons[0]!.trigger('click')

    // Confirm dialog should now be visible
    expect(wrapper.find('.confirm-dialog-overlay').exists()).toBe(true)
    expect(wrapper.find('.confirm-dialog-message').text()).toEqual('Discard unsaved changes?')

    wrapper.unmount()
  })

  it('does not show confirm dialog when New is clicked and program is not dirty', async () => {
    isDirtyRef.value = false

    const wrapper = mount(ProgramToolbar, {
      props: { isCompact: false },
    })

    // Click the New button
    const buttons = wrapper.findAll('button')
    expect(buttons.length).toBeGreaterThanOrEqual(1)
    await buttons[0]!.trigger('click')

    // No confirm dialog should appear
    expect(wrapper.find('.confirm-dialog-overlay').exists()).toBe(false)

    // newProgram should be called directly without confirmation
    expect(mockNewProgram).toHaveBeenCalledTimes(1)

    wrapper.unmount()
  })

  it('proceeds with new program when confirm is clicked', async () => {
    const wrapper = mount(ProgramToolbar, {
      props: { isCompact: false },
    })

    // Click the New button to show dialog
    const buttons = wrapper.findAll('button')
    await buttons[0]!.trigger('click')

    // Click confirm button in dialog
    const confirmBtn = wrapper.find('.confirm-dialog-btn-confirm')
    expect(confirmBtn.exists()).toBe(true)
    await confirmBtn.trigger('click')

    expect(mockNewProgram).toHaveBeenCalledTimes(1)

    // Dialog should be dismissed
    expect(wrapper.find('.confirm-dialog-overlay').exists()).toBe(false)

    wrapper.unmount()
  })

  it('cancels and does not create new program when cancel is clicked', async () => {
    const wrapper = mount(ProgramToolbar, {
      props: { isCompact: false },
    })

    // Click the New button to show dialog
    const buttons = wrapper.findAll('button')
    await buttons[0]!.trigger('click')

    // Click cancel button in dialog
    const cancelBtn = wrapper.find('.confirm-dialog-btn-cancel')
    expect(cancelBtn.exists()).toBe(true)
    await cancelBtn.trigger('click')

    expect(mockNewProgram).not.toHaveBeenCalled()

    // Dialog should be dismissed
    expect(wrapper.find('.confirm-dialog-overlay').exists()).toBe(false)

    wrapper.unmount()
  })

  it('has proper ARIA attributes on confirm dialog', async () => {
    const wrapper = mount(ProgramToolbar, {
      props: { isCompact: false },
    })

    // Trigger the dialog
    const buttons = wrapper.findAll('button')
    await buttons[0]!.trigger('click')

    const overlay = wrapper.find('.confirm-dialog-overlay')
    expect(overlay.attributes('role')).toEqual('dialog')
    expect(overlay.attributes('aria-modal')).toEqual('true')
    expect(overlay.attributes('aria-describedby')).toEqual('confirm-dialog-message')

    wrapper.unmount()
  })
})
