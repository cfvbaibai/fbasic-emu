import {
  COI_SERVICE_WORKER_REGISTRATION_FAILED_EVENT,
  type CoiServiceWorkerRegistrationFailedDetail,
} from '@/shared/constants/coiServiceWorker'
import { logApp } from '@/shared/logger'

if (typeof window !== 'undefined') {
  // Register service worker only when cross-origin isolation is still missing.
  if (window.crossOriginIsolated === false && window.isSecureContext && 'serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const baseUrl = import.meta.env.BASE_URL ?? '/'
        const swUrl = `${baseUrl}coi-serviceworker.js`
        const registration = await navigator.serviceWorker.register(swUrl)

        if (registration.active && !navigator.serviceWorker.controller) {
          window.location.reload()
          return
        }

        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload()
        })
      } catch (error) {
        const detail: CoiServiceWorkerRegistrationFailedDetail = {
          errorMessage: error instanceof Error ? error.message : String(error),
        }
        const warningEvent = new CustomEvent<CoiServiceWorkerRegistrationFailedDetail>(
          COI_SERVICE_WORKER_REGISTRATION_FAILED_EVENT,
          { detail }
        )

        window.dispatchEvent(warningEvent)
        logApp.debug('[coi-serviceworker] registration failed:', error)
      }
    })
  }
}
