/**
 * Message handlers for BASIC IDE web worker communication
 *
 * Use loglevel: log.getLogger('ide-messages').setLevel('debug') in console for verbose logs.
 */
import type { AnyServiceWorkerMessage, ErrorMessage, ResultMessage } from '@/core/interfaces'
import type { Note, Rest } from '@/core/sound/types'
import { ExecutionError } from '@/features/ide/errors/ExecutionError'
import { logComposable, logIdeMessages } from '@/shared/logger'

import type { MessageHandlerContext,QueuedMessage } from './messageHandlerContext'
import { handleScreenChangedMessage, handleScreenUpdateMessage, handleSpriteStatesMessage } from './screenHandlers'
import { extendExecutionTimeout } from './useBasicIdeWebWorkerUtils'
import { useWebAudioPlayer } from './useWebAudioPlayer'

export { ExecutionError }
export type { MessageHandlerContext, PendingSpriteAction, SpriteActionQueues } from './messageHandlerContext'
export { handleScreenUpdateMessage } from './screenHandlers'

/**
 * Message queue for non-critical messages
 * Processed during requestAnimationFrame to align with rendering
 */
const messageQueue: QueuedMessage[] = []
let isProcessingQueue = false
let queueAnimationFrame: number | null = null

/**
 * Shared Web Audio player instance
 * Created once and reused across all PLAY commands
 */
const audioPlayer = useWebAudioPlayer()

/**
 * Stop all audio playback immediately
 * Call when CLEAR button is pressed to stop any playing music
 */
export function stopAudioPlayback(): void {
  audioPlayer.stopAll()
}

/**
 * Cleanup function for module-level resources
 * Call on component unmount to prevent memory leaks
 */
export function cleanupMessageHandlers(): void {
  // Cancel pending animation frame for message queue
  if (queueAnimationFrame !== null) {
    cancelAnimationFrame(queueAnimationFrame)
    queueAnimationFrame = null
  }
  isProcessingQueue = false
  messageQueue.length = 0

  // Cleanup audio player
  audioPlayer.cleanup()
}

/**
 * Process queued messages during animation frame
 * This ensures state updates happen in sync with rendering
 */
function processMessageQueue(): void {
  if (messageQueue.length === 0) {
    isProcessingQueue = false
    queueAnimationFrame = null
    return
  }

  // Process all queued messages in this frame
  // This batches multiple updates together
  const messagesToProcess = messageQueue.splice(0)
  isProcessingQueue = false
  queueAnimationFrame = null

  for (const { message, context } of messagesToProcess) {
    processMessage(message, context)
  }

  // If more messages arrived while processing, schedule another frame
  if (messageQueue.length > 0) {
    scheduleQueueProcessing()
  }
}

/**
 * Schedule message queue processing in the next animation frame
 */
function scheduleQueueProcessing(): void {
  if (isProcessingQueue || queueAnimationFrame !== null) {
    return // Already scheduled
  }

  isProcessingQueue = true
  queueAnimationFrame = requestAnimationFrame(() => {
    processMessageQueue()
  })
}

/**
 * Flush the message queue synchronously (e.g. before resolving RESULT so OUTPUT/ANIMATION_COMMAND are applied first).
 */
function flushMessageQueue(): void {
  if (queueAnimationFrame !== null) {
    cancelAnimationFrame(queueAnimationFrame)
    queueAnimationFrame = null
  }
  isProcessingQueue = false
  while (messageQueue.length > 0) {
    const messagesToProcess = messageQueue.splice(0)
    for (const { message, context } of messagesToProcess) {
      if (!context) {
        logComposable.warn('Skipping queued message: context is undefined')
        continue
      }
      processMessage(message, context)
    }
  }
}

/**
 * Handle output message from web worker
 */
export function handleOutputMessage(message: AnyServiceWorkerMessage, context: MessageHandlerContext): void {
  if (message.type !== 'OUTPUT') return
  const { output: outputText, outputType } = message.data
  logIdeMessages.debug('📤 Handling output:', outputType, outputText)

  if (outputType === 'print') {
    context.output.value.push(outputText)
  } else if (outputType === 'debug') {
    context.debugOutput.value += `${outputText}\n`
  } else if (outputType === 'error') {
    context.errors.value.push({
      line: 0,
      message: outputText,
      type: 'runtime',
    })
  }
}

/**
 * Handle result message from web worker
 */
