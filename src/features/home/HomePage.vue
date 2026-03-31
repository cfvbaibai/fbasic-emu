<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import { GameButton, GameLayout, HeroSection } from '@/shared/components/ui'

/**
 * HomePage component - The home/landing page of the application.
 * Displays a hero section with branding and a GET-STARTED CTA button.
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

/* Responsive design */
@media (width <= 768px) {
  .home-content {
    padding: 0 1.5rem 1.5rem;
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
