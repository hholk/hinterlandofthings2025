self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('v1').then(cache => cache.addAll([
      '/',
      '/index.html',
      '/css/style.css',
      '/js/app.js',
      '/data/sample-session.md',
      '/data/startup-pitch.md',
      '/data/panel-discussion.md'
    ]))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => response || fetch(event.request))
  );
});
