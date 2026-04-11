<script setup lang="ts">
import Konva from 'konva'
import { computed, onDeactivated, onUnmounted, ref, shallowRef, useTemplateRef, watch } from 'vue'

import type { ScreenCell } from '@/core/types/execution-types'
import { useAnimationWorker } from '@/features/ide/composables/useAnimationWorker'
import { preInitializeBackgroundTiles, renderBackgroundToCanvas, renderBackgroundToCanvasDirty } from '@/features/ide/composables/useCanvasBackgroundRenderer'
import { initializeKonvaLayers, type KonvaScreenLayers, renderAllScreenLayers } from '@/features/ide/composables/useKonvaScreenRenderer'
import { useScreenAnimationLoopRenderOnly } from '@/features/ide/composables/useScreenAnimationLoopRenderOnly'
import { useScreenContext } from '@/features/ide/composables/useScreenContext'
import { useScreenDebug } from '@/features/ide/composables/useScreenDebug'
import { useScreenZoom } from '@/features/ide/composables/useScreenZoom'
import { COLORS } from '@/shared/data/palette'
import { logScreen } from '@/shared/logger'
import type { VueKonvaStageInstance } from '@/types/vue-konva'

import DebugGridOverlay from './DebugGridOverlay.vue'

/**
 * Screen - CRT-style display for F-BASIC: backdrop, character grid, sprites.
 * Reads state from useScreenContext; runs Konva render loop and animation loop.
 */
defineOptions({
  name: 'Screen',
})

// Screen data from context (provided by IdePage); no props
const ctx = useScreenContext()

/** Deep copy of screen buffer for dirty diff (last rendered state) */
function deepCopyBuffer(buf: ScreenCell[][]): ScreenCell[][] {
  return buf.map(row => row.map(c => ({ ...c })))
}

// Konva Stage reference
const stageRef = useTemplateRef<VueKonvaStageInstance>('stageRef')

// Use bgPalette from context
const paletteCode = computed(() => ctx.bgPalette.value ?? 1)

// Computed backdrop color hex
const backdropColorHex = computed(() => {
  const colorCode = ctx.backdropColor.value ?? 0
  return COLORS[colorCode] ?? COLORS[0] ?? '#000000'
})

// Use shared zoom state composable
const { zoomLevel } = useScreenZoom()

// Use debug settings composable
const { showGrid } = useScreenDebug()

// Base screen dimensions (full backdrop/sprite screen: 256×240)
const BASE_WIDTH = 256
const BASE_HEIGHT = 240

// Offscreen Canvas2D for background rendering (much faster than Konva for text)
// Rendered to Konva.Image to participate in layer stacking
const backgroundCanvas = document.createElement('canvas')
backgroundCanvas.width = BASE_WIDTH
backgroundCanvas.height = BASE_HEIGHT

// Computed stage display dimensions based on zoom (for CSS scaling)
const stageDisplayWidth = computed(() => BASE_WIDTH * zoomLevel.value)
const stageDisplayHeight = computed(() => BASE_HEIGHT * zoomLevel.value)

// Konva layers (background populated from offscreen Canvas2D for performance)
// Use shallowRef since the layers object is replaced, not mutated
const layers = shallowRef<KonvaScreenLayers>({
  backdropLayer: null,
  spriteBackLayer: null,
  backgroundLayer: null, // Populated with Konva.Image from offscreen Canvas2D
  spriteFrontLayer: null,
})

// Sprite node maps for animated sprite updates
// Use shallowRef since the Map objects are replaced, not mutated
const frontSpriteNodes = shallowRef<Map<number, Konva.Image>>(new Map())
const backSpriteNodes = shallowRef<Map<number, Konva.Image>>(new Map())

// Last rendered buffer for dirty diff (Canvas2D rendering)
// Use shallowRef since the buffer array is replaced, not mutated
const lastBackgroundBufferRef = shallowRef<ScreenCell[][] | null>(null)

// Last backdrop color used for canvas rendering (to detect backdrop changes for dirty render)
const lastBackdropColorRef = ref<number | null>(null)

// Shared buffer path: last sequence and last decoded buffer (so we only decode when sequence changes)
// Use shallowRef since the buffer array is replaced, not mutated
const lastSequenceRef = ref(-1)
const lastDecodedBufferRef = shallowRef<ScreenCell[][] | null>(null)

// Render reason: bufferOnly = only screenBuffer changed (PRINT); full = sprite/palette/backdrop/etc
type RenderReason = 'full' | 'bufferOnly'
const pendingRenderReasonRef = ref<RenderReason>('full')

