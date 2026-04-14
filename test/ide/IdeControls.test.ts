// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'

import IdeControls from '@/features/ide/components/IdeControls.vue'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => {
      const messages: Record<string, string> = {
        'ide.controls.run': 'Run',
        'ide.controls.stop': 'Stop',
        'ide.controls.clear': 'Clear',
        'ide.controls.debug': 'Debug',
      }
      return messages[key] ?? key
    },
  }),
}))

const gameIconButtonStub = defineComponent({
  props: ['type', 'disabled', 'icon', 'size', 'title', 'variant', 'selected', 'loading'],
  template: '<button :disabled="disabled || loading" :data-testid="$attrs[\'data-testid\']" :data-type="type" :data-icon="icon" :data-variant="variant" :data-selected="selected" :data-loading="loading" :title="title"><slot /></button>',
})

const inputModeToggleStub = defineComponent({
  props: ['modelValue', 'isCompact'],
  emits: ['update:modelValue'],
  template: '<div class="input-mode-toggle-stub" :data-value="modelValue" :data-compact="isCompact" />',
})

describe('IdeControls', () => {
  it('renders all control buttons', () => {
    const wrapper = mount(IdeControls, {
      props: { isRunning: false },
      global: {
        stubs: {
          GameIconButton: gameIconButtonStub,
          InputModeToggle: inputModeToggleStub,
        },
      },
    })

    const buttons = wrapper.findAll('button')
    expect(buttons.length).toEqual(4) // run, stop, clear, debug
    wrapper.unmount()
  })

  it('renders input mode toggle', () => {
    const wrapper = mount(IdeControls, {
      props: { isRunning: false },
      global: {
        stubs: {
          GameIconButton: gameIconButtonStub,
          InputModeToggle: inputModeToggleStub,
        },
      },
    })

    const toggle = wrapper.find('.input-mode-toggle-stub')
    expect(toggle.exists()).toBe(true)
    expect(toggle.attributes('data-compact')).toEqual('')
    wrapper.unmount()
  })

  it('emits run event when run button is clicked', async () => {
    const wrapper = mount(IdeControls, {
      props: { isRunning: false, canRun: true },
      global: {
        stubs: {
          GameIconButton: gameIconButtonStub,
          InputModeToggle: inputModeToggleStub,
        },
      },
    })

    const runButton = wrapper.find('[data-testid="ide-run-button"]')
    await runButton.trigger('click')

    expect(wrapper.emitted('run')).toHaveLength(1)
    wrapper.unmount()
  })

  it('emits stop event when stop button is clicked', async () => {
    const wrapper = mount(IdeControls, {
      props: { isRunning: true, canStop: true },
      global: {
        stubs: {
          GameIconButton: gameIconButtonStub,
          InputModeToggle: inputModeToggleStub,
        },
      },
    })

    const stopButton = wrapper.find('[data-testid="ide-stop-button"]')
    await stopButton.trigger('click')

    expect(wrapper.emitted('stop')).toHaveLength(1)
    wrapper.unmount()
  })

  it('disables run button when canRun is false', () => {
    const wrapper = mount(IdeControls, {
      props: { isRunning: true, canRun: false },
      global: {
        stubs: {
          GameIconButton: gameIconButtonStub,
          InputModeToggle: inputModeToggleStub,
        },
      },
    })

    const runButton = wrapper.find('[data-testid="ide-run-button"]')
    expect((runButton.element as HTMLButtonElement).disabled).toBe(true)
    wrapper.unmount()
  })

  it('enables run button when canRun is true', () => {
    const wrapper = mount(IdeControls, {
      props: { isRunning: false, canRun: true },
      global: {
        stubs: {
          GameIconButton: gameIconButtonStub,
          InputModeToggle: inputModeToggleStub,
        },
      },
    })

    const runButton = wrapper.find('[data-testid="ide-run-button"]')
    expect((runButton.element as HTMLButtonElement).disabled).toBe(false)
    wrapper.unmount()
  })

  it('disables stop button when canStop is false', () => {
    const wrapper = mount(IdeControls, {
      props: { isRunning: false, canStop: false },
      global: {
        stubs: {
          GameIconButton: gameIconButtonStub,
          InputModeToggle: inputModeToggleStub,
        },
      },
    })

    const stopButton = wrapper.find('[data-testid="ide-stop-button"]')
    expect((stopButton.element as HTMLButtonElement).disabled).toBe(true)
    wrapper.unmount()
  })

  it('emits clear event when clear button is clicked', async () => {
    const wrapper = mount(IdeControls, {
      props: { isRunning: false },
      global: {
        stubs: {
          GameIconButton: gameIconButtonStub,
          InputModeToggle: inputModeToggleStub,
        },
      },
    })

    const clearButton = wrapper.find('[data-testid="ide-clear-button"]')
    await clearButton.trigger('click')

    expect(wrapper.emitted('clear')).toHaveLength(1)
    wrapper.unmount()
  })

  it('emits toggleDebug event when debug button is clicked', async () => {
    const wrapper = mount(IdeControls, {
      props: { isRunning: false, debugMode: false },
      global: {
        stubs: {
          GameIconButton: gameIconButtonStub,
          InputModeToggle: inputModeToggleStub,
        },
      },
    })

    const debugButton = wrapper.find('[data-testid="ide-debug-toggle-button"]')
    await debugButton.trigger('click')

    expect(wrapper.emitted('toggleDebug')).toHaveLength(1)
    wrapper.unmount()
  })

  it('passes debugMode selected state to debug toggle button', () => {
    const wrapper = mount(IdeControls, {
      props: { isRunning: false, debugMode: true },
      global: {
        stubs: {
          GameIconButton: gameIconButtonStub,
          InputModeToggle: inputModeToggleStub,
        },
      },
    })

    const debugButton = wrapper.find('[data-testid="ide-debug-toggle-button"]')
    expect(debugButton.attributes('data-selected')).toEqual('true')
    wrapper.unmount()
  })

  it('emits update:inputMode when InputModeToggle changes', async () => {
    const wrapper = mount(IdeControls, {
      props: { isRunning: false, inputMode: 'joystick' },
      global: {
        stubs: {
          GameIconButton: gameIconButtonStub,
          InputModeToggle: inputModeToggleStub,
        },
      },
    })

    const toggle = wrapper.findComponent(inputModeToggleStub)
    toggle.vm.$emit('update:modelValue', 'keyboard')
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('update:inputMode')).toHaveLength(1)
    expect(wrapper.emitted('update:inputMode')![0]).toEqual(['keyboard'])
    wrapper.unmount()
  })

  it('renders control divider between toggle and buttons', () => {
    const wrapper = mount(IdeControls, {
      props: { isRunning: false },
      global: {
        stubs: {
          GameIconButton: gameIconButtonStub,
          InputModeToggle: inputModeToggleStub,
        },
      },
    })

    expect(wrapper.find('.control-divider').exists()).toBe(true)
    wrapper.unmount()
  })

  it('stop button uses mdi:stop icon', () => {
    const wrapper = mount(IdeControls, {
      props: { isRunning: true, canStop: true },
      global: {
        stubs: {
          GameIconButton: gameIconButtonStub,
          InputModeToggle: inputModeToggleStub,
        },
      },
    })

    const stopButton = wrapper.find('[data-testid="ide-stop-button"]')
    expect(stopButton.attributes('data-icon')).toEqual('mdi:stop')
    wrapper.unmount()
  })

  it('run button shows loading state after click', async () => {
    const wrapper = mount(IdeControls, {
      props: { isRunning: false, canRun: true },
      global: {
        stubs: {
          GameIconButton: gameIconButtonStub,
          InputModeToggle: inputModeToggleStub,
        },
      },
    })

    const runButton = wrapper.find('[data-testid="ide-run-button"]')
    expect(runButton.attributes('data-loading')).toEqual('false')

    await runButton.trigger('click')
    expect(runButton.attributes('data-loading')).toEqual('true')
    expect(wrapper.emitted('run')).toHaveLength(1)
    wrapper.unmount()
  })

  it('run button loading clears when isRunning becomes true', async () => {
    const wrapper = mount(IdeControls, {
      props: { isRunning: false, canRun: true },
      global: {
        stubs: {
          GameIconButton: gameIconButtonStub,
          InputModeToggle: inputModeToggleStub,
        },
      },
    })

    const runButton = wrapper.find('[data-testid="ide-run-button"]')
    await runButton.trigger('click')
    expect(runButton.attributes('data-loading')).toEqual('true')

    // Simulate the parent setting isRunning to true
    await wrapper.setProps({ isRunning: true, canRun: false, canStop: true })
    expect(runButton.attributes('data-loading')).toEqual('false')
    wrapper.unmount()
  })
})
