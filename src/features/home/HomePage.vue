<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import {
  GameBlock,
  GameButton,
  GameIcon,
  GameLayout,
  HeroSection,
} from '@/shared/components/ui'

/**
 * HomePage component - The home/landing page of the application.
 * Displays a hero section with branding, a GET-STARTED CTA button,
 * and a feature showcase section highlighting key IDE capabilities.
 */
defineOptions({
  name: 'HomePage',
})

const router = useRouter()
const { t } = useI18n()

const goToIde = () => {
  router.push('/ide')
}
</script>

<template>
  <GameLayout>
    <div class="home-content">
      <!-- Hero Section -->
      <HeroSection
        :title="t('home.hero.title')"
        :subtitle="t('home.hero.subtitle')"
        :description="t('home.hero.description')"
        icon="mdi:monitor"
      >
        <GameButton
          type="primary"
          size="large"
          icon="mdi:arrow-right"
          icon-position="right"
          class="hero-cta"
          @click="goToIde"
        >
          {{ t('home.hero.cta') }}
        </GameButton>
      </HeroSection>

      <!-- Showcase Section -->
      <section class="showcase-section">
        <div class="showcase-header">
          <h2 class="showcase-title">{{ t('home.showcase.title') }}</h2>
          <p class="showcase-subtitle">{{ t('home.showcase.subtitle') }}</p>
        </div>

        <div class="showcase-grid">
          <!-- Editor Spotlight - Large featured highlight -->
          <GameBlock
            title=""
            :hide-header="true"
            :no-hover-effect="true"
            class="showcase-spotlight showcase-item"
          >
            <div class="spotlight-content">
              <div class="spotlight-text">
                <div class="spotlight-icon">
                  <GameIcon icon="mdi:code-braces" :size="36" />
                </div>
                <h3 class="showcase-item-title">{{ t('home.showcase.items.editor.title') }}</h3>
                <p class="showcase-item-desc">{{ t('home.showcase.items.editor.description') }}</p>
              </div>
              <div class="spotlight-code">
                <div class="code-window">
                  <div class="code-window-bar">
                    <span class="code-dot code-dot-red"></span>
                    <span class="code-dot code-dot-yellow"></span>
                    <span class="code-dot code-dot-green"></span>
                    <span class="code-window-title">HELLO.BAS</span>
                  </div>
                  <pre class="code-block"><code>{{ t('home.showcase.items.editor.code') }}</code></pre>
                </div>
              </div>
            </div>
          </GameBlock>

          <!-- Sprite & Graphics -->
          <GameBlock
            title=""
            :hide-header="true"
            :no-hover-effect="true"
            class="showcase-side showcase-item"
          >
            <div class="showcase-item-inner">
              <div class="showcase-item-icon showcase-item-icon-sprites">
                <GameIcon icon="mdi:ghost" :size="32" />
              </div>
              <h3 class="showcase-item-title">{{ t('home.showcase.items.sprites.title') }}</h3>
              <p class="showcase-item-desc">{{ t('home.showcase.items.sprites.description') }}</p>
            </div>
          </GameBlock>

          <!-- Sound & Music -->
          <GameBlock
            title=""
            :hide-header="true"
            :no-hover-effect="true"
            class="showcase-row-item showcase-item"
          >
            <div class="showcase-item-inner">
              <div class="showcase-item-icon showcase-item-icon-sound">
                <GameIcon icon="mdi:music-note" :size="28" />
              </div>
              <div class="showcase-item-body">
                <h3 class="showcase-item-title">{{ t('home.showcase.items.sound.title') }}</h3>
                <p class="showcase-item-desc">{{ t('home.showcase.items.sound.description') }}</p>
              </div>
            </div>
          </GameBlock>

          <!-- Sample Programs -->
          <GameBlock
            title=""
            :hide-header="true"
            :no-hover-effect="true"
            class="showcase-row-item showcase-item"
          >
            <div class="showcase-item-inner">
              <div class="showcase-item-icon showcase-item-icon-samples">
                <GameIcon icon="mdi:gamepad-variant" :size="28" />
              </div>
              <div class="showcase-item-body">
                <h3 class="showcase-item-title">{{ t('home.showcase.items.samples.title') }}</h3>
                <p class="showcase-item-desc">{{ t('home.showcase.items.samples.description') }}</p>
              </div>
            </div>
          </GameBlock>
        </div>
      </section>
    </div>
  </GameLayout>
</template>

<style scoped>
.home-content {
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  padding: 0 2rem 2rem;
}

.hero-cta {
  margin-top: 2.5rem;
  min-width: 220px;
  font-size: 1.1rem;
  padding: 1rem 2.5rem;
  letter-spacing: 2px;
  font-weight: 700;
  font-family: var(--game-font-family-heading);
}

/* ===== Showcase Section ===== */

.showcase-section {
  padding: 0 0 4rem;
}

.showcase-header {
  text-align: center;
  margin-bottom: 3rem;
}

.showcase-title {
  font-size: 2.2rem;
  font-weight: 700;
  font-family: var(--game-font-family-heading);
  color: var(--base-solid-primary);
  text-shadow: 0 0 16px var(--game-accent-glow);
  margin: 0 0 0.75rem;
  letter-spacing: 2px;
}

/* Light theme: use accent color, no glow */
.light-theme .showcase-title {
  color: var(--base-solid-primary);
  text-shadow: none;
}

.showcase-subtitle {
  font-size: 1.1rem;
  color: var(--game-text-tertiary);
  margin: 0;
  line-height: 1.5;
}

/* ===== Showcase Grid ===== */

