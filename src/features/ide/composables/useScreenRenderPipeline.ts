/**
 * useScreenRenderPipeline composable
 *
 * Manages the Konva render lifecycle for the Screen component.
 * Owns: Konva initialization, render function, dirty buffer tracking,
 * watcher setup, render scheduling, animation loop integration, and cleanup.
 *
 * This is the core rendering responsibility of Screen.vue -- the component
 * itself should be thin: template + composable wiring.
 */

import Konva from 'konva'
import { computed, onDeactivated, onUnmounted, type Ref, ref, type ShallowRef, shallowRef, watch } from 'vue'

import type { ScreenCell } from '@/core/types/execution-types'
import { logScreen } from '@/shared/logger'
import type { VueKonvaStageInstance } from '@/types/vue-konva'

import { useAnimationWorker } from './useAnimationWorker'
import { preInitializeBackgroundTiles, renderBackgroundToCanvas, renderBackgroundToCanvasDirty } from './useCanvasBackgroundRenderer'
import { initializeKonvaLayers, type KonvaScreenLayers, renderAllScreenLayers } from './useKonvaScreenRenderer'
import { useScreenAnimationLoopRenderOnly } from './useScreenAnimationLoopRenderOnly'
import type { ScreenContextValue } from './useScreenContext'
import { useScreenZoom } from './useScreenZoom'

// Base screen dimensions (full backdrop/sprite screen: 256x240)
const BASE_WIDTH = 256
const BASE_HEIGHT = 240

/** Deep copy of screen buffer for dirty diff (last rendered state) */
function deepCopyBuffer(buf: ScreenCell[][]): ScreenCell[][] {
  return buf.map(row => row.map(c => ({ ...c })))
}

// Render reason: bufferOnly = only screenBuffer changed (PRINT); full = sprite/palette/backdrop/etc
type RenderReason = 'full' | 'bufferOnly'

export interface ScreenRenderPipelineOptions {
  /** Screen context (provided by IdePage) */
  ctx: ScreenContextValue
  /** Template ref to the Konva stage element */
  stageRef: ShallowRef<VueKonvaStageInstance | null>
  /** Computed palette code from context */
  paletteCode: Ref<number>
}

export interface ScreenRenderPipelineResult {
  /** Computed stage display width based on zoom */
  stageDisplayWidth: Readonly<Ref<number>>
  /** Computed stage display height based on zoom */
  stageDisplayHeight: Readonly<Ref<number>>
  /** Base screen width constant */
  baseWidth: number
  /** Base screen height constant */
  baseHeight: number
}

/**
 * Setup the complete screen render pipeline.
 *
 * Initializes Konva, sets up watchers for reactive state changes,
 * manages render scheduling (immediate vs deferred to animation frame),
 * and integrates with the animation loop for sprite updates.
 */
