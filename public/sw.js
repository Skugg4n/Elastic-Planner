// Elastic Planner Service Worker
const CACHE_VERSION = 'ep-cache-v1';
const APP_SHELL = ['/', '/index.html', '/favicon.svg', '/manifest.webmanifest'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL).catch(() => {}))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Network-first for navigation, cache-first for assets
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).catch(() => caches.match('/index.html'))
    );
    return;
  }
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      const resClone = res.clone();
      caches.open(CACHE_VERSION).then((cache) => cache.put(req, resClone).catch(() => {}));
      return res;
    }).catch(() => cached))
  );
});

// Schedule notifications via postMessage from the app
self.addEventListener('message', (event) => {
  const data = event.data;
  if (!data || data.type !== 'schedule-notifications') return;
  const blocks = data.blocks || [];
  const supportsTriggers = 'showTrigger' in Notification.prototype;

  blocks.forEach((b) => {
    const when = b.timestamp;
    if (when <= Date.now()) return;
    if (supportsTriggers) {
      try {
        self.registration.showNotification(`⏰ ${b.label}`, {
          body: `${b.duration}h ${b.category || ''}`.trim(),
          tag: b.tag,
          showTrigger: new TimestampTrigger(when),
          icon: '/favicon.svg',
          badge: '/favicon.svg',
        }).catch(() => {});
      } catch (e) { /* ignore */ }
    }
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow('/');
    })
  );
});
