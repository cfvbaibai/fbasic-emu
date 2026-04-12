// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'

import { SHARED_DISPLAY_BUFFER_BYTES } from '@/core/animation/sharedDisplayBuffer'
import { SyncCommandType } from '@/core/animation/sharedDisplayBuffer'
import type { SyncCommand } from '@/core/animation/sharedDisplayBufferAccessor'
import { SharedDisplayBufferAccessor } from '@/core/animation/sharedDisplayBufferAccessor'
import type { KeyboardBufferView } from '@/core/devices/sharedKeyboardBuffer'
import { createSharedKeyboardBuffer, createViewsFromKeyboardBuffer } from '@/core/devices/sharedKeyboardBuffer'
import BufferInspector from '@/features/ide/components/BufferInspector.vue'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

/**
 * Real accessor instance for IdeBottomArea integration tests.
 * Both BufferInspector children are stubbed in these tests, so the accessor
 * is unused at runtime. A real instance is used because SharedDisplayBufferAccessor
 * is a class type that cannot be structurally satisfied by a plain object without
 * type assertions like `as never`.
 */
const MOCK_FULL_ACCESSOR: SharedDisplayBufferAccessor = new SharedDisplayBufferAccessor(
  new SharedArrayBuffer(SHARED_DISPLAY_BUFFER_BYTES),
)

/** Mock accessor with readSyncCommand/readAck for testing */
function createMockAccessor(overrides: Partial<SharedDisplayBufferAccessor> = {}): SharedDisplayBufferAccessor {
  return {
    readScreenChar: () => 0x20,
    readScreenPattern: () => 0,
    readSyncCommand: (): SyncCommand | null => null,
    readAck: (): number => 0,
    ...overrides,
  } as SharedDisplayBufferAccessor
}

/** Create a real keyboard buffer view for tests */
function createTestKeyboardView(): KeyboardBufferView {
  return createViewsFromKeyboardBuffer(createSharedKeyboardBuffer())
}