export function handleResultMessage(message: AnyServiceWorkerMessage, context: MessageHandlerContext): void {
  const resultMessage = message as ResultMessage
  const result = resultMessage.data // message.data IS the ExecutionResult
  logComposable.debug('Execution completed:', result.executionId, 'result:', result)
  if (!result.success && result.errors?.length) {
    logComposable.error('Execution failed:', result.errors[0]?.message, result.errors)
  }

  // Flush queued OUTPUT/ANIMATION_COMMAND so output and movement state are updated before resolving.
  // Otherwise RESULT resolves first, UI re-renders with empty output, then rAF applies OUTPUT (one frame late).
  flushMessageQueue()

  // Use message.id to look up the pending message (not executionId from data)
  const pending = context.webWorkerManager.pendingMessages.get(message.id)
  if (pending) {
    clearTimeout(pending.timeout)
    context.webWorkerManager.pendingMessages.delete(message.id)
    pending.resolve(result)
  } else {
    logComposable.warn('No pending message found for messageId:', message.id)
  }
}

/**
 * Handle error message from web worker
 */
export function handleErrorMessage(message: AnyServiceWorkerMessage, context: MessageHandlerContext): void {
  const errorMessage = message as ErrorMessage
  const data = errorMessage.data
  const executionId = data?.executionId ?? 'unknown'
  const errorText = data?.message ?? String(message)
  const lineNumber = data?.lineNumber
  const sourceLine = data?.sourceLine
  const stack = data?.stack

  logComposable.error(
    'Execution error:',
    executionId,
    errorText,
    lineNumber != null ? `(at line ${lineNumber})` : ''
  )

  flushMessageQueue()

  // Set errors so UI shows root line/stack; reject with ExecutionError so runCode catch preserves them
  const errorEntry = {
    line: lineNumber ?? 0,
    message: errorText,
    type: 'runtime' as const,
    ...(typeof stack === 'string' && stack.length > 0 && { stack }),
    ...(sourceLine && { sourceLine }),
  }
  if (context?.errors) {
    context.errors.value = [errorEntry]
  }

  if (!context?.webWorkerManager) {
    logComposable.warn('handleErrorMessage: context or webWorkerManager missing, skipping pending reject')
    return
  }
  const pending = context.webWorkerManager.pendingMessages.get(message.id)
  if (pending) {
    clearTimeout(pending.timeout)
    context.webWorkerManager.pendingMessages.delete(message.id)
    const executionError = new ExecutionError(errorText, {
      lineNumber,
      sourceLine,
      stackTrace: stack,
    })
    pending.reject(executionError)
  } else {
    logComposable.warn('No pending message found for error messageId:', message.id)
  }
}

/**
 * Handle progress message from web worker
 */
export function handleProgressMessage(message: AnyServiceWorkerMessage, _context: MessageHandlerContext): void {
  if (message.type !== 'PROGRESS') return
  const { iterationCount, currentStatement } = message.data
  logIdeMessages.debug('🔄 Progress:', iterationCount, currentStatement)
}

/**
 * Handle PLAY_SOUND message from web worker
 * Converts flat event array back to per-channel structure and plays via Web Audio API.
 * Sends PLAY_SOUND_COMPLETE back to the worker when audio finishes.
 */
