// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, ref } from 'vue'

import type { CompactBg, ProgramData } from '@/core/types/program-types'
import MyProgramsLibrary from '@/features/ide/components/MyProgramsLibrary.vue'

// Mock vue-i18n
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      if (params) return `${key}:${JSON.stringify(params)}`
      return key
    },
  }),
}))

// Mock useProgramLibrary composable
const mockPrograms = ref<ProgramData[]>([])
const mockIsLoading = ref(false)
const mockError = ref<Error | null>(null)
const mockIsInitialized = ref(false)
const mockListPrograms = vi.fn()

vi.mock('@/features/ide/composables/useProgramLibrary', () => ({
  useProgramLibrary: () => ({
    programs: { value: mockPrograms.value },
    isLoading: { value: mockIsLoading.value },
    error: { value: mockError.value },
    isInitialized: { value: mockIsInitialized.value },
    listPrograms: mockListPrograms,
    getProgram: vi.fn(),
    saveProgram: vi.fn(),
    deleteProgram: vi.fn(),
    renameProgram: vi.fn(),
    importFromFile: vi.fn(),
    exportToFile: vi.fn(),
    $reset: vi.fn(),
  }),
}))

// Stub components
const gameInputStub = defineComponent({
  props: ['modelValue', 'type', 'placeholder', 'clearable', 'size', 'disabled'],
  emits: ['update:modelValue'],
  template: '<input :value="modelValue" :placeholder="placeholder" class="game-input-stub" @input="$emit(\'update:modelValue\', $event.target.value)" />',
})

const gameSelectStub = defineComponent({
  props: ['modelValue', 'options', 'size', 'disabled', 'placeholder', 'width'],
  emits: ['update:modelValue'],
  template: '<select :value="modelValue" class="game-select-stub" @change="$emit(\'update:modelValue\', $event.target.value)"><option v-for="opt in options" :key="opt.value" :value="opt.value">{{ opt.label }}</option></select>',
})

const gameButtonStub = defineComponent({
  props: ['type', 'size', 'disabled', 'icon', 'loading'],
  template: '<button :disabled="disabled" class="game-button-stub"><slot /></button>',
})

const gameIconButtonStub = defineComponent({
  props: ['type', 'icon', 'size', 'title', 'disabled'],
  emits: ['click'],
  template: '<button :disabled="disabled" :title="title" class="game-icon-button-stub" @click="$emit(\'click\')" />',
})

const confirmDialogStub = defineComponent({
  props: ['visible', 'title', 'message', 'confirmLabel', 'cancelLabel'],
  emits: ['confirm', 'cancel'],
  template: '<div v-if="visible" class="confirm-dialog-overlay"><div class="confirm-dialog"><h3 v-if="title">{{ title }}</h3><p v-if="message">{{ message }}</p><button class="confirm-dialog-btn-confirm" @click="$emit(\'confirm\')">Confirm</button><button class="confirm-dialog-btn-cancel" @click="$emit(\'cancel\')">Cancel</button></div></div>',
})

function createWrapper() {
  return mount(MyProgramsLibrary, {
    global: {
      stubs: {
        GameInput: gameInputStub,
        GameSelect: gameSelectStub,
        GameButton: gameButtonStub,
        GameIconButton: gameIconButtonStub,
        ConfirmDialog: confirmDialogStub,
      },
    },
  })
}

function makeProgram(overrides: Partial<ProgramData> = {}): ProgramData {
  const defaultBg: CompactBg = { format: 'sparse1', data: '', width: 28, height: 21 }
  return {
    id: 'test-id-1',
    name: 'Test Program',
    code: 'PRINT "HELLO"',
    bg: defaultBg,
    version: 1,
    createdAt: 1000000,
    updatedAt: 2000000,
    ...overrides,
  }
}

