// Service Worker cho PWA Minigame Collection
// Version và cache names (format: yyyymmddHHMM)
// UPDATED: Phaser now local, 100% offline-capable!
const CACHE_VERSION = '202601250758';
const CACHE_NAME = `minigame-pwa-${CACHE_VERSION}`;
const OFFLINE_URL = './offline.html';

// Files cần cache ngay khi install
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './offline.html',
  './css/style.css',
  './js/app.js',
  './js/debug.js',                    // DEBUG console for iPad
  './js/quiz.js',                     // Quiz module (FIXED: was missing!)
  './manifest.json',
  './games/number-game.js',
  './games/karate.js',
  './vendor/phaser.esm.js',           // LOCAL Phaser (offline-capable!)
  './images/game/car.png',
  './images/game/karateman.png',      // FIXED: correct filename
  // All icons for iOS PWA install
  './images/icons/icon-72x72.png',
  './images/icons/icon-96x96.png',
  './images/icons/icon-128x128.png',
  './images/icons/icon-144x144.png',
  './images/icons/icon-152x152.png',
  './images/icons/icon-192x192.png',
  './images/icons/icon-384x384.png',
  './images/icons/icon-512x512.png'
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

// Fetch event - Offline-first strategy (Phaser now local, no CDN!)
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // All same-origin requests
  const isSameOrigin = url.origin === self.location.origin;
  
  // Determine if this is a game file
  const isGameOrCDN = url.pathname.includes('/games/');

  // Offline-first strategy for same-origin (everything is local now!)
  if (isSameOrigin) {
    event.respondWith(
      caches.match(event.request)
        .then((cachedResponse) => {
          // Return cached immediately if available
          if (cachedResponse) {
            console.log('[SW] Cache hit:', url.pathname);
            
            // Background update for game files (stale-while-revalidate)
            if (isGameOrCDN) {
              fetch(event.request).then(response => {
                if (response && response.status === 200) {
                  caches.open(CACHE_NAME).then(cache => {
                    cache.put(event.request, response);
                    console.log('[SW] Background updated:', url.pathname);
                  });
                }
              }).catch(() => {}); // Silent fail
            }
            
            return cachedResponse;
          }
          
          // No cache - fetch from network
          console.log('[SW] Cache miss, fetching:', url.pathname);
          return fetch(event.request)
            .then((response) => {
              if (!response || response.status !== 200) {
                return response;
              }
              
              // Cache the new resource
              const responseToCache = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(event.request, responseToCache);
                console.log('[SW] Cached:', url.pathname);
              });
              
              return response;
            })
            .catch((error) => {
              console.error('[SW] Fetch failed:', url.pathname, error);
              // Navigation request -> show offline page
              if (event.request.mode === 'navigate') {
                return caches.match(OFFLINE_URL);
              }
              return new Response('Network error', { status: 503 });
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
