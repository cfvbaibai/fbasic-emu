<script setup lang="ts">
import { computed, useTemplateRef } from 'vue'

import { useScreenContext } from '@/features/ide/composables/useScreenContext'
import { useScreenDebug } from '@/features/ide/composables/useScreenDebug'
import { useScreenFilter } from '@/features/ide/composables/useScreenFilter'
import { useScreenRenderPipeline } from '@/features/ide/composables/useScreenRenderPipeline'
import { COLORS } from '@/shared/data/palette'
import type { VueKonvaStageInstance } from '@/types/vue-konva'

import DebugGridOverlay from './DebugGridOverlay.vue'

/**
 * Screen - CRT-style display for F-BASIC: backdrop, character grid, sprites.
 * Reads state from useScreenContext; delegates rendering to useScreenRenderPipeline.
 */
defineOptions({
  name: 'Screen',
})

// Screen data from context (provided by IdePage); no props
const ctx = useScreenContext()

// Computed backdrop color hex
const backdropColorHex = computed(() => {
  const colorCode = ctx.backdropColor.value ?? 0
  return COLORS[colorCode] ?? COLORS[0] ?? '#000000'
})

// Use bgPalette from context
const paletteCode = computed(() => ctx.bgPalette.value ?? 1)

// Use debug settings composable
const { showGrid } = useScreenDebug()

// Use screen filter composable for CRT scanline toggle
const { filterEnabled } = useScreenFilter()

// Konva Stage reference
const stageRef = useTemplateRef<VueKonvaStageInstance>('stageRef')

// Delegate render pipeline to composable
const { stageDisplayWidth, stageDisplayHeight, baseWidth, baseHeight } = useScreenRenderPipeline({
  ctx,
  stageRef,
  paletteCode,
})
</script>

<template>
  <div class="screen-display">
    <div class="crt-bezel">
      <div :class="['crt-screen', { 'crt-filter-active': filterEnabled }]">
        <div v-if="filterEnabled" class="crt-phosphor-glow"></div>
        <div v-if="filterEnabled" class="crt-color-bleed"></div>
        <div v-if="filterEnabled" class="crt-scanlines"></div>
        <div v-if="filterEnabled" class="crt-vignette"></div>
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
              width: baseWidth,
              height: baseHeight,
            }"
            :style="{
              transform: `scale(${stageDisplayWidth / baseWidth})`,
              transformOrigin: 'top left',
            }"
          >
          <v-layer>
            <!-- Backdrop Screen (F-Basic layer 1: furthest back, 32x30 chars = 256x240 px) -->
            <v-rect
              :config="{
                x: 0,
                y: 0,
                width: baseWidth,
                height: baseHeight,
                fill: backdropColorHex,
              }"
            />
            <!-- Sprite layers added programmatically; background layer uses Canvas2D for performance -->
          </v-layer>
          </v-stage>
          <!-- Debug Grid Overlay -->
          <DebugGridOverlay v-if="showGrid" :zoom="stageDisplayWidth / baseWidth" />
        </div>
        <div class="crt-reflection"></div>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('@/shared/styles/screen-crt.css');
</style>
