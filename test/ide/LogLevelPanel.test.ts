// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick } from 'vue'

import LogLevelPanel from '@/features/ide/components/LogLevelPanel.vue'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

const { mockSetLogLevelByName, mockGetLogLevelName, mockLoggerRegistry } = vi.hoisted(() => ({
  mockSetLogLevelByName: vi.fn(),
  mockGetLogLevelName: vi.fn((_key: string) => 'warn'),
  mockLoggerRegistry: [
    { key: 'screen', name: 'Screen', description: 'Screen rendering', getLevel: () => 3, setLevel: vi.fn() },
    { key: 'worker', name: 'Worker', description: 'Web worker', getLevel: () => 2, setLevel: vi.fn() },
  ],
}))

vi.mock('@/shared/logger', () => ({
  LOGGER_REGISTRY: mockLoggerRegistry,
  LOG_LEVEL_NAMES: ['trace', 'debug', 'info', 'warn', 'error', 'silent'] as const,
  getLogLevelName: (...args: unknown[]) => mockGetLogLevelName(...args as [string]),
  setLogLevelByName: (...args: unknown[]) => mockSetLogLevelByName(...args as [string, string]),
}))

const gameBlockStub = defineComponent({
  props: ['title', 'titleIcon'],
  template: '<div class="game-block-stub" :data-title="title"><slot /><slot name="right" /></div>',
})

const gameIconStub = defineComponent({
  props: ['icon', 'size'],
  template: '<span class="game-icon-stub" />',
})

describe('LogLevelPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetLogLevelName.mockReturnValue('warn')
  })

  it('renders panel container', () => {
    const wrapper = mount(LogLevelPanel, {
      props: { open: false },
      global: {
        stubs: { GameBlock: gameBlockStub, GameIcon: gameIconStub },
      },
    })

    expect(wrapper.find('.log-level-panel').exists()).toBe(true)
    wrapper.unmount()
  })

  it('renders a logger row for each entry in LOGGER_REGISTRY', () => {
    const wrapper = mount(LogLevelPanel, {
      props: { open: false },
      global: {
        stubs: { GameBlock: gameBlockStub, GameIcon: gameIconStub },
      },
    })

    const rows = wrapper.findAll('.logger-row')
    expect(rows.length).toEqual(mockLoggerRegistry.length)
    wrapper.unmount()
  })

  it('displays logger name and description', () => {
    const wrapper = mount(LogLevelPanel, {
      props: { open: false },
      global: {
        stubs: { GameBlock: gameBlockStub, GameIcon: gameIconStub },
      },
    })

    expect(wrapper.find('.logger-name').text()).toEqual('Screen')
    expect(wrapper.find('.logger-desc').text()).toEqual('Screen rendering')
    wrapper.unmount()
  })

  it('renders select element for each logger', () => {
    const wrapper = mount(LogLevelPanel, {
      props: { open: false },
      global: {
        stubs: { GameBlock: gameBlockStub, GameIcon: gameIconStub },
      },
    })

    const selects = wrapper.findAll('select')
    expect(selects.length).toEqual(mockLoggerRegistry.length)
    wrapper.unmount()
  })

  it('renders all log level options in each select', () => {
    const wrapper = mount(LogLevelPanel, {
      props: { open: false },
      global: {
        stubs: { GameBlock: gameBlockStub, GameIcon: gameIconStub },
      },
    })

    const firstSelect = wrapper.find('select')
    const options = firstSelect.findAll('option')
    expect(options.length).toEqual(6) // trace, debug, info, warn, error, silent
    expect(options[0]!.text()).toEqual('trace')
    expect(options[5]!.text()).toEqual('silent')
    wrapper.unmount()
  })

  it('initializes levels from getLogLevelName on mount', () => {
    mockGetLogLevelName.mockReturnValue('info')

    mount(LogLevelPanel, {
      props: { open: false },
      global: {
        stubs: { GameBlock: gameBlockStub, GameIcon: gameIconStub },
      },
    })

    expect(mockGetLogLevelName).toHaveBeenCalledWith('screen')
    expect(mockGetLogLevelName).toHaveBeenCalledWith('worker')
  })

  it('calls setLogLevelByName when select changes', async () => {
    const wrapper = mount(LogLevelPanel, {
      props: { open: false },
      global: {
        stubs: { GameBlock: gameBlockStub, GameIcon: gameIconStub },
      },
    })

    const firstSelect = wrapper.find('select')
    const selectElement = firstSelect.element as HTMLSelectElement
    selectElement.value = 'error'
    await firstSelect.trigger('change')

    expect(mockSetLogLevelByName).toHaveBeenCalledWith('screen', 'error')
    wrapper.unmount()
  })

  it('refreshes levels when open prop changes to true', async () => {
    mockGetLogLevelName
      .mockReturnValueOnce('warn')
      .mockReturnValueOnce('warn')

    const wrapper = mount(LogLevelPanel, {
      props: { open: false },
      global: {
        stubs: { GameBlock: gameBlockStub, GameIcon: gameIconStub },
      },
    })

    vi.clearAllMocks()

    await wrapper.setProps({ open: true })
    await nextTick()

    expect(mockGetLogLevelName).toHaveBeenCalledWith('screen')
    expect(mockGetLogLevelName).toHaveBeenCalledWith('worker')
    wrapper.unmount()
  })

  it('does not refresh levels when open prop changes to false', async () => {
    mockGetLogLevelName.mockReturnValue('warn')

    const wrapper = mount(LogLevelPanel, {
      props: { open: true },
      global: {
        stubs: { GameBlock: gameBlockStub, GameIcon: gameIconStub },
      },
    })

    vi.clearAllMocks()

    await wrapper.setProps({ open: false })
    await nextTick()

    expect(mockGetLogLevelName).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('has correct aria-label on select elements', () => {
    const wrapper = mount(LogLevelPanel, {
      props: { open: false },
      global: {
        stubs: { GameBlock: gameBlockStub, GameIcon: gameIconStub },
      },
    })

    const firstSelect = wrapper.find('select')
    expect(firstSelect.attributes('aria-label')).toEqual('ide.logLevels.ariaLabelFor')
    wrapper.unmount()
  })
})
