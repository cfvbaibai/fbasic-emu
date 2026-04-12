import type { KeyboardBufferView } from '@/core/devices/sharedKeyboardBuffer'
import { createSharedKeyboardBuffer, createViewsFromKeyboardBuffer } from '@/core/devices/sharedKeyboardBuffer'

/** Create a real keyboard buffer view for testing */
export function createTestKeyboardBuffer(): KeyboardBufferView {
  return createViewsFromKeyboardBuffer(createSharedKeyboardBuffer())
}
