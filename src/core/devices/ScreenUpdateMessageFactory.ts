import type { ScreenCell } from '@/core/types/execution-types'
import type { ScreenUpdateMessage } from '@/core/types/worker-messages'

/**
 * Factory functions for creating screen update messages.
 *
 * Extracted from ScreenStateManager to separate the message construction
 * concern from screen state management.
 */

function baseMessage(executionId: string, suffix: string): ScreenUpdateMessage {
  const now = Date.now()
  return {
    type: 'SCREEN_UPDATE',
    id: `screen-${suffix}-${now}`,
    timestamp: now,
    data: { executionId, timestamp: now } as ScreenUpdateMessage['data'],
  }
}

export function createFullUpdateMessage(
  executionId: string,
  screenBuffer: ScreenCell[][],
  cursorX: number,
  cursorY: number,
): ScreenUpdateMessage {
  const msg = baseMessage(executionId, 'full')
  msg.data = {
    ...msg.data,
    updateType: 'full',
    screenBuffer,
    cursorX,
    cursorY,
    timestamp: msg.timestamp,
  }
  return msg
}

export function createCursorUpdateMessage(
  executionId: string,
  cursorX: number,
  cursorY: number,
): ScreenUpdateMessage {
  const msg = baseMessage(executionId, 'cursor')
  msg.data = {
    ...msg.data,
    updateType: 'cursor',
    cursorX,
    cursorY,
    timestamp: msg.timestamp,
  }
  return msg
}

export function createClearUpdateMessage(executionId: string): ScreenUpdateMessage {
  const msg = baseMessage(executionId, 'clear')
  msg.data = { ...msg.data, updateType: 'clear', timestamp: msg.timestamp }
  return msg
}

export function createColorUpdateMessage(
  executionId: string,
  cellsToUpdate: Array<{ x: number; y: number; pattern: number }>,
): ScreenUpdateMessage {
  const msg = baseMessage(executionId, 'color')
  msg.data = {
    ...msg.data,
    updateType: 'color',
    colorUpdates: cellsToUpdate,
    timestamp: msg.timestamp,
  }
  return msg
}

export function createPaletteUpdateMessage(
  executionId: string,
  bgPalette: number,
  spritePalette: number,
): ScreenUpdateMessage {
  const msg = baseMessage(executionId, 'palette')
  msg.data = {
    ...msg.data,
    updateType: 'palette',
    bgPalette,
    spritePalette,
    timestamp: msg.timestamp,
  }
  return msg
}

export function createBackdropUpdateMessage(
  executionId: string,
  backdropColor: number,
): ScreenUpdateMessage {
  const msg = baseMessage(executionId, 'backdrop')
  msg.data = {
    ...msg.data,
    updateType: 'backdrop',
    backdropColor,
    timestamp: msg.timestamp,
  }
  return msg
}

export function createCgenUpdateMessage(
  executionId: string,
  cgenMode: number,
): ScreenUpdateMessage {
  const msg = baseMessage(executionId, 'cgen')
  msg.data = {
    ...msg.data,
    updateType: 'cgen',
    cgenMode,
    timestamp: msg.timestamp,
  }
  return msg
}
