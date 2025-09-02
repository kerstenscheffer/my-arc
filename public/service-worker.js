// public/service-worker.js
// VERHOOG DIT NUMMER BIJ BELANGRIJKE UPDATES!
const CACHE_NAME = 'my-arc-v1.0.3'; 
const VERSION = '1.0.3';

// Install event
self.addEventListener('install', (event) => {
  console.log(`📦 Installing MY ARC ${VERSION}`);
  // Force activation of new version
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log(`🚀 MY ARC ${VERSION} now active`);
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('🗑️ Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Notify all clients about update
      return self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'NEW_VERSION_AVAILABLE',
            version: VERSION
          });
        });
      });
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch event - Network first
self.addEventListener('fetch', (event) => {
  if (!event.request.url.startsWith('http')) {
    return;
  }

  // Network first, fallback to cache
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Clone the response before caching
        const responseToCache = response.clone();
        
        // Update cache in background
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
        
        return response;
      })
      .catch(() => {
        // Offline - use cache
        return caches.match(event.request);
      })
  );
});

// Check for updates every 5 minutes when app is open
setInterval(() => {
  self.registration.update();
}, 5 * 60 * 1000);
