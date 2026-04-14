// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { afterEach,beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick } from 'vue'

import type { CompactBg } from '@/core/types/program-types'
import ShareDialog from '@/features/ide/components/ShareDialog.vue'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

const mockEncodeProgram = vi.fn()

vi.mock('@/shared/utils/programCodec', () => ({
  encodeProgram: (...args: unknown[]) => mockEncodeProgram(...args),
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

const DEFAULT_ENCODE_RESULT = {
  encoded: 'abc123',
  compressed: false,
  url: 'http://localhost/#/share/abc123',
  tooLarge: false,
}

function mountDialog(props: {
  visible?: boolean
  source?: string
  bg?: CompactBg
} = {}) {
  return mount(ShareDialog, {
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

async function openDialog(wrapper: ReturnType<typeof mountDialog>) {
  await wrapper.setProps({ visible: true })
  // Allow the async watch callback to schedule
  await nextTick()
  await nextTick()
}

async function waitForEncoding() {
  // Wait for the watcher's async encodeProgram call to settle
  await vi.waitFor(() => {
    expect(mockEncodeProgram).toHaveBeenCalled()
  })
  await nextTick()
  await nextTick()
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ShareDialog', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    mockEncodeProgram.mockResolvedValue(DEFAULT_ENCODE_RESULT)
    // jsdom does not implement clipboard — provide a stub
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  // -- Visibility ------------------------------------------------------------
  it('renders nothing when visible is false', () => {
    const wrapper = mountDialog({ visible: false })
    expect(wrapper.find('.game-dialog-overlay').exists()).toBe(false)
    wrapper.unmount()
  })

  it('renders overlay when visible is true', async () => {
    const wrapper = mountDialog()
    await openDialog(wrapper)
    await waitForEncoding()

    expect(wrapper.find('.game-dialog-overlay').exists()).toBe(true)
    wrapper.unmount()
  })

  it('has proper dialog ARIA attributes', async () => {
    const wrapper = mountDialog()
    await openDialog(wrapper)
    await waitForEncoding()

    const overlay = wrapper.find('.game-dialog-overlay')
    expect(overlay.attributes('role')).toEqual('dialog')
    expect(overlay.attributes('aria-modal')).toEqual('true')
    expect(overlay.attributes('aria-label')).toEqual('ide.share.title')
    wrapper.unmount()
  })

  // -- Encoding state transitions --------------------------------------------
  it('shows loading state while encoding', async () => {
    // Keep encodeProgram pending so loading state stays visible
    let resolveEncode!: (value: unknown) => void
    mockEncodeProgram.mockReturnValue(new Promise((resolve) => {
      resolveEncode = resolve
    }))

    const wrapper = mountDialog()
    await wrapper.setProps({ visible: true })
    await nextTick()
    await nextTick()

    expect(wrapper.find('.game-dialog-loading').exists()).toBe(true)
    expect(wrapper.find('.game-dialog-loading').text()).toEqual('ide.share.encoding')

    resolveEncode(DEFAULT_ENCODE_RESULT)
    await waitForEncoding()

    expect(wrapper.find('.game-dialog-loading').exists()).toBe(false)
    wrapper.unmount()
  })

  it('shows error state when encoding fails', async () => {
    mockEncodeProgram.mockRejectedValue(new Error('Compression failed'))

    const wrapper = mountDialog()
    await openDialog(wrapper)
    await waitForEncoding()

    expect(wrapper.find('.game-dialog-error').exists()).toBe(true)
    expect(wrapper.find('.game-dialog-error').text()).toEqual('ide.share.encodeFailed')
    wrapper.unmount()
  })

  it('displays share URL after successful encoding', async () => {
    const wrapper = mountDialog({ source: '10 PRINT "HI"' })
    await openDialog(wrapper)
    await waitForEncoding()

    const input = wrapper.find<HTMLInputElement>('[data-testid="share-url-input"]')
    expect(input.exists()).toBe(true)
    expect(input.element.value).toEqual('http://localhost/#/share/abc123')
    wrapper.unmount()
  })

  it('calls encodeProgram with source and bg props', async () => {
    const bg: CompactBg = { format: 'sparse1', data: 'BGDATA', width: 28, height: 21 }
    const wrapper = mountDialog({ source: '10 CLS', bg })
    await openDialog(wrapper)
    await waitForEncoding()

    expect(mockEncodeProgram).toHaveBeenCalledWith('10 CLS', bg)
    wrapper.unmount()
  })

  // -- Too-large warning ----------------------------------------------------
  it('shows too-large warning when program exceeds URL limit', async () => {
    mockEncodeProgram.mockResolvedValue({
      ...DEFAULT_ENCODE_RESULT,
      tooLarge: true,
    })

    const wrapper = mountDialog()
    await openDialog(wrapper)
    await waitForEncoding()

    expect(wrapper.find('.share-dialog-warning').exists()).toBe(true)
    expect(wrapper.find('.share-dialog-warning').text()).toEqual('ide.share.tooLarge')
    wrapper.unmount()
  })

  it('does not show too-large warning when program is within limit', async () => {
    const wrapper = mountDialog()
    await openDialog(wrapper)
    await waitForEncoding()

    expect(wrapper.find('.share-dialog-warning').exists()).toBe(false)
    wrapper.unmount()
  })

  // -- Copy to clipboard ----------------------------------------------------
  it('copies URL to clipboard and shows copied state', async () => {
    const wrapper = mountDialog()
    await openDialog(wrapper)
    await waitForEncoding()

    await wrapper.find('[data-testid="share-copy-button"]').trigger('click')
    await nextTick()

    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('http://localhost/#/share/abc123')
    expect(wrapper.find('[data-testid="share-copy-button"]').text()).toEqual('ide.share.copied')
    wrapper.unmount()
  })

  it('reverts copied state after timeout', async () => {
    const wrapper = mountDialog()
    await openDialog(wrapper)
    await waitForEncoding()

    await wrapper.find('[data-testid="share-copy-button"]').trigger('click')
    await nextTick()

    expect(wrapper.find('[data-testid="share-copy-button"]').text()).toEqual('ide.share.copied')

    vi.advanceTimersByTime(2000)
    await nextTick()

    expect(wrapper.find('[data-testid="share-copy-button"]').text()).toEqual('ide.share.copy')
    wrapper.unmount()
  })

  it('does nothing when copy is clicked with empty URL', async () => {
    mockEncodeProgram.mockResolvedValue({ ...DEFAULT_ENCODE_RESULT, url: '' })

    const wrapper = mountDialog()
    await openDialog(wrapper)
    await waitForEncoding()

    const writeTextSpy = vi.spyOn(navigator.clipboard, 'writeText')
    await wrapper.find<HTMLButtonElement>('[data-testid="share-copy-button"]').trigger('click')
    await nextTick()

    expect(writeTextSpy).not.toHaveBeenCalled()
    writeTextSpy.mockRestore()
    wrapper.unmount()
  })

  it('selects input text when clipboard write fails', async () => {
    const selectSpy = vi.spyOn(HTMLInputElement.prototype, 'select')
    vi.mocked(navigator.clipboard.writeText).mockRejectedValueOnce(new Error('NotAllowed'))

    const wrapper = mountDialog()
    await openDialog(wrapper)
    await waitForEncoding()

    await wrapper.find('[data-testid="share-copy-button"]').trigger('click')
    await nextTick()

    expect(selectSpy).toHaveBeenCalled()
    selectSpy.mockRestore()
    wrapper.unmount()
  })

  // -- Close button ---------------------------------------------------------
  it('emits close when close button is clicked', async () => {
    const wrapper = mountDialog()
    await openDialog(wrapper)
    await waitForEncoding()

    await wrapper.find('[data-testid="share-close-button"]').trigger('click')

    expect(wrapper.emitted('close')).toHaveLength(1)
    wrapper.unmount()
  })

  // -- Escape key dismissal -------------------------------------------------
  it('emits close on Escape key press when visible', async () => {
    const wrapper = mountDialog()
    await openDialog(wrapper)
    await waitForEncoding()

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
    const wrapper = mountDialog()
    await openDialog(wrapper)
    await waitForEncoding()

    const overlay = wrapper.find('.game-dialog-overlay')
    await overlay.trigger('click')

    expect(wrapper.emitted('close')).toHaveLength(1)
    wrapper.unmount()
  })

  it('does not emit close when dialog content is clicked', async () => {
    const wrapper = mountDialog()
    await openDialog(wrapper)
    await waitForEncoding()

    const dialog = wrapper.find('.game-dialog')
    await dialog.trigger('click')

    expect(wrapper.emitted('close')).toBeUndefined()
    wrapper.unmount()
  })

  // -- Cleanup --------------------------------------------------------------
  it('removes keydown listener on unmount', async () => {
    const wrapper = mountDialog()
    await openDialog(wrapper)
    await waitForEncoding()

    wrapper.unmount()

    // Dispatching Escape after unmount should not throw
    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
  })

  it('clears copied timer on unmount', async () => {
    const clearTimeoutSpy = vi.spyOn(globalThis, 'clearTimeout')

    const wrapper = mountDialog()
    await openDialog(wrapper)
    await waitForEncoding()

    await wrapper.find('[data-testid="share-copy-button"]').trigger('click')
    await nextTick()

    wrapper.unmount()

    expect(clearTimeoutSpy).toHaveBeenCalled()
    clearTimeoutSpy.mockRestore()
  })
})
