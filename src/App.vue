<script setup lang="ts">
import { watch } from 'vue'
import { useI18n } from 'vue-i18n'

import CoiWarningBanner from './shared/components/CoiWarningBanner.vue'
import ErrorBoundary from './shared/components/ErrorBoundary.vue'
import { useSkin } from './shared/composables/useSkin'

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
</script>

<template>
  <ErrorBoundary name="AppRoot">
    <CoiWarningBanner />
    <router-view />
  </ErrorBoundary>
</template>
