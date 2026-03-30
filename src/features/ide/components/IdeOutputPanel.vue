<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import type { BasicVariable } from '@/core/types/state-types'
import { GameIconButton } from '@/shared/components/ui'

import LogLevelPanel from './LogLevelPanel.vue'
import RuntimeOutput from './RuntimeOutput.vue'

/**
 * IdeOutputPanel - Output panel with RuntimeOutput and LogLevelPanel toggle.
 * Extracted from IdePage to reduce file size.
 */

defineOptions({
  name: 'IdeOutputPanel',
})

defineProps<Props>()

const { t } = useI18n()

interface Props {
  // RuntimeOutput props
  output: string[]
  isRunning: boolean
  errors?: { line: number; message: string; type: string }[]
  variables?: Record<string, BasicVariable>
  debugOutput?: string
  debugMode?: boolean
}

const logLevelPanelOpen = defineModel<boolean>('logLevelPanelOpen', { default: false })
</script>

<template>
  <div class="output-panel">
    <div class="log-level-toggle">
      <GameIconButton
        :icon="logLevelPanelOpen ? 'mdi:close' : 'mdi:format-list-bulleted-type'"
        :title="logLevelPanelOpen ? t('ide.ideOutputPanel.closeLogLevels') : t('ide.ideOutputPanel.openLogLevels')"
        size="small"
        @click="logLevelPanelOpen = !logLevelPanelOpen"
      />
    </div>
    <Transition name="log-panel">
      <div v-show="logLevelPanelOpen" class="log-level-panel-wrapper">
        <LogLevelPanel :open="logLevelPanelOpen" />
      </div>
    </Transition>
    <RuntimeOutput
      :output="output"
      :is-running="isRunning"
      :errors="errors"
      :variables="variables"
      :debug-output="debugOutput"
      :debug-mode="debugMode"
    />
  </div>
</template>

<style scoped>
.output-panel {
  flex: 1 1 0;
  background: var(--game-surface-bg-gradient);
  border: 2px solid var(--game-surface-border);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
  box-shadow: var(--game-shadow-base);
  position: relative;
}

.log-level-toggle {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  z-index: 10;
}

.log-level-panel-wrapper {
  position: absolute;
  top: 2.5rem;
  right: 0.5rem;
  z-index: 9;
  max-height: calc(100% - 3rem);
  overflow-y: auto;
}

.log-panel-enter-active,
.log-panel-leave-active {
  transition: opacity 0.15s ease, transform 0.15s ease;
}

.log-panel-enter-from,
.log-panel-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

.output-panel > * {
  flex: 1 1 0;
  overflow: auto;
  min-height: 0;
}
</style>
