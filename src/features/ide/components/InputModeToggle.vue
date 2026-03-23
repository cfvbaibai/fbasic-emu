<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import { GameButton, GameIconButton } from '@/shared/components/ui'

import type { InputMode } from '../composables/useBasicIdeState'

/**
 * InputModeToggle - Toggle between JOYSTICK and KEYBOARD input modes.
 *
 * - JOYSTICK mode: Keyboard controls joystick (STICK/STRIG functions)
 * - KEYBOARD mode: Keyboard input for INKEY$ function
 */
defineOptions({
  name: 'InputModeToggle',
})

const props = withDefaults(defineProps<Props>(), {
  isCompact: false,
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: InputMode): void
}>()

const { t } = useI18n()

interface Props {
  /** Current input mode: 'joystick' or 'keyboard' */
  modelValue: InputMode
  /** Whether to use compact (icon-only) display */
  isCompact?: boolean
}

function selectJoystick() {
  emit('update:modelValue', 'joystick')
}

function selectKeyboard() {
  emit('update:modelValue', 'keyboard')
}
</script>

<template>
  <div class="input-mode-toggle">
    <template v-if="props.isCompact">
      <GameIconButton
        variant="toggle"
        type="default"
        icon="mdi:gamepad-variant"
        size="small"
        :title="t('ide.inputModeToggle.joystickTitle')"
        :selected="props.modelValue === 'joystick'"
        @click="selectJoystick"
      />
      <GameIconButton
        variant="toggle"
        type="default"
        icon="mdi:keyboard"
        size="small"
        :title="t('ide.inputModeToggle.keyboardTitle')"
        :selected="props.modelValue === 'keyboard'"
        @click="selectKeyboard"
      />
    </template>
    <template v-else>
      <GameButton
        variant="toggle"
        type="default"
        icon="mdi:gamepad-variant"
        size="small"
        :selected="props.modelValue === 'joystick'"
        @click="selectJoystick"
      >
        {{ t('ide.inputModeToggle.joystick') }}
      </GameButton>
      <GameButton
        variant="toggle"
        type="default"
        icon="mdi:keyboard"
        size="small"
        :selected="props.modelValue === 'keyboard'"
        @click="selectKeyboard"
      >
        {{ t('ide.inputModeToggle.keyboard') }}
      </GameButton>
    </template>
  </div>
</template>

<style scoped>
.input-mode-toggle {
  display: flex;
  gap: 0.125rem;
  margin-right: 0.5rem;
}

/* Override GameButton min-width for toggle buttons */
.input-mode-toggle :deep(.game-button) {
  min-width: auto;
  padding: 0.375rem 0.5rem;
  font-size: 0.8rem;
}
</style>
