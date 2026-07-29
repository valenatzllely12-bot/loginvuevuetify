// Scripts for firebase and firebase messaging
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in your messaging config
const firebaseConfig = {
  apiKey: 'AIzaSyApLV1LzftaypzeFpLIyDkuiHJ-Fzu9W50',
  authDomain: 'login-d7825.firebaseapp.com',
  projectId: 'login-d7825',
  storageBucket: 'login-d7825.firebasestorage.app',
  messagingSenderId: '813199889787',
  appId: '1:813199889787:web:54a7d34b325908cd9959de',
  measurementId: 'G-N4KT3SZLM4',
};

firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || 'Nueva Notificación';
  const notificationOptions = {
    body: payload.notification?.body || 'Tienes un nuevo mensaje',
    icon: payload.notification?.icon || '/img/icons/icon-192x192.svg',
    badge: '/img/icons/icon-192x192.svg',
    tag: 'firebase-notification',
    requireInteraction: true,
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
      ...payload.data,
    },
    actions: [
      {
        action: 'open',
        title: 'Abrir',
        icon: '/img/icons/icon-192x192.svg',
      },
      {
        action: 'close',
        title: 'Cerrar',
        icon: '/img/icons/icon-192x192.svg',
      },
    ],
  };

  console.log('[firebase-messaging-sw.js] Attempting to show notification:', notificationTitle, notificationOptions);
  
  self.registration.showNotification(notificationTitle, notificationOptions).catch((error) => {
    console.error('[firebase-messaging-sw.js] Error showing notification:', error);
  });
});

// Handle notification clicks
self.addEventListener('notificationclick', function (event) {
  console.log('[firebase-messaging-sw.js] Notification clicked:', event.notification.tag);
  event.notification.close();

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      clients
        .matchAll({
          type: 'window',
          includeUncontrolled: true,
        })
        .then((clientList) => {
          for (let client of clientList) {
            if (client.url === '/' && 'focus' in client) {
              return client.focus();
            }
          }
          if (clients.openWindow) {
            return clients.openWindow('/');
          }
        })
    );
  }
});

// Handle notification close
self.addEventListener('notificationclose', function (event) {
  console.log('[firebase-messaging-sw.js] Notification closed:', event.notification.tag);
});

// Handle service worker installation - cache key resources
self.addEventListener('install', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker installing...');
  self.skipWaiting();
});

// Handle service worker activation - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[firebase-messaging-sw.js] Service Worker activated');
  
  // Clean old caches
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((cacheName) => {
            // Keep only recent caches
            const recentCaches = [
              'google-fonts-cache',
              'gstatic-fonts-cache',
              'static-resources-cache',
              'images-cache',
              'mdi-icons-cache',
              'firebase-firestore-cache',
              'firebase-auth-cache',
              'firebase-fcm-cache',
              'html-cache',
              'fonts-cache',
              'default-cache',
            ];
            return !recentCaches.includes(cacheName);
          })
          .map((cacheName) => {
            console.log('[firebase-messaging-sw.js] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          })
      );
    })
  );
  
  event.waitUntil(clients.claim());
});

// Broadcast update notifications to all clients
const broadcastUpdateToClients = (message) => {
  clients.matchAll().then((clientList) => {
    clientList.forEach((client) => {
      client.postMessage(message);
    });
  });
};

// Listen for messages from clients
self.addEventListener('message', (event) => {
  console.log('[firebase-messaging-sw.js] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

