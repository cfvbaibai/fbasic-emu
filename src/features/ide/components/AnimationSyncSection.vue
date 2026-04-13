<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { ACK_PENDING, SyncCommandType } from '@/core/animation/sharedDisplayBuffer'
import type { SyncCommand } from '@/core/animation/sharedDisplayBufferAccessor'

defineOptions({
  name: 'AnimationSyncSection',
})

const props = defineProps<{
  syncCommand: SyncCommand | null
  ackStatus: number
}>()

const { t } = useI18n()

const COMMAND_TYPE_KEYS: Record<SyncCommandType, string> = {
  [SyncCommandType.NONE]: 'ide.bufferInspector.animationSyncCommandTypeNone',
  [SyncCommandType.START_MOVEMENT]:
    'ide.bufferInspector.animationSyncCommandTypeStartMovement',
  [SyncCommandType.STOP_MOVEMENT]:
    'ide.bufferInspector.animationSyncCommandTypeStopMovement',
  [SyncCommandType.ERASE_MOVEMENT]:
    'ide.bufferInspector.animationSyncCommandTypeEraseMovement',
  [SyncCommandType.SET_POSITION]:
    'ide.bufferInspector.animationSyncCommandTypeSetPosition',
  [SyncCommandType.CLEAR_ALL_MOVEMENTS]:
    'ide.bufferInspector.animationSyncCommandTypeClearAllMovements',
}

function commandTypeName(type: SyncCommandType): string {
  return t(COMMAND_TYPE_KEYS[type])
}

interface SyncRow {
  field: string
  value: string
}

const rows = computed<SyncRow[]>(() => {
  if (!props.syncCommand) return []
  const cmd = props.syncCommand
  return [
    {
      field: t('ide.bufferInspector.animationSyncFieldType'),
      value: commandTypeName(cmd.commandType),
    },
    {
      field: t('ide.bufferInspector.animationSyncFieldAction'),
      value: String(cmd.actionNumber),
    },
    {
      field: t('ide.bufferInspector.animationSyncFieldStartX'),
      value: String(cmd.params.startX),
    },
    {
      field: t('ide.bufferInspector.animationSyncFieldStartY'),
      value: String(cmd.params.startY),
    },
    {
      field: t('ide.bufferInspector.animationSyncFieldDirection'),
      value: String(cmd.params.direction),
    },
    {
      field: t('ide.bufferInspector.animationSyncFieldSpeed'),
      value: String(cmd.params.speed),
    },
    {
      field: t('ide.bufferInspector.animationSyncFieldDistance'),
      value: String(cmd.params.distance),
    },
    {
      field: t('ide.bufferInspector.animationSyncFieldPriority'),
      value: String(cmd.params.priority),
    },
    {
      field: t('ide.bufferInspector.animationSyncFieldAck'),
      value: props.ackStatus === ACK_PENDING
        ? t('ide.bufferInspector.animationSyncAckPending')
        : t('ide.bufferInspector.animationSyncAckReceived'),
    },
  ]
})
</script>

<template>
  <div class="animation-sync-section">
    <div class="animation-sync-title">{{ t('ide.bufferInspector.animationSyncTitle') }}</div>
    <div v-if="!syncCommand" class="animation-sync-idle">
      {{ t('ide.bufferInspector.animationSyncIdle') }}
    </div>
    <table v-else class="animation-sync-table">
      <thead>
        <tr>
          <th class="sync-hdr">{{ t('ide.bufferInspector.animationSyncColField') }}</th>
          <th class="sync-hdr">{{ t('ide.bufferInspector.animationSyncColValue') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in rows" :key="row.field" class="sync-row">
          <td class="sync-cell">{{ row.field }}</td>
          <td class="sync-cell">{{ row.value }}</td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.animation-sync-section {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.animation-sync-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--game-text-secondary);
}

.animation-sync-idle {
  font-size: 0.75rem;
  color: var(--game-text-tertiary);
  font-style: italic;
}

.animation-sync-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.7rem;
  font-variant-numeric: tabular-nums;
}

.sync-hdr {
  text-align: left;
  padding: 0.15rem 0.35rem;
  color: var(--game-text-secondary);
  font-weight: 600;
  border-bottom: 1px solid var(--game-surface-border);
}

.sync-cell {
  padding: 0.1rem 0.35rem;
  white-space: nowrap;
}

.sync-row:nth-child(odd) {
  background: var(--game-surface-bg-start);
}
</style>
