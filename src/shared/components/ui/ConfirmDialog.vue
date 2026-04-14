<script setup lang="ts">
/**
 * ConfirmDialog component - A reusable styled confirmation dialog.
 * Follows the same design language as InputModal.
 *
 * @example
 * ```vue
 * <ConfirmDialog
 *   :visible="showDialog"
 *   :title="t('common.confirmDialog.title')"
 *   :message="t('common.confirmDialog.message')"
 *   @confirm="handleConfirm"
 *   @cancel="handleCancel"
 * />
 * ```
 */

import { nextTick, onMounted, onUnmounted, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import type { ConfirmDialogEmits, ConfirmDialogProps } from './ConfirmDialog.types'

const props = withDefaults(defineProps<ConfirmDialogProps>(), {
  confirmLabel: undefined,
  cancelLabel: undefined,
})

const emit = defineEmits<ConfirmDialogEmits>()

const { t } = useI18n()
const confirmButtonRef = useTemplateRef<HTMLButtonElement>('confirmButtonRef')

watch(
  () => props.visible,
  (visible) => {
    if (visible) {
      void nextTick(() => {
        confirmButtonRef.value?.focus()
      })
    }
  },
)


function handleConfirm(): void {
  emit('confirm')
}

function handleCancel(): void {
  emit('cancel')
}

function handleOverlayClick(e: MouseEvent): void {
  if (e.target === e.currentTarget) {
    handleCancel()
  }
}

function handleKeydown(e: KeyboardEvent): void {
  if (!props.visible) return
  if (e.key === 'Escape') {
    e.preventDefault()
    handleCancel()
  } else if (e.key === 'Enter') {
    e.preventDefault()
    handleConfirm()
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <div
    v-if="visible"
    class="confirm-dialog-overlay"
    role="dialog"
    aria-modal="true"
    :aria-labelledby="title ? 'confirm-dialog-title' : undefined"
    :aria-describedby="message ? 'confirm-dialog-message' : undefined"
    @click="handleOverlayClick"
  >
    <div class="confirm-dialog">
      <h3
        v-if="title"
        id="confirm-dialog-title"
        class="confirm-dialog-title"
      >
        {{ title }}
      </h3>
      <p
        v-if="message"
        id="confirm-dialog-message"
        class="confirm-dialog-message"
      >
        {{ message }}
      </p>
      <div class="confirm-dialog-actions">
        <button
          ref="confirmButtonRef"
          class="confirm-dialog-btn confirm-dialog-btn-confirm"
          @click="handleConfirm"
        >
          {{ confirmLabel ?? t('common.confirmDialog.confirm') }}
        </button>
        <button
          class="confirm-dialog-btn confirm-dialog-btn-cancel"
          @click="handleCancel"
        >
          {{ cancelLabel ?? t('common.confirmDialog.cancel') }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.confirm-dialog-overlay {
  position: fixed;
  inset: 0;
  z-index: var(--z-index-dialog-overlay);
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--base-alpha-gray-00-60);
}

.confirm-dialog {
  background: var(--game-surface-bg-gradient);
  border: 2px solid var(--game-surface-border);
  border-radius: 12px;
  padding: 1.5rem;
  min-width: 320px;
  max-width: 90vw;
  box-shadow: var(--game-shadow-base);
}

.confirm-dialog-title {
  margin: 0 0 0.5rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--game-text-primary);
}

.confirm-dialog-message {
  margin: 0 0 1rem;
  font-size: 1rem;
  color: var(--game-text-primary);
  line-height: 1.5;
}

.confirm-dialog-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
}

.confirm-dialog-btn {
  padding: 0.5rem 1rem;
  border: 1px solid var(--game-surface-border);
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.confirm-dialog-btn:focus-visible {
  outline: 2px solid var(--base-solid-primary);
  outline-offset: 2px;
}

.confirm-dialog-btn-confirm {
  background: var(--base-solid-primary);
  color: var(--game-text-contrast);
  border-color: var(--base-solid-primary);
}

.confirm-dialog-btn-confirm:hover {
  opacity: 0.9;
}

.confirm-dialog-btn-cancel {
  background: transparent;
  color: var(--game-text-secondary);
}

.confirm-dialog-btn-cancel:hover {
  background: var(--game-surface-bg-start);
}
</style>
