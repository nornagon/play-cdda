const RELEASE_CACHE_PREFIX = 'game-data-release-v2-';
const MAX_CACHED_RELEASES = 5;

const CURRENT_CACHES = {
  'harness': 'harness-v5',
  'shared-game-data': 'shared-game-data-v3',
  'release-metadata': 'release-metadata-v2',
  'github-api': 'github-api-v1',
};

function isChannelManifestRequest(request) {
  const url = new URL(request.url);
  return url.origin === 'https://raw.githubusercontent.com' &&
    url.pathname === '/nornagon/play-cdda/data/channels.json';
}

async function getChannelManifestResponse(request) {
  const cache = await caches.open(CURRENT_CACHES['shared-game-data']);
  try {
    const response = await fetch(request.clone());
    if (response.status < 400) {
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await cache.match(request);
    if (cached) return cached;
    throw error;
  }
}

function releaseForRequest(request) {
  const url = new URL(request.url);
  const prefix = '/nornagon/play-cdda/data/v/';
  if (url.origin !== 'https://raw.githubusercontent.com' || !url.pathname.startsWith(prefix)) {
    return null;
  }

  return decodeURIComponent(url.pathname.slice(prefix.length).split('/')[0]);
}

function cacheNameForRelease(release) {
  return `${RELEASE_CACHE_PREFIX}${release}`;
}

function metadataRequestForRelease(release) {
  return new Request(new URL(`__cached-release__/${encodeURIComponent(release)}`, self.registration.scope));
}

async function touchReleaseAndEvictOldReleases(release) {
  const metadata = await caches.open(CURRENT_CACHES['release-metadata']);
  await metadata.put(
    metadataRequestForRelease(release),
    new Response(String(Date.now())),
  );

  const entries = await Promise.all((await metadata.keys()).map(async (request) => {
    const response = await metadata.match(request);
    const encodedRelease = new URL(request.url).pathname.split('/').pop();
    return {
      request,
      release: decodeURIComponent(encodedRelease),
      lastUsed: Number(await response.text()),
    };
  }));

  entries.sort((a, b) => b.lastUsed - a.lastUsed);
  await Promise.all(entries.slice(MAX_CACHED_RELEASES).map(async (entry) => {
    await caches.delete(cacheNameForRelease(entry.release));
    await metadata.delete(entry.request);
  }));
}

function withCorrectContentType(response, request) {
  const pathname = new URL(request.url).pathname;
  let contentType = null;
  if (pathname.endsWith('.wasm')) {
    contentType = 'application/wasm';
  } else if (pathname.endsWith('.js') || pathname.endsWith('.mjs')) {
    contentType = 'application/javascript';
  }

  if (!contentType) {
    return response;
  }

  const headers = new Headers(response.headers);
  headers.set('Content-Type', contentType);
  return new Response(response.body, {
    headers,
    status: response.status,
    statusText: response.statusText,
  });
}

async function getGameDataResponse(request) {
  const release = releaseForRequest(request);
  const cacheName = release
    ? cacheNameForRelease(release)
    : CURRENT_CACHES['shared-game-data'];
  const cache = await caches.open(cacheName);
  const cachedResponse = await cache.match(request);
  if (cachedResponse) {
    return {
      response: cachedResponse,
      cacheWork: release ? touchReleaseAndEvictOldReleases(release) : Promise.resolve(),
    };
  }

  let response = await fetch(request.clone());
  if (response.status < 400) {
    response = withCorrectContentType(response, request);
    const cacheWork = cache.put(request, response.clone()).then(() => (
      release ? touchReleaseAndEvictOldReleases(release) : undefined
    ));
    return { response, cacheWork };
  }

  return { response, cacheWork: Promise.resolve() };
}

// Skip the waiting phase, so the new service worker activates immediately.
self.addEventListener('install', function(event) {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CURRENT_CACHES['harness']).then((cache) => {
      return cache.addAll([
        './',
        './favicon.ico',
        'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.2.1/css/all.min.css',
        'https://cdnjs.cloudflare.com/ajax/libs/screenfull.js/5.2.0/screenfull.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js',
        'https://cdnjs.cloudflare.com/ajax/libs/FileSaver.js/2.0.0/FileSaver.min.js',
      ]);
    })
  );
});

self.addEventListener('activate', function(event) {
  const expectedCacheNames = Object.values(CURRENT_CACHES);

  event.waitUntil(clients.claim());

  event.waitUntil(
    caches.keys().then((cacheNames) => Promise.all(
      cacheNames.map((cacheName) => (
        expectedCacheNames.includes(cacheName) || cacheName.startsWith(RELEASE_CACHE_PREFIX)
          ? null
          : caches.delete(cacheName)
      ))
    ))
  );
});

self.addEventListener('fetch', function(event) {
  if (isChannelManifestRequest(event.request)) {
    event.respondWith(getChannelManifestResponse(event.request));
  } else if (event.request.url.startsWith('https://raw.githubusercontent.com/')) {
    const responsePromise = getGameDataResponse(event.request);
    event.respondWith(
      responsePromise
        .then((result) => result.response)
        .catch(function(error) {
          console.error('Request failed:', error);
          throw error;
        })
    );
    event.waitUntil(
      responsePromise
        .then((result) => result.cacheWork)
        .catch((error) => console.error('Caching failed:', error))
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
