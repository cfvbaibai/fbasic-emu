// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import type { SpriteState } from '@/core/sprite/types'
import SpriteSlotsSection from '@/features/ide/components/SpriteSlotsSection.vue'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => {
      const messages: Record<string, string> = {
        'ide.bufferInspector.spriteSlotsTitle': 'Sprite Slots',
        'ide.bufferInspector.spriteSlotsDisabled': 'SPRITE OFF',
        'ide.bufferInspector.spriteSlotsOn': 'ON',
        'ide.bufferInspector.spriteSlotsOff': 'OFF',
        'ide.bufferInspector.spriteSlotsDefined': 'Yes',
        'ide.bufferInspector.spriteSlotsNone': '-',
        'ide.bufferInspector.spriteSlotsColNumber': '#',
        'ide.bufferInspector.spriteSlotsColX': 'X',
        'ide.bufferInspector.spriteSlotsColY': 'Y',
        'ide.bufferInspector.spriteSlotsColVisible': 'Visible',
        'ide.bufferInspector.spriteSlotsColPriority': 'Priority',
        'ide.bufferInspector.spriteSlotsColDefinition': 'Definition',
      }
      return messages[key] ?? key
    },
  }),
}))

/** Factory for a single SpriteState */
function makeSprite(overrides: Partial<SpriteState> = {}): SpriteState {
  return {
    spriteNumber: 0,
    x: 0,
    y: 0,
    visible: false,
    priority: 0,
    definition: null,
    ...overrides,
  }
}

/** Factory for all 8 sprite slots with defaults */
function makeAllSprites(): SpriteState[] {
  return Array.from({ length: 8 }, (_, i) =>
    makeSprite({
      spriteNumber: i,
      x: i * 32,
      y: i * 24,
      visible: i % 2 === 0,
      priority: i % 3,
    }),
  )
}

