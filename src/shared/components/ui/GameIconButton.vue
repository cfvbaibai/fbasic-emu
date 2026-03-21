<script setup lang="ts">
import { computed } from 'vue'

import GameIcon from './GameIcon.vue'
import type { GameIconButtonEmits, GameIconButtonProps } from './GameIconButton.types'

/**
 * GameIconButton component - An icon-only button component with variants and states.
 *
 * @example
 * ```vue
 * <GameIconButton
 *   icon="mdi:play"
 *   type="primary"
 *   size="medium"
 *   :circular="true"
 *   @click="handleClick"
 * />
 * ```
 */
defineOptions({
  name: 'GameIconButton',
})

const props = withDefaults(defineProps<GameIconButtonProps>(), {
  type: 'default',
  size: 'medium',
  variant: 'action',
  disabled: false,
  loading: false,
  icon: undefined,
  selected: false,
  title: undefined,
  circular: false,
})

const emit = defineEmits<GameIconButtonEmits>()

const buttonClasses = computed(() => {
  return {
    'game-icon-button': true,
    [`game-icon-button-${props.type}`]: true,
    [`game-icon-button-${props.size}`]: true,
    [`game-icon-button-${props.variant}`]: true,
    'game-icon-button-disabled': props.disabled || props.loading,
    'game-icon-button-loading': props.loading,
    'game-icon-button-selected': props.selected,
    'game-icon-button-circular': props.circular,
  }
})

const handleClick = (event: MouseEvent) => {
  if (!props.disabled && !props.loading) {
    emit('click', event)
  }
}

const getIconSize = computed(() => {
  // Icons should be proportional to button size
  // Return pixel values as numbers for GameIcon
  const sizeMap: Record<string, number> = {
    small: 14,
    medium: 18,
    large: 22,
  }
  return sizeMap[props.size]
})
</script>

<template>
  <button
    :class="['bg-game-surface', 'border-game-surface', 'text-game-secondary', buttonClasses]"
    :disabled="disabled || loading"
    :title="title"
    :data-testid="props.dataTestid"
    @click="handleClick"
    type="button"
  >
    <span v-if="loading" class="game-icon-button-spinner">
      <GameIcon :icon="icon" :size="getIconSize" rotate />
    </span>
    <GameIcon v-else-if="icon" :icon="icon" :size="getIconSize" class="game-icon-button-icon" />
    <slot v-else />
  </button>
</template>

<style scoped>
.game-icon-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  cursor: pointer;
  user-select: none;
  border-radius: 8px;
  transition: all 0.2s ease;
  box-shadow:
    0 2px 4px var(--base-alpha-gray-00-30),
    inset 0 1px 0 var(--base-alpha-gray-100-10);
  border: 1px solid var(--game-surface-border);
  background: linear-gradient(135deg, var(--game-surface-bg-start) 0%, var(--game-nav-bg-start) 100%);
  color: var(--game-text-secondary);
  min-width: auto;
  width: auto;
  aspect-ratio: 1;
}

.game-icon-button-circular {
  border-radius: 50%;
}

/* Focus styles for accessibility */
.game-icon-button:focus-visible {
  outline: 2px solid var(--game-surface-border);
  outline-offset: 2px;
}

.game-icon-button:hover:not(.game-icon-button-disabled) {
  background: var(--game-surface-bg-hover-gradient);
  border-color: var(--game-surface-border);
  color: var(--game-text-primary);
  transform: translateY(-2px);
  box-shadow:
    0 4px 8px var(--base-alpha-gray-00-40),
    0 2px 4px var(--base-alpha-gray-00-40),
    inset 0 1px 0 var(--base-alpha-gray-100-10);
}

.game-icon-button:active:not(.game-icon-button-disabled) {
  transform: translateY(0);
  box-shadow:
    0 2px 4px var(--base-alpha-gray-00-30),
    inset 0 1px 0 var(--base-alpha-gray-100-10);
}

/* Type variants - All buttons use the same base style, type affects hover/active states */
.game-icon-button-primary:hover:not(.game-icon-button-disabled) {
  border-color: var(--game-surface-border);
  box-shadow:
    0 4px 8px var(--base-alpha-gray-00-40),
    0 2px 4px var(--base-alpha-gray-00-40),
    inset 0 1px 0 var(--base-alpha-gray-100-10);
}

.game-icon-button-primary:active:not(.game-icon-button-disabled) {
  background: linear-gradient(135deg, var(--base-solid-primary) 0%, var(--base-solid-primary) 100%);
  border-color: var(--game-surface-border);
  color: var(--base-solid-gray-00);
  box-shadow:
    0 0 20px var(--game-accent-glow),
    0 4px 8px var(--base-alpha-gray-00-40),
    inset 0 1px 0 var(--base-alpha-gray-100-30);
}

.game-icon-button-success:hover:not(.game-icon-button-disabled) {
  border-color: var(--semantic-solid-success);
  box-shadow:
    0 4px 8px var(--semantic-alpha-success-40),
    0 2px 4px var(--base-alpha-gray-00-40),
    inset 0 1px 0 var(--base-alpha-gray-100-10);
}

