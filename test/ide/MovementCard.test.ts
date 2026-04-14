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
    t: (key: string, params?: Record<string, string | number>) => {
      const messages: Record<string, string> = {
        'ide.movementCard.actionNumber': 'Action number',
        'ide.movementCard.statusActive': 'Active',
        'ide.movementCard.statusPaused': 'Paused',
        'ide.movementCard.directionAria': 'direction {direction}',
        'ide.movementCard.characterTypes.MARIO': 'Mario',
        'ide.movementCard.characterTypes.LADY': 'Lady',
        'ide.movementCard.characterTypes.FIGHTER_FLY': 'Fighter Fly',
        'ide.movementCard.characterTypes.ACHILLES': 'Achilles',
        'ide.movementCard.characterTypes.PENGUIN': 'Penguin',
        'ide.movementCard.characterTypes.FIREBALL': 'Fireball',
        'ide.movementCard.characterTypes.CAR': 'Car',
        'ide.movementCard.characterTypes.SPINNER': 'Spinner',
        'ide.movementCard.characterTypes.STAR_KILLER': 'Star Killer',
        'ide.movementCard.characterTypes.STARSHIP': 'Starship',
        'ide.movementCard.characterTypes.EXPLOSION': 'Explosion',
        'ide.movementCard.characterTypes.SMILEY': 'Smiley',
        'ide.movementCard.characterTypes.LASER': 'Laser',
        'ide.movementCard.characterTypes.SHELL_CREEPER': 'Shellcreeper',
        'ide.movementCard.characterTypes.SIDE_STEPPER': 'Sidestepper',
        'ide.movementCard.characterTypes.NITPICKER': 'Nitpicker',
        'ide.movementCard.directions.0': 'none',
        'ide.movementCard.directions.1': 'up',
        'ide.movementCard.directions.2': 'up-right',
        'ide.movementCard.directions.3': 'right',
        'ide.movementCard.directions.4': 'down-right',
        'ide.movementCard.directions.5': 'down',
        'ide.movementCard.directions.6': 'down-left',
        'ide.movementCard.directions.7': 'left',
        'ide.movementCard.directions.8': 'up-left',
      }
      let text = messages[key] ?? key
      if (params) {
        for (const [k, v] of Object.entries(params)) {
          text = text.replace(`{${k}}`, String(v))
        }
      }
      return text
    },
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
      expect(charSpan.attributes('title')).toEqual('Mario')
      wrapper.unmount()
    })

    it('uses i18n key for PENGUIN character type (code 4)', () => {
      const wrapper = mountCard(createSlotData({ characterType: 4 }))
      const charSpan = wrapper.find('.move-card-char')
      expect(charSpan.attributes('title')).toEqual('Penguin')
      wrapper.unmount()
    })

    it('uses i18n key for FIREBALL character type (code 5)', () => {
      const wrapper = mountCard(createSlotData({ characterType: 5 }))
      const charSpan = wrapper.find('.move-card-char')
      expect(charSpan.attributes('title')).toEqual('Fireball')
      wrapper.unmount()
    })

    it('uses i18n key for STAR_KILLER character type (code 8)', () => {
      const wrapper = mountCard(createSlotData({ characterType: 8 }))
      const charSpan = wrapper.find('.move-card-char')
      expect(charSpan.attributes('title')).toEqual('Star Killer')
      wrapper.unmount()
    })

    it('uses i18n key for SHELL_CREEPER character type (code 13)', () => {
      const wrapper = mountCard(createSlotData({ characterType: 13 }))
      const charSpan = wrapper.find('.move-card-char')
      expect(charSpan.attributes('title')).toEqual('Shellcreeper')
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
      expect(statusSpan.attributes('title')).toEqual('Active')
      wrapper.unmount()
    })

    it('shows paused status icon when slot is paused', () => {
      const wrapper = mountCard(createSlotData({ isActive: false }))
      const statusSpan = wrapper.find('.move-card-status')
      expect(statusSpan.attributes('title')).toEqual('Paused')
      wrapper.unmount()
    })

    it('shows direction icon for known direction', () => {
      const wrapper = mountCard(createSlotData({ direction: 3 }))
      const dirSpan = wrapper.find('.move-card-dir')
      expect(dirSpan.attributes('aria-label')).toEqual(
        'direction right',
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
      // With i18n mock returning translated text, 'Mario' is sliced to 5 chars
      const text = charSpan.text()
      expect(text.length).toBeLessThanOrEqual(5)
      wrapper.unmount()
    })
  })
})
