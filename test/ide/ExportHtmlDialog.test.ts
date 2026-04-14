// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick, ref } from 'vue'

import type { CompactBg } from '@/core/types/program-types'
import ExportHtmlDialog from '@/features/ide/components/ExportHtmlDialog.vue'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => {
      const messages: Record<string, string> = {
        'ide.exportHtml.title': 'Export as HTML',
        'ide.exportHtml.description': 'Export your program as a standalone HTML file that runs in any browser.',
        'ide.exportHtml.exporting': 'Exporting...',
        'ide.exportHtml.exportFailed': 'Failed to export HTML file.',
        'ide.exportHtml.titleLabel': 'Page Title',
        'ide.exportHtml.themeLabel': 'Theme',
        'ide.exportHtml.themeDark': 'Dark',
        'ide.exportHtml.themeLight': 'Light',
        'ide.exportHtml.includeSound': 'Include sound',
        'ide.exportHtml.includeSprites': 'Include sprites',
        'ide.exportHtml.exportButton': 'Export',
        'ide.exportHtml.cancelButton': 'Cancel',
      }
      return messages[key] ?? key
    },
  }),
}))

const mockExportHtml = vi.fn()
const mockIsExporting = ref(false)
const mockExportError = ref('')

vi.mock('@/features/ide/composables/useHtmlExporter', () => ({
  useHtmlExporter: () => ({
    isExporting: mockIsExporting,
    exportError: mockExportError,
    exportHtml: mockExportHtml,
  }),
}))

