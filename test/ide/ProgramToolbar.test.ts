// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, ref } from 'vue'

import ProgramToolbar from '@/features/ide/components/ProgramToolbar.vue'

import { createI18nMock } from '../helpers/createI18nMock'

const mockNewProgram = vi.fn()
const mockOpen = vi.fn()
const mockSave = vi.fn()
const mockSetName = vi.fn()
const isDirtyRef = ref(true)

const mockT = createI18nMock({
  'ide.toolbar.new': 'New',
  'ide.toolbar.import': 'Import',
  'ide.toolbar.export': 'Export',
  'ide.toolbar.exportHtml': 'Export as HTML',
  'ide.toolbar.discardConfirm': 'Discard unsaved changes?',
  'ide.toolbar.programNamePlaceholder': 'Program name',
  'ide.toolbar.unsavedChanges': 'Unsaved changes',
  'ide.toolbar.openFailed': 'Failed to open file',
  'ide.toolbar.saveFailed': 'Failed to save file',
  'ide.share.title': 'Share',
  'ide.share.description': 'Copy this URL to share your program.',
  'ide.share.copy': 'Copy URL',
  'ide.share.copied': 'Copied!',
  'ide.share.close': 'Close',
  'ide.share.encoding': 'Generating share URL...',
  'ide.share.encodeFailed': 'Failed to generate share URL.',
  'ide.share.tooLarge': 'This program is too large to share.',
  'ide.exportHtml.title': 'Export as HTML',
  'common.confirmDialog.confirm': 'OK',
  'common.confirmDialog.cancel': 'Cancel',
})

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: mockT,
    locale: ref('en'),
  }),
}))

vi.mock('@/features/ide/composables/useProgramStore', () => ({
  useProgramStore: () => ({
    isDirty: isDirtyRef,
    programName: 'Test Program',
    code: '10 PRINT "HELLO"',
    newProgram: mockNewProgram,
    open: mockOpen,
    save: mockSave,
    setName: mockSetName,
    currentProgram: ref(null),
    loadProgram: vi.fn(),
  }),
}))

vi.mock('@/shared/utils/programCodec', () => ({
  encodeProgram: vi.fn().mockResolvedValue({
    encoded: 'test-encoded',
    compressed: false,
    url: 'https://example.com/#/share/test-encoded',
    tooLarge: false,
  }),
}))

vi.mock('@/features/ide/composables/useHtmlExporter', () => ({
  useHtmlExporter: () => ({
    isExporting: ref(false),
    exportError: ref(''),
    exportHtml: vi.fn(),
  }),
}))

// Stub Teleport so ExportHtmlDialog content renders inline
const teleportStub = defineComponent({
  name: 'Teleport',
  props: ['to'],
  render() {
    return this.$slots.default?.()
  },
})

