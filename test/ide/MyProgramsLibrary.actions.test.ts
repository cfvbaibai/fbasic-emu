import { mount } from '@vue/test-utils'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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
const mockDeleteProgram = vi.fn()
const mockRenameProgram = vi.fn()

vi.mock('@/features/ide/composables/useProgramLibrary', () => ({
  useProgramLibrary: () => ({
    programs: { value: mockPrograms.value },
    isLoading: { value: mockIsLoading.value },
    error: { value: mockError.value },
    isInitialized: { value: mockIsInitialized.value },
    listPrograms: mockListPrograms,
    getProgram: vi.fn(),
    saveProgram: vi.fn(),
    deleteProgram: mockDeleteProgram,
    renameProgram: mockRenameProgram,
    $reset: vi.fn(),
  }),
}))

// Stub components (duplicated for test file independence)
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

/** Find an icon button stub by its title prop */
function findIconButtonByTitle(wrapper: ReturnType<typeof createWrapper>, title: string) {
  return wrapper.findAllComponents(gameIconButtonStub).find((btn) => btn.props('title') === title)
}

describe('MyProgramsLibrary - Actions', () => {
  let focusSpy: ReturnType<typeof vi.spyOn>
  let selectSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    // HTMLInputElement.focus/select may not be fully implemented in JSDOM
    focusSpy = vi.spyOn(HTMLElement.prototype, 'focus').mockImplementation(() => {})
    selectSpy = vi.spyOn(HTMLInputElement.prototype, 'select').mockImplementation(() => {})
    if (!HTMLInputElement.prototype.focus) {
      HTMLInputElement.prototype.focus = () => {}
    }
    if (!HTMLInputElement.prototype.select) {
      HTMLInputElement.prototype.select = () => {}
    }
  })

  afterEach(() => {
    focusSpy.mockRestore()
    selectSpy.mockRestore()
  })

  function resetMocks() {
    mockPrograms.value = []
    mockIsLoading.value = false
    mockError.value = null
    mockIsInitialized.value = true
    mockListPrograms.mockClear()
    mockDeleteProgram.mockClear()
    mockRenameProgram.mockClear()
  }

  // --- Delete tests ---

  it('shows confirm dialog when delete button is clicked', async () => {
    resetMocks()
    mockPrograms.value = [makeProgram({ id: '1', name: 'Program A' })]
    const wrapper = createWrapper()

    expect(wrapper.find('.confirm-dialog-overlay').exists()).toBe(false)

    const deleteBtn = findIconButtonByTitle(wrapper, 'ide.myPrograms.deleteAriaLabel')
    expect(deleteBtn).toBeDefined()
    deleteBtn!.vm.$emit('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.confirm-dialog-overlay').exists()).toBe(true)
    wrapper.unmount()
  })

  it('calls deleteProgram when delete is confirmed', async () => {
    resetMocks()
    mockPrograms.value = [makeProgram({ id: '1', name: 'Program A' })]
    const wrapper = createWrapper()

    const deleteBtn = findIconButtonByTitle(wrapper, 'ide.myPrograms.deleteAriaLabel')
    deleteBtn!.vm.$emit('click')
    await wrapper.vm.$nextTick()

    const confirmDialog = wrapper.findComponent(confirmDialogStub)
    confirmDialog.vm.$emit('confirm')
    await wrapper.vm.$nextTick()

    expect(mockDeleteProgram).toHaveBeenCalledTimes(1)
    expect(mockDeleteProgram).toHaveBeenCalledWith('1')
    wrapper.unmount()
  })

  it('does not call deleteProgram when delete is cancelled', async () => {
    resetMocks()
    mockPrograms.value = [makeProgram({ id: '1', name: 'Program A' })]
    const wrapper = createWrapper()

    const deleteBtn = findIconButtonByTitle(wrapper, 'ide.myPrograms.deleteAriaLabel')
    deleteBtn!.vm.$emit('click')
    await wrapper.vm.$nextTick()

    const confirmDialog = wrapper.findComponent(confirmDialogStub)
    confirmDialog.vm.$emit('cancel')
    await wrapper.vm.$nextTick()

    expect(mockDeleteProgram).not.toHaveBeenCalled()
    expect(wrapper.find('.confirm-dialog-overlay').exists()).toBe(false)
    wrapper.unmount()
  })

  // --- Rename tests ---

  it('shows inline rename input when rename button is clicked', async () => {
    resetMocks()
    mockPrograms.value = [makeProgram({ id: '1', name: 'Program A' })]
    const wrapper = createWrapper()

    expect(wrapper.find('.my-programs-item-rename-input').exists()).toBe(false)

    const renameBtn = findIconButtonByTitle(wrapper, 'ide.myPrograms.renameAriaLabel')
    expect(renameBtn).toBeDefined()
    renameBtn!.vm.$emit('click')
    await wrapper.vm.$nextTick()

    const renameInput = wrapper.find('.my-programs-item-rename-input')
    expect(renameInput.exists()).toBe(true)
    expect((renameInput.element as HTMLInputElement).value).toEqual('Program A')
    wrapper.unmount()
  })

  it('calls renameProgram with trimmed name on Enter key', async () => {
    resetMocks()
    mockPrograms.value = [makeProgram({ id: '1', name: 'Program A' })]
    const wrapper = createWrapper()

    const renameBtn = findIconButtonByTitle(wrapper, 'ide.myPrograms.renameAriaLabel')
    renameBtn!.vm.$emit('click')
    await wrapper.vm.$nextTick()

    const renameInput = wrapper.find('.my-programs-item-rename-input')
    await renameInput.setValue('  New Name  ')
    await renameInput.trigger('keydown', { key: 'Enter' })
    await wrapper.vm.$nextTick()

    expect(mockRenameProgram).toHaveBeenCalledTimes(1)
    expect(mockRenameProgram).toHaveBeenCalledWith('1', 'New Name')
    wrapper.unmount()
  })

  it('calls renameProgram on blur', async () => {
    resetMocks()
    mockPrograms.value = [makeProgram({ id: '1', name: 'Program A' })]
    const wrapper = createWrapper()

    const renameBtn = findIconButtonByTitle(wrapper, 'ide.myPrograms.renameAriaLabel')
    renameBtn!.vm.$emit('click')
    await wrapper.vm.$nextTick()

    const renameInput = wrapper.find('.my-programs-item-rename-input')
    await renameInput.setValue('Renamed')
    await renameInput.trigger('blur')
    await wrapper.vm.$nextTick()

    expect(mockRenameProgram).toHaveBeenCalledTimes(1)
    expect(mockRenameProgram).toHaveBeenCalledWith('1', 'Renamed')
    wrapper.unmount()
  })

  it('does not call renameProgram when name is empty on Enter', async () => {
    resetMocks()
    mockPrograms.value = [makeProgram({ id: '1', name: 'Program A' })]
    const wrapper = createWrapper()

    const renameBtn = findIconButtonByTitle(wrapper, 'ide.myPrograms.renameAriaLabel')
    renameBtn!.vm.$emit('click')
    await wrapper.vm.$nextTick()

    const renameInput = wrapper.find('.my-programs-item-rename-input')
    await renameInput.setValue('   ')
    await renameInput.trigger('keydown', { key: 'Enter' })
    await wrapper.vm.$nextTick()

    expect(mockRenameProgram).not.toHaveBeenCalled()
    wrapper.unmount()
  })

  it('cancels rename on Escape key without calling renameProgram', async () => {
    resetMocks()
    mockPrograms.value = [makeProgram({ id: '1', name: 'Program A' })]
    const wrapper = createWrapper()

    const renameBtn = findIconButtonByTitle(wrapper, 'ide.myPrograms.renameAriaLabel')
    renameBtn!.vm.$emit('click')
    await wrapper.vm.$nextTick()

    const renameInput = wrapper.find('.my-programs-item-rename-input')
    await renameInput.setValue('Cancelled Name')
    await renameInput.trigger('keydown', { key: 'Escape' })
    await wrapper.vm.$nextTick()

    expect(mockRenameProgram).not.toHaveBeenCalled()
    expect(wrapper.find('.my-programs-item-rename-input').exists()).toBe(false)
    expect(wrapper.find('.my-programs-item-name').text()).toEqual('Program A')
    wrapper.unmount()
  })

  it('does not emit select when program is in rename mode', async () => {
    resetMocks()
    mockPrograms.value = [makeProgram({ id: '1', name: 'Program A' })]
    const wrapper = createWrapper()

    const renameBtn = findIconButtonByTitle(wrapper, 'ide.myPrograms.renameAriaLabel')
    renameBtn!.vm.$emit('click')
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.my-programs-item-button').exists()).toBe(false)
    expect(wrapper.emitted('select')).toBeUndefined()
    wrapper.unmount()
  })
})