// Stub Teleport so content renders inline (vue-test-utils cannot find
// teleported elements via wrapper.find since they live outside the VNode tree).
const teleportStub = defineComponent({
  name: 'Teleport',
  props: ['to'],
  render() {
    return this.$slots.default?.()
  },
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mountDialog(props: {
  visible?: boolean
  source?: string
  bg?: CompactBg
} = {}) {
  return mount(ExportHtmlDialog, {
    props: {
      visible: false,
      source: '10 PRINT "HELLO"',
      ...props,
    },
    global: {
      stubs: { Teleport: teleportStub },
    },
  })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ExportHtmlDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockIsExporting.value = false
    mockExportError.value = ''
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  // -- Visibility ------------------------------------------------------------
  it('renders nothing when visible is false', () => {
    const wrapper = mountDialog({ visible: false })
    expect(wrapper.find('.game-dialog-overlay').exists()).toBe(false)
    wrapper.unmount()
  })

  it('renders dialog overlay when visible is true', async () => {
    const wrapper = mountDialog({ visible: true })
    await nextTick()

    expect(wrapper.find('.game-dialog-overlay').exists()).toBe(true)
    wrapper.unmount()
  })

  it('has proper dialog ARIA attributes', async () => {
    const wrapper = mountDialog({ visible: true })
    await nextTick()

    const overlay = wrapper.find('.game-dialog-overlay')
    expect(overlay.attributes('role')).toEqual('dialog')
    expect(overlay.attributes('aria-modal')).toEqual('true')
    expect(overlay.attributes('aria-label')).toEqual('Export as HTML')
    wrapper.unmount()
  })

  // -- Form fields -----------------------------------------------------------
  it('shows title input, theme selection, sound toggle, and sprites toggle', async () => {
    const wrapper = mountDialog({ visible: true })
    await nextTick()

    expect(wrapper.find('[data-testid="export-html-title-input"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="export-html-theme-dark"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="export-html-theme-light"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="export-html-include-sound"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="export-html-include-sprites"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('title input is editable and bound', async () => {
    const wrapper = mountDialog({ visible: true })
    await nextTick()

    const input = wrapper.find<HTMLInputElement>('[data-testid="export-html-title-input"]')
    await input.setValue('My Program')

    expect(input.element.value).toEqual('My Program')
    wrapper.unmount()
  })

  it('theme selection works for dark and light', async () => {
    const wrapper = mountDialog({ visible: true })
    await nextTick()

    const darkRadio = wrapper.find<HTMLInputElement>('[data-testid="export-html-theme-dark"]')
    const lightRadio = wrapper.find<HTMLInputElement>('[data-testid="export-html-theme-light"]')

    expect(darkRadio.element.checked).toBe(true)
    expect(lightRadio.element.checked).toBe(false)

    // Select light theme
    await lightRadio.setValue(true)
    expect(lightRadio.element.checked).toBe(true)

    wrapper.unmount()
  })

  it('sound toggle works', async () => {
    const wrapper = mountDialog({ visible: true })
    await nextTick()

    const soundCheckbox = wrapper.find<HTMLInputElement>('[data-testid="export-html-include-sound"]')
    expect(soundCheckbox.element.checked).toBe(true)

    await soundCheckbox.setValue(false)
    expect(soundCheckbox.element.checked).toBe(false)
    wrapper.unmount()
  })

  it('sprites toggle works', async () => {
    const wrapper = mountDialog({ visible: true })
    await nextTick()

    const spritesCheckbox = wrapper.find<HTMLInputElement>('[data-testid="export-html-include-sprites"]')
    expect(spritesCheckbox.element.checked).toBe(true)

    await spritesCheckbox.setValue(false)
    expect(spritesCheckbox.element.checked).toBe(false)
    wrapper.unmount()
  })

  // -- Export button ---------------------------------------------------------
  it('export button calls exportHtml from composable', async () => {
    mockExportHtml.mockResolvedValue(undefined)

    const wrapper = mountDialog({ visible: true })
    await nextTick()

    await wrapper.find('[data-testid="export-html-export-button"]').trigger('click')
    await nextTick()

    expect(mockExportHtml).toHaveBeenCalled()
    wrapper.unmount()
  })

  // -- Cancel button ---------------------------------------------------------
  it('cancel button emits close event', async () => {
    const wrapper = mountDialog({ visible: true })
    await nextTick()

    await wrapper.find('[data-testid="export-html-cancel-button"]').trigger('click')

    expect(wrapper.emitted('close')).toHaveLength(1)
    wrapper.unmount()
  })

  // -- Escape key dismissal -------------------------------------------------
  it('emits close on Escape key press when visible', async () => {
    const wrapper = mountDialog({ visible: true })
    await nextTick()

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await nextTick()

    expect(wrapper.emitted('close')).toHaveLength(1)
    wrapper.unmount()
  })

  it('does not emit close on Escape when not visible', () => {
    const wrapper = mountDialog({ visible: false })

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))

    expect(wrapper.emitted('close')).toBeUndefined()
    wrapper.unmount()
  })

  // -- Overlay click dismissal ----------------------------------------------
  it('emits close when overlay background is clicked', async () => {
    const wrapper = mountDialog({ visible: true })
    await nextTick()

    const overlay = wrapper.find('.game-dialog-overlay')
    await overlay.trigger('click')

    expect(wrapper.emitted('close')).toHaveLength(1)
    wrapper.unmount()
  })

  it('does not emit close when dialog content is clicked', async () => {
    const wrapper = mountDialog({ visible: true })
    await nextTick()

    const dialog = wrapper.find('.game-dialog')
    await dialog.trigger('click')

    expect(wrapper.emitted('close')).toBeUndefined()
    wrapper.unmount()
  })

  // -- Exporting state -------------------------------------------------------
  it('shows exporting state while exporting', async () => {
    mockIsExporting.value = true

    const wrapper = mountDialog({ visible: true })
    await nextTick()

    expect(wrapper.find('[data-testid="export-html-exporting"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="export-html-exporting"]').text()).toEqual('Exporting...')
    wrapper.unmount()
  })

  it('shows error state when export fails', async () => {
    mockExportError.value = 'Export failed'

    const wrapper = mountDialog({ visible: true })
    await nextTick()

    expect(wrapper.find('[data-testid="export-html-error"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="export-html-error"]').text()).toEqual('Failed to export HTML file.')
    wrapper.unmount()
  })

  // -- Cleanup --------------------------------------------------------------
  it('removes keydown listener on unmount', async () => {
    const wrapper = mountDialog({ visible: true })
    await nextTick()

    wrapper.unmount()

    // Dispatching Escape after unmount should not throw
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
  })
})
