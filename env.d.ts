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
    /** DEV-only API for headless test code injection. Undefined in production builds. */
    __fbasicIDE?: {
      loadCode: (code: string) => void
      run: () => Promise<void>
      stop: () => void
      respondToInput: (value: string) => void
    }
  }
}

export {}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<Record<string, unknown>, Record<string, unknown>, unknown>
  export default component
}
