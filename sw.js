// Версия кэша берётся из строки запроса при регистрации (?v=NN),
// поэтому достаточно один раз поменять номер версии в index.html —
// и sw.js, и manifest.json, и сам кэш всегда останутся синхронны.
const SW_URL = new URL(self.location.href);
const VERSION = SW_URL.searchParams.get('v') || 'dev';
const CACHE_NAME = `qfit-journal-v${VERSION}`;

const ASSETS = [
  './',
  `./index.html?v=${VERSION}`,
  `./styles.css?v=${VERSION}`,
  `./app.js?v=${VERSION}`,
  `./manifest.json?v=${VERSION}`,
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
        if (isNavigation) {
          return caches.match(`./index.html?v=${VERSION}`).then((cached) => cached || caches.match('./'));
        }
        return caches.match(request);
      })
  );
});
