/**
 * Konva screen renderer - Main composable orchestrating all screen rendering
 * Manages Konva Stage, layers, and coordinates backdrop, background, and sprite rendering
 */

import Konva from 'konva'

import type { SharedDisplayBufferAccessor } from '@/core/animation/sharedDisplayBufferAccessor'
import type { SpriteState } from '@/core/sprite/types'
import type { ScreenCell } from '@/core/types/execution-types'
import { COLORS } from '@/shared/data/palette'
import { logScreen } from '@/shared/logger'

import {
  clearBackgroundTileCache,
} from './useCanvasBackgroundRenderer'
import {
  clearSpriteImageCache,
  createAnimatedSpriteKonvaImage,
  createStaticSpriteKonvaImage,
  updateAnimatedSpriteKonvaImage,
} from './useKonvaSpriteRenderer'

// F-Basic screen dimensions
const CANVAS_WIDTH = 256 // Sprite screen width
const CANVAS_HEIGHT = 240 // Sprite screen height

/**
 * Layer references for F-Basic screen model
 * Order (back to front): backdrop, sprite back, background, sprite front
 */
export interface KonvaScreenLayers {
  backdropLayer: Konva.Layer | null
  spriteBackLayer: Konva.Layer | null
  backgroundLayer: Konva.Layer | null
  spriteFrontLayer: Konva.Layer | null
}

/**
 * Initialize Konva layers for F-Basic screen model
 * Creates layers in correct order: backdrop, sprite back, background, sprite front
 */
export function initializeKonvaLayers(stage: Konva.Stage): KonvaScreenLayers {
  const layers: KonvaScreenLayers = {
    backdropLayer: null,
    spriteBackLayer: null,
    backgroundLayer: null,
    spriteFrontLayer: null,
  }

  // Layer 1: Backdrop layer (furthest back)
  // Note: This is typically managed by vue-konva template, but we can create programmatically if needed
  // For now, assume it exists from template

  // Layer 2: Sprite back layer (sprites with priority E=1, behind background)
  layers.spriteBackLayer = new Konva.Layer()
  stage.add(layers.spriteBackLayer)

  // Layer 3: Background layer (PRINT content, 28×24 characters)
  layers.backgroundLayer = new Konva.Layer()
  stage.add(layers.backgroundLayer)

  // Layer 4: Sprite front layer (sprites with priority E=0, in front of background)
  layers.spriteFrontLayer = new Konva.Layer()
  stage.add(layers.spriteFrontLayer)

  logScreen.debug('[initializeKonvaLayers] Created layers:', {
    stageChildren: stage.getChildren().length,
  })

  return layers
}

/**
 * Render backdrop layer (solid color)
 * This is typically handled by vue-konva template, but can be updated programmatically
 */
export function renderBackdropLayer(
  layer: Konva.Layer | null,
  backdropColor: number
): void {
  if (!layer) return

  // Clear existing content
  layer.destroyChildren()

  // Get color from COLORS array
  const color = COLORS[backdropColor] ?? COLORS[0] ?? '#000000'

  // Create rectangle for backdrop
  const rect = new Konva.Rect({
    x: 0,
    y: 0,
    width: CANVAS_WIDTH,
    height: CANVAS_HEIGHT,
    fill: color,
  })

  layer.add(rect)
  layer.batchDraw()
}

/**
 * Render background layer from screen buffer
 *
 * @deprecated Background rendering is now done via Canvas2D in Screen.vue for performance.
 * This function is kept for API compatibility but does nothing when layer is null (which it always is).
 * See useCanvasBackgroundRenderer.ts for the new Canvas2D implementation.
 */
export function renderBackgroundLayer(
  layer: Konva.Layer | null,
  _buffer: ScreenCell[][],
  _paletteCode: number,
  _shouldCache: boolean = true,
  _lastBuffer?: ScreenCell[][] | null,
  _nodeGridRef?: Map<string, Konva.Image>
): void {
  if (!layer) return // Background layer is always null - rendered via Canvas2D now
  // All code below this point is unreachable - layer is always null
}

/**
 * Render sprites on a sprite layer (back or front)
 * Returns a Map of actionNumber -> Konva.Image for animated sprites
 * Reads movement definitions from shared buffer (pure buffer read).
 */
