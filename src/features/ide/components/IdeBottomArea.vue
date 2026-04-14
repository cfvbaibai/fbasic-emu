<script setup lang="ts">
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { MAX_SPRITES } from '@/core/animation/sharedDisplayBuffer'
import type { SharedDisplayBufferAccessor } from '@/core/animation/sharedDisplayBufferAccessor'
import type { KeyboardBufferView } from '@/core/devices/sharedKeyboardBuffer'
import type { SpriteState } from '@/core/sprite/types'
import type { ScreenCell } from '@/core/types/execution-types'
import { GameTabPane, GameTabs } from '@/shared/components/ui'
import { COLORS } from '@/shared/data/palette'

import ActivePaletteDisplay from './ActivePaletteDisplay.vue'
import AnimationSyncSection from './AnimationSyncSection.vue'
import DisplayBufferSection from './DisplayBufferSection.vue'
import JoystickBufferSection from './JoystickBufferSection.vue'
import JoystickControl from './JoystickControl.vue'
import KeyboardBufferSection from './KeyboardBufferSection.vue'
import MovementCard, { type MovementSlotData } from './MovementCard.vue'
import SpriteSlotsSection from './SpriteSlotsSection.vue'

/**
 * IdeBottomArea - Bottom panel containing Joystick and inspector tabs.
 * Uses a single-level tab hierarchy: PALETTE, SPRITE, MOVE, BUFFER.
 */

defineOptions({
  name: 'IdeBottomArea',
})

const props = defineProps<Props>()

interface Props {
  // JoystickControl props
  sendStrigEvent?: (joystickId: number, state: number) => void
  sharedJoystickBuffer?: SharedArrayBuffer

  // PALETTE tab props
  screenBuffer: ScreenCell[][]
  cursorX: number
  cursorY: number
  bgPalette: number
  spritePalette: number
  backdropColor: number
  cgenMode: number

  // SPRITE / MOVE / BUFFER tab props
  spriteStates: SpriteState[]
  spriteEnabled: boolean
  sharedDisplayBufferAccessor: SharedDisplayBufferAccessor

  // KeyboardBufferSection props
  keyboardView: KeyboardBufferView
}

const { t } = useI18n()
const activeTab = ref('palettes')

// --- PALETTE tab helpers ---

function hexFor(index: number): string {
  const i = Math.max(0, Math.min(index, COLORS.length - 1))
  return COLORS[i] ?? '#000000'
}

// --- MOVE tab data ---

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

// --- BUFFER tab computed ---

const syncCommand = computed(() => props.sharedDisplayBufferAccessor.readSyncCommand())
const ackStatus = computed(() => props.sharedDisplayBufferAccessor.readAck())

// Expose update function for animation loop to call
defineExpose({
  updateMoveSlotsData,
})
</script>

<template>
  <div class="bottom-area">
    <div class="bottom-left">
      <JoystickControl
        :send-strig-event="sendStrigEvent"
        :shared-joystick-buffer="sharedJoystickBuffer"
      />
    </div>
    <div class="bottom-right">
      <GameTabs v-model="activeTab" type="border-card" class="inspector-tabs">
        <GameTabPane name="palettes" :label="t('ide.stateInspector.tabPalette')">
          <div class="tab-pane horizontal palettes-tab">
            <div class="palettes-row">
              <ActivePaletteDisplay :bg-palette="bgPalette" :sprite-palette="spritePalette" />
              <div class="extras">
                <span class="label">{{ t('ide.stateInspector.backdrop') }}:</span>
                <span
                  class="dot"
                  :style="{ backgroundColor: hexFor(backdropColor) }"
                  :title="`${backdropColor}`"
                />
                {{ backdropColor }}
                <span class="label">{{ t('ide.stateInspector.cgen') }}:</span>
                {{ cgenMode }}
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

        <GameTabPane name="buffer" :label="t('ide.stateInspector.tabBuffer')">
          <div class="buffer-inspector-content">
            <DisplayBufferSection :shared-display-buffer-accessor="sharedDisplayBufferAccessor" />
            <JoystickBufferSection
              :shared-joystick-buffer="sharedJoystickBuffer"
            />
            <KeyboardBufferSection :keyboard-view="keyboardView" />
            <SpriteSlotsSection :sprite-states="spriteStates" :sprite-enabled="spriteEnabled" />
            <AnimationSyncSection :sync-command="syncCommand" :ack-status="ackStatus" />
          </div>
        </GameTabPane>
      </GameTabs>
    </div>
  </div>
</template>

<style scoped>
.bottom-area {
  display: flex;
  align-items: stretch;
  gap: 1rem;
  padding: 0 1rem;
  min-height: 0;
}

.bottom-left {
  flex: 0 1 auto;
  min-width: 0;
}

.bottom-right {
  flex: 1 1 0;
  min-width: 500px;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.inspector-tabs {
  flex: 1 1 0;
  display: flex;
  flex-direction: column;
  min-height: 0;
  overflow: hidden;
  position: relative;
  z-index: 1;
}

/* --- Shared tab pane styles --- */

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

.empty {
  color: var(--game-text-tertiary);
  font-style: italic;
}

.label {
  color: var(--game-text-secondary);
}

/* --- PALETTE tab --- */

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
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  font-size: 1rem;
  flex-wrap: wrap;
}

.palettes-tab .dot {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 2px;
  border: 1px solid var(--game-surface-border);
  vertical-align: middle;
}

/* --- SPRITE tab --- */

.sprite-tab .meta-line,
.sprite-tab .empty,
.sprite-tab .card {
  font-size: 1rem;
}

.sprite-tab .card {
  padding: 0.35rem 0.6rem;
}

/* --- MOVE tab --- */

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

/* --- BUFFER tab --- */

.buffer-inspector-content {
  flex: 1 1 0;
  min-height: 100px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  overflow: hidden;
}
</style>
