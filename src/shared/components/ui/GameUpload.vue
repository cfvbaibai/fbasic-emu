<script setup lang="ts">
import { ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import GameButton from './GameButton.vue'
import GameIcon from './GameIcon.vue'
import type { GameUploadEmits, GameUploadProps } from './GameUpload.types'

/**
 * GameUpload component - A file upload component with drag-and-drop support.
 *
 * @example
 * ```vue
 * <GameUpload
 *   accept=".txt,.json"
 *   :multiple="false"
 *   :drag="true"
 *   @change="handleFileChange"
 * />
 * ```
 */
defineOptions({
  name: 'GameUpload',
})

const props = withDefaults(defineProps<GameUploadProps>(), {
  accept: '*',
  multiple: false,
  disabled: false,
  drag: false,
})

const emit = defineEmits<GameUploadEmits>()

const { t } = useI18n()

const fileInput = useTemplateRef<HTMLInputElement>('fileInput')
const isDragging = ref(false)

const handleFileSelect = (event: Event) => {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (files && files.length > 0) {
    if (props.multiple) {
      emit('change', Array.from(files))
    } else {
      emit('change', files[0]!)
    }
    // Reset input so same file can be selected again
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }
}

const handleClick = () => {
  if (!props.disabled && fileInput.value) {
    fileInput.value.click()
  }
}

const handleDragOver = (event: DragEvent) => {
  if (props.drag && !props.disabled) {
    event.preventDefault()
    isDragging.value = true
  }
}

const handleDragLeave = () => {
  isDragging.value = false
}

const handleDrop = (event: DragEvent) => {
  if (props.drag && !props.disabled) {
    event.preventDefault()
    isDragging.value = false

    const files = event.dataTransfer?.files
    if (files && files.length > 0) {
      if (props.multiple) {
        emit('change', Array.from(files))
      } else {
        emit('change', files[0]!)
      }
    }
  }
}
</script>

<template>
  <div
    :class="[
      'game-upload',
      { 'game-upload-drag': drag, 'game-upload-dragging': isDragging, 'game-upload-disabled': disabled },
    ]"
    @dragover="handleDragOver"
    @dragleave="handleDragLeave"
    @drop="handleDrop"
  >
    <input
      ref="fileInput"
      type="file"
      :accept="accept"
      :multiple="multiple"
      :disabled="disabled"
      @change="handleFileSelect"
      class="game-upload-input"
      style="display: none"
    />

    <button
      v-if="drag"
      type="button"
      class="game-upload-drag-area bg-game-surface shadow-game-base"
      :disabled="disabled"
      :aria-label="t('common.upload.dragAndDrop')"
      @click="handleClick"
    >
      <GameIcon icon="mdi:upload" size="large" />
      <p class="game-upload-text">
        {{ t('common.upload.dragAndDrop') }}
        <span class="game-upload-link">{{ t('common.upload.clickToBrowse') }}</span>
      </p>
    </button>

    <button
      v-else
      type="button"
      class="game-upload-button-wrapper"
      :disabled="disabled"
      :aria-label="t('common.buttons.upload')"
      @click="handleClick"
    >
      <slot>
        <GameButton :disabled="disabled" icon="mdi:upload">
          {{ t('common.buttons.upload') }}
        </GameButton>
      </slot>
    </button>
  </div>
</template>

<style scoped>
.game-upload {
  display: inline-block;
}

.game-upload-drag-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 3rem 2rem;
  border: 2px dashed var(--game-surface-border);
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-align: center;

  /* Reset button styles */
  width: 100%;
  background: transparent;
  font: inherit;
  color: inherit;
}

.game-upload-drag-area:disabled {
  cursor: not-allowed;
}

.game-upload-dragging .game-upload-drag-area {
  border-color: var(--base-solid-primary);
  background: var(--base-alpha-primary-10);
  box-shadow: 0 0 20px var(--game-accent-glow);
}

.game-upload-disabled .game-upload-drag-area {
  cursor: not-allowed;
}

.game-upload-drag-area:hover:not(.game-upload-disabled) {
  border-color: var(--base-solid-primary);
  background: var(--base-alpha-primary-10);
}

.game-upload-text {
  margin: 0;
  color: var(--game-text-secondary);
  font-size: 0.875rem;
}

.game-upload-link {
  color: var(--base-solid-primary);
  text-decoration: underline;
  cursor: pointer;
}

.game-upload-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.game-upload-button-wrapper {
  /* Reset button styles */
  display: inline-block;
  padding: 0;
  border: none;
  background: transparent;
  font: inherit;
  color: inherit;
  cursor: pointer;
}

.game-upload-button-wrapper:disabled {
  cursor: not-allowed;
}
</style>
