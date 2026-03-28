<script setup lang="ts">
import { ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import type { InputMode } from '@/features/ide/composables/useBasicIdeState'
import { GameIconButton } from '@/shared/components/ui'

import InputModeToggle from './InputModeToggle.vue'

/**
 * IdeControls component - Control buttons for the IDE (run, stop, clear, debug toggle).
 *
 * @example
 * ```vue
 * <IdeControls
 *   :is-running="isRunning"
 *   :can-run="canRun"
 *   :can-stop="canStop"
 *   :debug-mode="debugMode"
 *   @run="handleRun"
 *   @stop="handleStop"
 *   @clear="handleClear"
 *   @toggle-debug="handleToggleDebug"
 * />
 * ```
 */
defineOptions({
  name: 'IdeControls',
})

const props = withDefaults(defineProps<Props>(), {
  canRun: true,
  canStop: false,
  debugMode: false,
  inputMode: 'joystick',
})

const emit = defineEmits<Emits>()

/**
 * Loading state for the Run button.
 * Set on click, cleared once isRunning flips to true (or canRun flips to false).
 * Prevents double-clicks during the async startup window.
 */
const isStarting = ref(false)

watch(
  () => props.isRunning,
  (running) => {
    if (running) isStarting.value = false
  }
)

watch(
  () => props.canRun,
  (canRun) => {
    if (!canRun) isStarting.value = false
  }
)

const { t } = useI18n()

interface Props {
  /** Whether the program is currently running */
  isRunning: boolean
  /** Whether the run button should be enabled */
  canRun?: boolean
  /** Whether the stop button should be enabled */
  canStop?: boolean
  /** Whether debug mode is currently enabled */
  debugMode?: boolean
  /** Current input mode: 'joystick' or 'keyboard' */
  inputMode?: InputMode
}

interface Emits {
  /** Emitted when the run button is clicked */
  (e: 'run'): void
  /** Emitted when the stop button is clicked */
  (e: 'stop'): void
  /** Emitted when the clear button is clicked */
  (e: 'clear'): void
  /** Emitted when the debug toggle is changed */
  (e: 'toggleDebug'): void
  /** Emitted when the input mode changes */
  (e: 'update:inputMode', value: InputMode): void
}

const handleRun = () => {
  isStarting.value = true
  emit('run')
}

const handleStop = () => {
  emit('stop')
}

const handleClear = () => {
  emit('clear')
}

const handleDebugToggle = () => {
  emit('toggleDebug')
}

const handleInputModeChange = (value: InputMode) => {
  emit('update:inputMode', value)
}
</script>

<template>
  <div class="ide-controls">
    <!-- Input mode toggle -->
    <InputModeToggle
      :model-value="inputMode"
      is-compact
      @update:model-value="handleInputModeChange"
    />

    <div class="control-divider" />

    <GameIconButton
      type="primary"
      :disabled="!canRun"
      :loading="isStarting"
      icon="mdi:play"
      size="small"
      :title="t('ide.controls.run')"
      data-testid="ide-run-button"
      @click="handleRun"
    />

    <GameIconButton
      type="danger"
      :disabled="!canStop"
      icon="mdi:stop"
      size="small"
      :title="t('ide.controls.stop')"
      data-testid="ide-stop-button"
      @click="handleStop"
    />

    <GameIconButton
      type="warning"
      icon="mdi:delete"
      size="small"
      :title="t('ide.controls.clear')"
      @click="handleClear"
    />

    <GameIconButton
      variant="toggle"
      type="info"
      icon="mdi:bug"
      size="small"
      :selected="debugMode"
      :title="t('ide.controls.debug')"
      @click="handleDebugToggle"
    />
  </div>
</template>

<style scoped>
.ide-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0;
}

.control-divider {
  width: 1px;
  height: 24px;
  background: var(--game-surface-border);
  margin: 0 0.25rem;
}
</style>
