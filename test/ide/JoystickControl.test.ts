// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, reactive, ref } from 'vue'

import JoystickControl from '@/features/ide/components/JoystickControl.vue'

import { createI18nMock } from '../helpers/createI18nMock'

const mockT = createI18nMock({
  'ide.joystick.control': 'Joystick Control',
  'ide.joystick.joystick0': 'Joystick 0',
  'ide.joystick.joystick1': 'Joystick 1',
  'ide.joystick.joystick': 'Joystick {id}',
  'ide.joystick.keyboardHint': 'Keyboard control enabled',
  'ide.joystick.configureKeys': 'Configure Keys',
})

vi.mock('vue-i18n', () => ({
  useI18n: () => ({ t: mockT }),
}))

const mockStartDpadHold = vi.fn()
const mockStopDpadHold = vi.fn()
const mockToggleActionButton = vi.fn()
const mockUpdateKeyBindings = vi.fn()
const mockResetToDefaults = vi.fn()

const mockHeldButtons = reactive<Record<string, boolean>>({})
const mockFlashingCells = ref(new Set<string>())
const mockKeyBindings = ref({
  joystick0: {
    up: { key: 'KeyW', displayName: 'W' },
    down: { key: 'KeyS', displayName: 'S' },
    left: { key: 'KeyA', displayName: 'A' },
    right: { key: 'KeyD', displayName: 'D' },
    select: { key: 'ShiftRight', displayName: 'RShift' },
    start: { key: 'Enter', displayName: 'Enter' },
    a: { key: 'KeyJ', displayName: 'J' },
    b: { key: 'KeyK', displayName: 'K' },
  },
  joystick1: {
    up: { key: 'ArrowUp', displayName: 'Up' },
    down: { key: 'ArrowDown', displayName: 'Down' },
    left: { key: 'ArrowLeft', displayName: 'Left' },
    right: { key: 'ArrowRight', displayName: 'Right' },
    select: { key: 'Numpad0', displayName: 'Num0' },
    start: { key: 'NumpadEnter', displayName: 'NumEnter' },
    a: { key: 'Numpad1', displayName: 'Num1' },
    b: { key: 'Numpad2', displayName: 'Num2' },
  },
})

vi.mock('@/core/devices', () => ({
  createViewsFromJoystickBuffer: vi.fn(() => null),
}))

vi.mock('@/features/ide/composables/useJoystickEvents', () => ({
  useJoystickEvents: () => ({
    heldButtons: mockHeldButtons,
    flashingCells: mockFlashingCells,
    startDpadHold: mockStartDpadHold,
    stopDpadHold: mockStopDpadHold,
    toggleActionButton: mockToggleActionButton,
  }),
}))

vi.mock('@/features/ide/composables/useKeyboardJoystick', () => ({
  useKeyboardJoystick: () => ({
    keyBindings: mockKeyBindings,
    updateKeyBindings: mockUpdateKeyBindings,
    resetToDefaults: mockResetToDefaults,
  }),
}))

const gameBlockStub = defineComponent({
  props: ['title', 'titleIcon'],
  template: '<div class="game-block-stub"><slot /></div>',
})

const gameSubBlockStub = defineComponent({
  props: ['title'],
  template: '<div class="game-sub-block-stub" :data-title="title"><slot /></div>',
})

const gameButtonStub = defineComponent({
  props: ['size'],
  template: '<button class="game-button-stub"><slot /></button>',
})

const nintendoControllerStub = defineComponent({
  props: ['joystickId', 'heldButtons'],
  emits: ['dpadStart', 'dpadStop', 'actionButton'],
  template: '<div class="nintendo-controller-stub" :data-joystick-id="joystickId" />',
})

const joystickStatusTableStub = defineComponent({
  props: ['statusData', 'flashingCells'],
  template: '<div class="joystick-status-table-stub" :data-count="statusData.length" />',
})

const joystickKeybindingPanelStub = defineComponent({
  props: ['modelValue', 'keyBindings'],
  emits: ['update:modelValue', 'update:keyBindings', 'reset'],
  template: '<div class="joystick-keybinding-panel-stub" :data-visible="modelValue" />',
})

