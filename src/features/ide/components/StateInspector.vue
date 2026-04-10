<script setup lang="ts">
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import type { SharedDisplayBufferAccessor } from '@/core/animation/sharedDisplayBufferAccessor'
import type { SpriteState } from '@/core/sprite/types'
import type { ScreenCell } from '@/core/types/execution-types'
import { GameBlock, GameTabPane, GameTabs } from '@/shared/components/ui'
import { COLORS } from '@/shared/data/palette'

import ActivePaletteDisplay from './ActivePaletteDisplay.vue'
import MovementCard, { type MovementSlotData } from './MovementCard.vue'

defineOptions({
  name: 'StateInspector',
})

const props = withDefaults(
  defineProps<{
    screenBuffer?: ScreenCell[][]
    cursorX?: number
    cursorY?: number
    bgPalette?: number
    spritePalette?: number
    backdropColor?: number
    cgenMode?: number
    spriteStates?: SpriteState[]
    spriteEnabled?: boolean
    /** Shared display buffer accessor for reading sprite state */
    sharedDisplayBufferAccessor?: SharedDisplayBufferAccessor
  }>(),
  {
    screenBuffer: () => [],
    cursorX: 0,
    cursorY: 0,
    bgPalette: 1,
    spritePalette: 1,
    backdropColor: 0,
    cgenMode: 2,
    spriteStates: () => [],
    spriteEnabled: false,
  }
)

const { t } = useI18n()
const activeTab = ref('palettes')

function hexFor(index: number): string {
  const i = Math.max(0, Math.min(index, COLORS.length - 1))
  return COLORS[i] ?? '#000000'
}

// Import MAX_SPRITES from buffer constants (was MOVE_SLOT_COUNT = 8)
import { MAX_SPRITES } from '@/core/animation/sharedDisplayBuffer'
const MOVE_SLOT_COUNT = MAX_SPRITES

/** MOVE slot data - updated directly by animation loop (no reactivity needed) */
const moveSlots = ref<MovementSlotData[]>([])

/**
 * Update MOVE slot data from shared buffer.
 * Called by animation loop every frame with fresh data from the buffer.
 * This avoids Vue reactivity overhead - the animation loop is the source of truth.
 */
function updateMoveSlotsData(): void {
  const accessor = props.sharedDisplayBufferAccessor

  const slots: MovementSlotData[] = []
  for (let actionNumber = 0; actionNumber < MOVE_SLOT_COUNT; actionNumber++) {
    // Read all animation state from shared buffer via accessor
    const pos = accessor?.readSpritePosition(actionNumber)
    const x = pos?.x ?? 0
    const y = pos?.y ?? 0
    const isActive = accessor?.readSpriteIsActive(actionNumber) ?? false
    const remainingDistance = accessor?.readSpriteRemainingDistance(actionNumber) ?? 0
    const totalDistance = accessor?.readSpriteTotalDistance(actionNumber) ?? 0
    const direction = accessor?.readSpriteDirection(actionNumber) ?? 0
    const speed = accessor?.readSpriteSpeed(actionNumber) ?? 0
    const priority = accessor?.readSpritePriority(actionNumber) ?? 0
    const characterType = accessor?.readSpriteCharacterType(actionNumber) ?? 0
    const colorCombination = accessor?.readSpriteColorCombination(actionNumber) ?? 0

    // Show slot if: active moving, OR has non-zero position
    const hasData = Boolean(isActive || (accessor && (x !== 0 || y !== 0)))

    slots.push({
      actionNumber,
      hasData,
      x: Math.round(x),
      y: Math.round(y),
      isActive,
      remainingDistance,
      totalDistance,
      direction,
      speed,
      priority,
      characterType,
      colorCombination,
    })
  }

  moveSlots.value = slots
}

// Expose update function for animation loop to call
defineExpose({
  updateMoveSlotsData,
})
</script>

