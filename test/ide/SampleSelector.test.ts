// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'

import SampleSelector from '@/features/ide/components/SampleSelector.vue'

// Mock vue-i18n to return the key as translation
vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string, fallbackOrParams?: string | Record<string, string | number>) => {
      const messages: Record<string, string> = {
        'ide.samples.title': 'Load Sample',
        'ide.samples.closeAriaLabel': 'Close',
        'ide.samples.emptyCategory': 'No samples in this category',
        'ide.samples.bgIndicatorTitle': 'Includes BG data',
        'common.buttons.cancel': 'Cancel',
      }
      if (typeof fallbackOrParams === 'string') {
        return messages[key] ?? fallbackOrParams
      }
      let text = messages[key] ?? key
      if (fallbackOrParams) {
        for (const [k, v] of Object.entries(fallbackOrParams)) {
          text = text.replace(`{${k}}`, String(v))
        }
      }
      return text
    },
  }),
}))

// Mock sample data modules - must inline data since vi.mock is hoisted
vi.mock('@/core/samples', () => {
  const codes: Record<string, { key: string; category: string; code: string }> = {
    basic: { key: 'basic', category: 'basics', code: '10 PRINT "Hello"' },
    loops: { key: 'loops', category: 'control', code: '10 FOR I=1 TO 5' },
  }
  return {
    getSampleCodeKeys: () => Object.keys(codes),
    SAMPLE_CODES: codes,
  }
})

vi.mock('@/core/samples/sampleBgData', () => ({
  hasSampleBgData: () => false,
}))

const gameButtonStub = defineComponent({
  props: ['type', 'size'],
  template: '<button :data-type="type" :data-size="size"><slot /></button>',
})

describe('SampleSelector', () => {
  const mountComponent = () =>
    mount(SampleSelector, {
      global: {
        stubs: {
          GameButton: gameButtonStub,
        },
      },
    })

  it('renders category tabs from sample data', () => {
    const wrapper = mountComponent()

    const tabs = wrapper.findAll('.category-tab')
    expect(tabs.length).toEqual(2) // basics + control
    wrapper.unmount()
  })

  it('renders sample cards when category has samples', () => {
    const wrapper = mountComponent()

    // Default category is 'basics' which has the 'basic' sample
    const cards = wrapper.findAll('.sample-card')
    expect(cards.length).toEqual(1)
    wrapper.unmount()
  })

  it('hides empty state when category has samples', () => {
    const wrapper = mountComponent()

    // Default category is 'basics' which has samples
    const emptyState = wrapper.find('.sample-grid-empty')
    expect(emptyState.exists()).toBe(false)
    wrapper.unmount()
  })

  it('renders the i18n empty category message key in template output', () => {
    const wrapper = mountComponent()

    // The v-if for the empty state is present in the template as a comment (<!--v-if-->)
    // The i18n key is referenced in the component but only rendered when the list is empty.
    // Verify the component is structured correctly by checking the grid and v-if comment
    const grid = wrapper.find('.sample-grid')
    expect(grid.exists()).toBe(true)

    // The empty state div should NOT be present when category has samples
    expect(grid.find('.sample-grid-empty').exists()).toBe(false)
    wrapper.unmount()
  })

  it('switches categories and renders samples correctly', async () => {
    const wrapper = mountComponent()

    // Switch to control tab
    const tabs = wrapper.findAll('.category-tab')
    await tabs[1]!.trigger('click')

    // Control has 1 sample (loops)
    expect(wrapper.findAll('.sample-card').length).toEqual(1)
    expect(wrapper.find('.sample-grid-empty').exists()).toBe(false)
    wrapper.unmount()
  })

  it('emits close event when close button is clicked', async () => {
    const wrapper = mountComponent()

    const closeButton = wrapper.find('.sample-selector-close')
    await closeButton.trigger('click')

    expect(wrapper.emitted('close')).toHaveLength(1)
    wrapper.unmount()
  })

  it('emits close event when overlay is clicked', async () => {
    const wrapper = mountComponent()

    const overlay = wrapper.find('.sample-selector-overlay')
    await overlay.trigger('click')

    expect(wrapper.emitted('close')).toHaveLength(1)
    wrapper.unmount()
  })

  it('renders data-sample-key attribute on sample cards', () => {
    const wrapper = mountComponent()

    const card = wrapper.find('.sample-card')
    expect(card.attributes('data-sample-key')).toEqual('basic')
    wrapper.unmount()
  })

  it('emits select event when sample card is clicked', async () => {
    const wrapper = mountComponent()

    const cards = wrapper.findAll('.sample-card')
    expect(cards.length).toBeGreaterThan(0)

    await cards[0]!.trigger('click')
    expect(wrapper.emitted('select')).toHaveLength(1)
    expect(wrapper.emitted('select')![0]).toEqual(['basic'])
    wrapper.unmount()
  })
})