describe('JoystickControl', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders control panel with GameBlock', () => {
    const wrapper = mount(JoystickControl, {
      props: {},
      global: {
        stubs: {
          GameBlock: gameBlockStub,
          GameSubBlock: gameSubBlockStub,
          GameButton: gameButtonStub,
          NintendoController: nintendoControllerStub,
          JoystickStatusTable: joystickStatusTableStub,
          JoystickKeybindingPanel: joystickKeybindingPanelStub,
        },
      },
    })

    expect(wrapper.find('.game-block-stub').exists()).toBe(true)
    expect(wrapper.find('.joystick-control').exists()).toBe(true)
    wrapper.unmount()
  })

  it('renders two NintendoController instances for joysticks 0 and 1', () => {
    const wrapper = mount(JoystickControl, {
      props: {},
      global: {
        stubs: {
          GameBlock: gameBlockStub,
          GameSubBlock: gameSubBlockStub,
          GameButton: gameButtonStub,
          NintendoController: nintendoControllerStub,
          JoystickStatusTable: joystickStatusTableStub,
          JoystickKeybindingPanel: joystickKeybindingPanelStub,
        },
      },
    })

    const controllers = wrapper.findAll('.nintendo-controller-stub')
    expect(controllers.length).toEqual(2)
    expect(controllers[0]!.attributes('data-joystick-id')).toEqual('0')
    expect(controllers[1]!.attributes('data-joystick-id')).toEqual('1')
    wrapper.unmount()
  })

  it('renders JoystickStatusTable with status data', () => {
    const wrapper = mount(JoystickControl, {
      props: {},
      global: {
        stubs: {
          GameBlock: gameBlockStub,
          GameSubBlock: gameSubBlockStub,
          GameButton: gameButtonStub,
          NintendoController: nintendoControllerStub,
          JoystickStatusTable: joystickStatusTableStub,
          JoystickKeybindingPanel: joystickKeybindingPanelStub,
        },
      },
    })

    const table = wrapper.find('.joystick-status-table-stub')
    expect(table.exists()).toBe(true)
    expect(table.attributes('data-count')).toEqual('2')
    wrapper.unmount()
  })

  it('renders keyboard hint text', () => {
    const wrapper = mount(JoystickControl, {
      props: {},
      global: {
        stubs: {
          GameBlock: gameBlockStub,
          GameSubBlock: gameSubBlockStub,
          GameButton: gameButtonStub,
          NintendoController: nintendoControllerStub,
          JoystickStatusTable: joystickStatusTableStub,
          JoystickKeybindingPanel: joystickKeybindingPanelStub,
        },
      },
    })

    const hint = wrapper.find('.keyboard-hint')
    expect(hint.exists()).toBe(true)
    expect(hint.find('.hint-text').exists()).toBe(true)
    expect(hint.find('.key-bindings').exists()).toBe(true)
    wrapper.unmount()
  })

  it('shows keybinding panel as hidden by default', () => {
    const wrapper = mount(JoystickControl, {
      props: {},
      global: {
        stubs: {
          GameBlock: gameBlockStub,
          GameSubBlock: gameSubBlockStub,
          GameButton: gameButtonStub,
          NintendoController: nintendoControllerStub,
          JoystickStatusTable: joystickStatusTableStub,
          JoystickKeybindingPanel: joystickKeybindingPanelStub,
        },
      },
    })

    const panel = wrapper.find('.joystick-keybinding-panel-stub')
    expect(panel.attributes('data-visible')).toEqual('false')
    wrapper.unmount()
  })

  it('shows keybinding panel when configure button is clicked', async () => {
    const wrapper = mount(JoystickControl, {
      props: {},
      global: {
        stubs: {
          GameBlock: gameBlockStub,
          GameSubBlock: gameSubBlockStub,
          GameButton: gameButtonStub,
          NintendoController: nintendoControllerStub,
          JoystickStatusTable: joystickStatusTableStub,
          JoystickKeybindingPanel: joystickKeybindingPanelStub,
        },
      },
    })

    const configureButton = wrapper.findAll('.game-button-stub').find(b => b.text() === 'Configure Keys')!
    await configureButton.trigger('click')

    const panel = wrapper.find('.joystick-keybinding-panel-stub')
    expect(panel.attributes('data-visible')).toEqual('true')
    wrapper.unmount()
  })

  it('renders two GameSubBlock instances for joystick panels', () => {
    const wrapper = mount(JoystickControl, {
      props: {},
      global: {
        stubs: {
          GameBlock: gameBlockStub,
          GameSubBlock: gameSubBlockStub,
          GameButton: gameButtonStub,
          NintendoController: nintendoControllerStub,
          JoystickStatusTable: joystickStatusTableStub,
          JoystickKeybindingPanel: joystickKeybindingPanelStub,
        },
      },
    })

    const subBlocks = wrapper.findAll('.game-sub-block-stub')
    expect(subBlocks.length).toEqual(2)
    wrapper.unmount()
  })

  it('renders control grid layout', () => {
    const wrapper = mount(JoystickControl, {
      props: {},
      global: {
        stubs: {
          GameBlock: gameBlockStub,
          GameSubBlock: gameSubBlockStub,
          GameButton: gameButtonStub,
          NintendoController: nintendoControllerStub,
          JoystickStatusTable: joystickStatusTableStub,
          JoystickKeybindingPanel: joystickKeybindingPanelStub,
        },
      },
    })

    expect(wrapper.find('.control-grid').exists()).toBe(true)
    expect(wrapper.find('.joystick-panels-row').exists()).toBe(true)
    wrapper.unmount()
  })
})
