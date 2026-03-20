import EditorWorker from 'monaco-editor/esm/vs/editor/editor.worker.js?worker'

let isConfigured = false

/**
 * Configure Monaco worker routing lazily so app shell does not import Monaco workers.
 */
export function configureMonacoWorkers(): void {
  if (isConfigured || typeof window === 'undefined') return

  window.MonacoEnvironment = {
    getWorker(_workerId: string, label: string): Worker {
      // F-BASIC editor only needs the generic editor worker.
      // Avoid shipping language-service workers for json/css/html/ts to keep Monaco bundles small.
      void label
      return new EditorWorker()
    },
  }

  isConfigured = true
}
