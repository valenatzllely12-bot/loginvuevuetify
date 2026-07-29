/// <reference lib="webworker" />
declare const self: ServiceWorkerGlobalScope

// Scripts para Firebase (se cargan como importScripts en el script)
// importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js')
// importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js')

let messaging: any = null
let firebaseInitialized = false

// Cargar Firebase
const loadFirebase = () => {
  if (firebaseInitialized || typeof importScripts === 'undefined') return

  try {
    // @ts-ignore
    importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js')
    // @ts-ignore
    importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js')

    const firebaseConfig = {
      apiKey: 'AIzaSyApLV1LzftaypzeFpLIyDkuiHJ-Fzu9W50',
      authDomain: 'login-d7825.firebaseapp.com',
      projectId: 'login-d7825',
      storageBucket: 'login-d7825.firebasestorage.app',
      messagingSenderId: '813199889787',
      appId: '1:813199889787:web:54a7d34b325908cd9959de',
      measurementId: 'G-N4KT3SZLM4',
    }

    // @ts-ignore
    if (!firebase.apps.length) {
      // @ts-ignore
      firebase.initializeApp(firebaseConfig)
    }
    // @ts-ignore
    messaging = firebase.messaging()
    firebaseInitialized = true

    console.log('[Service Worker] Firebase initialized successfully')
  } catch (error) {
    console.error('[Service Worker] Error initializing Firebase:', error)
  }
}

// Mensaje de fondo de Firebase Cloud Messaging
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  // Permitir que el cliente controle el service worker
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }

  // Cargar Firebase cuando se recibe un mensaje
  if (!firebaseInitialized) {
    loadFirebase()
  }
})

// Escuchar mensajes en background
self.addEventListener('push', (event: PushEvent) => {
  console.log('[Service Worker] Push event received:', event)

  if (!event.data) return

  let notificationData = {
    title: 'Nueva Notificación',
    options: {
      body: 'Tienes un nuevo mensaje',
      icon: '/img/icons/icon-192x192.svg',
      badge: '/img/icons/icon-192x192.svg',
      tag: 'notification',
      data: {} as Record<string, any>,
    },
  }

  try {
    const payload = event.data.json()
    if (payload.notification) {
      notificationData.title = payload.notification.title || notificationData.title
      notificationData.options.body = payload.notification.body || notificationData.options.body
      notificationData.options.data = payload.data || {}
    }
  } catch (error) {
    console.error('[Service Worker] Error parsing push data:', error)
  }

  event.waitUntil(
    self.registration.showNotification(notificationData.title, notificationData.options as NotificationOptions)
  )
})

// Manejo de clicks en notificaciones
self.addEventListener('notificationclick', (event: NotificationEvent) => {
  console.log('[Service Worker] Notification clicked:', event.notification)
  event.notification.close()

  event.waitUntil(
    clients
      .matchAll({
        type: 'window',
        includeUncontrolled: true,
      })
      .then((clientList) => {
        // Buscar una ventana existente
        for (const client of clientList) {
          if (client.url === '/' && 'focus' in client) {
            return (client as any).focus()
          }
        }
        // Si no hay ventana, abrir una
        if (clients.openWindow) {
          return clients.openWindow('/')
        }
      })
  )
})

// Instalación del service worker
self.addEventListener('install', (event: ExtendableEvent) => {
  console.log('[Service Worker] Installing...')
  self.skipWaiting()
})

// Activación del service worker
self.addEventListener('activate', (event: ExtendableEvent) => {
  console.log('[Service Worker] Activating...')

  // Limpiar caches antiguas
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          // Mantener solo caches recientes (más de 7 días)
          const allowedCaches = [
            'google-fonts-cache',
            'gstatic-fonts-cache',
            'static-resources-cache',
            'images-cache',
            'mdi-icons-cache',
            'firebase-firestore-cache',
            'firebase-auth-cache',
            'firebase-fcm-cache',
            'html-cache',
          ]

          if (!allowedCaches.includes(cacheName)) {
            console.log('[Service Worker] Deleting old cache:', cacheName)
            return caches.delete(cacheName)
          }
          return Promise.resolve()
        })
      )
    })
  )

  self.clients.claim()
})

