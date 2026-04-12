// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'

import type { SharedDisplayBufferAccessor } from '@/core/animation/sharedDisplayBufferAccessor'
import BufferInspector from '@/features/ide/components/BufferInspector.vue'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

/** Minimal mock satisfying SharedDisplayBufferAccessor type (never called in stubbed tests) */
const MOCK_ACCESSOR: SharedDisplayBufferAccessor = {} as SharedDisplayBufferAccessor

describe('BufferInspector', () => {
  it('renders without errors', () => {
    const wrapper = mount(BufferInspector, {
      global: {
        stubs: {
          GameBlock: defineComponent({ template: '<div><slot /></div>' }),
        },
      },
    })

    expect(wrapper.exists()).toBe(true)
    wrapper.unmount()
  })

  it('has the correct component name', () => {
    const wrapper = mount(BufferInspector, {
      global: {
        stubs: {
          GameBlock: defineComponent({ template: '<div><slot /></div>' }),
        },
      },
    })

    expect(wrapper.vm.$options.name).toBe('BufferInspector')
    wrapper.unmount()
  })

  it('displays the title from i18n key', () => {
    const wrapper = mount(BufferInspector, {
      global: {
        stubs: {
          GameBlock: defineComponent({
            props: ['title'],
            template: '<div class="game-block-stub" :data-title="title"><slot /></div>',
          }),
        },
      },
    })

    const block = wrapper.find('.game-block-stub')
    expect(block.exists()).toBe(true)
    expect(block.attributes('data-title')).toBe('ide.bufferInspector.title')
    wrapper.unmount()
  })

  it('renders empty content area', () => {
    const wrapper = mount(BufferInspector, {
      global: {
        stubs: {
          GameBlock: defineComponent({ template: '<div><slot /></div>' }),
        },
      },
    })

    // Component should exist with no errors, content is empty shell
    expect(wrapper.find('.buffer-inspector-content').exists()).toBe(true)
    wrapper.unmount()
  })
})

describe('IdeBottomArea tab integration', () => {
  it('renders both StateInspector and BufferInspector tab panes', async () => {
    // Dynamic import to avoid module caching issues
    const ideBottomArea = (await import('@/features/ide/components/IdeBottomArea.vue')).default

    const wrapper = mount(ideBottomArea, {
      props: {
        screenBuffer: [],
        cursorX: 0,
        cursorY: 0,
        bgPalette: 1,
        spritePalette: 1,
        backdropColor: 0,
        cgenMode: 2,
        spriteStates: [],
        spriteEnabled: false,
        sharedDisplayBufferAccessor: MOCK_ACCESSOR,
      },
      global: {
        stubs: {
          JoystickControl: true,
          StateInspector: true,
          BufferInspector: true,
          GameBlock: defineComponent({
            props: ['title', 'titleIcon', 'hideHeader'],
            template: '<div class="game-block-stub"><slot /></div>',
          }),
          GameTabs: defineComponent({
            props: ['modelValue', 'type'],
            template: '<div class="game-tabs-stub"><slot /></div>',
          }),
          GameTabPane: defineComponent({
            props: ['name', 'label'],
            template: '<div class="game-tab-pane-stub" :data-name="name"><slot /></div>',
          }),
        },
      },
    })

    const tabPanes = wrapper.findAll('.game-tab-pane-stub')
    expect(tabPanes.length).toBe(2)

    const names = tabPanes.map(p => p.attributes('data-name'))
    expect(names).toContain('state')
    expect(names).toContain('buffer')

    wrapper.unmount()
  })

  it('defaults to the state tab being active', async () => {
    const ideBottomAreaComponent = (await import('@/features/ide/components/IdeBottomArea.vue')).default

    const wrapper = mount(ideBottomAreaComponent, {
      props: {
        screenBuffer: [],
        cursorX: 0,
        cursorY: 0,
        bgPalette: 1,
        spritePalette: 1,
        backdropColor: 0,
        cgenMode: 2,
        spriteStates: [],
        spriteEnabled: false,
        sharedDisplayBufferAccessor: MOCK_ACCESSOR,
      },
      global: {
        stubs: {
          JoystickControl: true,
          StateInspector: true,
          BufferInspector: true,
          GameBlock: defineComponent({
            props: ['title', 'titleIcon', 'hideHeader'],
            template: '<div class="game-block-stub"><slot /></div>',
          }),
          GameTabs: defineComponent({
            props: ['modelValue', 'type'],
            template: '<div class="game-tabs-stub" :data-active="modelValue"><slot /></div>',
          }),
          GameTabPane: defineComponent({
            props: ['name', 'label'],
            template: '<div class="game-tab-pane-stub" :data-name="name"><slot /></div>',
          }),
        },
      },
    })

    const tabs = wrapper.find('.game-tabs-stub')
    expect(tabs.attributes('data-active')).toBe('state')

    wrapper.unmount()
  })
})
