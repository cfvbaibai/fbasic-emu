/**
 * Message handlers for BASIC IDE web worker communication
 *
 * Use loglevel: log.getLogger('ide-messages').setLevel('debug') in console for verbose logs.
 */
 

import type { Ref } from 'vue'

import type { SharedDisplayViews } from '@/core/animation/sharedDisplayBuffer'
import type { DecodedScreenState } from '@/core/animation/sharedDisplayBufferAccessor'
import type {
  AnyServiceWorkerMessage,
  ErrorMessage,
  RequestInputMessage,
  ResultMessage,
  ScreenCell,
} from '@/core/interfaces'
import type { Note, Rest } from '@/core/sound/types'
import type { SpriteState } from '@/core/sprite/types'
import { ExecutionError } from '@/features/ide/errors/ExecutionError'
import { clearBackgroundTileCache } from '@/features/ide/composables/useCanvasBackgroundRenderer'
import { clearSpriteImageCache } from '@/features/ide/composables/useKonvaSpriteRenderer'
import { setRuntimePaletteCombination } from '@/shared/data/palette'
import { logComposable, logIdeMessages } from '@/shared/logger'

import { extendExecutionTimeout, type WebWorkerManager } from './useBasicIdeWebWorkerUtils'
import { useWebAudioPlayer } from './useWebAudioPlayer'

export { ExecutionError }

/**
 * Message queue for non-critical messages
 * Processed during requestAnimationFrame to align with rendering
 */
interface QueuedMessage {
  message: AnyServiceWorkerMessage
  context: MessageHandlerContext
}

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
 * Pending action for a sprite when its Konva node does not exist yet;
 * applied when node is created or START_MOVEMENT is handled.
 */
export type PendingSpriteAction = { type: 'POSITION'; x: number; y: number }

/** Per-sprite action queue (action number → list of pending actions). */
export type SpriteActionQueues = Map<number, PendingSpriteAction[]>

