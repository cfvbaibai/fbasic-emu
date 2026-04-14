// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'

import EditorViewToggle from '@/features/ide/components/EditorViewToggle.vue'

import { createI18nMock } from '../helpers/createI18nMock'

const mockT = createI18nMock({
  'ide.editorViewToggle.codeTitle': 'Code',
  'ide.editorViewToggle.bgTitle': 'BG',
  'ide.editorViewToggle.code': 'Code',
  'ide.editorViewToggle.bg': 'BG',
})

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: mockT }),
}))

const gameButtonStub = defineComponent({
  props: ['variant', 'type', 'icon', 'size', 'selected'],
  template: '<button :data-icon="icon" :data-selected="selected" :data-variant="variant"><slot /></button>',
})

const gameIconButtonStub = defineComponent({
  props: ['variant', 'type', 'icon', 'size', 'title', 'selected'],
  template: '<button :data-icon="icon" :data-selected="selected" :title="title" :data-variant="variant" />',
})

describe('EditorViewToggle', () => {
  it('renders two buttons for code and bg views', () => {
    const wrapper = mount(EditorViewToggle, {
      props: { modelValue: 'code' },
      global: {
        stubs: { GameButton: gameButtonStub, GameIconButton: gameIconButtonStub },
      },
    })

    const buttons = wrapper.findAll('button')
    expect(buttons.length).toEqual(2)
    wrapper.unmount()
  })

  it('highlights code button when modelValue is code', () => {
    const wrapper = mount(EditorViewToggle, {
      props: { modelValue: 'code' },
      global: {
        stubs: { GameButton: gameButtonStub, GameIconButton: gameIconButtonStub },
      },
    })

    const buttons = wrapper.findAll('button')
    const codeButton = buttons.find(b => b.attributes('data-icon') === 'mdi:code-tags')!
    const bgButton = buttons.find(b => b.attributes('data-icon') === 'mdi:view-grid')!

    expect(codeButton.attributes('data-selected')).toEqual('true')
    expect(bgButton.attributes('data-selected')).toEqual('false')
    wrapper.unmount()
  })

  it('highlights bg button when modelValue is bg', () => {
    const wrapper = mount(EditorViewToggle, {
      props: { modelValue: 'bg' },
      global: {
        stubs: { GameButton: gameButtonStub, GameIconButton: gameIconButtonStub },
      },
    })

    const buttons = wrapper.findAll('button')
    const codeButton = buttons.find(b => b.attributes('data-icon') === 'mdi:code-tags')!
    const bgButton = buttons.find(b => b.attributes('data-icon') === 'mdi:view-grid')!

    expect(codeButton.attributes('data-selected')).toEqual('false')
    expect(bgButton.attributes('data-selected')).toEqual('true')
    wrapper.unmount()
  })

  it('emits update:modelValue with code when code button is clicked', async () => {
    const wrapper = mount(EditorViewToggle, {
      props: { modelValue: 'bg' },
      global: {
        stubs: { GameButton: gameButtonStub, GameIconButton: gameIconButtonStub },
      },
    })

    const buttons = wrapper.findAll('button')
    const codeButton = buttons.find(b => b.attributes('data-icon') === 'mdi:code-tags')!
    await codeButton.trigger('click')

    expect(wrapper.emitted('update:modelValue')).toHaveLength(1)
    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['code'])
    wrapper.unmount()
  })

  it('emits update:modelValue with bg when bg button is clicked', async () => {
    const wrapper = mount(EditorViewToggle, {
      props: { modelValue: 'code' },
      global: {
        stubs: { GameButton: gameButtonStub, GameIconButton: gameIconButtonStub },
      },
    })

    const buttons = wrapper.findAll('button')
    const bgButton = buttons.find(b => b.attributes('data-icon') === 'mdi:view-grid')!
    await bgButton.trigger('click')

    expect(wrapper.emitted('update:modelValue')).toHaveLength(1)
    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['bg'])
    wrapper.unmount()
  })

  it('uses GameButton (non-compact) by default', () => {
    const wrapper = mount(EditorViewToggle, {
      props: { modelValue: 'code', isCompact: false },
      global: {
        stubs: { GameButton: gameButtonStub, GameIconButton: gameIconButtonStub },
      },
    })

    // Non-compact mode uses GameButton which has slots (text content)
    const buttons = wrapper.findAll('button')
    // In non-compact mode, buttons have text labels
    expect(buttons.length).toEqual(2)
    wrapper.unmount()
  })

  it('uses GameIconButton in compact mode', () => {
    const wrapper = mount(EditorViewToggle, {
      props: { modelValue: 'code', isCompact: true },
      global: {
        stubs: { GameButton: gameButtonStub, GameIconButton: gameIconButtonStub },
      },
    })

    // Compact mode uses GameIconButton (no text, just icons)
    const buttons = wrapper.findAll('button')
    // Both buttons should have title attributes (from GameIconButton)
    expect(buttons[0]!.attributes('title')).toEqual('Code')
    expect(buttons[1]!.attributes('title')).toEqual('BG')
    wrapper.unmount()
  })
})
