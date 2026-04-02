const CACHE_NAME = 'addis-transit-v2';

// Install event - skip waiting to activate immediately
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

// Activate event - claim all clients immediately and clear old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    Promise.all([
      // Clear ALL old caches
      caches.keys().then((keys) =>
        Promise.all(keys.map((key) => caches.delete(key)))
      ),
      // Claim all clients
      self.clients.claim(),
    ])
  );
});

// Fetch event - NEVER cache API calls, always fetch fresh
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // API requests - ALWAYS fetch from network, no caching
  if (url.pathname.startsWith('/api/') || url.hostname.includes('render.com')) {
    event.respondWith(
      fetch(event.request)
        .then((response) => response)
        .catch((error) => {
          console.error('Fetch failed:', error);
          throw error;
        })
    );
    return;
  }

  // All other requests - network first
  event.respondWith(fetch(event.request));
});

// Push notification handler
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {};
  const options = {
    body: data.body || 'Bus update available',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: data.tag || 'transit-update',
  };
  event.waitUntil(
    self.registration.showNotification(data.title || 'AddisTransit', options)
  );
});
