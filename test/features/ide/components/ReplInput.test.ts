// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import ReplInput from '@/features/ide/components/ReplInput.vue'

describe('ReplInput', () => {
  function mountReplInput(props: {
    active?: boolean
    disabled?: boolean
  } = {}) {
    return mount(ReplInput, {
      props: {
        active: props.active ?? false,
        disabled: props.disabled ?? false,
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

  it('renders a text input with placeholder', () => {
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
})