// Manejo de fetch con mantenimiento de conexión offline
self.addEventListener('fetch', (event: FetchEvent) => {
  const { request } = event

  // No cachear requests de Firefox ni Chrome DevTools
  if (request.cache === 'only-if-cached' && request.mode !== 'same-origin') {
    return
  }

  // Para POST/PUT/DELETE, usar network-first
  if (request.method !== 'GET') {
    event.respondWith(
      fetch(request).catch(() => {
        return new Response(
          JSON.stringify({
            error: 'Network error. Cannot complete offline.',
            offline: true,
          }),
          {
            status: 503,
            statusText: 'Service Unavailable',
            headers: new Headers({
              'Content-Type': 'application/json',
            }),
          }
        )
      })
    )
    return
  }

  // Para GET, usar estrategias específicas por tipo de recurso
  const url = new URL(request.url)

  // Recursos estáticos (JS, CSS): cache-first
  if (/\.(js|css)$/.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then((response) => {
        return (
          response ||
          fetch(request).then((response) => {
            // Cachear respuesta exitosa
            if (response && response.status === 200) {
              const responseToCache = response.clone()
              caches.open('static-resources-cache').then((cache) => {
                cache.put(request, responseToCache)
              })
            }
            return response
          })
        )
      })
    )
    return
  }

  // Imágenes y fuentes: cache-first
  if (/\.(png|jpg|jpeg|svg|gif|webp|ico|woff|woff2|ttf|eot|otf)$/i.test(url.pathname)) {
    event.respondWith(
      caches.match(request).then((response) => {
        return (
          response ||
          fetch(request).then((response) => {
            if (response && response.status === 200) {
              const responseToCache = response.clone()
              const cacheName = /\.(woff|woff2|ttf|eot|otf)$/.test(url.pathname)
                ? 'fonts-cache'
                : 'images-cache'
              caches.open(cacheName).then((cache) => {
                cache.put(request, responseToCache)
              })
            }
            return response
          })
        )
      })
    )
    return
  }

  // APIs externas (Firebase, Google Fonts): network-first con timeout
  if (
    url.origin.includes('googleapis.com') ||
    url.origin.includes('firebase') ||
    url.origin.includes('gstatic.com')
  ) {
    event.respondWith(
      Promise.race([
        fetch(request),
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve(
                caches.match(request).then((response) => {
                  return (
                    response ||
                    new Response(
                      JSON.stringify({
                        error: 'Network timeout',
                        offline: true,
                      }),
                      {
                        status: 503,
                        statusText: 'Service Unavailable',
                        headers: new Headers({
                          'Content-Type': 'application/json',
                        }),
                      }
                    )
                  )
                })
              ),
            5000
          )
        ),
      ]).catch((error) => {
        console.error('[Service Worker] Fetch error:', error)
        return (
          caches.match(request) ||
          new Response(
            JSON.stringify({
              error: 'Network error',
              offline: true,
            }),
            {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'application/json',
              }),
            }
          )
        )
      })
    )
    return
  }

  // HTML: network-first
  if (request.mode === 'navigate' || /\.html$/.test(url.pathname)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response && response.status === 200) {
            const responseToCache = response.clone()
            caches.open('html-cache').then((cache) => {
              cache.put(request, responseToCache)
            })
          }
          return response
        })
        .catch(() => {
          return (
            caches.match(request) ||
            caches.match('index.html') ||
            new Response(
              '<!DOCTYPE html><html><head><title>Offline</title></head><body><h1>Sin conexión</h1><p>No se puede cargar la página. Intenta nuevamente cuando estés en línea.</p></body></html>',
              {
                status: 503,
                statusText: 'Service Unavailable',
                headers: new Headers({
                  'Content-Type': 'text/html',
                }),
              }
            )
          )
        })
    )
    return
  }

  // Estrategia por defecto: cache-first con fallback a network
  event.respondWith(
    caches.match(request).then((response) => {
      return (
        response ||
        fetch(request).then((response) => {
          if (response && response.status === 200) {
            const responseToCache = response.clone()
            caches.open('default-cache').then((cache) => {
              cache.put(request, responseToCache)
            })
          }
          return response
        })
      )
    })
  )
})

// Notificar al cliente cuando hay una actualización disponible
self.addEventListener('controllerchange', () => {
  console.log('[Service Worker] Controller changed - update available')
})
