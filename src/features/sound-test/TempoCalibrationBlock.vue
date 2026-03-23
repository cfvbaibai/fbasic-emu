<script setup lang="ts">
/**
 * Tempo Calibration Block Component
 *
 * Allows comparing IDE playback speed against real F-BASIC hardware
 * by adjusting a speed factor until tempo matches reference.
 */

import { ref } from 'vue'
import { useI18n } from 'vue-i18n'

import { parseMusic } from '@/core/sound/MusicDSLParser'
import { SoundStateManager } from '@/core/sound/SoundStateManager'
import type { Note, Rest } from '@/core/sound/types'
import { useWebAudioPlayer } from '@/features/ide/composables/useWebAudioPlayer'
import { GameBlock, GameButton } from '@/shared/components/ui'

defineOptions({
  name: 'TempoCalibrationBlock',
})

const emit = defineEmits<{
  playingChange: [isPlaying: boolean]
}>()

const { t } = useI18n()

// Audio player
const { initialize, playMusic, stopAll } = useWebAudioPlayer()

// Calibration state
const calibrationPlayString = ref('M1V7Y2T3O2A6G3F5GA5AA7')
const speedFactor = ref(1.0)
const isCalibrationPlaying = ref(false)
let calibrationLoopTimeout: ReturnType<typeof setTimeout> | null = null

// Current tempo mapping for reference (T1=fastest, T8=slowest per F-BASIC manual)
const TEMPO_MS_PER_WHOLE_NOTE: Record<number, number> = {
  1: 1100,
  2: 1375,
  3: 1650,
  4: 2200, // Default
  5: 2750,
  6: 3300,
  7: 3850,
  8: 4400,
}

// Scale durations by a factor
function scaleDurations(
  channels: Array<Array<Note | Rest>>,
  factor: number
): Array<Array<Note | Rest>> {
  return channels.map((channel) =>
    channel.map((event) => ({
      ...event,
      duration: event.duration * factor,
    }))
  )
}

// Create state managers array for parseMusic (3 channels)
function createStateManagers(): SoundStateManager[] {
  return [new SoundStateManager(), new SoundStateManager(), new SoundStateManager()]
}

// Play calibration test with speed factor (loops infinitely)
function playCalibrationTest() {
  stopCalibrationLoop()

  initialize()
  stopAll()

  const musicCommand = parseMusic(calibrationPlayString.value, createStateManagers())

  // Scale durations by speed factor
  const scaledChannels = scaleDurations(musicCommand.channels, speedFactor.value)

  playMusic(scaledChannels)
  isCalibrationPlaying.value = true
  emit('playingChange', true)

  const totalDuration = Math.max(
    ...scaledChannels.map((ch) => ch.reduce((sum, e) => sum + e.duration, 0))
  )

  // Schedule next loop iteration
  calibrationLoopTimeout = setTimeout(() => {
    if (isCalibrationPlaying.value) {
      playCalibrationTest()
    }
  }, totalDuration + 200) // Small gap between loops
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
  <GameBlock :title="t('soundTest.tempoCalibration.title')" title-icon="mdi:speedometer" class="calibration-panel">
    <div class="calibration-content">
      <p class="calibration-description">
        {{ t('soundTest.tempoCalibration.description') }}
      </p>

      <div class="calibration-controls">
        <div class="control-group">
          <label class="control-label">{{ t('soundTest.tempoCalibration.playString') }}</label>
          <input
            v-model="calibrationPlayString"
            type="text"
            class="play-string-input"
            :placeholder="t('soundTest.tempoCalibration.playStringPlaceholder')"
          />
        </div>

        <div class="control-group">
          <label class="control-label">{{
            t('soundTest.tempoCalibration.speedFactor', { factor: speedFactor.toFixed(2) })
          }}</label>
          <div class="slider-container">
            <span class="slider-label">0.25x</span>
            <input
              v-model.number="speedFactor"
              type="range"
              min="0.25"
              max="4"
              step="0.05"
              class="speed-slider"
            />
            <span class="slider-label">4x</span>
          </div>
          <p class="slider-hint">
            {{ t('soundTest.tempoCalibration.speedHint') }}
          </p>
        </div>

        <div class="calibration-actions">
          <GameButton :type="isCalibrationPlaying ? 'danger' : 'primary'" @click="togglePlay">
            {{ isCalibrationPlaying ? t('soundTest.tempoCalibration.stop') : t('soundTest.tempoCalibration.play') }}
          </GameButton>
        </div>
      </div>

      <div class="tempo-reference">
        <h4 class="reference-title">{{ t('soundTest.tempoCalibration.tempoMappingTitle') }}</h4>
        <div class="tempo-grid">
          <div v-for="(ms, tempo) in TEMPO_MS_PER_WHOLE_NOTE" :key="tempo" class="tempo-item">
            <span class="tempo-key">T{{ tempo }}</span>
            <span class="tempo-value">{{ ms }}ms</span>
            <span class="tempo-scaled">{{ (ms * speedFactor).toFixed(0) }}ms*</span>
          </div>
        </div>
        <p class="reference-note">
          {{ t('soundTest.tempoCalibration.referenceNote') }}
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

.play-string-input {
  padding: 0.5rem 0.75rem;
  font-family: var(--game-font-family-mono);
  font-size: var(--game-font-size-base);
  background: var(--base-solid-gray-20);
  border: 1px solid var(--game-surface-border);
  border-radius: var(--game-radius-sm);
  color: var(--game-text-primary);
  transition: border-color 0.2s;
}

.play-string-input:focus {
  outline: none;
  border-color: var(--base-solid-primary);
}

.slider-container {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.speed-slider {
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: var(--base-solid-gray-30);
  appearance: none;
  cursor: pointer;
}

.speed-slider::-webkit-slider-thumb {
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--base-solid-primary);
  cursor: pointer;
  transition: transform 0.2s;
}

.speed-slider::-webkit-slider-thumb:hover {
  transform: scale(1.1);
}

.slider-label {
  font-size: var(--game-font-size-sm);
  color: var(--game-text-tertiary);
  min-width: 2.5rem;
}

.slider-hint {
  margin: 0;
  font-size: var(--game-font-size-sm);
  color: var(--game-text-tertiary);
}

.calibration-actions {
  display: flex;
  gap: 0.5rem;
}

.tempo-reference {
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

.tempo-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.5rem;
}

.tempo-item {
  display: flex;
  flex-direction: column;
  padding: 0.5rem;
  background: var(--base-solid-gray-30);
  border-radius: var(--game-radius-sm);
  text-align: center;
}

.tempo-key {
  font-weight: var(--game-font-weight-bold);
  color: var(--base-solid-primary);
  font-size: var(--game-font-size-sm);
}

.tempo-value {
  font-family: var(--game-font-family-mono);
  font-size: var(--game-font-size-sm);
  color: var(--game-text-secondary);
}

.tempo-scaled {
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
