<script setup lang="ts">
import { onMounted, reactive, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { GameBlock, GameIcon } from '@/shared/components/ui'
import {
  getLogLevelName,
  LOG_LEVEL_NAMES,
  LOGGER_REGISTRY,
  type LogLevelName,
  setLogLevelByName,
} from '@/shared/logger'

defineOptions({
  name: 'LogLevelPanel',
})

const props = withDefaults(
  defineProps<{
    /** When true, sync level state from loggers (e.g. after panel opens). */
    open?: boolean
  }>(),
  { open: false }
)

const { t } = useI18n()

/** Current level per logger key. */
const levels = reactive<Record<string, LogLevelName>>(
  Object.fromEntries(LOGGER_REGISTRY.map(e => [e.key, getLogLevelName(e.key)]))
)

function refreshLevels(): void {
  for (const entry of LOGGER_REGISTRY) {
    levels[entry.key] = getLogLevelName(entry.key)
  }
}

function onLevelChange(key: string, level: LogLevelName): void {
  setLogLevelByName(key, level)
  levels[key] = level
}

function handleSelectChange(key: string, event: Event): void {
  const value = (event.target as HTMLSelectElement).value as LogLevelName
  onLevelChange(key, value)
}

onMounted(refreshLevels)

watch(() => props.open, (open: boolean) => open && refreshLevels())
</script>

<template>
  <div class="log-level-panel">
    <GameBlock :title="t('ide.logLevels.title')" title-icon="mdi:format-list-bulleted-type" class="panel-block">
      <template #right>
        <GameIcon icon="mdi:information-outline" size="small" />
      </template>
      <p class="panel-description">
        {{ t('ide.logLevels.description') }}
      </p>
      <div class="logger-list">
        <div v-for="entry in LOGGER_REGISTRY" :key="entry.key" class="logger-row">
          <div class="logger-info">
            <span class="logger-name">{{ entry.name }}</span>
            <span class="logger-desc">{{ entry.description }}</span>
          </div>
          <select
            :key="`${entry.key}-${levels[entry.key] ?? 'warn'}`"
            :value="levels[entry.key] ?? 'warn'"
            class="level-select"
            :aria-label="t('ide.logLevels.ariaLabelFor', { name: entry.name })"
            @change="handleSelectChange(entry.key, $event)"
          >
            <option v-for="name in LOG_LEVEL_NAMES" :key="name" :value="name">
              {{ name }}
            </option>
          </select>
        </div>
      </div>
    </GameBlock>
  </div>
</template>

<style scoped>
.log-level-panel {
  min-width: 320px;
  max-width: 420px;
}

.panel-block {
  border: 2px solid var(--game-surface-border);
  box-shadow: var(--game-shadow-base);
}

.panel-description {
  margin: 0 0 0.75rem;
  font-size: 0.8rem;
  color: var(--game-text-secondary);
  line-height: 1.3;
}

.panel-description strong {
  color: var(--game-text-primary);
}

.logger-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.logger-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.35rem 0;
  border-bottom: 1px solid var(--base-alpha-gray-00-20);
}

.logger-row:last-child {
  border-bottom: none;
}

.logger-info {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.logger-name {
  font-weight: 600;
  font-size: 0.85rem;
  color: var(--game-text-primary);
}

.logger-desc {
  font-size: 0.7rem;
  color: var(--game-text-secondary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.level-select {
  flex-shrink: 0;
  width: 6.5rem;
  padding: 0.35rem 0.5rem;
  font-size: 0.8rem;
  font-family: var(--game-font-family-mono);
  color: var(--game-text-primary);
  background: var(--game-surface-bg-gradient);
  border: 2px solid var(--game-surface-border);
  border-radius: 6px;
  cursor: pointer;

  /* Dark dropdown list where supported */
  color-scheme: dark;
}

.level-select:focus {
  outline: none;
  border-color: var(--base-solid-primary);
}

.level-select option {
  background: var(--base-solid-gray-10);
  color: var(--base-solid-gray-100);
}
</style>
