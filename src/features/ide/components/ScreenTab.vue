<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { useReplContext } from '@/features/ide/composables/useReplMode'
import { provideScreenDebug } from '@/features/ide/composables/useScreenDebug'
import { useScreenFilter } from '@/features/ide/composables/useScreenFilter'
import { provideScreenZoom } from '@/features/ide/composables/useScreenZoom'
import { GameButton, GameButtonGroup, GameIcon, GameTabPane } from '@/shared/components/ui'

import ErrorPanel from './ErrorPanel.vue'
import ReplInput from './ReplInput.vue'
import Screen from './Screen.vue'

/**
 * ScreenTab component - Displays the screen buffer in a tab pane format with zoom controls.
 * Screen data comes from useScreenContext (provided by IdePage); Screen component injects it.
 * REPL state comes from useReplContext (provided by useBasicIdeEnhanced).
 */
defineOptions({
  name: 'ScreenTab',
})

const _props = withDefaults(
  defineProps<{
    errors?: Array<{ line: number; message: string; type: string; stack?: string; sourceLine?: string }>
  }>(),
  { errors: () => [] }
)

const { t } = useI18n()

// Provide zoom state for child components (Screen) and use it for controls
const { zoomLevel, setZoom } = provideScreenZoom()

// Provide debug settings for child components
const { showGrid, toggleGrid } = provideScreenDebug()

// Screen filter state (shared singleton via module-level ref)
const { filterEnabled, prefersReducedMotion, toggleFilter } =
  useScreenFilter()

// REPL context (provided by useBasicIdeEnhanced in IdePage)
const {
  replActive,
  commandHistory,
  historyIndex,
  navigateHistory,
  executeReplCommand,
} = useReplContext()

// Zoom level options
const zoomLevels: Array<{ value: 1 | 2 | 3 | 4; label: string }> = [
  { value: 1, label: '×1' },
  { value: 2, label: '×2' },
  { value: 3, label: '×3' },
  { value: 4, label: '×4' },
]

// Computed properties for template binding (Vue templates auto-unwrap refs, but this helps TypeScript)
const currentZoomLevel = computed(() => zoomLevel.value)
const isGridShown = computed(() => showGrid.value)
const isFilterEnabled = computed(() => filterEnabled.value)
const isReducedMotion = computed(() => prefersReducedMotion.value)
const isReplDisabled = computed(() => !replActive.value)
</script>

<template>
  <GameTabPane name="screen">
    <template #label>
      <GameIcon icon="mdi:monitor" size="small" />
      <span>{{ t('ide.output.screen') }}</span>
    </template>

    <template #tab-content-header>
      <div class="screen-controls">
        <GameButtonGroup>
          <GameButton
            v-for="level in zoomLevels"
            :key="level.value"
            variant="toggle"
            size="small"
            :selected="currentZoomLevel === level.value"
            @click="setZoom(level.value)"
          >
            {{ level.label }}
          </GameButton>
        </GameButtonGroup>
        <GameButton
          variant="toggle"
          size="small"
          :selected="isGridShown"
          @click="toggleGrid"
        >
          <GameIcon icon="mdi:grid" size="small" />
          {{ t('ide.screenTab.grid') }}
        </GameButton>
        <GameButton
          data-testid="ide-filter-toggle"
          variant="toggle"
          size="small"
          :selected="isFilterEnabled"
          :disabled="isReducedMotion"
          @click="toggleFilter"
        >
          <GameIcon icon="mdi:monitor-shimmer" size="small" />
          {{ t('ide.screenTab.filter') }}
        </GameButton>
      </div>
    </template>

    <div class="tab-content">
      <Screen />
    </div>
    <div class="repl-input-wrapper">
      <ReplInput
        :active="replActive"
        :disabled="isReplDisabled"
        :command-history="commandHistory"
        :history-index="historyIndex"
        @execute="executeReplCommand"
        @navigate-history="navigateHistory"
      />
    </div>
    <div class="tab-content-footer">
      <ErrorPanel :errors="errors" />
    </div>
  </GameTabPane>
</template>

<style scoped>
.tab-content {
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.tab-content-footer {
  flex-shrink: 0;
}

.screen-controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}
</style>