// When animation is active: static render is deferred to end of frame (animation first)
const pendingStaticRenderRef = ref(false)

// Track if a render is in progress to prevent overlapping renders
let renderInProgress = false

/**
 * Initialize Konva Stage and layers
 */
async function initializeKonva(): Promise<void> {
  if (!stageRef.value) return

  // Get the Konva stage node from vue-konva ref
  const stageNode = stageRef.value?.getNode() ?? stageRef.value?.getStage?.() ?? null
  if (!stageNode) {
    logScreen.error('Failed to get Konva stage node')
    return
  }

  // Pre-initialize background tile images in the background (non-blocking)
  // This ensures all tile images are ready before rendering
  // Start immediately but don't wait - images will be created on-demand if not ready
  void preInitializeBackgroundTiles().catch(err => {
    logScreen.warn('Background tile pre-initialization failed:', err)
  })

  // Initialize layers (backdrop is managed by vue-konva template, so we don't need to access it)
  layers.value = initializeKonvaLayers(stageNode)
  // Backdrop layer is managed by template, so we leave it as null
  layers.value.backdropLayer = null

  // Initial render
  await scheduleRender()
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

    // Render background using Canvas2D to offscreen canvas (much faster than Konva for text grid)
    const lastBuffer = lastBackgroundBufferRef.value
    const currentBackdropColor = ctx.backdropColor.value ?? 0
    if (lastBuffer && pendingRenderReasonRef.value === 'bufferOnly') {
      // Dirty render: only changed cells (falls back to full if backdrop changed)
      renderBackgroundToCanvasDirty(
        backgroundCanvas,
        bufferToRender,
        lastBuffer,
        paletteCode.value,
        currentBackdropColor,
        lastBackdropColorRef.value
      )
    } else {
      // Full render
      renderBackgroundToCanvas(backgroundCanvas, bufferToRender, paletteCode.value, currentBackdropColor)
    }
    lastBackdropColorRef.value = currentBackdropColor

    // Create/update Konva.Image from Canvas2D content to participate in layer stacking
    if (layers.value.backgroundLayer) {
      // Clear existing background
      layers.value.backgroundLayer.destroyChildren()

      // Create Konva.Image from offscreen canvas
      const backgroundImage = new Konva.Image({
        x: 0,
        y: 0,
        image: backgroundCanvas,
        listening: false, // Don't need events on background
      })

      layers.value.backgroundLayer.add(backgroundImage)
      layers.value.backgroundLayer.batchDraw()
    }

    // Render sprites using Konva
    const layersToRender: KonvaScreenLayers = {
      backdropLayer: null, // Backdrop is managed by vue-konva template
      spriteBackLayer: layers.value.spriteBackLayer as Konva.Layer | null,
      backgroundLayer: layers.value.backgroundLayer as Konva.Layer | null, // Now populated from Canvas2D
      spriteFrontLayer: layers.value.spriteFrontLayer as Konva.Layer | null,
    }

    // Read movement states from shared buffer (DEF MOVE definitions are stored there)
    // This is the source of truth for which sprites should be rendered
    const movementsFromBuffer = ctx.sharedDisplayBufferAccessor?.readAllMovementStates() ?? []
    const movementCount = movementsFromBuffer.length
    const spriteNodeCount = frontSpriteNodes.value.size + backSpriteNodes.value.size
    const needSpriteBuild =
      movementCount > 0 && (spriteNodeCount === 0 || spriteNodeCount < movementCount)
    // When Clear: 0 movements, nodes still exist — must run sprite layers to clear Konva nodes
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

    // Pass lastBackgroundBuffer for sprite rendering context (background uses Canvas2D now)
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
        frontSpriteNodes.value as Map<number, Konva.Image>,
        backSpriteNodes.value as Map<number, Konva.Image>,
        {
          backgroundOnly,
          lastBackgroundBuffer,
        }
      )

    // After background render, store buffer for next dirty diff
    lastBackgroundBufferRef.value = deepCopyBuffer(bufferToRender)

    if (!backgroundOnly) {
      frontSpriteNodes.value = frontNodes as Map<number, Konva.Image>
      backSpriteNodes.value = backNodes as Map<number, Konva.Image>
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

// Pure Buffer Read: movement states are read directly from shared buffer (DEF MOVE definitions are stored there)
// When new MOVE commands are added, Animation Worker writes to buffer, triggering watcher below

// Watch paletteCode, backdropColor, spritePalette, sprite states, and sprite enabled to trigger re-render
// These are STATIC rendering changes (CGSET, COLOR, SPRITE, etc.) - render immediately
// Combined watcher for better performance (Vue 3 best practice)
// Use computed to extract sprite state fingerprint for efficient change detection
const spriteStateFingerprint = computed(() => {
  const states = ctx.spriteStates.value
  if (!states || states.length === 0) return ''
  return states.map(s => `${s.spriteNumber}:${s.x},${s.y},${s.visible ? '1' : '0'},${s.priority}`).join('|')
})

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
  // Check if there are active movements - Pure Buffer Read
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
    // Animation is active, set pending flag
    pendingStaticRenderRef.value = true
  } else {
    // No active animation, render immediately
    render()
  }
}

