/**
 * Web worker integration: manager, message context, init/restart/send, joystick and input events.
 */

import type { ExecutionResult } from '@/core/types/execution-types'
import type { AnyServiceWorkerMessage } from '@/core/types/worker-messages'
import { logComposable } from '@/shared/logger'

import { handleWorkerMessage, type MessageHandlerContext } from './useBasicIdeMessageHandlers'
import type { BasicIdeScreenIntegration } from './useBasicIdeScreenIntegration'
import type { BasicIdeState } from './useBasicIdeState'
import type { WebWorkerManager } from './useBasicIdeWebWorkerUtils'
import {
  checkWebWorkerHealth,
  initializeWebWorker,
  rejectAllPendingMessages,
  restartWebWorker,
  sendBgData as sendBgDataUtil,
  sendMessageToWorker as sendMessageToWorkerUtil,
} from './useBasicIdeWebWorkerUtils'

export interface BasicIdeWorkerIntegration {
  webWorkerManager: WebWorkerManager
  initializeWebWorker: () => Promise<void>
  restartWebWorker: () => Promise<void>
  checkWebWorkerHealth: () => Promise<boolean>
  sendMessageToWorker: (message: AnyServiceWorkerMessage) => Promise<ExecutionResult>
  sendBgData: (grid: Array<Array<{ charCode: number; colorPattern: number }>>) => void
  sendClearDisplay: () => void
  sendStickEvent: (joystickId: number, state: number) => void
  sendStrigEvent: (joystickId: number, state: number) => void
  respondToInputRequest: (requestId: string, values: string[], cancelled: boolean) => void
  cleanupWebWorker: () => void
}

/**
 * Create worker manager, message handler context, and worker lifecycle/event APIs.
 */
export function useBasicIdeWorkerIntegration(
  state: BasicIdeState,
  screen: BasicIdeScreenIntegration
): BasicIdeWorkerIntegration {
  const webWorkerManager: WebWorkerManager = {
    worker: null,
    messageId: 0,
    pendingMessages: new Map(),
  }

  const messageHandlerContext: MessageHandlerContext = {
    output: state.output,
    errors: state.errors,
    debugOutput: state.debugOutput,
    screenBuffer: state.screenBuffer,
    cursorX: state.cursorX,
    cursorY: state.cursorY,
    bgPalette: state.bgPalette,
    backdropColor: state.backdropColor,
    spritePalette: state.spritePalette,
    cgenMode: state.cgenMode,
    spriteStates: state.spriteStates,
    spriteEnabled: state.spriteEnabled,
    // movementStates removed - read from shared buffer instead
    frontSpriteNodes: state.frontSpriteNodes,
    backSpriteNodes: state.backSpriteNodes,
    spriteActionQueues: state.spriteActionQueues,
    webWorkerManager,
    sharedDisplayViews: screen.sharedDisplayViews,
    scheduleRender: screen.scheduleRender,
    scheduleRenderForScreenChanged: screen.scheduleRenderForScreenChanged,
    setDecodedScreenState: screen.setDecodedScreenState,
    pendingInputRequest: state.pendingInputRequest,
    respondToInputRequest: respondToInputRequestImpl,
  }

  function respondToInputRequestImpl(requestId: string, values: string[], cancelled: boolean) {
    if (webWorkerManager.worker) {
      webWorkerManager.worker.postMessage({
        type: 'INPUT_VALUE',
        id: requestId,
        timestamp: Date.now(),
        data: { requestId, values, cancelled },
      })
    }
    state.pendingInputRequest.value = null
  }

  const initializeWebWorkerWrapper = async (): Promise<void> => {
    await initializeWebWorker(webWorkerManager, message => {
      handleWorkerMessage(message, messageHandlerContext)
    }, screen.sharedAnimationBuffer, screen.sharedJoystickBuffer, screen.sharedKeyboardBuffer)
  }

  const restartWebWorkerWrapper = async (): Promise<void> => {
    state.spriteActionQueues.value?.clear()
    await restartWebWorker(webWorkerManager, message => {
      handleWorkerMessage(message, messageHandlerContext)
    }, screen.sharedAnimationBuffer)
  }

  const checkWebWorkerHealthWrapper = async (): Promise<boolean> => {
    return checkWebWorkerHealth(webWorkerManager, msg => sendMessageToWorkerUtil(msg, webWorkerManager))
  }

  const sendMessageToWorkerWrapper = (message: AnyServiceWorkerMessage): Promise<ExecutionResult> => {
    return sendMessageToWorkerUtil(message, webWorkerManager)
  }

  const sendClearDisplay = () => {
    if (webWorkerManager.worker) {
      webWorkerManager.worker.postMessage({
        type: 'CLEAR_DISPLAY',
        id: `clear-display-${Date.now()}`,
        timestamp: Date.now(),
        data: {},
      })
    }
  }

  const sendStickEvent = (joystickId: number, state: number) => {
    if (webWorkerManager.worker) {
      webWorkerManager.worker.postMessage({
        type: 'STICK_EVENT',
        id: `stick-${Date.now()}`,
        timestamp: Date.now(),
        data: { joystickId, state },
      })
    }
  }

  const sendStrigEvent = (joystickId: number, state: number) => {
    if (webWorkerManager.worker) {
      webWorkerManager.worker.postMessage({
        type: 'STRIG_EVENT',
        id: `strig-${Date.now()}`,
        timestamp: Date.now(),
        data: { joystickId, state },
      })
    }
  }

  const sendBgData = (grid: Array<Array<{ charCode: number; colorPattern: number }>>) => {
    sendBgDataUtil(grid, webWorkerManager)
  }

  const cleanupWebWorker = () => {
    logComposable.debug('Cleaning up web worker...')
    if (webWorkerManager.worker) {
      webWorkerManager.worker.terminate()
      webWorkerManager.worker = null
    }
    rejectAllPendingMessages(webWorkerManager, 'Component unmounted')
  }

  return {
    webWorkerManager,
    initializeWebWorker: initializeWebWorkerWrapper,
    restartWebWorker: restartWebWorkerWrapper,
    checkWebWorkerHealth: checkWebWorkerHealthWrapper,
    sendMessageToWorker: sendMessageToWorkerWrapper,
    sendBgData,
    sendClearDisplay,
    sendStickEvent,
    sendStrigEvent,
    respondToInputRequest: respondToInputRequestImpl,
    cleanupWebWorker,
  }
}
