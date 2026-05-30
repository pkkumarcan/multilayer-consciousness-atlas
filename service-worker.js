const CACHE_NAME = 'realms-atlas-cache-v2';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './styles.css',
  './main.js',
  './ui.js',
  './state.js',
  './audio.js',
  './energy.js',
  './graph.js',
  './search.js',
  './manifest.json',
  './assets/images/icon_192.png',
  './assets/images/icon_512.png',
  './assets/images/cosmic-map.png',
  './content/floors_db.json',
  './content/content_graph.json'
];

// Install Event - Pre-caches static app shell and core databases
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('[Service Worker] Caching core app shell and datasets...');
        return cache.addAll(ASSETS_TO_CACHE);
      })
      .then(() => self.skipWaiting())
  );
});

// Activate Event - Sweeps and clears previous version caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Evicting outdated cache version:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event - Dynamic Stale-While-Revalidate and demand-first image/audio caching
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Serve static assets and external standard packages (like Three.js CDN) via cache check
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          // Serves from cache immediately for speed, then asynchronously checks for updates
          fetch(event.request)
            .then(networkResponse => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse));
              }
            })
            .catch(() => {/* Ignore background sync failures offline */});
          return cachedResponse;
        }

        // Catch non-cached assets, caching high-res paintings on-demand dynamically
        return fetch(event.request).then(networkResponse => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }

          // Cache floor artwork and synthesized audio sources dynamically on demand to optimize initial app footprint
          const isPng = url.pathname.endsWith('.png');
          const isAudio = url.pathname.endsWith('.mp3') || url.pathname.endsWith('.wav') || url.pathname.includes('audio');
          
          if (isPng || isAudio) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }

          return networkResponse;
        });
      })
      .catch(() => {
        // Fallback for offline mode if asset is not present
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      })
  );
});
