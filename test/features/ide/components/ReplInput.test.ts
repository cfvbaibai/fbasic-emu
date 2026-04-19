// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import ReplInput from '@/features/ide/components/ReplInput.vue'

import { createI18nMock } from '../../../helpers/createI18nMock'

const mockT = createI18nMock({
  'ide.repl.placeholder': 'Enter command...',
})

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: mockT }),
}))

describe('ReplInput', () => {
  function mountReplInput(props: {
    active?: boolean
    disabled?: boolean
    commandHistory?: string[]
    historyIndex?: number
  } = {}) {
    return mount(ReplInput, {
      props: {
        active: props.active ?? false,
        disabled: props.disabled ?? false,
        commandHistory: props.commandHistory ?? [],
        historyIndex: props.historyIndex ?? -1,
      },
      attachTo: document.body,
    })
  }

  it('is hidden when active is false (default)', () => {
    const wrapper = mountReplInput()

    const container = wrapper.find('.repl-input-container')
    expect(container.exists()).toBe(false)
    wrapper.unmount()
  })

  it('is hidden when active prop is explicitly false', () => {
    const wrapper = mountReplInput({ active: false })

    const container = wrapper.find('.repl-input-container')
    expect(container.exists()).toBe(false)
    wrapper.unmount()
  })

  it('is visible when active prop is true', () => {
    const wrapper = mountReplInput({ active: true })

    const container = wrapper.find('.repl-input-container')
    expect(container.exists()).toBe(true)
    wrapper.unmount()
  })

  it('renders the ">" prompt prefix', () => {
    const wrapper = mountReplInput({ active: true })

    const prompt = wrapper.find('.repl-input-prompt')
    expect(prompt.exists()).toBe(true)
    expect(prompt.text()).toEqual('>')
    wrapper.unmount()
  })

  it('renders a text input with i18n placeholder', () => {
    const wrapper = mountReplInput({ active: true })

    const input = wrapper.find('input.repl-input-field')
    expect(input.exists()).toBe(true)
    expect(input.attributes('placeholder')).toEqual('Enter command...')
    wrapper.unmount()
  })

  it('input is not disabled by default', () => {
    const wrapper = mountReplInput({ active: true })

    const input = wrapper.find('input.repl-input-field')
    expect(input.attributes('disabled')).toBeUndefined()
    wrapper.unmount()
  })

  it('input is disabled when disabled prop is true', () => {
    const wrapper = mountReplInput({ active: true, disabled: true })

    const input = wrapper.find('input.repl-input-field')
    expect(input.attributes('disabled')).toBeDefined()
    wrapper.unmount()
  })

  it('emits execute with trimmed value on Enter key', async () => {
    const wrapper = mountReplInput({ active: true })

    const input = wrapper.find('input.repl-input-field')
    await input.setValue('PRINT "Hello"')
    await input.trigger('keydown', { key: 'Enter' })

    const emitted = wrapper.emitted('execute')
    expect(emitted).toHaveLength(1)
    expect(emitted![0]).toEqual(['PRINT "Hello"'])
    wrapper.unmount()
  })

  it('clears input after emitting execute on Enter', async () => {
    const wrapper = mountReplInput({ active: true })

    const input = wrapper.find('input.repl-input-field')
    await input.setValue('PRINT "Hello"')
    await input.trigger('keydown', { key: 'Enter' })

    expect((input.element as HTMLInputElement).value).toEqual('')
    wrapper.unmount()
  })

  it('does not emit execute on non-Enter keys', async () => {
    const wrapper = mountReplInput({ active: true })

    const input = wrapper.find('input.repl-input-field')
    await input.setValue('PRINT "Hello"')
    await input.trigger('keydown', { key: 'a' })
    await input.trigger('keydown', { key: 'Escape' })

    expect(wrapper.emitted('execute')).toBeUndefined()
    wrapper.unmount()
  })

  it('does not emit execute when input is empty on Enter', async () => {
    const wrapper = mountReplInput({ active: true })

    const input = wrapper.find('input.repl-input-field')
    await input.trigger('keydown', { key: 'Enter' })

    expect(wrapper.emitted('execute')).toBeUndefined()
    wrapper.unmount()
  })

  it('trims whitespace before emitting execute', async () => {
    const wrapper = mountReplInput({ active: true })

    const input = wrapper.find('input.repl-input-field')
    await input.setValue('  PRINT "Hello"  ')
    await input.trigger('keydown', { key: 'Enter' })

    const emitted = wrapper.emitted('execute')
    expect(emitted).toHaveLength(1)
    expect(emitted![0]).toEqual(['PRINT "Hello"'])
    wrapper.unmount()
  })

  it('auto-focuses input when active becomes true', async () => {
    const focusSpy = vi.spyOn(HTMLInputElement.prototype, 'focus')

    const wrapper = mountReplInput({ active: false })

    await wrapper.setProps({ active: true })
    await nextTick()

    const input = wrapper.find('input.repl-input-field')
    expect(input.exists()).toBe(true)
    expect(focusSpy).toHaveBeenCalled()

    focusSpy.mockRestore()
    wrapper.unmount()
  })

  it('does not emit execute when disabled', async () => {
    const wrapper = mountReplInput({ active: true, disabled: true })

    const input = wrapper.find('input.repl-input-field')
    await input.setValue('PRINT "Hello"')
    await input.trigger('keydown', { key: 'Enter' })

    expect(wrapper.emitted('execute')).toBeUndefined()
    wrapper.unmount()
  })

  describe('command history navigation', () => {
    it('emits navigateHistory with last index on first ArrowUp', async () => {
      const wrapper = mountReplInput({
        active: true,
        commandHistory: ['PRINT "A"', 'PRINT "B"', 'PRINT "C"'],
        historyIndex: -1,
      })

      const input = wrapper.find('input.repl-input-field')
      await input.trigger('keydown', { key: 'ArrowUp' })

      const emitted = wrapper.emitted('navigateHistory')
      expect(emitted).toHaveLength(1)
      expect(emitted![0]).toEqual([2]) // Last index
      wrapper.unmount()
    })

    it('emits navigateHistory with previous index on subsequent ArrowUp', async () => {
      const wrapper = mountReplInput({
        active: true,
        commandHistory: ['PRINT "A"', 'PRINT "B"', 'PRINT "C"'],
        historyIndex: 1,
      })

      const input = wrapper.find('input.repl-input-field')
      // First ArrowUp enters navigation mode, goes to last entry (index 2)
      await input.trigger('keydown', { key: 'ArrowUp' })
      // Simulate parent updating historyIndex to 2
      await wrapper.setProps({ historyIndex: 2 })
      // Second ArrowUp goes back one step to index 1
      await input.trigger('keydown', { key: 'ArrowUp' })

      const emitted = wrapper.emitted('navigateHistory')
      expect(emitted).toHaveLength(2)
      expect(emitted![0]).toEqual([2]) // First ArrowUp: go to last
      expect(emitted![1]).toEqual([1]) // Second ArrowUp: go back
      wrapper.unmount()
    })

    it('does not go below index 0 on ArrowUp', async () => {
      const wrapper = mountReplInput({
        active: true,
        commandHistory: ['PRINT "A"'],
        historyIndex: -1,
      })

      const input = wrapper.find('input.repl-input-field')
      // First ArrowUp enters navigation, goes to index 0
      await input.trigger('keydown', { key: 'ArrowUp' })
      await wrapper.setProps({ historyIndex: 0 })

      // Second ArrowUp should stay at 0
      await input.trigger('keydown', { key: 'ArrowUp' })

      const emitted = wrapper.emitted('navigateHistory')
      expect(emitted).toHaveLength(2)
      expect(emitted![0]).toEqual([0]) // First: go to last (only entry)
      expect(emitted![1]).toEqual([0]) // Second: clamped to 0
      wrapper.unmount()
    })

    it('does nothing on ArrowUp when history is empty', async () => {
      const wrapper = mountReplInput({
        active: true,
        commandHistory: [],
        historyIndex: -1,
      })

      const input = wrapper.find('input.repl-input-field')
      await input.trigger('keydown', { key: 'ArrowUp' })

      expect(wrapper.emitted('navigateHistory')).toBeUndefined()
      wrapper.unmount()
    })

    it('emits navigateHistory with next index on ArrowDown when navigating', async () => {
      const wrapper = mountReplInput({
        active: true,
        commandHistory: ['PRINT "A"', 'PRINT "B"', 'PRINT "C"'],
        historyIndex: -1,
      })

      const input = wrapper.find('input.repl-input-field')
      // First ArrowUp enters navigation mode, goes to last (index 2)
      await input.trigger('keydown', { key: 'ArrowUp' })
      await wrapper.setProps({ historyIndex: 2 })

      // Second ArrowUp goes to index 1
      await input.trigger('keydown', { key: 'ArrowUp' })
      await wrapper.setProps({ historyIndex: 1 })

      // ArrowDown goes back to index 2
      await input.trigger('keydown', { key: 'ArrowDown' })

      const emitted = wrapper.emitted('navigateHistory')
      expect(emitted).toHaveLength(3)
      expect(emitted![0]).toEqual([2]) // First ArrowUp: go to last
      expect(emitted![1]).toEqual([1]) // Second ArrowUp: go back
      expect(emitted![2]).toEqual([2]) // ArrowDown: go forward
      wrapper.unmount()
    })

    it('clears input on ArrowDown when at end of history', async () => {
      const wrapper = mountReplInput({
        active: true,
        commandHistory: ['PRINT "A"', 'PRINT "B"'],
        historyIndex: -1,
      })

      const input = wrapper.find('input.repl-input-field')
      // ArrowUp to enter navigation mode, go to last entry (index 1)
      await input.trigger('keydown', { key: 'ArrowUp' })
      await wrapper.setProps({ historyIndex: 1 })

      // ArrowDown at end of history should clear input
      await input.trigger('keydown', { key: 'ArrowDown' })

      // At end of history, should clear input (no emit)
      expect(wrapper.emitted('navigateHistory')).toHaveLength(1) // Only the ArrowUp
      expect((input.element as HTMLInputElement).value).toEqual('')
      wrapper.unmount()
    })

    it('does nothing on ArrowDown when not navigating history', async () => {
      const wrapper = mountReplInput({
        active: true,
        commandHistory: ['PRINT "A"', 'PRINT "B"'],
        historyIndex: -1,
      })

      const input = wrapper.find('input.repl-input-field')
      await input.trigger('keydown', { key: 'ArrowDown' })

      expect(wrapper.emitted('navigateHistory')).toBeUndefined()
      wrapper.unmount()
    })

    it('does nothing on ArrowUp when disabled', async () => {
      const wrapper = mountReplInput({
        active: true,
        disabled: true,
        commandHistory: ['PRINT "A"'],
        historyIndex: -1,
      })

      const input = wrapper.find('input.repl-input-field')
      await input.trigger('keydown', { key: 'ArrowUp' })

      expect(wrapper.emitted('navigateHistory')).toBeUndefined()
      wrapper.unmount()
    })

    it('updates input value when historyIndex prop changes', async () => {
      const wrapper = mountReplInput({
        active: true,
        commandHistory: ['PRINT "A"', 'PRINT "B"'],
        historyIndex: -1,
      })

      // First ArrowUp to enter navigation mode and emit navigateHistory(1)
      const input = wrapper.find('input.repl-input-field')
      await input.trigger('keydown', { key: 'ArrowUp' })

      // Simulate parent updating historyIndex prop
      await wrapper.setProps({ historyIndex: 1 })
      await nextTick()

      expect((input.element as HTMLInputElement).value).toEqual('PRINT "B"')
      wrapper.unmount()
    })

    it('resets history navigation when Enter is pressed', async () => {
      const wrapper = mountReplInput({
        active: true,
        commandHistory: ['PRINT "A"', 'PRINT "B"'],
        historyIndex: -1,
      })

      const input = wrapper.find('input.repl-input-field')
      // Navigate up
      await input.trigger('keydown', { key: 'ArrowUp' })
      // Execute (resets navigation)
      await input.setValue('PRINT "C"')
      await input.trigger('keydown', { key: 'Enter' })

      // Now ArrowUp should start fresh from end of history
      wrapper.emitted('navigateHistory')!.length = 0 // Clear previous emits
      await input.trigger('keydown', { key: 'ArrowUp' })

      const emitted = wrapper.emitted('navigateHistory')
      expect(emitted).toHaveLength(1)
      expect(emitted![0]).toEqual([1]) // Last index
      wrapper.unmount()
    })
  })
})
