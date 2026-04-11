// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'

import type { SharedDisplayBufferAccessor } from '@/core/animation/sharedDisplayBufferAccessor'
import StateInspector from '@/features/ide/components/StateInspector.vue'
import enIde from '@/shared/i18n/locales/en/ide.json'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

type InspectorAccessor = Pick<
  SharedDisplayBufferAccessor,
  | 'readSpritePosition'
  | 'readSpriteIsActive'
  | 'readSpriteRemainingDistance'
  | 'readSpriteTotalDistance'
  | 'readSpriteDirection'
  | 'readSpriteSpeed'
  | 'readSpritePriority'
  | 'readSpriteCharacterType'
  | 'readSpriteColorCombination'
>

function createAccessorMock(): SharedDisplayBufferAccessor {
  const accessor: InspectorAccessor = {
    readSpritePosition: (actionNumber: number) =>
      actionNumber === 0 ? { x: 12.4, y: 6.6 } : { x: 0, y: 0 },
    readSpriteIsActive: (actionNumber: number) => actionNumber === 0,
    readSpriteRemainingDistance: (actionNumber: number) => (actionNumber === 0 ? 18 : 0),
    readSpriteTotalDistance: (actionNumber: number) => (actionNumber === 0 ? 24 : 0),
    readSpriteDirection: (actionNumber: number) => (actionNumber === 0 ? 3 : 0),
    readSpriteSpeed: (actionNumber: number) => (actionNumber === 0 ? 4 : 0),
    readSpritePriority: (actionNumber: number) => (actionNumber === 0 ? 1 : 0),
    readSpriteCharacterType: (actionNumber: number) => (actionNumber === 0 ? 2 : 0),
    readSpriteColorCombination: (actionNumber: number) => (actionNumber === 0 ? 1 : 0),
  }
  return accessor as SharedDisplayBufferAccessor
}

describe('StateInspector MOVE tab data', () => {
  it('builds MOVE card slot data from shared display buffer accessor only', async () => {
    const wrapper = mount(StateInspector, {
      props: {
        sharedDisplayBufferAccessor: createAccessorMock(),
      },
      global: {
        stubs: {
          GameBlock: defineComponent({ template: '<div><slot /></div>' }),
          GameTabs: defineComponent({ template: '<div><slot /></div>' }),
          GameTabPane: defineComponent({ template: '<div><slot /></div>' }),
          ActivePaletteDisplay: true,
          MovementCard: defineComponent({
            props: {
              slot: {
                type: Object,
                required: true,
              },
            },
            template:
              '<div class="movement-card-stub" :data-action="slot.actionNumber" :data-has-data="slot.hasData" :data-x="slot.x" :data-y="slot.y" :data-direction="slot.direction" :data-speed="slot.speed" :data-character-type="slot.characterType" />',
          }),
        },
      },
    })

    ;(wrapper.vm as { updateMoveSlotsData: () => void }).updateMoveSlotsData()
    await wrapper.vm.$nextTick()

    const moveCard = wrapper.find('.movement-card-stub[data-action="0"]')
    expect(moveCard.exists()).toBe(true)
    expect(moveCard.attributes('data-has-data')).toBe('true')
    expect(moveCard.attributes('data-x')).toBe('12')
    expect(moveCard.attributes('data-y')).toBe('7')
    expect(moveCard.attributes('data-direction')).toBe('3')
    expect(moveCard.attributes('data-speed')).toBe('4')
    expect(moveCard.attributes('data-character-type')).toBe('2')

    const emptySlot = wrapper.find('.movement-card-stub[data-action="1"]')
    expect(emptySlot.exists()).toBe(true)
    expect(emptySlot.attributes('data-has-data')).toBe('false')

    wrapper.unmount()
  })
})

describe('StateInspector tab header casing consistency', () => {
  it('all inspector tab labels are uppercase in English locale', () => {
    const { tabPalette, tabSprite, tabMove, tabBg } = enIde.stateInspector

    expect(tabPalette).toBe('PALETTE')
    expect(tabSprite).toBe('SPRITE')
    expect(tabMove).toBe('MOVE')
    expect(tabBg).toBe('BG')

    // Regression: all tab labels must be fully uppercase (F-BASIC keyword style)
    for (const label of [tabPalette, tabSprite, tabMove, tabBg]) {
      expect(label).toBe(label.toUpperCase())
    }
  })
})
