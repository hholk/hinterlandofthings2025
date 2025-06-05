const CACHE_NAME = 'hlt2025-cache-v2';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './marked.min.js',
  './manifest.webmanifest',
  './timeslots.json',
  './md-files.json',
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
  event.respondWith(
    caches.match(event.request).then(resp => resp || fetch(event.request))
  );
});
