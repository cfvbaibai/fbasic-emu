<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { SCREEN_DIMENSIONS } from '@/core/constants'

import type { ScreenBufferReader } from './types'

defineOptions({
  name: 'DisplayBufferSection',
})

const props = defineProps<{
  sharedDisplayBufferAccessor: ScreenBufferReader
}>()

const { t } = useI18n()

const COLS = SCREEN_DIMENSIONS.BACKGROUND.COLUMNS
const ROWS = SCREEN_DIMENSIONS.BACKGROUND.LINES

const SPACE_CHAR = 0x20

/** Build a 2D grid of character codes read from the shared display buffer. */
const charGrid = computed(() => {
  const grid: number[][] = []
  for (let y = 0; y < ROWS; y++) {
    const row: number[] = []
    for (let x = 0; x < COLS; x++) {
      row.push(props.sharedDisplayBufferAccessor.readScreenChar(x, y))
    }
    grid.push(row)
  }
  return grid
})

/** Build a 2D grid of color pattern values read from the shared display buffer. */
const patternGrid = computed(() => {
  const grid: number[][] = []
  for (let y = 0; y < ROWS; y++) {
    const row: number[] = []
    for (let x = 0; x < COLS; x++) {
      row.push(props.sharedDisplayBufferAccessor.readScreenPattern(x, y))
    }
    grid.push(row)
  }
  return grid
})

/** Format a numeric value as 2-digit uppercase hex string. */
function formatHex2(value: number): string {
  return value.toString(16).toUpperCase().padStart(2, '0')
}
</script>

<template>
  <div class="display-buffer-section">
    <div class="display-buffer-grid-section">
      <div class="display-buffer-char-title">
        {{ t('ide.bufferInspector.displayBufferCharTitle') }}
      </div>
      <div class="display-buffer-grid">
        <div
          v-for="(row, y) in charGrid"
          :key="`char-row-${y}`"
          class="display-buffer-char-row"
        >
          <span class="display-buffer-char-row-label">
            {{ formatHex2(y) }}
          </span>
          <span
            v-for="(code, x) in row"
            :key="`char-${x}-${y}`"
            class="display-buffer-char-cell"
            :class="{
              'display-buffer-cell-highlighted': code !== SPACE_CHAR,
            }"
          >
            {{ formatHex2(code) }}
          </span>
        </div>
      </div>
    </div>

    <div class="display-buffer-grid-section">
      <div class="display-buffer-pattern-title">
        {{ t('ide.bufferInspector.displayBufferPatternTitle') }}
      </div>
      <div class="display-buffer-grid">
        <div
          v-for="(row, y) in patternGrid"
          :key="`pattern-row-${y}`"
          class="display-buffer-pattern-row"
        >
          <span class="display-buffer-pattern-row-label">
            {{ formatHex2(y) }}
          </span>
          <span
            v-for="(pattern, x) in row"
            :key="`pattern-${x}-${y}`"
            class="display-buffer-pattern-cell"
            :class="{
              'display-buffer-cell-highlighted': pattern !== 0,
            }"
          >
            {{ pattern }}
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.display-buffer-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.display-buffer-grid-section {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.display-buffer-char-title,
.display-buffer-pattern-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--game-text-secondary);
}

.display-buffer-grid {
  display: flex;
  flex-direction: column;
  gap: 1px;
  overflow: auto;
  font-size: 0.55rem;
  font-family: monospace;
  font-variant-numeric: tabular-nums;
  line-height: 1;
}

.display-buffer-char-row,
.display-buffer-pattern-row {
  display: flex;
  gap: 1px;
}

.display-buffer-char-row-label,
.display-buffer-pattern-row-label {
  display: inline-flex;
  align-items: center;
  justify-content: flex-end;
  width: 1.5rem;
  flex-shrink: 0;
  color: var(--game-text-tertiary);
  font-size: 0.5rem;
}

.display-buffer-char-cell,
.display-buffer-pattern-cell {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1.4rem;
  height: 1.2rem;
  flex-shrink: 0;
  color: var(--game-text-tertiary);
  background: var(--game-surface-bg-start);
}

.display-buffer-cell-highlighted {
  color: var(--game-text-primary);
  background: var(--game-surface-accent);
}
</style>
