// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'

import VariablesTab from '@/features/ide/components/VariablesTab.vue'

import { createI18nMock } from '../helpers/createI18nMock'

const mockT = createI18nMock({
  'ide.output.variables': 'Variables',
})

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: mockT }),
}))

const gameTabPaneStub = defineComponent({
  props: ['name', 'disabled'],
  template: '<div class="game-tab-pane-stub" :data-name="name" :data-disabled="disabled"><slot /><slot name="label" /></div>',
})

const gameIconStub = defineComponent({
  props: ['icon', 'size'],
  template: '<span class="game-icon-stub" />',
})

const gameTagStub = defineComponent({
  props: ['type', 'size'],
  template: '<span class="game-tag-stub" :data-type="type" :data-size="size"><slot /></span>',
})

describe('VariablesTab', () => {
  it('renders with empty variables object', () => {
    const wrapper = mount(VariablesTab, {
      props: { variables: {} },
      global: {
        stubs: {
          GameTabPane: gameTabPaneStub,
          GameIcon: gameIconStub,
          GameTag: gameTagStub,
        },
      },
    })

    expect(wrapper.find('.variable-list').exists()).toBe(true)
    expect(wrapper.findAll('.variable-item').length).toEqual(0)
    wrapper.unmount()
  })

  it('renders variable items from variables prop', () => {
    const variables = {
      A: { value: 42, type: 0 },
      B$: { value: 'hello', type: 1 },
    }
    const wrapper = mount(VariablesTab, {
      props: { variables: variables as never },
      global: {
        stubs: {
          GameTabPane: gameTabPaneStub,
          GameIcon: gameIconStub,
          GameTag: gameTagStub,
        },
      },
    })

    const items = wrapper.findAll('.variable-item')
    expect(items.length).toEqual(2)
    wrapper.unmount()
  })

  it('displays variable name and value for each variable', () => {
    const variables = {
      X: { value: 100, type: 0 },
      NAME$: { value: 'Test', type: 1 },
    }
    const wrapper = mount(VariablesTab, {
      props: { variables: variables as never },
      global: {
        stubs: {
          GameTabPane: gameTabPaneStub,
          GameIcon: gameIconStub,
          GameTag: gameTagStub,
        },
      },
    })

    const items = wrapper.findAll('.variable-item')
    expect(items[0]!.find('.variable-name').text()).toEqual('X')
    expect(items[0]!.find('.variable-value').text()).toEqual('100')
    expect(items[1]!.find('.variable-name').text()).toEqual('NAME$')
    expect(items[1]!.find('.variable-value').text()).toEqual('Test')
    wrapper.unmount()
  })

  it('disables tab pane when no variables are present', () => {
    const wrapper = mount(VariablesTab, {
      props: { variables: {} },
      global: {
        stubs: {
          GameTabPane: gameTabPaneStub,
          GameIcon: gameIconStub,
          GameTag: gameTagStub,
        },
      },
    })

    const tabPane = wrapper.find('.game-tab-pane-stub')
    expect(tabPane.attributes('data-disabled')).toEqual('true')
    wrapper.unmount()
  })

  it('enables tab pane when variables are present', () => {
    const wrapper = mount(VariablesTab, {
      props: { variables: { A: { value: 1, type: 0 } } as never },
      global: {
        stubs: {
          GameTabPane: gameTabPaneStub,
          GameIcon: gameIconStub,
          GameTag: gameTagStub,
        },
      },
    })

    const tabPane = wrapper.find('.game-tab-pane-stub')
    expect(tabPane.attributes('data-disabled')).toEqual('false')
    wrapper.unmount()
  })

  it('shows correct variable count in GameTag', () => {
    const variables = {
      A: { value: 1, type: 0 },
      B: { value: 2, type: 0 },
      C: { value: 3, type: 0 },
    }
    const wrapper = mount(VariablesTab, {
      props: { variables: variables as never },
      global: {
        stubs: {
          GameTabPane: gameTabPaneStub,
          GameIcon: gameIconStub,
          GameTag: gameTagStub,
        },
      },
    })

    const tag = wrapper.find('.game-tag-stub')
    expect(tag.text()).toEqual('3')
    wrapper.unmount()
  })

  it('shows zero count in GameTag when no variables', () => {
    const wrapper = mount(VariablesTab, {
      props: { variables: {} },
      global: {
        stubs: {
          GameTabPane: gameTabPaneStub,
          GameIcon: gameIconStub,
          GameTag: gameTagStub,
        },
      },
    })

    const tag = wrapper.find('.game-tag-stub')
    expect(tag.text()).toEqual('0')
    wrapper.unmount()
  })

  it('hides GameTag when no variables (tag-hidden class)', () => {
    const wrapper = mount(VariablesTab, {
      props: { variables: {} },
      global: {
        stubs: {
          GameTabPane: gameTabPaneStub,
          GameIcon: gameIconStub,
          GameTag: gameTagStub,
        },
      },
    })

    const tag = wrapper.find('.game-tag-stub')
    expect(tag.classes()).toContain('tag-hidden')
    wrapper.unmount()
  })

  it('does not add tag-hidden class when variables exist', () => {
    const wrapper = mount(VariablesTab, {
      props: { variables: { A: { value: 1, type: 0 } } as never },
      global: {
        stubs: {
          GameTabPane: gameTabPaneStub,
          GameIcon: gameIconStub,
          GameTag: gameTagStub,
        },
      },
    })

    const tag = wrapper.find('.game-tag-stub')
    expect(tag.classes()).not.toContain('tag-hidden')
    wrapper.unmount()
  })

  it('passes correct name prop to GameTabPane', () => {
    const wrapper = mount(VariablesTab, {
      props: { variables: {} },
      global: {
        stubs: {
          GameTabPane: gameTabPaneStub,
          GameIcon: gameIconStub,
          GameTag: gameTagStub,
        },
      },
    })

    const tabPane = wrapper.find('.game-tab-pane-stub')
    expect(tabPane.attributes('data-name')).toEqual('variables')
    wrapper.unmount()
  })
})
