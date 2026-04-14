<script setup lang="ts">
/**
 * JoystickKeybindingPanel - Configuration panel for keyboard joystick bindings.
 */
defineOptions({
  name: 'JoystickKeybindingPanel',
})

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

import { onMounted, onUnmounted, reactive, ref, useTemplateRef, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { GameBlock, GameButton, GameSubBlock } from '@/shared/components/ui'

import {
  defaultJoystick0Bindings,
  defaultJoystick1Bindings,
  type JoystickKeyBindings,
  type KeyBindingsConfig,
} from '../composables/useKeyboardJoystick'

const { t } = useI18n()

interface Props {
  modelValue: boolean
  keyBindings: KeyBindingsConfig
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'update:keyBindings', bindings: KeyBindingsConfig): void
  (e: 'reset'): void
}

// Local copy of key bindings for editing
const localBindings = reactive<KeyBindingsConfig>({
  joystick0: { ...defaultJoystick0Bindings },
  joystick1: { ...defaultJoystick1Bindings },
})

// Sync local bindings with props when panel opens
watch(
  () => props.modelValue,
  isOpen => {
    if (isOpen) {
      localBindings.joystick0 = { ...props.keyBindings.joystick0 }
      localBindings.joystick1 = { ...props.keyBindings.joystick1 }
    }
  },
  { immediate: true }
)

// Track which key is being configured
const configuringKey = ref<string | null>(null)

// Ref for the overlay element to attach event listener
const overlayRef = useTemplateRef<HTMLElement>('overlayRef')

// Handle key press during configuration
const handleKeyPress = (event: KeyboardEvent) => {
  if (!configuringKey.value) return

  event.preventDefault()
  const key = event.key

  // Update the binding
  const [joystick, button] = configuringKey.value.split('-')
  if (joystick && button) {
    const joystickKey = joystick as 'joystick0' | 'joystick1'
    const buttonKey = button as keyof JoystickKeyBindings
    if (localBindings[joystickKey] && buttonKey in localBindings[joystickKey]) {
      localBindings[joystickKey][buttonKey] = {
        key,
        displayName: key.length === 1 ? key.toUpperCase() : key,
      }
    }
  }

  configuringKey.value = null
}

onMounted(() => {
  overlayRef.value?.addEventListener('keydown', handleKeyPress)
})

onUnmounted(() => {
  overlayRef.value?.removeEventListener('keydown', handleKeyPress)
})

// Start configuring a key
const startConfiguring = (joystickId: number, button: keyof JoystickKeyBindings) => {
  configuringKey.value = `joystick${joystickId}-${button}`
}

// Cancel configuration
const cancelConfiguring = () => {
  configuringKey.value = null
}

// Save changes
const saveChanges = () => {
  emit('update:keyBindings', { ...localBindings })
  emit('update:modelValue', false)
}

// Cancel changes
const cancelChanges = () => {
  // Reset local bindings to props
  localBindings.joystick0 = { ...props.keyBindings.joystick0 }
  localBindings.joystick1 = { ...props.keyBindings.joystick1 }
  emit('update:modelValue', false)
}

// Reset to defaults
const resetDefaults = () => {
  emit('reset')
  emit('update:modelValue', false)
}

// Get display name for a binding
const getBindingDisplay = (joystickId: number, button: keyof JoystickKeyBindings): string => {
  const joystickKey = `joystick${joystickId}` as 'joystick0' | 'joystick1'
  return localBindings[joystickKey][button].displayName
}

// Check if a key is being configured
const isConfiguring = (joystickId: number, button: keyof JoystickKeyBindings): boolean => {
  return configuringKey.value === `joystick${joystickId}-${button}`
}
</script>

