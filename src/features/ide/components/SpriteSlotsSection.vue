<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import type { SpriteState } from '@/core/sprite/types'

defineOptions({
  name: 'SpriteSlotsSection',
})

defineProps<{
  spriteStates: SpriteState[]
  spriteEnabled: boolean
}>()

const { t } = useI18n()
</script>

<template>
  <div class="sprite-slots-section">
    <div class="sprite-slots-title">{{ t('ide.bufferInspector.spriteSlotsTitle') }}</div>
    <div v-if="!spriteEnabled" class="sprite-slots-disabled">
      {{ t('ide.bufferInspector.spriteSlotsDisabled') }}
    </div>
    <table v-else class="sprite-slots-table">
      <thead>
        <tr>
          <th class="sprite-slots-header-cell">{{ t('ide.bufferInspector.spriteSlotsColNumber') }}</th>
          <th class="sprite-slots-header-cell">{{ t('ide.bufferInspector.spriteSlotsColX') }}</th>
          <th class="sprite-slots-header-cell">{{ t('ide.bufferInspector.spriteSlotsColY') }}</th>
          <th class="sprite-slots-header-cell">{{ t('ide.bufferInspector.spriteSlotsColVisible') }}</th>
          <th class="sprite-slots-header-cell">{{ t('ide.bufferInspector.spriteSlotsColPriority') }}</th>
          <th class="sprite-slots-header-cell">{{ t('ide.bufferInspector.spriteSlotsColDefinition') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="sprite in spriteStates" :key="sprite.spriteNumber" class="sprite-slots-row">
          <td class="sprite-slots-cell sprite-slots-cell-number">{{ sprite.spriteNumber }}</td>
          <td class="sprite-slots-cell sprite-slots-cell-x">{{ sprite.x }}</td>
          <td class="sprite-slots-cell sprite-slots-cell-y">{{ sprite.y }}</td>
          <td class="sprite-slots-cell sprite-slots-cell-visible">
            {{ sprite.visible ? t('ide.bufferInspector.spriteSlotsOn') : t('ide.bufferInspector.spriteSlotsOff') }}
          </td>
          <td class="sprite-slots-cell sprite-slots-cell-priority">{{ sprite.priority }}</td>
          <td class="sprite-slots-cell sprite-slots-cell-definition">
            {{
              sprite.definition
                ? t('ide.bufferInspector.spriteSlotsDefined')
                : t('ide.bufferInspector.spriteSlotsNone')
            }}
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.sprite-slots-section {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.sprite-slots-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--game-text-secondary);
}

.sprite-slots-disabled {
  font-size: 0.75rem;
  color: var(--game-text-tertiary);
  font-style: italic;
}

.sprite-slots-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.7rem;
  font-variant-numeric: tabular-nums;
}

.sprite-slots-header-cell {
  text-align: left;
  padding: 0.15rem 0.35rem;
  color: var(--game-text-secondary);
  font-weight: 600;
  border-bottom: 1px solid var(--game-surface-border);
}

.sprite-slots-cell {
  padding: 0.1rem 0.35rem;
  white-space: nowrap;
}

.sprite-slots-row:nth-child(even) {
  background: var(--game-surface-bg-start);
}
</style>
