<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import ErrorBoundary from './shared/components/ErrorBoundary.vue'
import GameButton from './shared/components/ui/GameButton.vue'
import GameIcon from './shared/components/ui/GameIcon.vue'
import { useSkin } from './shared/composables/useSkin'
import {
  COI_SERVICE_WORKER_REGISTRATION_FAILED_EVENT,
  type CoiServiceWorkerRegistrationFailedDetail,
} from './shared/constants/coiServiceWorker'
import { reloadPage } from './shared/utils/reloadPage'

/**
 * App component - Root component of the application.
 * Handles locale synchronization with HTML lang attribute.
 * Initializes skin system early.
 * Wraps entire app in ErrorBoundary for graceful error handling.
 */
defineOptions({
  name: 'App',
})

const { locale } = useI18n()
const showCoiWarning = ref(false)

const isE2ELiteMode = () => {
  if (typeof window === 'undefined') {
    return false
  }

  return new URLSearchParams(window.location.search).get('e2e') === 'lite'
}

const syncCoiWarningFromEnvironment = () => {
  if (typeof window === 'undefined' || isE2ELiteMode()) {
    showCoiWarning.value = false
    return
  }

  showCoiWarning.value = window.crossOriginIsolated === false
}

const handleCoiServiceWorkerRegistrationFailed = (event: Event) => {
  if (isE2ELiteMode()) {
    return
  }

  const customEvent = event as CustomEvent<CoiServiceWorkerRegistrationFailedDetail>
  if (customEvent.detail?.errorMessage) {
    showCoiWarning.value = true
  }
}

const dismissCoiWarning = () => {
  showCoiWarning.value = false
}

// Initialize skin system early
const { currentSkin: _currentSkin } = useSkin()

// Update HTML lang attribute when locale changes
watch(
  locale,
  newLocale => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = newLocale
    }
  },
  { immediate: true }
)

onMounted(() => {
  syncCoiWarningFromEnvironment()
  window.addEventListener(COI_SERVICE_WORKER_REGISTRATION_FAILED_EVENT, handleCoiServiceWorkerRegistrationFailed)
})

onBeforeUnmount(() => {
  window.removeEventListener(COI_SERVICE_WORKER_REGISTRATION_FAILED_EVENT, handleCoiServiceWorkerRegistrationFailed)
})
</script>

<template>
  <ErrorBoundary name="AppRoot">
    <section v-if="showCoiWarning" class="coi-warning-banner" role="status" aria-live="polite">
      <div class="coi-warning-content">
        <GameIcon icon="mdi:alert" size="small" />
        <p>
          High-performance mode is unavailable because cross-origin isolation is not enabled.
          Try reloading, use HTTPS, and confirm COOP/COEP headers are configured.
        </p>
      </div>
      <div class="coi-warning-actions">
        <GameButton type="warning" size="small" @click="reloadPage">Reload</GameButton>
        <GameButton size="small" @click="dismissCoiWarning">Dismiss</GameButton>
      </div>
    </section>
    <router-view />
  </ErrorBoundary>
</template>

<style scoped>
.coi-warning-banner {
  position: sticky;
  top: 0;
  z-index: 900;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid var(--semantic-solid-warning);
  background: linear-gradient(
    90deg,
    var(--semantic-alpha-warning-30) 0%,
    var(--semantic-alpha-warning-10) 100%
  );
}

.coi-warning-content {
  display: flex;
  flex: 1;
  align-items: center;
  gap: 0.5rem;
  min-width: 280px;
}

.coi-warning-content p {
  margin: 0;
  color: var(--game-text-primary);
  font-family: var(--game-font-family);
  font-size: 0.875rem;
  line-height: 1.4;
}

.coi-warning-actions {
  display: flex;
  gap: 0.5rem;
}

@media (width <= 720px) {
  .coi-warning-actions {
    width: 100%;
  }

  .coi-warning-actions :deep(.game-button) {
    flex: 1;
  }
}
</style>