.showcase-grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  grid-template-rows: auto auto;
  gap: 1.5rem;
}

.showcase-spotlight {
  grid-column: 1;
  grid-row: 1;
}

.showcase-side {
  grid-column: 2;
  grid-row: 1;
}

.showcase-row-item {
  grid-column: auto;
  grid-row: 2;
}

/* Last row items split evenly */
.showcase-row-item:nth-child(3) {
  grid-column: 1;
}

.showcase-row-item:nth-child(4) {
  grid-column: 2;
}

.showcase-item {
  padding: 0;
  overflow: hidden;
}

/* ===== Spotlight (Editor) ===== */

.spotlight-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 2rem;
}

.spotlight-text {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.spotlight-icon {
  width: 64px;
  height: 64px;
  border-radius: 12px;
  background: var(--game-surface-bg-accent-gradient);
  border: 2px solid var(--base-solid-primary);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 0 20px var(--base-alpha-primary-30);
  color: var(--base-solid-primary);
  margin-bottom: 0.5rem;
}

/* ===== Code Window ===== */

.spotlight-code {
  flex: 1;
}

.code-window {
  background: var(--base-solid-gray-00);
  border: 1px solid var(--base-solid-gray-30);
  border-radius: 8px;
  overflow: hidden;
  box-shadow: inset 0 2px 8px var(--base-alpha-gray-00-40);
}

.code-window-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 0.5rem 0.75rem;
  background: var(--base-solid-gray-10);
  border-bottom: 1px solid var(--base-solid-gray-20);
}

.code-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
}

.code-dot-red {
  background: var(--semantic-solid-danger);
}

.code-dot-yellow {
  background: var(--semantic-solid-warning);
}

.code-dot-green {
  background: var(--semantic-solid-success);
}

.code-window-title {
  margin-left: 0.5rem;
  font-size: 0.7rem;
  color: var(--game-text-tertiary);
  font-family: var(--game-font-family-mono);
  letter-spacing: 1px;
}

.code-block {
  margin: 0;
  padding: 1rem 1.25rem;
  font-family: var(--game-font-family-mono);
  font-size: 0.8rem;
  line-height: 1.7;
  color: var(--base-solid-primary);
  overflow-x: auto;
  white-space: pre;
}

.code-block code {
  font-family: inherit;
  font-size: inherit;
  color: inherit;
  background: transparent;
}

/* ===== Side Item (Sprites) ===== */

.showcase-item-inner {
  padding: 2rem;
  display: flex;
  flex-direction: column;
  height: 100%;
}

.showcase-side .showcase-item-inner {
  justify-content: center;
}

.showcase-item-icon {
  width: 56px;
  height: 56px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.25rem;
  border: 2px solid transparent;
  box-shadow: 0 0 16px var(--base-alpha-primary-20);
  color: var(--base-solid-primary);
}

.showcase-item-icon-sprites {
  background: linear-gradient(135deg, var(--base-solid-primary-10), var(--base-solid-primary-20));
  border-color: var(--base-solid-primary);
}

.showcase-item-icon-sound {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, var(--semantic-alpha-warning-10), var(--semantic-alpha-warning-20));
  border-color: var(--semantic-solid-warning);
  color: var(--semantic-solid-warning);
  box-shadow: 0 0 16px var(--semantic-alpha-warning-20);
}

.showcase-item-icon-samples {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, var(--semantic-alpha-success-10), var(--semantic-alpha-success-20));
  border-color: var(--semantic-solid-success);
  color: var(--semantic-solid-success);
  box-shadow: 0 0 16px var(--semantic-alpha-success-20);
}

/* ===== Row Items (Sound, Samples) ===== */

.showcase-row-item .showcase-item-inner {
  flex-direction: row;
  align-items: flex-start;
  gap: 1.25rem;
}

.showcase-row-item .showcase-item-body {
  flex: 1;
  min-width: 0;
}

/* ===== Shared Item Styles ===== */

.showcase-item-title {
  font-size: 1.3rem;
  font-weight: 700;
  font-family: var(--game-font-family-heading);
  margin: 0 0 0.75rem;
  text-shadow: 0 0 8px var(--game-accent-glow);
}

/* Light theme: use accent color, no glow */
.light-theme .showcase-item-title {
  color: var(--base-solid-primary);
  text-shadow: none;
}

.showcase-item-desc {
  font-size: 0.9rem;
  color: var(--game-text-secondary);
  line-height: 1.6;
  margin: 0;
}

/* ===== Responsive Design ===== */

@media (width <= 768px) {
  .home-content {
    padding: 0 1.5rem 1.5rem;
  }

  .hero-cta {
    min-width: 180px;
    font-size: 1rem;
    padding: 0.875rem 2rem;
  }

  .showcase-grid {
    grid-template-columns: 1fr;
  }

  .showcase-spotlight,
  .showcase-side,
  .showcase-row-item:nth-child(3),
  .showcase-row-item:nth-child(4) {
    grid-column: 1;
  }

  .spotlight-content {
    padding: 1.5rem;
  }

  .showcase-title {
    font-size: 1.8rem;
  }

  .showcase-row-item .showcase-item-inner {
    flex-direction: column;
  }
}

@media (width <= 480px) {
  .hero-cta {
    min-width: 160px;
    font-size: 0.9rem;
    padding: 0.75rem 1.5rem;
  }

  .showcase-title {
    font-size: 1.5rem;
  }

  .showcase-subtitle {
    font-size: 1rem;
  }

  .spotlight-content {
    gap: 1.5rem;
    padding: 1.25rem;
  }

  .showcase-item-inner {
    padding: 1.25rem;
  }
}
</style>
