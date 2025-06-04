const CACHE_NAME = 'hlt2025-cache-v1';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './manifest.webmanifest',
  './timeslots.json',
];
// include all markdown files
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return fetch('./timeslots.json')
        .then(res => res.json())
        .then(list => {
          const files = list.map(s => './timeslots/' + s.file);
          return cache.addAll(ASSETS.concat(files));
        });
    })
  );
});
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(resp => resp || fetch(event.request))
  );
});
