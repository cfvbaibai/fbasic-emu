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

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

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
    expect(title.text()).toBe('ide.bufferInspector.joystickTitle')
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
      'ide.bufferInspector.joystickUnavailable'
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
    expect(labels[0]!.text()).toBe('ide.bufferInspector.joystick0')
    expect(labels[1]!.text()).toBe('ide.bufferInspector.joystick1')
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
    expect(stickLabels[0]!.text()).toBe('ide.bufferInspector.joystickStick')
    expect(strigLabels[0]!.text()).toBe('ide.bufferInspector.joystickStrig')
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
      const truncatedBuffer = new SharedArrayBuffer(8) // needs 32 bytes
      const wrapper = mount(JoystickBufferSection, {
        props: {
          sharedJoystickBuffer: truncatedBuffer,
          tick: 0,
        },
      })

      const stickValues = wrapper.findAll('.joystick-stick-value')
      expect(stickValues.length).toBe(2)
      expect(stickValues[0]!.text()).toBe('0')
      expect(stickValues[1]!.text()).toBe('0')
      wrapper.unmount()
    })

    it('falls back to [0, 0] strig states when buffer is too small', () => {
      const truncatedBuffer = new SharedArrayBuffer(8) // needs 32 bytes
      const wrapper = mount(JoystickBufferSection, {
        props: {
          sharedJoystickBuffer: truncatedBuffer,
          tick: 0,
        },
      })

      const strigValues = wrapper.findAll('.joystick-strig-value')
      expect(strigValues.length).toBe(2)
      expect(strigValues[0]!.text()).toBe('0')
      expect(strigValues[1]!.text()).toBe('0')
      wrapper.unmount()
    })

    it('does not highlight any D-pad direction when buffer is too small', () => {
      const truncatedBuffer = new SharedArrayBuffer(8)
      const wrapper = mount(JoystickBufferSection, {
        props: {
          sharedJoystickBuffer: truncatedBuffer,
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

    it('falls back to [0, 0] when buffer is zero-length', () => {
      const emptyBuffer = new SharedArrayBuffer(0)
      const wrapper = mount(JoystickBufferSection, {
        props: {
          sharedJoystickBuffer: emptyBuffer,
          tick: 0,
        },
      })

      const stickValues = wrapper.findAll('.joystick-stick-value')
      const strigValues = wrapper.findAll('.joystick-strig-value')
      expect(stickValues[0]!.text()).toBe('0')
      expect(stickValues[1]!.text()).toBe('0')
      expect(strigValues[0]!.text()).toBe('0')
      expect(strigValues[1]!.text()).toBe('0')
      wrapper.unmount()
    })
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
