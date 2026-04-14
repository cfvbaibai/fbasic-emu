// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'

import RuntimeOutput from '@/features/ide/components/RuntimeOutput.vue'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => {
      const messages: Record<string, string> = {
        'ide.output.title': 'Runtime Output',
        'ide.output.screen': 'Screen',
        'ide.output.variables': 'Variables',
        'ide.output.debug': 'Debug',
      }
      return messages[key] ?? key
    },
  }),
}))

const gameTabsStub = defineComponent({
  props: ['modelValue', 'type'],
  emits: ['update:modelValue'],
  template: '<div class="game-tabs-stub" data-testid="game-tabs"><slot /></div>',
})

const screenTabStub = defineComponent({
  props: ['errors'],
  template: '<div class="screen-tab-stub" data-testid="screen-tab" />',
})

const debugTabStub = defineComponent({
  props: ['debugOutput', 'debugMode'],
  template: '<div class="debug-tab-stub" data-testid="debug-tab" />',
})

const variablesTabStub = defineComponent({
  props: ['variables'],
  template: '<div class="variables-tab-stub" data-testid="variables-tab" />',
})

describe('RuntimeOutput', () => {
  it('renders runtime output container', () => {
    const wrapper = mount(RuntimeOutput, {
      props: {
        output: [],
        isRunning: false,
      },
      global: {
        stubs: {
          GameTabs: gameTabsStub,
          ScreenTab: screenTabStub,
          DebugTab: debugTabStub,
          VariablesTab: variablesTabStub,
        },
      },
    })

    expect(wrapper.find('.runtime-output').exists()).toBe(true)
    wrapper.unmount()
  })

  it('renders GameTabs with output-tabs class', () => {
    const wrapper = mount(RuntimeOutput, {
      props: {
        output: [],
        isRunning: false,
      },
      global: {
        stubs: {
          GameTabs: gameTabsStub,
          ScreenTab: screenTabStub,
          DebugTab: debugTabStub,
          VariablesTab: variablesTabStub,
        },
      },
    })

    const tabs = wrapper.find('[data-testid="game-tabs"]')
    expect(tabs.exists()).toBe(true)
    expect(tabs.classes()).toContain('output-tabs')
    wrapper.unmount()
  })

  it('renders ScreenTab component', () => {
    const wrapper = mount(RuntimeOutput, {
      props: {
        output: [],
        isRunning: false,
      },
      global: {
        stubs: {
          GameTabs: gameTabsStub,
          ScreenTab: screenTabStub,
          DebugTab: debugTabStub,
          VariablesTab: variablesTabStub,
        },
      },
    })

    expect(wrapper.find('[data-testid="screen-tab"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('renders DebugTab component', () => {
    const wrapper = mount(RuntimeOutput, {
      props: {
        output: [],
        isRunning: false,
      },
      global: {
        stubs: {
          GameTabs: gameTabsStub,
          ScreenTab: screenTabStub,
          DebugTab: debugTabStub,
          VariablesTab: variablesTabStub,
        },
      },
    })

    expect(wrapper.find('[data-testid="debug-tab"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('renders VariablesTab component', () => {
    const wrapper = mount(RuntimeOutput, {
      props: {
        output: [],
        isRunning: false,
      },
      global: {
        stubs: {
          GameTabs: gameTabsStub,
          ScreenTab: screenTabStub,
          DebugTab: debugTabStub,
          VariablesTab: variablesTabStub,
        },
      },
    })

    expect(wrapper.find('[data-testid="variables-tab"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('passes errors to ScreenTab', () => {
    const errors = [{ line: 5, message: 'error', type: 'Error' }]
    const wrapper = mount(RuntimeOutput, {
      props: {
        output: [],
        isRunning: false,
        errors,
      },
      global: {
        stubs: {
          GameTabs: gameTabsStub,
          ScreenTab: screenTabStub,
          DebugTab: debugTabStub,
          VariablesTab: variablesTabStub,
        },
      },
    })

    const screenTab = wrapper.findComponent(screenTabStub)
    expect(screenTab.props('errors')).toEqual(errors)
    wrapper.unmount()
  })

  it('passes debugOutput and debugMode to DebugTab', () => {
    const wrapper = mount(RuntimeOutput, {
      props: {
        output: [],
        isRunning: false,
        debugOutput: 'debug info',
        debugMode: true,
      },
      global: {
        stubs: {
          GameTabs: gameTabsStub,
          ScreenTab: screenTabStub,
          DebugTab: debugTabStub,
          VariablesTab: variablesTabStub,
        },
      },
    })

    const debugTab = wrapper.findComponent(debugTabStub)
    expect(debugTab.props('debugOutput')).toEqual('debug info')
    expect(debugTab.props('debugMode')).toBe(true)
    wrapper.unmount()
  })

  it('passes variables to VariablesTab', () => {
    const variables = { A: { value: 42, type: 0 }, B$: { value: 'hello', type: 1 } }
    const wrapper = mount(RuntimeOutput, {
      props: {
        output: [],
        isRunning: false,
        variables: variables as never,
      },
      global: {
        stubs: {
          GameTabs: gameTabsStub,
          ScreenTab: screenTabStub,
          DebugTab: debugTabStub,
          VariablesTab: variablesTabStub,
        },
      },
    })

    const variablesTab = wrapper.findComponent(variablesTabStub)
    expect(variablesTab.props('variables')).toEqual(variables)
    wrapper.unmount()
  })
})
