// Minimal service worker: only so reminders can be shown on Android (src/lib/notify.ts). No caching, no fetch handler.
self.addEventListener('notificationclick', (e) => {
  e.notification.close()
  e.waitUntil(self.clients.openWindow('/#/moje'))
})