export function useScreenRenderPipeline(options: ScreenRenderPipelineOptions): ScreenRenderPipelineResult {
  const { ctx, stageRef, paletteCode } = options

  // Offscreen Canvas2D for background rendering (much faster than Konva for text)
  // Rendered to Konva.Image to participate in layer stacking
  const backgroundCanvas = document.createElement('canvas')
  backgroundCanvas.width = BASE_WIDTH
  backgroundCanvas.height = BASE_HEIGHT

  // Konva layers (background populated from offscreen Canvas2D for performance)
  const layers = shallowRef<KonvaScreenLayers>({
    backdropLayer: null,
    spriteBackLayer: null,
    backgroundLayer: null,
    spriteFrontLayer: null,
  })

  // Sprite node maps for animated sprite updates
  const frontSpriteNodes = shallowRef<Map<number, Konva.Image>>(new Map())
  const backSpriteNodes = shallowRef<Map<number, Konva.Image>>(new Map())

  // Last rendered buffer for dirty diff (Canvas2D rendering)
  const lastBackgroundBufferRef = shallowRef<ScreenCell[][] | null>(null)

  // Last backdrop color used for canvas rendering (to detect backdrop changes for dirty render)
  const lastBackdropColorRef = ref<number | null>(null)

  // Shared buffer path: last sequence and last decoded buffer (so we only decode when sequence changes)
  const lastSequenceRef = ref(-1)
  const lastDecodedBufferRef = shallowRef<ScreenCell[][] | null>(null)

  // Render scheduling state
  const pendingRenderReasonRef = ref<RenderReason>('full')
  const pendingStaticRenderRef = ref(false)
  let renderInProgress = false

  /**
   * Initialize Konva Stage and layers
   */
  async function initializeKonva(): Promise<void> {
    if (!stageRef.value) return

    const stageNode = stageRef.value?.getNode() ?? stageRef.value?.getStage?.() ?? null
    if (!stageNode) {
      logScreen.error('Failed to get Konva stage node')
      return
    }

    // Pre-initialize background tile images in the background (non-blocking)
    void preInitializeBackgroundTiles().catch(err => {
      logScreen.warn('Background tile pre-initialization failed:', err)
    })

    // Initialize layers (backdrop is managed by vue-konva template)
    layers.value = initializeKonvaLayers(stageNode)
    layers.value.backdropLayer = null

    // Initial render
    scheduleRender()
  }

  /**
   * Render all screen layers using Konva
   */
  async function render(): Promise<void> {
    if (!stageRef.value || renderInProgress) return

    renderInProgress = true
    try {
      // Shared buffer path: read sequence; if changed (or first run), decode and update parent refs
      const accessor = ctx.sharedDisplayBufferAccessor
      let bufferToRender: ScreenCell[][] = ctx.screenBuffer.value ?? []
      if (accessor) {
        const seq = accessor.readSequence()
        if (seq !== lastSequenceRef.value || lastDecodedBufferRef.value === null) {
          const decoded = accessor.readScreenState()
          ctx.setDecodedScreenState(decoded)
          lastSequenceRef.value = seq
          lastDecodedBufferRef.value = decoded.buffer
        }
        bufferToRender = lastDecodedBufferRef.value ?? (ctx.screenBuffer.value ?? [])
      }

      // Render background using Canvas2D to offscreen canvas
      const lastBuffer = lastBackgroundBufferRef.value
      const currentBackdropColor = ctx.backdropColor.value ?? 0
      if (lastBuffer && pendingRenderReasonRef.value === 'bufferOnly') {
        renderBackgroundToCanvasDirty(
          backgroundCanvas,
          bufferToRender,
          lastBuffer,
          paletteCode.value,
          currentBackdropColor,
          lastBackdropColorRef.value
        )
      } else {
        renderBackgroundToCanvas(backgroundCanvas, bufferToRender, paletteCode.value, currentBackdropColor)
      }
      lastBackdropColorRef.value = currentBackdropColor

      // Create/update Konva.Image from Canvas2D content
      if (layers.value.backgroundLayer) {
        layers.value.backgroundLayer.destroyChildren()

        const backgroundImage = new Konva.Image({
          x: 0,
          y: 0,
          image: backgroundCanvas,
          listening: false,
        })

        layers.value.backgroundLayer.add(backgroundImage)
        layers.value.backgroundLayer.batchDraw()
      }

      // Render sprites using Konva
      const layersToRender: KonvaScreenLayers = {
        backdropLayer: null,
        spriteBackLayer: layers.value.spriteBackLayer,
        backgroundLayer: layers.value.backgroundLayer,
        spriteFrontLayer: layers.value.spriteFrontLayer,
      }

      const movementsFromBuffer = ctx.sharedDisplayBufferAccessor?.readAllMovementStates() ?? []
      const movementCount = movementsFromBuffer.length
      const spriteNodeCount = frontSpriteNodes.value.size + backSpriteNodes.value.size
      const needSpriteBuild =
        movementCount > 0 && (spriteNodeCount === 0 || spriteNodeCount < movementCount)
      const needSpriteClear =
        movementCount === 0 && spriteNodeCount > 0
      const backgroundOnly =
        !needSpriteBuild &&
        !needSpriteClear &&
        pendingRenderReasonRef.value === 'bufferOnly'

      if (needSpriteBuild || needSpriteClear || !backgroundOnly) {
        const movementsDebug = movementsFromBuffer.map(m => ({
          actionNumber: m.actionNumber,
          characterType: m.definition.characterType,
        }))
        logScreen.debug('render', {
          movementCount,
          spriteNodeCount,
          needSpriteBuild,
          needSpriteClear,
          backgroundOnly,
          reason: pendingRenderReasonRef.value,
          movementsFromBuffer: movementsDebug,
        })
      }

      const lastBackgroundBuffer = lastBackgroundBufferRef.value
      const { frontSpriteNodes: frontNodes, backSpriteNodes: backNodes } =
        await renderAllScreenLayers(
          layersToRender,
          bufferToRender,
          ctx.spriteStates.value ?? [],
          paletteCode.value,
          ctx.spritePalette.value ?? 1,
          ctx.backdropColor.value ?? 0,
          ctx.spriteEnabled.value ?? false,
          ctx.sharedDisplayBufferAccessor,
          true,
          frontSpriteNodes.value,
          backSpriteNodes.value,
          {
            backgroundOnly,
            lastBackgroundBuffer,
          }
        )

      // After background render, store buffer for next dirty diff
      lastBackgroundBufferRef.value = deepCopyBuffer(bufferToRender)

      if (!backgroundOnly) {
        frontSpriteNodes.value = frontNodes
        backSpriteNodes.value = backNodes
        const extFront = ctx.externalFrontSpriteNodes.value
        if (extFront) {
          extFront.clear()
          for (const [key, value] of frontNodes.entries()) {
            extFront.set(key, value)
          }
        }
        const extBack = ctx.externalBackSpriteNodes.value
        if (extBack) {
          extBack.clear()
          for (const [key, value] of backNodes.entries()) {
            extBack.set(key, value)
          }
        }
      }
    } catch (error) {
      logScreen.error('Error rendering screen layers:', error)
    } finally {
      renderInProgress = false
    }
  }

  // Sprite state fingerprint for efficient change detection
  const spriteStateFingerprint = computed(() => {
    const states = ctx.spriteStates.value
    if (!states || states.length === 0) return ''
    return states.map(s => `${s.spriteNumber}:${s.x},${s.y},${s.visible ? '1' : '0'},${s.priority}`).join('|')
  })

  // Use shared zoom state composable for stage display dimensions
  const { zoomLevel } = useScreenZoom()

  // Computed stage display dimensions based on zoom (for CSS scaling)
  const stageDisplayWidth = computed(() => BASE_WIDTH * zoomLevel.value)
  const stageDisplayHeight = computed(() => BASE_HEIGHT * zoomLevel.value)

  // Watch paletteCode, backdropColor, spritePalette, sprite states, and sprite enabled to trigger re-render
  watch(
    [
      paletteCode,
      () => ctx.backdropColor.value,
      () => ctx.spritePalette.value,
      spriteStateFingerprint,
      () => ctx.spriteEnabled.value,
      zoomLevel,
    ],
    () => {
      pendingRenderReasonRef.value = 'full'
      scheduleRender()
    }
  )

  // Render queue: when animation is active, sets pending static render so animation loop runs render at end of frame
  function scheduleRender() {
    const hasActiveMovements = (() => {
      if (!ctx.sharedDisplayBufferAccessor) return false
      for (let actionNumber = 0; actionNumber < 8; actionNumber++) {
        if (ctx.sharedDisplayBufferAccessor.readSpriteIsActive(actionNumber)) {
          return true
        }
      }
      return false
    })()

    if (hasActiveMovements) {
      pendingStaticRenderRef.value = true
    } else {
      void render()
    }
  }

  // Register scheduleRender with parent so SCREEN_CHANGED can trigger a redraw
  watch(
    () => ctx.registerCallbacks.registerScheduleRender,
    fn => {
      if (fn) fn(scheduleRender)
    },
    { immediate: true }
  )

  // Register buffer invalidation callback for palette changes (PALETB etc.)
  watch(
    () => ctx.registerCallbacks.registerInvalidateBackgroundBuffer,
    fn => {
      if (fn) fn(() => {
        lastBackgroundBufferRef.value = null
        lastBackdropColorRef.value = null
      })
    },
    { immediate: true }
  )

  // Watch screenBuffer and render when it changes (PRINT)
  watch(
    () => ctx.screenBuffer.value,
    () => {
      const movementCount = ctx.movementStates?.value?.length ?? 0
      const spriteNodeCount = frontSpriteNodes.value.size + backSpriteNodes.value.size
      const useFull = movementCount > spriteNodeCount
      if (useFull) {
        logScreen.debug(
          'screenBuffer watch → full',
          'movementCount=',
          movementCount,
          'spriteNodeCount=',
          spriteNodeCount
        )
      }
      pendingRenderReasonRef.value = useFull ? 'full' : 'bufferOnly'
      scheduleRender()
    },
    { immediate: true, deep: true, flush: 'post' }
  )

  // Initialize Animation Worker (single writer to shared buffer)
  const { initialize: initializeAnimationWorker, terminate: terminateAnimationWorker } =
    useAnimationWorker({
      sharedAnimationBuffer: computed(() => ctx.sharedAnimationBuffer.value ?? null),
      onReady: () => {
        logScreen.debug('[Screen] Animation Worker ready')
      },
      onError: (error) => {
        logScreen.error('[Screen] Animation Worker error:', error)
      },
    })

  // Initial render when stage becomes available
  watch(
    stageRef,
    async stage => {
      if (stage) {
        await initializeKonva()
        await initializeAnimationWorker()
      }
    },
    { immediate: true }
  )

  // Setup render-only animation loop
  const stopAnimationLoop = useScreenAnimationLoopRenderOnly({
    layers,
    frontSpriteNodes,
    backSpriteNodes,
    spritePalette: computed(() => ctx.spritePalette.value ?? 1),
    sharedDisplayBufferAccessor: ctx.sharedDisplayBufferAccessor,
    setMovementPositionsFromBuffer: (positions) => {
      ctx.movementPositionsFromBuffer.value = positions
    },
    updateInspectorMoveSlots: ctx.updateInspectorMoveSlots,
    getPendingStaticRender: () => pendingStaticRenderRef.value,
    onRunPendingStaticRender: async () => {
      await render()
      pendingStaticRenderRef.value = false
    },
    onRenderNeeded: () => {
      pendingRenderReasonRef.value = 'full'
      scheduleRender()
    },
  })

  // Stop animation loop and cancel pending renders
  function cleanupScreen() {
    stopAnimationLoop()
    terminateAnimationWorker()
  }
  onUnmounted(cleanupScreen)
  onDeactivated(cleanupScreen)

  return {
    stageDisplayWidth,
    stageDisplayHeight,
    baseWidth: BASE_WIDTH,
    baseHeight: BASE_HEIGHT,
  }
}
