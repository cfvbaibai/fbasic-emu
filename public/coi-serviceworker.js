// Cross-Origin Isolation service worker
// Based on https://github.com/gzuidhof/coi-serviceworker (MIT)

const COOP = 'same-origin'
const COEP = 'require-corp'
const CORP = 'cross-origin'

self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim())
})

self.addEventListener('fetch', event => {
  event.respondWith(
    (async () => {
      const response = await fetch(event.request)

      // Opaque responses cannot be modified.
      if (!response || response.type === 'opaque') {
        return response
      }

      const newHeaders = new Headers(response.headers)
      newHeaders.set('Cross-Origin-Opener-Policy', COOP)
      newHeaders.set('Cross-Origin-Embedder-Policy', COEP)
      newHeaders.set('Cross-Origin-Resource-Policy', CORP)

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      })
    })()
  )
})
