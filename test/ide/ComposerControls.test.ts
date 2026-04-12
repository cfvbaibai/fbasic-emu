// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'

import ComposerControls from '@/features/ide/components/ComposerControls.vue'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

// ---------------------------------------------------------------------------
// Stubs for child components
// ---------------------------------------------------------------------------

const gameBlockStub = defineComponent({
  template: '<div class="game-block-stub"><slot /></div>',
})

/**
 * GameSelect stub that renders a real <select> for testability.
 * Expects modelValue, options, and emits update:modelValue.
 */
const gameSelectStub = defineComponent({
  name: 'GameSelect',
  props: {
    modelValue: { type: [String, Number], required: true },
    options: { type: Array, default: () => [] },
    size: { type: String, default: 'small' },
    width: { type: String, default: '' },
  },
  emits: ['update:modelValue'],
  template: `
    <select
      :value="modelValue"
      data-testid="game-select"
      @change="$emit('update:modelValue', $event.target.value)"
    >
      <option
        v-for="opt in options"
        :key="String(opt.value)"
        :value="opt.value"
      >
        {{ opt.label }}
      </option>
    </select>
  `,
})

const GLOBAL_STUBS = {
  GameBlock: gameBlockStub,
  GameSelect: gameSelectStub,
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const CONTAINER_SELECTOR = '.composer-controls'
const TEMPO_SLIDER_SELECTOR = '.composer-controls__tempo-slider'
const TEMPO_VALUE_SELECTOR = '.composer-controls__tempo-value'
const STEPS_SELECT_SELECTOR = '.composer-controls__steps select'
const OCTAVE_SELECT_SELECTOR = '.composer-controls__octave select'
const DURATION_SELECT_SELECTOR = '.composer-controls__duration select'
const ENVELOPE_SELECT_SELECTOR = '.composer-controls__envelope select'

function mountComposerControls(props: {
  tempo?: number
  steps?: 16 | 32
  octave?: number
} = {}) {
  return mount(ComposerControls, {
    props: {
      tempo: props.tempo ?? 120,
      steps: props.steps ?? 16,
      octave: props.octave ?? 4,
    },
    global: { stubs: GLOBAL_STUBS },
    attrs: {
      'data-testid': 'composer-controls',
    },
  })
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ComposerControls', () => {
  describe('rendering', () => {
    it('renders the container element', () => {
      const wrapper = mountComposerControls()

      expect(wrapper.find(CONTAINER_SELECTOR).exists()).toBe(true)
      wrapper.unmount()
    })

    it('renders the tempo slider', () => {
      const wrapper = mountComposerControls()

      const slider = wrapper.find(TEMPO_SLIDER_SELECTOR)
      expect(slider.exists()).toBe(true)
      expect(slider.attributes('type')).toEqual('range')
      expect(slider.attributes('min')).toEqual('40')
      expect(slider.attributes('max')).toEqual('240')
      wrapper.unmount()
    })

    it('renders the tempo value display', () => {
      const wrapper = mountComposerControls()

      const valueDisplay = wrapper.find(TEMPO_VALUE_SELECTOR)
      expect(valueDisplay.exists()).toBe(true)
      wrapper.unmount()
    })

    it('renders the steps dropdown', () => {
      const wrapper = mountComposerControls()

      expect(wrapper.find(STEPS_SELECT_SELECTOR).exists()).toBe(true)
      wrapper.unmount()
    })

    it('renders the octave dropdown', () => {
      const wrapper = mountComposerControls()

      expect(wrapper.find(OCTAVE_SELECT_SELECTOR).exists()).toBe(true)
      wrapper.unmount()
    })

    it('renders the duration dropdown', () => {
      const wrapper = mountComposerControls()

      expect(wrapper.find(DURATION_SELECT_SELECTOR).exists()).toBe(true)
      wrapper.unmount()
    })

    it('renders the envelope dropdown', () => {
      const wrapper = mountComposerControls()

      expect(wrapper.find(ENVELOPE_SELECT_SELECTOR).exists()).toBe(true)
      wrapper.unmount()
    })
  })

  describe('default values', () => {
    it('shows default tempo of 120 on the slider', () => {
      const wrapper = mountComposerControls()

      const slider = wrapper.find<HTMLInputElement>(TEMPO_SLIDER_SELECTOR)
      expect(slider.element.value).toEqual('120')
      wrapper.unmount()
    })

    it('displays default tempo value as "120"', () => {
      const wrapper = mountComposerControls()

      const valueDisplay = wrapper.find(TEMPO_VALUE_SELECTOR)
      expect(valueDisplay.text()).toEqual('120')
      wrapper.unmount()
    })

    it('shows default steps of 16 in the dropdown', () => {
      const wrapper = mountComposerControls()

      const select = wrapper.find<HTMLSelectElement>(STEPS_SELECT_SELECTOR)
      expect(select.element.value).toEqual('16')
      wrapper.unmount()
    })

    it('shows default octave of 4 in the dropdown', () => {
      const wrapper = mountComposerControls()

      const select = wrapper.find<HTMLSelectElement>(OCTAVE_SELECT_SELECTOR)
      expect(select.element.value).toEqual('4')
      wrapper.unmount()
    })
  })

  describe('tempo slider', () => {
    it('reflects a custom tempo prop on the slider', () => {
      const wrapper = mountComposerControls({ tempo: 180 })

      const slider = wrapper.find<HTMLInputElement>(TEMPO_SLIDER_SELECTOR)
      expect(slider.element.value).toEqual('180')
      wrapper.unmount()
    })

    it('displays custom tempo value', () => {
      const wrapper = mountComposerControls({ tempo: 80 })

      const valueDisplay = wrapper.find(TEMPO_VALUE_SELECTOR)
      expect(valueDisplay.text()).toEqual('80')
      wrapper.unmount()
    })

    it('emits update:tempo when slider value changes', async () => {
      const wrapper = mountComposerControls({ tempo: 120 })

      const slider = wrapper.find(TEMPO_SLIDER_SELECTOR)
      await slider.setValue('150')

      expect(wrapper.emitted('update:tempo')).toBeTruthy()
      const emitted = wrapper.emitted<number[]>('update:tempo')!
      expect(emitted[0]![0]).toEqual(150)
      wrapper.unmount()
    })
  })

  describe('steps dropdown', () => {
    it('reflects a custom steps prop', () => {
      const wrapper = mountComposerControls({ steps: 32 })

      const select = wrapper.find<HTMLSelectElement>(STEPS_SELECT_SELECTOR)
      expect(select.element.value).toEqual('32')
      wrapper.unmount()
    })

    it('emits update:steps when selection changes', async () => {
      const wrapper = mountComposerControls({ steps: 16 })

      const select = wrapper.find(STEPS_SELECT_SELECTOR)
      await select.setValue('32')

      expect(wrapper.emitted('update:steps')).toBeTruthy()
      const emitted = wrapper.emitted<number[]>('update:steps')!
      expect(emitted[0]![0]).toEqual(32)
      wrapper.unmount()
    })
  })

  describe('octave dropdown', () => {
    it('reflects a custom octave prop', () => {
      const wrapper = mountComposerControls({ octave: 3 })

      const select = wrapper.find<HTMLSelectElement>(OCTAVE_SELECT_SELECTOR)
      expect(select.element.value).toEqual('3')
      wrapper.unmount()
    })

    it('emits update:octave when selection changes', async () => {
      const wrapper = mountComposerControls({ octave: 4 })

      const select = wrapper.find(OCTAVE_SELECT_SELECTOR)
      await select.setValue('5')

      expect(wrapper.emitted('update:octave')).toBeTruthy()
      const emitted = wrapper.emitted<number[]>('update:octave')!
      expect(emitted[0]![0]).toEqual(5)
      wrapper.unmount()
    })
  })

  describe('duration dropdown', () => {
    it('has correct duration options', () => {
      const wrapper = mountComposerControls()

      const options = wrapper.findAll(`${DURATION_SELECT_SELECTOR} option`)
      const values = options.map((o) => o.attributes('value'))
      expect(values).toEqual(['1/16', '1/8', '1/4', '1/2', '1'])
      wrapper.unmount()
    })

    it('defaults to quarter note (1/4)', () => {
      const wrapper = mountComposerControls()

      const select = wrapper.find<HTMLSelectElement>(DURATION_SELECT_SELECTOR)
      expect(select.element.value).toEqual('1/4')
      wrapper.unmount()
    })

    it('emits update:duration when selection changes', async () => {
      const wrapper = mountComposerControls()

      const select = wrapper.find(DURATION_SELECT_SELECTOR)
      await select.setValue('1/8')

      expect(wrapper.emitted('update:duration')).toBeTruthy()
      const emitted = wrapper.emitted<string[]>('update:duration')!
      expect(emitted[0]![0]).toEqual('1/8')
      wrapper.unmount()
    })
  })

  describe('envelope dropdown', () => {
    it('has correct envelope options', () => {
      const wrapper = mountComposerControls()

      const options = wrapper.findAll(`${ENVELOPE_SELECT_SELECTOR} option`)
      const values = options.map((o) => o.attributes('value'))
      expect(values).toEqual(['none', 'short', 'medium', 'long'])
      wrapper.unmount()
    })

    it('defaults to none envelope', () => {
      const wrapper = mountComposerControls()

      const select = wrapper.find<HTMLSelectElement>(ENVELOPE_SELECT_SELECTOR)
      expect(select.element.value).toEqual('none')
      wrapper.unmount()
    })

    it('emits update:envelope when selection changes', async () => {
      const wrapper = mountComposerControls()

      const select = wrapper.find(ENVELOPE_SELECT_SELECTOR)
      await select.setValue('short')

      expect(wrapper.emitted('update:envelope')).toBeTruthy()
      const emitted = wrapper.emitted<string[]>('update:envelope')!
      expect(emitted[0]![0]).toEqual('short')
      wrapper.unmount()
    })
  })
})
