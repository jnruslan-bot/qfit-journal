const CACHE_NAME = 'qfit-journal-v50-start-page-fix';
const ASSETS = [
  './',
  './index.html?v=49',
  './styles.css?v=49',
  './app.js?v=49',
  './manifest.json?v=49',
  './assets/app-icon.svg',
  './assets/favicon.svg',
  './assets/gym-bg.svg',
  './assets/qfit-logo.svg',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/start-screen-mobile.png',
  './assets/start-screen-mobile-clean.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const request = event.request;
  const isNavigation = request.mode === 'navigate' || (request.headers.get('accept') || '').includes('text/html');

  event.respondWith(
    fetch(request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        return response;
      })
      .catch(() => {
        if (isNavigation) return caches.match('./index.html?v=49').then((cached) => cached || caches.match('./'));
        return caches.match(request);
      })
  );
});
