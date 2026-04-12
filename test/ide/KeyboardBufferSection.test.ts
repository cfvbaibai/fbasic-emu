// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import type { KeyboardBufferView } from '@/core/devices/sharedKeyboardBuffer'
import {
  consumeKeyAvailable,
  createSharedKeyboardBuffer,
  createViewsFromKeyboardBuffer,
  setInkeyState,
} from '@/core/devices/sharedKeyboardBuffer'
import KeyboardBufferSection from '@/features/ide/components/KeyboardBufferSection.vue'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

/** Create a real keyboard buffer and views for testing */
function createTestKeyboardBuffer(): KeyboardBufferView {
  const buffer = createSharedKeyboardBuffer()
  return createViewsFromKeyboardBuffer(buffer)
}

/**
 * Mount the component with fake timers.
 * After mutating the keyboard buffer, advance timers by the poll
 * interval (100ms) so the component picks up the change.
 */
function mountWithFakeTimers(keyboardView: KeyboardBufferView) {
  vi.useFakeTimers()
  const wrapper = mount(KeyboardBufferSection, {
    props: { keyboardView },
  })
  return { wrapper, cleanup: () => { wrapper.unmount(); vi.useRealTimers() } }
}

describe('KeyboardBufferSection', () => {
  it('has the correct component name', () => {
    const keyboardView = createTestKeyboardBuffer()
    const wrapper = mount(KeyboardBufferSection, {
      props: { keyboardView },
    })

    expect(wrapper.vm.$options.name).toBe('KeyboardBufferSection')
    wrapper.unmount()
  })

  it('renders section title', () => {
    const keyboardView = createTestKeyboardBuffer()
    const wrapper = mount(KeyboardBufferSection, {
      props: { keyboardView },
    })

    const title = wrapper.find('.keyboard-buffer-title')
    expect(title.exists()).toBe(true)
    expect(title.text()).toBe('ide.bufferInspector.keyboardBufferTitle')
    wrapper.unmount()
  })

  it('renders all three keyboard buffer fields as rows', () => {
    const keyboardView = createTestKeyboardBuffer()
    const wrapper = mount(KeyboardBufferSection, {
      props: { keyboardView },
    })

    const rows = wrapper.findAll('.keyboard-buffer-row')
    expect(rows.length).toBe(3)
    wrapper.unmount()
  })

  it('renders field labels for keyCharCode, keyModifiers, keyAvailable', () => {
    const keyboardView = createTestKeyboardBuffer()
    const wrapper = mount(KeyboardBufferSection, {
      props: { keyboardView },
    })

    const labels = wrapper.findAll('.keyboard-buffer-label')
    expect(labels.length).toBe(3)
    expect(labels[0]!.text()).toBe('ide.bufferInspector.keyboardCharCode')
    expect(labels[1]!.text()).toBe('ide.bufferInspector.keyboardModifiers')
    expect(labels[2]!.text()).toBe('ide.bufferInspector.keyboardAvailable')
    wrapper.unmount()
  })

  it('displays initial zero values for all fields', () => {
    const keyboardView = createTestKeyboardBuffer()
    const wrapper = mount(KeyboardBufferSection, {
      props: { keyboardView },
    })

    const values = wrapper.findAll('.keyboard-buffer-value')
    expect(values.length).toBe(3)
    expect(values[0]!.text()).toBe('0')
    expect(values[1]!.text()).toBe('0')
    expect(values[2]!.text()).toBe('0')
    wrapper.unmount()
  })

  it('displays keyCharCode after a key is pressed', async () => {
    const keyboardView = createTestKeyboardBuffer()
    const { wrapper, cleanup } = mountWithFakeTimers(keyboardView)

    setInkeyState(keyboardView, 'A', 1)
    vi.advanceTimersByTime(100)
    await wrapper.vm.$nextTick()

    const values = wrapper.findAll('.keyboard-buffer-value')
    expect(values[0]!.text()).toBe('65')
    expect(values[1]!.text()).toBe('1')
    expect(values[2]!.text()).toBe('1')
    cleanup()
  })

  it('displays keyAvailable as 1 after key press and 0 after consume', async () => {
    const keyboardView = createTestKeyboardBuffer()
    const { wrapper, cleanup } = mountWithFakeTimers(keyboardView)

    // Initially keyAvailable is 0
    let values = wrapper.findAll('.keyboard-buffer-value')
    expect(values[2]!.text()).toBe('0')

    // Press a key and advance poll
    setInkeyState(keyboardView, 'B', 0)
    vi.advanceTimersByTime(100)
    await wrapper.vm.$nextTick()

    values = wrapper.findAll('.keyboard-buffer-value')
    expect(values[2]!.text()).toBe('1')

    // Consume keyAvailable and advance poll
    consumeKeyAvailable(keyboardView)
    vi.advanceTimersByTime(100)
    await wrapper.vm.$nextTick()

    values = wrapper.findAll('.keyboard-buffer-value')
    expect(values[2]!.text()).toBe('0')
    cleanup()
  })

  it('shows keyChar for first row when keyCharCode is nonzero', async () => {
    const keyboardView = createTestKeyboardBuffer()
    const { wrapper, cleanup } = mountWithFakeTimers(keyboardView)

    // Initially no character
    const charCells = wrapper.findAll('.keyboard-buffer-char')
    expect(charCells.length).toBe(3)
    expect(charCells[0]!.text()).toBe('-')

    // Press a key
    setInkeyState(keyboardView, 'X', 0)
    vi.advanceTimersByTime(100)
    await wrapper.vm.$nextTick()

    const updatedCharCells = wrapper.findAll('.keyboard-buffer-char')
    expect(updatedCharCells[0]!.text()).toBe('X')
    cleanup()
  })

  it('highlights keyAvailable row when value changes from 0 to 1', async () => {
    const keyboardView = createTestKeyboardBuffer()
    const { wrapper, cleanup } = mountWithFakeTimers(keyboardView)

    const availableRow = wrapper.findAll('.keyboard-buffer-row')[2]!
    expect(availableRow.classes()).not.toContain('keyboard-buffer-highlight')

    setInkeyState(keyboardView, 'A', 0)
    vi.advanceTimersByTime(100)
    await wrapper.vm.$nextTick()

    expect(availableRow.classes()).toContain('keyboard-buffer-highlight')
    cleanup()
  })

  it('removes highlight class after highlight duration', async () => {
    const keyboardView = createTestKeyboardBuffer()
    const { wrapper, cleanup } = mountWithFakeTimers(keyboardView)

    setInkeyState(keyboardView, 'A', 0)
    vi.advanceTimersByTime(100)
    await wrapper.vm.$nextTick()

    const availableRow = wrapper.findAll('.keyboard-buffer-row')[2]!
    expect(availableRow.classes()).toContain('keyboard-buffer-highlight')

    // Advance timers past highlight duration (1000ms)
    vi.advanceTimersByTime(1500)
    await wrapper.vm.$nextTick()

    expect(availableRow.classes()).not.toContain('keyboard-buffer-highlight')
    cleanup()
  })
})
