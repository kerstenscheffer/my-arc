// public/service-worker.js
// VERSIE VERHOGEN FORCEERT UPDATE!
const CACHE_NAME = 'my-arc-v1.0.2'; // VERHOOGD van v1.0.0
const urlsToCache = [
  '/'
  // Removed other files - let Vite handle them
];

// Install event - minimal caching
self.addEventListener('install', (event) => {
  console.log('📦 Installing new service worker v1.0.2');
  // Skip waiting to activate immediately
  self.skipWaiting();
});

// Activate event - CLEAR ALL OLD CACHES
self.addEventListener('activate', (event) => {
  console.log('🔄 Activating new service worker v1.0.2');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      // Delete ALL caches to force fresh content
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('🗑️ Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      // Take control of all pages immediately
      return self.clients.claim();
    })
  );
});

// Fetch event - NETWORK FIRST for everything
self.addEventListener('fetch', (event) => {
  // Skip non-http(s) requests
  if (!event.request.url.startsWith('http')) {
    return;
  }

  // For navigation requests (HTML pages)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // Only use cache as last resort
          return caches.match('/index.html')
            .then(response => {
              if (response) {
                return response;
              }
              // Return a basic offline page
              return new Response(
                '<html><body><h1>MY ARC</h1><p>Geen verbinding. Check je internet.</p></body></html>',
                { headers: { 'Content-Type': 'text/html' } }
              );
            });
        })
    );
    return;
  }

  // For all other requests - network only
  event.respondWith(fetch(event.request));
});

// Message event to skip waiting
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
