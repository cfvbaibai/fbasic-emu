/**
 * Worker Shared Buffer Handlers
 *
 * Handles messages that configure shared memory buffers between the main thread
 * and the web worker. These handlers validate incoming buffer data and wire it
 * into the device adapter and interpreter for cross-thread communication.
 */

import { SharedDisplayBufferAccessor } from '@/core/animation/sharedDisplayBufferAccessor'
import type { BasicInterpreter } from '@/core/BasicInterpreter'
import type { WebWorkerDeviceAdapter } from '@/core/devices/WebWorkerDeviceAdapter'
import type { SetBgDataMessage, SetSharedAnimationBufferMessage, SetSharedJoystickBufferMessage, SetSharedKeyboardBufferMessage } from '@/core/types/worker-messages'
import type { BgGridData } from '@/features/bg-editor/types'
import { logWorker } from '@/shared/logger'

/**
 * Configure the shared animation buffer for display rendering.
 * Sets up the accessor on the device adapter and updates any existing
 * AnimationManager so it can sync directly to the AnimationWorker.
 */
export function handleSetSharedAnimationBuffer(
  message: SetSharedAnimationBufferMessage,
  interpreter: BasicInterpreter | null,
  deviceAdapter: WebWorkerDeviceAdapter | null,
  sharedAnimationBuffer: SharedArrayBuffer | null
): SharedArrayBuffer | null {
  const data = message.data
  if (!data?.buffer) {
    logWorker.warn('SET_SHARED_ANIMATION_BUFFER: message.data or buffer missing')
    return sharedAnimationBuffer
  }
  const { buffer } = data
  logWorker.debug('[WebWorkerInterpreter] SET_SHARED_ANIMATION_BUFFER received, buffer byteLength =', buffer.byteLength)
  const accessor = new SharedDisplayBufferAccessor(buffer)
  const animationManager = interpreter?.getAnimationManager()
  logWorker.debug('[WebWorkerInterpreter] Interpreter exists:', !!interpreter, 'AnimationManager exists:', !!animationManager)
  if (deviceAdapter) {
    deviceAdapter.setSharedDisplayBufferAccessor(accessor)
  }
  // Update AnimationManager's shared buffer for direct sync to AnimationWorker
  if (animationManager) {
    logWorker.debug('[WebWorkerInterpreter] Updating existing AnimationManager with shared buffer')
    animationManager.setSharedAnimationBuffer(buffer)
  } else {
    logWorker.debug('[WebWorkerInterpreter] AnimationManager not created yet, will use buffer when interpreter is created')
  }
  return buffer
}

/**
 * Configure the shared joystick buffer for input polling.
 */
export function handleSetSharedJoystickBuffer(
  message: SetSharedJoystickBufferMessage,
  deviceAdapter: WebWorkerDeviceAdapter | null
): void {
  const data = message.data
  if (!data?.buffer) {
    logWorker.warn('SET_SHARED_JOYSTICK_BUFFER: message.data or buffer missing')
    return
  }
  const { buffer } = data
  logWorker.debug('[WebWorkerInterpreter] SET_SHARED_JOYSTICK_BUFFER received, buffer byteLength =', buffer.byteLength)
  if (deviceAdapter) {
    deviceAdapter.setSharedJoystickBuffer(buffer)
    logWorker.debug('[WebWorkerInterpreter] Shared joystick buffer set in WebWorkerDeviceAdapter')
  } else {
    logWorker.warn('[WebWorkerInterpreter] No WebWorkerDeviceAdapter available for SET_SHARED_JOYSTICK_BUFFER')
  }
}

/**
 * Configure the shared keyboard buffer for input polling.
 */
export function handleSetSharedKeyboardBuffer(
  message: SetSharedKeyboardBufferMessage,
  deviceAdapter: WebWorkerDeviceAdapter | null
): void {
  const data = message.data
  if (!data?.buffer) {
    logWorker.warn('SET_SHARED_KEYBOARD_BUFFER: message.data or buffer missing')
    return
  }
  const { buffer } = data
  logWorker.debug('[WebWorkerInterpreter] SET_SHARED_KEYBOARD_BUFFER received, buffer byteLength =', buffer.byteLength)
  if (deviceAdapter) {
    deviceAdapter.setSharedKeyboardBuffer(buffer)
    logWorker.debug('[WebWorkerInterpreter] Shared keyboard buffer set in WebWorkerDeviceAdapter')
  } else {
    logWorker.warn('[WebWorkerInterpreter] No WebWorkerDeviceAdapter available for SET_SHARED_KEYBOARD_BUFFER')
  }
}

/**
 * Set background grid data on the device adapter for BG rendering.
 */
export function handleSetBgData(
  message: SetBgDataMessage,
  deviceAdapter: WebWorkerDeviceAdapter | null
): void {
  const data = message.data
  if (!data?.grid) {
    logWorker.warn('SET_BG_DATA: message.data or grid missing')
    return
  }
  logWorker.debug('[WebWorkerInterpreter] SET_BG_DATA received, grid size =', data.grid.length, 'x', data.grid[0]?.length ?? 0)
  if (deviceAdapter) {
    // Cast to BgGridData since the message type uses number for colorPattern
    // but the actual values are always 0-3 (ColorPattern)
    deviceAdapter.setBgGridData(data.grid as BgGridData)
    logWorker.debug('[WebWorkerInterpreter] BG grid data set in WebWorkerDeviceAdapter')
  } else {
    logWorker.warn('[WebWorkerInterpreter] No WebWorkerDeviceAdapter available for SET_BG_DATA')
  }
}
