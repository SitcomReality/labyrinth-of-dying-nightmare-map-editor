const CACHE_NAME = 'dungeon-cache-v1';
const shouldCache = (url) => (
  url.includes('/zassets/gltf/') ||
  url.endsWith('.gltf') || url.endsWith('.bin') || url.endsWith('.png') ||
  url.endsWith('.js') || url.endsWith('.css')
);

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (!shouldCache(url.pathname)) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(event.request);
    const fetchPromise = fetch(event.request).then((resp) => {
      if (resp && resp.status === 200) cache.put(event.request, resp.clone());
      return resp;
    }).catch(() => cached);
    return cached || fetchPromise;
  })());
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
  ));
});

