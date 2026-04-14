// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'

import InputModeToggle from '@/features/ide/components/InputModeToggle.vue'

import { createI18nMock } from '../helpers/createI18nMock'

const mockT = createI18nMock({
  'ide.inputModeToggle.joystickTitle': 'Joystick Mode (STICK/STRIG)',
  'ide.inputModeToggle.keyboardTitle': 'Keyboard Mode (INKEY$)',
  'ide.inputModeToggle.joystick': 'Joy',
  'ide.inputModeToggle.keyboard': 'Key',
})

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: mockT }),
}))

const gameButtonStub = defineComponent({
  props: ['variant', 'type', 'icon', 'size', 'selected'],
  template: '<button :data-icon="icon" :data-selected="selected" :data-variant="variant" :data-testid="$attrs[\'data-testid\']"><slot /></button>',
})

const gameIconButtonStub = defineComponent({
  props: ['variant', 'type', 'icon', 'size', 'title', 'selected'],
  template: '<button :data-icon="icon" :data-selected="selected" :title="title" :data-variant="variant" :data-testid="$attrs[\'data-testid\']" />',
})

describe('InputModeToggle', () => {
  it('renders two buttons for joystick and keyboard modes', () => {
    const wrapper = mount(InputModeToggle, {
      props: { modelValue: 'joystick' },
      global: {
        stubs: { GameButton: gameButtonStub, GameIconButton: gameIconButtonStub },
      },
    })

    const buttons = wrapper.findAll('button')
    expect(buttons.length).toEqual(2)
    wrapper.unmount()
  })

  it('highlights joystick button when modelValue is joystick', () => {
    const wrapper = mount(InputModeToggle, {
      props: { modelValue: 'joystick' },
      global: {
        stubs: { GameButton: gameButtonStub, GameIconButton: gameIconButtonStub },
      },
    })

    const buttons = wrapper.findAll('button')
    const joystickButton = buttons.find(b => b.attributes('data-icon') === 'mdi:gamepad-variant')!
    const keyboardButton = buttons.find(b => b.attributes('data-icon') === 'mdi:keyboard')!

    expect(joystickButton.attributes('data-selected')).toEqual('true')
    expect(keyboardButton.attributes('data-selected')).toEqual('false')
    wrapper.unmount()
  })

  it('highlights keyboard button when modelValue is keyboard', () => {
    const wrapper = mount(InputModeToggle, {
      props: { modelValue: 'keyboard' },
      global: {
        stubs: { GameButton: gameButtonStub, GameIconButton: gameIconButtonStub },
      },
    })

    const buttons = wrapper.findAll('button')
    const joystickButton = buttons.find(b => b.attributes('data-icon') === 'mdi:gamepad-variant')!
    const keyboardButton = buttons.find(b => b.attributes('data-icon') === 'mdi:keyboard')!

    expect(joystickButton.attributes('data-selected')).toEqual('false')
    expect(keyboardButton.attributes('data-selected')).toEqual('true')
    wrapper.unmount()
  })

  it('emits update:modelValue with joystick when joystick button is clicked', async () => {
    const wrapper = mount(InputModeToggle, {
      props: { modelValue: 'keyboard' },
      global: {
        stubs: { GameButton: gameButtonStub, GameIconButton: gameIconButtonStub },
      },
    })

    const buttons = wrapper.findAll('button')
    const joystickButton = buttons.find(b => b.attributes('data-icon') === 'mdi:gamepad-variant')!
    await joystickButton.trigger('click')

    expect(wrapper.emitted('update:modelValue')).toHaveLength(1)
    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['joystick'])
    wrapper.unmount()
  })

  it('emits update:modelValue with keyboard when keyboard button is clicked', async () => {
    const wrapper = mount(InputModeToggle, {
      props: { modelValue: 'joystick' },
      global: {
        stubs: { GameButton: gameButtonStub, GameIconButton: gameIconButtonStub },
      },
    })

    const buttons = wrapper.findAll('button')
    const keyboardButton = buttons.find(b => b.attributes('data-icon') === 'mdi:keyboard')!
    await keyboardButton.trigger('click')

    expect(wrapper.emitted('update:modelValue')).toHaveLength(1)
    expect(wrapper.emitted('update:modelValue')![0]).toEqual(['keyboard'])
    wrapper.unmount()
  })

  it('uses GameIconButton in compact mode', () => {
    const wrapper = mount(InputModeToggle, {
      props: { modelValue: 'joystick', isCompact: true },
      global: {
        stubs: { GameButton: gameButtonStub, GameIconButton: gameIconButtonStub },
      },
    })

    const buttons = wrapper.findAll('button')
    expect(buttons[0]!.attributes('title')).toEqual('Joystick Mode (STICK/STRIG)')
    expect(buttons[1]!.attributes('title')).toEqual('Keyboard Mode (INKEY$)')
    wrapper.unmount()
  })

  it('uses GameButton (non-compact) by default', () => {
    const wrapper = mount(InputModeToggle, {
      props: { modelValue: 'joystick', isCompact: false },
      global: {
        stubs: { GameButton: gameButtonStub, GameIconButton: gameIconButtonStub },
      },
    })

    const buttons = wrapper.findAll('button')
    expect(buttons.length).toEqual(2)
    wrapper.unmount()
  })

  it('adds data-testid to buttons in compact mode', () => {
    const wrapper = mount(InputModeToggle, {
      props: { modelValue: 'joystick', isCompact: true },
      global: {
        stubs: { GameButton: gameButtonStub, GameIconButton: gameIconButtonStub },
      },
    })

    expect(wrapper.find('[data-testid="ide-joystick-button"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="ide-keyboard-button"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('adds data-testid to buttons in non-compact mode', () => {
    const wrapper = mount(InputModeToggle, {
      props: { modelValue: 'joystick', isCompact: false },
      global: {
        stubs: { GameButton: gameButtonStub, GameIconButton: gameIconButtonStub },
      },
    })

    expect(wrapper.find('[data-testid="ide-joystick-button"]').exists()).toBe(true)
    expect(wrapper.find('[data-testid="ide-keyboard-button"]').exists()).toBe(true)
    wrapper.unmount()
  })
})
