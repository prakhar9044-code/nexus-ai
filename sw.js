/* NEXUS v2.0 — Service Worker for PWA (Offline + Install) */
const CACHE_NAME = 'nexus-v2-cache';
const ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/assets/logo.png',
  '/assets/icon-192.png',
  '/assets/icon-512.png',
  '/css/main.css',
  '/css/chat.css',
  '/css/features.css',
  '/css/preloader.css',
  '/js/app.js',
  '/js/chat.js',
  '/js/gemini.js',
  '/js/voice.js',
  '/js/settings.js',
  '/js/knowledge.js',
  '/js/preloader.js',
  '/js/features/feature-chat.js',
  '/js/features/all-features.js'
];

// Install — cache all assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// Activate — clean old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch — network first, fallback to cache
self.addEventListener('fetch', e => {
  // Skip API calls (Gemini) — always go to network
  if (e.request.url.includes('generativelanguage.googleapis.com')) return;

  e.respondWith(
    fetch(e.request)
      .then(resp => {
        // Cache successful responses
        if (resp.ok) {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return resp;
      })
      .catch(() => caches.match(e.request))
  );
});
