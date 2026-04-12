// @vitest-environment jsdom
import { mount } from '@vue/test-utils'
import { describe, expect, it, vi } from 'vitest'

import { SyncCommandType } from '@/core/animation/sharedDisplayBuffer'
import type { SyncCommand } from '@/core/animation/sharedDisplayBufferAccessor'
import AnimationSyncSection from '@/features/ide/components/AnimationSyncSection.vue'

vi.mock('vue-i18n', () => ({
  useI18n: () => ({
    t: (key: string) => key,
  }),
}))

/** Factory for a SyncCommand with defaults */
function makeSyncCommand(overrides: Partial<SyncCommand> = {}): SyncCommand {
  return {
    commandType: SyncCommandType.NONE,
    actionNumber: 0,
    params: {
      startX: 0,
      startY: 0,
      direction: 0,
      speed: 0,
      distance: 0,
      priority: 0,
    },
    ...overrides,
  }
}

describe('AnimationSyncSection', () => {
  it('has the correct component name', () => {
    const wrapper = mount(AnimationSyncSection, {
      props: {
        syncCommand: null,
        ackStatus: 0,
      },
    })

    expect(wrapper.vm.$options.name).toBe('AnimationSyncSection')
    wrapper.unmount()
  })

  it('renders section title', () => {
    const wrapper = mount(AnimationSyncSection, {
      props: {
        syncCommand: null,
        ackStatus: 0,
      },
    })

    const title = wrapper.find('.animation-sync-title')
    expect(title.exists()).toBe(true)
    expect(title.text()).toBe('ide.bufferInspector.animationSyncTitle')
    wrapper.unmount()
  })

  it('shows idle state when syncCommand is null', () => {
    const wrapper = mount(AnimationSyncSection, {
      props: {
        syncCommand: null,
        ackStatus: 0,
      },
    })

    expect(wrapper.find('.animation-sync-idle').exists()).toBe(true)
    expect(wrapper.find('.animation-sync-idle').text()).toBe('ide.bufferInspector.animationSyncIdle')
    expect(wrapper.find('.animation-sync-table').exists()).toBe(false)
    wrapper.unmount()
  })

  it('renders table when syncCommand is provided', () => {
    const wrapper = mount(AnimationSyncSection, {
      props: {
        syncCommand: makeSyncCommand({ commandType: SyncCommandType.START_MOVEMENT }),
        ackStatus: 0,
      },
    })

    expect(wrapper.find('.animation-sync-idle').exists()).toBe(false)
    expect(wrapper.find('.animation-sync-table').exists()).toBe(true)
    wrapper.unmount()
  })

  it('renders table with correct headers', () => {
    const wrapper = mount(AnimationSyncSection, {
      props: {
        syncCommand: makeSyncCommand(),
        ackStatus: 0,
      },
    })

    const headers = wrapper.findAll('.sync-hdr')
    expect(headers.length).toBe(2)
    expect(headers[0]!.text()).toBe('ide.bufferInspector.animationSyncColField')
    expect(headers[1]!.text()).toBe('ide.bufferInspector.animationSyncColValue')
    wrapper.unmount()
  })

  it('shows command type as display name', () => {
    const wrapper = mount(AnimationSyncSection, {
      props: {
        syncCommand: makeSyncCommand({ commandType: SyncCommandType.START_MOVEMENT }),
        ackStatus: 0,
      },
    })

    const cells = wrapper.findAll('.sync-cell')
    expect(cells[0]!.text()).toBe('ide.bufferInspector.animationSyncFieldType')
    expect(cells[1]!.text()).toBe(
      'ide.bufferInspector.animationSyncCommandTypeStartMovement',
    )
    wrapper.unmount()
  })

  it('shows action number', () => {
    const wrapper = mount(AnimationSyncSection, {
      props: {
        syncCommand: makeSyncCommand({ actionNumber: 3 }),
        ackStatus: 0,
      },
    })

    const cells = wrapper.findAll('.sync-cell')
    // Action row is the 2nd row: field at index 2, value at index 3
    expect(cells[2]!.text()).toBe('ide.bufferInspector.animationSyncFieldAction')
    expect(cells[3]!.text()).toBe('3')
    wrapper.unmount()
  })

  it('shows all params correctly', () => {
    const wrapper = mount(AnimationSyncSection, {
      props: {
        syncCommand: makeSyncCommand({
          params: {
            startX: 10,
            startY: 20,
            direction: 3,
            speed: 5,
            distance: 100,
            priority: 1,
          },
        }),
        ackStatus: 0,
      },
    })

    const cells = wrapper.findAll('.sync-cell')
    // Row 0: type (indices 0,1)
    // Row 1: action (indices 2,3)
    // Row 2: startX (indices 4,5)
    // Row 3: startY (indices 6,7)
    // Row 4: direction (indices 8,9)
    // Row 5: speed (indices 10,11)
    // Row 6: distance (indices 12,13)
    // Row 7: priority (indices 14,15)
    expect(cells[4]!.text()).toBe('ide.bufferInspector.animationSyncFieldStartX')
    expect(cells[5]!.text()).toBe('10')
    expect(cells[6]!.text()).toBe('ide.bufferInspector.animationSyncFieldStartY')
    expect(cells[7]!.text()).toBe('20')
    expect(cells[8]!.text()).toBe('ide.bufferInspector.animationSyncFieldDirection')
    expect(cells[9]!.text()).toBe('3')
    expect(cells[10]!.text()).toBe('ide.bufferInspector.animationSyncFieldSpeed')
    expect(cells[11]!.text()).toBe('5')
    expect(cells[12]!.text()).toBe('ide.bufferInspector.animationSyncFieldDistance')
    expect(cells[13]!.text()).toBe('100')
    expect(cells[14]!.text()).toBe('ide.bufferInspector.animationSyncFieldPriority')
    expect(cells[15]!.text()).toBe('1')
    wrapper.unmount()
  })

  it('shows ACK status as Pending when ackStatus is 0', () => {
    const wrapper = mount(AnimationSyncSection, {
      props: {
        syncCommand: makeSyncCommand(),
        ackStatus: 0,
      },
    })

    const cells = wrapper.findAll('.sync-cell')
    // ACK is the last row: field at 16, value at 17
    expect(cells[16]!.text()).toBe('ide.bufferInspector.animationSyncFieldAck')
    expect(cells[17]!.text()).toBe('ide.bufferInspector.animationSyncAckPending')
    wrapper.unmount()
  })

  it('shows ACK status as Received when ackStatus is 1', () => {
    const wrapper = mount(AnimationSyncSection, {
      props: {
        syncCommand: makeSyncCommand(),
        ackStatus: 1,
      },
    })

    const cells = wrapper.findAll('.sync-cell')
    expect(cells[16]!.text()).toBe('ide.bufferInspector.animationSyncFieldAck')
    expect(cells[17]!.text()).toBe('ide.bufferInspector.animationSyncAckReceived')
    wrapper.unmount()
  })

  it('maps all SyncCommandType values to i18n keys', () => {
    const cases: [SyncCommandType, string][] = [
      [SyncCommandType.NONE, 'ide.bufferInspector.animationSyncCommandTypeNone'],
      [SyncCommandType.START_MOVEMENT, 'ide.bufferInspector.animationSyncCommandTypeStartMovement'],
      [SyncCommandType.STOP_MOVEMENT, 'ide.bufferInspector.animationSyncCommandTypeStopMovement'],
      [SyncCommandType.ERASE_MOVEMENT, 'ide.bufferInspector.animationSyncCommandTypeEraseMovement'],
      [SyncCommandType.SET_POSITION, 'ide.bufferInspector.animationSyncCommandTypeSetPosition'],
      [SyncCommandType.CLEAR_ALL_MOVEMENTS, 'ide.bufferInspector.animationSyncCommandTypeClearAllMovements'],
    ]

    for (const [commandType, expectedName] of cases) {
      const wrapper = mount(AnimationSyncSection, {
        props: {
          syncCommand: makeSyncCommand({ commandType }),
          ackStatus: 0,
        },
      })

      const cells = wrapper.findAll('.sync-cell')
      expect(cells[0]!.text()).toBe('ide.bufferInspector.animationSyncFieldType')
      expect(cells[1]!.text()).toBe(expectedName)
      wrapper.unmount()
    }
  })

  it('renders expected number of rows in the table', () => {
    const wrapper = mount(AnimationSyncSection, {
      props: {
        syncCommand: makeSyncCommand(),
        ackStatus: 0,
      },
    })

    const rows = wrapper.findAll('.sync-row')
    expect(rows.length).toBe(9) // command type + action number + 6 params + ACK
    wrapper.unmount()
  })
})
