<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import GameIcon from './GameIcon.vue'
import type { GameTagEmits, GameTagProps } from './GameTag.types'

/**
 * GameTag component - A tag/badge component with type variants, sizes, and effects.
 *
 * @example
 * ```vue
 * <GameTag type="success" size="medium" effect="light" icon="mdi:check" :closable="true">
 *   Tag Label
 * </GameTag>
 * ```
 */
defineOptions({
  name: 'GameTag',
})

const props = withDefaults(defineProps<GameTagProps>(), {
  type: 'default',
  size: 'medium',
  effect: 'light',
  icon: undefined,
  closable: false,
})

const emit = defineEmits<GameTagEmits>()

const { t } = useI18n()

const tagClasses = computed(() => {
  const baseClasses = {
    'game-tag': true,
    [`game-tag-${props.type}`]: true,
    [`game-tag-${props.size}`]: true,
    [`game-tag-${props.effect}`]: true,
  }

  // Add utility classes for variants that use card background
  if ((props.type === 'default' || props.type === 'info') && props.effect === 'light') {
    baseClasses['bg-game-surface'] = true
    baseClasses['text-game-secondary'] = true
  }
  if (props.type === 'default' && props.effect === 'dark') {
    baseClasses['bg-game-surface'] = true
  }

  return baseClasses
})

const handleClose = () => {
  emit('close')
}
</script>

<template>
  <span :class="tagClasses">
    <GameIcon v-if="icon" :icon="icon" :size="size === 'small' ? 'small' : 'medium'" class="game-tag-icon" />
    <span v-if="$slots.default" class="game-tag-content">
      <slot />
    </span>
    <button
      v-if="closable"
      type="button"
      class="game-tag-close"
      @click="handleClose"
      :aria-label="t('common.ariaLabels.close')"
    >
      ×
    </button>
  </span>
</template>

<style scoped>
.game-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.25rem 0.75rem;
  font-weight: 600;
  font-size: 0.75rem;
  line-height: 1.5;
  border-radius: 6px;
  border: 1px solid;
  white-space: nowrap;
  transition: all 0.2s ease;
}

/* Type variants - Light effect */
.game-tag-default.game-tag-light {
  border-color: var(--game-surface-border);
}

.game-tag-success.game-tag-light {
  background: linear-gradient(135deg, var(--base-alpha-primary-10) 0%, var(--base-alpha-primary-10) 100%);
  border-color: var(--base-solid-primary);
  color: var(--base-solid-primary);
  box-shadow: 0 0 8px var(--base-alpha-primary-20);
}

.game-tag-warning.game-tag-light {
  background: linear-gradient(135deg, var(--semantic-alpha-warning-20) 0%, var(--semantic-alpha-warning-10) 100%);
  border-color: var(--semantic-solid-warning);
  color: var(--semantic-solid-warning);
  box-shadow: 0 0 8px var(--semantic-alpha-warning-20);
}

.game-tag-danger.game-tag-light {
  background: linear-gradient(135deg, var(--semantic-alpha-danger-20) 0%, var(--semantic-alpha-danger-10) 100%);
  border-color: var(--semantic-solid-danger);
  color: var(--semantic-solid-danger);
  box-shadow: 0 0 8px var(--semantic-alpha-danger-20);
}

.game-tag-info.game-tag-light {
  border-color: var(--game-surface-border);
}

/* Type variants - Dark effect */
.game-tag-default.game-tag-dark {
  border-color: var(--game-surface-border);
}

.game-tag-success.game-tag-dark {
  background: var(--semantic-solid-success);
  border-color: var(--semantic-solid-success);
  color: var(--base-solid-gray-100);
}

.game-tag-warning.game-tag-dark {
  background: var(--semantic-solid-warning);
  border-color: var(--semantic-solid-warning);
  color: var(--base-solid-gray-100);
}

.game-tag-danger.game-tag-dark {
  background: var(--semantic-solid-danger);
  border-color: var(--semantic-solid-danger);
  color: var(--base-solid-gray-100);
}

.game-tag-info.game-tag-dark {
  background: var(--semantic-solid-info);
  border-color: var(--semantic-solid-info);
  color: var(--base-solid-gray-100);
}

/* Type variants - Plain effect */
.game-tag-default.game-tag-plain {
  background: transparent;
  border-color: var(--game-surface-border);
  color: var(--game-text-secondary);
}

.game-tag-success.game-tag-plain {
  background: transparent;
  border-color: var(--semantic-solid-success);
  color: var(--semantic-solid-success);
}

.game-tag-warning.game-tag-plain {
  background: transparent;
  border-color: var(--semantic-solid-warning);
  color: var(--semantic-solid-warning);
}

.game-tag-danger.game-tag-plain {
  background: transparent;
  border-color: var(--semantic-solid-danger);
  color: var(--semantic-solid-danger);
}

.game-tag-info.game-tag-plain {
  background: transparent;
  border-color: var(--semantic-solid-info);
  color: var(--semantic-solid-info);
}

/* Size variants */
.game-tag-small {
  padding: 0.125rem 0.5rem;
  font-size: 0.625rem;
  gap: 0.25rem;
}

.game-tag-large {
  padding: 0.375rem 1rem;
  font-size: 0.875rem;
  gap: 0.5rem;
}

.game-tag-content {
  display: inline-flex;
  align-items: center;
}

.game-tag-icon {
  flex-shrink: 0;
}

.game-tag-close {
  margin-left: 0.25rem;
  padding: 0;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  color: inherit;
  opacity: 0.7;
  transition: opacity 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 1rem;
  height: 1rem;
}

.game-tag-close:hover {
  opacity: 1;
}

/* Fallback for browsers that don't support color-mix */
@supports not (background: color-mix(in srgb, red 20%, transparent)) {
  .game-tag-success.game-tag-light {
    background: linear-gradient(135deg, var(--base-alpha-primary-10) 0%, var(--base-alpha-primary-10) 100%);
  }

  .game-tag-warning.game-tag-light {
    background: linear-gradient(135deg, var(--semantic-alpha-warning-20) 0%, var(--semantic-alpha-warning-10) 100%);
  }

  .game-tag-danger.game-tag-light {
    background: linear-gradient(135deg, var(--semantic-alpha-danger-20) 0%, var(--semantic-alpha-danger-10) 100%);
  }
}
</style>
