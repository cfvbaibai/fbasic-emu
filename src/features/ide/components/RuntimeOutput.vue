<script setup lang="ts">
import { ref } from 'vue'

import type { BasicVariable } from '@/core/types/state-types'
import { GameTabs } from '@/shared/components/ui'

import DebugTab from './DebugTab.vue'
import ScreenTab from './ScreenTab.vue'
import VariablesTab from './VariablesTab.vue'

/**
 * RuntimeOutput component - Displays runtime output, errors, variables, debug info, and screen buffer.
 * Screen data is provided via useScreenContext (IdePage); only tab-common and non-screen props are passed in.
 */
defineOptions({
  name: 'RuntimeOutput',
})

const _props = withDefaults(defineProps<Props>(), {
  errors: () => [],
  variables: () => ({}),
  debugOutput: '',
  debugMode: false,
})

interface Props {
  output: string[]
  isRunning: boolean
  errors?: { line: number; message: string; type: string }[]
  variables?: Record<string, BasicVariable>
  debugOutput?: string
  debugMode?: boolean
}

const activeTab = ref('screen')
</script>

<template>
  <div class="runtime-output">
    <GameTabs v-model="activeTab" type="border-card" class="output-tabs">
      <!-- SCREEN Tab (screen data from useScreenContext) -->
      <ScreenTab :errors="errors" />

      <!-- Debug Output Tab -->
      <DebugTab :debug-output="debugOutput" :debug-mode="debugMode" />

      <!-- Variables Tab -->
      <VariablesTab :variables="variables" />
    </GameTabs>
  </div>
</template>

<style scoped>
.runtime-output {
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
  background: transparent;
  min-height: 0; /* Allow component to shrink */
  overflow: hidden; /* Prevent overflow */
  position: relative;
}

.output-tabs {
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
  position: relative;
  z-index: 1;
}
</style>
