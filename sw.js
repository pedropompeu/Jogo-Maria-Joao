// F0 (AUD-02): design-tokens.css incluído — vinha via @import e o tema quebrava
// offline. Bump v7→v8 invalida o cache antigo nos clientes.
const CACHE = 'unicorn-v8';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './brand/design-tokens.css',
  './characters.js',
  './game.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    // F0 (AUD-02): ignoreSearch faz game.js?v=4.5 acertar o cache de ./game.js
    // (o ?v= de cache-busting antes gerava miss sempre e matava o offline).
    caches.match(e.request, { ignoreSearch: true }).then(cached => {
      if (cached) return cached;
      return fetch(e.request).catch(() => caches.match('./index.html'));
    })
  );
});