<template>
  <div
    v-if="modelValue"
    ref="overlayRef"
    class="keybinding-overlay"
    role="dialog"
    aria-modal="true"
    aria-labelledby="keybinding-title"
    tabindex="-1"
  >
    <GameBlock
      :title="t('ide.joystick.keybinding.title')"
      title-icon="mdi:keyboard"
      class="keybinding-panel"
      no-hover-effect
    >
      <div class="keybinding-content">
        <!-- Instructions -->
        <p class="keybinding-instructions">
          {{ t('ide.joystick.keybinding.instructions') }}
        </p>

        <!-- Joystick 0 Bindings -->
        <GameSubBlock :title="t('ide.joystick.keybinding.joystick0')">
          <div class="binding-grid">
            <div
              v-for="button in ['up', 'down', 'left', 'right', 'a', 'b', 'start', 'select'] as const"
              :key="`j0-${button}`"
              class="binding-item"
              :class="{ configuring: isConfiguring(0, button) }"
            >
              <span class="binding-label">{{ t(`ide.joystick.keybinding.buttons.${button}`) }}</span>
              <button
                class="binding-key"
                :class="{ active: isConfiguring(0, button) }"
                @click="startConfiguring(0, button)"
              >
                {{ isConfiguring(0, button) ? t('ide.joystick.keybinding.pressKey') : getBindingDisplay(0, button) }}
              </button>
            </div>
          </div>
        </GameSubBlock>

        <!-- Joystick 1 Bindings -->
        <GameSubBlock :title="t('ide.joystick.keybinding.joystick1')">
          <div class="binding-grid">
            <div
              v-for="button in ['up', 'down', 'left', 'right', 'a', 'b', 'start', 'select'] as const"
              :key="`j1-${button}`"
              class="binding-item"
              :class="{ configuring: isConfiguring(1, button) }"
            >
              <span class="binding-label">{{ t(`ide.joystick.keybinding.buttons.${button}`) }}</span>
              <button
                class="binding-key"
                :class="{ active: isConfiguring(1, button) }"
                @click="startConfiguring(1, button)"
              >
                {{ isConfiguring(1, button) ? t('ide.joystick.keybinding.pressKey') : getBindingDisplay(1, button) }}
              </button>
            </div>
          </div>
        </GameSubBlock>

        <!-- Action Buttons -->
        <div class="keybinding-actions">
          <GameButton @click="cancelChanges">
            {{ t('ide.input.cancel') }}
          </GameButton>
          <GameButton @click="resetDefaults">
            {{ t('ide.joystick.keybinding.resetDefaults') }}
          </GameButton>
          <GameButton @click="saveChanges">
            {{ t('ide.input.submit') }}
          </GameButton>
        </div>

        <!-- Cancel configuration hint -->
        <p v-if="configuringKey" class="configuring-hint">
          {{ t('ide.joystick.keybinding.pressAnyKey') }}
          <button class="cancel-configure" @click="cancelConfiguring">
            {{ t('ide.joystick.keybinding.cancelConfigure') }}
          </button>
        </p>
      </div>
    </GameBlock>
  </div>
</template>

<style scoped>
.keybinding-overlay {
  position: fixed;
  inset: 0;
  background: var(--base-alpha-gray-100-80);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-index-dialog-overlay);
  padding: 1rem;
}

.keybinding-panel {
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
}

.keybinding-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.keybinding-instructions {
  color: var(--game-text-secondary);
  font-size: 0.875rem;
  margin: 0;
}

.binding-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
}

.binding-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.5rem;
  border-radius: var(--game-radius-sm);
  background: var(--base-solid-gray-20);
}

.binding-item.configuring {
  background: var(--base-solid-primary);
}

.binding-label {
  font-size: 0.75rem;
  color: var(--game-text-secondary);
  text-transform: capitalize;
}

.binding-key {
  padding: 0.5rem;
  border: 1px solid var(--game-surface-border);
  border-radius: var(--game-radius-sm);
  background: var(--base-solid-gray-10);
  color: var(--game-text-primary);
  font-family: var(--game-font-family-mono);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.binding-key:hover {
  border-color: var(--base-solid-primary);
}

.binding-key.active {
  background: var(--base-solid-primary);
  border-color: var(--base-solid-primary);
  color: var(--base-solid-gray-10);
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.7;
  }
}

.keybinding-actions {
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--game-surface-border);
}

.configuring-hint {
  text-align: center;
  color: var(--base-solid-primary);
  font-size: 0.875rem;
  margin: 0;
}

.cancel-configure {
  background: none;
  border: none;
  color: var(--game-text-secondary);
  text-decoration: underline;
  cursor: pointer;
  font-size: inherit;
}

.cancel-configure:hover {
  color: var(--game-text-primary);
}

@media (width <= 480px) {
  .binding-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .keybinding-actions {
    flex-direction: column;
  }
}
</style>
