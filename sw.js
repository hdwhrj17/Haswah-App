const CACHE_NAME = 'haswah-v3';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          return res;
        })
        .catch(() => caches.match(event.request))
    );
  }
});

self.addEventListener('notificationclick', (event) => {
  const targetPage = event.notification.data && event.notification.data.page ? event.notification.data.page : '';
  event.notification.close();
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if ('focus' in client) {
          client.focus();
          if (targetPage) client.postMessage({ type: 'NAV', page: targetPage });
          return;
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('./' + (targetPage ? '?page=' + encodeURIComponent(targetPage) : ''));
      }
    })
  );
});

self.addEventListener('push', (event) => {
  let data = { title: 'Haswah', body: 'Ada pembaruan pesanan baru!', page: 'antri' };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch (e) {
    if (event.data) data.body = event.data.text();
  }
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: './icon-192.png',
      badge: './icon-192.png',
      vibrate: [250, 100, 250, 100, 300],
      requireInteraction: true,
      data: { page: data.page || 'antri' }
    })
  );
});
