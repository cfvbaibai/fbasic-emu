// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'

import { SHARED_DISPLAY_BUFFER_BYTES } from '@/core/animation/sharedDisplayBuffer'
import { SharedDisplayBufferAccessor } from '@/core/animation/sharedDisplayBufferAccessor'
import IdeBottomArea from '@/features/ide/components/IdeBottomArea.vue'

import { createI18nMock } from '../helpers/createI18nMock'
import { createTestKeyboardBuffer } from './helpers/createTestKeyboardBuffer'

const mockT = createI18nMock({})

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: mockT }),
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

// --- Stub components with explicit props for prop-binding verification ---

const displayBufferSectionStub = defineComponent({
  props: ['sharedDisplayBufferAccessor'],
  template: '<div class="display-buffer-section" />',
})

const joystickBufferSectionStub = defineComponent({
  props: ['sharedJoystickBuffer'],
  template: '<div class="joystick-buffer-section" />',
})

const keyboardBufferSectionStub = defineComponent({
  props: ['keyboardView'],
  template: '<div class="keyboard-buffer-section" />',
})

const spriteSlotsSectionStub = defineComponent({
  props: ['spriteStates', 'spriteEnabled'],
  template: '<div class="sprite-slots-section" />',
})

const animationSyncSectionStub = defineComponent({
  props: ['syncCommand', 'ackStatus'],
  template: '<div class="animation-sync-section" />',
})

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
          DisplayBufferSection: displayBufferSectionStub,
          JoystickBufferSection: joystickBufferSectionStub,
          KeyboardBufferSection: keyboardBufferSectionStub,
          SpriteSlotsSection: spriteSlotsSectionStub,
          AnimationSyncSection: animationSyncSectionStub,
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

describe('IdeBottomArea buffer tab prop bindings', () => {
  function mountWithBufferStubs(
    extraProps: Record<string, unknown> = {},
  ) {
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
        ...extraProps,
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
          DisplayBufferSection: displayBufferSectionStub,
          JoystickBufferSection: joystickBufferSectionStub,
          KeyboardBufferSection: keyboardBufferSectionStub,
          SpriteSlotsSection: spriteSlotsSectionStub,
          AnimationSyncSection: animationSyncSectionStub,
        },
      },
    })
    return { wrapper, keyboardView }
  }

  it('passes sharedDisplayBufferAccessor to DisplayBufferSection', () => {
    const { wrapper } = mountWithBufferStubs()
    const section = wrapper.findComponent(displayBufferSectionStub)

    expect(section.props('sharedDisplayBufferAccessor')).toEqual(MOCK_FULL_ACCESSOR)
    wrapper.unmount()
  })

  it('passes sharedJoystickBuffer to JoystickBufferSection', () => {
    const joystickBuffer = new SharedArrayBuffer(16)
    const { wrapper } = mountWithBufferStubs({ sharedJoystickBuffer: joystickBuffer })
    const section = wrapper.findComponent(joystickBufferSectionStub)

    expect(section.props('sharedJoystickBuffer')).toBe(joystickBuffer)
    wrapper.unmount()
  })

  it('passes undefined sharedJoystickBuffer when not provided', () => {
    const { wrapper } = mountWithBufferStubs()
    const section = wrapper.findComponent(joystickBufferSectionStub)

    expect(section.props('sharedJoystickBuffer')).toBeUndefined()
    wrapper.unmount()
  })

  it('passes keyboardView to KeyboardBufferSection', () => {
    const { wrapper, keyboardView } = mountWithBufferStubs()
    const section = wrapper.findComponent(keyboardBufferSectionStub)

    // Verify the keyboardView object was passed (same underlying buffer)
    const received = section.props('keyboardView')
    expect(received.buffer).toBe(keyboardView.buffer)
    wrapper.unmount()
  })

  it('passes spriteStates and spriteEnabled to SpriteSlotsSection', () => {
    const spriteStates = [
      { spriteNumber: 0, x: 10, y: 20, visible: true, priority: 1 },
    ]
    const { wrapper } = mountWithBufferStubs({
      spriteStates,
      spriteEnabled: true,
    })
    const section = wrapper.findComponent(spriteSlotsSectionStub)

    expect(section.props('spriteStates')).toEqual(spriteStates)
    expect(section.props('spriteEnabled')).toBe(true)
    wrapper.unmount()
  })

  it('passes syncCommand and ackStatus to AnimationSyncSection', () => {
    const { wrapper } = mountWithBufferStubs()
    const section = wrapper.findComponent(animationSyncSectionStub)

    // syncCommand and ackStatus are computed from sharedDisplayBufferAccessor
    const syncCommand = section.props('syncCommand')
    const ackStatus = section.props('ackStatus')

    // Default accessor state: no sync command, ack = 0
    expect(syncCommand).toBeNull()
    expect(ackStatus).toBe(0)
    wrapper.unmount()
  })
})
