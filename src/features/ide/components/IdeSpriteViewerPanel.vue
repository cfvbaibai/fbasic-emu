<script setup lang="ts">
import { onMounted, onUnmounted, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import ColorPaletteDisplay from '@/features/sprite-viewer/components/ColorPaletteDisplay.vue'
import DefStatements from '@/features/sprite-viewer/components/DefStatements.vue'
import PaletteCombinations from '@/features/sprite-viewer/components/PaletteCombinations.vue'
import SpriteControls from '@/features/sprite-viewer/components/SpriteControls.vue'
import SpriteGrid from '@/features/sprite-viewer/components/SpriteGrid.vue'
import { provideSpriteViewerStore } from '@/features/sprite-viewer/composables/useSpriteViewerStore'
import { GameIconButton } from '@/shared/components/ui'
import GameIcon from '@/shared/components/ui/GameIcon.vue'

/**
 * IdeSpriteViewerPanel - Slide-out side panel for viewing character sprites.
 * Embeds the sprite viewer components within the IDE context.
 */
defineOptions({
  name: 'IdeSpriteViewerPanel',
})

const emit = defineEmits<{
  (e: 'close'): void
}>()

const { t } = useI18n()

// Provide the store to all child components
provideSpriteViewerStore()

const panelRef = useTemplateRef<HTMLDivElement>('panelRef')

// Close on Escape key
function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    e.preventDefault()
    emit('close')
  }
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

function closePanel() {
  emit('close')
}
</script>

<template>
  <div class="sprite-viewer-overlay" @click.self="closePanel">
    <div
      ref="panelRef"
      class="sprite-viewer-panel"
      role="dialog"
      aria-modal="true"
      :aria-label="t('ide.spriteViewer.title')"
    >
      <div class="sprite-viewer-header">
        <div class="sprite-viewer-title">
          <GameIcon icon="mdi:eye" :size="20" />
          <span>{{ t('ide.spriteViewer.title') }}</span>
        </div>
        <GameIconButton
          type="default"
          icon="mdi:close"
          size="small"
          :title="t('ide.spriteViewer.close')"
          @click="closePanel"
        />
      </div>

      <div class="sprite-viewer-content">
        <SpriteControls />
        <SpriteGrid />
        <DefStatements />
        <ColorPaletteDisplay />
        <PaletteCombinations />
      </div>
    </div>
  </div>
</template>

<style scoped>
.sprite-viewer-overlay {
  position: fixed;
  inset: 0;
  z-index: 1100;
  display: flex;
  justify-content: flex-end;
  background: var(--base-alpha-gray-00-60);
  backdrop-filter: blur(2px);
}

.sprite-viewer-panel {
  width: min(520px, 90vw);
  height: 100%;
  display: flex;
  flex-direction: column;
  border-left: 2px solid var(--game-surface-border);
  background: var(--game-surface-bg-gradient);
  box-shadow: -4px 0 16px var(--base-alpha-gray-00-40);
}

.sprite-viewer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--game-surface-border);
  flex-shrink: 0;
}

.sprite-viewer-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 700;
  color: var(--game-text-primary);
}

.sprite-viewer-content {
  flex: 1 1 0;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
}
</style>
