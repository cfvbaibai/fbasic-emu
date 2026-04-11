// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'

import type { MovementSlotData } from '@/features/ide/components/MovementCard.vue'
import MovementCard from '@/features/ide/components/MovementCard.vue'

const gameIconStub = defineComponent({
  props: ['icon', 'size'],
  template: '<span :data-icon="icon" />',
})

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

function createSlotData(overrides: Partial<MovementSlotData> = {}): MovementSlotData {
  return {
    actionNumber: 0,
    hasData: true,
    x: 10,
    y: 5,
    isActive: true,
    remainingDistance: 20,
    totalDistance: 30,
    direction: 3,
    speed: 4,
    priority: 1,
    characterType: 0,
    colorCombination: 0,
    ...overrides,
  }
}

function mountCard(slotData: MovementSlotData) {
  return mount(MovementCard, {
    props: { slot: slotData },
    global: {
      stubs: { GameIcon: gameIconStub },
    },
  })
}

describe('MovementCard', () => {
  describe('character type i18n', () => {
    it('uses i18n key for MARIO character type (code 0)', () => {
      const wrapper = mountCard(createSlotData({ characterType: 0 }))
      const charSpan = wrapper.find('.move-card-char')
      expect(charSpan.attributes('title')).toEqual('ide.movementCard.characterTypes.MARIO')
      wrapper.unmount()
    })

    it('uses i18n key for PENGUIN character type (code 4)', () => {
      const wrapper = mountCard(createSlotData({ characterType: 4 }))
      const charSpan = wrapper.find('.move-card-char')
      expect(charSpan.attributes('title')).toEqual('ide.movementCard.characterTypes.PENGUIN')
      wrapper.unmount()
    })

    it('uses i18n key for FIREBALL character type (code 5)', () => {
      const wrapper = mountCard(createSlotData({ characterType: 5 }))
      const charSpan = wrapper.find('.move-card-char')
      expect(charSpan.attributes('title')).toEqual('ide.movementCard.characterTypes.FIREBALL')
      wrapper.unmount()
    })

    it('uses i18n key for STAR_KILLER character type (code 8)', () => {
      const wrapper = mountCard(createSlotData({ characterType: 8 }))
      const charSpan = wrapper.find('.move-card-char')
      expect(charSpan.attributes('title')).toEqual('ide.movementCard.characterTypes.STAR_KILLER')
      wrapper.unmount()
    })

    it('uses i18n key for SHELL_CREEPER character type (code 13)', () => {
      const wrapper = mountCard(createSlotData({ characterType: 13 }))
      const charSpan = wrapper.find('.move-card-char')
      expect(charSpan.attributes('title')).toEqual('ide.movementCard.characterTypes.SHELL_CREEPER')
      wrapper.unmount()
    })

    it('shows numeric code for unknown character type', () => {
      const wrapper = mountCard(createSlotData({ characterType: 99 }))
      const charSpan = wrapper.find('.move-card-char')
      expect(charSpan.attributes('title')).toEqual('99')
      wrapper.unmount()
    })
  })

  describe('layout', () => {
    it('renders action number', () => {
      const wrapper = mountCard(createSlotData({ actionNumber: 3 }))
      expect(wrapper.find('.move-card-id').text()).toContain('3')
      wrapper.unmount()
    })

    it('shows active status icon when slot is active', () => {
      const wrapper = mountCard(createSlotData({ isActive: true }))
      const statusSpan = wrapper.find('.move-card-status')
      expect(statusSpan.attributes('title')).toEqual('ide.movementCard.statusActive')
      wrapper.unmount()
    })

    it('shows paused status icon when slot is paused', () => {
      const wrapper = mountCard(createSlotData({ isActive: false }))
      const statusSpan = wrapper.find('.move-card-status')
      expect(statusSpan.attributes('title')).toEqual('ide.movementCard.statusPaused')
      wrapper.unmount()
    })

    it('shows direction icon for known direction', () => {
      const wrapper = mountCard(createSlotData({ direction: 3 }))
      const dirSpan = wrapper.find('.move-card-dir')
      expect(dirSpan.attributes('aria-label')).toEqual(
        'ide.movementCard.directionAria',
      )
      wrapper.unmount()
    })

    it('hides data fields when hasData is false', () => {
      const wrapper = mountCard(createSlotData({ hasData: false }))
      expect(wrapper.find('.move-card-char').exists()).toBe(false)
      expect(wrapper.find('.move-card-status').exists()).toBe(false)
      wrapper.unmount()
    })

    it('displays truncated character type label in card text', () => {
      const wrapper = mountCard(createSlotData({ characterType: 0 }))
      const charSpan = wrapper.find('.move-card-char')
      // With i18n mock returning the key, the key is sliced to 5 chars
      const text = charSpan.text()
      expect(text.length).toBeLessThanOrEqual(5)
      wrapper.unmount()
    })
  })
})
