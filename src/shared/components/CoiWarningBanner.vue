<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'

import {
  COI_SERVICE_WORKER_REGISTRATION_FAILED_EVENT,
  type CoiServiceWorkerRegistrationFailedDetail,
} from '@/shared/constants/coiServiceWorker'
import { reloadPage } from '@/shared/utils/reloadPage'

import GameButton from './ui/GameButton.vue'
import GameIcon from './ui/GameIcon.vue'

/**
 * CoiWarningBanner component - Displays a warning when cross-origin isolation
 * is not enabled, which is required for SharedArrayBuffer and high-performance mode.
 *
 * Listens for the COI service worker registration failed event and checks
 * the browser's crossOriginIsolated state on mount.
 */
defineOptions({
  name: 'CoiWarningBanner',
})

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

onMounted(() => {
  syncCoiWarningFromEnvironment()
  window.addEventListener(COI_SERVICE_WORKER_REGISTRATION_FAILED_EVENT, handleCoiServiceWorkerRegistrationFailed)
})

onBeforeUnmount(() => {
  window.removeEventListener(COI_SERVICE_WORKER_REGISTRATION_FAILED_EVENT, handleCoiServiceWorkerRegistrationFailed)
})
</script>

<template>
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
