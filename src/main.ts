import './style.css'
import './shared/styles/fonts'
import './shared/styles/theme.css'
import './shared/styles/utilities.css'
import './shared/styles/skins/index.css'

// Register MDI icon set locally so icons load from bundle instead of Iconify API.
import { icons } from '@iconify-json/mdi'

import type { IconCollectionData } from '@/shared/icons'
import { registerIconCollection } from '@/shared/icons'
// @iconify-json/mdi icons type lacks index signature; assert for IconCollectionData
// eslint-disable-next-line no-restricted-syntax -- IconifyJSON.icons not assignable to Record<string, ...>
registerIconCollection({ prefix: 'mdi', icons, width: 24, height: 24 } as unknown as IconCollectionData)

// Configure Monaco Editor workers before Monaco is imported.
// Use Vite's ?worker imports so workers are bundled and load correctly (avoids
// "Could not create web worker(s)" and uncaught Worker error events when
// /node_modules/ is not served by the dev server).
import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker.js?worker'
import CssWorker from 'monaco-editor/esm/vs/language/css/css.worker.js?worker'
import HtmlWorker from 'monaco-editor/esm/vs/language/html/html.worker.js?worker'
import JsonWorker from 'monaco-editor/esm/vs/language/json/json.worker.js?worker'
import TsWorker from 'monaco-editor/esm/vs/language/typescript/ts.worker.js?worker'
import { createApp } from 'vue'
import VueKonva from 'vue-konva'

import App from './App.vue'
import router from './router/index'
import i18n from './shared/i18n'
import { logApp } from './shared/logger'

if (typeof window !== 'undefined') {
  window.MonacoEnvironment = {
    getWorker(_workerId: string, label: string): Worker {
      if (label === 'json') return new JsonWorker()
      if (label === 'css' || label === 'scss' || label === 'less') return new CssWorker()
      if (label === 'html' || label === 'handlebars' || label === 'razor') return new HtmlWorker()
      if (label === 'typescript' || label === 'javascript') return new TsWorker()
      return new EditorWorker()
    },
  }

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
