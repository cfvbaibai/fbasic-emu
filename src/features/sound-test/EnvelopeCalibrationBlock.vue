<script setup lang="ts">
/**
 * Envelope Calibration Block Component
 *
 * Allows tuning M1 envelope decay times to match real F-BASIC hardware.
 * Adjust the decay factor until envelope sounds match reference.
 */

import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { ENVELOPE_DECAY_BASE } from '@/core/sound/constants'
import { parseMusic } from '@/core/sound/MusicDSLParser'
import { SoundStateManager } from '@/core/sound/SoundStateManager'
import {
  setEnvelopeDecayFactor,
  useWebAudioPlayer,
} from '@/features/ide/composables/useWebAudioPlayer'
import { GameBlock, GameButton } from '@/shared/components/ui'

defineOptions({
  name: 'EnvelopeCalibrationBlock',
})

const emit = defineEmits<{
  playingChange: [isPlaying: boolean]
}>()

const { t } = useI18n()

// Audio player
const { initialize, playMusic, stopAll } = useWebAudioPlayer()

// Calibration state
const selectedEnvelopeValue = ref(7)
const decayFactor = ref(1.0)
const isCalibrationPlaying = ref(false)
let calibrationLoopTimeout: ReturnType<typeof setTimeout> | null = null

// Wire up decay factor to audio player
watch(decayFactor, (newValue) => {
  setEnvelopeDecayFactor(newValue)
}, { immediate: true })

// Computed decay times with factor applied
const scaledDecayTimes = computed(() => {
  const result: Record<number, number> = {}
  for (const [key, value] of Object.entries(ENVELOPE_DECAY_BASE)) {
    result[Number(key)] = Math.round(value * decayFactor.value)
  }
  return result
})

// Create state managers array for parseMusic (3 channels)
function createStateManagers(): SoundStateManager[] {
  return [new SoundStateManager(), new SoundStateManager(), new SoundStateManager()]
}

// Generate test note with specific envelope value
function generateEnvelopeTestNote(envelopeValue: number): string {
  return `M1V${envelopeValue}T3O2A6G3F5GA5AA7`
}

// Play calibration test (loops infinitely)
function playCalibrationTest() {
  stopCalibrationLoop()

  initialize()
  stopAll()

  const playString = generateEnvelopeTestNote(selectedEnvelopeValue.value)
  const musicCommand = parseMusic(playString, createStateManagers())

  playMusic(musicCommand.channels)
  isCalibrationPlaying.value = true
  emit('playingChange', true)

  const totalDuration = Math.max(
    ...musicCommand.channels.map((ch) => ch.reduce((sum, e) => sum + e.duration, 0))
  )

  // Schedule next loop iteration
  calibrationLoopTimeout = setTimeout(() => {
    if (isCalibrationPlaying.value) {
      playCalibrationTest()
    }
  }, totalDuration + 200)
}

// Stop the calibration loop
function stopCalibrationLoop() {
  if (calibrationLoopTimeout) {
    clearTimeout(calibrationLoopTimeout)
    calibrationLoopTimeout = null
  }
}

// Stop playback
function stopPlayback() {
  stopCalibrationLoop()
  stopAll()
  isCalibrationPlaying.value = false
  emit('playingChange', false)
}

// Toggle play/stop
function togglePlay() {
  if (isCalibrationPlaying.value) {
    stopPlayback()
  } else {
    playCalibrationTest()
  }
}

// Expose stop function for parent component
defineExpose({
  stopPlayback,
  stopCalibrationLoop,
})
</script>

