<script setup lang="ts">
/**
 * Sound Test Page for PLAY Command Verification
 *
 * Human testers can listen to PLAY command outputs and record results.
 * The results can be copied and shared with AI for analysis.
 */

import { computed, onBeforeUnmount, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import { parseMusic } from '@/core/sound/MusicDSLParser'
import { SoundStateManager } from '@/core/sound/SoundStateManager'
import { useWebAudioPlayer } from '@/features/ide/composables/useWebAudioPlayer'
import { GameBlock, GameButton, GameLayout } from '@/shared/components/ui'

import EnvelopeCalibrationBlock from './EnvelopeCalibrationBlock.vue'
import { getTestCasesByCategory } from './soundTestCases'
import TempoCalibrationBlock from './TempoCalibrationBlock.vue'
import TestCaseCard from './TestCaseCard.vue'
import { useSoundTestResults } from './useSoundTestResults'

defineOptions({
  name: 'SoundTestPage',
})

const { t } = useI18n()

// Audio player
const {
  initialize,
  playMusic,
  stopAll,
  cleanup,
} = useWebAudioPlayer()

// Test results management
const {
  stats,
  copySuccess,
  setResult,
  setNotes,
  getResult,
  markAllPass,
  resetAll,
  copyResults,
} = useSoundTestResults()

// Playback state
const currentlyPlaying = ref<string | null>(null)

// Calibration block ref
const calibrationBlockRef = useTemplateRef('calibrationBlock')

// Envelope calibration block ref
const envelopeCalibrationBlockRef = useTemplateRef('envelopeCalibrationBlockRef')

// Create state managers array for parseMusic (3 channels)
function createStateManagers(): SoundStateManager[] {
  return [new SoundStateManager(), new SoundStateManager(), new SoundStateManager()]
}

// Group test cases by category
const testCasesByCategory = computed(() => getTestCasesByCategory())

// Play a test case
function playTestCase(musicString: string, testId: string) {
  initialize()
  stopAll()

  const musicCommand = parseMusic(musicString, createStateManagers())

  playMusic(musicCommand.channels)
  currentlyPlaying.value = testId

  const totalDuration = Math.max(
    ...musicCommand.channels.map((ch) =>
      ch.reduce((sum, e) => sum + e.duration, 0)
    )
  )
  setTimeout(() => {
    if (currentlyPlaying.value === testId) {
      currentlyPlaying.value = null
    }
  }, totalDuration + 100)
}

// Stop playback
function stopPlayback() {
  calibrationBlockRef.value?.stopPlayback()
  stopAll()
  currentlyPlaying.value = null
}

// Handle calibration playing state change
function handleCalibrationPlayingChange(isPlaying: boolean) {
  if (isPlaying) {
    currentlyPlaying.value = 'calibration'
  } else if (currentlyPlaying.value === 'calibration') {
    currentlyPlaying.value = null
  }
}

// Handle envelope calibration playing state change
function handleEnvelopeCalibrationPlayingChange(isPlaying: boolean) {
  if (isPlaying) {
    currentlyPlaying.value = 'envelope-calibration'
  } else if (currentlyPlaying.value === 'envelope-calibration') {
    currentlyPlaying.value = null
  }
}

// Cleanup
onBeforeUnmount(() => {
  calibrationBlockRef.value?.stopCalibrationLoop()
  envelopeCalibrationBlockRef.value?.stopCalibrationLoop()
  cleanup()
})
</script>

<template>
  <GameLayout>
    <div class="sound-test-container">
      <GameBlock :title="t('soundTest.page.title')" title-icon="mdi:music" class="header-panel">
        <div class="header-content">
          <p class="description">
            {{ t('soundTest.page.description') }}
          </p>
          <div class="stats-grid">
            <div class="stat-item pass">
              <span class="stat-value">{{ stats.pass }}</span>
              <span class="stat-label">{{ t('soundTest.page.passed') }}</span>
            </div>
            <div class="stat-item fail">
              <span class="stat-value">{{ stats.fail }}</span>
              <span class="stat-label">{{ t('soundTest.page.failed') }}</span>
            </div>
            <div class="stat-item untested">
              <span class="stat-value">{{ stats.untested }}</span>
              <span class="stat-label">{{ t('soundTest.page.untested') }}</span>
            </div>
          </div>
          <div class="header-actions">
            <GameButton type="primary" @click="copyResults">
              {{ copySuccess ? t('soundTest.page.copied') : t('soundTest.page.copyResults') }}
            </GameButton>
            <GameButton type="default" @click="markAllPass">{{ t('soundTest.page.markAllPass') }}</GameButton>
            <GameButton type="default" @click="resetAll">{{ t('soundTest.page.resetAll') }}</GameButton>
            <GameButton v-if="currentlyPlaying" type="danger" @click="stopPlayback">
              {{ t('soundTest.page.stopSound') }}
            </GameButton>
          </div>
        </div>
      </GameBlock>

      <!-- Tempo Calibration Section -->
      <TempoCalibrationBlock
        ref="calibrationBlock"
        @playing-change="handleCalibrationPlayingChange"
      />

      <!-- Envelope Calibration Section -->
      <EnvelopeCalibrationBlock
        ref="envelopeCalibrationBlockRef"
        @playing-change="handleEnvelopeCalibrationPlayingChange"
      />

      <!-- Test Cases -->
      <div class="test-cases-container">
        <div v-for="[category, cases] in testCasesByCategory" :key="category" class="category-section">
          <h2 class="category-title">{{ category }}</h2>
          <div class="test-cases-grid">
            <TestCaseCard
              v-for="tc in cases"
              :key="tc.id"
              :test-case="tc"
              :is-playing="currentlyPlaying === tc.id"
              :result="getResult(tc.id)?.result ?? 'untested'"
              :notes="getResult(tc.id)?.notes ?? ''"
              @play="playTestCase"
              @set-result="setResult"
              @set-notes="setNotes"
            />
          </div>
        </div>
      </div>
    </div>
  </GameLayout>
</template>

<style scoped>
.sound-test-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  max-width: 1400px;
  margin: 0 auto;
}

.header-panel {
  flex-shrink: 0;
}

.header-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.description {
  margin: 0;
  color: var(--game-text-secondary);
  font-size: var(--game-font-size-base);
}

.stats-grid {
  display: flex;
  gap: 1.5rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 0.5rem 1.5rem;
  background: var(--base-solid-gray-20);
  border-radius: var(--game-radius-lg);
  min-width: 80px;
}

.stat-item.pass {
  border-left: 3px solid var(--semantic-solid-success);
}

.stat-item.fail {
  border-left: 3px solid var(--semantic-solid-danger);
}

.stat-item.untested {
  border-left: 3px solid var(--semantic-solid-neutral);
}

.stat-value {
  font-size: var(--game-font-size-lg);
  font-weight: var(--game-font-weight-bold);
  font-family: var(--game-font-family-mono);
}

.stat-label {
  font-size: 0.75rem;
  color: var(--game-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.test-cases-container {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.category-section {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.category-title {
  margin: 0;
  font-size: var(--game-font-size-lg);
  font-weight: var(--game-font-weight-semibold);
  color: var(--base-solid-primary);
  border-bottom: 1px solid var(--game-surface-border);
  padding-bottom: 0.5rem;
}

.test-cases-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1rem;
}
</style>
