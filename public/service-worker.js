// service-worker.js
// Service worker básico para PWA (solo cachea archivos estáticos principales)
const CACHE_NAME = 'parqueos-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/parkings.html',
  '/reserve.html',
  '/publish.html',
  '/login.html',
  '/metrics.html',
  '/app.js',
  '/manifest.json',
  '/logo.png',
  'https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css'
];
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
