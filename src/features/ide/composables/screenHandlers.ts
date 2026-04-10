/**
 * Screen-related message handlers for BASIC IDE web worker communication
 */
import type { ScreenCell } from '@/core/types/execution-types'
import type { AnyServiceWorkerMessage, ScreenUpdateMessage } from '@/core/types/worker-messages'
import { clearBackgroundTileCache } from '@/features/ide/composables/useCanvasBackgroundRenderer'
import { clearSpriteImageCache } from '@/features/ide/composables/useKonvaSpriteRenderer'
import { setRuntimePaletteCombination } from '@/shared/data/palette'
import { logComposable, logIdeMessages } from '@/shared/logger'

import type { MessageHandlerContext } from './messageHandlerContext'

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
      handleCharacterUpdate(context, update)
      break
    case 'cursor':
      if (update.cursorX !== undefined) context.cursorX.value = update.cursorX
      if (update.cursorY !== undefined) context.cursorY.value = update.cursorY
      break
    case 'clear':
      handleClearUpdate(context)
      break
    case 'full':
      if (update.screenBuffer) {
        context.screenBuffer.value = update.screenBuffer
      }
      if (update.cursorX !== undefined) context.cursorX.value = update.cursorX
      if (update.cursorY !== undefined) context.cursorY.value = update.cursorY
      break
    case 'color':
      handleColorUpdate(context, update)
      break
    case 'palette':
      handlePaletteUpdate(context, update)
      break
    case 'backdrop':
      handleBackdropUpdate(context, update)
      break
    case 'cgen':
      handleCgenUpdate(context, update)
      break
    case 'palette-combination':
      handlePaletteCombinationUpdate(context, update)
      break
  }
}

function handleCharacterUpdate(context: MessageHandlerContext, update: ScreenUpdateMessage['data']): void {
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
}

function handleClearUpdate(context: MessageHandlerContext): void {
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
}

function handleColorUpdate(context: MessageHandlerContext, update: ScreenUpdateMessage['data']): void {
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
}

function handlePaletteUpdate(context: MessageHandlerContext, update: ScreenUpdateMessage['data']): void {
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
}

function handleBackdropUpdate(context: MessageHandlerContext, update: ScreenUpdateMessage['data']): void {
  // Update backdrop color
  if (update.backdropColor !== undefined && context.backdropColor) {
    context.backdropColor.value = update.backdropColor
    logComposable.debug('Updated backdrop color:', update.backdropColor)
  }
}

function handleCgenUpdate(context: MessageHandlerContext, update: ScreenUpdateMessage['data']): void {
  // Update character generator mode
  if (update.cgenMode !== undefined) {
    if (context.cgenMode) {
      context.cgenMode.value = update.cgenMode
    }
    logComposable.debug('Updated character generator mode:', update.cgenMode)
  }
}

function handlePaletteCombinationUpdate(context: MessageHandlerContext, update: ScreenUpdateMessage['data']): void {
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
    // Invalidate last-rendered buffer so dirty renderer does a full redraw.
    // PALETB changes palette data without modifying the screen buffer,
    // so without this the dirty renderer would skip all cells (no buffer change detected).
    context.invalidateBackgroundBuffer?.()
    context.scheduleRender?.()
    logComposable.debug('Updated runtime palette combination:', {
      target: update.paletteTarget,
      paletteIndex: update.paletteIndex,
      combination: update.paletteCombination,
      colors: update.paletteColors,
    })
  }
}
