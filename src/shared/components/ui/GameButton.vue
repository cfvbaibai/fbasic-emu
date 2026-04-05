<script setup lang="ts">
import { computed } from 'vue'

import type { GameButtonEmits, GameButtonProps } from './GameButton.types'
import GameIcon from './GameIcon.vue'

/**
 * GameButton component - A styled button component with multiple variants, sizes, and states.
 *
 * @example
 * ```vue
 * <GameButton type="primary" size="medium" icon="mdi:play" @click="handleClick">
 *   Click Me
 * </GameButton>
 * ```
 */
defineOptions({
  name: 'GameButton',
})

const props = withDefaults(defineProps<GameButtonProps>(), {
  type: 'default',
  size: 'medium',
  variant: 'action',
  disabled: false,
  loading: false,
  icon: undefined,
  iconPosition: 'left',
  selected: false,
})

const emit = defineEmits<GameButtonEmits>()

const buttonClasses = computed(() => {
  return {
    'game-button': true,
    [`game-button-${props.type}`]: true,
    [`game-button-${props.size}`]: true,
    [`game-button-${props.variant}`]: true,
    'game-button-disabled': props.disabled || props.loading,
    'game-button-loading': props.loading,
    'game-button-selected': props.selected,
  }
})

const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}

const getIconSize = computed(() => {
  // Icons should be smaller and proportional to button size
  // Return pixel values as numbers for GameIcon
  const sizeMap: Record<string, number> = {
    small: 12,
    medium: 14,
    large: 16,
  }
  return sizeMap[props.size]
})
</script>

<template>
  <button
    :class="['bg-game-surface', 'border-game-surface', 'text-game-secondary', buttonClasses]"
    :disabled="disabled || loading"
    :data-testid="props.dataTestid"
    @click="handleClick"
    type="button"
  >
    <span v-if="loading" class="game-button-spinner">
      <GameIcon :icon="icon" :size="getIconSize" rotate />
    </span>
    <GameIcon
      v-else-if="icon && iconPosition === 'left'"
      :icon="icon"
      :size="getIconSize"
      class="game-button-icon-left"
    />
    <span v-if="$slots.default" class="game-button-content">
      <slot />
    </span>
    <GameIcon
      v-if="icon && iconPosition === 'right' && !loading"
      :icon="icon"
      :size="getIconSize"
      class="game-button-icon-right"
    />
  </button>
</template>

<style scoped src="./GameButton.css"></style>
