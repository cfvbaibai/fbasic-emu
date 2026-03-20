<script setup lang="ts">
/**
 * Performance Diagnostics Page
 *
 * Provides detailed performance metrics for diagnosing PRINT performance issues.
 * Tracks timing at each stage: worker execution, message passing, screen rendering.
 */

import { ref } from 'vue'

import RuntimeOutput from '@/features/ide/components/RuntimeOutput.vue'
import { useBasicIde as useBasicIdeEnhanced } from '@/features/ide/composables/useBasicIdeEnhanced'
import {
  RENDER_FPS_OPTIONS,
  usePerformanceDiagnosticsMetrics,
} from '@/features/ide/composables/usePerformanceDiagnosticsMetrics'
import { provideScreenContext } from '@/features/ide/composables/useScreenContext'
import { GameBlock, GameButton, GameLayout, GameSelect, GameSwitch } from '@/shared/components/ui'

defineOptions({
  name: 'PerformanceDiagnosticsPage',
})

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

const {
  fps,
  messagesPerSecond,
  rendersPerSecond,
  workerTime,
  messageHandlingTime,
  renderTime,
  totalTime,
  workerTimePercent,
  messageTimePercent,
  renderTimePercent,
  renderingEnabled,
  messageOutputEnabled,
  renderFpsTarget,
  outputForDisplay,
  runTest,
  clearMetrics,
} = usePerformanceDiagnosticsMetrics({
  code,
  runCode,
  isRunning,
  output,
  screenBuffer,
})
</script>

<template>
  <GameLayout>
    <div class="perf-diagnostics-container">
      <!-- Page Header -->
      <GameBlock title="Performance Diagnostics" title-icon="mdi:speedometer">
        <p class="description">
          Diagnose PRINT performance issues by running test scenarios and measuring timing at each
          stage: worker execution, message passing, and screen rendering.
        </p>
      </GameBlock>

      <!-- Test Controls -->
      <GameBlock title="Test Scenarios" title-icon="mdi:test-tube">
        <div class="scenario-buttons">
          <GameButton @click="runTest('light')" :disabled="isRunning" type="primary">
            Light (50 iterations)
          </GameButton>
          <GameButton @click="runTest('medium')" :disabled="isRunning" type="primary">
            Medium (200 iterations)
          </GameButton>
          <GameButton @click="runTest('heavy')" :disabled="isRunning" type="primary">
            Heavy (500 iterations)
          </GameButton>
          <GameButton @click="runTest('infinite')" :disabled="isRunning" type="primary">
            Infinite Loop
          </GameButton>
          <GameButton @click="stopCode" :disabled="!isRunning" type="danger">Stop</GameButton>
          <GameButton @click="clearMetrics" :disabled="isRunning" type="default">
            Clear Metrics
          </GameButton>
        </div>
      </GameBlock>

      <!-- Settings -->
      <GameBlock title="Settings" title-icon="mdi:cog">
        <div class="settings-grid">
          <div class="setting-item">
            <label class="setting-label">Screen Rendering</label>
            <GameSwitch
              :model-value="renderingEnabled"
              @update:model-value="(val) => (renderingEnabled = Boolean(val))"
            />
          </div>
          <div class="setting-item">
            <label class="setting-label">OUTPUT Messages</label>
            <GameSwitch
              :model-value="messageOutputEnabled"
              @update:model-value="(val) => (messageOutputEnabled = Boolean(val))"
            />
          </div>
          <div class="setting-item">
            <label class="setting-label">Render FPS Target</label>
            <GameSelect
              :model-value="renderFpsTarget"
              @update:model-value="(val) => (renderFpsTarget = Number(val))"
              :options="RENDER_FPS_OPTIONS"
              size="small"
              class="fps-select"
            />
          </div>
        </div>
      </GameBlock>

      <!-- Real-time Metrics -->
      <GameBlock title="Performance Metrics" title-icon="mdi:chart-line">
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-label">FPS</div>
            <div class="metric-value">{{ fps }}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Messages/sec</div>
            <div class="metric-value">{{ messagesPerSecond }}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Renders/sec</div>
            <div class="metric-value">{{ rendersPerSecond }}</div>
          </div>
          <div class="metric-card">
            <div class="metric-label">Total Time</div>
            <div class="metric-value">{{ totalTime }}ms</div>
          </div>
        </div>
      </GameBlock>

      <!-- CPU Time Breakdown -->
      <GameBlock title="CPU Time Breakdown" title-icon="mdi:clock-outline">
        <div class="breakdown-bars">
          <div class="breakdown-item">
            <span class="breakdown-label">Worker Execution</span>
            <div class="breakdown-bar">
              <div class="breakdown-fill worker" :style="{ width: workerTimePercent + '%' }"></div>
              <span class="breakdown-value"
                >{{ workerTime }}ms ({{ workerTimePercent }}%)</span
              >
            </div>
          </div>
          <div class="breakdown-item">
            <span class="breakdown-label">Message Handling</span>
            <div class="breakdown-bar">
              <div
                class="breakdown-fill message"
                :style="{ width: messageTimePercent + '%' }"
              ></div>
              <span class="breakdown-value"
                >{{ messageHandlingTime }}ms ({{ messageTimePercent }}%)</span
              >
            </div>
          </div>
          <div class="breakdown-item">
            <span class="breakdown-label">Screen Rendering</span>
            <div class="breakdown-bar">
              <div
                class="breakdown-fill render"
                :style="{ width: renderTimePercent + '%' }"
              ></div>
              <span class="breakdown-value"
                >{{ renderTime }}ms ({{ renderTimePercent }}%)</span
              >
            </div>
          </div>
        </div>
      </GameBlock>

      <!-- Screen Output -->
      <GameBlock v-if="renderingEnabled" title="Screen Output" title-icon="mdi:monitor" class="screen-output-block">
        <RuntimeOutput
          :output="outputForDisplay"
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
.perf-diagnostics-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  max-width: 1400px;
  margin: 0 auto;
}

