<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import type { BasicVariable } from '@/core/types/state-types'
import { GameIcon, GameTabPane, GameTag } from '@/shared/components/ui'

/**
 * VariablesTab component - Displays variables in a tab pane format.
 */
defineOptions({
  name: 'VariablesTab',
})

const props = defineProps<{
  variables: Record<string, BasicVariable>
}>()

const { t } = useI18n()

const variableCount = computed(() => Object.keys(props.variables).length)
const hasVariables = computed(() => variableCount.value > 0)
</script>

<template>
  <GameTabPane name="variables" :disabled="!hasVariables">
    <template #label>
      <GameIcon icon="mdi:view-dashboard" size="small" />
      <span>{{ t('ide.output.variables') }}</span>
      <span class="tab-status-tag">
        <GameTag :class="{ 'tag-hidden': !hasVariables }" type="success" size="small">
          {{ variableCount }}
        </GameTag>
      </span>
    </template>

    <div class="tab-content">
      <div class="variables-content bg-game-surface">
        <div class="variable-list">
          <div v-for="(variable, name) in variables" :key="name" class="variable-item">
            <span class="variable-name">{{ name }}</span>
            <span class="variable-value bg-game-surface border-game-surface text-game-primary">{{
              variable.value
            }}</span>
          </div>
        </div>
      </div>
    </div>
  </GameTabPane>
</template>

<style scoped>
.tab-content {
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
}

.tab-status-tag {
  display: inline-flex;
  align-items: center;
  margin-left: 0.25rem;
  vertical-align: middle;
  min-height: 1.5rem; /* Reserve vertical space */

  /* Reserve horizontal space - adjust based on typical tag width */
  min-width: 3rem;
  justify-content: flex-start;
}

.tab-status-tag :deep(.game-tag) {
  display: inline-flex;
  align-items: center;
  white-space: nowrap;
}

.tab-status-tag :deep(.game-tag.tag-hidden) {
  visibility: hidden;
  opacity: 0;
  pointer-events: none;

  /* Keep dimensions to prevent layout shift */
}

.variables-content {
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
}

.variable-list {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 0.5rem;
}

.variable-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  border-radius: 6px;
  font-family: var(--game-font-family-mono);
  font-size: 0.9rem;
  box-shadow: 0 2px 4px var(--base-alpha-gray-00-20);
  transition: all 0.2s ease;
}

.variable-item:hover {
  border-color: var(--base-solid-primary);
  box-shadow: 0 0 8px var(--game-accent-glow);
}

.variable-name {
  font-weight: bold;
}

.variable-value {
  padding: 0.2rem 0.4rem;
  border-radius: 4px;
  font-weight: 500;
  box-shadow: inset 0 1px 2px var(--base-alpha-gray-00-30);
}
</style>
