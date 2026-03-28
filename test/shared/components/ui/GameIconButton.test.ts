import { mount } from '@vue/test-utils'
import { describe, expect, it } from 'vitest'
import { defineComponent } from 'vue'

import GameIconButton from '@/shared/components/ui/GameIconButton.vue'

/**
 * Stub for GameIcon to isolate GameIconButton tests.
 * Renders a span with data-icon attribute so we can verify icon prop passing.
 */
const gameIconStub = defineComponent({
  props: ['icon', 'size', 'rotate', 'class'],
  template:
    '<span class="game-icon-stub" :data-icon="icon" :data-size="size" :data-rotate="rotate" />',
})

function mountButton(props: Record<string, unknown> = {}) {
  return mount(GameIconButton, {
    props,
    global: {
      stubs: {
        GameIcon: gameIconStub,
      },
    },
  })
}

describe('GameIconButton', () => {
  it('renders the icon via GameIcon when icon prop is provided', () => {
    const wrapper = mountButton({ icon: 'mdi:play' })
    const icon = wrapper.find('.game-icon-stub')
    expect(icon.exists()).toBe(true)
    expect(icon.attributes('data-icon')).toEqual('mdi:play')
    wrapper.unmount()
  })

  it('renders slot content when no icon prop is provided', () => {
    const wrapper = mount(GameIconButton, {
      props: {},
      slots: { default: '<span class="slot-content">X</span>' },
      global: { stubs: { GameIcon: gameIconStub } },
    })
    expect(wrapper.find('.slot-content').exists()).toBe(true)
    expect(wrapper.find('.game-icon-stub').exists()).toBe(false)
    wrapper.unmount()
  })

  it('disables the button when disabled prop is true', () => {
    const wrapper = mountButton({ icon: 'mdi:play', disabled: true })
    expect((wrapper.element as HTMLButtonElement).disabled).toBe(true)
    wrapper.unmount()
  })

  it('does not emit click when disabled', async () => {
    const wrapper = mountButton({ icon: 'mdi:play', disabled: true })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
    wrapper.unmount()
  })

  it('emits click when not disabled and not loading', async () => {
    const wrapper = mountButton({ icon: 'mdi:play' })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toHaveLength(1)
    wrapper.unmount()
  })

  it('disables the button when loading prop is true', () => {
    const wrapper = mountButton({ icon: 'mdi:play', loading: true })
    expect((wrapper.element as HTMLButtonElement).disabled).toBe(true)
    wrapper.unmount()
  })

  it('does not emit click when loading', async () => {
    const wrapper = mountButton({ icon: 'mdi:play', loading: true })
    await wrapper.trigger('click')
    expect(wrapper.emitted('click')).toBeUndefined()
    wrapper.unmount()
  })

  it('shows a CSS spinner element instead of the icon when loading', () => {
    const wrapper = mountButton({ icon: 'mdi:play', loading: true })
    // The spinner should be rendered
    const spinner = wrapper.find('.game-icon-button-spinner')
    expect(spinner.exists()).toBe(true)
    // The icon should NOT be rendered (spinner replaces it)
    expect(wrapper.find('.game-icon-stub').exists()).toBe(false)
    // Spinner should have aria-label for accessibility
    expect(spinner.attributes('aria-label')).toEqual('Loading')
    wrapper.unmount()
  })

  it('shows the icon when not loading', () => {
    const wrapper = mountButton({ icon: 'mdi:play', loading: false })
    expect(wrapper.find('.game-icon-button-spinner').exists()).toBe(false)
    expect(wrapper.find('.game-icon-stub').exists()).toBe(true)
    wrapper.unmount()
  })

  it('applies loading CSS class when loading', () => {
    const wrapper = mountButton({ icon: 'mdi:play', loading: true })
    const button = wrapper.element as HTMLButtonElement
    expect(button.classList.contains('game-icon-button-loading')).toBe(true)
    wrapper.unmount()
  })

  it('applies disabled CSS class when loading', () => {
    const wrapper = mountButton({ icon: 'mdi:play', loading: true })
    const button = wrapper.element as HTMLButtonElement
    expect(button.classList.contains('game-icon-button-disabled')).toBe(true)
    wrapper.unmount()
  })

  it('applies size-specific class', () => {
    const wrapper = mountButton({ icon: 'mdi:play', size: 'large' })
    const button = wrapper.element as HTMLButtonElement
    expect(button.classList.contains('game-icon-button-large')).toBe(true)
    wrapper.unmount()
  })

  it('applies type-specific class', () => {
    const wrapper = mountButton({ icon: 'mdi:play', type: 'primary' })
    const button = wrapper.element as HTMLButtonElement
    expect(button.classList.contains('game-icon-button-primary')).toBe(true)
    wrapper.unmount()
  })

  it('applies circular class when circular prop is true', () => {
    const wrapper = mountButton({ icon: 'mdi:play', circular: true })
    const button = wrapper.element as HTMLButtonElement
    expect(button.classList.contains('game-icon-button-circular')).toBe(true)
    wrapper.unmount()
  })

  it('applies selected class when selected prop is true', () => {
    const wrapper = mountButton({ icon: 'mdi:play', selected: true })
    const button = wrapper.element as HTMLButtonElement
    expect(button.classList.contains('game-icon-button-selected')).toBe(true)
    wrapper.unmount()
  })

  it('passes data-testid to the button element', () => {
    const wrapper = mountButton({ icon: 'mdi:play', dataTestid: 'my-button' })
    expect(wrapper.attributes('data-testid')).toEqual('my-button')
    wrapper.unmount()
  })

  it('passes title to the button element', () => {
    const wrapper = mountButton({ icon: 'mdi:play', title: 'Play button' })
    expect(wrapper.attributes('title')).toEqual('Play button')
    wrapper.unmount()
  })

  it('switches from icon to spinner when loading changes to true', async () => {
    const wrapper = mountButton({ icon: 'mdi:play', loading: false })
    expect(wrapper.find('.game-icon-stub').exists()).toBe(true)
    expect(wrapper.find('.game-icon-button-spinner').exists()).toBe(false)

    await wrapper.setProps({ loading: true })
    expect(wrapper.find('.game-icon-stub').exists()).toBe(false)
    expect(wrapper.find('.game-icon-button-spinner').exists()).toBe(true)
    wrapper.unmount()
  })

  it('switches from spinner to icon when loading changes to false', async () => {
    const wrapper = mountButton({ icon: 'mdi:play', loading: true })
    expect(wrapper.find('.game-icon-button-spinner').exists()).toBe(true)
    expect(wrapper.find('.game-icon-stub').exists()).toBe(false)

    await wrapper.setProps({ loading: false })
    expect(wrapper.find('.game-icon-button-spinner').exists()).toBe(false)
    expect(wrapper.find('.game-icon-stub').exists()).toBe(true)
    wrapper.unmount()
  })
})
