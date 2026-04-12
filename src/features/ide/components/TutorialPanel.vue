<script setup lang="ts">
import { onMounted, onUnmounted, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import { GameIconButton } from '@/shared/components/ui'
import GameIcon from '@/shared/components/ui/GameIcon.vue'

defineOptions({
  name: 'TutorialPanel',
})

const props = withDefaults(
  defineProps<{
    visible?: boolean
    lessonTitle?: string
    hasPrev?: boolean
    hasNext?: boolean
  }>(),
  {
    visible: false,
    lessonTitle: '',
    hasPrev: false,
    hasNext: false,
  },
)

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'prev'): void
  (e: 'next'): void
}>()

const { t } = useI18n()

const panelRef = useTemplateRef<HTMLDivElement>('panelRef')

function closePanel(): void {
  emit('close')
}

function handlePrev(): void {
  emit('prev')
}

function handleNext(): void {
  emit('next')
}

function handleKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape') {
    e.preventDefault()
    closePanel()
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
    v-if="props.visible"
    ref="panelRef"
    class="tutorial-panel"
    role="complementary"
    :aria-label="t('ide.tutorial.title')"
  >
    <div class="tutorial-panel-header">
      <div class="tutorial-panel-title">
        <GameIcon icon="mdi:book-open-variant" :size="18" />
        <span class="tutorial-panel-title-text">
          {{ props.lessonTitle || t('ide.tutorial.defaultTitle') }}
        </span>
      </div>
      <GameIconButton
        type="default"
        icon="mdi:close"
        size="small"
        data-testid="tutorial-close-button"
        :title="t('ide.tutorial.closeAriaLabel')"
        @click="closePanel"
      />
    </div>

    <div
      class="tutorial-panel-content"
      data-testid="tutorial-content-area"
    >
      <slot>
        <p class="tutorial-panel-placeholder">{{ t('ide.tutorial.noContent') }}</p>
      </slot>
    </div>

    <div class="tutorial-panel-nav">
      <GameIconButton
        type="default"
        icon="mdi:chevron-left"
        size="small"
        data-testid="tutorial-prev-button"
        :disabled="!props.hasPrev"
        :title="t('ide.tutorial.prev')"
        @click="handlePrev"
      />
      <GameIconButton
        type="default"
        icon="mdi:chevron-right"
        size="small"
        data-testid="tutorial-next-button"
        :disabled="!props.hasNext"
        :title="t('ide.tutorial.next')"
        @click="handleNext"
      />
    </div>
  </div>
</template>

<style scoped>
.tutorial-panel {
  display: flex;
  flex-direction: column;
  width: 320px;
  min-width: 240px;
  max-width: 400px;
  height: 100%;
  border-left: 1px solid var(--game-surface-border);
  background: var(--game-surface-bg-gradient);
}

.tutorial-panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.625rem 0.75rem;
  border-bottom: 1px solid var(--game-surface-border);
  flex-shrink: 0;
}

.tutorial-panel-title {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  color: var(--game-text-primary);
  font-size: 0.875rem;
  font-weight: 600;
  overflow: hidden;
}

.tutorial-panel-title-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tutorial-panel-content {
  flex: 1 1 0;
  overflow-y: auto;
  padding: 0.75rem;
  min-height: 0;
}

.tutorial-panel-placeholder {
  color: var(--game-text-tertiary);
  font-style: italic;
  font-size: 0.85rem;
}

.tutorial-panel-nav {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.5rem 0.75rem;
  border-top: 1px solid var(--game-surface-border);
  flex-shrink: 0;
}
</style>
