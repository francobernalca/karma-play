/* Karma Play service worker — caches only this game's public assets.
   No third-party URLs. No analytics. Offline-first for free play. */
'use strict';

const CACHE = 'karma-play-v2.2.1';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon.svg',
  './og-card.jpg',
  './robots.txt',
  './voice/manifest.json'
  // intro.mp4 is large media — fetched natively (Range), not precached
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
      .catch(() => {})
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  // Same-origin only — never touch foreign hosts
  if (url.origin !== self.location.origin) return;

  // CRITICAL: do not intercept media (voice, intro video) or Range requests.
  // SW caching without 206 Range support breaks audio/video on mobile.
  if (
    url.pathname.includes('/voice/') ||
    url.pathname.endsWith('/intro.mp4') ||
    url.pathname.endsWith('intro.mp4') ||
    req.headers.has('range')
  ) {
    return;
  }

  event.respondWith(
    caches.match(req).then(cached => {
      const network = fetch(req).then(res => {
        if (res && res.ok && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy)).catch(() => {});
        }
        return res;
      }).catch(() => cached);

      // Prefer network when online so deploys update; fall back to cache offline
      return network.then(res => res || cached).catch(() => cached);
    })
  );
});
