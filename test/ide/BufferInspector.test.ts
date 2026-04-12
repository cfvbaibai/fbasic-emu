// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'

import { SHARED_DISPLAY_BUFFER_BYTES } from '@/core/animation/sharedDisplayBuffer'
import { SharedDisplayBufferAccessor } from '@/core/animation/sharedDisplayBufferAccessor'
import { SyncCommandType } from '@/core/animation/sharedDisplayBuffer'
import type { SyncCommand } from '@/core/animation/sharedDisplayBufferAccessor'
import BufferInspector from '@/features/ide/components/BufferInspector.vue'
import type { ScreenBufferReader } from '@/features/ide/components/types'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

/** Minimal mock satisfying ScreenBufferReader type */
const MOCK_ACCESSOR: ScreenBufferReader = {
  readScreenChar: () => 0x20,
  readScreenPattern: () => 0,
}

/** Real accessor instance for IdeBottomArea tests (StateInspector needs the full type) */
const testBuffer = new SharedArrayBuffer(SHARED_DISPLAY_BUFFER_BYTES)
const MOCK_FULL_ACCESSOR = new SharedDisplayBufferAccessor(testBuffer)

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

describe('BufferInspector', () => {
  const mockAccessor = createMockAccessor()

  it('renders without errors', () => {
    const wrapper = mount(BufferInspector, {
      props: {
        spriteStates: [],
        spriteEnabled: false,
        sharedDisplayBufferAccessor: mockAccessor,
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
    const wrapper = mount(BufferInspector, {
      props: {
        spriteStates: [],
        spriteEnabled: false,
        sharedDisplayBufferAccessor: mockAccessor,
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
    const wrapper = mount(BufferInspector, {
      props: {
        spriteStates: [],
        spriteEnabled: false,
        sharedDisplayBufferAccessor: mockAccessor,
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

  it('renders content area with DisplayBufferSection, JoystickBufferSection, SpriteSlotsSection and AnimationSyncSection', () => {
    const wrapper = mount(BufferInspector, {
      props: {
        spriteStates: [],
        spriteEnabled: false,
        sharedDisplayBufferAccessor: mockAccessor,
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
    expect(wrapper.find('.sprite-slots-section').exists()).toBe(true)
    expect(wrapper.find('.animation-sync-section').exists()).toBe(true)
    wrapper.unmount()
  })

  it('passes sharedDisplayBufferAccessor to DisplayBufferSection', () => {
    const wrapper = mount(BufferInspector, {
      props: {
        spriteStates: [],
        spriteEnabled: false,
        sharedDisplayBufferAccessor: mockAccessor,
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
    const wrapper = mount(BufferInspector, {
      props: {
        spriteStates: [],
        spriteEnabled: false,
        sharedDisplayBufferAccessor: mockAccessor,
        sharedJoystickBuffer: buffer,
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

  it('passes spriteStates and spriteEnabled to SpriteSlotsSection', () => {
    const wrapper = mount(BufferInspector, {
      props: {
        spriteStates: [
          { spriteNumber: 0, x: 10, y: 20, visible: true, priority: 0, definition: null },
        ],
        spriteEnabled: true,
        sharedDisplayBufferAccessor: mockAccessor,
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
    const accessor = createMockAccessor({
      readSyncCommand: () => syncCommand,
      readAck: () => 1,
    })

    const wrapper = mount(BufferInspector, {
      props: {
        spriteStates: [],
        spriteEnabled: false,
        sharedDisplayBufferAccessor: accessor,
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
        sharedDisplayBufferAccessor: MOCK_FULL_ACCESSOR,
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
