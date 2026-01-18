// Service Worker cho PWA Minigame Collection
// Version và cache names (format: yyyymmddHHMM)
const CACHE_VERSION = '202601181853';
const CACHE_NAME = `minigame-pwa-${CACHE_VERSION}`;
const OFFLINE_URL = './offline.html';

// Files cần cache ngay khi install
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './offline.html',
  './css/style.css',
  './js/app.js',
  './manifest.json',
  './games/number-game.js',
  './images/game/car.png',
  './images/icons/icon-192x192.png',
  './images/icons/icon-512x512.png',
  // Các icons khác sẽ được cache khi cần
];

// Install event - precache các assets quan trọng
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Precaching app shell');
        return cache.addAll(PRECACHE_ASSETS);
      })
      .then(() => {
        // Notify clients about cache update
        self.clients.matchAll().then(clients => {
          clients.forEach(client => {
            client.postMessage({
              type: 'CACHE_UPDATED',
              message: 'アプリをキャッシュしました'
            });
          });
        });
        return self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME) {
              console.log('[Service Worker] Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => self.clients.claim()) // Take control immediately
  );
});

// Fetch event - Network-first for game files, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Allow CDN requests (Phaser from jsdelivr)
  const isCDN = url.hostname === 'cdn.jsdelivr.net';
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Determine if this is a game file or CDN resource
  const isGameOrCDN = url.pathname.includes('/games/') || isCDN;

  if (isGameOrCDN) {
    // Network-first strategy for game files and CDN
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Check if valid response
          if (!response || response.status !== 200) {
            // Try cache as fallback
            return caches.match(event.request).then(cached => cached || response);
          }
          
          // Clone response to cache and return
          const responseToCache = response.clone();
          
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
              console.log('[Service Worker] Cached new resource:', event.request.url);
              
              // Notify clients about cache update
              const fileName = url.pathname.split('/').pop();
              let message = '';
              
              if (isCDN) {
                message = 'Phaserをキャッシュしました';
              } else if (url.pathname.includes('/games/')) {
                message = `${fileName}をキャッシュしました`;
              }
              
              if (message) {
                self.clients.matchAll().then(clients => {
                  clients.forEach(client => {
                    client.postMessage({
                      type: 'CACHE_UPDATED',
                      message: message
                    });
                  });
                });
              }
            });

          return response;
        })
        .catch(() => {
          // Network failed - try cache
          console.log('[Service Worker] Network failed, trying cache:', event.request.url);
          return caches.match(event.request).then(cached => {
            if (cached) {
              return cached;
            }
            // If navigation request, show offline page
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_URL);
            }
            // Otherwise return error
            return new Response('Network error', { status: 503 });
          });
        })
    );
  } else {
    // Cache-first strategy for static assets (HTML, CSS, JS, images)
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          // Return cached response if found
          if (cachedResponse) {
            console.log('[Service Worker] Returning from cache:', event.request.url);
            return cachedResponse;
          }

          // Fetch from network
          return fetch(event.request)
            .then((response) => {
              // Check if valid response
              if (!response || response.status !== 200) {
                return response;
              }
              
              // Cache same-origin resources
              if (url.origin === self.location.origin) {
                const responseToCache = response.clone();

                caches.open(CACHE_NAME)
                  .then((cache) => {
                    cache.put(event.request, responseToCache);
                    console.log('[Service Worker] Cached new resource:', event.request.url);
                  });
              }

              return response;
            })
            .catch(() => {
              // Network failed - return offline page for navigation
              if (event.request.mode === 'navigate') {
                return caches.match(OFFLINE_URL);
              }
            });
        })
    );
  }
});

// Background sync để cache game assets
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(CACHE_NAME)
        .then((cache) => {
          return cache.addAll(event.data.urls);
        })
    );
  }
});

// Handle offline/online status
self.addEventListener('online', () => {
  console.log('[Service Worker] Back online');
});

self.addEventListener('offline', () => {
  console.log('[Service Worker] Gone offline');
});