function cleanupRenderQueue() {
  // No-op - pendingStaticRenderRef will be cleared on unmount
}

// Register scheduleRender with parent so SCREEN_CHANGED can trigger a redraw (shared buffer path)
watch(
  () => ctx.registerCallbacks.registerScheduleRender,
  fn => {
    if (fn) fn(scheduleRender)
  },
  { immediate: true }
)

// Register buffer invalidation callback for palette changes (PALETB etc.)
// Nullifying lastBackgroundBufferRef forces the dirty renderer to do a full redraw
// since renderBackgroundToCanvasDirty falls back to full render when lastBuffer is null.
// Also nullify lastBackdropColorRef so backdrop fill is always applied on invalidation.
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

// Watch screenBuffer and render when it changes (PRINT). Use full when movements > nodes.
// When using shared buffer, SCREEN_CHANGED triggers scheduleRender; this watch still runs for ref updates.
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

// Backdrop is managed by vue-konva template via backdropColorHex computed property

// Initialize Animation Worker (single writer to shared buffer)
const animationWorkerResult = useAnimationWorker({
  sharedAnimationBuffer: computed(() => ctx.sharedAnimationBuffer.value ?? null),
  onReady: () => {
    logScreen.debug('[Screen] Animation Worker ready')
    // Animation Worker is now ready - it polls the shared buffer for commands
  },
  onError: (error) => {
    logScreen.error('[Screen] Animation Worker error:', error)
  },
})

const {
  initialize: initializeAnimationWorker,
  terminate: terminateAnimationWorker,
} = animationWorkerResult

// Initial render when stage becomes available
watch(
  stageRef,
  async stage => {
    if (stage) {
      await initializeKonva()
      // Initialize Animation Worker when stage is ready
      await initializeAnimationWorker()
    }
  },
  { immediate: true }
)

// Setup render-only animation loop - READS from shared buffer (Animation Worker is the single writer)
// Runs continuously at 60fps, detecting missing sprite nodes and triggering render as needed
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

// Stop animation loop and cancel pending renders (unmount and keep-alive deactivation)
function cleanupScreen() {
  stopAnimationLoop()
  cleanupRenderQueue()
  terminateAnimationWorker()
}
onUnmounted(cleanupScreen)
onDeactivated(cleanupScreen)
</script>

<template>
  <div class="screen-display">
    <div class="crt-bezel">
      <div class="crt-screen">
        <div class="crt-scanlines"></div>
        <div
          class="screen-stage-wrapper"
          data-testid="ide-screen-stage"
          :style="{
            width: `${stageDisplayWidth}px`,
            height: `${stageDisplayHeight}px`,
          }"
        >
          <v-stage
            ref="stageRef"
            class="screen-stage"
            :config="{
              width: BASE_WIDTH,
              height: BASE_HEIGHT,
            }"
            :style="{
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'top left',
            }"
          >
          <v-layer>
            <!-- Backdrop Screen (F-Basic layer 1: furthest back) -->
            <!-- 32×30 characters = 256×240 pixels -->
            <v-rect
              :config="{
                x: 0,
                y: 0,
                width: BASE_WIDTH,
                height: BASE_HEIGHT,
                fill: backdropColorHex,
              }"
            />
            <!-- Sprite layers (sprite back, sprite front) will be added programmatically -->
            <!-- Background layer is now Canvas2D for performance (10-50x faster than Konva) -->
          </v-layer>
          </v-stage>
          <!-- Debug Grid Overlay -->
          <DebugGridOverlay v-if="showGrid" :zoom="zoomLevel" />
        </div>
        <div class="crt-reflection"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('@/shared/styles/screen-crt.css');
</style>
