// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'

import { SHARED_DISPLAY_BUFFER_BYTES } from '@/core/animation/sharedDisplayBuffer'
import { SharedDisplayBufferAccessor } from '@/core/animation/sharedDisplayBufferAccessor'
import IdeBottomArea from '@/features/ide/components/IdeBottomArea.vue'

import { createTestKeyboardBuffer } from './helpers/createTestKeyboardBuffer'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

/**
 * Real accessor instance for IdeBottomArea integration tests.
 * Children are stubbed in these tests, so the accessor is unused at runtime.
 * A real instance is used because SharedDisplayBufferAccessor is a class type
 * that cannot be structurally satisfied by a plain object without type assertions.
 */
const MOCK_FULL_ACCESSOR: SharedDisplayBufferAccessor = new SharedDisplayBufferAccessor(
  new SharedArrayBuffer(SHARED_DISPLAY_BUFFER_BYTES),
)

describe('IdeBottomArea tab structure', () => {
  it('renders four flat tab panes: palettes, sprite, move, buffer', async () => {
    const keyboardView = createTestKeyboardBuffer()
    const wrapper = mount(IdeBottomArea, {
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
        sharedDisplayBufferAccessor: MOCK_FULL_ACCESSOR,
        keyboardView,
      },
      global: {
        stubs: {
          JoystickControl: true,
          GameTabs: defineComponent({
            props: ['modelValue', 'type'],
            template: '<div class="game-tabs-stub"><slot /></div>',
          }),
          GameTabPane: defineComponent({
            props: ['name', 'label'],
            template: '<div class="game-tab-pane-stub" :data-name="name"><slot /></div>',
          }),
          ActivePaletteDisplay: true,
          MovementCard: true,
          DisplayBufferSection: true,
          JoystickBufferSection: true,
          KeyboardBufferSection: true,
          SpriteSlotsSection: true,
          AnimationSyncSection: true,
        },
      },
    })

    const tabPanes = wrapper.findAll('.game-tab-pane-stub')
    expect(tabPanes.length).toBe(4)

    const names = tabPanes.map(p => p.attributes('data-name'))
    expect(names).toEqual(['palettes', 'sprite', 'move', 'buffer'])
    wrapper.unmount()
  })

  it('defaults to the palettes tab being active', async () => {
    const keyboardView = createTestKeyboardBuffer()
    const wrapper = mount(IdeBottomArea, {
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
        sharedDisplayBufferAccessor: MOCK_FULL_ACCESSOR,
        keyboardView,
      },
      global: {
        stubs: {
          JoystickControl: true,
          GameTabs: defineComponent({
            props: ['modelValue', 'type'],
            template: '<div class="game-tabs-stub" :data-active="modelValue"><slot /></div>',
          }),
          GameTabPane: defineComponent({
            props: ['name', 'label'],
            template: '<div class="game-tab-pane-stub" :data-name="name"><slot /></div>',
          }),
          ActivePaletteDisplay: true,
          MovementCard: true,
          DisplayBufferSection: true,
          JoystickBufferSection: true,
          KeyboardBufferSection: true,
          SpriteSlotsSection: true,
          AnimationSyncSection: true,
        },
      },
    })

    const tabs = wrapper.find('.game-tabs-stub')
    expect(tabs.attributes('data-active')).toBe('palettes')

    wrapper.unmount()
  })

  it('renders BUFFER tab content with all child sections', async () => {
    const keyboardView = createTestKeyboardBuffer()
    const wrapper = mount(IdeBottomArea, {
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
        sharedDisplayBufferAccessor: MOCK_FULL_ACCESSOR,
        keyboardView,
      },
      global: {
        stubs: {
          JoystickControl: true,
          GameTabs: defineComponent({
            props: ['modelValue', 'type'],
            template: '<div><slot /></div>',
          }),
          GameTabPane: defineComponent({ template: '<div><slot /></div>' }),
          ActivePaletteDisplay: true,
          MovementCard: true,
          DisplayBufferSection: defineComponent({
            template: '<div class="display-buffer-section" />',
          }),
          JoystickBufferSection: defineComponent({
            template: '<div class="joystick-buffer-section" />',
          }),
          KeyboardBufferSection: defineComponent({
            template: '<div class="keyboard-buffer-section" />',
          }),
          SpriteSlotsSection: defineComponent({
            template: '<div class="sprite-slots-section" />',
          }),
          AnimationSyncSection: defineComponent({
            template: '<div class="animation-sync-section" />',
          }),
        },
      },
    })

    expect(wrapper.find('.buffer-inspector-content').exists()).toBe(true)
    expect(wrapper.find('.display-buffer-section').exists()).toBe(true)
    expect(wrapper.find('.joystick-buffer-section').exists()).toBe(true)
    expect(wrapper.find('.keyboard-buffer-section').exists()).toBe(true)
    expect(wrapper.find('.sprite-slots-section').exists()).toBe(true)
    expect(wrapper.find('.animation-sync-section').exists()).toBe(true)

    wrapper.unmount()
  })
})
