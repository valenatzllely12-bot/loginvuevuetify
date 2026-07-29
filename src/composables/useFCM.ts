import { ref, onMounted } from 'vue'
import { messaging } from '@/config/firebase'
import { onMessage, getToken } from 'firebase/messaging'

// Estado para notificaciones
export const notifications = ref<{
  id: string
  title: string
  message: string
  timestamp: Date
  read: boolean
}[]>([])

export const fcmToken = ref<string>('')
export const notificationPermission = ref<NotificationPermission>('default')

// Composable useFCM
export const useFCM = () => {
  // Registrar Service Worker
  const registerServiceWorker = async () => {
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
          scope: '/',
        })
        console.log('Service Worker registered successfully:', registration)
        return registration
      }
    } catch (error) {
      console.error('Service Worker registration failed:', error)
    }
  }

  // Solicitar permiso de notificaciones
  const requestNotificationPermission = async () => {
    try {
      const permission = await Notification.requestPermission()
      notificationPermission.value = permission

      if (permission === 'granted') {
        console.log('Notification permission granted')
        // Obtener token FCM después de solicitar permiso
        await getFCMToken()
      }
    } catch (error) {
      console.error('Error requesting notification permission:', error)
    }
  }

  // Obtener token FCM
  const getFCMToken = async () => {
    try {
      // IMPORTANT: Reemplaza esto con tu VAPID key de Firebase Console
      const VAPID_KEY = 'BKj5w5SbDNwN1TlkS7wsqUJCWbSfp_MW-UZESVxD_wvJYjEvP15cGtriCUw8dr5yzlUzO3q0Fo4VKZsXZMhYU4c' // Esto se configurará en Firebase Console

      // Si aún no tienes la VAPID key, por ahora lo dejamos así
      // El token se generará cuando configures la VAPID key

      const token = await getToken(messaging, {
        vapidKey: VAPID_KEY,
      })

      if (token) {
        fcmToken.value = token
        console.log('FCM Token:', token)
        // Aquí puedes guardar el token en tu base de datos
        await saveFCMTokenToDatabase(token)
        return token
      }
    } catch (error) {
      console.error('Error getting FCM token:', error)
    }
  }

  // Guardar token en Firestore
  const saveFCMTokenToDatabase = async (token: string) => {
    try {
      // Esta función se implementará en tu lógica de base de datos
      // Por ahora la dejamos como placeholder
      console.log('Saving FCM token to database:', token)
      // Ejemplo: enviar a tu servidor/base de datos
    } catch (error) {
      console.error('Error saving FCM token:', error)
    }
  }

  // Manejar mensajes en foreground
  const setupForegroundMessageHandler = () => {
    onMessage(messaging, (payload) => {
      console.log('Message received in foreground:', payload)

      const notification = {
        id: Date.now().toString(),
        title: payload.notification?.title || 'Nueva Notificación',
        message: payload.notification?.body || '',
        timestamp: new Date(),
        read: false,
      }

      notifications.value.unshift(notification)

      // Mostrar notificación visual en el navegador
      if ('Notification' in window && notificationPermission.value === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: payload.notification?.icon || '/firebase-logo.png',
          badge: '/firebase-logo.png',
          tag: 'fcm-notification',
        })
      }
    })
  }

  // Marcar notificación como leída
  const markAsRead = (notificationId: string) => {
    const notification = notifications.value.find((n) => n.id === notificationId)
    if (notification) {
      notification.read = true
    }
  }

  // Limpiar notificaciones
  const clearNotifications = () => {
    notifications.value = []
  }

  // Eliminar una notificación
  const deleteNotification = (notificationId: string) => {
    notifications.value = notifications.value.filter((n) => n.id !== notificationId)
  }

  // Inicializar FCM
  const initializeFCM = async () => {
    try {
      // Registrar Service Worker
      await registerServiceWorker()

      // Solicitar permiso
      if (Notification.permission === 'default') {
        await requestNotificationPermission()
      } else if (Notification.permission === 'granted') {
        await getFCMToken()
      }

      // Configurar manejador de mensajes en foreground
      setupForegroundMessageHandler()
    } catch (error) {
      console.error('Error initializing FCM:', error)
    }
  }

  // Ejecutar inicialización cuando el componente se monta
  onMounted(() => {
    initializeFCM()
  })

  return {
    notifications,
    fcmToken,
    notificationPermission,
    requestNotificationPermission,
    getFCMToken,
    markAsRead,
    clearNotifications,
    deleteNotification,
    initializeFCM,
  }
}
