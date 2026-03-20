if (typeof window !== 'undefined') {
  // Register service worker only when cross-origin isolation is still missing.
  if (window.crossOriginIsolated === false && window.isSecureContext && 'serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('/coi-serviceworker.js')

        if (registration.active && !navigator.serviceWorker.controller) {
          window.location.reload()
          return
        }

        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload()
        })
      } catch (error) {
        console.error('[coi-serviceworker] registration failed:', error)
      }
    })
  }
}
