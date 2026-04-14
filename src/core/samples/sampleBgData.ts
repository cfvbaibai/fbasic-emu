 
/**
 * Sample BG Data for programs that use the VIEW command
 *
 * These are pre-designed BG graphics that pair with sample programs.
 * Each BG is a 28x21 grid of cells with character codes and color patterns.
 *
 * Grid data is split into two files by category:
 * - sampleBgDataSimple.ts — programmatic grid creators (IDE demo samples)
 * - sampleBgDataManual.ts — F-BASIC reference manual sample game grids (pages 94-101)
 */

import type { BgGridData } from '@/features/bg-editor/types'

import {
  createCardGrid,
  createKnightGrid,
  createRoute66Grid,
  createScrSampleGrid,
  createSuperMemoryGrid,
  createTurtleGrid,
  createTypeMasterGrid,
  createUfoGrid,
} from './sampleBgDataManual'
import {
  createDemoBorderGrid,
  createLayerBoxGrid,
  createPlatformLevelGrid,
  createTestPatternGrid,
  createTitleScreenGrid,
} from './sampleBgDataSimple'
import { createEmptyGrid } from './sampleBgDataSimple'

/**
 * Map of sample keys to their pre-designed BG data
 * Only samples that use VIEW need BG data
 * Keys must match the bgKey property in sample codes (index.ts)
 */
export const SAMPLE_BG_DATA: Record<string, BgGridData> = {
  // Main VIEW demo - border with center decoration
  bgView: createDemoBorderGrid(),

  // Title screen - decorative border
  titleScreen: createTitleScreenGrid(),

  // Platform game level - ground, platforms, coins
  platformGame: createPlatformLevelGrid(),

  // Test pattern for debugging
  testPattern: createTestPatternGrid(),

  // Layer visualization - box frame for printableArea sample
  layerBox: createLayerBoxGrid(),

  // ============================================================================
  // F-BASIC Reference Manual Sample Games (pages 94-101)
  // ============================================================================

  // KNIGHT - 8x8 chessboard with labels (page 94)
  knight: createKnightGrid(),

  // SUPER MEMORY - Four corner panels with center box (page 95)
  superMemory: createSuperMemoryGrid(),

  // UFO - Starry sky with mountain terrain (page 96)
  ufo: createUfoGrid(),

  // ROUTE 66 - Road with dashed center lines (page 97)
  route66: createRoute66Grid(),

  // TYPE MASTER - Text boxes and frames (page 98)
  typeMaster: createTypeMasterGrid(),

  // TURTLE - Racing track with lanes (page 99)
  turtle: createTurtleGrid(),

  // CARD - 6x6 card grid frame (page 100)
  card: createCardGrid(),

  // SCR$ Sample - Maze with flags and bricks (page 101)
  scrSample: createScrSampleGrid(),
}

/**
 * Get BG data for a sample key
 * Returns empty grid if no BG data is defined for the sample
 */
export function getSampleBgData(key: string): BgGridData {
  return SAMPLE_BG_DATA[key] ?? createEmptyGrid()
}

/**
 * Check if a sample has associated BG data
 */
export function hasSampleBgData(key: string): boolean {
  return key in SAMPLE_BG_DATA
}