describe('SpriteSlotsSection', () => {
  it('has the correct component name', () => {
    const wrapper = mount(SpriteSlotsSection, {
      props: {
        spriteStates: [],
        spriteEnabled: true,
      },
    })

    expect(wrapper.vm.$options.name).toBe('SpriteSlotsSection')
    wrapper.unmount()
  })

  it('shows disabled message when spriteEnabled is false', () => {
    const wrapper = mount(SpriteSlotsSection, {
      props: {
        spriteStates: [],
        spriteEnabled: false,
      },
    })

    expect(wrapper.find('.sprite-slots-disabled').exists()).toBe(true)
    expect(wrapper.find('.sprite-slots-disabled').text()).toBe('SPRITE OFF')
    wrapper.unmount()
  })

  it('does not show disabled message when spriteEnabled is true', () => {
    const wrapper = mount(SpriteSlotsSection, {
      props: {
        spriteStates: [],
        spriteEnabled: true,
      },
    })

    expect(wrapper.find('.sprite-slots-disabled').exists()).toBe(false)
    wrapper.unmount()
  })

  it('renders section title', () => {
    const wrapper = mount(SpriteSlotsSection, {
      props: {
        spriteStates: [],
        spriteEnabled: true,
      },
    })

    const title = wrapper.find('.sprite-slots-title')
    expect(title.exists()).toBe(true)
    expect(title.text()).toBe('Sprite Slots')
    wrapper.unmount()
  })

  it('renders table with all 8 sprite rows', () => {
    const sprites = makeAllSprites()
    const wrapper = mount(SpriteSlotsSection, {
      props: {
        spriteStates: sprites,
        spriteEnabled: true,
      },
    })

    const rows = wrapper.findAll('.sprite-slots-row')
    expect(rows.length).toBe(8)
    wrapper.unmount()
  })

  it('shows correct sprite number in first column', () => {
    const sprites = makeAllSprites()
    const wrapper = mount(SpriteSlotsSection, {
      props: {
        spriteStates: sprites,
        spriteEnabled: true,
      },
    })

    const numbers = wrapper.findAll('.sprite-slots-cell-number')
    expect(numbers.length).toBe(8)
    expect(numbers[0]!.text()).toBe('0')
    expect(numbers[3]!.text()).toBe('3')
    expect(numbers[7]!.text()).toBe('7')
    wrapper.unmount()
  })

  it('shows correct X and Y coordinates', () => {
    const sprites = [
      makeSprite({ spriteNumber: 0, x: 100, y: 200 }),
      makeSprite({ spriteNumber: 1, x: 255, y: 0 }),
    ]
    const wrapper = mount(SpriteSlotsSection, {
      props: {
        spriteStates: sprites,
        spriteEnabled: true,
      },
    })

    const xCells = wrapper.findAll('.sprite-slots-cell-x')
    const yCells = wrapper.findAll('.sprite-slots-cell-y')
    expect(xCells.length).toBe(2)
    expect(yCells.length).toBe(2)
    expect(xCells[0]!.text()).toBe('100')
    expect(yCells[0]!.text()).toBe('200')
    expect(xCells[1]!.text()).toBe('255')
    expect(yCells[1]!.text()).toBe('0')
    wrapper.unmount()
  })

  it('shows visible status correctly', () => {
    const sprites = [
      makeSprite({ spriteNumber: 0, visible: true }),
      makeSprite({ spriteNumber: 1, visible: false }),
    ]
    const wrapper = mount(SpriteSlotsSection, {
      props: {
        spriteStates: sprites,
        spriteEnabled: true,
      },
    })

    const visibleCells = wrapper.findAll('.sprite-slots-cell-visible')
    expect(visibleCells.length).toBe(2)
    expect(visibleCells[0]!.text()).toBe('ON')
    expect(visibleCells[1]!.text()).toBe('OFF')
    wrapper.unmount()
  })

  it('shows priority value', () => {
    const sprites = [
      makeSprite({ spriteNumber: 0, priority: 0 }),
      makeSprite({ spriteNumber: 1, priority: 1 }),
    ]
    const wrapper = mount(SpriteSlotsSection, {
      props: {
        spriteStates: sprites,
        spriteEnabled: true,
      },
    })

    const priorityCells = wrapper.findAll('.sprite-slots-cell-priority')
    expect(priorityCells.length).toBe(2)
    expect(priorityCells[0]!.text()).toBe('0')
    expect(priorityCells[1]!.text()).toBe('1')
    wrapper.unmount()
  })

  it('shows definition status for sprites with and without definitions', () => {
    const sprites = [
      makeSprite({ spriteNumber: 0, definition: null }),
      makeSprite({
        spriteNumber: 1,
        definition: {
          spriteNumber: 1,
          colorCombination: 0,
          size: 0,
          priority: 0,
          invertX: 0,
          invertY: 0,
          characterSet: [65],
          tiles: [],
        },
      }),
    ]
    const wrapper = mount(SpriteSlotsSection, {
      props: {
        spriteStates: sprites,
        spriteEnabled: true,
      },
    })

    const defCells = wrapper.findAll('.sprite-slots-cell-definition')
    expect(defCells.length).toBe(2)
    expect(defCells[0]!.text()).toBe('-')
    expect(defCells[1]!.text()).toBe('Yes')
    wrapper.unmount()
  })

  it('renders table header with column labels', () => {
    const wrapper = mount(SpriteSlotsSection, {
      props: {
        spriteStates: [],
        spriteEnabled: true,
      },
    })

    const headers = wrapper.findAll('.sprite-slots-header-cell')
    expect(headers.length).toBe(6)
    expect(headers[0]!.text()).toBe('#')
    expect(headers[1]!.text()).toBe('X')
    expect(headers[2]!.text()).toBe('Y')
    expect(headers[3]!.text()).toBe('Visible')
    expect(headers[4]!.text()).toBe('Priority')
    expect(headers[5]!.text()).toBe('Definition')
    wrapper.unmount()
  })
})