describe('BufferInspector', () => {
  const mockAccessor = createMockAccessor()

  it('renders without errors', () => {
    const keyboardView = createTestKeyboardView()
    const wrapper = mount(BufferInspector, {
      props: {
        spriteStates: [],
        spriteEnabled: false,
        sharedDisplayBufferAccessor: mockAccessor,
        keyboardView,
      },
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
    const keyboardView = createTestKeyboardView()
    const wrapper = mount(BufferInspector, {
      props: {
        spriteStates: [],
        spriteEnabled: false,
        sharedDisplayBufferAccessor: mockAccessor,
        keyboardView,
      },
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
    const keyboardView = createTestKeyboardView()
    const wrapper = mount(BufferInspector, {
      props: {
        spriteStates: [],
        spriteEnabled: false,
        sharedDisplayBufferAccessor: mockAccessor,
        keyboardView,
      },
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

  it('renders content area with DisplayBufferSection, JoystickBufferSection, KeyboardBufferSection, SpriteSlotsSection and AnimationSyncSection', () => {
    const keyboardView = createTestKeyboardView()
    const wrapper = mount(BufferInspector, {
      props: {
        spriteStates: [],
        spriteEnabled: false,
        sharedDisplayBufferAccessor: mockAccessor,
        keyboardView,
      },
      global: {
        stubs: {
          GameBlock: defineComponent({ template: '<div><slot /></div>' }),
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

  it('passes sharedDisplayBufferAccessor to DisplayBufferSection', () => {
    const keyboardView = createTestKeyboardView()
    const wrapper = mount(BufferInspector, {
      props: {
        spriteStates: [],
        spriteEnabled: false,
        sharedDisplayBufferAccessor: mockAccessor,
        keyboardView,
      },
      global: {
        stubs: {
          GameBlock: defineComponent({ template: '<div><slot /></div>' }),
        },
      },
    })

    const section = wrapper.findComponent({ name: 'DisplayBufferSection' })
    expect(section.exists()).toBe(true)
    expect(section.props('sharedDisplayBufferAccessor')).toEqual(mockAccessor)
    wrapper.unmount()
  })

  it('passes sharedJoystickBuffer to JoystickBufferSection', () => {
    const buffer = new SharedArrayBuffer(32)
    const keyboardView = createTestKeyboardView()
    const wrapper = mount(BufferInspector, {
      props: {
        spriteStates: [],
        spriteEnabled: false,
        sharedDisplayBufferAccessor: mockAccessor,
        sharedJoystickBuffer: buffer,
        keyboardView,
      },
      global: {
        stubs: {
          GameBlock: defineComponent({ template: '<div><slot /></div>' }),
        },
      },
    })

    const section = wrapper.findComponent({ name: 'JoystickBufferSection' })
    expect(section.exists()).toBe(true)
    expect(section.props('sharedJoystickBuffer')).toBe(buffer)
    wrapper.unmount()
  })

  it('passes keyboardView to KeyboardBufferSection', () => {
    const keyboardView = createTestKeyboardView()
    const wrapper = mount(BufferInspector, {
      props: {
        spriteStates: [],
        spriteEnabled: false,
        sharedDisplayBufferAccessor: mockAccessor,
        keyboardView,
      },
      global: {
        stubs: {
          GameBlock: defineComponent({ template: '<div><slot /></div>' }),
        },
      },
    })

    const section = wrapper.findComponent({ name: 'KeyboardBufferSection' })
    expect(section.exists()).toBe(true)
    expect(section.props('keyboardView')).toStrictEqual(keyboardView)
    wrapper.unmount()
  })

  it('passes spriteStates and spriteEnabled to SpriteSlotsSection', () => {
    const keyboardView = createTestKeyboardView()
    const wrapper = mount(BufferInspector, {
      props: {
        spriteStates: [
          { spriteNumber: 0, x: 10, y: 20, visible: true, priority: 0, definition: null },
        ],
        spriteEnabled: true,
        sharedDisplayBufferAccessor: mockAccessor,
        keyboardView,
      },
      global: {
        stubs: {
          GameBlock: defineComponent({ template: '<div><slot /></div>' }),
        },
      },
    })

    const section = wrapper.findComponent({ name: 'SpriteSlotsSection' })
    expect(section.exists()).toBe(true)
    expect(section.props('spriteStates')).toEqual([
      { spriteNumber: 0, x: 10, y: 20, visible: true, priority: 0, definition: null },
    ])
    expect(section.props('spriteEnabled')).toBe(true)
    wrapper.unmount()
  })

  it('passes sync command and ack status to AnimationSyncSection', () => {
    const syncCommand: SyncCommand = {
      commandType: SyncCommandType.START_MOVEMENT,
      actionNumber: 2,
      params: { startX: 10, startY: 20, direction: 1, speed: 3, distance: 50, priority: 0 },
    }
    const keyboardView = createTestKeyboardView()
    const accessor = createMockAccessor({
      readSyncCommand: () => syncCommand,
      readAck: () => 1,
    })

    const wrapper = mount(BufferInspector, {
      props: {
        spriteStates: [],
        spriteEnabled: false,
        sharedDisplayBufferAccessor: accessor,
        keyboardView,
      },
      global: {
        stubs: {
          GameBlock: defineComponent({ template: '<div><slot /></div>' }),
        },
      },
    })

    const section = wrapper.findComponent({ name: 'AnimationSyncSection' })
    expect(section.exists()).toBe(true)
    expect(section.props('syncCommand')).toEqual(syncCommand)
    expect(section.props('ackStatus')).toBe(1)
    wrapper.unmount()
  })
})

describe('IdeBottomArea tab integration', () => {
  it('renders both StateInspector and BufferInspector tab panes', async () => {
    // Dynamic import to avoid module caching issues
    const ideBottomArea = (await import('@/features/ide/components/IdeBottomArea.vue')).default

    const keyboardView = createTestKeyboardView()
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
        sharedDisplayBufferAccessor: MOCK_FULL_ACCESSOR,
        keyboardView,
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

    const keyboardView = createTestKeyboardView()
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
        sharedDisplayBufferAccessor: MOCK_FULL_ACCESSOR,
        keyboardView,
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
