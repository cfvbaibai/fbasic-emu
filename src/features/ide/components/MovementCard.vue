<script setup lang="ts">
import { GameIcon } from '@/shared/components/ui'
import { MoveCharacterCode } from '@/shared/data/types'

/** Single movement slot data for display in StateInspector */
export interface MovementSlotData {
  actionNumber: number
  hasData: boolean
  x: number
  y: number
  isActive: boolean
  remainingDistance: number
  totalDistance: number
  direction: number
  speed: number
  priority: number
  characterType: number
  colorCombination: number
}

defineOptions({
  name: 'MovementCard',
})

defineProps<{
  slot: MovementSlotData
}>()

/** Direction 0–8 as MDI arrow icon names (0=none, 1=up … 8=up-left). */
const DIRECTION_ICONS: Record<number, string> = {
  0: 'mdi:circle-outline',
  1: 'mdi:arrow-up',
  2: 'mdi:arrow-top-right',
  3: 'mdi:arrow-right',
  4: 'mdi:arrow-bottom-right',
  5: 'mdi:arrow-down',
  6: 'mdi:arrow-bottom-left',
  7: 'mdi:arrow-left',
  8: 'mdi:arrow-top-left',
}

const DIRECTION_NAMES: Record<number, string> = {
  0: 'none',
  1: 'up',
  2: 'up-right',
  3: 'right',
  4: 'down-right',
  5: 'down',
  6: 'down-left',
  7: 'left',
  8: 'up-left',
}

function directionIcon(dir: number): string {
  return DIRECTION_ICONS[dir] ?? 'mdi:circle-outline'
}

function directionTitle(dir: number): string {
  return DIRECTION_NAMES[dir] ?? `dir ${dir}`
}

function characterTypeLabel(code: number): string {
  const name = MoveCharacterCode[code as MoveCharacterCode]
  return name ?? String(code)
}
</script>

<template>
  <div class="card move-card">
    <div class="move-card-header">
      <span class="move-card-id" title="Action number">
        <span>{{ slot.actionNumber }}</span>
      </span>
      <template v-if="slot.hasData">
        <span
          class="move-card-char"
          :title="characterTypeLabel(slot.characterType)"
        >
          {{ characterTypeLabel(slot.characterType).slice(0, 5) }}
        </span>
        <span class="move-card-status" :title="slot.isActive ? 'Active' : 'Paused'">
          <GameIcon
            :icon="slot.isActive ? 'mdi:play' : 'mdi:pause'"
            size="small"
            class="move-card-icon"
          />
        </span>
        <span
          class="move-card-dir"
          :title="directionTitle(slot.direction)"
          :aria-label="`direction ${directionTitle(slot.direction)}`"
        >
          <GameIcon
            :icon="directionIcon(slot.direction)"
            size="small"
            class="move-card-icon"
          />
        </span>
      </template>
    </div>
    <div class="move-card-body">
      <div class="move-card-cell">
        <GameIcon
          v-if="slot.hasData"
          icon="mdi:crosshairs-gps"
          size="small"
          class="move-card-icon"
        />
        <span class="move-card-value">
          {{ slot.hasData ? `${slot.x},${slot.y}` : '' }}
        </span>
      </div>
      <div class="move-card-cell move-card-cell-left">
        <GameIcon
          v-if="slot.hasData"
          icon="mdi:ruler"
          size="small"
          class="move-card-icon"
        />
        <span class="move-card-value">
          {{ slot.hasData ? Math.round(slot.remainingDistance) : '' }}
        </span>
      </div>
      <div class="move-card-cell move-card-cell-right">
        <GameIcon
          v-if="slot.hasData"
          icon="mdi:speedometer"
          size="small"
          class="move-card-icon"
        />
        <span class="move-card-value">{{ slot.hasData ? slot.speed : '' }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.move-card {
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.3rem 0.6rem 0.5rem;
  font-variant-numeric: tabular-nums;
}

.move-card-header {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  border-bottom: 1px solid var(--game-surface-border);
}

.move-card-id {
  display: inline-flex;
  align-items: center;
  gap: 0.2rem;
  font-weight: 700;
}

.move-card-char {
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.02em;
  color: var(--game-text-secondary);
  padding: 0.1rem 0.25rem;
  background: var(--game-surface-bg-start);
  border-radius: 3px;
}

.move-card-dir {
  font-size: 1.1em;
  font-weight: 700;
  min-width: 1em;
  text-align: center;
  display: flex;
  align-items: center;
}

.move-card-header .move-card-status {
  flex: 1;
  display: flex;
  justify-content: center;
  font-weight: 600;
}

.move-card-body {
  display: grid;
  grid-template-columns: 3fr 2fr 2fr;
  gap: 0.25rem 0.5rem;
}

.move-card-cell {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  min-height: 1.2rem;
}

.move-card-cell-left {
  justify-content: flex-start;
}

.move-card-cell-right {
  justify-content: flex-end;
}

.move-card-icon {
  flex-shrink: 0;
  color: var(--game-text-secondary);
}

.move-card-value {
  font-size: 0.85rem;
  min-width: 0;
}
</style>
