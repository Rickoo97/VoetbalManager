// Service Worker: maakt de game offline speelbaar en installeerbaar (PWA)
const CACHE_NAME = 'ovm-cache-v3.12.0';

const ASSETS = [
  '.',
  'index.html',
  'style.css',
  'manifest.json',
  'js/main.js',
  'js/config.js',
  'js/engine.js',
  'js/store.js',
  'js/ui.js',
  'js/utils.js',
  'js/views.js',
  'icons/icon-192.png',
  'icons/icon-512.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Network-first voor same-origin: altijd de nieuwste versie als er internet is,
// cache als fallback zodat de game offline blijft werken.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;

  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(e.request, copy));
        return res;
      })
      .catch(() => caches.match(e.request).then((hit) => hit || caches.match('index.html')))
  );
});