describe('MyProgramsLibrary', () => {
  function resetMocks() {
    mockPrograms.value = []
    mockIsLoading.value = false
    mockError.value = null
    mockIsInitialized.value = true
    mockListPrograms.mockClear()
  }

  it('calls listPrograms on mount', () => {
    resetMocks()
    const wrapper = createWrapper()
    expect(mockListPrograms).toHaveBeenCalledTimes(1)
    wrapper.unmount()
  })

  it('renders the title', () => {
    resetMocks()
    const wrapper = createWrapper()
    expect(wrapper.find('.my-programs-title').text()).toEqual('ide.myPrograms.title')
    wrapper.unmount()
  })

  it('renders close button with aria label', () => {
    resetMocks()
    const wrapper = createWrapper()
    const closeBtn = wrapper.find('.my-programs-close')
    expect(closeBtn.exists()).toBe(true)
    expect(closeBtn.attributes('aria-label')).toEqual('ide.myPrograms.closeAriaLabel')
    wrapper.unmount()
  })

  it('emits close when close button is clicked', async () => {
    resetMocks()
    const wrapper = createWrapper()
    await wrapper.find('.my-programs-close').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
    wrapper.unmount()
  })

  it('emits close when overlay background is clicked', async () => {
    resetMocks()
    const wrapper = createWrapper()
    await wrapper.find('.my-programs-overlay').trigger('click.self')
    expect(wrapper.find('.my-programs-overlay').exists()).toBe(true)
    wrapper.unmount()
  })

  it('shows empty state when no programs exist', () => {
    resetMocks()
    const wrapper = createWrapper()
    expect(wrapper.find('.my-programs-state').exists()).toBe(true)
    expect(wrapper.find('.my-programs-state-text').text()).toEqual('ide.myPrograms.emptyState')
    wrapper.unmount()
  })

  it('shows loading state', () => {
    resetMocks()
    mockIsLoading.value = true
    mockIsInitialized.value = false
    const wrapper = createWrapper()
    expect(wrapper.find('.my-programs-state').exists()).toBe(true)
    expect(wrapper.find('.my-programs-state-text').text()).toEqual('ide.myPrograms.loading')
    wrapper.unmount()
  })

  it('shows error state when error is set', () => {
    resetMocks()
    mockError.value = new Error('DB failed')
    const wrapper = createWrapper()
    expect(wrapper.find('.my-programs-state').exists()).toBe(true)
    expect(wrapper.find('.my-programs-state-text').text()).toEqual('ide.myPrograms.errorState')
    wrapper.unmount()
  })

  it('renders a list of programs', () => {
    resetMocks()
    mockPrograms.value = [
      makeProgram({ id: '1', name: 'Program A', updatedAt: 3000 }),
      makeProgram({ id: '2', name: 'Program B', updatedAt: 2000 }),
    ]
    const wrapper = createWrapper()
    const items = wrapper.findAll('.my-programs-item')
    expect(items.length).toEqual(2)
    expect(items[0]!.find('.my-programs-item-name').text()).toEqual('Program A')
    expect(items[1]!.find('.my-programs-item-name').text()).toEqual('Program B')
    wrapper.unmount()
  })

  it('emits select when a program item is clicked', async () => {
    resetMocks()
    const program = makeProgram({ id: '1', name: 'Program A' })
    mockPrograms.value = [program]
    const wrapper = createWrapper()
    await wrapper.find('.my-programs-item-button').trigger('click')
    expect(wrapper.emitted('select')).toHaveLength(1)
    expect(wrapper.emitted('select')![0]).toEqual([program])
    wrapper.unmount()
  })

  it('renders search input with placeholder', () => {
    resetMocks()
    const wrapper = createWrapper()
    const input = wrapper.find('.game-input-stub')
    expect(input.exists()).toBe(true)
    expect(input.attributes('placeholder')).toEqual('ide.myPrograms.searchPlaceholder')
    wrapper.unmount()
  })

  it('renders sort select with options', () => {
    resetMocks()
    const wrapper = createWrapper()
    const select = wrapper.find('.game-select-stub')
    expect(select.exists()).toBe(true)
    const options = select.findAll('option')
    expect(options.length).toEqual(2)
    expect(options[0]!.attributes('value')).toEqual('updatedAt')
    expect(options[1]!.attributes('value')).toEqual('name')
    wrapper.unmount()
  })

  it('sorts by updatedAt by default (most recent first)', () => {
    resetMocks()
    mockPrograms.value = [
      makeProgram({ id: '1', name: 'Old', updatedAt: 1000 }),
      makeProgram({ id: '2', name: 'New', updatedAt: 3000 }),
    ]
    const wrapper = createWrapper()
    const items = wrapper.findAll('.my-programs-item')
    expect(items[0]!.find('.my-programs-item-name').text()).toEqual('New')
    expect(items[1]!.find('.my-programs-item-name').text()).toEqual('Old')
    wrapper.unmount()
  })

  it('sorts alphabetically when sort is changed to name', async () => {
    resetMocks()
    mockPrograms.value = [
      makeProgram({ id: '1', name: 'Banana', updatedAt: 1000 }),
      makeProgram({ id: '2', name: 'Apple', updatedAt: 3000 }),
    ]
    const wrapper = createWrapper()
    await wrapper.find('.game-select-stub').setValue('name')
    const items = wrapper.findAll('.my-programs-item')
    expect(items[0]!.find('.my-programs-item-name').text()).toEqual('Apple')
    expect(items[1]!.find('.my-programs-item-name').text()).toEqual('Banana')
    wrapper.unmount()
  })

  it('filters programs by search query', async () => {
    resetMocks()
    mockPrograms.value = [
      makeProgram({ id: '1', name: 'Hello World' }),
      makeProgram({ id: '2', name: 'Test Program' }),
      makeProgram({ id: '3', name: 'Hello Game' }),
    ]
    const wrapper = createWrapper()
    await wrapper.find('.game-input-stub').setValue('hello')
    const items = wrapper.findAll('.my-programs-item')
    expect(items.length).toEqual(2)
    expect(items[0]!.find('.my-programs-item-name').text()).toEqual('Hello World')
    expect(items[1]!.find('.my-programs-item-name').text()).toEqual('Hello Game')
    wrapper.unmount()
  })

  it('shows no results state when search matches nothing', async () => {
    resetMocks()
    mockPrograms.value = [makeProgram({ id: '1', name: 'Hello World' })]
    const wrapper = createWrapper()
    await wrapper.find('.game-input-stub').setValue('nonexistent')
    expect(wrapper.findAll('.my-programs-item').length).toEqual(0)
    expect(wrapper.find('.my-programs-state-text').text()).toEqual('ide.myPrograms.noResults')
    wrapper.unmount()
  })

  it('renders program count in footer', () => {
    resetMocks()
    mockPrograms.value = [
      makeProgram({ id: '1', name: 'A' }),
      makeProgram({ id: '2', name: 'B' }),
    ]
    const wrapper = createWrapper()
    expect(wrapper.find('.my-programs-count').text()).toContain('ide.myPrograms.programCount')
    wrapper.unmount()
  })

  it('emits close when cancel button is clicked', async () => {
    resetMocks()
    const wrapper = createWrapper()
    await wrapper.find('.my-programs-footer .game-button-stub').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
    wrapper.unmount()
  })

  it('renders both rename and delete action buttons per program item', () => {
    resetMocks()
    mockPrograms.value = [makeProgram({ id: '1', name: 'Program A' })]
    const wrapper = createWrapper()
    const iconButtons = wrapper.findAllComponents(gameIconButtonStub)
    expect(iconButtons.length).toEqual(2)
    const titles = iconButtons.map((btn) => btn.props('title'))
    expect(titles).toContain('ide.myPrograms.renameAriaLabel')
    expect(titles).toContain('ide.myPrograms.deleteAriaLabel')
    wrapper.unmount()
  })
})