<template>
  <GameBlock :title="t('soundTest.envelopeCalibration.title')" title-icon="mdi:waveform" class="calibration-panel">
    <div class="calibration-content">
      <p class="calibration-description">
        {{ t('soundTest.envelopeCalibration.description') }}
      </p>

      <div class="calibration-controls">
        <div class="control-group">
          <label class="control-label">{{ t('soundTest.envelopeCalibration.envelopeValue') }}</label>
          <div class="slider-container">
            <span class="slider-label">V0</span>
            <input
              v-model.number="selectedEnvelopeValue"
              type="range"
              min="0"
              max="15"
              step="1"
              class="envelope-slider"
            />
            <span class="slider-label">V15</span>
          </div>
          <p class="current-value">
            {{
              t('soundTest.envelopeCalibration.testingValue', {
                value: selectedEnvelopeValue,
                ms: scaledDecayTimes[selectedEnvelopeValue],
              })
            }}
          </p>
        </div>

        <div class="control-group">
          <label class="control-label">{{
            t('soundTest.envelopeCalibration.decayFactor', { factor: decayFactor.toFixed(2) })
          }}</label>
          <div class="slider-container">
            <span class="slider-label">0x</span>
            <input
              v-model.number="decayFactor"
              type="range"
              min="0.1"
              max="3"
              step="0.05"
              class="decay-slider"
            />
            <span class="slider-label">3x</span>
          </div>
          <p class="slider-hint">
            {{ t('soundTest.envelopeCalibration.decayHint') }}
          </p>
        </div>

        <div class="calibration-actions">
          <GameButton :type="isCalibrationPlaying ? 'danger' : 'primary'" @click="togglePlay">
            {{
              isCalibrationPlaying
                ? t('soundTest.envelopeCalibration.stop')
                : t('soundTest.envelopeCalibration.play')
            }}
          </GameButton>
        </div>
      </div>

      <div class="envelope-reference">
        <h4 class="reference-title">{{ t('soundTest.envelopeCalibration.envelopeMappingTitle') }}</h4>
        <div class="envelope-grid">
          <div v-for="(ms, v) in Object.entries(ENVELOPE_DECAY_BASE)" :key="v" class="envelope-item">
            <span class="envelope-key">V{{ v }}</span>
            <span class="envelope-base">{{ ms }}ms</span>
            <span class="envelope-scaled">{{ scaledDecayTimes[Number(v)] }}ms</span>
          </div>
        </div>
        <p class="reference-note">
          {{ t('soundTest.envelopeCalibration.referenceNote') }}
        </p>
      </div>
    </div>
  </GameBlock>
</template>

<style scoped>
.calibration-panel {
  flex-shrink: 0;
}

.calibration-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.calibration-description {
  margin: 0;
  color: var(--game-text-secondary);
  font-size: var(--game-font-size-base);
}

.calibration-controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.control-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.control-label {
  font-weight: var(--game-font-weight-semibold);
  color: var(--game-text-primary);
  font-size: var(--game-font-size-sm);
}

.slider-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.envelope-slider,
.decay-slider {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: var(--base-solid-gray-30);
  appearance: none;
  cursor: pointer;
}

.envelope-slider::-webkit-slider-thumb,
.decay-slider::-webkit-slider-thumb {
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--base-solid-primary);
  cursor: pointer;
  transition: transform 0.2s;
}

.envelope-slider::-webkit-slider-thumb:hover,
.decay-slider::-webkit-slider-thumb:hover {
  transform: scale(1.1);
}

.slider-label {
  font-size: var(--game-font-size-sm);
  color: var(--game-text-tertiary);
  min-width: 2.5rem;
}

.slider-hint,
.current-value {
  margin: 0;
  font-size: var(--game-font-size-sm);
  color: var(--game-text-tertiary);
}

.calibration-actions {
  display: flex;
  gap: 0.5rem;
}

.envelope-reference {
  padding: 1rem;
  background: var(--base-solid-gray-20);
  border-radius: var(--game-radius-md);
}

.reference-title {
  margin: 0 0 0.75rem;
  font-size: var(--game-font-size-sm);
  font-weight: var(--game-font-weight-semibold);
  color: var(--game-text-primary);
}

.envelope-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
}

.envelope-item {
  display: flex;
  flex-direction: column;
  padding: 0.5rem;
  background: var(--base-solid-gray-30);
  border-radius: var(--game-radius-sm);
  text-align: center;
}

.envelope-key {
  font-weight: var(--game-font-weight-bold);
  color: var(--base-solid-primary);
  font-size: var(--game-font-size-sm);
}

.envelope-base {
  font-family: var(--game-font-family-mono);
  font-size: var(--game-font-size-sm);
  color: var(--game-text-secondary);
}

.envelope-scaled {
  font-family: var(--game-font-family-mono);
  font-size: var(--game-font-size-sm);
  color: var(--semantic-solid-warning);
}

.reference-note {
  margin: 0.75rem 0 0;
  font-size: var(--game-font-size-sm);
  color: var(--game-text-tertiary);
}
</style>
