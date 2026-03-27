<script setup lang="ts">
/**
 * Position Sync Load Test Page
 *
 * Tests capacity of the position sync pipeline: frontend animation loop
 * sends UPDATE_ANIMATION_POSITIONS to the worker every frame. This page
 * runs 8 simultaneous movements and measures FPS, sync rate, and payload size.
 */

import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import RuntimeOutput from '@/features/ide/components/RuntimeOutput.vue'
import { useBasicIde as useBasicIdeEnhanced } from '@/features/ide/composables/useBasicIdeEnhanced'
import { provideScreenContext } from '@/features/ide/composables/useScreenContext'
import { GameBlock, GameButton, GameLayout } from '@/shared/components/ui'

defineOptions({
  name: 'PositionSyncLoadTestPage',
})

const { t } = useI18n()

const {
  code,
  runCode,
  stopCode,
  isRunning,
  output,
  errors,
  variables,
  debugOutput,
  debugMode,
  screenBuffer,
  cursorX,
  cursorY,
  bgPalette,
  backdropColor,
  spritePalette,
  cgenMode,
  spriteStates,
  spriteEnabled,
  // movementStates removed - read from shared buffer instead
  movementPositionsFromBuffer,
  frontSpriteNodes,
  backSpriteNodes,
  sharedDisplayBufferAccessor,
  sharedAnimationBuffer,
  sharedDisplayViews,
  sharedJoystickBuffer,
  setDecodedScreenState,
  registerScheduleRender,
} = useBasicIdeEnhanced()

provideScreenContext({
  screenBuffer,
  cursorX,
  cursorY,
  bgPalette,
  backdropColor,
  spritePalette,
  cgenMode,
  spriteStates,
  spriteEnabled,
  // movementStates removed - read from shared buffer instead
  movementPositionsFromBuffer,
  externalFrontSpriteNodes: frontSpriteNodes,
  externalBackSpriteNodes: backSpriteNodes,
  sharedDisplayViews: ref(sharedDisplayViews),
  sharedDisplayBufferAccessor,
  sharedAnimationBuffer: ref(sharedAnimationBuffer),
  sharedJoystickBuffer: ref(sharedJoystickBuffer),
  setDecodedScreenState,
  registerScheduleRender,
})

// Load test: 8 DEF MOVE + 8 POSITION + 8 MOVE (all actions moving)
const LOAD_TEST_CODE = `10 REM Position Sync Load Test - 8 simultaneous movements
20 DEF MOVE(0)=SPRITE(0,3,60,50,0,0)
21 DEF MOVE(1)=SPRITE(0,3,60,50,0,0)
22 DEF MOVE(2)=SPRITE(0,3,60,50,0,0)
23 DEF MOVE(3)=SPRITE(0,3,60,50,0,0)
24 DEF MOVE(4)=SPRITE(0,3,60,50,0,0)
25 DEF MOVE(5)=SPRITE(0,3,60,50,0,0)
26 DEF MOVE(6)=SPRITE(0,3,60,50,0,0)
27 DEF MOVE(7)=SPRITE(0,3,60,50,0,0)
30 POSITION 0,0,25:POSITION 1,30,50:POSITION 2,60,75:POSITION 3,90,100
31 POSITION 4,120,125:POSITION 5,150,150:POSITION 6,180,175:POSITION 7,210,200
40 MOVE 0:MOVE 1:MOVE 2:MOVE 3:MOVE 4:MOVE 5:MOVE 6:MOVE 7
50 REM Let them run; watch FPS and sync metrics above
`

// FPS counter (requestAnimationFrame on main thread)
const fps = ref(0)
let frameCount = 0
let lastFpsUpdate = 0
let rafId: number | null = null

function tickFps(now: number) {
  frameCount++
  if (now - lastFpsUpdate >= 1000) {
    fps.value = Math.round((frameCount * 1000) / (now - lastFpsUpdate))
    frameCount = 0
    lastFpsUpdate = now
  }
  rafId = requestAnimationFrame(tickFps)
}

function resetMetrics() {
  frameCount = 0
  lastFpsUpdate = performance.now()
}

function startLoadTest() {
  resetMetrics()
  code.value = LOAD_TEST_CODE
  runCode()
}

onMounted(() => {
  code.value = LOAD_TEST_CODE
  lastFpsUpdate = performance.now()
  rafId = requestAnimationFrame(tickFps)
})

onBeforeUnmount(() => {
  if (rafId !== null) cancelAnimationFrame(rafId)
})
</script>

<template>
  <GameLayout>
    <div class="load-test-container">
      <GameBlock
        :title="t('testing.positionSync.title')"
        title-icon="mdi:speedometer"
        class="metrics-panel"
      >
        <template #default>
          <p class="description">
            {{ t('testing.positionSync.description') }}
          </p>
          <div class="metrics-grid">
            <div class="metric">
              <span class="metric-label">{{ t('testing.positionSync.fps') }}</span>
              <span class="metric-value">{{ fps }}</span>
              <span class="metric-hint">{{ t('testing.positionSync.mainThread') }}</span>
            </div>
          </div>
          <div class="actions">
            <GameButton type="primary" @click="startLoadTest" :disabled="isRunning">
              {{ t('testing.positionSync.startLoadTest') }}
            </GameButton>
            <GameButton type="default" @click="stopCode" :disabled="!isRunning">
              {{ t('testing.positionSync.stop') }}
            </GameButton>
          </div>
        </template>
      </GameBlock>

      <GameBlock :title="t('testing.screen')" title-icon="mdi:monitor" class="screen-panel">
        <RuntimeOutput
          :output="output"
          :is-running="isRunning"
          :errors="errors"
          :variables="variables"
          :debug-output="debugOutput"
          :debug-mode="debugMode"
        />
      </GameBlock>
    </div>
  </GameLayout>
</template>

<style scoped>
.load-test-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  max-width: 1200px;
  margin: 0 auto;
  flex: 1 1 0;
  min-height: 0;
  overflow: hidden;
}

.description {
  margin: 0 0 1rem;
  color: var(--game-text-secondary);
  font-size: var(--game-font-size-base);
}

.description code {
  font-family: var(--game-font-family-mono);
  font-size: 0.85em;
  padding: 0.1em 0.3em;
  background: var(--base-solid-gray-20);
  border-radius: var(--game-radius-sm);
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.metric {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.75rem;
  background: var(--base-solid-gray-20);
  border-radius: var(--game-radius-lg);
}

.metric-label {
  font-size: var(--game-font-size-sm);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--game-text-secondary);
}

.metric-value {
  font-size: var(--game-font-size-lg);
  font-weight: var(--game-font-weight-bold);
  font-family: var(--game-font-family-mono);
}

.metric-hint {
  font-size: 0.7rem;
  color: var(--game-text-tertiary);
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.screen-panel {
  flex: 1 1 0;
  min-height: 280px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.screen-panel :deep(.game-block-content) {
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.screen-panel :deep(.runtime-output) {
  flex: 1 1 0;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
</style>
