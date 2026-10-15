/* Karma Play service worker: same-origin files only, no third parties, no analytics.
   Install precaches the whole game (shell, code, font, icons and every voice clip) so a
   home-screen install plays fully offline. Code and pages are network-first so a deploy
   reaches players on the next visit; voice and /assets are immutable, so cache-first. */
'use strict';

const CACHE = 'karma-play-v3.0.0';
const SHELL = [
  './',
  './index.html',
  './styles.css?v=3',
  './manifest.webmanifest',
  './icon.svg',
  './js/game.js',
  './js/art.js',
  './js/scene.js',
  './js/stage.js',
  './js/audio.js',
  './js/content.js',
  './js/voice-pack.js',
  './assets/fonts/manrope-kp1.woff2',
  './assets/icons/karma-play-180-2.png',
  './assets/icons/karma-play-192-2.png',
  './assets/icons/karma-play-512-2.png',
];

async function voiceList() {
  const res = await fetch('./js/voice-pack.js', { cache: 'no-cache' });
  const text = await res.text();
  const m = text.match(/CLIPS = (\{[^;]*\});/);
  return m ? Object.keys(JSON.parse(m[1])).map(k => `./voice2/${k}.mp3`) : [];
}

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(SHELL);
    const clips = await voiceList().catch(() => []);
    for (let i = 0; i < clips.length; i += 12) {
      await Promise.allSettled(clips.slice(i, i + 12).map(u => cache.add(u)));
    }
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith('karma-play-') && k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

function fromNetwork(req, timeoutMs) {
  return new Promise((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('timeout')), timeoutMs);
    fetch(req).then(res => { clearTimeout(t); resolve(res); }, err => { clearTimeout(t); reject(err); });
  });
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET' || req.headers.has('range')) return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  const immutable = url.pathname.includes('/voice2/') || url.pathname.includes('/assets/');
  if (immutable) {
    event.respondWith(caches.match(req).then(hit => hit || fetch(req).then(res => {
      if (res.ok && res.type === 'basic') { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    })));
    return;
  }
  if (url.pathname.includes('/voice/')) return;
  event.respondWith((async () => {
    try {
      const res = await fromNetwork(req, 3500);
      if (res.ok && res.type === 'basic') { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    } catch (e) {
      const hit = await caches.match(req) || (req.mode === 'navigate' ? await caches.match('./index.html') : undefined);
      if (hit) return hit;
      throw e;
    }
  })());
});
