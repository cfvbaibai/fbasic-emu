import './style.css'
import './shared/styles/fonts'
import './shared/styles/theme.css'
import './shared/styles/utilities.css'
import './shared/styles/skins/index.css'

import { createApp } from 'vue'
import VueKonva from 'vue-konva'

import App from './App.vue'
import router from './router/index'
import i18n from './shared/i18n'
import { logApp } from './shared/logger'

if (typeof window !== 'undefined') {
  // Global handler for unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    logApp.error('Unhandled promise rejection:', event.reason)
  })
}

const app = createApp(App)

// Global error handler for Vue errors
app.config.errorHandler = (err, instance, info) => {
  logApp.error('Vue error:', err, info)
  // Error is logged but not re-thrown, allowing the app to continue
  // ErrorBoundary components can catch and display these errors
}

// Global warning handler for Vue warnings (development mode)
app.config.warnHandler = (msg, instance, trace) => {
  logApp.warn('Vue warning:', msg, trace)
}

app.use(router)
app.use(i18n)
app.use(VueKonva)

// Pre-initialize background tile images early (non-blocking)
// This ensures images are ready when the IDE page loads
if (typeof window !== 'undefined') {
  void import('@/features/ide/composables/useCanvasBackgroundRenderer').then(({ preInitializeBackgroundTiles }) => {
    void preInitializeBackgroundTiles().catch((err: Error) => {
      logApp.warn('Background tile pre-initialization failed:', err)
    })
  })
}

app.mount('#app')
