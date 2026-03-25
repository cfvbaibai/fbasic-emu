import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent } from 'vue'

import NintendoController from '@/features/ide/components/NintendoController.vue'

const dpadStub = defineComponent({
  template: '<div class="dpad-stub" />',
})

const manualActionButtonStub = defineComponent({
  props: ['button', 'active'],
  emits: ['click'],
  template: '<button class="action-button-stub" :data-button="button" :data-active="active" @mousedown="$emit(\'click\', button)" />',
})

describe('NintendoController', () => {
  function createWrapper(heldButtons: Record<string, boolean> = {}) {
    return mount(NintendoController, {
      props: {
        joystickId: 0,
        heldButtons,
      },
      global: {
        stubs: {
          Dpad: dpadStub,
          ManualActionButton: manualActionButtonStub,
        },
      },
    })
  }

  it('renders controller container', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.nintendo-controller').exists()).toBe(true)
    wrapper.unmount()
  })

  it('renders Dpad component', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.dpad-stub').exists()).toBe(true)
    wrapper.unmount()
  })

  it('renders select and start buttons', () => {
    const wrapper = createWrapper()
    const buttons = wrapper.findAll('.action-button-stub')
    const selectButton = buttons.find(b => b.attributes('data-button') === 'select')
    const startButton = buttons.find(b => b.attributes('data-button') === 'start')
    expect(selectButton).toBeDefined()
    expect(startButton).toBeDefined()
    wrapper.unmount()
  })

  it('renders A and B action buttons', () => {
    const wrapper = createWrapper()
    const buttons = wrapper.findAll('.action-button-stub')
    const buttonA = buttons.find(b => b.attributes('data-button') === 'a')
    const buttonB = buttons.find(b => b.attributes('data-button') === 'b')
    expect(buttonA).toBeDefined()
    expect(buttonB).toBeDefined()
    wrapper.unmount()
  })

  it('passes active state from heldButtons to action buttons', () => {
    const wrapper = createWrapper({
      '0-select': true,
      '0-start': false,
      '0-a': true,
      '0-b': false,
    })
    const buttons = wrapper.findAll('.action-button-stub')
    const selectButton = buttons.find(b => b.attributes('data-button') === 'select')!
    const startButton = buttons.find(b => b.attributes('data-button') === 'start')!
    const buttonA = buttons.find(b => b.attributes('data-button') === 'a')!
    const buttonB = buttons.find(b => b.attributes('data-button') === 'b')!

    expect(selectButton.attributes('data-active')).toEqual('true')
    expect(startButton.attributes('data-active')).toEqual('false')
    expect(buttonA.attributes('data-active')).toEqual('true')
    expect(buttonB.attributes('data-active')).toEqual('false')
    wrapper.unmount()
  })

  it('emits dpadStart event from Dpad', async () => {
    const wrapper = createWrapper()
    const dpad = wrapper.findComponent(dpadStub)
    dpad.vm.$emit('dpadStart', 'up')
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('dpadStart')).toHaveLength(1)
    expect(wrapper.emitted('dpadStart')![0]).toEqual(['up'])
    wrapper.unmount()
  })

  it('emits dpadStop event from Dpad', async () => {
    const wrapper = createWrapper()
    const dpad = wrapper.findComponent(dpadStub)
    dpad.vm.$emit('dpadStop', 'down')
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('dpadStop')).toHaveLength(1)
    expect(wrapper.emitted('dpadStop')![0]).toEqual(['down'])
    wrapper.unmount()
  })

  it('emits actionButton event when action button is clicked', async () => {
    const wrapper = createWrapper()
    const buttons = wrapper.findAll('.action-button-stub')
    const buttonA = buttons.find(b => b.attributes('data-button') === 'a')!
    await buttonA.trigger('mousedown')

    expect(wrapper.emitted('actionButton')).toHaveLength(1)
    expect(wrapper.emitted('actionButton')![0]).toEqual(['a'])
    wrapper.unmount()
  })

  it('emits actionButton event for select button', async () => {
    const wrapper = createWrapper()
    const buttons = wrapper.findAll('.action-button-stub')
    const selectButton = buttons.find(b => b.attributes('data-button') === 'select')!
    await selectButton.trigger('mousedown')

    expect(wrapper.emitted('actionButton')).toHaveLength(1)
    expect(wrapper.emitted('actionButton')![0]).toEqual(['select'])
    wrapper.unmount()
  })

  it('uses correct joystickId for held button keys', () => {
    const wrapper = mount(NintendoController, {
      props: {
        joystickId: 1,
        heldButtons: { '1-a': true, '1-b': false },
      },
      global: {
        stubs: {
          Dpad: dpadStub,
          ManualActionButton: manualActionButtonStub,
        },
      },
    })

    const buttons = wrapper.findAll('.action-button-stub')
    const buttonA = buttons.find(b => b.attributes('data-button') === 'a')!
    const buttonB = buttons.find(b => b.attributes('data-button') === 'b')!

    expect(buttonA.attributes('data-active')).toEqual('true')
    expect(buttonB.attributes('data-active')).toEqual('false')
    wrapper.unmount()
  })

  it('renders select-start and action-buttons sections', () => {
    const wrapper = createWrapper()
    expect(wrapper.find('.select-start-buttons').exists()).toBe(true)
    expect(wrapper.find('.action-buttons').exists()).toBe(true)
    wrapper.unmount()
  })
})
