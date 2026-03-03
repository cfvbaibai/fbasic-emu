<script setup lang="ts">
/**
 * DebugGridOverlay - Shows F-BASIC screen layout boundaries for debugging
 *
 * Displays:
 * - Cyan border: Background Screen boundary (28×24)
 * - Yellow border: BG GRAPHIC boundary (28×21)
 * - Magenta dashed lines: Margin indicators
 * - White grid: Character cell grid
 */
import { computed } from 'vue'

defineOptions({
  name: 'DebugGridOverlay',
})

const props = defineProps<{
  zoom: number
}>()

// F-BASIC screen layout constants
const CELL_SIZE = 8
const BG_OFFSET_X = 16 // 2 columns (16 pixels)
const BG_OFFSET_Y = 24 // 3 rows (24 pixels)
const BG_COLS = 28
const BG_ROWS = 24 // Background Screen (full)
const BG_GRAPHIC_ROWS = 21 // BG GRAPHIC (smaller)

// Computed styles for dynamic zoom
const overlayStyle = computed(() => ({
  position: 'absolute' as const,
  top: 0,
  left: 0,
  width: `${256 * props.zoom}px`,
  height: `${240 * props.zoom}px`,
  pointerEvents: 'none',
  zIndex: 10,
}))

const bgScreenStyle = computed(() => ({
  position: 'absolute' as const,
  left: `${BG_OFFSET_X * props.zoom}px`,
  top: `${BG_OFFSET_Y * props.zoom}px`,
  width: `${BG_COLS * CELL_SIZE * props.zoom}px`,
  height: `${BG_ROWS * CELL_SIZE * props.zoom}px`,
  border: '2px solid var(--debug-color-cyan)',
  boxSizing: 'border-box' as const,
}))

const bgGraphicStyle = computed(() => ({
  position: 'absolute' as const,
  left: `${BG_OFFSET_X * props.zoom}px`,
  top: `${BG_OFFSET_Y * props.zoom}px`,
  width: `${BG_COLS * CELL_SIZE * props.zoom}px`,
  height: `${BG_GRAPHIC_ROWS * CELL_SIZE * props.zoom}px`,
  border: '2px solid var(--debug-color-yellow)',
  boxSizing: 'border-box' as const,
}))

const gridCellsStyle = computed(() => ({
  position: 'absolute' as const,
  left: `${BG_OFFSET_X * props.zoom}px`,
  top: `${BG_OFFSET_Y * props.zoom}px`,
  width: `${BG_COLS * CELL_SIZE * props.zoom}px`,
  height: `${BG_ROWS * CELL_SIZE * props.zoom}px`,
  backgroundImage: `
    linear-gradient(to right, var(--debug-color-white-15) 1px, transparent 1px),
    linear-gradient(to bottom, var(--debug-color-white-15) 1px, transparent 1px)
  `,
  backgroundSize: `${CELL_SIZE * props.zoom}px ${CELL_SIZE * props.zoom}px`,
  boxSizing: 'border-box' as const,
}))

const marginsStyle = computed(() => ({
  position: 'absolute' as const,
  top: 0,
  left: 0,
  width: '100%',
  height: '100%',
  boxSizing: 'border-box' as const,
  backgroundImage: 'linear-gradient(to right, var(--debug-color-magenta) 50%, transparent 50%)',
  backgroundPosition: `0 ${BG_OFFSET_Y * props.zoom}px, 0 ${(BG_OFFSET_Y + BG_ROWS * CELL_SIZE) * props.zoom}px`,
  backgroundRepeat: 'repeat-x',
  backgroundSize: '8px 1px',
}))

const marginBeforeStyle = computed(() => ({
  position: 'absolute' as const,
  left: `${BG_OFFSET_X * props.zoom}px`,
  top: 0,
  height: '100%',
  background: 'var(--debug-color-magenta)',
  backgroundImage: 'linear-gradient(to bottom, var(--debug-color-magenta) 50%, transparent 50%)',
  backgroundSize: '1px 8px',
  backgroundRepeat: 'repeat-y',
}))

const marginAfterStyle = computed(() => ({
  position: 'absolute' as const,
  left: `${(BG_OFFSET_X + BG_COLS * CELL_SIZE) * props.zoom}px`,
  top: 0,
  height: '100%',
  background: 'var(--debug-color-magenta)',
  backgroundImage: 'linear-gradient(to bottom, var(--debug-color-magenta) 50%, transparent 50%)',
  backgroundSize: '1px 8px',
  backgroundRepeat: 'repeat-y',
}))
</script>

<template>
  <div class="debug-grid-overlay" :style="overlayStyle">
    <!-- Background Screen boundary (28×24) - Cyan -->
    <div class="grid-bg-screen" :style="bgScreenStyle"></div>
    <!-- BG GRAPHIC boundary (28×21) - Yellow -->
    <div class="grid-bg-graphic" :style="bgGraphicStyle"></div>
    <!-- Character grid -->
    <div class="grid-cells" :style="gridCellsStyle"></div>
    <!-- Margin lines (magenta dashed) -->
    <div class="grid-margins" :style="marginsStyle">
      <div class="grid-margin-left" :style="marginBeforeStyle"></div>
      <div class="grid-margin-right" :style="marginAfterStyle"></div>
    </div>
  </div>
</template>

<style scoped>
/* stylelint-disable function-disallowed-list */
.debug-grid-overlay {
  /* Debug grid colors - using theme-compatible CSS variables */
  --debug-color-cyan: rgb(0 255 255);
  --debug-color-yellow: rgb(255 255 0);
  --debug-color-magenta: rgb(255 0 255);
  --debug-color-white-15: rgb(255 255 255 / 15%);
}
</style>