<script setup lang="ts">
import { computed, defineAsyncComponent, h } from 'vue'
import { useI18n } from 'vue-i18n'

import BgEditorPanel from '@/features/bg-editor/components/BgEditorPanel.vue'
import type { InputMode } from '@/features/ide/composables/useBasicIdeState'
import { GameBlock, GameButton, GameIconButton } from '@/shared/components/ui'

import EditorViewToggle from './EditorViewToggle.vue'
import IdeControls from './IdeControls.vue'
import ProgramToolbar from './ProgramToolbar.vue'

/**
 * IdeEditorPanel - Editor panel with toolbar, view toggle, and code/BG editors.
 * Extracted from IdePage to reduce file size.
 */

defineOptions({
  name: 'IdeEditorPanel',
})

const props = defineProps<Props>()

const emit = defineEmits<{
  (e: 'update:code', value: string): void
  (e: 'update:editorView', value: 'code' | 'bg'): void
  (e: 'update:inputMode', value: InputMode): void
  (e: 'run'): void
  (e: 'stop'): void
  (e: 'clear'): void
  (e: 'toggleDebug'): void
  (e: 'openSampleSelector'): void
}>()

const MonacoCodeEditor = defineAsyncComponent({
  loader: () => import('./MonacoCodeEditor.vue'),
  loadingComponent: {
    name: 'MonacoCodeEditorLoading',
    setup() {
      const { t } = useI18n()
      return () =>
        h('div', { class: 'editor-loading', 'data-testid': 'monaco-editor-loading' }, [
          h('span', { class: 'editor-loading-spinner' }),
          h('span', { class: 'editor-loading-text' }, t('ide.codeEditor.loading')),
        ])
    },
  },
  delay: 200,
})

interface Props {
  /** Code content (v-model) */
  code: string
  /** Current editor view */
  editorView: 'code' | 'bg'
  /** Whether toolbar should be compact */
  isToolbarCompact: boolean
  /** Whether program is running */
  isRunning: boolean
  /** Whether run button is enabled */
  canRun: boolean
  /** Whether stop button is enabled */
  canStop: boolean
  /** Whether debug mode is active */
  debugMode: boolean
  /** Current input mode: 'joystick' or 'keyboard' */
  inputMode: InputMode
}

const { t } = useI18n()

const useLiteEditor = computed(() => {
  if (typeof window === 'undefined') return false
  return new URLSearchParams(window.location.search).get('e2e') === 'lite'
})
</script>

<template>
  <GameBlock :title="t('ide.codeEditor.title')" title-icon="mdi:pencil" class="editor-panel">
    <template #right>
      <div class="editor-header-controls">
        <ProgramToolbar :is-compact="props.isToolbarCompact" />
        <EditorViewToggle
          :model-value="props.editorView"
          :is-compact="props.isToolbarCompact"
          @update:model-value="emit('update:editorView', $event)"
        />
        <template v-if="props.isToolbarCompact">
          <GameIconButton
            type="default"
            icon="mdi:folder-open"
            size="small"
            :title="t('ide.samples.load')"
            @click="emit('openSampleSelector')"
          />
        </template>
        <template v-else>
          <GameButton
            type="default"
            icon="mdi:folder-open"
            size="small"
            @click="emit('openSampleSelector')"
          >
            {{ t('ide.samples.load') }}
          </GameButton>
        </template>
        <IdeControls
          :is-running="props.isRunning"
          :can-run="props.canRun"
          :can-stop="props.canStop"
          :debug-mode="props.debugMode"
          :input-mode="props.inputMode"
          @run="emit('run')"
          @stop="emit('stop')"
          @clear="emit('clear')"
          @toggle-debug="emit('toggleDebug')"
          @update:input-mode="emit('update:inputMode', $event)"
        />
      </div>
    </template>
    <!-- Code Editor View -->
    <template v-if="props.editorView === 'code'">
      <div
        v-if="useLiteEditor"
        class="editor-lite-placeholder"
        data-testid="ide-editor-lite-placeholder"
      ></div>
      <MonacoCodeEditor
        v-else
        :model-value="props.code"
        @update:model-value="emit('update:code', $event)"
      />
    </template>
    <!-- BG Editor View -->
    <BgEditorPanel v-show="props.editorView === 'bg'" />
  </GameBlock>
</template>

<style scoped>
.editor-panel {
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}

.editor-panel :deep(.game-block-header) {
  padding-bottom: 0.5rem;
  min-height: auto;
}

.editor-panel :deep(.game-block-title) {
  font-size: 0.95rem;
}

.editor-panel :deep(.game-block-content) {
  flex: 1 1 0;
  overflow: hidden;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.editor-header-controls {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

/* Match Sample button size with toolbar buttons */
.editor-header-controls > :deep(.game-button) {
  min-width: auto;
  padding: 0.375rem 0.625rem;
  font-size: 0.8rem;
}

.editor-lite-placeholder {
  flex: 1 1 0;
  min-height: 400px;
}

.editor-loading {
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  min-height: 400px;
  color: var(--game-text-secondary);
}

.editor-loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--game-surface-border);
  border-top-color: currentcolor;
  border-radius: 50%;
  animation: editor-loading-spin 0.8s linear infinite;
}

.editor-loading-text {
  font-size: 0.85rem;
}

@keyframes editor-loading-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
