<script setup lang="ts">
import { nextTick, ref, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

/**
 * ReplInput component - Single-line text input for REPL mode.
 * Hidden by default; appears when active prop is true.
 * Auto-focuses when activated, submits on Enter key.
 * Supports command history navigation via Up/Down arrow keys.
 */
defineOptions({
  name: 'ReplInput',
})

const props = withDefaults(
  defineProps<{
    active: boolean
    disabled: boolean
    commandHistory: string[]
    historyIndex: number
  }>(),
  {
    active: false,
    disabled: false,
    commandHistory: () => [],
    historyIndex: -1,
  },
)

const emit = defineEmits<{
  execute: [statement: string]
  navigateHistory: [index: number]
}>()

const { t } = useI18n()

const inputValue = ref('')
const inputRef = useTemplateRef<HTMLInputElement>('inputRef')

// Track whether user is actively navigating history
// (to avoid clobbering input while they type)
const isNavigatingHistory = ref(false)

watch(
  () => props.active,
  async (isActive) => {
    if (isActive) {
      await nextTick()
      inputRef.value?.focus()
    }
  },
)

// When history index changes externally (e.g., from composable), update input
watch(
  () => props.historyIndex,
  (newIndex) => {
    if (newIndex < 0 || !isNavigatingHistory.value) return
    const command = props.commandHistory[newIndex]
    if (command !== undefined) {
      inputValue.value = command
    }
  },
)

function onKeyDown(event: KeyboardEvent) {
  if (props.disabled) return

  if (event.key === 'Enter') {
    isNavigatingHistory.value = false
    const trimmed = inputValue.value.trim()
    if (!trimmed) return

    emit('execute', trimmed)
    inputValue.value = ''
    return
  }

  if (event.key === 'ArrowUp') {
    event.preventDefault()
    handleHistoryUp()
    return
  }

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    handleHistoryDown()
    return
  }

  // Any other key resets history navigation
  isNavigatingHistory.value = false
}

function handleHistoryUp(): void {
  const history = props.commandHistory
  if (history.length === 0) return

  let newIndex: number
  if (!isNavigatingHistory.value) {
    // Starting fresh navigation: go to last entry
    newIndex = history.length - 1
    isNavigatingHistory.value = true
  } else {
    // Already navigating: go one step back
    newIndex = Math.max(0, props.historyIndex - 1)
  }

  emit('navigateHistory', newIndex)
}

function handleHistoryDown(): void {
  if (!isNavigatingHistory.value) return

  const history = props.commandHistory
  if (props.historyIndex >= history.length - 1) {
    // At the end: clear input and stop navigating
    inputValue.value = ''
    isNavigatingHistory.value = false
    return
  }

  const newIndex = props.historyIndex + 1
  emit('navigateHistory', newIndex)
}
</script>

<template>
  <div v-if="active" class="repl-input-container">
    <span class="repl-input-prompt">&gt;</span>
    <input
      ref="inputRef"
      v-model="inputValue"
      type="text"
      class="repl-input-field"
      :placeholder="t('ide.repl.placeholder')"
      :disabled="disabled"
      @keydown="onKeyDown"
    />
  </div>
</template>

<style scoped>
.repl-input-container {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.75rem;
  border-top: 1px solid var(--game-surface-border);
  background: var(--game-surface-bg-gradient);
  flex-shrink: 0;
}

.repl-input-prompt {
  font-family: monospace;
  font-size: 0.875rem;
  color: var(--game-surface-border);
  user-select: none;
  flex-shrink: 0;
}

.repl-input-field {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-family: monospace;
  font-size: 0.875rem;
  color: inherit;
  padding: 0.125rem 0;
  min-width: 0;
}

.repl-input-field::placeholder {
  color: var(--game-surface-border);
  opacity: 0.6;
}
</style>
