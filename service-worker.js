// Für Anfänger:innen: Sobald wir neue Seiten hinzufügen, sollten wir die Cache-
// Version erhöhen. So laden Browser garantiert die frischeste Konfiguration
// (z.B. mit neuen Gutscheinen) und wir umgehen hartnäckige GitHub-Pages-Caches.
const CACHE_VERSION = 'v3';
const CACHE_NAME = `hlt2025-cache-${CACHE_VERSION}`;
const ASSETS = [
  './',
  './hinterland.html',
  './style.css',
  './app.js',
  './marked.min.js',
  './manifest.webmanifest',
  './timeslots.json',
  './md-files.json',
  './experience-pages.js',
  './experience-ui.js',
  './voucher-henri.html',
  './voucher-henri-planetarium.html',
];
// include all markdown files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.all([
        fetch('./timeslots.json').then(r => r.json()),
        fetch('./md-files.json').then(r => r.json()),
      ]).then(([slots, mdFiles]) => {
        const slotFiles = slots.map(s => './timeslots/' + s.file);
        const mdPaths = mdFiles.map(f => './' + f);
        return cache.addAll(ASSETS.concat(slotFiles, mdPaths));
      });
    })
  );
});
self.addEventListener('fetch', event => {
  // Only handle GET requests; allow other methods like POST to pass through
  if (event.request.method !== 'GET') {
    return;
  }
  event.respondWith(
    caches.match(event.request).then(resp => resp || fetch(event.request))
  );
});
