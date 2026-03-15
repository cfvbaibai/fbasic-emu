<script setup lang="ts">
import { Icon } from '@iconify/vue'
import { computed, ref, watch } from 'vue'

import { ensureLocalIcon } from '@/shared/icons'

/**
 * GameIcon component - An icon component using Iconify with size, color, and animation options.
 *
 * @example
 * ```vue
 * <GameIcon icon="mdi:play" size="medium" color="#fff" :rotate="true" />
 * ```
 */
defineOptions({
  name: 'GameIcon',
})

const props = withDefaults(defineProps<Props>(), {
  icon: undefined,
  size: 'medium',
  color: 'currentColor',
  rotate: false,
  pulse: false,
  inline: false,
})

interface Props {
  icon?: string // Icon name in format "prefix:name" (e.g., "mdi:play")
  size?: 'small' | 'medium' | 'large' | number
  color?: string
  rotate?: boolean | number | string
  pulse?: boolean
  inline?: boolean
}

const iconSize = computed(() => {
  if (typeof props.size === 'number') {
    return props.size
  }
  const sizeMap = {
    small: 16,
    medium: 20,
    large: 24,
  }
  return sizeMap[props.size]
})

const iconClasses = computed(() => {
  return {
    'game-icon': true,
    'game-icon-rotate': props.rotate === true,
    'game-icon-pulse': props.pulse,
  }
})

const rotateValue = computed((): number | undefined => {
  if (props.rotate === true) {
    return 1 // Continuous rotation for Iconify
  }
  if (typeof props.rotate === 'number') {
    return props.rotate
  }
  if (typeof props.rotate === 'string') {
    // Parse string like "90deg" or "90" to number
    const num = parseFloat(props.rotate)
    return isNaN(num) ? undefined : num
  }
  return undefined
})

const iconColorValue = computed(() => props.color)
const iconFontSize = computed(() => `${iconSize.value}px`)
const resolvedIcon = ref<string | undefined>()

watch(
  () => props.icon,
  async (newIcon) => {
    if (!newIcon) {
      resolvedIcon.value = undefined
      return
    }

    await ensureLocalIcon(newIcon)
    resolvedIcon.value = newIcon
  },
  { immediate: true }
)
</script>

<template>
  <span v-if="resolvedIcon" :class="iconClasses">
    <Icon
      :icon="resolvedIcon"
      :width="iconSize"
      :height="iconSize"
      :color="color"
      :inline="inline"
      :rotate="rotateValue"
    />
  </span>
  <span v-else class="game-icon-placeholder">
    <slot />
  </span>
</template>

<style scoped>
.game-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: all 0.2s ease;
  color: v-bind(iconColorValue);
}

.game-icon-rotate {
  animation: icon-rotate 1s linear infinite;
}

.game-icon-pulse {
  animation: icon-pulse 1.5s ease-in-out infinite;
}

@keyframes icon-rotate {
  from {
    transform: rotate(0deg);
  }

  to {
    transform: rotate(360deg);
  }
}

@keyframes icon-pulse {
  0%,
  100% {
    opacity: 1;
    transform: scale(1);
  }

  50% {
    opacity: 0.6;
    transform: scale(1.1);
  }
}

.game-icon-placeholder {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: v-bind(iconFontSize);
}
</style>
