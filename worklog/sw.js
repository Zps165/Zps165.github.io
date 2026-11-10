// 工时记 · Service Worker
//
// 策略：网络优先（network-first）。
//   1. 先请求网络，成功就返回最新内容并写回缓存；
//   2. 只有网络失败（离线、断网、服务器错误）时才回退到缓存；
//   3. 都没有时给出离线提示。
//
// 所以改完页面文件直接刷新就能拿到新版，不需要为了「更新缓存」去改 VERSION。
// VERSION（= 缓存名）只在需要一次性丢弃全部旧缓存时才升。

const VERSION = 'worklog-1.3.0'
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
  try {
    const cache = await caches.open(CACHE)
    await cache.put(request, response.clone())
  } catch (err) {
    // 配额满或响应不可缓存时忽略，不影响本次请求
  }
}

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return
  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  event.respondWith(
    (async () => {
      try {
        // cache: 'no-cache' → 绕过浏览器 HTTP 缓存，先向服务器校验，
        // 避免 GitHub Pages 的 max-age=600 让改动十分钟内看不到。
        const fresh = await fetch(request, { cache: 'no-cache' })
        await put(request, fresh)
        return fresh
      } catch (err) {
        const cached = await caches.match(request)
        if (cached) return cached

        if (request.mode === 'navigate') {
          const shell = (await caches.match('./index.html')) || (await caches.match('./'))
          if (shell) return shell
          return new Response('离线，且没有缓存。请联网打开一次。', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
          })
        }

        return new Response('', { status: 504, statusText: 'Offline' })
      }
    })(),
  )
})

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING' || (event.data && event.data.type === 'SKIP_WAITING')) {
    self.skipWaiting()
  }
})
