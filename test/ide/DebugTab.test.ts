// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'

import DebugTab from '@/features/ide/components/DebugTab.vue'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

const gameTabPaneStub = defineComponent({
  props: ['name', 'disabled'],
  template: '<div class="game-tab-pane-stub" :data-name="name" :data-disabled="disabled"><slot /><slot name="label" /></div>',
})

const gameIconStub = defineComponent({
  props: ['icon', 'size'],
  template: '<span class="game-icon-stub" />',
})

describe('DebugTab', () => {
  it('renders debug tab container', () => {
    const wrapper = mount(DebugTab, {
      props: { debugOutput: '', debugMode: true },
      global: {
        stubs: { GameTabPane: gameTabPaneStub, GameIcon: gameIconStub },
      },
    })

    expect(wrapper.find('.tab-content').exists()).toBe(true)
    expect(wrapper.find('.debug-content').exists()).toBe(true)
    wrapper.unmount()
  })

  it('disables tab pane when debugMode is false', () => {
    const wrapper = mount(DebugTab, {
      props: { debugOutput: 'some output', debugMode: false },
      global: {
        stubs: { GameTabPane: gameTabPaneStub, GameIcon: gameIconStub },
      },
    })

    const tabPane = wrapper.find('.game-tab-pane-stub')
    expect(tabPane.attributes('data-disabled')).toEqual('true')
    wrapper.unmount()
  })

  it('disables tab pane when debugMode is true but no output', () => {
    const wrapper = mount(DebugTab, {
      props: { debugOutput: '', debugMode: true },
      global: {
        stubs: { GameTabPane: gameTabPaneStub, GameIcon: gameIconStub },
      },
    })

    const tabPane = wrapper.find('.game-tab-pane-stub')
    expect(tabPane.attributes('data-disabled')).toEqual('true')
    wrapper.unmount()
  })

  it('enables tab pane when debugMode is true and has output', () => {
    const wrapper = mount(DebugTab, {
      props: { debugOutput: 'debug info here', debugMode: true },
      global: {
        stubs: { GameTabPane: gameTabPaneStub, GameIcon: gameIconStub },
      },
    })

    const tabPane = wrapper.find('.game-tab-pane-stub')
    expect(tabPane.attributes('data-disabled')).toEqual('false')
    wrapper.unmount()
  })

  it('displays debug output text in pre element', () => {
    const wrapper = mount(DebugTab, {
      props: { debugOutput: 'line 1\nline 2', debugMode: true },
      global: {
        stubs: { GameTabPane: gameTabPaneStub, GameIcon: gameIconStub },
      },
    })

    expect(wrapper.find('pre.debug-text').text()).toEqual('line 1\nline 2')
    wrapper.unmount()
  })

  it('passes correct name prop to GameTabPane', () => {
    const wrapper = mount(DebugTab, {
      props: { debugOutput: '', debugMode: false },
      global: {
        stubs: { GameTabPane: gameTabPaneStub, GameIcon: gameIconStub },
      },
    })

    const tabPane = wrapper.find('.game-tab-pane-stub')
    expect(tabPane.attributes('data-name')).toEqual('debug')
    wrapper.unmount()
  })

  it('uses default props when none provided', () => {
    const wrapper = mount(DebugTab, {
      props: {},
      global: {
        stubs: { GameTabPane: gameTabPaneStub, GameIcon: gameIconStub },
      },
    })

    expect(wrapper.find('pre.debug-text').text()).toEqual('')
    expect(wrapper.find('.game-tab-pane-stub').attributes('data-disabled')).toEqual('true')
    wrapper.unmount()
  })
})
