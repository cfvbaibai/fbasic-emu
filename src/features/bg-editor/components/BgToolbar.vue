<script setup lang="ts">
/**
 * BgToolbar component - Tool buttons for SELECT, COPY, MOVE, CHAR modes and CLEAR action
 */

import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { ConfirmDialog, GameButton, GameButtonGroup } from '@/shared/components/ui'

import { useBgEditorState } from '../composables/useBgEditorState'
import { BG_EDITOR_MODES } from '../constants'
import type { BgEditorMode } from '../types'

const { t } = useI18n()
const { mode, setMode, clearGrid } = useBgEditorState()

// Confirm dialog state
const showClearConfirm = ref(false)

const modes: { key: BgEditorMode; label: string }[] = [
  { key: BG_EDITOR_MODES.SELECT, label: t('bgEditor.toolbar.select') },
  { key: BG_EDITOR_MODES.COPY, label: t('bgEditor.toolbar.copy') },
  { key: BG_EDITOR_MODES.MOVE, label: t('bgEditor.toolbar.move') },
  { key: BG_EDITOR_MODES.CHAR, label: t('bgEditor.toolbar.char') },
]

const currentMode = computed({
  get: () => mode.value,
  set: (value: BgEditorMode) => setMode(value),
})

function handleClear(): void {
  showClearConfirm.value = true
}

function handleConfirmClear(): void {
  showClearConfirm.value = false
  clearGrid()
}

function handleCancelClear(): void {
  showClearConfirm.value = false
}
</script>

<template>
  <div class="bg-toolbar">
    <GameButtonGroup>
      <GameButton
        v-for="m in modes"
        :key="m.key"
        variant="toggle"
        :selected="currentMode === m.key"
        @click="currentMode = m.key"
      >
        {{ m.label }}
      </GameButton>
    </GameButtonGroup>

    <GameButton variant="action" @click="handleClear">
      {{ t('bgEditor.toolbar.clear') }}
    </GameButton>

    <ConfirmDialog
      :visible="showClearConfirm"
      :message="t('bgEditor.toolbar.clearConfirm')"
      @confirm="handleConfirmClear"
      @cancel="handleCancelClear"
    />
  </div>
</template>

<style scoped>
.bg-toolbar {
  display: flex;
  gap: 1rem;
  align-items: center;
  padding: 0.5rem;
}
</style>