describe('ProgramToolbar', () => {
  beforeEach(() => {
    mockNewProgram.mockReset()
    mockOpen.mockReset()
    mockSave.mockReset()
    mockSetName.mockReset()
    isDirtyRef.value = true
  })

  it('shows confirm dialog when New is clicked and program is dirty', async () => {
    const wrapper = mount(ProgramToolbar, {
      props: { isCompact: false },
    })

    // Initially no confirm dialog visible
    expect(wrapper.find('.confirm-dialog-overlay').exists()).toBe(false)

    // Click the New button
    const newButton = wrapper.find('[data-testid="ide-new-button"]')
    expect(newButton.exists()).toBe(true)
    await newButton.trigger('click')

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
    const newButton = wrapper.find('[data-testid="ide-new-button"]')
    expect(newButton.exists()).toBe(true)
    await newButton.trigger('click')

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
    const newButton = wrapper.find('[data-testid="ide-new-button"]')
    await newButton.trigger('click')

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
    const newButton = wrapper.find('[data-testid="ide-new-button"]')
    await newButton.trigger('click')

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
    const newButton = wrapper.find('[data-testid="ide-new-button"]')
    await newButton.trigger('click')

    const overlay = wrapper.find('.confirm-dialog-overlay')
    expect(overlay.attributes('role')).toEqual('dialog')
    expect(overlay.attributes('aria-modal')).toEqual('true')
    expect(overlay.attributes('aria-describedby')).toEqual('confirm-dialog-message')

    wrapper.unmount()
  })

  describe('file operation loading state', () => {
    it('disables New button while file operation is pending', async () => {
      let resolveOpen!: () => void
      mockOpen.mockReturnValue(
        new Promise<boolean>((resolve) => {
          resolveOpen = () => resolve(true)
        }),
      )

      isDirtyRef.value = false
      const wrapper = mount(ProgramToolbar, {
        props: { isCompact: false },
      })

      // Click Import (Open) button
      const openButton = wrapper.find('[data-testid="ide-open-button"]')
      await openButton.trigger('click')
      await wrapper.vm.$nextTick()

      // New button should be disabled during file operation
      const newButton = wrapper.find('[data-testid="ide-new-button"]')
      expect(newButton.attributes('disabled')).toBeDefined()

      // Resolve the pending operation
      resolveOpen()
      await wrapper.vm.$nextTick()

      wrapper.unmount()
    })

    it('disables New button while save is pending', async () => {
      let resolveSave!: () => void
      mockSave.mockReturnValue(
        new Promise<void>((resolve) => {
          resolveSave = () => resolve()
        }),
      )

      const wrapper = mount(ProgramToolbar, {
        props: { isCompact: false },
      })

      // Click Export (Save) button
      const saveButton = wrapper.find('[data-testid="ide-save-button"]')
      await saveButton.trigger('click')
      await wrapper.vm.$nextTick()

      // New button should be disabled during file operation
      const newButton = wrapper.find('[data-testid="ide-new-button"]')
      expect(newButton.attributes('disabled')).toBeDefined()

      // Resolve the pending operation
      resolveSave()
      await wrapper.vm.$nextTick()

      wrapper.unmount()
    })
  })

  describe('error handling', () => {
    it('shows error message when open fails (returns false)', async () => {
      mockOpen.mockResolvedValue(false)

      isDirtyRef.value = false
      const wrapper = mount(ProgramToolbar, {
        props: { isCompact: false },
      })

      // Click Import button
      const openButton = wrapper.find('[data-testid="ide-open-button"]')
      await openButton.trigger('click')
      await wrapper.vm.$nextTick()

      // Error message should be displayed
      expect(wrapper.find('.error-message').exists()).toBe(true)
      expect(wrapper.find('.error-message').text()).toEqual('Failed to open file')

      wrapper.unmount()
    })

    it('shows error message when open throws', async () => {
      mockOpen.mockRejectedValue(new Error('read error'))

      isDirtyRef.value = false
      const wrapper = mount(ProgramToolbar, {
        props: { isCompact: false },
      })

      // Click Import button
      const openButton = wrapper.find('[data-testid="ide-open-button"]')
      await openButton.trigger('click')
      await wrapper.vm.$nextTick()

      // Error message should be displayed
      expect(wrapper.find('.error-message').exists()).toBe(true)
      expect(wrapper.find('.error-message').text()).toEqual('Failed to open file')

      wrapper.unmount()
    })

    it('shows error message when save throws', async () => {
      mockSave.mockRejectedValue(new Error('write error'))

      const wrapper = mount(ProgramToolbar, {
        props: { isCompact: false },
      })

      // Click Export (Save) button
      const saveButton = wrapper.find('[data-testid="ide-save-button"]')
      await saveButton.trigger('click')
      await wrapper.vm.$nextTick()

      // Error message should be displayed
      expect(wrapper.find('.error-message').exists()).toBe(true)
      expect(wrapper.find('.error-message').text()).toEqual('Failed to save file')

      wrapper.unmount()
    })

    it('clears error message when clicked', async () => {
      mockOpen.mockResolvedValue(false)

      isDirtyRef.value = false
      const wrapper = mount(ProgramToolbar, {
        props: { isCompact: false },
      })

      // Click Import button to trigger error
      const openButton = wrapper.find('[data-testid="ide-open-button"]')
      await openButton.trigger('click')
      await wrapper.vm.$nextTick()

      // Error message should be visible
      expect(wrapper.find('.error-message').exists()).toBe(true)

      // Click the error message to dismiss
      await wrapper.find('.error-message').trigger('click')
      await wrapper.vm.$nextTick()

      // Error message should be gone
      expect(wrapper.find('.error-message').exists()).toBe(false)

      wrapper.unmount()
    })

    it('does not show error when open succeeds', async () => {
      mockOpen.mockResolvedValue(true)

      isDirtyRef.value = false
      const wrapper = mount(ProgramToolbar, {
        props: { isCompact: false },
      })

      // Click Import button
      const openButton = wrapper.find('[data-testid="ide-open-button"]')
      await openButton.trigger('click')
      await wrapper.vm.$nextTick()

      // No error message should be displayed
      expect(wrapper.find('.error-message').exists()).toBe(false)

      wrapper.unmount()
    })
  })

  describe('Export as HTML button', () => {
    const mountOptions = {
      props: { isCompact: false },
      global: { stubs: { Teleport: teleportStub } },
    }

    it('renders the Export as HTML button with correct text', () => {
      const wrapper = mount(ProgramToolbar, mountOptions)

      const button = wrapper.find('[data-testid="ide-export-html-button"]')
      expect(button.exists()).toBe(true)
      expect(button.text()).toEqual('Export as HTML')

      wrapper.unmount()
    })

    it('disables Export as HTML button during file operation', async () => {
      let resolveOpen!: () => void
      mockOpen.mockReturnValue(
        new Promise<boolean>((resolve) => {
          resolveOpen = () => resolve(true)
        }),
      )

      isDirtyRef.value = false
      const wrapper = mount(ProgramToolbar, mountOptions)

      const openButton = wrapper.find('[data-testid="ide-open-button"]')
      await openButton.trigger('click')
      await wrapper.vm.$nextTick()

      const exportHtmlButton = wrapper.find('[data-testid="ide-export-html-button"]')
      expect(exportHtmlButton.attributes('disabled')).toBeDefined()

      resolveOpen()
      await wrapper.vm.$nextTick()

      wrapper.unmount()
    })

    it('opens ExportHtmlDialog when Export as HTML button is clicked', async () => {
      const wrapper = mount(ProgramToolbar, mountOptions)

      // Dialog should not be visible initially
      expect(wrapper.find('.game-dialog-overlay').exists()).toBe(false)

      // Click Export as HTML button
      const button = wrapper.find('[data-testid="ide-export-html-button"]')
      await button.trigger('click')
      await wrapper.vm.$nextTick()

      // ExportHtmlDialog should now be visible
      expect(wrapper.find('.game-dialog-overlay').exists()).toBe(true)
      expect(wrapper.find('.game-dialog-title').text()).toEqual('Export as HTML')

      wrapper.unmount()
    })

    it('closes ExportHtmlDialog when close is emitted', async () => {
      const wrapper = mount(ProgramToolbar, mountOptions)

      // Open dialog
      const button = wrapper.find('[data-testid="ide-export-html-button"]')
      await button.trigger('click')
      await wrapper.vm.$nextTick()

      expect(wrapper.find('.game-dialog-overlay').exists()).toBe(true)

      // Click cancel button inside dialog
      const cancelBtn = wrapper.find('[data-testid="export-html-cancel-button"]')
      await cancelBtn.trigger('click')
      await wrapper.vm.$nextTick()

      // Dialog should be dismissed
      expect(wrapper.find('.game-dialog-overlay').exists()).toBe(false)

      wrapper.unmount()
    })
  })

  describe('rename preserves dirty state', () => {
    it('calls setName instead of loadProgram when renaming', async () => {
      const wrapper = mount(ProgramToolbar, {
        props: { isCompact: false },
      })

      // Click the program name to enter rename mode
      const nameEditable = wrapper.find('.program-name-editable')
      await nameEditable.trigger('click')
      await wrapper.vm.$nextTick()

      // Verify rename input is shown
      const nameInput = wrapper.find('.program-name-input')
      expect(nameInput.exists()).toBe(true)

      // Set new name and trigger finish by blurring
      await nameInput.setValue('New Program Name')
      await nameInput.trigger('blur')
      await wrapper.vm.$nextTick()

      // setName should be called with the new name
      expect(mockSetName).toHaveBeenCalledWith('New Program Name')

      wrapper.unmount()
    })

    it('preserves dirty state after rename when program had unsaved changes', async () => {
      isDirtyRef.value = true

      const wrapper = mount(ProgramToolbar, {
        props: { isCompact: false },
      })

      // Click the program name to enter rename mode
      const nameEditable = wrapper.find('.program-name-editable')
      await nameEditable.trigger('click')
      await wrapper.vm.$nextTick()

      // Set new name and finish rename
      const nameInput = wrapper.find('.program-name-input')
      await nameInput.setValue('Renamed Program')
      await nameInput.trigger('blur')
      await wrapper.vm.$nextTick()

      // Dirty indicator should still be visible after rename
      expect(wrapper.find('.dirty-indicator').exists()).toBe(true)

      wrapper.unmount()
    })
  })
})