export interface MessageHandlerContext {
  output: Ref<string[]>
  errors: Ref<
    Array<{ line: number; message: string; type: string; stack?: string; sourceLine?: string }>
  >
  debugOutput: Ref<string>
  screenBuffer: Ref<ScreenCell[][]>
  cursorX: Ref<number>
  cursorY: Ref<number>
  bgPalette: Ref<number>
  backdropColor?: Ref<number>
  spritePalette?: Ref<number>
  cgenMode?: Ref<number>
  /** Sprite states from DEF SPRITE and SPRITE commands (updated via SPRITE_STATES message) */
  spriteStates?: Ref<SpriteState[]>
  /** Whether sprite display is enabled (SPRITE ON/OFF) */
  spriteEnabled?: Ref<boolean>
  // movementStates removed - read from shared buffer instead
  frontSpriteNodes?: Ref<Map<number, unknown>>
  backSpriteNodes?: Ref<Map<number, unknown>>
  /** Per-sprite action queue; POSITION etc. when node does not exist; consumed when START_MOVEMENT is handled. */
  spriteActionQueues?: Ref<SpriteActionQueues>
  webWorkerManager: WebWorkerManager
  /** Shared display buffer views; main reads screen/cursor/scalars when SCREEN_CHANGED. */
  sharedDisplayViews?: SharedDisplayViews
  /** Called when SCREEN_CHANGED is received to schedule a render (Screen.vue reads from shared buffer). */
  scheduleRender?: () => void
  /** Coalesced version: at most one schedule per frame. Prefer this for SCREEN_CHANGED to avoid main-thread flood. */
  scheduleRenderForScreenChanged?: () => void
  /** Called by Screen.vue after decoding shared buffer to update refs (screenBuffer, cursorX, etc.). */
  setDecodedScreenState?: (decoded: DecodedScreenState) => void
  /** Pending INPUT/LINPUT request from worker; set when REQUEST_INPUT is received, cleared on submit/cancel. */
  pendingInputRequest?: Ref<RequestInputMessage['data'] | null>
  /** Send INPUT_VALUE to worker to resolve a pending input request. */
  respondToInputRequest?: (requestId: string, values: string[], cancelled: boolean) => void
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
 * Handle SCREEN_CHANGED message from web worker (shared buffer path).
 * Uses coalesced schedule so many SCREEN_CHANGED (e.g. loop with PRINT) only trigger one render per frame.
 */
export function handleScreenChangedMessage(
  _message: AnyServiceWorkerMessage,
  context: MessageHandlerContext
): void {
  const schedule = context.scheduleRenderForScreenChanged ?? context.scheduleRender
  if (schedule) {
    schedule()
  }
}

/**
 * Handle SPRITE_STATES message from web worker.
 * Updates sprite states and triggers a render to display static sprites (DEF SPRITE, SPRITE commands).
 */
export function handleSpriteStatesMessage(
  message: AnyServiceWorkerMessage,
  context: MessageHandlerContext
): void {
  if (message.type !== 'SPRITE_STATES') return

  const { spriteStates, spriteEnabled } = message.data
  logIdeMessages.debug('📤 Handling SPRITE_STATES:', { statesCount: spriteStates?.length, enabled: spriteEnabled })

  // Update sprite states in context (these are passed to Screen.vue via useScreenContext)
  if (context.spriteStates && spriteStates) {
    context.spriteStates.value = spriteStates
  }
  if (context.spriteEnabled !== undefined && spriteEnabled !== undefined) {
    context.spriteEnabled.value = spriteEnabled
  }

  // Schedule a full render to display the sprites
  const schedule = context.scheduleRender
  if (schedule) {
    schedule()
  }
}

/**
 * Handle screen update message from web worker (legacy SCREEN_UPDATE; worker no longer sends for shared buffer path)
 */
export function handleScreenUpdateMessage(message: AnyServiceWorkerMessage, context: MessageHandlerContext): void {
  if (message.type !== 'SCREEN_UPDATE') return

  const update = message.data
  if (!update) {
    logComposable.warn('SCREEN_UPDATE message has no data')
    return
  }
  if (!context?.screenBuffer) {
    logComposable.warn('SCREEN_UPDATE: context or screenBuffer missing, skipping')
    return
  }

  switch (update.updateType) {
    case 'character':
      if (update.x !== undefined && update.y !== undefined && update.character !== undefined) {
        const x = update.x
        const y = update.y
        const character = update.character

        // Ensure row exists
        context.screenBuffer.value[y] ??= []

        // Ensure cell exists
        const currentRow = context.screenBuffer.value[y]
        currentRow[x] ??= {
          character: ' ',
          colorPattern: 0,
          x,
          y,
        }

        // Update character - force reactivity by creating new object
        const currentCell = currentRow[x]
        const newCell: ScreenCell = {
          character,
          colorPattern: currentCell.colorPattern,
          x: currentCell.x,
          y: currentCell.y,
        }
        currentRow[x] = newCell

        // Also trigger reactivity by reassigning the row
        context.screenBuffer.value[y] = [...currentRow]
      }
      break
    case 'cursor':
      if (update.cursorX !== undefined) context.cursorX.value = update.cursorX
      if (update.cursorY !== undefined) context.cursorY.value = update.cursorY
      break
    case 'clear':
      // Clear screen buffer
      for (let y = 0; y < 24; y++) {
        const row = context.screenBuffer.value[y]
        if (row) {
          for (let x = 0; x < 28; x++) {
            const cell = row[x]
            if (cell) {
              cell.character = ' '
            }
          }
        }
      }
      context.cursorX.value = 0
      context.cursorY.value = 0
      break
    case 'full':
      if (update.screenBuffer) {
        context.screenBuffer.value = update.screenBuffer
      }
      if (update.cursorX !== undefined) context.cursorX.value = update.cursorX
      if (update.cursorY !== undefined) context.cursorY.value = update.cursorY
      break
    case 'color':
      // Update color pattern for cells specified in colorUpdates
      if (update.colorUpdates) {
        for (const colorUpdate of update.colorUpdates) {
          const { x, y, pattern } = colorUpdate

          // Ensure row exists
          context.screenBuffer.value[y] ??= []

          // Ensure cell exists
          const currentRow = context.screenBuffer.value[y]
          currentRow[x] ??= {
            character: ' ',
            colorPattern: 0,
            x,
            y,
          }

          // Update color pattern - force reactivity by creating new object
          const currentCell = currentRow[x]
          const newCell: ScreenCell = {
            character: currentCell.character,
            colorPattern: pattern,
            x: currentCell.x,
            y: currentCell.y,
          }
          currentRow[x] = newCell

          // Also trigger reactivity by reassigning the row
          context.screenBuffer.value[y] = [...currentRow]
        }
      }
      break
    case 'palette':
      // Update background and sprite palette codes
      if (update.bgPalette !== undefined) {
        context.bgPalette.value = update.bgPalette
        logComposable.debug('Updated background palette:', update.bgPalette)
      }
      if (update.spritePalette !== undefined) {
        // Note: spritePalette is stored but not currently used in rendering
        // It will be used when sprite system is implemented
        logComposable.debug('Updated sprite palette:', update.spritePalette)
      }
      break
    case 'backdrop':
      // Update backdrop color
      if (update.backdropColor !== undefined && context.backdropColor) {
        context.backdropColor.value = update.backdropColor
        logComposable.debug('Updated backdrop color:', update.backdropColor)
      }
      break
    case 'cgen':
      // Update character generator mode
      if (update.cgenMode !== undefined) {
        if (context.cgenMode) {
          context.cgenMode.value = update.cgenMode
        }
        logComposable.debug('Updated character generator mode:', update.cgenMode)
      }
      break
    case 'palette-combination':
      if (
        update.paletteTarget &&
        update.paletteIndex !== undefined &&
        update.paletteCombination !== undefined &&
        update.paletteColors
      ) {
        setRuntimePaletteCombination(
          update.paletteTarget,
          update.paletteIndex,
          update.paletteCombination,
          update.paletteColors
        )
        clearBackgroundTileCache()
        clearSpriteImageCache()
        context.scheduleRender?.()
        logComposable.debug('Updated runtime palette combination:', {
          target: update.paletteTarget,
          paletteIndex: update.paletteIndex,
          combination: update.paletteCombination,
          colors: update.paletteColors,
        })
      }
      break
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
 * Converts flat event array back to per-channel structure and plays via Web Audio API
 */
export function handlePlaySoundMessage(message: AnyServiceWorkerMessage, _context: MessageHandlerContext): void {
  if (message.type !== 'PLAY_SOUND') return

  const playSoundMessage = message
  const { events } = playSoundMessage.data

  logIdeMessages.debug('🎵 Handling PLAY_SOUND:', events.length, 'events')

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
}

/**
 * Handle animation command message from web worker
 *
 * NOTE: All animation commands are now handled via direct sync (Executor Worker → Animation Worker)
 * through shared buffer using Atomics. Main thread reads animation state ONLY from shared buffer.
 *
 * Per real F-BASIC hardware behavior:
 * - POSITION on inactive sprite: No immediate screen change; stores as start position for next MOVE
 * - POSITION on active sprite: Takes effect immediately (render loop reads from shared buffer)
 *
 * This handler is obsolete and should no longer receive messages.
 */
// Omitted: handleAnimationCommandMessage - Animation commands now handled via shared buffer sync

/**
    case 2:
    case 8:
      return -1 // Up directions
    case 4:
    case 5:
    case 6:
      return 1 // Down directions
    default:
      return 0
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
