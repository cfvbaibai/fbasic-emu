<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import { GameButton, GameIconButton } from '@/shared/components/ui'

/**
 * EditorViewToggle - Toggle between Code and BG editor views.
 * Adapts display based on compact mode for responsive toolbar.
 */

defineOptions({
  name: 'EditorViewToggle',
})

const props = withDefaults(defineProps<Props>(), {
  isCompact: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: 'code' | 'bg'): void
}>()

const { t } = useI18n()

interface Props {
  /** Current view: 'code' or 'bg' */
  modelValue: 'code' | 'bg'
  /** Whether to use compact (icon-only) display */
  isCompact?: boolean
}

function selectCode() {
  emit('update:modelValue', 'code')
}

function selectBg() {
  emit('update:modelValue', 'bg')
}
</script>

<template>
  <div class="editor-view-toggle">
    <template v-if="props.isCompact">
      <GameIconButton
        variant="toggle"
        type="default"
        icon="mdi:code-tags"
        size="small"
        :title="t('ide.editorViewToggle.codeTitle')"
        :selected="props.modelValue === 'code'"
        @click="selectCode"
      />
      <GameIconButton
        variant="toggle"
        type="default"
        icon="mdi:view-grid"
        size="small"
        :title="t('ide.editorViewToggle.bgTitle')"
        :selected="props.modelValue === 'bg'"
        @click="selectBg"
      />
    </template>
    <template v-else>
      <GameButton
        variant="toggle"
        type="default"
        icon="mdi:code-tags"
        size="small"
        :selected="props.modelValue === 'code'"
        @click="selectCode"
      >
        {{ t('ide.editorViewToggle.code') }}
      </GameButton>
      <GameButton
        variant="toggle"
        type="default"
        icon="mdi:view-grid"
        size="small"
        :selected="props.modelValue === 'bg'"
        @click="selectBg"
      >
        {{ t('ide.editorViewToggle.bg') }}
      </GameButton>
    </template>
  </div>
</template>

<style scoped>
.editor-view-toggle {
  display: flex;
  gap: 0.125rem;
  margin-right: 0.5rem;
}

/* Override GameButton min-width for toggle buttons in toolbar */
.editor-view-toggle :deep(.game-button) {
  min-width: auto;
  padding: 0.375rem 0.625rem;
  font-size: 0.8rem;
}
</style>