export async function renderSpriteLayer(
  layer: Konva.Layer | null,
  spriteStates: SpriteState[],
  priority: number,
  spritePaletteCode: number,
  spriteEnabled: boolean,
  accessor: SharedDisplayBufferAccessor | null,
  spriteNodeMap?: Map<number, Konva.Image>
): Promise<Map<number, Konva.Image>> {
  const nodeMap = spriteNodeMap ?? new Map<number, Konva.Image>()

  if (!layer || !accessor) return nodeMap

  // Preserve existing node positions before destroying (to maintain position during re-render)
  const preservedPositions = new Map<number, { x: number; y: number }>()
  for (const [actionNumber, node] of nodeMap.entries()) {
    preservedPositions.set(actionNumber, { x: node.x(), y: node.y() })
  }

  // Clear existing sprites
  layer.destroyChildren()
  nodeMap.clear()

  // First, render static sprites (DEF SPRITE) - only if sprite display is enabled
  if (spriteEnabled) {
    const staticSprites = spriteStates.filter(
      s => s.visible && s.priority === priority && s.definition
    )

    for (const spriteState of staticSprites) {
      // Check if this sprite is moving (has active movement state)
      // Note: In Family BASIC, action numbers and sprite numbers are separate
      // Read isActive from shared buffer (Animation Worker is the source of truth)
      const actionNumber = spriteState.spriteNumber
      const isActive = accessor.readSpriteIsActive(actionNumber)

      if (!isActive) {
        // Render static sprite (DEF SPRITE) - only if not moving
        const konvaImage = await createStaticSpriteKonvaImage(spriteState, spritePaletteCode)
        if (konvaImage) {
          layer.add(konvaImage)
        }
      }
    }
  }

  // Second, render movements (DEF MOVE) - both active and stopped (CUT)
  // These work independently of SPRITE ON/OFF
  // Filter by priority AND visibility (isVisible from shared buffer)
  // State matrix: isActive=false, isVisible=false → not rendered (ERA/undefined)
  //              isActive=true, isVisible=true → rendered (moving)
  //              isActive=false, isVisible=true → rendered (CUT/stopped)
  const movementsToRender: number[] = []

  for (let actionNumber = 0; actionNumber < 8; actionNumber++) {
    // Check if slot has DEF MOVE (characterType >= 0)
    const characterType = accessor.readSpriteCharacterType(actionNumber)
    if (characterType < 0) continue

    const slotPriority = accessor.readSpritePriority(actionNumber)
    if (slotPriority !== priority) continue

    // Check isVisible flag from shared buffer (AnimationWorker controls visibility)
    const isVisible = accessor.readSpriteIsVisible(actionNumber)
    if (!isVisible) continue

    movementsToRender.push(actionNumber)
  }

  logScreen.debug('[renderSpriteLayer] Rendering', {
    priority,
    movementsToRender: movementsToRender.length,
    actions: movementsToRender,
  })

  for (const actionNumber of movementsToRender) {
    // Render animated sprite (DEF MOVE) - both active and stopped movements
    const konvaImage = await createAnimatedSpriteKonvaImage(actionNumber, spritePaletteCode, accessor)
    logScreen.debug('[renderSpriteLayer] After createAnimatedSpriteKonvaImage:', {
      action: actionNumber,
      hasImage: !!konvaImage,
      x: konvaImage?.x() ?? 'null',
      y: konvaImage?.y() ?? 'null',
    })
    if (konvaImage) {
      // Restore preserved position if available (maintains position during re-render)
      const preservedPos = preservedPositions.get(actionNumber)
      if (preservedPos) {
        konvaImage.x(preservedPos.x)
        konvaImage.y(preservedPos.y)
      }
      layer.add(konvaImage)
      nodeMap.set(actionNumber, konvaImage)
    }
  }

  logScreen.debug(
    '[renderSpriteLayer] Before layer.batchDraw(), nodeMap size:',
    nodeMap.size,
    'layer children:',
    layer.getChildren().length
  )
  // Draw the layer using batchDraw() for better performance with multiple sprite updates
  layer.batchDraw()

  return nodeMap
}

/**
 * Update sprite positions and frames for animated sprites
 * Called each frame during animation loop
 * Handles visibility changes (CUT/ERA) via isVisible flag
 * Reads movement definitions from shared buffer (pure buffer read)
 */
