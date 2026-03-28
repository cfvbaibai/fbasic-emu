<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import GameIcon from './GameIcon.vue'

/**
 * GameCollapseToggle component - A toggle button for collapsing/expanding content.
 *
 * @example
 * ```vue
 * <GameCollapseToggle
 *   :expanded="isExpanded"
 *   size="small"
 *   @toggle="handleToggle"
 * />
 * ```
 */
defineOptions({
  name: 'GameCollapseToggle',
})

withDefaults(defineProps<Props>(), {
  expanded: false,
  size: 'small',
})

const emit = defineEmits<Emits>()

const { t } = useI18n()

interface Props {
  expanded?: boolean
  size?: 'small' | 'medium' | 'large'
}

interface Emits {
  (e: 'toggle'): void
}

const handleClick = (event: Event) => {
  event.stopPropagation()
  emit('toggle')
}
</script>

<template>
  <button
    class="game-collapse-toggle bg-game-surface border-game-surface"
    :class="{ expanded: expanded }"
    @click="handleClick"
    type="button"
    :aria-expanded="expanded"
    :aria-label="t('common.ariaLabels.toggleCollapse')"
  >
    <GameIcon :icon="expanded ? 'mdi:chevron-up' : 'mdi:chevron-down'" :size="size" />
  </button>
</template>

<style scoped>
.game-collapse-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  cursor: pointer;
  outline: none;
  position: relative;
  overflow: hidden;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.game-collapse-toggle::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: radial-gradient(circle, var(--game-accent-glow) 0%, transparent 70%);
  transform: translate(-50%, -50%);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0;
}

.game-collapse-toggle:hover {
  border-color: var(--base-solid-primary);
  box-shadow:
    0 4px 8px var(--base-alpha-gray-00-40),
    0 0 12px var(--game-accent-glow),
    inset 0 1px 2px var(--base-alpha-gray-100-10);
  transform: scale(1.1);
}

.game-collapse-toggle:hover::before {
  width: 100%;
  height: 100%;
  opacity: 0.3;
}

.game-collapse-toggle:active {
  transform: scale(0.95);
}

.game-collapse-toggle.expanded {
  background: linear-gradient(135deg, var(--base-solid-primary) 0%, var(--game-accent-glow) 100%);
  border-color: var(--base-solid-primary);
  box-shadow:
    0 0 16px var(--game-accent-glow),
    0 2px 6px var(--base-alpha-gray-00-30);
}

.game-collapse-toggle :deep(.game-icon) {
  color: var(--game-text-primary);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  filter: drop-shadow(0 0 4px var(--base-alpha-primary-30));
  transform: rotate(0deg) scale(1);
}

.game-collapse-toggle:hover :deep(.game-icon) {
  color: var(--base-solid-primary);
  filter: drop-shadow(0 0 8px var(--game-accent-glow)) drop-shadow(0 0 16px var(--game-accent-glow));
  transform: rotate(180deg) scale(1.15);
}

.game-collapse-toggle.expanded :deep(.game-icon) {
  color: var(--base-solid-primary);
  filter: drop-shadow(0 0 8px var(--game-accent-glow)) drop-shadow(0 0 16px var(--game-accent-glow));
  transform: rotate(0deg) scale(1.1);
}

.game-collapse-toggle:not(.expanded) :deep(.game-icon) {
  transform: rotate(180deg) scale(1.1);
}
</style>
