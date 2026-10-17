// Unicórnio novo com cabelo simulado + botões de toque 1/3 maiores. Bump v13→v14.
// REGRA: todo release que toca arquivo cacheado exige bump — sem ele,
// clientes com SW instalado ficam no stale eterno (AUD-02). Depois do bump:
// `npm run sw:lock` (o CI falha se um arquivo do ASSETS mudar sem bump).
const CACHE = 'unicorn-v14';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './brand/design-tokens.css',
  './characters.js',
  './icons.js',
  './levels-data.js',
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
