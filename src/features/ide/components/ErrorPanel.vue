<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import { GameIcon } from '@/shared/components/ui'

/**
 * ErrorPanel component - Displays runtime errors in a compact footer panel.
 */
defineOptions({
  name: 'ErrorPanel',
})

defineProps<{
  errors?: Array<{
    line: number
    message: string
    type: string
    stack?: string
    sourceLine?: string
  }>
}>()

const { t } = useI18n()
</script>

<template>
  <div v-if="errors && errors.length > 0" class="error-panel">
    <div class="error-panel-list">
      <div v-for="(error, index) in errors" :key="index" class="error-block">
        <div class="error-line">
          <GameIcon icon="mdi:alert" size="small" />
          <span class="error-type">{{ error.type }}:</span>
          <span class="error-message">{{ error.message }}</span>
          <span v-if="error.line > 0" class="error-line-number">
            ({{ t('ide.output.errorLine', { line: error.line }) }})
          </span>
        </div>
        <div v-if="error.sourceLine" class="error-source-line">
          <span class="error-source-label">{{ t('ide.errorPanel.sourceLabel') }}</span>
          <code>{{ error.sourceLine }}</code>
        </div>
        <details v-if="error.stack" class="error-stack-details">
          <summary>Stack trace</summary>
          <pre class="error-stack">{{ error.stack }}</pre>
        </details>
      </div>
    </div>
  </div>
</template>

<style scoped>
.error-panel {
  flex-shrink: 0;
  border-top: 1px solid var(--game-surface-border);
  background: var(--game-surface-bg-gradient);
  max-height: 12rem;
  overflow-y: auto;
  padding: 0.5rem 1rem;
}

.error-panel-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.error-block {
  font-size: 0.85rem;
}

.error-line {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: var(--semantic-solid-danger);
}

.error-type {
  font-weight: bold;
  text-transform: uppercase;
}

.error-message {
  flex: 1;
  min-width: 0;
}

.error-line-number {
  color: var(--semantic-solid-danger);
  opacity: 0.8;
  font-size: 0.8rem;
  font-style: italic;
  flex-shrink: 0;
}

.error-source-line {
  margin-top: 0.25rem;
  margin-left: 1.5rem;
  font-size: 0.8rem;
  color: var(--game-text-primary);
}

.error-source-label {
  margin-right: 0.25rem;
  font-style: italic;
  opacity: 0.9;
}

.error-source-line code {
  background: var(--game-surface-bg-start);
  padding: 0.1rem 0.25rem;
  border-radius: 2px;
  font-family: var(--game-font-family-mono);
}

.error-stack-details {
  margin-top: 0.25rem;
  margin-left: 1.5rem;
  font-size: 0.75rem;
  color: var(--game-text-primary);
  opacity: 0.9;
}

.error-stack-details summary {
  cursor: pointer;
  user-select: none;
}

.error-stack {
  margin: 0.25rem 0 0;
  padding: 0.5rem;
  overflow: auto;
  background: var(--game-surface-bg-start);
  border-radius: 2px;
  white-space: pre-wrap;
  word-break: break-all;
  font-size: 0.7rem;
  max-height: 8rem;
}
</style>