.description {
  margin: 0;
  color: var(--game-text-secondary);
  font-size: var(--game-font-size-base);
  line-height: 1.6;
}

/* Scenario Buttons */
.scenario-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

/* Settings Grid */
.settings-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.setting-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: var(--base-solid-gray-20);
  border-radius: var(--game-radius-md);
}

.setting-label {
  flex: 1;
  font-size: var(--game-font-size-sm);
  color: var(--game-text-primary);
  font-weight: var(--game-font-weight-medium);
}

.fps-select {
  min-width: 120px;
}

/* Metrics Grid */
.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.metric-card {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  background: var(--base-solid-gray-20);
  border-radius: var(--game-radius-lg);
  border: 1px solid var(--base-solid-gray-30);
}

.metric-label {
  font-size: var(--game-font-size-sm);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--game-text-secondary);
  font-weight: var(--game-font-weight-medium);
}

.metric-value {
  font-size: var(--game-font-size-lg);
  font-weight: var(--game-font-weight-bold);
  font-family: var(--game-font-family-mono);
  color: var(--game-text-primary);
}

/* Breakdown Bars */
.breakdown-bars {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.breakdown-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.breakdown-label {
  font-size: var(--game-font-size-sm);
  font-weight: var(--game-font-weight-medium);
  color: var(--game-text-primary);
}

.breakdown-bar {
  position: relative;
  height: 32px;
  background: var(--base-solid-gray-20);
  border-radius: var(--game-radius-md);
  border: 1px solid var(--base-solid-gray-30);
  overflow: hidden;
}

.breakdown-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  transition: width 0.3s ease;
  border-radius: var(--game-radius-md);
}

.breakdown-fill.worker {
  background: linear-gradient(90deg, var(--base-solid-primary) 0%, var(--base-solid-primary-60) 100%);
}

.breakdown-fill.message {
  background: linear-gradient(90deg, var(--semantic-solid-warning) 0%, var(--semantic-alpha-warning-60) 100%);
}

.breakdown-fill.render {
  background: linear-gradient(90deg, var(--semantic-solid-success) 0%, var(--semantic-alpha-success-60) 100%);
}

.breakdown-value {
  position: absolute;
  top: 50%;
  left: 0.75rem;
  transform: translateY(-50%);
  font-size: var(--game-font-size-sm);
  font-family: var(--game-font-family-mono);
  color: var(--game-text-primary);
  font-weight: var(--game-font-weight-medium);
  text-shadow: 0 1px 2px var(--base-alpha-gray-00-50);
  z-index: 1;
}

/* Screen Output Block - Ensure it has proper height and flex layout */
.screen-output-block {
  height: 1000px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.screen-output-block :deep(.game-block-content) {
  flex: 1 1 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.screen-output-block :deep(.runtime-output) {
  flex: 1 1 0;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}
</style>
