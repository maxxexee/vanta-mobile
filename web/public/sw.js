// Web Push only. There is deliberately no fetch handler: the app manages its
// own assets, and a cache here would pin the boot document to an old build.

self.addEventListener('push', (event) => {
  let payload = {};
  try {
    payload = event.data ? event.data.json() : {};
  } catch {
    payload = {};
  }
  const title = typeof payload.title === 'string' ? payload.title : 'Vanta';
  const body = typeof payload.body === 'string' ? payload.body : 'You have an update.';
  event.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: './assets/icon-192.png',
      badge: './assets/icon-192.png',
      data: { url: typeof payload.url === 'string' ? payload.url : './' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of clients) {
        if ('focus' in client) return client.focus();
      }
      return self.clients.openWindow(event.notification.data?.url || './');
    })(),
  );
});
