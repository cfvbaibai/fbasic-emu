<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import GameBlock from '@/shared/components/ui/GameBlock.vue'
import type { GameSelectOption } from '@/shared/components/ui/GameSelect.types'
import GameSelect from '@/shared/components/ui/GameSelect.vue'

import {
  DEFAULT_DURATION,
  DEFAULT_ENVELOPE,
  DEFAULT_OCTAVE,
  DEFAULT_STEPS,
  DEFAULT_TEMPO,
  DURATION_OPTIONS,
  ENVELOPE_OPTIONS,
  OCTAVE_OPTIONS,
  STEPS_OPTIONS,
} from './composerControlsConstants'

defineOptions({
  name: 'ComposerControls',
})

withDefaults(
  defineProps<{
    /** BPM value (40-240). */
    tempo?: number
    /** Number of steps in the sequence. */
    steps?: 16 | 32
    /** Base octave (2-6). */
    octave?: number
  }>(),
  {
    tempo: DEFAULT_TEMPO,
    steps: DEFAULT_STEPS,
    octave: DEFAULT_OCTAVE,
  }
)

const emit = defineEmits<{
  'update:tempo': [value: number]
  'update:steps': [value: number]
  'update:octave': [value: number]
  'update:duration': [value: string]
  'update:envelope': [value: string]
}>()

const { t } = useI18n()

// ---------------------------------------------------------------------------
// Internal state for controls without props
// ---------------------------------------------------------------------------

const duration = computed(() => DEFAULT_DURATION)
const envelope = computed(() => DEFAULT_ENVELOPE)

// ---------------------------------------------------------------------------
// Option lists
// ---------------------------------------------------------------------------

const stepsOptions: GameSelectOption[] = STEPS_OPTIONS.map((v) => ({
  label: String(v),
  value: v,
}))

const octaveOptions: GameSelectOption[] = OCTAVE_OPTIONS.map((v) => ({
  label: String(v),
  value: v,
}))

const durationOptions: GameSelectOption[] = DURATION_OPTIONS.map((v) => ({
  label: v,
  value: v,
}))

const envelopeOptions: GameSelectOption[] = ENVELOPE_OPTIONS.map((v) => ({
  label: t(`ide.composer.envelopes.${v}`),
  value: v,
}))

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

function onTempoInput(event: Event): void {
  const value = Number.parseInt((event.target as HTMLInputElement).value, 10)
  emit('update:tempo', value)
}

function onStepsChange(value: string | number): void {
  emit('update:steps', Number(value))
}

function onOctaveChange(value: string | number): void {
  emit('update:octave', Number(value))
}

function onDurationChange(value: string | number): void {
  emit('update:duration', String(value))
}

function onEnvelopeChange(value: string | number): void {
  emit('update:envelope', String(value))
}
</script>

<template>
  <GameBlock :title="t('ide.composer.title')" class="composer-controls">
    <div class="composer-controls__grid">
      <!-- Tempo slider -->
      <div class="composer-controls__tempo">
        <label class="composer-controls__label">
          {{ t('ide.composer.tempo') }}
        </label>
        <div class="composer-controls__tempo-row">
          <input
            type="range"
            class="composer-controls__tempo-slider"
            min="40"
            max="240"
            :value="tempo"
            @input="onTempoInput"
          />
          <span class="composer-controls__tempo-value">
            {{ tempo }}
          </span>
        </div>
      </div>

      <!-- Steps -->
      <div class="composer-controls__steps">
        <label class="composer-controls__label">
          {{ t('ide.composer.steps') }}
        </label>
        <GameSelect
          :model-value="steps"
          :options="stepsOptions"
          size="small"
          @update:model-value="onStepsChange"
        />
      </div>

      <!-- Octave -->
      <div class="composer-controls__octave">
        <label class="composer-controls__label">
          {{ t('ide.composer.octave') }}
        </label>
        <GameSelect
          :model-value="octave"
          :options="octaveOptions"
          size="small"
          @update:model-value="onOctaveChange"
        />
      </div>

      <!-- Duration -->
      <div class="composer-controls__duration">
        <label class="composer-controls__label">
          {{ t('ide.composer.duration') }}
        </label>
        <GameSelect
          :model-value="duration"
          :options="durationOptions"
          size="small"
          @update:model-value="onDurationChange"
        />
      </div>

      <!-- Envelope -->
      <div class="composer-controls__envelope">
        <label class="composer-controls__label">
          {{ t('ide.composer.envelope') }}
        </label>
        <GameSelect
          :model-value="envelope"
          :options="envelopeOptions"
          size="small"
          @update:model-value="onEnvelopeChange"
        />
      </div>
    </div>
  </GameBlock>
</template>

<style scoped>
.composer-controls__grid {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  align-items: flex-end;
}

.composer-controls__tempo,
.composer-controls__steps,
.composer-controls__octave,
.composer-controls__duration,
.composer-controls__envelope {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 80px;
}

.composer-controls__label {
  font-size: 0.7rem;
  color: var(--game-text-tertiary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.composer-controls__tempo-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.composer-controls__tempo-slider {
  width: 120px;
  accent-color: var(--base-solid-primary);
  cursor: pointer;
}

.composer-controls__tempo-value {
  font-size: 0.8rem;
  font-weight: 600;
  color: var(--game-text-primary);
  min-width: 2.5rem;
  text-align: right;
}
</style>
