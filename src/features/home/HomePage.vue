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
 * Features retro-futuristic visual styling inspired by Family Computer heritage.
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
    <div class="home-page">
      <!-- Ambient background effects -->
      <div class="home-bg-glow" aria-hidden="true" />

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
            <!-- Editor -->
            <GameBlock
              title=""
              :hide-header="true"
              :no-hover-effect="true"
              class="showcase-item"
            >
              <div class="showcase-item-inner">
                <div class="showcase-item-icon showcase-item-icon-editor">
                  <GameIcon icon="mdi:code-braces" :size="32" />
                </div>
                <h3 class="showcase-item-title">{{ t('home.showcase.items.editor.title') }}</h3>
                <p class="showcase-item-desc">{{ t('home.showcase.items.editor.description') }}</p>
              </div>
            </GameBlock>

            <!-- Sprite & Graphics -->
            <GameBlock
              title=""
              :hide-header="true"
              :no-hover-effect="true"
              class="showcase-item"
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
              class="showcase-item"
            >
              <div class="showcase-item-inner">
                <div class="showcase-item-icon showcase-item-icon-sound">
                  <GameIcon icon="mdi:music-note" :size="32" />
                </div>
                <h3 class="showcase-item-title">{{ t('home.showcase.items.sound.title') }}</h3>
                <p class="showcase-item-desc">{{ t('home.showcase.items.sound.description') }}</p>
              </div>
            </GameBlock>

            <!-- Sample Programs -->
            <GameBlock
              title=""
              :hide-header="true"
              :no-hover-effect="true"
              class="showcase-item"
            >
              <div class="showcase-item-inner">
                <div class="showcase-item-icon showcase-item-icon-samples">
                  <GameIcon icon="mdi:gamepad-variant" :size="32" />
                </div>
                <h3 class="showcase-item-title">{{ t('home.showcase.items.samples.title') }}</h3>
                <p class="showcase-item-desc">{{ t('home.showcase.items.samples.description') }}</p>
              </div>
            </GameBlock>
          </div>

          <!-- Code Banner — full-width F-BASIC code preview -->
          <GameBlock
            title=""
            :hide-header="true"
            :no-hover-effect="true"
            class="showcase-code-banner"
          >
            <div class="code-banner-content">
              <div class="code-banner-label">
                <GameIcon icon="mdi:code-braces" :size="18" />
                <span>{{ t('home.showcase.items.editor.title') }}</span>
              </div>
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
          </GameBlock>
        </section>
      </div>
    </div>
  </GameLayout>
</template>

<style scoped>
.home-page {
  position: relative;
  max-width: 1400px;
  margin: 0 auto;
  width: 100%;
  padding: 0 2rem 2rem;
}

.home-content {
  position: relative;
  z-index: 1;
  animation:
    home-fade-in-up
    var(--home-entrance-duration, 0.6s)
    var(--home-entrance-easing, cubic-bezier(0.16, 1, 0.3, 1))
    0.3s both;
}

/* Ambient background glow — radial gradient behind hero */
.home-bg-glow {
  position: absolute;
  top: -20%;
  left: 50%;
  width: 120%;
  height: 80%;
  transform: translateX(-50%);
  background: radial-gradient(
    ellipse at center,
    var(--home-glow-subtle, var(--base-alpha-primary-20)) 0%,
    transparent 70%
  );
  pointer-events: none;
  z-index: 0;
}

/* CTA button — retro glow animation */
.hero-cta {
  margin-top: 2.5rem;
  min-width: 220px;
  font-size: 1.1rem;
  padding: 1rem 2.5rem;
  letter-spacing: 2px;
  font-weight: 700;
  font-family: var(--game-font-family-heading);
  animation:
    home-fade-in-up
    var(--home-entrance-duration, 0.6s)
    var(--home-entrance-easing, cubic-bezier(0.16, 1, 0.3, 1))
    0.5s both,
    home-cta-glow 3s ease-in-out infinite;
  animation-fill-mode: both, none;
}

.hero-cta:hover {
  animation: none;
  box-shadow:
    0 0 30px var(--home-glow-intensity, var(--base-alpha-primary-50)),
    0 4px 8px var(--base-alpha-gray-00-40),
    inset 0 1px 0 var(--base-alpha-gray-100-10);
  transform: translateY(-2px);
  transition: all 0.2s ease;
}

/* Responsive design */
@media (width <= 768px) {
  .home-page {
    padding: 0 1.5rem 1.5rem;
  }

  .home-bg-glow {
    width: 160%;
    top: -10%;
  }

  .hero-cta {
    min-width: 180px;
    font-size: 1rem;
    padding: 0.875rem 2rem;
  }
}

@media (width <= 480px) {
  .hero-cta {
    min-width: 160px;
    font-size: 0.9rem;
    padding: 0.75rem 1.5rem;
  }
}
</style>

<style src="@/shared/styles/showcase.css" />
