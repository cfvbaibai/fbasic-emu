<script setup lang="ts">
import GameIcon from './GameIcon.vue'

interface Props {
  title: string
  subtitle?: string
  description?: string
  icon?: string // Icon name in format "prefix:name" (e.g., "mdi:play")
}

withDefaults(defineProps<Props>(), {
  subtitle: '',
  description: '',
  icon: undefined,
})
</script>

<template>
  <div class="hero-section">
    <!-- Scan line sweep overlay -->
    <div class="hero-scanline-sweep" aria-hidden="true" />

    <!-- Pixel grid background -->
    <div class="hero-pixel-grid" aria-hidden="true" />

    <div class="hero-content">
      <h1 class="hero-title">
        <span v-if="icon" class="hero-icon-wrapper">
          <GameIcon :icon="icon" :size="80" class="hero-icon" />
        </span>
        <span class="hero-title-text">{{ title }}</span>
      </h1>
      <p v-if="subtitle" class="hero-subtitle">{{ subtitle }}</p>
      <p v-if="description" class="hero-description">{{ description }}</p>
      <slot />
    </div>
  </div>
</template>

<style scoped>
.hero-section {
  position: relative;
  text-align: center;
  padding: 4rem 2rem;
  margin-bottom: 4rem;
  overflow: hidden;
}

.hero-content {
  position: relative;
  z-index: 1;
  max-width: 800px;
  margin: 0 auto;
  animation:
    home-fade-in-up
    var(--home-entrance-duration, 0.6s)
    var(--home-entrance-easing, cubic-bezier(0.16, 1, 0.3, 1))
    both;
}

.hero-title {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  font-size: 3.5rem;
  font-weight: 700;
  font-family: var(--game-font-family-heading);
  color: var(--base-solid-primary);
  text-shadow:
    0 0 20px var(--game-accent-glow),
    0 4px 8px var(--base-alpha-gray-00-80);
  letter-spacing: 3px;
  margin: 0 0 1.5rem;
  animation: home-glow-pulse 4s ease-in-out infinite;
}

.hero-icon-wrapper {
  display: inline-flex;
  align-items: center;
  animation: home-icon-float 3s ease-in-out infinite;
}

.hero-icon {
  filter: drop-shadow(0 0 12px var(--game-accent-glow));
}

.hero-title-text {
  display: inline-block;
}

.hero-subtitle {
  font-size: 1.5rem;
  color: var(--game-text-secondary);
  margin: 0 0 1rem;
  font-weight: 500;
  animation:
    home-fade-in-up
    var(--home-entrance-duration, 0.6s)
    var(--home-entrance-easing, cubic-bezier(0.16, 1, 0.3, 1))
    0.1s both;
}

.hero-description {
  font-size: 1.1rem;
  color: var(--game-text-tertiary);
  line-height: 1.6;
  margin: 0;
  animation:
    home-fade-in-up
    var(--home-entrance-duration, 0.6s)
    var(--home-entrance-easing, cubic-bezier(0.16, 1, 0.3, 1))
    0.2s both;
}

/* Scan line sweep — thin horizontal line moving down */
.hero-scanline-sweep {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    var(--home-glow-subtle, var(--base-alpha-primary-20)) 20%,
    var(--home-glow-intensity, var(--base-alpha-primary-50)) 50%,
    var(--home-glow-subtle, var(--base-alpha-primary-20)) 80%,
    transparent 100%
  );
  animation: home-scanline-sweep 8s linear infinite;
  pointer-events: none;
  z-index: 2;
  opacity: 0.6;
}

/* Pixel grid background — subtle retro texture */
.hero-pixel-grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(var(--home-pixel-grid-color, var(--base-alpha-gray-100-10)) 1px, transparent 1px),
    linear-gradient(90deg, var(--home-pixel-grid-color, var(--base-alpha-gray-100-10)) 1px, transparent 1px);
  background-size: 24px 24px;
  animation: home-pixel-shimmer 6s ease-in-out infinite;
  pointer-events: none;
  z-index: 0;
}

/* Responsive design */
@media (width <= 768px) {
  .hero-section {
    padding: 3rem 1.5rem;
    margin-bottom: 3rem;
  }

  .hero-title {
    font-size: 2.5rem;
  }

  .hero-subtitle {
    font-size: 1.25rem;
  }

  .hero-pixel-grid {
    background-size: 16px 16px;
  }
}

@media (width <= 480px) {
  .hero-section {
    padding: 2rem 1rem;
    margin-bottom: 2rem;
  }

  .hero-title {
    font-size: 2rem;
    flex-direction: column;
    gap: 0.5rem;
  }
}
</style>
