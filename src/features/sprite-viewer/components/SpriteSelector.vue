<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { useSpriteViewerStore } from '@/features/sprite-viewer/composables/useSpriteViewerStore'
import { GameSelect } from '@/shared/components/ui'
import { CHARACTER_SPRITES } from '@/shared/data/sprites'

/**
 * SpriteSelector component - Dropdown selector for choosing character sprites.
 */
defineOptions({
  name: 'SpriteSelector',
})

const { t } = useI18n()

const store = useSpriteViewerStore()

const selectOptions = computed(() => {
  return CHARACTER_SPRITES.map((sprite, index) => ({
    label: sprite.name,
    value: index,
  }))
})
</script>

<template>
  <div class="control-group">
    <label for="sprite-selection">{{ t('spriteViewer.controls.spriteSelection') }}</label>
    <GameSelect
      :model-value="store.selectedIndex.value"
      @update:model-value="store.setSelectedIndex(Number($event))"
      :options="selectOptions"
      :placeholder="t('spriteViewer.controls.placeholder')"
    />
  </div>
</template>

<style scoped>
.control-group {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  margin-bottom: 1.5rem;
}

.control-group label {
  font-weight: 600;
  color: var(--game-text-secondary);
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
</style>
