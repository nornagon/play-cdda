const CURRENT_CACHES = {
  'harness': 'harness-v1',
  'game-data': 'game-data-v1',
  'github-api': 'github-api-v1',
};

// Skip the waiting phase, so the new service worker activates immediately.
self.addEventListener('install', function(event) {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CURRENT_CACHES['harness']).then((cache) => {
      return cache.addAll([
        '/',
        '/favicon.ico',
        "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.2.1/css/all.min.css",
        "https://cdnjs.cloudflare.com/ajax/libs/screenfull.js/5.2.0/screenfull.min.js",
        "https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js",
        "https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.0/FileSaver.min.js",
      ]);
    })
  );
});

self.addEventListener('activate', function(event) {
  const expectedCacheNames = Object.values(CURRENT_CACHES);

  event.waitUntil(clients.claim())

  event.waitUntil(
    caches.keys().then((cacheNames) => Promise.all(
      cacheNames.map((cacheName) => expectedCacheNames.includes(cacheName) ? null : caches.delete(cacheName))
    ))
  );
});

self.addEventListener('fetch', function(event) {
  if (event.request.url.startsWith('https://raw.githubusercontent.com/')) {
    event.respondWith(
      caches.open(CURRENT_CACHES['game-data'])
        .then(async (cache) => {
          // Game data never changes. If we have it in the cache, it's good.
          const cachedResponse = await cache.match(event.request);
          if (cachedResponse) {
            return cachedResponse;
          }

          const response = await fetch(event.request.clone());
          if (response.status < 400 && event.request.url.startsWith('https://raw.githubusercontent.com/')) {
            cache.put(event.request, response.clone());
            // Cap the cache at 30. Each version has 3 files, so this is 10
            // versions. Each version is about 100 MB, so this is about 1 GB.
            (async () => {
              const keys = await cache.keys();
              while (keys.length > 30) {
                // Delete the oldest ones first. This isn't a super smart
                // strategy; ideally we'd do something like LRU + don't delete
                // stables, and additionally only delete "whole" versions. But
                // it's enough to stop the disk from filling up indefinitely :)
                await cache.delete(keys.shift());
              }
            })()
          }

          return response;
        })
        .catch(function(error) {
          console.error('Request failed:', error);

          throw error;
        })
    );
  } else if (event.request.url.startsWith('https://api.github.com/')) {
    // Network-First for GitHub API requests.
    event.respondWith(
      caches.open(CURRENT_CACHES['github-api']).then(async (cache) => {
        return fetch(event.request.clone()).then((response) => {
          if (response.status < 400) {
            cache.put(event.request, response.clone());
          }
          return response;
        }).catch(() => cache.match(event.request));
      })
    );
  } else {
    // Stale-While-Revalidate for everything else, to support offline play.
    event.respondWith(caches.open(CURRENT_CACHES['harness']).then(async (cache) => {
      const cachedResponse = await cache.match(event.request);
      const fetchedResponse = fetch(event.request).then((networkResponse) => {
        cache.put(event.request, networkResponse.clone());

        return networkResponse;
      });
      return cachedResponse || fetchedResponse;
    }));
  }
});