export function handlePlaySoundMessage(message: AnyServiceWorkerMessage, context: MessageHandlerContext): void {
  if (message.type !== 'PLAY_SOUND') return

  const playSoundMessage = message
  const { events, executionId, playId } = playSoundMessage.data

  logIdeMessages.debug('Handling PLAY_SOUND:', events.length, 'events', 'playId:', playId)

  // Initialize audio context on first use (requires user gesture)
  if (!audioPlayer.isInitialized.value) {
    audioPlayer.initialize()
  }

  // Group events by channel to reconstruct per-channel structure
  const channelMap = new Map<number, Array<Note | Rest>>()

  for (const event of events) {
    const channel = event.channel
    if (!channelMap.has(channel)) {
      channelMap.set(channel, [])
    }

    const channelEvents = channelMap.get(channel)!

    if (event.frequency !== undefined) {
      // It's a Note
      const note: Note = {
        frequency: event.frequency,
        duration: event.duration,
        channel: event.channel,
        duty: event.duty,
        envelope: event.envelope,
        volumeOrLength: event.volumeOrLength,
      }
      channelEvents.push(note)
    } else {
      // It's a Rest
      const rest: Rest = {
        duration: event.duration,
        channel: event.channel,
      }
      channelEvents.push(rest)
    }
  }

  // Convert map to array of channels (ensure channels 0-2 exist)
  const channels: Array<Array<Note | Rest>> = []
  for (let i = 0; i < 3; i++) {
    channels.push(channelMap.get(i) ?? [])
  }

  // Play sequentially: next PLAY starts after current melody finishes (F-BASIC behavior)
  audioPlayer.playMusicSequential(channels)

  // Schedule PLAY_SOUND_COMPLETE after total duration so the worker can resume execution
  const totalDurationMs = audioPlayer.getTotalDurationMs(channels)
  if (totalDurationMs > 0 && playId) {
    setTimeout(() => {
      const worker = context.webWorkerManager.worker
      if (worker) {
        worker.postMessage({
          type: 'PLAY_SOUND_COMPLETE',
          id: `play-complete-${Date.now()}`,
          timestamp: Date.now(),
          data: { executionId, playId },
        })
      }
    }, totalDurationMs)
  }
}

/**
 * Route message to appropriate handler
 *
 * Event loop execution order in browsers:
 * 1. Execute macrotask (worker.onmessage callback) - WE ARE HERE
 * 2. Execute all microtasks (Promise.then, queueMicrotask)
 * 3. Execute requestAnimationFrame callbacks (rendering phase)
 * 4. Browser rendering (paint)
 * 5. Execute requestIdleCallback (idle time)
 *
 * Strategy:
 * - Critical messages (RESULT, ERROR): Process immediately (synchronously)
 * - Non-critical messages (SCREEN_UPDATE, OUTPUT): Queue for processing in requestAnimationFrame
 *
 * This ensures:
 * - Vue state updates happen in the same frame as rendering
 * - State updates and rendering are synchronized
 * - No blocking of the current event loop iteration
 * - Messages are batched per frame for efficiency
 */
export function handleWorkerMessage(message: AnyServiceWorkerMessage, context: MessageHandlerContext): void {
  if (!context) {
    logComposable.warn('handleWorkerMessage called with undefined context, skipping')
    return
  }
  // Critical messages must be handled immediately (they resolve promises, etc.)
  // REQUEST_INPUT: show input modal immediately so user can respond
  const isCritical =
    message.type === 'RESULT' ||
    message.type === 'ERROR' ||
    message.type === 'REQUEST_INPUT'

  if (isCritical) {
    // Handle critical messages synchronously - they're needed for execution flow
    processMessage(message, context)
  } else {
    // Queue non-critical messages for processing in requestAnimationFrame
    // This ensures Vue state updates happen in sync with rendering
    messageQueue.push({ message, context })
    scheduleQueueProcessing()
  }
}

/**
 * Process a message (internal function)
 */
function processMessage(message: AnyServiceWorkerMessage, context: MessageHandlerContext): void {
  logIdeMessages.debug('📨 Received message from worker:', message.type)

  // -- Only handling response messages, request messages sent elsewhere
  // eslint-disable-next-line @typescript-eslint/switch-exhaustiveness-check
  switch (message.type) {
    case 'OUTPUT':
      handleOutputMessage(message, context)
      break
    case 'SCREEN_CHANGED':
      handleScreenChangedMessage(message, context)
      break
    case 'SCREEN_UPDATE':
      handleScreenUpdateMessage(message, context)
      break
    case 'RESULT':
      handleResultMessage(message, context)
      break
    case 'ERROR':
      handleErrorMessage(message, context)
      break
    case 'PROGRESS':
      handleProgressMessage(message, context)
      break
    case 'PLAY_SOUND':
      handlePlaySoundMessage(message, context)
      break
    case 'REQUEST_INPUT': {
      const reqInputData = (message).data
      if (context.pendingInputRequest) {
        context.pendingInputRequest.value = reqInputData
      }
      // Extend run timeout so we don't reject while user fills INPUT/LINPUT
      if (reqInputData?.executionId && context.webWorkerManager) {
        extendExecutionTimeout(context.webWorkerManager, reqInputData.executionId)
      }
      break
    }
    case 'SPRITE_STATES': {
      handleSpriteStatesMessage(message, context)
      break
    }
    default:
      logComposable.warn('Unknown message type:', message.type)
  }
}
