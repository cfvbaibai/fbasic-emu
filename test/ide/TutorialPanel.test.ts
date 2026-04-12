// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'

import TutorialPanel from '@/features/ide/components/TutorialPanel.vue'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

const gameIconButtonStub = defineComponent({
  props: ['variant', 'type', 'icon', 'size', 'title', 'disabled'],
  emits: ['click'],
  inheritAttrs: false,
  template: '<button v-bind="$attrs" :title="title" :disabled="disabled" @click="$emit(\'click\')" />',
})

describe('TutorialPanel', () => {
  it('renders with correct ARIA role as a complementary region', () => {
    const wrapper = mount(TutorialPanel, {
      props: { visible: true },
      global: {
        stubs: { GameIconButton: gameIconButtonStub },
      },
    })

    expect(wrapper.find('[role="complementary"]').exists()).toBe(true)
    wrapper.unmount()
  })

  it('renders with aria-label for accessibility', () => {
    const wrapper = mount(TutorialPanel, {
      props: { visible: true },
      global: {
        stubs: { GameIconButton: gameIconButtonStub },
      },
    })

    const panel = wrapper.find('[role="complementary"]')
    expect(panel.attributes('aria-label')).toEqual('ide.tutorial.title')
    wrapper.unmount()
  })

  it('renders header with lesson title', () => {
    const wrapper = mount(TutorialPanel, {
      props: { visible: true, lessonTitle: 'Lesson 1: Hello World' },
      global: {
        stubs: { GameIconButton: gameIconButtonStub },
      },
    })

    expect(wrapper.text()).toContain('Lesson 1: Hello World')
    wrapper.unmount()
  })

  it('renders default lesson title when none provided', () => {
    const wrapper = mount(TutorialPanel, {
      props: { visible: true },
      global: {
        stubs: { GameIconButton: gameIconButtonStub },
      },
    })

    expect(wrapper.text()).toContain('ide.tutorial.defaultTitle')
    wrapper.unmount()
  })

  it('renders prev and next navigation buttons', () => {
    const wrapper = mount(TutorialPanel, {
      props: { visible: true },
      global: {
        stubs: { GameIconButton: gameIconButtonStub },
      },
    })

    const prevButton = wrapper.find('[data-testid="tutorial-prev-button"]')
    const nextButton = wrapper.find('[data-testid="tutorial-next-button"]')
    expect(prevButton.exists()).toBe(true)
    expect(nextButton.exists()).toBe(true)
    wrapper.unmount()
  })

  it('renders close button with correct title', () => {
    const wrapper = mount(TutorialPanel, {
      props: { visible: true },
      global: {
        stubs: { GameIconButton: gameIconButtonStub },
      },
    })

    const closeButton = wrapper.find('[data-testid="tutorial-close-button"]')
    expect(closeButton.exists()).toBe(true)
    expect(closeButton.attributes('title')).toEqual('ide.tutorial.closeAriaLabel')
    wrapper.unmount()
  })

  it('emits close event when close button is clicked', async () => {
    const wrapper = mount(TutorialPanel, {
      props: { visible: true },
      global: {
        stubs: { GameIconButton: gameIconButtonStub },
      },
    })

    const closeButton = wrapper.find('[data-testid="tutorial-close-button"]')
    await closeButton.trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)
    wrapper.unmount()
  })

  it('emits prev event when prev button is clicked', async () => {
    const wrapper = mount(TutorialPanel, {
      props: { visible: true, hasPrev: true },
      global: {
        stubs: { GameIconButton: gameIconButtonStub },
      },
    })

    const prevButton = wrapper.find('[data-testid="tutorial-prev-button"]')
    await prevButton.trigger('click')
    expect(wrapper.emitted('prev')).toHaveLength(1)
    wrapper.unmount()
  })

  it('emits next event when next button is clicked', async () => {
    const wrapper = mount(TutorialPanel, {
      props: { visible: true, hasNext: true },
      global: {
        stubs: { GameIconButton: gameIconButtonStub },
      },
    })

    const nextButton = wrapper.find('[data-testid="tutorial-next-button"]')
    await nextButton.trigger('click')
    expect(wrapper.emitted('next')).toHaveLength(1)
    wrapper.unmount()
  })

  it('renders content area for lesson rendering', () => {
    const wrapper = mount(TutorialPanel, {
      props: { visible: true },
      global: {
        stubs: { GameIconButton: gameIconButtonStub },
      },
    })

    const contentArea = wrapper.find('[data-testid="tutorial-content-area"]')
    expect(contentArea.exists()).toBe(true)
    wrapper.unmount()
  })

  it('renders slot content in the content area', () => {
    const wrapper = mount(TutorialPanel, {
      props: { visible: true },
      global: {
        stubs: { GameIconButton: gameIconButtonStub },
      },
      slots: {
        default: '<p class="custom-lesson">Custom lesson content</p>',
      },
    })

    const contentArea = wrapper.find('[data-testid="tutorial-content-area"]')
    expect(contentArea.find('.custom-lesson').exists()).toBe(true)
    expect(contentArea.text()).toContain('Custom lesson content')
    wrapper.unmount()
  })

  it('disables prev button when hasPrev is false', () => {
    const wrapper = mount(TutorialPanel, {
      props: { visible: true, hasPrev: false },
      global: {
        stubs: { GameIconButton: gameIconButtonStub },
      },
    })

    const prevButton = wrapper.find('[data-testid="tutorial-prev-button"]')
    expect(prevButton.attributes('disabled')).toBeDefined()
    wrapper.unmount()
  })

  it('enables prev button when hasPrev is true', () => {
    const wrapper = mount(TutorialPanel, {
      props: { visible: true, hasPrev: true },
      global: {
        stubs: { GameIconButton: gameIconButtonStub },
      },
    })

    const prevButton = wrapper.find('[data-testid="tutorial-prev-button"]')
    expect(prevButton.attributes('disabled')).toBeUndefined()
    wrapper.unmount()
  })

  it('disables next button when hasNext is false', () => {
    const wrapper = mount(TutorialPanel, {
      props: { visible: true, hasNext: false },
      global: {
        stubs: { GameIconButton: gameIconButtonStub },
      },
    })

    const nextButton = wrapper.find('[data-testid="tutorial-next-button"]')
    expect(nextButton.attributes('disabled')).toBeDefined()
    wrapper.unmount()
  })

  it('enables next button when hasNext is true', () => {
    const wrapper = mount(TutorialPanel, {
      props: { visible: true, hasNext: true },
      global: {
        stubs: { GameIconButton: gameIconButtonStub },
      },
    })

    const nextButton = wrapper.find('[data-testid="tutorial-next-button"]')
    expect(nextButton.attributes('disabled')).toBeUndefined()
    wrapper.unmount()
  })
})
