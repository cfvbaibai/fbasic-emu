<script setup lang="ts">
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'

import { GameButton, GameLayout } from '@/shared/components/ui'

/**
 * NotFoundPage component - Displayed when no route matches.
 * Provides a user-friendly 404 error page with navigation back to home.
 */
defineOptions({
  name: 'NotFoundPage',
})

const router = useRouter()
const { t } = useI18n()

const goHome = () => {
  router.push('/')
}
</script>

<template>
  <GameLayout>
    <div class="not-found-content">
      <div class="error-code">404</div>
      <h1 class="error-title">{{ t('errors.notFound.title', 'Page Not Found') }}</h1>
      <p class="error-message">
        {{ t('errors.notFound.message', 'The page you are looking for does not exist or has been moved.') }}
      </p>
      <GameButton type="primary" @click="goHome">
        {{ t('errors.notFound.goHome', 'Go to Home') }}
      </GameButton>
    </div>
  </GameLayout>
</template>

<style scoped>
.not-found-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  text-align: center;
  padding: 2rem;
}

.error-code {
  font-size: 8rem;
  font-weight: 700;
  font-family: var(--game-font-family-heading);
  color: var(--base-solid-primary);
  text-shadow: 0 0 20px var(--game-accent-glow);
  line-height: 1;
  margin-bottom: 1rem;
}

.light-theme .error-code {
  text-shadow: none;
}

.error-title {
  font-size: 2rem;
  font-weight: 600;
  font-family: var(--game-font-family-heading);
  color: var(--game-text-primary);
  margin: 0 0 1rem;
}

.error-message {
  font-size: 1.1rem;
  color: var(--game-text-secondary);
  max-width: 400px;
  margin: 0 0 2rem;
  line-height: 1.6;
}
</style>
