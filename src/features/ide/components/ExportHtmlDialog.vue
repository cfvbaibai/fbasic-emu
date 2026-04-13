<script setup lang="ts">
/**
 * ExportHtmlDialog - Modal dialog for exporting an F-BASIC program as a standalone HTML file.
 *
 * Provides options for page title, theme selection, and toggling sound/sprite inclusion.
 * Uses the useHtmlExporter composable to trigger the actual export.
 */

import { onMounted, onUnmounted, ref, toRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import type { CompactBg } from '@/core/types/program-types'
import { useHtmlExporter } from '@/features/ide/composables/useHtmlExporter'

const props = withDefaults(defineProps<{
  visible: boolean
  source: string
  bg?: CompactBg
}>(), {
  bg: undefined,
})

const emit = defineEmits<{
  (e: 'close'): void
}>()

const { t } = useI18n()

// Composable
const { isExporting, exportError, exportHtml } = useHtmlExporter(
  toRef(props, 'source'),
  toRef(props, 'bg'),
)

// Export options state
const title = ref('')
const theme = ref<'dark' | 'light'>('dark')
const includeSound = ref(true)
const includeSprites = ref(true)

// Reset state when dialog opens
watch(
  () => props.visible,
  (visible) => {
    if (!visible) return

    title.value = ''
    theme.value = 'dark'
    includeSound.value = true
    includeSprites.value = true
    exportError.value = ''
  },
)

function handleClose(): void {
  emit('close')
}

function handleOverlayClick(e: MouseEvent): void {
  if (e.target === e.currentTarget) {
    handleClose()
  }
}

function handleKeydown(e: KeyboardEvent): void {
  if (!props.visible) return
  if (e.key === 'Escape') {
    e.preventDefault()
    handleClose()
  }
}

async function handleExport(): Promise<void> {
  await exportHtml({
    title: title.value,
    theme: theme.value,
    includeSound: includeSound.value,
    includeSprites: includeSprites.value,
  })
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible"
      class="game-dialog-overlay"
      role="dialog"
      aria-modal="true"
      :aria-label="t('ide.exportHtml.title')"
      @click="handleOverlayClick"
    >
      <div class="game-dialog">
        <h3 class="game-dialog-title">
          {{ t('ide.exportHtml.title') }}
        </h3>

        <p class="game-dialog-description">
          {{ t('ide.exportHtml.description') }}
        </p>

        <!-- Exporting state -->
        <div
          v-if="isExporting"
          data-testid="export-html-exporting"
          class="game-dialog-loading"
        >
          {{ t('ide.exportHtml.exporting') }}
        </div>

        <!-- Error state -->
        <div
          v-else-if="exportError"
          data-testid="export-html-error"
          class="game-dialog-error"
        >
          {{ t('ide.exportHtml.exportFailed') }}
        </div>

        <!-- Form -->
        <template v-else>
          <!-- Title input -->
          <div class="export-html-dialog-field">
            <label
              for="export-html-title"
              class="export-html-dialog-label"
            >
              {{ t('ide.exportHtml.titleLabel') }}
            </label>
            <input
              id="export-html-title"
              v-model="title"
              type="text"
              class="export-html-dialog-input"
              data-testid="export-html-title-input"
            />
          </div>

          <!-- Theme selection -->
          <fieldset class="export-html-dialog-fieldset">
            <legend class="export-html-dialog-label">
              {{ t('ide.exportHtml.themeLabel') }}
            </legend>
            <div class="export-html-dialog-radio-group">
              <label class="export-html-dialog-radio-label">
                <input
                  v-model="theme"
                  type="radio"
                  value="dark"
                  data-testid="export-html-theme-dark"
                />
                {{ t('ide.exportHtml.themeDark') }}
              </label>
              <label class="export-html-dialog-radio-label">
                <input
                  v-model="theme"
                  type="radio"
                  value="light"
                  data-testid="export-html-theme-light"
                />
                {{ t('ide.exportHtml.themeLight') }}
              </label>
            </div>
          </fieldset>

          <!-- Toggles -->
          <div class="export-html-dialog-toggles">
            <label class="export-html-dialog-toggle-label">
              <input
                v-model="includeSound"
                type="checkbox"
                data-testid="export-html-include-sound"
              />
              {{ t('ide.exportHtml.includeSound') }}
            </label>
            <label class="export-html-dialog-toggle-label">
              <input
                v-model="includeSprites"
                type="checkbox"
                data-testid="export-html-include-sprites"
              />
              {{ t('ide.exportHtml.includeSprites') }}
            </label>
          </div>

          <!-- Actions -->
          <div class="game-dialog-actions">
            <button
              class="game-dialog-btn game-dialog-btn-primary"
              data-testid="export-html-export-button"
              @click="handleExport"
            >
              {{ t('ide.exportHtml.exportButton') }}
            </button>
            <button
              class="game-dialog-btn game-dialog-btn-secondary"
              data-testid="export-html-cancel-button"
              @click="handleClose"
            >
              {{ t('ide.exportHtml.cancelButton') }}
            </button>
          </div>
        </template>
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
@import url('@/shared/styles/dialog.css');

/* Export-html-specific: description has larger bottom margin */
.game-dialog-description {
  margin-bottom: 1rem;
}

/* Export-html-specific: form field */
.export-html-dialog-field {
  margin-bottom: 0.75rem;
}

.export-html-dialog-label {
  display: block;
  margin-bottom: 0.25rem;
  font-size: 0.8125rem;
  font-weight: 500;
  color: var(--game-text-secondary);
}

.export-html-dialog-input {
  width: 100%;
  padding: 0.5rem 0.625rem;
  font-size: 0.875rem;
  color: var(--game-text-primary);
  background: var(--game-surface-bg-start);
  border: 1px solid var(--game-surface-border);
  border-radius: 6px;
  outline: none;
  box-sizing: border-box;
}

.export-html-dialog-input:focus {
  border-color: var(--base-solid-primary);
  box-shadow: 0 0 0 2px var(--base-alpha-primary-20);
}

/* Export-html-specific: fieldset for theme selection */
.export-html-dialog-fieldset {
  margin: 0 0 0.75rem;
  border: none;
  padding: 0;
}

.export-html-dialog-radio-group {
  display: flex;
  gap: 1rem;
}

.export-html-dialog-radio-label {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  color: var(--game-text-primary);
  cursor: pointer;
}

/* Export-html-specific: toggle checkboxes */
.export-html-dialog-toggles {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.export-html-dialog-toggle-label {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  font-size: 0.875rem;
  color: var(--game-text-primary);
  cursor: pointer;
}
</style>