<template>
  <GameBlock :title="t('ide.stateInspector.title')" title-icon="mdi:eye" :hide-header="true" class="state-inspector">
    <div class="inspector-content">
      <GameTabs v-model="activeTab" type="border-card" class="inspector-tabs">
        <GameTabPane name="palettes" :label="t('ide.stateInspector.tabPalette')">
          <div class="tab-pane horizontal palettes-tab">
            <div class="palettes-row">
              <ActivePaletteDisplay :bg-palette="bgPalette" :sprite-palette="spritePalette" />
              <div class="extras">
                <span class="label">{{ t('ide.stateInspector.backdrop') }}:</span>
                <span
                  class="dot"
                  :style="{ backgroundColor: hexFor(backdropColor ?? 0) }"
                  :title="`${backdropColor ?? 0}`"
                />
                {{ backdropColor ?? 0 }}
                <span class="label">{{ t('ide.stateInspector.cgen') }}:</span>
                {{ cgenMode ?? 2 }}
              </div>
            </div>
          </div>
        </GameTabPane>

        <GameTabPane name="sprite" :label="t('ide.stateInspector.tabSprite')">
          <div class="tab-pane horizontal sprite-tab">
            <div class="meta-line">
              {{ t('ide.stateInspector.spriteEnabled') }}:
              {{ spriteEnabled ? t('ide.stateInspector.on') : t('ide.stateInspector.off') }}
            </div>
            <div v-if="(spriteStates ?? []).length === 0" class="empty">{{ t('ide.stateInspector.empty') }}</div>
            <div v-else class="grid-cards">
              <div
                v-for="s in (spriteStates ?? [])"
                :key="s.spriteNumber"
                class="card"
              >
                #{{ s.spriteNumber }} ({{ s.x }},{{ s.y }})
                {{ s.visible ? t('ide.stateInspector.on') : t('ide.stateInspector.off') }} p={{ s.priority }}
              </div>
            </div>
          </div>
        </GameTabPane>

        <GameTabPane name="move" :label="t('ide.stateInspector.tabMove')">
          <div class="tab-pane horizontal move-tab">
            <div class="grid-cards move-cards">
              <MovementCard
                v-for="slot in moveSlots"
                :key="slot.actionNumber"
                :slot="slot"
              />
            </div>
          </div>
        </GameTabPane>
      </GameTabs>
    </div>
  </GameBlock>
</template>

<style scoped>
.state-inspector {
  height: 100%;
  min-width: 280px;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* Let GameBlock content area fill remaining space below header */
.state-inspector :deep(.game-block-content) {
  flex: 1 1 0;
  min-height: 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.inspector-content {
  flex: 1 1 0;
  min-height: 100px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* Match RuntimeOutput .output-tabs style */
.inspector-tabs {
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  position: relative;
  z-index: 1;
}

.tab-pane.horizontal {
  padding: 0;
  min-height: 0;
}

/* Cards in a row, wrapping to use horizontal space */
.grid-cards {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: flex-start;
}

.card {
  flex-shrink: 0;
  padding: 0.25rem 0.5rem;
  font-size: 0.75rem;
  font-variant-numeric: tabular-nums;
  background: var(--game-surface-bg-start);
  border: 1px solid var(--game-surface-border);
  border-radius: 4px;
  white-space: nowrap;
}

.extras {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  margin-top: 0.35rem;
  flex-wrap: wrap;
}

.dot {
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 1px;
  border: 1px solid var(--game-surface-border);
  vertical-align: middle;
}

.line,
.empty {
  margin-bottom: 0.2rem;
}

.empty {
  color: var(--game-text-tertiary);
  font-style: italic;
}

/* SPRITE tab: larger text for readability */
.sprite-tab .meta-line,
.sprite-tab .empty,
.sprite-tab .card {
  font-size: 1rem;
}

.sprite-tab .card {
  padding: 0.35rem 0.6rem;
}

/* MOVE tab: structured cards with icons */
.move-tab .empty {
  font-size: 1rem;
  padding: 0.5rem;
}

.move-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(5rem, 11rem));
  gap: 0.5rem;
  width: 100%;
}

/* Palettes tab: larger labels, swatches, and extras for readability */
.palettes-tab :deep(.active-palette-display) {
  gap: 1.25rem;
}

.palettes-tab :deep(.palette-section) {
  gap: 0.5rem;
}

.palettes-tab :deep(.palette-label) {
  font-size: 1rem;
  font-weight: 600;
}

.palettes-tab :deep(.palette-combos) {
  gap: 0.5rem;
}

.palettes-tab :deep(.combo-strip) {
  gap: 2px;
}

.palettes-tab :deep(.color-swatch) {
  width: 16px;
  height: 16px;
  border-radius: 2px;
}

.palettes-tab .extras {
  font-size: 1rem;
  gap: 0.5rem;
  margin-top: 0.5rem;
}

.palettes-tab .dot {
  width: 12px;
  height: 12px;
  border-radius: 2px;
}

.tab-pane.compact {
  padding: 0.35rem 0.5rem;
  font-size: 11px;
}

.tab-pane.compact :deep(.active-palette-display) {
  gap: 0.5rem;
}

.tab-pane.compact :deep(.palette-label) {
  font-size: 10px;
}

.tab-pane.compact :deep(.color-swatch) {
  width: 6px;
  height: 6px;
}

.label {
  color: var(--game-text-secondary);
}

.list {
  margin: 0;
  padding-left: 1rem;
}

.item {
  margin-bottom: 0.1rem;
  font-variant-numeric: tabular-nums;
}
</style>
