import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent, nextTick } from 'vue'

import InputModal from '@/features/ide/components/InputModal.vue'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

const gameInputStub = defineComponent({
  props: ['modelValue', 'type', 'placeholder'],
  emits: ['update:modelValue'],
  template: '<input :value="modelValue" :type="type" :placeholder="placeholder" @input="$emit(\'update:modelValue\', $event.target.value)" data-testid="game-input" />',
})

const gameButtonStub = defineComponent({
  props: ['type', 'size'],
  template: '<button :data-type="type" :data-size="size"><slot /></button>',
})

function createPendingRequest(overrides: Partial<{
  requestId: string
  prompt: string
  isLinput: boolean
}> = {}) {
  return {
    requestId: 'req-1',
    executionId: 'exec-1',
    prompt: '? ',
    variableCount: 1,
    isLinput: false,
    ...overrides,
  }
}

describe('InputModal', () => {
  it('renders nothing when pendingRequest is null', () => {
    const wrapper = mount(InputModal, {
      props: { pendingRequest: null },
      global: { stubs: { GameInput: gameInputStub, GameButton: gameButtonStub } },
    })

    expect(wrapper.find('.input-modal-overlay').exists()).toBe(false)
    wrapper.unmount()
  })

  it('renders dialog when pendingRequest is provided', () => {
    const wrapper = mount(InputModal, {
      props: { pendingRequest: createPendingRequest() },
      global: { stubs: { GameInput: gameInputStub, GameButton: gameButtonStub } },
    })

    expect(wrapper.find('.input-modal-overlay').exists()).toBe(true)
    expect(wrapper.find('.input-modal-prompt').text()).toEqual('?')
    expect(wrapper.find('[data-testid="game-input"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('shows INPUT placeholder for non-LINPUT request', () => {
    const wrapper = mount(InputModal, {
      props: { pendingRequest: createPendingRequest({ isLinput: false }) },
      global: { stubs: { GameInput: gameInputStub, GameButton: gameButtonStub } },
    })

    const input = wrapper.find('[data-testid="game-input"]')
    expect(input.attributes('placeholder')).toEqual('ide.inputModal.inputPlaceholder')
    wrapper.unmount()
  })

  it('shows LINPUT placeholder for LINPUT request', () => {
    const wrapper = mount(InputModal, {
      props: { pendingRequest: createPendingRequest({ isLinput: true }) },
      global: { stubs: { GameInput: gameInputStub, GameButton: gameButtonStub } },
    })

    const input = wrapper.find('[data-testid="game-input"]')
    expect(input.attributes('placeholder')).toEqual('ide.inputModal.linputPlaceholder')
    wrapper.unmount()
  })

  it('emits respond with split values on submit for INPUT', async () => {
    const request = createPendingRequest({ isLinput: false })
    const wrapper = mount(InputModal, {
      props: { pendingRequest: request },
      global: { stubs: { GameInput: gameInputStub, GameButton: gameButtonStub } },
    })

    await wrapper.find('[data-testid="game-input"]').setValue('hello, world')
    const buttons = wrapper.findAll('button')
    await buttons[0]!.trigger('click') // Submit button

    expect(wrapper.emitted('respond')).toHaveLength(1)
    expect(wrapper.emitted('respond')![0]).toEqual([
      'req-1',
      ['hello', 'world'],
      false,
    ])
    wrapper.unmount()
  })

  it('emits respond with single raw value on submit for LINPUT', async () => {
    const request = createPendingRequest({ isLinput: true })
    const wrapper = mount(InputModal, {
      props: { pendingRequest: request },
      global: { stubs: { GameInput: gameInputStub, GameButton: gameButtonStub } },
    })

    await wrapper.find('[data-testid="game-input"]').setValue('hello, world')
    const buttons = wrapper.findAll('button')
    await buttons[0]!.trigger('click') // Submit button

    expect(wrapper.emitted('respond')).toHaveLength(1)
    expect(wrapper.emitted('respond')![0]).toEqual([
      'req-1',
      ['hello, world'],
      false,
    ])
    wrapper.unmount()
  })

  it('emits respond with cancelled true on cancel', async () => {
    const request = createPendingRequest()
    const wrapper = mount(InputModal, {
      props: { pendingRequest: request },
      global: { stubs: { GameInput: gameInputStub, GameButton: gameButtonStub } },
    })

    const buttons = wrapper.findAll('button')
    await buttons[1]!.trigger('click') // Cancel button

    expect(wrapper.emitted('respond')).toHaveLength(1)
    expect(wrapper.emitted('respond')![0]).toEqual([
      'req-1',
      [],
      true,
    ])
    wrapper.unmount()
  })

  it('does not emit when submit with no pending request', async () => {
    const wrapper = mount(InputModal, {
      props: { pendingRequest: null },
      global: { stubs: { GameInput: gameInputStub, GameButton: gameButtonStub } },
    })

    // Component is not rendered, so no buttons exist
    expect(wrapper.find('button').exists()).toBe(false)
    wrapper.unmount()
  })

  it('clears input value when pendingRequest changes', async () => {
    const wrapper = mount(InputModal, {
      props: { pendingRequest: createPendingRequest({ requestId: 'req-1' }) },
      global: { stubs: { GameInput: gameInputStub, GameButton: gameButtonStub } },
    })

    await wrapper.find('[data-testid="game-input"]').setValue('typed value')
    expect((wrapper.find('[data-testid="game-input"]').element as HTMLInputElement).value).toEqual('typed value')

    await wrapper.setProps({ pendingRequest: createPendingRequest({ requestId: 'req-2' }) })
    await nextTick()

    expect((wrapper.find('[data-testid="game-input"]').element as HTMLInputElement).value).toEqual('')
    wrapper.unmount()
  })

  it('has proper dialog ARIA attributes', () => {
    const wrapper = mount(InputModal, {
      props: { pendingRequest: createPendingRequest() },
      global: { stubs: { GameInput: gameInputStub, GameButton: gameButtonStub } },
    })

    const overlay = wrapper.find('.input-modal-overlay')
    expect(overlay.attributes('role')).toEqual('dialog')
    expect(overlay.attributes('aria-modal')).toEqual('true')
    expect(overlay.attributes('aria-labelledby')).toEqual('input-modal-prompt')
    wrapper.unmount()
  })

  it('has form with submit.prevent', () => {
    const wrapper = mount(InputModal, {
      props: { pendingRequest: createPendingRequest() },
      global: { stubs: { GameInput: gameInputStub, GameButton: gameButtonStub } },
    })

    const form = wrapper.find('form')
    expect(form.exists()).toBe(true)
    wrapper.unmount()
  })

  it('auto-focuses the input field when modal becomes visible', async () => {
    const focusSpy = vi.spyOn(HTMLElement.prototype, 'focus')

    const wrapper = mount(InputModal, {
      props: { pendingRequest: null },
      global: { stubs: { GameInput: gameInputStub, GameButton: gameButtonStub } },
    })

    expect(wrapper.find('[data-testid="game-input"]').exists()).toBe(false)

    await wrapper.setProps({ pendingRequest: createPendingRequest() })
    await nextTick()
    await nextTick()

    const input = wrapper.find('[data-testid="game-input"]').element as HTMLInputElement
    expect(focusSpy).toHaveBeenCalledWith()
    expect(focusSpy.mock.instances).toContain(input)
    focusSpy.mockRestore()
    wrapper.unmount()
  })

  it('re-focuses the input field when pendingRequest changes', async () => {
    const focusSpy = vi.spyOn(HTMLElement.prototype, 'focus')

    const wrapper = mount(InputModal, {
      props: { pendingRequest: createPendingRequest({ requestId: 'req-1' }) },
      global: { stubs: { GameInput: gameInputStub, GameButton: gameButtonStub } },
    })
    await nextTick()
    await nextTick()
    focusSpy.mockClear()

    // Change the request — input should be re-focused
    await wrapper.setProps({ pendingRequest: createPendingRequest({ requestId: 'req-2' }) })
    await nextTick()
    await nextTick()

    const newInput = wrapper.find('[data-testid="game-input"]').element as HTMLInputElement
    expect(focusSpy).toHaveBeenCalledWith()
    expect(focusSpy.mock.instances).toContain(newInput)
    focusSpy.mockRestore()
    wrapper.unmount()
  })
})
