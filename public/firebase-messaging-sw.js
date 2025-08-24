// Use compat SDK for background notifications (works better in SW)
importScripts('https://www.gstatic.com/firebasejs/9.6.11/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.11/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyD4M_ZOMqR9MtSkbgH2SQQvj2QSAFKLOhU",
  authDomain: "beehive-d31e3.firebaseapp.com",
  projectId: "beehive-d31e3",
  storageBucket: "beehive-d31e3.firebasestorage.app",
  messagingSenderId: "412298384436",
  appId: "1:412298384436:web:469569b024f27482456661"
});

const messaging = firebase.messaging();

// Handle background FCM messages
messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background message:', payload);

  const title = payload.notification?.title || 'Beehive Alert 🚨';
  const options = {
    body: payload.notification?.body || payload.data?.message || 'Check your hive conditions',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    tag: 'beehive-alert',
    requireInteraction: true,
    data: payload.data,
    actions: [
      { action: 'view', title: 'View Dashboard' },
      { action: 'dismiss', title: 'Dismiss' }
    ]
  };

  return self.registration.showNotification(title, options);
});

// Handle clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    (async () => {
      if (event.action === 'view') {
        const allClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
        for (const client of allClients) {
          if (client.url.includes('/') && 'focus' in client) {
            return client.focus();
          }
        }
        return clients.openWindow('/');
      }
    })()
  );
});