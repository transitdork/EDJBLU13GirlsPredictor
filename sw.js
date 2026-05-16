// ─────────────────────────────────────────────────────────────────────────────
// EDJBA U13 Girls Match Predictor — Service Worker
//
// HOW TO PUSH AN UPDATE:
//   1. Upload your new index.html to GitHub
//   2. Change the version number below  (e.g. 'v3' → 'v4')
//   3. Commit & push sw.js
//   The app will detect the change and update automatically on next open.
// ─────────────────────────────────────────────────────────────────────────────

const CACHE_VERSION = 'v4';   // ← CHANGE THIS each time you push a new version
const CACHE_NAME    = `edjba-predictor-${CACHE_VERSION}`;

// Files to cache on install
const PRECACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
];

// ── Install: cache core files ─────────────────────────────────────────────────
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())   // Activate new SW immediately
  );
});

// ── Activate: delete old caches ───────────────────────────────────────────────
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())  // Take control of all open tabs
  );
});

// ── Fetch: cache-first with network fallback ──────────────────────────────────
self.addEventListener('fetch', event => {
  // Only handle GET requests for same-origin resources
  if (event.request.method !== 'GET') return;

  event.respondWith(
    caches.match(event.request)
      .then(cached => {
        // Return cached version immediately, but also fetch fresh in background
        const networkFetch = fetch(event.request)
          .then(response => {
            if (response.ok) {
              const clone = response.clone();
              caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
            }
            return response;
          })
          .catch(() => cached); // If network fails, cached is already returned

        return cached || networkFetch;
      })
  );
});

// ── Message: allow the page to trigger SW activation ─────────────────────────
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
