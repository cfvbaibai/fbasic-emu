/**
 * Types and interfaces for BASIC IDE web worker message handling
 */
import type { Ref } from 'vue'

import type { SharedDisplayViews } from '@/core/animation/sharedDisplayBuffer'
import type { DecodedScreenState } from '@/core/animation/sharedDisplayBufferAccessor'
import type { SpriteState } from '@/core/sprite/types'
import type { ScreenCell } from '@/core/types/execution-types'
import type { AnyServiceWorkerMessage, RequestInputMessage } from '@/core/types/worker-messages'

import type { WebWorkerManager } from './useBasicIdeWebWorkerUtils'

/**
 * Pending action for a sprite when its Konva node does not exist yet;
 * applied when node is created or START_MOVEMENT is handled.
 */
export type PendingSpriteAction = { type: 'POSITION'; x: number; y: number }

/** Per-sprite action queue (action number -> list of pending actions). */
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
 * Message queue for non-critical messages
 * Processed during requestAnimationFrame to align with rendering
 */
export interface QueuedMessage {
  message: AnyServiceWorkerMessage
  context: MessageHandlerContext
}
