// Cart Log · Service Worker
//
// 策略：网络优先（network-first）。
//   1. 先请求网络，成功就返回最新内容，并顺手写回缓存；
//   2. 只有网络失败（离线、断网、服务器错误）时才回退到缓存；
//   3. 导航请求在没有缓存兜底时给出离线提示页。
//
// 因此修改 index.html / styles.css / app.js 后**不需要**再手改版本号，
// 刷新就能拿到新文件。CACHE 只用于「离线仍可打开」，
// 只有在需要一次性丢弃全部旧缓存时才改它的名字。

const CACHE = 'cartlog-v19';
// 说明：CACHE 名字只在「想一次性丢弃全部旧缓存」时才改，日常改页面文件不用动它。

const ASSETS = [
  './',
  './index.html',
  './styles.css',
  './app.js',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];

// 让 sw.js 自己在启动时就把页面文件抓全，装好后立刻具备离线能力
self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await Promise.allSettled(
        ASSETS.map((url) => cache.add(new Request(url, { cache: 'reload' })))
      );
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

async function putInCache(request, response) {
  if (!response || !response.ok) return;
  try {
    const cache = await caches.open(CACHE);
    await cache.put(request, response.clone());
  } catch (error) {
    // 配额满或 response 不可缓存时忽略，不影响本次响应
  }
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    (async () => {
      try {
        // cache: 'no-cache' → 跳过浏览器 HTTP 缓存直接向服务器校验，
        // 避免 GitHub Pages 的 max-age 让用户十分钟内看到旧文件。
        const fresh = await fetch(request, { cache: 'no-cache' });
        await putInCache(request, fresh);
        return fresh;
      } catch (error) {
        const cached = await caches.match(request);
        if (cached) return cached;

        if (request.mode === 'navigate') {
          const shell = await caches.match('./index.html');
          if (shell) return shell;
          return new Response('离线，且没有缓存。请联网打开一次。', {
            status: 503,
            headers: { 'Content-Type': 'text/plain; charset=utf-8' }
          });
        }

        return new Response('', { status: 504, statusText: 'Offline' });
      }
    })()
  );
});
