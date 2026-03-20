/* eslint-disable no-restricted-globals */
// Adapted from the Cross-Origin Isolation Service Worker pattern.
// Keeps SharedArrayBuffer available on static hosts like GitHub Pages.

if (typeof window === 'undefined') {
  self.addEventListener('install', () => self.skipWaiting())

  self.addEventListener('activate', event => {
    event.waitUntil(self.clients.claim())
  })

  self.addEventListener('fetch', event => {
    const request = event.request
    if (request.cache === 'only-if-cached' && request.mode !== 'same-origin') {
      return
    }

    event.respondWith(
      fetch(request)
        .then(response => {
          if (response.status === 0) return response

          const headers = new Headers(response.headers)
          headers.set('Cross-Origin-Embedder-Policy', 'require-corp')
          headers.set('Cross-Origin-Opener-Policy', 'same-origin')
          headers.set('Cross-Origin-Resource-Policy', 'cross-origin')

          return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers,
          })
        })
        .catch(error => {
          console.error('[coi-serviceworker] fetch failed:', error)
          throw error
        })
    )
  })
} else {
  // Register service worker only when cross-origin isolation is still missing.
  if (window.crossOriginIsolated === false && window.isSecureContext && 'serviceWorker' in navigator) {
    window.addEventListener('load', async () => {
      try {
        const registration = await navigator.serviceWorker.register('./coi-serviceworker.js')

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
