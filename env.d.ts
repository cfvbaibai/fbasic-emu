/// <reference types="vite/client" />

// Vite ?worker imports: default export is a Worker constructor
declare module '*?worker' {
  const WorkerConstructor: new () => Worker
  export default WorkerConstructor
}

// Monaco Editor environment configuration
declare global {
  interface Window {
    MonacoEnvironment?: {
      getWorkerUrl?: (workerId: string, label: string) => string
      getWorker?: (workerId: string, label: string) => Worker
    }
    /**
     * API for headless test automation.
     * getScreenText is available in all builds (DEV and production).
     * State-mutating methods are DEV-only; absent in production builds.
     */
    __fbasicIDE?: {
      /** DEV-only: set editor code. */
      loadCode?: (code: string) => void
      /** DEV-only: run the program. */
      run?: () => Promise<void>
      /** DEV-only: stop program execution. */
      stop?: () => void
      /** DEV-only: respond to a pending INPUT request. */
      respondToInput?: (value: string) => void
      /** Read screen buffer as array of trimmed row strings. */
      getScreenText: () => string[]
    }
  }
}

export {}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}
