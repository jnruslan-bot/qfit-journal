const CACHE_NAME = 'qfit-journal-v57-restore-landing';
const APP_SHELL = [
  './',
  './index.html?v=57',
  './styles.css?v=57',
  './app.js?v=57',
  './manifest.json?v=57',
  './assets/qfit-wordmark.svg',
  './assets/qfit-logo.svg',
  './assets/gym-bg.svg',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/favicon.svg'
];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put('./index.html?v=57', copy));
        return response;
      }).catch(() => caches.match('./index.html?v=57').then((cached) => cached || caches.match('./')))
    );
    return;
  }

  event.respondWith(
    fetch(request).then((response) => {
      if (response && response.status === 200) {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
      }
      return response;
    }).catch(() => caches.match(request))
  );
});
