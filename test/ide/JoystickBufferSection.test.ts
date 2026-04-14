// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import {
  createSharedJoystickBuffer,
  createViewsFromJoystickBuffer,
  setStickState,
  setStrigState,
} from '@/core/devices/sharedJoystickBuffer'
import JoystickBufferSection from '@/features/ide/components/JoystickBufferSection.vue'

import { createI18nMock } from '../helpers/createI18nMock'

const mockT = createI18nMock({
  'ide.bufferInspector.joystickTitle': 'Joystick Buffer',
  'ide.bufferInspector.joystickUnavailable': 'No joystick buffer',
  'ide.bufferInspector.joystick0': 'Joy 0',
  'ide.bufferInspector.joystick1': 'Joy 1',
  'ide.bufferInspector.joystickStick': 'STICK',
  'ide.bufferInspector.joystickStrig': 'STRIG',
})

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: mockT }),
}))

function mountWithBuffer(bufferSize: number) {
  const buffer = new SharedArrayBuffer(bufferSize)
  const wrapper = mount(JoystickBufferSection, {
    props: {
      sharedJoystickBuffer: buffer,
      tick: 0,
    },
  })
  return wrapper
}

describe('JoystickBufferSection', () => {
  it('has the correct component name', () => {
    const wrapper = mount(JoystickBufferSection, {
      props: {
        sharedJoystickBuffer: undefined,
        tick: 0,
      },
    })

    expect(wrapper.vm.$options.name).toBe('JoystickBufferSection')
    wrapper.unmount()
  })

  it('renders section title', () => {
    const wrapper = mount(JoystickBufferSection, {
      props: {
        sharedJoystickBuffer: undefined,
        tick: 0,
      },
    })

    const title = wrapper.find('.joystick-buffer-title')
    expect(title.exists()).toBe(true)
    expect(title.text()).toBe('Joystick Buffer')
    wrapper.unmount()
  })

  it('shows unavailable message when no buffer is provided', () => {
    const wrapper = mount(JoystickBufferSection, {
      props: {
        sharedJoystickBuffer: undefined,
        tick: 0,
      },
    })

    expect(wrapper.find('.joystick-buffer-unavailable').exists()).toBe(true)
    expect(wrapper.find('.joystick-buffer-unavailable').text()).toBe(
      'No joystick buffer'
    )
    wrapper.unmount()
  })

  it('does not show unavailable message when buffer is provided', () => {
    const buffer = createSharedJoystickBuffer()
    const wrapper = mount(JoystickBufferSection, {
      props: {
        sharedJoystickBuffer: buffer,
        tick: 0,
      },
    })

    expect(wrapper.find('.joystick-buffer-unavailable').exists()).toBe(false)
    wrapper.unmount()
  })

  it('renders joystick labels for both joysticks', () => {
    const buffer = createSharedJoystickBuffer()
    const wrapper = mount(JoystickBufferSection, {
      props: {
        sharedJoystickBuffer: buffer,
        tick: 0,
      },
    })

    const labels = wrapper.findAll('.joystick-buffer-label')
    expect(labels.length).toBe(2)
    expect(labels[0]!.text()).toBe('Joy 0')
    expect(labels[1]!.text()).toBe('Joy 1')
    wrapper.unmount()
  })

  it('displays stick state values for both joysticks', () => {
    const buffer = createSharedJoystickBuffer()
    const view = createViewsFromJoystickBuffer(buffer)
    setStickState(view, 0, 5) // up + right
    setStickState(view, 1, 10) // left + down

    const wrapper = mount(JoystickBufferSection, {
      props: {
        sharedJoystickBuffer: buffer,
        tick: 0,
      },
    })

    const stickValues = wrapper.findAll('.joystick-stick-value')
    expect(stickValues.length).toBe(2)
    expect(stickValues[0]!.text()).toBe('5')
    expect(stickValues[1]!.text()).toBe('10')
    wrapper.unmount()
  })

  it('displays strig state values for both joysticks', () => {
    const buffer = createSharedJoystickBuffer()
    const view = createViewsFromJoystickBuffer(buffer)
    setStrigState(view, 0, 12) // A + B
    setStrigState(view, 1, 1) // start

    const wrapper = mount(JoystickBufferSection, {
      props: {
        sharedJoystickBuffer: buffer,
        tick: 0,
      },
    })

    const strigValues = wrapper.findAll('.joystick-strig-value')
    expect(strigValues.length).toBe(2)
    expect(strigValues[0]!.text()).toBe('12')
    expect(strigValues[1]!.text()).toBe('1')
    wrapper.unmount()
  })

  it('displays stick and strig labels', () => {
    const buffer = createSharedJoystickBuffer()
    const wrapper = mount(JoystickBufferSection, {
      props: {
        sharedJoystickBuffer: buffer,
        tick: 0,
      },
    })

    const stickLabels = wrapper.findAll('.joystick-stick-label')
    const strigLabels = wrapper.findAll('.joystick-strig-label')
    expect(stickLabels.length).toBe(2)
    expect(strigLabels.length).toBe(2)
    expect(stickLabels[0]!.text()).toBe('STICK')
    expect(strigLabels[0]!.text()).toBe('STRIG')
    wrapper.unmount()
  })

  it('renders D-pad visual indicator for each joystick', () => {
    const buffer = createSharedJoystickBuffer()
    const wrapper = mount(JoystickBufferSection, {
      props: {
        sharedJoystickBuffer: buffer,
        tick: 0,
      },
    })

    const dpads = wrapper.findAll('.joystick-dpad')
    expect(dpads.length).toBe(2)
    wrapper.unmount()
  })

  it('highlights D-pad directions based on stick state', () => {
    const buffer = createSharedJoystickBuffer()
    const view = createViewsFromJoystickBuffer(buffer)
    setStickState(view, 0, 9) // up + right = 8 + 1

    const wrapper = mount(JoystickBufferSection, {
      props: {
        sharedJoystickBuffer: buffer,
        tick: 0,
      },
    })

    const dpads = wrapper.findAll('.joystick-dpad')
    const dpad0 = dpads[0]!

    expect(dpad0.find('.dpad-up').classes()).toContain('dpad-active')
    expect(dpad0.find('.dpad-right').classes()).toContain('dpad-active')
    expect(dpad0.find('.dpad-down').classes()).not.toContain('dpad-active')
    expect(dpad0.find('.dpad-left').classes()).not.toContain('dpad-active')
    wrapper.unmount()
  })

  it('does not highlight any direction when stick state is 0', () => {
    const buffer = createSharedJoystickBuffer()
    const wrapper = mount(JoystickBufferSection, {
      props: {
        sharedJoystickBuffer: buffer,
        tick: 0,
      },
    })

    const dpads = wrapper.findAll('.joystick-dpad')
    const dpad0 = dpads[0]!

    expect(dpad0.find('.dpad-up').classes()).not.toContain('dpad-active')
    expect(dpad0.find('.dpad-right').classes()).not.toContain('dpad-active')
    expect(dpad0.find('.dpad-down').classes()).not.toContain('dpad-active')
    expect(dpad0.find('.dpad-left').classes()).not.toContain('dpad-active')
    wrapper.unmount()
  })

  it('shows button labels for strig state', () => {
    const buffer = createSharedJoystickBuffer()
    const view = createViewsFromJoystickBuffer(buffer)
    setStrigState(view, 0, 4) // B button

    const wrapper = mount(JoystickBufferSection, {
      props: {
        sharedJoystickBuffer: buffer,
        tick: 0,
      },
    })

    const buttons = wrapper.findAll('.joystick-dpad-buttons')
    expect(buttons.length).toBe(2)
    // Joystick 0 should show B button active
    const button0Text = buttons[0]!.text()
    expect(button0Text).toContain('B')
    wrapper.unmount()
  })

  describe('malformed SharedArrayBuffer', () => {
    it('falls back to [0, 0] stick states when buffer is too small', () => {
      const wrapper = mountWithBuffer(8) // needs 32 bytes

      const stickValues = wrapper.findAll('.joystick-stick-value')
      expect(stickValues.length).toEqual(2)
      expect(stickValues[0]!.text()).toEqual('0')
      expect(stickValues[1]!.text()).toEqual('0')
      wrapper.unmount()
    })

    it('falls back to [0, 0] strig states when buffer is too small', () => {
      const wrapper = mountWithBuffer(8) // needs 32 bytes

      const strigValues = wrapper.findAll('.joystick-strig-value')
      expect(strigValues.length).toEqual(2)
      expect(strigValues[0]!.text()).toEqual('0')
      expect(strigValues[1]!.text()).toEqual('0')
      wrapper.unmount()
    })

    it('does not highlight any D-pad direction when buffer is too small', () => {
      const wrapper = mountWithBuffer(8)

      const dpads = wrapper.findAll('.joystick-dpad')
      const dpad0 = dpads[0]!
      expect(dpad0.find('.dpad-up').classes()).not.toContain('dpad-active')
      expect(dpad0.find('.dpad-right').classes()).not.toContain('dpad-active')
      expect(dpad0.find('.dpad-down').classes()).not.toContain('dpad-active')
      expect(dpad0.find('.dpad-left').classes()).not.toContain('dpad-active')
      wrapper.unmount()
    })

    it('falls back to [0, 0] when buffer is zero-length', () => {
      const wrapper = mountWithBuffer(0)

      const stickValues = wrapper.findAll('.joystick-stick-value')
      const strigValues = wrapper.findAll('.joystick-strig-value')
      expect(stickValues[0]!.text()).toEqual('0')
      expect(stickValues[1]!.text()).toEqual('0')
      expect(strigValues[0]!.text()).toEqual('0')
      expect(strigValues[1]!.text()).toEqual('0')
      wrapper.unmount()
    })
  })

  it('highlights buttons based on strig state', () => {
    const buffer = createSharedJoystickBuffer()
    const view = createViewsFromJoystickBuffer(buffer)
    setStrigState(view, 0, 9) // A(8) + Start(1)

    const wrapper = mount(JoystickBufferSection, {
      props: {
        sharedJoystickBuffer: buffer,
        tick: 0,
      },
    })

    const buttonContainers = wrapper.findAll('.joystick-dpad-buttons')
    const buttons0 = buttonContainers[0]!.findAll('.dpad-button')
    expect(buttons0.length).toBe(4)

    // A and Start are active
    expect(buttons0[0]!.classes()).toContain('dpad-active') // A
    expect(buttons0[1]!.classes()).not.toContain('dpad-active') // B
    expect(buttons0[2]!.classes()).not.toContain('dpad-active') // Sel
    expect(buttons0[3]!.classes()).toContain('dpad-active') // Sta

    // Joystick 1 should have no active buttons
    const buttons1 = buttonContainers[1]!.findAll('.dpad-button')
    expect(buttons1.length).toBe(4)
    for (const btn of buttons1) {
      expect(btn.classes()).not.toContain('dpad-active')
    }
    wrapper.unmount()
  })

  it('highlights only A button when only A is active', () => {
    const buffer = createSharedJoystickBuffer()
    const view = createViewsFromJoystickBuffer(buffer)
    setStrigState(view, 0, 8) // A only

    const wrapper = mount(JoystickBufferSection, {
      props: {
        sharedJoystickBuffer: buffer,
        tick: 0,
      },
    })

    const buttonContainers = wrapper.findAll('.joystick-dpad-buttons')
    const buttons0 = buttonContainers[0]!.findAll('.dpad-button')
    expect(buttons0.length).toBe(4)

    // Only A is active
    expect(buttons0[0]!.classes()).toContain('dpad-active') // A
    expect(buttons0[1]!.classes()).not.toContain('dpad-active') // B
    expect(buttons0[2]!.classes()).not.toContain('dpad-active') // Sel
    expect(buttons0[3]!.classes()).not.toContain('dpad-active') // Sta

    // Joystick 1 should have no active buttons
    const buttons1 = buttonContainers[1]!.findAll('.dpad-button')
    expect(buttons1.length).toBe(4)
    for (const btn of buttons1) {
      expect(btn.classes()).not.toContain('dpad-active')
    }
    wrapper.unmount()
  })

  it('highlights only Start button when only Start is active', () => {
    const buffer = createSharedJoystickBuffer()
    const view = createViewsFromJoystickBuffer(buffer)
    setStrigState(view, 0, 1) // Start only

    const wrapper = mount(JoystickBufferSection, {
      props: {
        sharedJoystickBuffer: buffer,
        tick: 0,
      },
    })

    const buttonContainers = wrapper.findAll('.joystick-dpad-buttons')
    const buttons0 = buttonContainers[0]!.findAll('.dpad-button')
    expect(buttons0.length).toBe(4)

    // Only Start is active
    expect(buttons0[0]!.classes()).not.toContain('dpad-active') // A
    expect(buttons0[1]!.classes()).not.toContain('dpad-active') // B
    expect(buttons0[2]!.classes()).not.toContain('dpad-active') // Sel
    expect(buttons0[3]!.classes()).toContain('dpad-active') // Sta

    // Joystick 1 should have no active buttons
    const buttons1 = buttonContainers[1]!.findAll('.dpad-button')
    expect(buttons1.length).toBe(4)
    for (const btn of buttons1) {
      expect(btn.classes()).not.toContain('dpad-active')
    }
    wrapper.unmount()
  })

  it('does not highlight any button when strig state is 0', () => {
    const buffer = createSharedJoystickBuffer()

    const wrapper = mount(JoystickBufferSection, {
      props: {
        sharedJoystickBuffer: buffer,
        tick: 0,
      },
    })

    const buttonContainers = wrapper.findAll('.joystick-dpad-buttons')
    for (const container of buttonContainers) {
      const buttons = container.findAll('.dpad-button')
      for (const btn of buttons) {
        expect(btn.classes()).not.toContain('dpad-active')
      }
    }
    wrapper.unmount()
  })

  it('reacts to buffer changes when tick increments', async () => {
    const buffer = createSharedJoystickBuffer()
    const view = createViewsFromJoystickBuffer(buffer)

    const wrapper = mount(JoystickBufferSection, {
      props: {
        sharedJoystickBuffer: buffer,
        tick: 0,
      },
    })

    // Initial state should be 0
    const stickValues = wrapper.findAll('.joystick-stick-value')
    expect(stickValues[0]!.text()).toBe('0')

    // Mutate the buffer directly (simulating main thread write)
    setStickState(view, 0, 15) // all directions

    // Increment tick to trigger re-read of buffer
    await wrapper.setProps({ tick: 1 })

    const updatedStickValues = wrapper.findAll('.joystick-stick-value')
    expect(updatedStickValues[0]!.text()).toBe('15')
    wrapper.unmount()
  })
})
