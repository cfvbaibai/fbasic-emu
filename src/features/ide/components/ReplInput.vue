<script setup lang="ts">
import { nextTick, ref, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

/**
 * ReplInput component - Single-line text input for REPL mode.
 * Hidden by default; appears when active prop is true.
 * Auto-focuses when activated, submits on Enter key.
 */
defineOptions({
  name: 'ReplInput',
})

const props = withDefaults(
  defineProps<{
    active: boolean
    disabled: boolean
  }>(),
  {
    active: false,
    disabled: false,
  },
)

const emit = defineEmits<{
  execute: [statement: string]
}>()

const { t } = useI18n()

const inputValue = ref('')
const inputRef = useTemplateRef<HTMLInputElement>('inputRef')

watch(
  () => props.active,
  async (isActive) => {
    if (isActive) {
      await nextTick()
      inputRef.value?.focus()
    }
  },
)

function onKeyDown(event: KeyboardEvent) {
  if (event.key !== 'Enter') return
  if (props.disabled) return

  const trimmed = inputValue.value.trim()
  if (!trimmed) return

  emit('execute', trimmed)
  inputValue.value = ''
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
