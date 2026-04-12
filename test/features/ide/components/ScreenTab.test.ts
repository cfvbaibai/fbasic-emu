// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { computed, ref } from 'vue'
import { defineComponent } from 'vue'

import ScreenTab from '@/features/ide/components/ScreenTab.vue'

// Stub vue-i18n
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

// Mock useScreenFilter with controllable state
const mockFilterEnabled = ref(false)
const mockPrefersReducedMotion = ref(false)
const mockToggleFilter = vi.fn(() => {
  mockFilterEnabled.value = !mockFilterEnabled.value
})
const mockSetFilterEnabled = vi.fn()

vi.mock('@/features/ide/composables/useScreenFilter', () => ({
  useScreenFilter: () => ({
    filterEnabled: computed(() => mockFilterEnabled.value),
    prefersReducedMotion: computed(
      () => mockPrefersReducedMotion.value
    ),
    toggleFilter: mockToggleFilter,
    setFilterEnabled: mockSetFilterEnabled,
  }),
}))

// Stub GameButton to capture click events and attributes
const gameButtonStub = defineComponent({
  props: ['variant', 'size', 'selected', 'disabled'],
  template:
    '<button :data-variant="variant" :data-selected="String(selected)" :disabled="disabled" :data-testid="$attrs[\'data-testid\']"><slot /></button>',
})

// Stub GameButtonGroup
const gameButtonGroupStub = defineComponent({
  template: '<div class="game-button-group-stub"><slot /></div>',
})

// Stub GameIcon
const gameIconStub = defineComponent({
  props: ['icon', 'size'],
  template: '<span class="game-icon-stub" :data-icon="icon" />',
})

// Stub GameTabPane
const gameTabPaneStub = defineComponent({
  props: ['name'],
  template:
    '<div class="game-tab-pane-stub" :data-name="name"><slot name="label" /><slot name="tab-content-header" /><slot /></div>',
})

// Stub Screen
const screenStub = defineComponent({
  template: '<div class="screen-stub" data-testid="screen-stub" />',
})

// Stub ErrorPanel
const errorPanelStub = defineComponent({
  props: ['errors'],
  template: '<div class="error-panel-stub" />',
})

describe('ScreenTab', () => {
  beforeEach(() => {
    localStorage.clear()
    mockFilterEnabled.value = false
    mockPrefersReducedMotion.value = false
    vi.clearAllMocks()
  })

  function mountScreenTab() {
    return mount(ScreenTab, {
      props: { errors: [] },
      global: {
        stubs: {
          GameButton: gameButtonStub,
          GameButtonGroup: gameButtonGroupStub,
          GameIcon: gameIconStub,
          GameTabPane: gameTabPaneStub,
          Screen: screenStub,
          ErrorPanel: errorPanelStub,
        },
      },
    })
  }

  it('renders the filter toggle button', () => {
    const wrapper = mountScreenTab()

    const filterButton = wrapper.find('[data-testid="ide-filter-toggle"]')
    expect(filterButton.exists()).toEqual(true)
    wrapper.unmount()
  })

  it('shows filter toggle as not selected by default', () => {
    const wrapper = mountScreenTab()

    const filterButton = wrapper.find('[data-testid="ide-filter-toggle"]')
    expect(filterButton.attributes('data-selected')).toEqual('false')
    wrapper.unmount()
  })

  it('toggles filterEnabled when filter button is clicked', async () => {
    const wrapper = mountScreenTab()

    const filterButton = wrapper.find('[data-testid="ide-filter-toggle"]')
    await filterButton.trigger('click')

    expect(mockToggleFilter).toHaveBeenCalledOnce()

    // After clicking, mock state should be toggled
    expect(filterButton.attributes('data-selected')).toEqual('true')

    // Click again to toggle back
    await filterButton.trigger('click')
    expect(filterButton.attributes('data-selected')).toEqual('false')
    wrapper.unmount()
  })

  it('renders the filter toggle with i18n label', () => {
    const wrapper = mountScreenTab()

    const filterButton = wrapper.find('[data-testid="ide-filter-toggle"]')
    expect(filterButton.text()).toEqual('ide.screenTab.filter')
    wrapper.unmount()
  })

  it('renders the filter toggle icon', () => {
    const wrapper = mountScreenTab()

    const filterIcon = wrapper.find(
      '[data-testid="ide-filter-toggle"] .game-icon-stub'
    )
    expect(filterIcon.exists()).toEqual(true)
    expect(filterIcon.attributes('data-icon')).toEqual(
      'mdi:monitor-shimmer'
    )
    wrapper.unmount()
  })

  it('disables filter toggle when prefers-reduced-motion is active', () => {
    mockPrefersReducedMotion.value = true

    const wrapper = mountScreenTab()

    const filterButton = wrapper.find('[data-testid="ide-filter-toggle"]')
    expect(filterButton.attributes('disabled')).toBeDefined()
    wrapper.unmount()
  })
})
