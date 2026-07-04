/* NEXUS v3.0 — Service Worker (Offline + Install + Push Notifications) */
const CACHE_NAME = 'nexus-v15-cache';
const ASSETS = [
  '/',
  '/index.html',
  '/login.html',
  '/manifest.json',
  '/assets/logo.png',
  '/assets/icon-192.png',
  '/assets/icon-512.png',
  '/css/main.css',
  '/css/chat.css',
  '/css/features.css',
  '/css/preloader.css',
  '/css/login.css',
  '/css/dashboard.css',
  '/js/app.js',
  '/js/chat.js',
  '/js/gemini.js',
  '/js/voice.js',
  '/js/settings.js',
  '/js/knowledge.js',
  '/js/preloader.js',
  '/js/firebase-config.js',
  '/js/database.js',
  '/js/dashboard.js',
  '/js/error-handler.js',
  '/js/file-handler.js',
  '/js/i18n.js',
  '/js/social.js',
  '/js/search.js',
  '/js/templates.js',
  '/js/themes.js',
  '/js/shortcuts.js',
  '/js/personas.js',
  '/js/memory-viz.js',
  '/js/suggestions.js',
  '/js/focus.js',
  '/js/folders.js',
  '/js/notes.js',
  '/js/challenges.js',
  '/js/analytics.js',
  '/js/recap.js',
  '/js/flashcards.js',
  '/js/export.js',
  '/js/reactions.js',
  '/js/code-highlight.js',
  '/js/bookmarks.js',
  '/js/system-prompts.js',
  '/js/typing-indicator.js',
  '/js/scroll-fab.js',
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
  // Skip API calls & Firebase — always network
  if (e.request.url.includes('generativelanguage.googleapis.com') ||
      e.request.url.includes('firestore.googleapis.com') ||
      e.request.url.includes('firebase') ||
      e.request.url.includes('/api/')) return;

  e.respondWith(
    fetch(e.request)
      .then(resp => {
        if (resp.ok) {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        }
        return resp;
      })
      .catch(() => caches.match(e.request))
  );
});

// ====== PUSH NOTIFICATIONS ======

// Receive push event from server or app
self.addEventListener('push', e => {
  let data = { title: 'Nexus', body: 'You have a new notification!', icon: '/assets/icon-192.png' };

  if (e.data) {
    try {
      data = { ...data, ...e.data.json() };
    } catch {
      data.body = e.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/assets/icon-192.png',
    badge: '/assets/icon-192.png',
    vibrate: [100, 50, 100, 50, 200],
    data: {
      url: data.url || '/',
      timestamp: Date.now()
    },
    actions: data.actions || [
      { action: 'open', title: '🚀 Open Nexus' },
      { action: 'dismiss', title: 'Dismiss' }
    ],
    tag: data.tag || 'nexus-notification',
    renotify: true,
    requireInteraction: data.requireInteraction || false
  };

  e.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Handle notification click
self.addEventListener('notificationclick', e => {
  e.notification.close();

  const url = e.notification.data?.url || '/';

  if (e.action === 'dismiss') return;

  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
      // Focus existing window if open
      for (const client of windowClients) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window
      return clients.openWindow(url);
    })
  );
});

// Handle messages from the main app (for triggering notifications)
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'SHOW_NOTIFICATION') {
    const { title, body, icon, tag, url, actions } = e.data;
    self.registration.showNotification(title || 'Nexus', {
      body: body || '',
      icon: icon || '/assets/icon-192.png',
      badge: '/assets/icon-192.png',
      vibrate: [100, 50, 100],
      tag: tag || 'nexus-' + Date.now(),
      renotify: true,
      data: { url: url || '/' },
      actions: actions || [
        { action: 'open', title: '🚀 Open' },
        { action: 'dismiss', title: 'Dismiss' }
      ]
    });
  }
});
