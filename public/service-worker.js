// public/service-worker.js
// Version 1.0.4 - Fixed POST caching issue
const CACHE_NAME = 'my-arc-v1.0.4'; 
const VERSION = '1.0.4';

// Install event
self.addEventListener('install', (event) => {
  console.log(`📦 Installing MY ARC ${VERSION}`);
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

// Fetch event - Network first, cache for GET only
self.addEventListener('fetch', (event) => {
  // Skip non-HTTP requests
  if (!event.request.url.startsWith('http')) {
    return;
  }

  // Skip POST, PUT, DELETE requests - these should never be cached
  if (event.request.method !== 'GET') {
    event.respondWith(fetch(event.request));
    return;
  }

  // Skip API calls - always fetch fresh
  if (event.request.url.includes('/rest/v1/') || 
      event.request.url.includes('/auth/v1/') ||
      event.request.url.includes('supabase')) {
    event.respondWith(fetch(event.request));
    return;
  }

  // Network first strategy for GET requests only
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Only cache successful GET responses
        if (response.status === 200 && event.request.method === 'GET') {
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseToCache);
          });
        }
        
        return response;
      })
      .catch(() => {
        // Offline - try cache for GET requests
        if (event.request.method === 'GET') {
          return caches.match(event.request);
        }
        // For non-GET, just fail
        return new Response('Network error', { status: 503 });
      })
  );
});

// Check for updates every 5 minutes when app is open
setInterval(() => {
  self.registration.update();
}, 5 * 60 * 1000);
