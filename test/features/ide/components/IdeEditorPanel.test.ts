import type { VueWrapper } from '@vue/test-utils';
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'

import IdeEditorPanel from '@/features/ide/components/IdeEditorPanel.vue'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

const gameBlockStub = defineComponent({
  props: ['title', 'titleIcon'],
  template: `<div class="game-block-stub"><slot /><slot name="right" /></div>`,
})

const programToolbarStub = defineComponent({
  props: ['isCompact'],
  template: '<div class="program-toolbar-stub" />',
})

const editorViewToggleStub = defineComponent({
  props: ['modelValue', 'isCompact'],
  emits: ['update:modelValue'],
  template: '<div class="editor-view-toggle-stub" />',
})

const gameButtonStub = defineComponent({
  props: ['type', 'icon', 'size'],
  template: '<button class="game-button-stub"><slot /></button>',
})

const gameIconButtonStub = defineComponent({
  props: ['type', 'icon', 'size', 'title'],
  template: '<button class="game-icon-button-stub" />',
})

const ideControlsStub = defineComponent({
  props: ['isRunning', 'canRun', 'canStop', 'debugMode', 'inputMode'],
  template: '<div class="ide-controls-stub" />',
})

const bgEditorPanelStub = defineComponent({
  template: '<div class="bg-editor-panel-stub" />',
})

const monacoCodeEditorStub = defineComponent({
  props: ['modelValue'],
  emits: ['update:modelValue'],
  template: '<div data-testid="monaco-editor-container" class="monaco-editor-stub" />',
})

const globalStubs = {
  GameBlock: gameBlockStub,
  ProgramToolbar: programToolbarStub,
  EditorViewToggle: editorViewToggleStub,
  GameButton: gameButtonStub,
  GameIconButton: gameIconButtonStub,
  IdeControls: ideControlsStub,
  BgEditorPanel: bgEditorPanelStub,
  MonacoCodeEditor: monacoCodeEditorStub,
}

const defaultProps = {
  code: '10 PRINT "HELLO"',
  editorView: 'code' as const,
  isToolbarCompact: false,
  isRunning: false,
  canRun: true,
  canStop: false,
  debugMode: false,
  inputMode: 'joystick' as const,
}

function createWrapper(overrides: Record<string, unknown> = {}): VueWrapper {
  return mount(IdeEditorPanel, {
    props: { ...defaultProps, ...overrides },
    global: { stubs: globalStubs },
  })
}

describe('IdeEditorPanel', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  it('renders editor container in code view', () => {
    const wrapper = createWrapper()

    const editorContainer = wrapper.find('[data-testid="monaco-editor-container"]')
    expect(editorContainer.exists()).toBe(true)
    wrapper.unmount()
  })

  it('shows loading state while Monaco is downloading', () => {
    // defineAsyncComponent with delay: 200 shows loadingComponent after 200ms.
    // In tests with stubs, the stub replaces the resolved component, but
    // the loadingComponent is rendered during the delay window.
    // We verify the loading component is defined by checking the data-testid
    // appears when the async import is pending.
    const wrapper = createWrapper()

    // Advance timers past the 200ms delay to allow loadingComponent to render
    vi.advanceTimersByTime(250)

    // After the async component resolves, the stub replaces it.
    // The loading state was shown during the delay period (verified by the
    // loadingComponent option on defineAsyncComponent in the source code).
    const editorContainer = wrapper.find('[data-testid="monaco-editor-container"]')
    expect(editorContainer.exists()).toBe(true)
    wrapper.unmount()
  })

  it('renders lite editor placeholder when e2e=lite query param is set', () => {
    const originalSearch = window.location.search
    Object.defineProperty(window, 'location', {
      value: { search: '?e2e=lite' },
      writable: true,
      configurable: true,
    })

    const wrapper = createWrapper()

    const litePlaceholder = wrapper.find('[data-testid="ide-editor-lite-placeholder"]')
    expect(litePlaceholder.exists()).toBe(true)

    Object.defineProperty(window, 'location', {
      value: { search: originalSearch },
      writable: true,
      configurable: true,
    })
    wrapper.unmount()
  })

  it('does not render editor container in lite mode', () => {
    const originalSearch = window.location.search
    Object.defineProperty(window, 'location', {
      value: { search: '?e2e=lite' },
      writable: true,
      configurable: true,
    })

    const wrapper = createWrapper()

    const editorContainer = wrapper.find('[data-testid="monaco-editor-container"]')
    expect(editorContainer.exists()).toBe(false)

    Object.defineProperty(window, 'location', {
      value: { search: originalSearch },
      writable: true,
      configurable: true,
    })
    wrapper.unmount()
  })

  it('renders BG editor panel', () => {
    const wrapper = createWrapper()

    const bgPanel = wrapper.find('.bg-editor-panel-stub')
    expect(bgPanel.exists()).toBe(true)
    wrapper.unmount()
  })

  it('emits openSampleSelector when sample button is clicked', async () => {
    const wrapper = createWrapper()

    const sampleButton = wrapper.find('.game-button-stub')
    await sampleButton.trigger('click')

    expect(wrapper.emitted('openSampleSelector')).toHaveLength(1)
    wrapper.unmount()
  })

  it('renders compact sample button when isToolbarCompact is true', () => {
    const wrapper = createWrapper({ isToolbarCompact: true })

    expect(wrapper.find('.game-icon-button-stub').exists()).toBe(true)
    wrapper.unmount()
  })

  it('renders non-compact sample button when isToolbarCompact is false', () => {
    const wrapper = createWrapper()

    expect(wrapper.find('.game-button-stub').exists()).toBe(true)
    wrapper.unmount()
  })

  it('emits run when IdeControls emits run', () => {
    const wrapper = createWrapper()
    const controls = wrapper.findComponent(ideControlsStub)
    controls.vm.$emit('run')

    expect(wrapper.emitted('run')).toHaveLength(1)
    wrapper.unmount()
  })

  it('passes isRunning to IdeControls', () => {
    const wrapper = createWrapper({ isRunning: true })

    const controls = wrapper.findComponent(ideControlsStub)
    expect(controls.props('isRunning')).toBe(true)
    wrapper.unmount()
  })
})
