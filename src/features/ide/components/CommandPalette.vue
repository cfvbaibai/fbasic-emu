<script setup lang="ts">
import { computed, nextTick, ref, useTemplateRef, watch } from 'vue'

import type { CommandPaletteCommand } from '@/features/ide/composables/commandPalette'
import { filterCommandPaletteCommands } from '@/features/ide/composables/commandPalette'

defineOptions({
  name: 'CommandPalette',
})

const props = defineProps<{
  open: boolean
  commands: readonly CommandPaletteCommand[]
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'execute', command: CommandPaletteCommand): void
}>()

const query = ref('')
const selectedIndex = ref(0)
const panelRef = useTemplateRef<HTMLDivElement>('panelRef')
const inputRef = useTemplateRef<HTMLInputElement>('inputRef')

const filteredCommands = computed(() => filterCommandPaletteCommands(props.commands, query.value))

watch(
  () => props.open,
  async (open) => {
    if (!open) return
    query.value = ''
    selectedIndex.value = 0
    await nextTick()
    inputRef.value?.focus()
  }
)

watch(filteredCommands, (commands) => {
  if (commands.length === 0) {
    selectedIndex.value = 0
    return
  }
  if (selectedIndex.value >= commands.length) {
    selectedIndex.value = commands.length - 1
  }
})

function closePalette() {
  emit('close')
}

function executeSelected() {
  const command = filteredCommands.value[selectedIndex.value]
  if (!command) return
  emit('execute', command)
}

function selectNext() {
  const count = filteredCommands.value.length
  if (count === 0) return
  selectedIndex.value = (selectedIndex.value + 1) % count
}

function selectPrevious() {
  const count = filteredCommands.value.length
  if (count === 0) return
  selectedIndex.value = (selectedIndex.value - 1 + count) % count
}

function trapFocus(reverse: boolean) {
  const panel = panelRef.value
  if (!panel) return

  const focusable = Array.from(
    panel.querySelectorAll<HTMLElement>('button, input, [tabindex]:not([tabindex="-1"])')
  ).filter(el => !el.hasAttribute('disabled'))
  if (focusable.length === 0) return

  const currentIndex = focusable.findIndex(el => el === document.activeElement)
  let nextIndex = reverse ? currentIndex - 1 : currentIndex + 1

  if (currentIndex < 0) {
    nextIndex = reverse ? focusable.length - 1 : 0
  } else if (nextIndex < 0) {
    nextIndex = focusable.length - 1
  } else if (nextIndex >= focusable.length) {
    nextIndex = 0
  }

  focusable[nextIndex]?.focus()
}

function handlePanelKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    event.preventDefault()
    closePalette()
    return
  }

  if (event.key === 'ArrowDown') {
    event.preventDefault()
    selectNext()
    return
  }

  if (event.key === 'ArrowUp') {
    event.preventDefault()
    selectPrevious()
    return
  }

  if (event.key === 'Enter') {
    event.preventDefault()
    executeSelected()
    return
  }

  if (event.key === 'Tab') {
    event.preventDefault()
    trapFocus(event.shiftKey)
  }
}
</script>

<template>
  <div v-if="open" class="command-palette-overlay" @click.self="closePalette">
    <div
      ref="panelRef"
      class="command-palette-panel"
      role="dialog"
      aria-modal="true"
      aria-label="Command palette"
      @keydown="handlePanelKeydown"
    >
      <div class="command-palette-header">
        <input
          ref="inputRef"
          v-model="query"
          type="text"
          class="command-palette-input"
          placeholder="Type a command..."
          aria-label="Search commands"
        />
      </div>

      <ul class="command-palette-list" role="listbox" aria-label="Commands">
        <li
          v-for="(command, index) in filteredCommands"
          :key="command.id"
          :class="['command-palette-item', { selected: selectedIndex === index }]"
          role="option"
          :aria-selected="selectedIndex === index"
        >
          <button
            type="button"
            class="command-palette-button"
            @mouseenter="selectedIndex = index"
            @click="emit('execute', command)"
          >
            <span class="command-title">{{ command.title }}</span>
            <span v-if="command.shortcut" class="command-shortcut">{{ command.shortcut }}</span>
          </button>
          <div v-if="command.description" class="command-description">{{ command.description }}</div>
        </li>

        <li v-if="filteredCommands.length === 0" class="command-palette-empty">
          No matching commands
        </li>
      </ul>
    </div>
  </div>
</template>

<style scoped>
.command-palette-overlay {
  position: fixed;
  inset: 0;
  z-index: 1100;
  display: flex;
  justify-content: center;
  padding: 10vh 1rem 1rem;
  background: var(--base-alpha-gray-00-60);
  backdrop-filter: blur(2px);
}

.command-palette-panel {
  width: min(680px, 100%);
  max-height: 70vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  border: 2px solid var(--game-surface-border);
  background: var(--game-surface-bg-gradient);
  box-shadow: var(--game-shadow-hover);
}

.command-palette-header {
  padding: 0.875rem;
  border-bottom: 1px solid var(--game-surface-border);
}

.command-palette-input {
  width: 100%;
  border-radius: 8px;
  border: 1px solid var(--game-surface-border);
  background: var(--game-surface-bg-start);
  color: var(--game-text-primary);
  font-size: 0.95rem;
  padding: 0.625rem 0.75rem;
  outline: none;
}

.command-palette-input:focus {
  border-color: var(--base-solid-primary);
  box-shadow: 0 0 0 1px var(--base-solid-primary);
}

.command-palette-list {
  margin: 0;
  padding: 0.5rem;
  list-style: none;
  overflow-y: auto;
}

.command-palette-item {
  border: 1px solid transparent;
  border-radius: 8px;
  padding: 0.25rem;
}

.command-palette-item.selected {
  border-color: var(--base-solid-primary);
  background: var(--base-alpha-primary-20);
}

.command-palette-button {
  width: 100%;
  border: 0;
  background: transparent;
  color: inherit;
  display: flex;
  align-items: center;
  justify-content: space-between;
  text-align: left;
  gap: 1rem;
  padding: 0.5rem;
  cursor: pointer;
}

.command-title {
  color: var(--game-text-primary);
  font-weight: 600;
}

.command-shortcut {
  color: var(--game-text-secondary);
  font-size: 0.82rem;
  white-space: nowrap;
}

.command-description {
  color: var(--game-text-secondary);
  font-size: 0.82rem;
  padding: 0 0.5rem 0.5rem;
}

.command-palette-empty {
  color: var(--game-text-secondary);
  padding: 0.75rem;
  text-align: center;
}
</style>
