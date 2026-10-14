/* DexBinder service worker — offline app shell.
 *
 * Generated at build time from build/service-worker.js: the build replaces
 * the two placeholders with the hashed file list and a version derived from it.
 *
 * What it does:
 *  - Precaches the app shell (index.html, JS, CSS, manifest, icons) so the
 *    installed app opens without a connection.
 *  - Page loads are network-first (fresh deploys show up right away) and fall
 *    back to the cached shell when offline or on a very slow connection.
 *  - Card images are cross-origin (Scrydex) and are NOT cached here; the
 *    browser's normal HTTP cache handles them, within the host's own rules.
 */
const VERSION = '__CACHE_VERSION__';
const CACHE = `dexbinder-shell-${VERSION}`;
const PRECACHE = '__PRECACHE_MANIFEST__';
const NAVIGATION_TIMEOUT_MS = 4000;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('dexbinder-shell-') && key !== CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

function timeout(ms) {
  return new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms));
}

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  // Only handle our own files. Card images and other hosts go straight to the network.
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    const network = fetch(request);
    network.catch(() => {}); // handled below; avoid an unhandled rejection
    event.respondWith(
      Promise.race([network, timeout(NAVIGATION_TIMEOUT_MS)]).catch(() =>
        // Offline or slow: serve the cached shell, or keep waiting on the network
        // if this is the very first visit and nothing is cached yet.
        caches.match('index.html').then((cached) => cached || network),
      ),
    );
    return;
  }

  // Hashed build assets and icons never change for a given URL: cache first.
  event.respondWith(caches.match(request).then((cached) => cached || fetch(request)));
});
