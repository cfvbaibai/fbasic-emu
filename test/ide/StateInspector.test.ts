// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'

import type { SharedDisplayBufferAccessor } from '@/core/animation/sharedDisplayBufferAccessor'
import IdeBottomArea from '@/features/ide/components/IdeBottomArea.vue'
import enIde from '@/shared/i18n/locales/en/ide.json'

import { createTestKeyboardBuffer } from './helpers/createTestKeyboardBuffer'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => {
      const messages: Record<string, string> = {
        'ide.stateInspector.tabPalette': 'PALETTE',
        'ide.stateInspector.tabSprite': 'SPRITE',
        'ide.stateInspector.tabMove': 'MOVE',
        'ide.stateInspector.tabBg': 'BG',
        'ide.stateInspector.backdrop': 'Backdrop',
        'ide.stateInspector.cgen': 'CGEN',
        'ide.stateInspector.spriteEnabled': 'SPRITE ON',
        'ide.stateInspector.on': 'ON',
        'ide.stateInspector.off': 'OFF',
        'ide.stateInspector.empty': '(none)',
      }
      return messages[key] ?? key
    },
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
  | 'readScreenChar'
  | 'readScreenPattern'
  | 'readSyncCommand'
  | 'readAck'
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
    readScreenChar: () => 0x20,
    readScreenPattern: () => 0,
    readSyncCommand: () => null,
    readAck: () => 0,
  }
  return accessor as SharedDisplayBufferAccessor
}

describe('IdeBottomArea MOVE tab data', () => {
  it('builds MOVE card slot data from shared display buffer accessor only', async () => {
    const keyboardView = createTestKeyboardBuffer()
    const wrapper = mount(IdeBottomArea, {
      props: {
        screenBuffer: [],
        cursorX: 0,
        cursorY: 0,
        bgPalette: 1,
        spritePalette: 1,
        backdropColor: 0,
        cgenMode: 2,
        spriteStates: [],
        spriteEnabled: false,
        sharedDisplayBufferAccessor: createAccessorMock(),
        keyboardView,
      },
      global: {
        stubs: {
          JoystickControl: true,
          GameTabs: defineComponent({
            props: ['modelValue', 'type'],
            template: '<div><slot /></div>',
          }),
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
          DisplayBufferSection: true,
          JoystickBufferSection: true,
          KeyboardBufferSection: true,
          SpriteSlotsSection: true,
          AnimationSyncSection: true,
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

describe('Inspector tab header casing consistency', () => {
  it('all inspector tab labels are uppercase in English locale', () => {
    const { tabPalette, tabSprite, tabMove, tabBuffer, tabBg } = enIde.stateInspector

    expect(tabPalette).toBe('PALETTE')
    expect(tabSprite).toBe('SPRITE')
    expect(tabMove).toBe('MOVE')
    expect(tabBuffer).toBe('BUFFER')
    expect(tabBg).toBe('BG')

    // Regression: all tab labels must be fully uppercase (F-BASIC keyword style)
    for (const label of [tabPalette, tabSprite, tabMove, tabBuffer, tabBg]) {
      expect(label).toBe(label.toUpperCase())
    }
  })
})