.game-icon-button-success:active:not(.game-icon-button-disabled) {
  background: linear-gradient(135deg, var(--semantic-solid-success) 0%, var(--semantic-solid-success) 100%);
  border-color: var(--semantic-solid-success);
  color: var(--base-solid-gray-100);
  box-shadow:
    0 0 12px var(--semantic-alpha-success-50),
    0 2px 4px var(--base-alpha-gray-00-30),
    inset 0 1px 0 var(--base-alpha-gray-100-20);
}

.game-icon-button-warning:hover:not(.game-icon-button-disabled) {
  border-color: var(--semantic-solid-warning);
  box-shadow:
    0 4px 8px var(--semantic-alpha-warning-40),
    0 2px 4px var(--base-alpha-gray-00-40),
    inset 0 1px 0 var(--base-alpha-gray-100-10);
}

.game-icon-button-warning:active:not(.game-icon-button-disabled) {
  background: linear-gradient(135deg, var(--semantic-solid-warning) 0%, var(--semantic-solid-warning) 100%);
  border-color: var(--semantic-solid-warning);
  color: var(--base-solid-gray-100);
  box-shadow:
    0 0 12px var(--semantic-alpha-warning-50),
    0 2px 4px var(--base-alpha-gray-00-30),
    inset 0 1px 0 var(--base-alpha-gray-100-20);
}

.game-icon-button-danger:hover:not(.game-icon-button-disabled) {
  border-color: var(--semantic-solid-danger);
  box-shadow:
    0 4px 8px var(--semantic-alpha-danger-40),
    0 2px 4px var(--base-alpha-gray-00-40),
    inset 0 1px 0 var(--base-alpha-gray-100-10);
}

.game-icon-button-danger:active:not(.game-icon-button-disabled) {
  background: linear-gradient(135deg, var(--semantic-solid-danger) 0%, var(--semantic-solid-danger) 100%);
  border-color: var(--semantic-solid-danger);
  color: var(--base-solid-gray-100);
  box-shadow:
    0 0 12px var(--semantic-alpha-danger-50),
    0 2px 4px var(--base-alpha-gray-00-30),
    inset 0 1px 0 var(--base-alpha-gray-100-20);
}

.game-icon-button-info:hover:not(.game-icon-button-disabled) {
  border-color: var(--semantic-solid-info);
  box-shadow:
    0 4px 8px var(--semantic-alpha-info-40),
    0 2px 4px var(--base-alpha-gray-00-40),
    inset 0 1px 0 var(--base-alpha-gray-100-10);
}

.game-icon-button-info:active:not(.game-icon-button-disabled) {
  background: linear-gradient(135deg, var(--semantic-solid-info) 0%, var(--semantic-solid-info) 100%);
  border-color: var(--semantic-solid-info);
  color: var(--base-solid-gray-100);
  box-shadow:
    0 0 12px var(--semantic-alpha-info-50),
    0 2px 4px var(--base-alpha-gray-00-30),
    inset 0 1px 0 var(--base-alpha-gray-100-20);
}

/* Toggle variant - more compact */
.game-icon-button-toggle {
  padding: 0.375rem;
}

/* Selected state - persistent highlight for toggle buttons */
.game-icon-button-toggle.game-icon-button-selected,
.game-icon-button-action.game-icon-button-selected {
  background: linear-gradient(135deg, var(--base-solid-primary) 0%, var(--base-solid-primary) 100%);
  border-color: var(--game-surface-border);
  color: var(--base-solid-gray-00);
  box-shadow:
    0 0 20px var(--game-accent-glow),
    0 4px 8px var(--base-alpha-gray-00-40),
    inset 0 1px 0 var(--base-alpha-gray-100-30);
}

.game-icon-button-toggle.game-icon-button-selected:hover:not(.game-icon-button-disabled),
.game-icon-button-action.game-icon-button-selected:hover:not(.game-icon-button-disabled) {
  background: linear-gradient(135deg, var(--base-solid-primary) 0%, var(--base-solid-primary) 100%);
  border-color: var(--game-surface-border);
  transform: translateY(-2px);
  box-shadow:
    0 0 24px var(--game-accent-glow),
    0 6px 12px var(--base-alpha-gray-00-50),
    inset 0 1px 0 var(--base-alpha-gray-100-30);
}

.game-icon-button-toggle.game-icon-button-selected:active:not(.game-icon-button-disabled),
.game-icon-button-action.game-icon-button-selected:active:not(.game-icon-button-disabled) {
  transform: translateY(0);
  box-shadow:
    0 0 20px var(--game-accent-glow),
    0 4px 8px var(--base-alpha-gray-00-40),
    inset 0 1px 0 var(--base-alpha-gray-100-30);
}

/* Size variants */
.game-icon-button-small {
  padding: 0.375rem;
}

.game-icon-button-large {
  padding: 0.625rem;
}

/* Disabled state */
.game-icon-button-disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none !important;
}

.game-icon-button-disabled:hover {
  box-shadow:
    0 2px 4px var(--base-alpha-gray-00-30),
    inset 0 1px 0 var(--base-alpha-gray-100-10) !important;
}

/* Loading state */
.game-icon-button-loading {
  cursor: wait;
}

.game-icon-button-spinner {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.game-icon-button-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
</style>
