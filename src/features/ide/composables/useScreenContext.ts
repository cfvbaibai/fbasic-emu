/**
 * Provide/inject for screen-related state used by ScreenTab and Screen.
 * Eliminates prop drilling from IdePage → RuntimeOutput → ScreenTab → Screen.
 */

import { inject, type InjectionKey, provide, type Ref } from 'vue'

import type { SharedDisplayViews } from '@/core/animation/sharedDisplayBuffer'
import type { DecodedScreenState, SharedDisplayBufferAccessor } from '@/core/animation/sharedDisplayBufferAccessor'
import type { ScreenCell } from '@/core/interfaces'
import type { MovementState, SpriteState } from '@/core/sprite/types'

/**
 * Screen context: refs and callbacks for the CRT screen and sprites.
 * Provided by IdePage, consumed by ScreenTab and Screen.
 */
export interface ScreenContextValue {
  screenBuffer: Ref<ScreenCell[][]>
  cursorX: Ref<number>
  cursorY: Ref<number>
  bgPalette: Ref<number>
  backdropColor: Ref<number>
  spritePalette: Ref<number>
  cgenMode: Ref<number>
  spriteStates: Ref<SpriteState[]>
  spriteEnabled: Ref<boolean>
  /** Movement states for animated sprites (DEF MOVE) - optional, read from shared buffer instead */
  movementStates?: Ref<MovementState[] | undefined>
  /** Current sprite positions from shared buffer (updated each frame by animation loop). */
  movementPositionsFromBuffer: Ref<Map<number, { x: number; y: number }>>
  externalFrontSpriteNodes: Ref<Map<number, unknown>>
  externalBackSpriteNodes: Ref<Map<number, unknown>>
  sharedDisplayViews: Ref<SharedDisplayViews | undefined>
  /** Shared animation buffer accessor for reading sprite positions and animation state. */
  sharedDisplayBufferAccessor: SharedDisplayBufferAccessor
  /** Shared animation buffer (SharedArrayBuffer) for Animation Worker. */
  sharedAnimationBuffer: Ref<SharedArrayBuffer | undefined>
  /** Shared animation view (Float64Array) for reading sprite positions and isActive */
  sharedAnimationView?: Ref<Float64Array | undefined>
  /** Shared joystick buffer (main thread writes, workers read). */
  sharedJoystickBuffer: Ref<SharedArrayBuffer | undefined>
  setDecodedScreenState: (decoded: DecodedScreenState) => void
  registerScheduleRender: (fn: () => void) => void
  /** Callback to update inspector MOVE tab data (called by animation loop every frame). */
  updateInspectorMoveSlots?: () => void
}

export const ScreenContextKey: InjectionKey<ScreenContextValue> = Symbol(
  'ide-screen-context'
)

/**
 * Provide screen context. Call from IdePage with refs and callbacks from useBasicIdeEnhanced.
 */
export function provideScreenContext(value: ScreenContextValue): void {
  provide(ScreenContextKey, value)
}

/**
 * Inject screen context. Use in ScreenTab and Screen.
 * @throws if used outside a provider (IdePage must provide)
 */
export function useScreenContext(): ScreenContextValue {
  const ctx = inject(ScreenContextKey)
  if (!ctx) {
    throw new Error(
      'useScreenContext() must be used within a component tree that calls provideScreenContext (e.g. IdePage)'
    )
  }
  return ctx
}
