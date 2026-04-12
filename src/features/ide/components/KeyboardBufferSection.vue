<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { useI18n } from 'vue-i18n'

import type { KeyboardBufferView } from '@/core/devices/sharedKeyboardBuffer'

defineOptions({
  name: 'KeyboardBufferSection',
})

const props = defineProps<{
  keyboardView: KeyboardBufferView
}>()

const { t } = useI18n()

const HIGHLIGHT_DURATION_MS = 1000
let pollTimer: ReturnType<typeof setInterval> | null = null

const keyCharCode = ref(0)
const keyModifiers = ref(0)
const keyAvailable = ref(0)
const keyChar = ref('-')
const highlightKeyAvailable = ref(false)

function readKeyboardState(): void {
  const newCharCode = props.keyboardView.keyCharCode[0] ?? 0
  const newModifiers = props.keyboardView.keyModifiers[0] ?? 0
  const newAvailable = props.keyboardView.keyAvailableInt32[0] ?? 0

  // Detect keyAvailable transition
  if (newAvailable !== keyAvailable.value && newAvailable !== 0) {
    highlightKeyAvailable.value = true
    setTimeout(() => {
      highlightKeyAvailable.value = false
    }, HIGHLIGHT_DURATION_MS)
  }

  keyCharCode.value = newCharCode
  keyModifiers.value = newModifiers
  keyAvailable.value = newAvailable
  keyChar.value = newCharCode > 0 ? String.fromCharCode(newCharCode) : '-'
}

onMounted(() => {
  readKeyboardState()
  pollTimer = setInterval(readKeyboardState, 100)
})

onBeforeUnmount(() => {
  if (pollTimer !== null) {
    clearInterval(pollTimer)
    pollTimer = null
  }
})
</script>

<template>
  <div class="keyboard-buffer-section">
    <div class="keyboard-buffer-title">
      {{ t('ide.bufferInspector.keyboardBufferTitle') }}
    </div>
    <div class="keyboard-buffer-table">
      <div class="keyboard-buffer-row">
        <span class="keyboard-buffer-label">
          {{ t('ide.bufferInspector.keyboardCharCode') }}
        </span>
        <span class="keyboard-buffer-value">{{ keyCharCode }}</span>
        <span class="keyboard-buffer-char">{{ keyChar }}</span>
      </div>
      <div class="keyboard-buffer-row">
        <span class="keyboard-buffer-label">
          {{ t('ide.bufferInspector.keyboardModifiers') }}
        </span>
        <span class="keyboard-buffer-value">{{ keyModifiers }}</span>
        <span class="keyboard-buffer-char" />
      </div>
      <div
        class="keyboard-buffer-row"
        :class="{ 'keyboard-buffer-highlight': highlightKeyAvailable }"
      >
        <span class="keyboard-buffer-label">
          {{ t('ide.bufferInspector.keyboardAvailable') }}
        </span>
        <span class="keyboard-buffer-value">{{ keyAvailable }}</span>
        <span class="keyboard-buffer-char" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.keyboard-buffer-section {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.keyboard-buffer-title {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--game-text-secondary);
}

.keyboard-buffer-table {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
}

.keyboard-buffer-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.1rem 0.35rem;
  font-size: 0.7rem;
  font-variant-numeric: tabular-nums;
}

.keyboard-buffer-highlight {
  background: var(--game-accent);
  color: var(--game-text-primary);
  border-radius: 2px;
  transition: background 0.3s ease-out;
}

.keyboard-buffer-label {
  color: var(--game-text-secondary);
  font-weight: 600;
  min-width: 6rem;
}

.keyboard-buffer-value {
  color: var(--game-text-primary);
  min-width: 3rem;
}

.keyboard-buffer-char {
  color: var(--game-text-tertiary);
  min-width: 1rem;
}
</style>
