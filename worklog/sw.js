const VERSION = 'worklog-1.2.0'
const CACHE = VERSION

const PRECACHE = [
  './',
  './index.html',
  './css/style.css',
  './manifest.webmanifest',
  './js/app.js',
  './js/date.js',
  './js/calc.js',
  './js/holidays.js',
  './js/storage.js',
  './js/store.js',
  './js/plans.js',
  './js/feed.js',
  './js/pwa.js',
  './js/ui/dom.js',
  './js/ui/sheet.js',
  './js/ui/calendar.js',
  './js/ui/day-sheet.js',
  './js/ui/stats.js',
  './js/ui/settings.js',
  './js/ui/holiday-page.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE)
      await Promise.allSettled(PRECACHE.map((url) => cache.add(new Request(url, { cache: 'reload' }))))
      await self.skipWaiting()
    })(),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys()
      await Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))
      await self.clients.claim()
    })(),
  )
})

async function put(request, response) {
  if (!response || !response.ok) return
  const cache = await caches.open(CACHE)
  await cache.put(request, response.clone())
}

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          const fresh = await fetch(request)
          await put('./index.html', fresh)
          return fresh
        } catch (err) {
          return (
            (await caches.match('./index.html')) ||
            (await caches.match('./')) ||
            new Response('离线，且没有缓存。请联网打开一次。', {
              status: 503,
              headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            })
          )
        }
      })(),
    )
    return
  }

  event.respondWith(
    (async () => {
      try {
        const fresh = await fetch(request)
        await put(request, fresh)
        return fresh
      } catch (err) {
        const cached = await caches.match(request)
        if (cached) return cached
        return new Response('', { status: 504, statusText: 'Offline' })
      }
    })(),
  )
})

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting()
})
