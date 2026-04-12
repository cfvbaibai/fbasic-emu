<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import type { JoystickBufferView } from '@/core/devices/sharedJoystickBuffer'
import {
  createViewsFromJoystickBuffer,
  getStickState,
  getStrigState,
} from '@/core/devices/sharedJoystickBuffer'

defineOptions({
  name: 'JoystickBufferSection',
})

const props = withDefaults(
  defineProps<{
    sharedJoystickBuffer?: SharedArrayBuffer
    /** Incremented by parent on each animation frame to trigger buffer re-reads. */
    tick?: number
  }>(),
  {
    tick: 0,
  }
)

const { t } = useI18n()

/** Bitmask constants for stick directions */
const STICK_RIGHT = 1
const STICK_LEFT = 2
const STICK_DOWN = 4
const STICK_UP = 8

/** Bitmask constants for strig buttons */
const STRIG_START = 1
const STRIG_SELECT = 2
const STRIG_B = 4
const STRIG_A = 8

/** Whether the joystick buffer is available */
const hasBuffer = computed(() => props.sharedJoystickBuffer != null)

/**
 * Typed array views over the shared joystick buffer (null when unavailable).
 * tick is read to trigger re-computation when parent signals a new frame.
 */
const views = computed<JoystickBufferView | null>(() => {
  void props.tick
  if (!props.sharedJoystickBuffer) return null
  try {
    return createViewsFromJoystickBuffer(props.sharedJoystickBuffer)
  } catch {
    return null
  }
})

/** Read stick values from the shared buffer (0 when unavailable) */
const stickStates = computed<[number, number]>(() => {
  const view = views.value
  if (!view) return [0, 0]
  return [getStickState(view, 0), getStickState(view, 1)]
})

/** Read strig values from the shared buffer (0 when unavailable) */
const strigStates = computed<[number, number]>(() => {
  const view = views.value
  if (!view) return [0, 0]
  return [getStrigState(view, 0), getStrigState(view, 1)]
})

/** Check if a direction bit is set in the stick state */
function hasDirection(stickState: number, bit: number): boolean {
  return (stickState & bit) !== 0
}

/** Check if a button bit is set in the strig state */
function hasButton(strigState: number, bit: number): boolean {
  return (strigState & bit) !== 0
}

/** Button definitions for strig display */
const STRIG_BUTTONS = [
  { bit: STRIG_A, label: 'A' },
  { bit: STRIG_B, label: 'B' },
  { bit: STRIG_SELECT, label: 'Sel' },
  { bit: STRIG_START, label: 'Sta' },
] as const

const JOYSTICK_IDS = [0, 1] as const
</script>

<template>
  <div class="joystick-buffer-section">
    <div class="joystick-buffer-title">{{ t('ide.bufferInspector.joystickTitle') }}</div>

    <div v-if="!hasBuffer" class="joystick-buffer-unavailable">
      {{ t('ide.bufferInspector.joystickUnavailable') }}
    </div>

    <div v-else class="joystick-buffer-grid">
      <div
        v-for="id in JOYSTICK_IDS"
        :key="id"
        class="joystick-buffer-row"
      >
        <span class="joystick-buffer-label">{{ t(`ide.bufferInspector.joystick${id}`) }}</span>

        <div class="joystick-dpad">
          <span
            class="dpad-up"
            :class="{ 'dpad-active': hasDirection(stickStates[id], STICK_UP) }"
          >
            &#9650;
          </span>
          <span
            class="dpad-left"
            :class="{ 'dpad-active': hasDirection(stickStates[id], STICK_LEFT) }"
          >
            &#9664;
          </span>
          <span
            class="dpad-right"
            :class="{ 'dpad-active': hasDirection(stickStates[id], STICK_RIGHT) }"
          >
            &#9654;
          </span>
          <span
            class="dpad-down"
            :class="{ 'dpad-active': hasDirection(stickStates[id], STICK_DOWN) }"
          >
            &#9660;
          </span>
        </div>

        <div class="joystick-dpad-buttons">
          <span
            v-for="btn in STRIG_BUTTONS"
            :key="btn.label"
            class="dpad-button"
            :class="{ 'dpad-active': hasButton(strigStates[id], btn.bit) }"
          >
            {{ btn.label }}
          </span>
        </div>

        <div class="joystick-values">
          <span class="joystick-stick-label">
            {{ t('ide.bufferInspector.joystickStick') }}
          </span>
          <span class="joystick-stick-value">{{ stickStates[id] }}</span>
          <span class="joystick-strig-label">
            {{ t('ide.bufferInspector.joystickStrig') }}
          </span>
          <span class="joystick-strig-value">{{ strigStates[id] }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.joystick-buffer-section {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.joystick-buffer-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--game-text-secondary);
}

.joystick-buffer-unavailable {
  font-size: 0.75rem;
  color: var(--game-text-tertiary);
  font-style: italic;
}

.joystick-buffer-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.joystick-buffer-row {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.joystick-buffer-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--game-text-secondary);
  min-width: 1.5rem;
}

.joystick-dpad {
  display: grid;
  grid-template-areas:
    '. up .'
    'left . right'
    '. down .';
  grid-template-columns: 1rem 1rem 1rem;
  grid-template-rows: 1rem 1rem 1rem;
  gap: 1px;
}

.dpad-up {
  grid-area: up;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6rem;
  color: var(--game-text-tertiary);
}

.dpad-down {
  grid-area: down;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6rem;
  color: var(--game-text-tertiary);
}

.dpad-left {
  grid-area: left;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6rem;
  color: var(--game-text-tertiary);
}

.dpad-right {
  grid-area: right;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.6rem;
  color: var(--game-text-tertiary);
}

.dpad-active {
  color: var(--game-accent);
}

.joystick-dpad-buttons {
  display: flex;
  gap: 0.25rem;
}

.dpad-button {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.55rem;
  font-weight: 600;
  color: var(--game-text-tertiary);
  padding: 0.1rem 0.3rem;
  border: 1px solid var(--game-surface-border);
  border-radius: 2px;
  min-width: 1.2rem;
}

.dpad-button.dpad-active {
  color: var(--game-accent);
  border-color: var(--game-accent);
}

.joystick-values {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.7rem;
  font-variant-numeric: tabular-nums;
}

.joystick-stick-label,
.joystick-strig-label {
  color: var(--game-text-secondary);
  font-weight: 600;
}

.joystick-stick-value,
.joystick-strig-value {
  color: var(--game-text-primary);
  min-width: 1.2rem;
}
</style>