export async function updateAnimatedSprites(
  spriteFrontLayer: Konva.Layer | null,
  spriteBackLayer: Konva.Layer | null,
  spritePaletteCode: number,
  frontSpriteNodes: Map<number, Konva.Image>,
  backSpriteNodes: Map<number, Konva.Image>,
  accessor?: SharedDisplayBufferAccessor | null
): Promise<void> {
  if (!accessor) return

  // Update sprites on front layer (priority E=0)
  // Include both active and stopped movements (stopped movements need position updates)
  for (let actionNumber = 0; actionNumber < 8; actionNumber++) {
    const characterType = accessor.readSpriteCharacterType(actionNumber)
    // Skip if no DEF MOVE (characterType = -1 means uninitialized)
    if (characterType < 0) continue

    const priority = accessor.readSpritePriority(actionNumber)
    if (priority !== 0) continue // Skip non-front sprites

    const spriteNode = frontSpriteNodes.get(actionNumber)
    if (!spriteNode) continue

    // Check isVisible flag from shared buffer
    const isVisible = accessor.readSpriteIsVisible(actionNumber)

    if (isVisible) {
      spriteNode.visible(true)
      // Update frame for visible sprites (position is updated by animation loop)
      await updateAnimatedSpriteKonvaImage(actionNumber, spriteNode, spritePaletteCode, accessor)
    } else {
      // Hide sprite when isVisible=false (ERA or not yet moved)
      spriteNode.visible(false)
    }
  }

  // Update sprites on back layer (priority E=1)
  // Include both active and stopped movements
  for (let actionNumber = 0; actionNumber < 8; actionNumber++) {
    const characterType = accessor.readSpriteCharacterType(actionNumber)
    // Skip if no DEF MOVE (characterType = -1 means uninitialized)
    if (characterType < 0) continue

    const priority = accessor.readSpritePriority(actionNumber)
    if (priority !== 1) continue // Skip non-back sprites

    const spriteNode = backSpriteNodes.get(actionNumber)
    if (!spriteNode) continue

    // Check isVisible flag from shared buffer
    const isVisible = accessor.readSpriteIsVisible(actionNumber)

    if (isVisible) {
      spriteNode.visible(true)
      // Update frame for visible sprites
      await updateAnimatedSpriteKonvaImage(actionNumber, spriteNode, spritePaletteCode, accessor)
    } else {
      // Hide sprite when isVisible=false (ERA or not yet moved)
      spriteNode.visible(false)
    }
  }

  // Redraw layers if they have sprites (active or stopped)
  // Use batchDraw() for better performance with multiple sprite updates
  if (spriteFrontLayer && frontSpriteNodes.size > 0) {
    spriteFrontLayer.batchDraw()
  }
  if (spriteBackLayer && backSpriteNodes.size > 0) {
    spriteBackLayer.batchDraw()
  }
}

/**
 * Clear all caches
 */
export function clearAllCaches(): void {
  clearSpriteImageCache()
  clearBackgroundTileCache()
}

export interface RenderAllScreenLayersOptions {
  /** When true, only update backdrop and background; do not rebuild sprite layers */
  backgroundOnly?: boolean
  /** Last rendered buffer for context (background is now Canvas2D, this is kept for API compatibility) */
  lastBackgroundBuffer?: ScreenCell[][] | null
}

/**
 * Main function to render all screen layers
 * Coordinates backdrop, background, and sprite rendering
 * Returns sprite node maps for animated sprite updates
 */
export async function renderAllScreenLayers(
  layers: KonvaScreenLayers,
  buffer: ScreenCell[][],
  spriteStates: SpriteState[],
  bgPaletteCode: number,
  spritePaletteCode: number,
  backdropColor: number,
  spriteEnabled: boolean,
  accessor: SharedDisplayBufferAccessor | null,
  _backgroundShouldCache: boolean = true,
  frontSpriteNodes?: Map<number, Konva.Image>,
  backSpriteNodes?: Map<number, Konva.Image>,
  options?: RenderAllScreenLayersOptions
): Promise<{
  frontSpriteNodes: Map<number, Konva.Image>
  backSpriteNodes: Map<number, Konva.Image>
}> {
  const backgroundOnly = options?.backgroundOnly ?? false
  // lastBackgroundBuffer kept for API compatibility (background is now Canvas2D)

  // 1. Render backdrop layer (if layer exists, otherwise handled by template)
  if (layers.backdropLayer) {
    renderBackdropLayer(layers.backdropLayer, backdropColor)
  }

  if (backgroundOnly) {
    // Buffer-only update (e.g. PRINT): only background (and backdrop); do not rebuild sprite layers
    // Note: Background layer is now rendered via Canvas2D in Screen.vue for performance
    // (10x faster than Konva for static text grid)
    return {
      frontSpriteNodes: frontSpriteNodes ?? new Map(),
      backSpriteNodes: backSpriteNodes ?? new Map(),
    }
  }

  // 2. Render back sprites (priority E=1)
  const backNodes = await renderSpriteLayer(
    layers.spriteBackLayer,
    spriteStates,
    1,
    spritePaletteCode,
    spriteEnabled,
    accessor,
    backSpriteNodes
  )

  // 3. Background layer is now rendered via Canvas2D in Screen.vue for performance
  // (10x faster than Konva for static text grid)

  // 4. Render front sprites (priority E=0)
  const frontNodes = await renderSpriteLayer(
    layers.spriteFrontLayer,
    spriteStates,
    0,
    spritePaletteCode,
    spriteEnabled,
    accessor,
    frontSpriteNodes
  )

  return {
    frontSpriteNodes: frontNodes,
    backSpriteNodes: backNodes,
  }
}
