<script setup lang="ts">
/**
 * Test Case Card Component
 *
 * Displays a single test case with play button, expected behavior,
 * and result recording (pass/fail/skip + notes).
 */

import { useI18n } from 'vue-i18n'

import type { SoundTestCase } from './soundTestCases'

defineOptions({
  name: 'TestCaseCard',
})

const props = defineProps<{
  testCase: SoundTestCase
  isPlaying: boolean
  result: 'pass' | 'fail' | 'untested'
  notes: string
}>()

const emit = defineEmits<{
  play: [musicString: string, testId: string]
  setResult: [testId: string, result: 'pass' | 'fail' | 'untested']
  setNotes: [testId: string, notes: string]
}>()

const { t } = useI18n()

function handlePlay() {
  emit('play', props.testCase.musicString, props.testCase.id)
}

function handleSetResult(result: 'pass' | 'fail' | 'untested') {
  emit('setResult', props.testCase.id, result)
}

function handleNotesInput(event: Event) {
  const target = event.target as HTMLInputElement
  emit('setNotes', props.testCase.id, target.value)
}
</script>

<template>
  <div
    class="test-case-card"
    :class="{
      playing: isPlaying,
      pass: result === 'pass',
      fail: result === 'fail',
    }"
  >
    <div class="test-header">
      <span class="test-name">{{ testCase.name }}</span>
      <button
        class="play-button"
        :class="{ playing: isPlaying }"
        @click="handlePlay"
        :title="testCase.description"
      >
        {{ isPlaying ? t('soundTest.testCase.playing') : t('soundTest.testCase.play') }}
      </button>
    </div>
    <div class="test-info">
      <code class="music-string">{{ testCase.musicString }}</code>
      <p class="expected">{{ testCase.expectedBehavior }}</p>
    </div>
    <div class="test-result">
      <div class="result-buttons">
        <button
          class="result-btn pass"
          :class="{ active: result === 'pass' }"
          @click="handleSetResult('pass')"
        >
          {{ t('soundTest.testCase.pass') }}
        </button>
        <button
          class="result-btn fail"
          :class="{ active: result === 'fail' }"
          @click="handleSetResult('fail')"
        >
          {{ t('soundTest.testCase.fail') }}
        </button>
        <button
          class="result-btn skip"
          :class="{ active: result === 'untested' }"
          @click="handleSetResult('untested')"
        >
          {{ t('soundTest.testCase.skip') }}
        </button>
      </div>
      <input
        type="text"
        class="notes-input"
        :placeholder="t('soundTest.testCase.notesPlaceholder')"
        :value="notes"
        @input="handleNotesInput"
      />
    </div>
  </div>
</template>

<style scoped>
.test-case-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  background: var(--game-surface-bg-gradient);
  border: 1px solid var(--game-surface-border);
  border-radius: var(--game-radius-lg);
  transition: border-color 0.2s, box-shadow 0.2s;
}

.test-case-card:hover {
  border-color: var(--game-surface-border-hover);
}

.test-case-card.playing {
  border-color: var(--base-solid-primary);
  box-shadow: var(--game-shadow-glow-sm);
}

.test-case-card.pass {
  border-left: 3px solid var(--semantic-solid-success);
}

.test-case-card.fail {
  border-left: 3px solid var(--semantic-solid-danger);
}

.test-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.test-name {
  font-weight: var(--game-font-weight-semibold);
  color: var(--game-text-primary);
}

.play-button {
  padding: 0.25rem 0.75rem;
  font-size: var(--game-font-size-sm);
  font-weight: var(--game-font-weight-medium);
  background: var(--base-solid-primary-20);
  color: var(--base-solid-primary);
  border: 1px solid var(--base-solid-primary-30);
  border-radius: var(--game-radius-sm);
  cursor: pointer;
  transition: all 0.2s;
}

.play-button:hover {
  background: var(--base-solid-primary-30);
}

.play-button.playing {
  background: var(--base-solid-primary);
  color: var(--base-solid-gray-00);
}

.test-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.music-string {
  font-family: var(--game-font-family-mono);
  font-size: 0.9rem;
  padding: 0.25rem 0.5rem;
  background: var(--base-solid-gray-20);
  border-radius: var(--game-radius-sm);
  color: var(--base-solid-primary);
}

.expected {
  margin: 0;
  font-size: var(--game-font-size-sm);
  color: var(--game-text-secondary);
}

.test-result {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.result-buttons {
  display: flex;
  gap: 0.25rem;
}

.result-btn {
  flex: 1;
  padding: 0.25rem 0.5rem;
  font-size: var(--game-font-size-sm);
  font-weight: var(--game-font-weight-medium);
  background: var(--base-solid-gray-20);
  color: var(--game-text-secondary);
  border: 1px solid transparent;
  border-radius: var(--game-radius-sm);
  cursor: pointer;
  transition: all 0.2s;
}

.result-btn:hover {
  background: var(--base-solid-gray-30);
}

.result-btn.pass.active {
  background: var(--semantic-alpha-success-30);
  color: var(--semantic-solid-success);
  border-color: var(--semantic-solid-success);
}

.result-btn.fail.active {
  background: var(--semantic-alpha-danger-30);
  color: var(--semantic-solid-danger);
  border-color: var(--semantic-solid-danger);
}

.result-btn.skip.active {
  background: var(--semantic-alpha-neutral-30);
  color: var(--semantic-solid-neutral);
  border-color: var(--semantic-solid-neutral);
}

.notes-input {
  padding: 0.4rem 0.5rem;
  font-size: var(--game-font-size-sm);
  background: var(--base-solid-gray-20);
  border: 1px solid var(--game-surface-border);
  border-radius: var(--game-radius-sm);
  color: var(--game-text-primary);
  transition: border-color 0.2s;
}

.notes-input:focus {
  outline: none;
  border-color: var(--base-solid-primary);
}

.notes-input::placeholder {
  color: var(--game-text-tertiary);
}
</style>
